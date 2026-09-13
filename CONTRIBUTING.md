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

## Subir o ambiente

Precisa de **Node 24** (20.9 ou mais novo serve), **pnpm 11** e **Docker** para o Postgres.

```
corepack enable                        # ou: npm install --global pnpm@11
pnpm install
docker compose up -d postgres          # só o banco; o app roda fora do container
cp apps/web/.env.example apps/web/.env # a DATABASE_URL já aponta para esse Postgres
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

É o tipo de issue que mais importa. Diga o SMILES (ou anexe o molblock), o que a tela mostrou e o
que você esperava, com a fonte. Se a divergência for entre o RDKit e outra ferramenta, diga qual:
muitas diferenças são de definição (TPSA com aromaticidade percebida, rotacionáveis na definição
estrita) e a resposta certa é a tela dizer de quem é a definição — não ajustar o cálculo para
bater com a outra tabela.

## O time de agentes

Em `.claude/agents/` vivem nove papéis para quem trabalha com assistente de código — `pm`,
`ui-ux`, `frontend`, `backend`, `security`, `deploy`, `researcher`, `marketing` e `reviewer`.
São opcionais: descrevem como o projeto pensa cada tipo de tarefa, e servem de leitura mesmo
para quem não usa nenhum agente.

## Licença

Ao contribuir, você concorda que a sua contribuição é publicada sob a licença MIT do repositório
([LICENSE](LICENSE)).
