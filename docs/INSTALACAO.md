# Instalar o Rotamer na sua máquina

Para quem vai subir a própria instância: a TI de uma escola, um professor com um servidor, ou
quem quer experimentar sem depender de ninguém. O produto inteiro roda em dois containers — o
app e o Postgres — e os dados ficam num volume seu. A busca por nome e a verificação de composto
conhecido consultam o PubChem; o tutor Gemini e a telemetria Umami dependem de configuração.
A seção "Onde ficam os dados" detalha essas consultas.

## O que precisa

- **Docker** 24 ou mais novo, com o Compose v2 (`docker compose version` responde). No Windows e
  no Mac, o Docker Desktop; no Linux, o pacote `docker-ce` da distribuição.
- **2 GB de memória livre** para construir a imagem na primeira vez; para rodar, meio gigabyte
  basta. Cerca de 1 GB de disco para a imagem.
- **Uma porta livre** — 3000, por padrão.
- **Internet durante a construção**, para baixar as dependências e as fontes. Depois de pronta,
  o editor e os cálculos funcionam sem serviços externos; busca no PubChem, tutor e telemetria
  precisam de rede quando utilizados.
- Para uso fora da rede local, um **domínio** e um proxy com TLS (§ Proxy com TLS).

## Três comandos

Os exemplos deste guia usam **Bash**, disponível no Linux, macOS e no WSL do Windows.
Os scripts de backup e restauração também pedem Bash; não execute os redirecionamentos de
arquivos binários abaixo no Windows PowerShell.

```
git clone https://github.com/GabrielMello1407/Rotamer.git && cd Rotamer
cp .env.example .env          # abra o .env e troque POSTGRES_PASSWORD
docker compose up -d
```

Abra `http://localhost:3000`. O editor aparece sem cadastro; conta, turma e lista ficam no
`Entrar`, no canto da faixa de cima.

Na primeira vez o Docker **constrói** a imagem, o que leva de cinco a dez minutos. Nas seguintes,
sobe em segundos. Para acompanhar:

```
docker compose logs -f app
```

O que se espera ver, nesta ordem: `Prisma schema loaded`, a lista de migrações com
`No pending migrations to apply` (ou `Applying migration …` na primeira subida), e
`▲ Next.js … Ready`. Enquanto isso o Postgres já está de pé — o app só abre a porta depois de
aplicar as migrações.

**Sem construir.** A partir da primeira versão etiquetada, a imagem fica publicada em
`ghcr.io/gabrielmello1407/rotamer`, e `docker compose pull && docker compose up -d` dispensa a
construção. Enquanto ela não existir — o `ROADMAP.md` diz se já existe —, `docker compose pull`
responde `manifest unknown`, e `docker compose up -d` constrói na sua máquina, como acima.

**O que `up -d` faz.** Sobe o Postgres com o volume `rotamer-postgres`, espera ele responder,
sobe o app, aplica as migrações pendentes e abre a porta. Os dois containers reiniciam sozinhos
com a máquina (`restart: unless-stopped`).

## As variáveis

Ficam no `.env`, ao lado do `docker-compose.yml`. O arquivo não vai para o repositório.

| Variável | O que faz | Sem ela |
|---|---|---|
| `POSTGRES_PASSWORD` | senha do banco que o compose cria — só letras, números e hífen, porque ela entra numa URL | fica `rotamer`, que é a senha de desenvolvimento. **Troque antes da primeira subida**: ela é gravada no volume do banco, e mudar depois exige mudar no banco também (§ Quando algo dá errado) |
| `POSTGRES_USER`, `POSTGRES_DB` | usuário e nome do banco | ficam `rotamer` |
| `ROTAMER_PORT` | a porta da máquina em que o app aparece | 3000 |
| `GEMINI_API_KEY` | chave do Gemini para o **tutor**, usada só no servidor | o tutor se desliga e diz isso na tela: `O tutor está desligado neste ambiente. As dicas da missão continuam valendo`. Todo o resto funciona |
| `GEMINI_MODEL` | qual modelo do Gemini o tutor usa | o padrão do código, que é um apelido com reserva fixa. Quando o tutor calar de repente, é aqui que se olha — modelo do Gemini sai de circulação |
| `TUTOR_DAILY_LIMIT` | pedidos ao tutor por conta por dia | 30 |
| `UMAMI_SCRIPT_URL`, `UMAMI_WEBSITE_ID` | telemetria, opcional (§ Telemetria) | nenhum script de medição é carregado |

`DATABASE_URL` é montada pelo compose apontando para o serviço `postgres`; o compose lê o
`.env` sozinho e repassa ao app só as variáveis acima. `DATABASE_URL` só se escreve à mão quando
a imagem roda sem o compose (§ A imagem sozinha).

## O primeiro administrador

Ninguém se autodeclara professor: quem emite código de troca de senha pode tomar a conta de um
aluno. O papel vem de fora da tela do próprio interessado — é a decisão D-19, e vale em qualquer
instância.

**Você vai rodar um comando uma vez.** Depois disso, quem coordena a escola promove os professores
pela tela, e você não precisa mais do terminal para isso (D-29).

1. A pessoa que vai coordenar cria a conta em `/entrar`, **com o campo "escola ou instituição"
   preenchido**. Sem escola, ninguém emite código nem publica missão no catálogo.
2. Você roda, na máquina da instância:

   ```
   docker compose exec app node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II" --administrador
   ```

   A resposta são duas linhas — quem virou o que, e o que essa pessoa passa a poder fazer:

   ```
   Ana <ana@escola.br> agora é administrador na escola "EE Dom Pedro II".
   Administrador promove os professores da própria escola em /turmas, e só até professor.
   ```

   O `--escola` preenche o campo se estiver vazio, e o script recusa promover sem escola.
3. Na próxima página que ela abrir, `/turmas` mostra `Turmas que você dá`, a seção
   `Professores da escola` e o caminho para `/codigos`. Não precisa sair e entrar.

**Daí em diante é pela tela.** Em `Professores da escola`, a administradora digita o e-mail de quem
vai dar aula, **confere o nome** que aparece e confirma. Ela promove só até **professor**, e só contas
da **mesma escola, já preenchida nos dois lados** — a tela nunca escreve a escola de ninguém, porque
escrever esse campo é o mesmo que ampliar quem alcança aquela conta. Quem criou a conta sem preencher
a escola é promovido por aqui, com `--escola`.

**Outro administrador sai só daqui.** Não existe caminho pela tela para criar administrador, e é de
propósito: é o que impede uma conta invadida de se multiplicar e o que garante que você, com acesso
à máquina, sempre consiga recuperar a instância. Se a escola precisar de um segundo coordenador,
rode o comando de novo com o e-mail dele.

Para promover alguém direto a professor, sem passar por administrador, é o mesmo comando sem
`--administrador`. Para desfazer qualquer um dos dois, o mesmo comando com `--rebaixar`.

**O que o rebaixamento faz, pelo terminal ou pela tela.** A conta deixa de abrir turma, montar lista,
ver o quadro e emitir código de senha, e as missões que ela publicou **saem do catálogo** — revogar o
papel é a mitigação que esta instalação promete para conteúdo lido por menor de idade, e ela não vale
nada se o texto continuar público. As turmas e as listas ficam guardadas e voltam inteiras se a conta
for promovida de novo; as listas já publicadas continuam valendo para os alunos daquela turma.
E uma conta que já deu aula passa a **recuperar a senha só por aqui**, mesmo depois de rebaixada: sem
isso, rebaixar seria o primeiro passo para alguém da escola entrar na conta de um professor.

**Quem promoveu quem fica gravado.** Toda mudança de papel deixa uma linha com quem mudou, em quem,
de qual papel para qual e quando; mudança pelo terminal aparece sem autor, que é exatamente o que ela
é. Ao lado de cada nome, `Professores da escola` mostra a última promoção — quem a fez e quando, ou
"papel dado pelo terminal". O histórico completo fica no banco, na tabela `RoleChange`, e sai por SQL.

## Atualizar

Antes de atualizar, faça um backup (§ Backup). Depois:

```
git pull
docker compose up -d --build
```

Ou, com a imagem publicada, `docker compose pull && docker compose up -d`. As migrações
pendentes rodam na subida, antes de o app abrir a porta. Todas as migrações até hoje são
aditivas — criam tabela ou coluna, nunca apagam nem reescrevem dado.

**Voltar uma versão.** O código volta com `git checkout v0.2.0 && docker compose up -d --build`
(ou apontando `image:` para a etiqueta anterior). O banco não volta sozinho: para voltar o banco,
restaure o backup feito antes da atualização (§ Restaurar).

**O Postgres não muda de versão maior sozinho.** O compose fixa o Postgres 18 e o caminho dos
dados (`/var/lib/postgresql/18/docker`, dentro do volume). Subir para o 19, um dia, é um
`pg_upgrade` deliberado, com backup antes — nunca só trocar a etiqueta da imagem.

## Backup

O banco é o único estado. Um despejo diário, conferido, guardado **fora da máquina**:

```
docker compose exec -T postgres pg_dump -U rotamer -Fc rotamer > rotamer-$(date +%Y%m%dT%H%M).dump
docker compose exec -T postgres pg_restore --list < rotamer-<carimbo>.dump > /dev/null && echo "backup legível"
```

O `-T` importa: sem ele o `exec` abre um pseudoterminal, e o despejo binário chega ao arquivo
com quebras de linha traduzidas — um arquivo que o `pg_restore` não abre.

O formato `-Fc` é comprimido e permite restaurar tabela a tabela. Um arquivo que `pg_restore
--list` não lê não é backup. Backup na mesma máquina que o banco não é backup: copie para outro
lugar (outra máquina, um armazenamento de objetos, um disco externo).

Numa máquina Linux com o cliente do Postgres instalado, os scripts do repositório fazem isso com
retenção e cópia remota — a porta 5432 do compose só escuta em `127.0.0.1`, então o host alcança
o banco sem expô-lo:

```
DATABASE_URL='postgresql://rotamer:<senha>@127.0.0.1:5432/rotamer' \
BACKUP_REMOTE='usuario@outra-maquina:/backups/rotamer/' \
./scripts/backup-db.sh
```

No cron, uma vez por dia, com a saída num arquivo de log. O script aborta com erro em qualquer
passo que falhe — silêncio nunca é sinal de sucesso.

### Restaurar

Uma vez por mês, e sempre depois de atualizar, **ensaie** a restauração num banco separado.
Backup que nunca foi restaurado é arquivo, não garantia.

```
docker compose exec postgres createdb -U rotamer rotamer_ensaio
docker compose exec -T postgres pg_restore -U rotamer -d rotamer_ensaio --no-owner < rotamer-<carimbo>.dump
docker compose exec postgres psql -U rotamer -d rotamer_ensaio -c 'select count(*) from "Profile";'
docker compose exec postgres dropdb -U rotamer rotamer_ensaio
```

As três contagens que dizem se o backup vale alguma coisa: `"Profile"` (contas), `"Attempt"`
(tentativas) e `"MoleculeName"` (batismos).

Para restaurar **por cima** da instância, depois de já ter perdido o banco: pare o app
(`docker compose stop app`), restaure no banco `rotamer` com `--clean --if-exists`, e suba o app
de novo. O `scripts/restore-db.sh` faz o mesmo a partir do host e exige `RESTORE_CONFIRMO=sim`
para tocar no banco de produção.

## Proxy com TLS

Para a instância ficar acessível fora da rede local, ponha um proxy com certificado na frente.
Com o Caddy, é um arquivo:

```
rotamer.escola.br {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
```

O Caddy obtém e renova o certificado sozinho. O `encode` importa: o motor de química tem 6,7 MB e
encolhe 70% comprimido — sem compressão, um aluno num celular fraco espera quarenta segundos a
mais na primeira aula. O próprio servidor do Next já comprime; o proxy só não pode desfazer isso.

A opção que a instância mantida pelo autor usa, com os arquivos pré-comprimidos do motor
servidos direto pelo proxy, está em `DEPLOY.md`.

## A imagem sozinha

A imagem sobe sem banco: só o editor, com toda a química, e sem conta, turma nem lista.

```
docker run --rm -p 3000:3000 ghcr.io/gabrielmello1407/rotamer:latest
```

A etiqueta é a mesma que `docker compose up -d` dá à imagem que constrói na sua máquina, então
o comando funciona depois de uma construção local mesmo antes de a imagem estar publicada.

O log diz `subindo sem banco`. Para usar um Postgres que já existe em vez do compose, passe
`-e DATABASE_URL='postgresql://usuario:senha@host:5432/banco'`: as migrações rodam na subida.

## Telemetria

**Desligada por padrão**, e ligar é decisão de quem hospeda. O que existe é uma integração com o
[Umami](https://umami.is), auto-hospedado, sem cookie: quem quiser sobe o próprio Umami e preenche
`UMAMI_SCRIPT_URL` e `UMAMI_WEBSITE_ID`.

O que ela mede, quando ligada, é uma lista fechada de momentos — primeira molécula válida, missão
cumprida, molécula guardada, pedido ao tutor, exemplo carregado (`apps/web/lib/track.ts`). O que
**nunca** viaja: nome, e-mail, molécula desenhada, SMILES, InChIKey. O script respeita "não me
rastreie" do navegador. Se ligar, diga isso no aviso de privacidade da escola.

## Onde ficam os dados

No volume `rotamer-postgres` do Docker, na máquina que roda a instância. Quem hospeda é quem
guarda: e-mail, nome de exibição, escola, a senha (só o resumo, com bcrypt), o progresso nas
missões, as moléculas guardadas, os apelidos e as missões que professores criaram. Apagar uma
conta apaga tudo o que é dela (`onDelete: Cascade`).

O que sai da máquina, e só quando a funcionalidade é usada: a busca por nome e a verificação de
composto conhecido perguntam ao **PubChem** (uma InChIKey ou um nome, nunca quem perguntou); o
tutor manda ao **Gemini** os descritores já calculados e os rótulos dos objetivos — nunca nome,
e-mail, nem texto escrito por professor. Sem chave, nada vai ao Gemini.

## Quando algo dá errado

| O que aparece | O que é | O que fazer |
|---|---|---|
| A tela abre, mas fica em `carregando o motor` e clicar não desenha | `/chem/RDKit_minimal.wasm` não está sendo servido | `curl -I http://localhost:3000/chem/RDKit_minimal.wasm` precisa dar 200. Se der 404, a imagem foi construída sem o `prebuild`: `docker compose build --no-cache app` |
| O app reinicia sem parar; o log diz `o banco não respondeu depois de 10 tentativas` | o app não alcança o Postgres, a senha não confere, ou a senha tem caractere que não cabe numa URL (`@`, `#`, `/`, `:`) | `docker compose ps` mostra o `postgres` saudável? A senha tem só letras, números e hífen? Ela mudou depois da primeira subida? Nesse caso, troque no banco: `docker compose exec postgres psql -U rotamer -c "alter user rotamer password '<nova>';"` |
| `ports are not available … 3000` | a porta já está em uso na máquina | `ROTAMER_PORT=3100` no `.env` |
| A construção falha baixando fontes ou pacotes | sem internet durante o `docker compose build` | conecte e repita; a construção retoma do ponto em que parou |
| `Só conta de professor emite código` | a conta ainda é aluno | § O primeiro administrador |
| `O tutor está desligado neste ambiente` | sem `GEMINI_API_KEY` | preencha e `docker compose up -d` |
| O tutor tinha chave e parou de responder | o modelo saiu de circulação | `GEMINI_MODEL` com um modelo atual, e `docker compose up -d` |
| Busca por nome diz `O PubChem não respondeu agora` | o PubChem está fora ou limitando | espere. Colar SMILES continua funcionando |

Para ver o estado: `docker compose ps` (o app tem `healthy` quando responde). Para ver o que
aconteceu: `docker compose logs --tail 100 app`.

## Para desenvolver

O caminho de quem vai mexer no código é outro — `pnpm dev` com o Postgres do compose — e está em
[CONTRIBUTING.md](../CONTRIBUTING.md).
