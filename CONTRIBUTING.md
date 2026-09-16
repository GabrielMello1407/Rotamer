# Contribuir com o Rotamer

Obrigado por chegar até aqui. Este arquivo é o caminho de quem vai mexer no código: como subir o
ambiente, o que precisa continuar verdade, e como uma mudança vira commit.

## Antes de tudo: as regras que não se negociam

Estão em [CLAUDE.md](CLAUDE.md), e valem para qualquer pessoa, com ou sem assistente de código.
As que mais importam:

- **O núcleo determinístico decide. A IA explica.** Validade, valência, fórmula, massa, SMILES,
  InChIKey, descritores, aromaticidade, estereoquímica, frequência de modo normal e nota de
  missão saem **sempre** do RDKit, do campo de força ou do motor de missões. Nunca de um modelo
  de linguagem, e nunca de um cálculo próprio "para resolver rápido". Um químico que ache um
  erro sutil encerra a confiança no produto inteiro.
- **Código em inglês, texto em português.** Nome de arquivo, variável, função, tipo e chave de
  dado em inglês; comentário, nome de teste, string de interface e mensagem de erro em pt-BR. O
  erro explica a química, não o código: "O átomo de C tem 5 ligações, mas suporta no máximo 4".
- **Cor CPK é do átomo.** Nenhum botão, borda ou estado semântico usa cor CPK. Toda cor, espaço,
  raio e duração vem de `packages/ui/src/tokens.css`. Temas claro e escuro sempre juntos.
- **Licença compatível com o MIT.** MIT, BSD, Apache-2.0, ISC entram; GPL, LGPL e AGPL não.
  Toda dependência nova vai para `docs/TERCEIROS.md` no mesmo commit.
- **Ideia fora de escopo vai para `docs/FORA-DE-ESCOPO.md`**, não para o código. Escopo
  estourando é o risco número um do projeto.

## O caminho, de fora para dentro

Ninguém tem permissão de escrita neste repositório além de quem o mantém, e é assim que funciona na
maioria dos projetos abertos: você trabalha numa cópia sua e pede para integrar.

1. **Faça um fork** — o botão fica no topo da página do repositório.
2. **Clone o seu fork** e aponte o original como `upstream`, para conseguir atualizar depois:

   ```
   git clone https://github.com/SEU-USUARIO/Rotamer.git
   cd Rotamer
   git remote add upstream https://github.com/GabrielMello1407/Rotamer.git
   ```

3. **Crie um branch** a partir de `main`. Nunca trabalhe no `main` do seu fork — ele é o seu espelho
   do original:

   ```
   git switch -c corrige-tpsa-da-cafeina
   ```

4. **Trabalhe, teste e faça commit** — o que isso exige está na seção "Como uma mudança vira commit".
5. **Empurre para o seu fork** e abra o pull request contra o `main` daqui:

   ```
   git push -u origin corrige-tpsa-da-cafeina
   ```

   O GitHub oferece o link do pull request na saída do `push`.

**O CI roda no seu pull request**, mesmo vindo de fora: lint, tipos, testes de unidade, navegador e a
imagem Docker. O resultado aparece na própria página do PR, e não precisa de aprovação para começar.
Um `pnpm lint && pnpm typecheck && pnpm test` antes de empurrar economiza uma ida e volta.

Para atualizar o seu branch quando o `main` andar:

```
git fetch upstream
git rebase upstream/main
```

**Abrir issue antes é bem-vindo, e nunca obrigatório.** Para correção pequena, manda o PR direto.
Para mudança que atravessa mais de um pacote, ou que muda comportamento que alguém já usa, uma issue
primeiro evita você escrever código que vai ser recusado por escopo — que é o risco número um daqui.

## O que dá para contribuir sem subir o ambiente inteiro

O ambiente completo pede Node, pnpm, Docker e Postgres. Três contribuições valiosas não pedem nada
disso:

- **Erro de química.** É o relato que mais importa neste projeto, e é issue, não código — há um
  formulário próprio, que pergunta o SMILES, o que a tela mostrou, o que você esperava e a fonte. Um
  professor que acha um número errado ajuda mais que muita linha de código.
- **Documentação.** Tudo em `docs/`, mais este arquivo e o `README.md`. Documento que discorda do
  código está errado — se você achar um, corrigi-lo é contribuição completa.
- **Teste do núcleo.** `packages/core/` não depende de navegador nem de banco:
  `pnpm --filter @rotamer/core test` roda sozinho. Um caso novo em `packages/core/test/`, com o valor
  que o RDKit calcula, é a contribuição de código mais barata de fazer e a mais difícil de quebrar.

**Por onde começar**, se você quer mexer no código e não sabe onde: as issues marcadas
[`good first issue`](https://github.com/GabrielMello1407/Rotamer/labels/good%20first%20issue), e a
lista de dívida conhecida em [docs/FORA-DE-ESCOPO.md](docs/FORA-DE-ESCOPO.md) — a seção
"Dívida da entrega de listas" e as "Sobras da leitura" são trabalho real, já descrito, ainda sem
ninguém.

## Convivência e segurança

Este produto é usado por gente de 14 a 18 anos em sala de aula, e isso muda o que se escreve numa
issue: sem conteúdo sexual, violento ou de assédio, e **nenhum dado real de aluno** — nome, e-mail,
turma ou captura de tela com gente identificável. O resto está em
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

**Achou uma falha de segurança?** Não abra issue. O caminho é o relato privado do GitHub, e o que
conta como falha aqui está em [SECURITY.md](SECURITY.md).

## Subir o ambiente

Use **Node 24**, **pnpm 11.24.0** e **Docker** para o Postgres. Essa é a versão do Node usada
no Docker e no CI; as dependências de banco exigem versões mais novas que o mínimo declarado
na raiz do monorepo.

```
corepack enable                        # ou: npm install --global pnpm@11.24.0
pnpm install
docker compose up -d postgres          # só o banco; o app roda fora do container
cp apps/web/.env.example apps/web/.env # a DATABASE_URL já aponta para esse Postgres
```

Se você já configurou `POSTGRES_PASSWORD` no `.env` da raiz, ajuste a senha na `DATABASE_URL`
de `apps/web/.env` para o mesmo valor.

Com a conexão configurada, aplique as migrações e inicie o app:

```
pnpm --filter @rotamer/web db:migrate  # aplica as migrações
pnpm dev
```

`http://localhost:3000`. O `predev` copia o RDKit e as tabelas do MMFF94 de `node_modules` para
`apps/web/public/chem/` e gera o cliente do Prisma — não versione essa pasta e não a edite à mão.

Sem `DATABASE_URL`, o produto sobe sem conta, turma nem lista, e o editor funciona inteiro. Sem
`GEMINI_API_KEY`, o tutor se desliga e diz isso na tela.

Para virar professor na sua instância de desenvolvimento, depois de criar a conta em `/entrar`:

```
cd apps/web && node scripts/promote-teacher.mjs voce@exemplo.br --escola "Escola de teste"
```

Com `--administrador` no fim, a conta ganha também a seção `Professores da escola` em `/turmas`,
que é por onde uma escola promove os próprios professores (D-29). Administrador só nasce por este
script, e pela tela ele promove no máximo a professor.

## Onde as coisas estão

```
apps/web            Next.js 16 · rotas, ações de servidor, contas, turmas, listas, tutor
packages/core       grafo · RDKit · geometria, dinâmica e modos normais — roda sem navegador
packages/editor2d   o canvas 2D: ferramentas, seleção, menu, atalhos, histórico
packages/viewer3d   Three.js · só render
packages/quests     missões declarativas, extração de objetivos, pontuação
packages/ui         tokens e componentes
docs/               arquitetura, decisões, design system, listas, instalação, guia
```

**Regra de dependência:** `core` não depende de ninguém, e nenhum pacote depende de `editor2d`.
O mapa completo está em [docs/ARQUITETURA.md](docs/ARQUITETURA.md); o porquê de cada escolha, em
[docs/DECISOES.md](docs/DECISOES.md).

**`R-1`, `§4.5` e companhia.** O código das turmas cita regras por número — `R-3` num `select`,
`§6.3` num componente. Todas moram em [docs/ROTEIROS.md](docs/ROTEIROS.md): a §5.1 tem a tabela
de regras de servidor, a §6 os textos de tela e a §7 o teste que protege cada uma. Se você mexer
em lista, missão de professor ou catálogo, é o documento a ler antes.

## Como uma mudança vira commit

1. **Toda mudança termina com um teste que falharia sem ela.** Química nova pede caso em
   `packages/core/test/`, rodando sem navegador, com o valor que o RDKit calcula — nunca o valor
   de uma tabela de terceiro. Onde o RDKit diverge do PubChem, o RDKit ganha, e a tela diz de
   quem é a definição.
2. **Rode o que o CI roda**, antes de abrir o pull request:

   ```
   pnpm lint
   pnpm typecheck
   pnpm test          # com o Postgres de pé, os testes de ação rodam; sem ele, pulam avisando
   pnpm test:e2e      # Playwright, desktop e celular, contra o build de produção
   ```

   O `test:e2e` constrói e sobe o app na porta 3100. Os testes de conta, turma e lista precisam
   do Postgres; os de busca por nome pulam quando o PubChem não responde; os do tutor cobrem o
   comportamento que o seu `.env` permite — com chave, a resposta; sem chave, o desligamento.
3. **Mudança de schema tem migração aditiva.** `pnpm --filter @rotamer/web db:migrate` cria a
   migração em `apps/web/prisma/migrations/`. Coluna não se apaga nem se reescreve: quem sobe a
   própria instância atualiza com `docker compose up -d`, e a migração roda antes de o app abrir
   a porta.
4. **Texto de tela é conteúdo.** Cada frase que o aluno lê passa pelo mesmo cuidado que o
   código: pt-BR, sem jargão de programação, e sem afirmar o que o produto não faz — a seção
   "Nunca afirme" do `CLAUDE.md`.
5. **Documento descreve o que existe.** Se a mudança contraria um documento em `docs/`, o
   documento muda no mesmo commit. Decisão nova ou revista vai para `docs/DECISOES.md`, sem
   apagar a anterior. Comentário explica **por quê**, não o que a linha faz; nome de teste diz o
   que ele protege.
6. **Mensagem de commit em português**, no formato `tipo: o que mudou` — `feat:`, `fix:`,
   `docs:`, `refactor:`, `test:`, `chore:`.

## Achou um erro de química?

É o tipo de issue que mais importa, e tem formulário próprio: **Erro de química**, na hora de abrir a
issue. Ele pede o SMILES (ou o molblock), o que a tela mostrou, o que você esperava e a fonte.

A fonte não é burocracia. Muitas divergências entre o RDKit e outra ferramenta são de **definição** —
TPSA com aromaticidade percebida, rotacionáveis na definição estrita — e nesses casos a resposta certa
é a tela dizer de quem é a definição, nunca ajustar o cálculo para bater com a outra tabela. Sem a
fonte não dá para separar os dois casos, e é a separação que decide o que se conserta.

## O time de agentes

Em `.claude/agents/` vivem nove papéis para quem trabalha com assistente de código — `pm`,
`ui-ux`, `frontend`, `backend`, `security`, `deploy`, `researcher`, `marketing` e `reviewer`.
São opcionais: descrevem como o projeto pensa cada tipo de tarefa, e servem de leitura mesmo
para quem não usa nenhum agente.

## Licença

Ao contribuir, você concorda que a sua contribuição é publicada sob a licença MIT do repositório
([LICENSE](LICENSE)).
