# A instância no ar

A instância mantida pelo autor roda **a mesma imagem que qualquer self-host** — o
`docker-compose.yml` do repositório, num VPS, atrás de um Caddy com TLS. Este documento é o que
ela tem a mais em relação ao `INSTALACAO.md`, que é o procedimento base e vale aqui inteiro.

## O que já funciona

- **Integração contínua** em `.github/workflows/ci.yml`: a cada push na `main` e a cada pull
  request rodam `pnpm lint`, `pnpm typecheck`, `pnpm test`, os testes de ação contra um Postgres
  de verdade, `pnpm test:e2e` (Chromium, desktop e celular), e a imagem Docker é construída e
  posta de pé contra um banco novo — migração, página pública com RDKit no servidor, motor com
  `immutable`, script de promoção. O relatório do Playwright sobe como artefato.
- **Imagem publicada** em `ghcr.io/gabrielmello1407/rotamer` a cada etiqueta `v*`
  (`.github/workflows/image.yml`):

  ```
  git tag v0.3.0
  git push --tags
  ```

  Sai com as etiquetas `0.3.0`, `0.3` e `latest`. **O pacote nasce privado no GHCR**: depois da
  primeira publicação, torne-o público nas configurações do pacote, no GitHub — sem isso,
  `docker compose pull` de quem não tem conta recebe `denied`.

## O que a instância no ar tem a mais

### 1. Domínio

Ainda **não confirmado no registrador**. Ver a ressalva em `DECISOES.md` D-07: DNS sem registro
não é o mesmo que disponível no registrador, e disponível no registrador não é o mesmo que livre
no INPI. Enquanto não houver endereço, o `README.md` não promete link.

### 2. Caddy na frente, com o motor pré-comprimido

O `prebuild` grava `.br` e `.gz` ao lado de cada arquivo de `public/chem/`, e é isso que decide a
primeira aula de uma turma inteira — **medido**, não estimado:

| Arquivo | Original | gzip | brotli |
|---|---|---|---|
| `RDKit_minimal.wasm` | 6753 KB | 1998 KB (−70%) | **1437 KB (−79%)** |
| `ocl-resources.json` | 1320 KB | 457 KB | 375 KB |
| `RDKit_minimal.js` | 125 KB | 29 KB | 26 KB |

O servidor do Next comprime em gzip na hora. Para servir o brotli pronto, o Caddy precisa dos
arquivos no disco do host — eles saem da própria imagem:

```
docker compose cp app:/app/apps/web/public/chem ./chem
```

E o `Caddyfile`:

```
rotamer.exemplo.br {
  encode zstd gzip

  handle_path /chem/* {
    root * /srv/rotamer/chem
    file_server {
      precompressed br gzip
    }
    header Cache-Control "public, max-age=31536000, immutable"
  }

  reverse_proxy 127.0.0.1:3000
}
```

Repita o `cp` a cada atualização que mude a versão do RDKit ou do OpenChemLib — o `prebuild`
imprime as duas versões na construção.

O `immutable` resolve a revisita mesmo sem proxy: **605 ms com o motor em cache, contra 6,9 s na
primeira visita**. Numa turma de trinta alunos na mesma sala, é a diferença entre a aula começar
e a aula esperar.

### 3. Backup no cron, com ensaio marcado

O VPS tem o cliente do Postgres instalado, e os scripts do repositório rodam do host contra
`127.0.0.1:5432`, que é onde o compose expõe o banco:

```
# uma vez por dia, às 3h, pelo crontab do usuário que roda o compose
0 3 * * * DATABASE_URL='postgresql://rotamer:<senha>@127.0.0.1:5432/rotamer' BACKUP_REMOTE='usuario@outra-maquina:/backups/rotamer/' /srv/rotamer/scripts/backup-db.sh >> /var/log/rotamer-backup.log 2>&1
```

O script despeja em formato próprio do Postgres, **confere que o arquivo abre**, manda a cópia
para fora da máquina e apaga o que passou de 30 dias. Qualquer passo que falhe aborta com erro —
o cron manda o e-mail, e silêncio deixa de ser sinal de que deu certo.

**O ensaio**, uma vez por mês e sempre depois de mudar o schema:

```
createdb -h 127.0.0.1 -U rotamer rotamer_ensaio     # uma vez; o pg_restore não cria banco
DATABASE_URL='postgresql://rotamer:<senha>@127.0.0.1:5432/rotamer' ./scripts/restore-db.sh /var/backups/rotamer/rotamer-<carimbo>.dump
```

Restaura em `rotamer_ensaio`, nunca por cima da produção — para isso é preciso pedir com
`RESTORE_CONFIRMO=sim`. No fim, o script imprime as três contagens que dizem se o backup vale
alguma coisa: perfis, tentativas e batismos. Backup que nunca foi restaurado é arquivo, não
garantia (D-11).

### 4. Atualização

```
cd /srv/rotamer
DATABASE_URL='postgresql://rotamer:<senha>@127.0.0.1:5432/rotamer' ./scripts/backup-db.sh
git pull
docker compose pull
docker compose up -d
```

As migrações rodam na subida do container, antes de ele abrir a porta. A ordem é sempre esta:
backup, código novo, subir. Se a migração falhar, o app não sobe e o log diz por quê
(`docker compose logs app`); o Postgres continua de pé com os dados intactos.

### 5. Telemetria

Umami auto-hospedado, em outro compose no mesmo VPS, atrás do mesmo Caddy. Existe porque sessão
de observação sem instrumento vira anedota: dá para ver uma pessoa travar, não dá para saber se
ela é a regra. Liga-se com as duas variáveis do `.env`; o que é medido, e o que nunca sai, está
em `INSTALACAO.md`.

### 6. Contas de professor e de administrador

Como em qualquer instância: pelo script, dentro do container.

```
docker compose exec app node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II"
docker compose exec app node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II" --administrador
```

Quem dá aula sem escola preenchida não emite nada — o código só vale para alguém da mesma escola, e
o script recusa a promoção quando o campo está vazio (D-19).

Na instância no ar, o comando a rodar é o **segundo**: um administrador por escola. Daí em diante
quem coordena promove os próprios professores pela tela, sem passar por aqui — e continua sem poder
criar outro administrador, que é o que mantém o controle da instância com quem tem a máquina (D-29).

### 7. O que olhar quando algo cai

- `docker compose ps` — o app mostra `healthy` quando `/marca` responde.
- `docker compose logs --tail 200 app` — migração, subida do Next, erros de rota.
- Se a tela ficar em `carregando o motor`, o primeiro suspeito é `/chem/*`: a imagem foi
  construída sem o `prebuild`, ou o `handle_path` do Caddy aponta para uma pasta vazia.
- O WASM carrega **depois** da primeira pintura, dentro do worker. A meta de 3 s para o
  primeiro desenho num celular fraco em 3G depende de isso continuar assim.

## Custos, e o que acontece se não couberem

Um VPS pequeno, um domínio e a chave do Gemini para o tutor. Se um dia não couberem, a instância
encolhe — o tutor desliga primeiro, a instância some por último — e o código não fecha (D-28).
Quem precisa de garantia de disponibilidade sobe a própria instância: é para isso que o
`INSTALACAO.md` existe.
