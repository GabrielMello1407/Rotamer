# Arquitetura

O que existe no código, e por quê. O porquê de cada escolha está em `DECISOES.md`; aqui está a
forma que elas tomaram.

## O princípio

**O grafo é a única fonte de verdade.** Fórmula, descritores, coordenadas 3D, nota de missão e
texto do tutor são derivados dele e recalculáveis a qualquer momento. Nada além do grafo — e do
rastro do que a pessoa fez com ele — é persistido como estado do usuário.

Isso mantém a persistência mínima, torna qualquer defeito reproduzível a partir de um único
objeto e permite trocar a implementação de qualquer camada derivada sem migração de dados.

## Fluxo, do traço ao veredito

```
                            ┌──────────────────────────────┐
                            │  RDKit · WASM (worker)       │──► métricas, grupos, estereo,
              ┌── molblock ─►  valência, descritores       │    veredito da missão
              │             └──────────────────────────────┘         │ lê
  Editor 2D ──► GRAFO                                                ▼
   (canvas    (fonte da                                        ┌───────────┐
    próprio)   verdade)     ┌──────────────────────────────┐   │ Tutor LLM │
              │             │ OpenChemLib · WASM (worker)  │   └───────────┘
              └── grafo ────►  conformação + MMFF94        │──► cena 3D, dinâmica,   ▲
                            │  Hessiana → modos normais    │    modos normais        │ lê
                            └──────────────────────────────┘         └──────────────┘

              ◄────────────── nunca escreve ──────────────────────────────┘
```

Cada átomo que sai da geometria carrega o índice do átomo do grafo que o originou (`source`), e o
hidrogênio acrescentado pelo campo de força carrega o do vizinho em que está pendurado. É por
esse índice que o vértice do desenho e a esfera da cena acendem juntos, nos dois sentidos (D-18).

O caminho de volta está desenhado justamente porque **não existe**. O tutor lê as métricas e o
veredito e não tem como alterar o grafo, os descritores ou a nota. É a garantia estrutural de que
nenhuma afirmação química chega ao usuário sem ter passado pelo motor determinístico.

## Pacotes

```
apps/web            Next.js 16 App Router — rotas, ações de servidor, contas, turmas, listas, tutor
packages/
  core              grafo · ponte com o RDKit (worker e Node) · geometria, dinâmica e modos normais
  editor2d          canvas 2D próprio: ferramentas, seleção, menu de contexto, atalhos, histórico
  viewer3d          Three.js + React Three Fiber: dobramento, vibração, modos — render, nenhuma química
  quests            missões declarativas, extração de objetivos e pontuação
  ui                tokens, CPK e componentes básicos
```

**A regra de dependência:** `core` não depende de ninguém, e ninguém depende de `editor2d`.

- `core` não conhece React, Three.js nem o DOM. Roda em teste de linha de comando, o que torna a
  química testável sem navegador e rápida de verificar. O RDKit entra por dois carregadores — o
  do navegador (`chemistry/browser.ts`, dentro do worker) e o do Node (`chemistry/node.ts`, do
  pacote npm) — e é o mesmo motor nos dois.
- `quests` depende só de `core`: uma missão é uma lista de condições sobre a **molécula** que o
  RDKit analisou, nunca sobre o desenho. Por isso a mesma função avalia no navegador, para
  resposta instantânea, e no servidor, antes de gravar.
- Nada importa `editor2d`. A interface de desenho é substituível sem tocar em nada abaixo.

Quando uma dessas regras precisar ser quebrada, a resposta certa quase sempre é mover a lógica
para `core`, não criar a dependência.

### O que mora em cada um

| Pacote | Dentro |
|---|---|
| `core/graph` | tipos do grafo, operações (átomo, ligação, cunha, carga), molblock V2000 |
| `core/chemistry` | protocolo do worker via Comlink, `analyze` (sanitização, descritores, grupos por SMARTS, estereo R/S/E/Z), `depict` (SVG do RDKit), `tidy` (organizar o desenho), elementos |
| `core/geometry` | conformação e MMFF94 pelo OpenChemLib, velocity-Verlet a 300 K, Hessiana numérica e diagonalização de Jacobi para os modos normais |
| `editor2d` | `store.ts` (Zustand, histórico, seleção), `render.ts`, `Toolbar`, `PeriodicTable`, `ContextMenu`, `Shortcuts`, `Popover`, `keys.ts`, `templates.ts` (anéis) |
| `viewer3d` | `Viewer3D`, `Molecule` (esferas e varetas, CPK), `folding.ts`, `sticks.ts` |
| `quests` | `catalog.ts` (16 missões), `conditions.ts`, `evaluate.ts`, `extract.ts` (objetivos a partir da molécula, D-25), `types.ts` |
| `ui` | `tokens.css`, `cpk.css`, `base.css`, `Button`, `Card`, `Formula`, `Label`, `Logo`, `NumberValue`, `SourceBadge` |

## Stack e o porquê

| Camada | Escolha | Por quê |
|---|---|---|
| Aplicação | Next.js 16 (App Router) + TypeScript estrito | SSR nas páginas públicas de molécula; ações de servidor sem camada de API à parte |
| Química | RDKit.js (WASM) em Web Worker via Comlink — e no servidor, do pacote npm | Ver D-02. O mesmo motor reavalia no servidor o que o navegador avaliou |
| Geometria | OpenChemLib: conformação + MMFF94 | O RDKit.js publicado não traz gerador 3D nem campo de força. Ver D-10 |
| Vibração | Velocity-Verlet sobre o gradiente numérico do MMFF94, a 300 K | Mesma física do dobramento, outro regime. Ver D-14 |
| Modos normais | Hessiana por diferenças finitas, ponderação por massa, projeção do corpo rígido, Jacobi | 3N − 6, ou 3N − 5 quando linear. Ver D-20 |
| 3D | Three.js + React Three Fiber | Motor de render apenas — nenhuma química dentro |
| Editor 2D | Canvas 2D próprio + Zustand | É o diferencial; nenhuma lib pronta dá o toque certo |
| Dados | Postgres + Prisma 7 com o driver `pg` | Container em desenvolvimento e na imagem Docker; sem serviço gerenciado. Ver D-11 |
| Contas | bcrypt (custo 12); sessão por token aleatório, com só o resumo SHA-256 no banco | Cookie `httpOnly`, `sameSite=lax`, `secure` em produção; 30 dias |
| LLM | Gemini, rota de servidor, JSON de schema fechado | Schema fechado impede o modelo de inventar campo químico. Opcional: sem chave, desliga |
| Telemetria | Umami auto-hospedado, opt-in | Sem cookie; desligada por padrão; lista fechada de momentos em `apps/web/lib/track.ts` |
| Entrega | Imagem Docker (`Dockerfile`, saída `standalone` do Next) + `docker-compose.yml` com Postgres | Self-host em três comandos (D-28). Ver `INSTALACAO.md` |

## O servidor

Toda escrita passa por uma **ação de servidor** em `apps/web/app/actions/`, com a entrada
validada por `zod`. Não existe rota de API pública além das páginas.

| Arquivo | O que faz |
|---|---|
| `account.ts` | criar conta, entrar, sair |
| `attempt.ts` | gravar tentativa (`saveAttempt`), abrir missão (`openQuest`), ler progresso |
| `library.ts` | guardar, tirar e listar moléculas — a estante |
| `naming.ts` | batizar uma estrutura (D-15), ler apelido e o estado do batismo |
| `search.ts` | busca por nome no PubChem, com cache no banco e disjuntor |
| `tutor.ts` | perguntar ao tutor, com cache por `(inchiKey, missão, tipo)` e teto diário |
| `recovery.ts` | emitir código de troca de senha (professor) e trocar a senha com ele (D-19) |
| `classroom.ts` | abrir turma, entrar com código, ler o quadro da turma (D-22) |
| `assignment.ts` | listas da turma, missão de professor, catálogo buscável e denúncia (D-25 a D-27) — ver `ROTEIROS.md` |

Regras que valem em toda ação:

- **O navegador manda o desenho, nunca o veredito.** A `spec` da missão roda no navegador para
  dar resposta instantânea, e roda de novo no servidor — sobre o molblock, reanalisado pelo
  RDKit do Node — antes de gravar qualquer `Attempt`.
- **Papel é pré-requisito; dono é a autorização.** `requireTeacher` diz que a conta é professor;
  cada escrita começa por `ownedClassroom` / `ownedAssignment` / `ownedTeacherQuest`
  (`lib/roles.ts`). Professor não se autodeclara: a promoção é o script
  `apps/web/scripts/promote-teacher.mjs`, rodado por quem administra a instância (D-19).
- **Recusa uniforme.** Slug que não existe e slug a que a conta não tem acesso recebem a mesma
  frase, `Essa missão não existe.`; senha errada e e-mail inexistente recebem a mesma
  `E-mail ou senha não conferem.`. Ação não vira oráculo de existência.
- **Sem banco, sem muro.** `hasDatabase()` é falso quando `DATABASE_URL` não existe: conta,
  turma, lista e estante somem da interface, e o editor funciona inteiro.
- **Tetos.** Pedidos ao tutor por conta por dia (`TutorUsage`); conferências de missão por conta
  por minuto, salvamentos de autoria por dia e códigos de turma errados por hora — estes em
  memória, um processo só.

## Modelo de dados

O schema com os comentários de cada coluna é `apps/web/prisma/schema.prisma`; as migrações estão
ao lado, em `prisma/migrations/`, e são todas aditivas.

| Grupo | Tabelas | O que guardam |
|---|---|---|
| Conta | `Profile`, `Session`, `ResetCode` | quem usa (`role` é `aluno` ou `professor`, `institution` é a escola), sessões por resumo do token, códigos de troca de senha por resumo |
| Trabalho | `Molecule`, `MoleculeName`, `PubChemName`, `PubChemKnown` | a estante (o grafo, único por dono e InChIKey), o apelido por InChIKey com autoria, e o que o PubChem já respondeu |
| Missão | `Attempt`, `QuestOpen`, `TutorHint`, `TutorUsage` | tentativas com a nota reavaliada no servidor, quem abriu o quê (é o "travou" do quadro, D-22), cache do tutor, contagem diária |
| Turma | `Classroom`, `Enrollment`, `Assignment`, `AssignmentItem`, `TeacherQuest`, `QuestReport` | turma com código, matrícula, lista com itens ordenados, missão de professor com a resposta e os objetivos extraídos dela, denúncia |

**Não existe tabela de missão do catálogo.** O catálogo vive em `packages/quests/src/catalog.ts`,
versionado com o motor que o avalia (D-12): uma missão no banco poderia discordar da `spec` que
o código executa, e a nota mudaria sem ninguém ter mexido em nada. `Attempt.questSlug` guarda o
`slug`; missão de professor usa o mesmo campo, no espaço de nomes `professor:<id>`.

**Gabarito não sai.** `TeacherQuest.answerMolblock` e `answerInchiKey` não entram em nenhum
`select` de caminho de aluno (R-3, `ROTEIROS.md`).

## Como o produto sobe

- **Desenvolvimento:** `docker compose up -d postgres` sobe só o banco; `pnpm dev` sobe o app com
  `apps/web/.env`. O `predev` copia o RDKit e as tabelas do MMFF94 de `node_modules` para
  `apps/web/public/chem/` e gera o cliente do Prisma.
- **Imagem:** o `Dockerfile` constrói em três estágios e carrega só a saída `standalone` do
  Next, mais o schema, as migrações, o script de promoção e a linha de comando do Prisma. O
  `docker/entrypoint.sh` aplica as migrações pendentes quando há `DATABASE_URL`, e sobe só o
  editor quando não há. Nenhum segredo entra na imagem.
- **Instância completa:** `docker compose up -d` sobe app e Postgres, com o volume
  `rotamer-postgres` guardando os dados. Detalhes, variáveis e operação em `INSTALACAO.md`; a
  instância mantida pelo autor, em `DEPLOY.md`.
- **Integração contínua** (`.github/workflows/ci.yml`): um trabalho sem banco (lint, tipos,
  testes de núcleo — os de ação pulam avisando), um com Postgres (migração, testes de ação com
  `REQUIRE_DATABASE=1`, Playwright em desktop e celular), e um que constrói a imagem e a sobe
  contra um banco novo. A imagem é publicada no GHCR a cada etiqueta `v*` (`image.yml`).

## Desempenho — restrições, não sugestões

- **Tudo pesado no worker.** Sanitização, descritores, conformação, dinâmica e Hessiana nunca
  tocam a thread principal. O desenho continua a 60 fps enquanto o RDKit trabalha.
- **Debounce por intenção, não por tempo fixo.** Métricas a cada 120 ms de silêncio; geometria 3D
  apenas quando a topologia muda, nunca quando um átomo é arrastado.
- **Cache por InChIKey.** Conformação, trajetória e descritores são função pura do grafo. A mesma
  molécula nunca é calculada duas vezes.
- **O WASM carrega depois da primeira pintura**, e a cena 3D sob demanda. `/chem/*` vai com
  `immutable`, e o `prebuild` grava `.br` e `.gz` ao lado para um proxy que saiba servi-los. Meta
  medida: primeiro desenho interativo em menos de 3 s num celular fraco em 3G, e 605 ms na
  revisita com o motor em cache.

Escola pública em celular ruim é o caso de uso, não o caso extremo.

## A camada de IA

O tutor é o único trecho do produto que pode estar errado, e é o único marcado em âmbar.

1. O prompt (`lib/tutor/prompt.ts`) recebe os descritores **já calculados**, os grupos que o
   RDKit reconheceu e o veredito da missão objetivo a objetivo, e é instruído a nunca recalcular
   nem contradizer.
2. A saída (`lib/tutor/schema.ts`) é JSON de schema fechado, **sem nenhum campo numérico**: o
   modelo escreve `{{tpsa}}` e quem põe o valor é a interface, a partir do que o RDKit calculou.
   Texto com dígito solto é recusado.
3. Cada bloco na tela carrega indicador de origem — verde para calculado, âmbar para gerado.
4. Cache por `(inchikey, quest_slug, tipo_de_dica)` em `TutorHint`. O mesmo erro na mesma missão
   não paga duas vezes — e o texto fala da química, não da pessoa.
5. Teto por conta por dia (`TUTOR_DAILY_LIMIT`), com degradação para as dicas escritas à mão.
6. O modelo padrão é um apelido com reserva fixa (`GEMINI_MODEL` troca sem tocar no código),
   porque modelo sai de circulação e o sintoma era o tutor calar como se não houvesse chave.
7. Missão de professor: o prompt recebe os **rótulos gerados** dos objetivos, nunca o enunciado
   que o professor escreveu (R-9).

## Testes

| Onde | O que | Como roda |
|---|---|---|
| `packages/core/test` | os valores de referência do `CLAUDE.md`, grupos, estereo, geometria, dinâmica, modos, organizar | Vitest, RDKit do pacote npm, sem navegador |
| `packages/quests/test` | catálogo, veredito, `Assessable`, extração de objetivos | Vitest |
| `packages/editor2d/test` | geometria 2D, render, store, anéis | Vitest |
| `apps/web/lib/*.test.ts` | apelido, PubChem com respostas gravadas, código de troca de senha, prompt e schema do tutor | Vitest |
| `apps/web/app/actions/assignment.test.ts` | as regras das listas e do catálogo, uma a uma, contra o Postgres | Vitest; pula avisando sem banco, falha com `REQUIRE_DATABASE=1` |
| `apps/web/e2e/*.spec.ts` | o produto no navegador, desktop e celular, contra o build de produção | Playwright, `pnpm test:e2e` |

## O que o sistema nunca afirma

- Que previu o produto de uma reação ou uma rota de síntese.
- Que uma molécula tem atividade biológica. Descritores são descritores.
- Que substitui PyMOL, ChemDraw ou Maestro.
- Que nomeia compostos. Deixa batizar, que é autoria de apelido, sempre com o nome de quem deu.
