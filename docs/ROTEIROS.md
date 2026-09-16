# Listas da turma — o professor monta, o aluno resolve

> O que existe no código para as listas da turma (D-25), o catálogo buscável (D-26) e o catálogo
> compartilhado de missões de professor (D-27): modelo de dados, regras de servidor, extração de
> objetivos, telas e os testes que provam cada regra. As decisões estão em `DECISOES.md`; o que
> ficou de fora está no `FORA-DE-ESCOPO.md`.
>
> O arquivo se chama `ROTEIROS.md` porque foi assim que a tarefa nasceu. A palavra da tela é
> **lista**, e o porquê está na §2. O código aponta para as seções daqui pelo número.

---

## 1. O que é, e o que não é

O professor monta uma **lista**: um punhado de missões, na ordem dele, com um nome
("Funções oxigenadas — 3ª série"), dentro de uma turma que já existe. Ele escolhe do catálogo,
cria as dele **desenhando a resposta**, ou mistura os dois; publica quando quiser, e a partir daí
a turma vê a lista no painel de missões, na ordem em que ele pôs. O aluno resolve como sempre
resolveu — o motor de missões avalia, o servidor reavalia, a nota sai do RDKit. O professor
acompanha no quadro da turma: quem cumpriu, quem travou, quem não abriu. Progresso, nunca
molécula (D-22).

A parte que decide química **nunca é digitada**. O professor desenha a molécula-resposta, o RDKit
a analisa, o produto extrai dela os objetivos verificáveis e ele marca quais quer cobrar. Ele
escreve título, enunciado e dicas — texto, que é o que um professor sabe escrever melhor que
nós. Objetivo escrito à mão não existe neste produto, e é isso que impede a missão impossível
("um álcool com fórmula C₂H₄O") de chegar à sala.

Uma missão de professor pode ainda ser **publicada no catálogo** (D-27): aí qualquer conta a
encontra pela busca, com o nome e a escola de quem escreveu, e pode denunciá-la.

**O que ficou de fora** — prazo, nota que vira boletim, copiar lista entre turmas, mais de uma
resposta certa por composição, cadeado entre itens, grafo de conceitos, tour de primeira visita,
tempo por item no quadro, tela de moderação — está no `FORA-DE-ESCOPO.md`, cada um com o
porquê.

**A trilha Otimização continua sem missão** (D-09). Ela não aparece no seletor de trilha do
catálogo, e nenhuma lista tem como conter item dela.

---

## 2. Vocabulário

O `researcher` mediu como o professor brasileiro já fala: o Google Classroom chama o item de
**atividade** e o agrupamento de **tópico**; em ciências exatas o conjunto é coloquialmente
**lista de exercícios**. E em química, "roteiro" é palavra ocupada — roteiro de experimento, de
bancada. **A tela diz "lista"** (D-26). O código continua em inglês, `Assignment`, como manda a
casa.

| A coisa | Na tela (pt-BR) | No código | O que nunca dizer |
|---|---|---|---|
| O conjunto ordenado que o professor monta | **lista** — "Nova lista", "Listas da turma" | `Assignment` | roteiro, tópico, trilha, módulo |
| Uma posição dentro da lista | **item** (na fala do quadro: "o item 3") | `AssignmentItem` | atividade, tarefa |
| O que o aluno resolve, dentro ou fora da lista | **missão** — a palavra que o produto já usa | `Quest` / `TeacherQuest` | exercício, questão |
| Missão escrita pelo professor | **sua missão** (para ele), **missão do seu professor** (para o aluno) | `TeacherQuest` | missão customizada, missão personalizada |
| A molécula que o professor desenhou para criar a missão | **a resposta** | `answerMolblock` | gabarito (é o que ela é, mas não se escreve na tela do professor: ele não está corrigindo prova) |
| Tornar a lista visível para a turma | **publicar** | `publishedAt` | liberar, atribuir, enviar |
| Tornar uma missão visível a qualquer conta | **publicar no catálogo** / **retirar do catálogo** | `catalogedAt` | compartilhar, tornar pública |
| Lista não publicada | **rascunho · só você vê** | `publishedAt = null` | privado, oculto |
| Os três estados do quadro | **cumpriu · travou · não abriu** | `met` / `stuck` / `untouched` | nota, média, melhor, ranking |

Uma palavra por coisa. "Missão" não vira "exercício" no meio do caminho, e "lista" não vira
"roteiro" na frase seguinte.

**Todo texto de tela destas telas vive num arquivo só:** `apps/web/app/turmas/messages.ts` —
chaves em inglês, textos em pt-BR. É o que impede a mesma frase divergir entre a ação de
servidor e o componente, e é o único arquivo a editar se a sessão de observação mostrar outra
palavra na boca do professor.

---

## 3. Modelo de dados

Quatro modelos, todos em `apps/web/prisma/schema.prisma`, com o comentário de cada coluna ao
lado dela. Nenhuma coluna pré-existente mudou; as duas migrações (`listas_da_turma`,
`catalogo_e_denuncia`) são puramente aditivas.

### 3.1 `TeacherQuest` — a missão que o professor criou

Título, enunciado e até três dicas — texto do professor, que não entra em conta nenhuma. `goals`
é `Goal[]`, a mesma forma do pacote `quests`: só os objetivos escolhidos, cada um com `id`,
`label` e `condition` saídos de `extractGoals` sobre a resposta reanalisada no servidor.
`answerMolblock` e `answerInchiKey` são a resposta desenhada. `archivedAt` arquiva;
`catalogedAt` nulo é "só nas minhas listas", preenchido é "publicada no catálogo" (D-27).

**Por que `goals` é `Json` e não tabela.** É lida por uma função só (`resolveQuest`) e nunca
consultada por dentro. Tabela de condição seria um editor de condição relacional — a coisa que
o D-25 existe para não construir.

**Por que a resposta fica em coluna própria, e não na estante.** A estante é do usuário; o
professor não pediu para guardar nada, e se ele limpar a estante depois, a missão não pode
quebrar. **`answerMolblock` é gabarito**, e gabarito não entra em `select` de caminho de aluno —
em nenhum (R-3).

**Por que só os objetivos escolhidos são persistidos.** O candidato não escolhido descreve a
resposta muito além do que foi cobrado — o professor cobra "tem um álcool" e o candidato guardado
entregaria a fórmula exata.

### 3.2 `Assignment` — a lista

Nome, turma, quem criou (`createdById`, separado do dono da turma porque autoria de conteúdo é
pergunta de escola), `publishedAt` (nulo é rascunho) e `archivedAt`.

### 3.3 `AssignmentItem` — uma posição

`position` (1, 2, 3… — o número que o aluno vê e a coluna que o professor lê) e `questSlug`.
`@@unique([assignmentId, questSlug])`: o mesmo slug duas vezes na mesma lista duplicaria o tique
do aluno, porque progresso é por `(profile, slug)`. O mesmo slug em **listas diferentes** é
permitido e esperado.

### 3.4 Como `Attempt` e `QuestOpen` apontam para missão de professor

**Não mudam de forma.** `questSlug` continua sendo uma `String`, com espaço de nomes:

```
missão do catálogo   →  primeiro-carbono        (nunca contém `:`)
missão do professor  →  professor:clx8k2m0000...
```

A resolução é `resolveQuest(slug)` em `apps/web/lib/quest-resolve.ts`:

- Despacha **pelo prefixo**, nunca "tenta catálogo, depois banco" — um fallback deixaria uma
  missão de professor sombrear um slug de catálogo.
- Depois do prefixo, o resto precisa casar `/^[a-z0-9]{20,32}$/` (formato cuid) **antes** de
  tocar o banco. Não casou, devolve `null` sem consultar.
- Um teste em `packages/quests` trava `:` em slug de catálogo. Os dois espaços nunca se cruzam.

**Não há chave estrangeira** de `Attempt.questSlug` / `QuestOpen.questSlug` /
`AssignmentItem.questSlug` para `TeacherQuest.id`, porque o mesmo campo também guarda slug de
catálogo, que não é linha de banco (D-12). O preço disso é que missão apagada deixaria tentativa
órfã — que é exatamente por que **apagar não existe** (§3.5).

### 3.5 Regras de exclusão — nada apaga

| Situação | O que acontece |
|---|---|
| Professor arquiva uma missão dele (`archivedAt`) | Sai do seletor e do catálogo. Lista que já a usa continua funcionando; tentativa antiga continua resolvendo o título. Desarquivar respeita o teto de 200 ativas. |
| Professor arquiva uma lista | Some das duas telas; aparece em "Listas arquivadas (n)" na turma, de onde se desarquiva. Nada é apagado, e o `Attempt` continua contando no quadro geral. |
| Turma arquivada | As listas dela somem junto, dos dois lados. Nada é apagado. |
| Missão já usada em lista **publicada** | **Objetivos deixam de ser editáveis.** Título, enunciado e dicas continuam. Para cobrar outra coisa, duplica-se a missão. |
| Missão retirada do catálogo | Quem só chegava pelo catálogo deixa de alcançá-la; quem chega por lista publicada da própria turma continua (D-27). |
| Conta do professor apagada | `onDelete: Cascade` leva missões e listas. É o comportamento do resto do schema, e é o que a LGPD espera. |
| Professor rebaixado a aluno | As escritas param na hora (`requireTeacher` lê o papel do banco a cada chamada). **As listas publicadas continuam funcionando para os alunos** — intencional, para ninguém "consertar" e derrubar a aula de trinta pessoas. |

**Por que objetivo publicado congela:** é o D-12 aplicado ao conteúdo do professor. Objetivo
editado mudaria a nota de quem já tentou, sem ninguém ter mexido em nada.

---

## 4. Extração de objetivos

`packages/quests/src/extract.ts`. Função pura, sem React, sem DOM, sem rede — roda em Vitest de
linha de comando como o resto do núcleo.

```ts
export type CandidateKind = 'identity' | 'formula' | 'group' | 'count';

/** Um objetivo que dá para cobrar desta molécula. */
export interface CandidateGoal {
  /** Determinístico: `formula`, `inchi-key`, `group:alcohol:1`, `atoms:C:2`, `descriptor:rings:1`. */
  readonly id: string;
  /** Rótulo em pt-BR, **gerado**. Nunca digitado, nunca editável. */
  readonly label: string;
  /** O valor medido, para a coluna da direita da lista: `2`, `C2H6O`. */
  readonly measured: string;
  readonly kind: CandidateKind;
  /** Verdadeiro só no InChIKey: marcado, ele é o único objetivo da missão. */
  readonly exclusive: boolean;
  readonly condition: Condition;
}

export function extractGoals(molecule: Molecule): readonly CandidateGoal[];
```

O `id` é **função da condição**, não um contador: é por ele que o servidor confere que o objetivo
escolhido saiu mesmo da molécula (§4.5, R-1).

### 4.1 O que é oferecido

Tudo lido do que o RDKit já calculou em `analysis.molecule`.

| `kind` | Candidato | Condição gerada |
|---|---|---|
| `identity` | a molécula exata | `{ kind: 'inchiKey', value }` — **`exclusive: true`** |
| `formula` | a fórmula molecular | `{ kind: 'formula', value }` |
| `group` | um por grupo funcional encontrado | `{ kind: 'group', group, min: count }` |
| `count` | um por elemento da fórmula | `{ kind: 'atoms', element, min: n, max: n }` |
| `count` | `rings`, `aromaticRings`, `rotatableBonds`, `hbDonors`, `hbAcceptors`, `heavyAtoms`, `heteroatoms`, `stereocenters` — sempre, inclusive quando o valor é zero | `{ kind: 'descriptor', descriptor, min: n, max: n }` |
| `count` | só quando há centro estereogênico **e todos têm configuração** | `{ kind: 'descriptor', descriptor: 'unspecifiedStereocenters', max: 0 }` |

**O que não é oferecido, e por quê:** `molarMass`, `exactMass`, `tpsa`, `logP`. São contínuos —
igualdade exata é armadilha, e faixa teria que ser digitada, que é justamente o que o D-25
proíbe. Descritor de contagem sai com `min = max = n`: é inteiro, e "exatamente 2 anéis" é uma
frase que um aluno entende. O candidato "nenhum centro fica sem configuração" só aparece quando a
própria resposta o cumpre — com centro sem cunha, ele nem é oferecido, porque a R-2 recusaria a
missão pela própria resposta.

### 4.2 Os rótulos, palavra por palavra

O gerador produz exatamente estes textos:

```
a fórmula é {fórmula}
é exatamente esta molécula
tem pelo menos {n} grupo {nome}          /  tem pelo menos {n} grupos {nome}
tem exatamente {n} átomo de {símbolo}    /  tem exatamente {n} átomos de {símbolo}
tem exatamente {n} anel                  /  tem exatamente {n} anéis
tem exatamente {n} anel aromático        /  tem exatamente {n} anéis aromáticos
tem exatamente {n} ligação rotacionável  /  tem exatamente {n} ligações rotacionáveis
tem exatamente {n} doador de ligação de hidrogênio    / {n} doadores de ligação de hidrogênio
tem exatamente {n} aceitador de ligação de hidrogênio / {n} aceitadores de ligação de hidrogênio
tem exatamente {n} átomo pesado          /  tem exatamente {n} átomos pesados
tem exatamente {n} heteroátomo           /  tem exatamente {n} heteroátomos
tem exatamente {n} centro estereogênico  /  tem exatamente {n} centros estereogênicos
nenhum centro estereogênico fica sem configuração
```

**Regra de linguagem, e ela não é estilo.** O artigo e o plural vêm sempre da palavra
`grupo`/`átomo`, **nunca** do nome do grupo. `um álcool` e `uma amida` mudam de gênero; `álcoois`
e `ésteres` mudam de plural; nada disso está nos dados. Um gerador que adivinhasse escreveria
português errado na frente de uma sala. `1 grupo álcool` / `2 grupos amida` é invariável e
continua sendo como um químico lê. O nome do grupo vem de
`packages/core/src/chemistry/groups.ts` e não é reescrito aqui.

O símbolo do elemento, quando aparece escrito, sai em `--cpk-ink-{símbolo}` — ali a letra **é** o
átomo (D-17). Nada mais nesta tela usa cor CPK.

### 4.3 Forma serializada

O que vai para `TeacherQuest.goals` é `Goal[]` do pacote `quests` — `{ id, label, condition }`,
sem `measured`, `kind` nem `exclusive`, que são só de tela. Guardar a mesma forma que o catálogo
guarda é o que faz `evaluateQuest` não saber a diferença entre uma e outra.

### 4.4 A interface mínima que o motor recebe

```ts
/** O que basta para avaliar: um slug e os objetivos. */
export interface Assessable {
  readonly slug: string;
  readonly goals: readonly Goal[];
}

export interface Quest extends Assessable { /* track, difficulty, title, brief, hints */ }

export function evaluateQuest(quest: Assessable, molecule: Molecule): QuestResult;
```

Sem isso, a missão do professor teria que fingir `track` e `difficulty` que ninguém escolheu —
dado falso no banco para caber num tipo.

### 4.5 A regra: nada é digitado

Duas travas, as duas **no servidor**, no momento de salvar — `validateAuthoredGoals` em
`apps/web/lib/quest-resolve.ts`, função pura, testada com candidato forjado:

1. **Regeneração.** O molblock da resposta é reanalisado pelo RDKit, `extractGoals` roda de novo,
   e **só é aceito objetivo cujo `id` está na lista regerada**. O cliente manda `goalIds: string[]`,
   nunca `Condition`. Condição digitada não vira missão.
2. **A própria resposta cumpre.** `evaluateQuest({ slug, goals }, analysis.molecule)` precisa
   passar. Se não passar, a missão é recusada e o erro **nomeia o objetivo** que não fecha. É o
   que mata a missão impossível que o D-25 cita. Entre as duas, a exclusividade do InChIKey é
   conferida no servidor também — ele não confia que o cliente desligou os outros.

E a terceira, de linguagem: **rótulo de objetivo é gerado, não editável.** Rótulo editável
permitiria escrever "tem um éster" numa condição que verifica álcool — erro silencioso de
química, para uma sala inteira.

---

## 5. Ações de servidor

Tudo em `apps/web/app/actions/assignment.ts`, salvo o que diz outro arquivo. Toda entrada
validada por zod, como o resto da casa.

### 5.1 As regras

Estas são **regras**, não sugestões. Cada uma tem um teste na §7.

| # | Regra |
|---|---|
| **R-1** | Nenhuma `Condition` chega ao banco sem ter saído de `extractGoals` sobre a resposta reanalisada no servidor. O cliente manda `goalIds`. |
| **R-2** | Missão que a própria resposta não cumpre é recusada, com o rótulo do objetivo que não fecha. |
| **R-3** | `answerMolblock` e `answerInchiKey` não entram em nenhum `select` de caminho de aluno. Nenhum `findMany`/`findUnique` de `TeacherQuest` sem `select` explícito. |
| **R-4** | Missão com objetivo `inchiKey` **não manda `condition` ao cliente**: o cliente recebe `{ id, label }` e o veredito vem do servidor, por `checkQuest`. Para os outros tipos, a condição não conta nada que o rótulo já não conte; a InChIKey conta tudo. |
| **R-5** | Papel é pré-requisito, **dono é a autorização**. `requireTeacher` sozinho não autoriza nada. Toda escrita começa por `ownedClassroom` / `ownedAssignment` / `ownedTeacherQuest` (`lib/roles.ts`). |
| **R-6** | `addItem` confere **dois** donos: a lista é minha **e** a missão `professor:` é minha. |
| **R-7** | Acesso de aluno a slug `professor:` (`studentQuestAccess`) tem três caminhos, qualquer um basta: **matrícula** viva → turma não arquivada → lista publicada e não arquivada → item com o slug; **catálogo** — `catalogedAt` preenchido e `archivedAt` nulo (D-27); **autoria** — quem escreveu sempre alcança o que escreveu. "Já abriu" (`QuestOpen`) **não** é caminho: é histórico, não chave. Vale em **seis** portas: `saveAttempt`, `openQuest`, `readQuestDetail`, `checkQuest`, `reportQuest` e `askTutor`. |
| **R-8** | Recusa uniforme: `"Essa missão não existe."` para slug inexistente **e** para slug sem acesso, inclusive para conta anônima. Diferenciar transforma a ação em oráculo de existência (é a mesma regra do D-19 na recuperação de senha). |
| **R-9** | O prompt do tutor **não recebe `title` nem `brief` de missão `professor:`**. Recebe descritores calculados e os **rótulos gerados** dos objetivos. Texto de professor não sai do servidor — nem para o Gemini, nem para log, nem para mensagem de erro. |
| **R-10** | Editar título/enunciado/dicas de uma `TeacherQuest` invalida o cache: `db.tutorHint.deleteMany({ where: { questSlug } })`. |
| **R-11** | `readClassroomBoard` e o quadro por lista filtram `questSlug: { in: [...catálogo, ...slugs dos itens desta turma] }`. Slug `professor:` de outra turma não é lido, não é resolvido e não aparece — nem como título, nem como id. |
| **R-12** | Tetos, conferidos **dentro de transação**: 200 `TeacherQuest` ativas por professor (desarquivar também conta) · 50 `Assignment` ativas por turma · 30 itens por lista · 10 objetivos por missão · `answerMolblock` ≤ 20 KB **e** ≤ 100 átomos pesados (contados de `analysis.molecule`, nunca do cliente) · 200 salvamentos de autoria por dia por professor · 10 denúncias por conta por dia. |
| **R-13** | Título ≤ 80, enunciado ≤ 500, dica ≤ 200, no máximo 3 dicas. Normalizar NFC; recusar controles `U+0000–U+001F` menos `\n`; colapsar mais de duas quebras seguidas; remover bidi `U+202A–U+202E` e `U+2066–U+2069`. |
| **R-14** | Enunciado e dicas são **nó de texto**. Sem markdown, sem HTML, sem auto-link. `http://` e `https://` são **recusados**: não existe moderação, e o leitor é menor de idade. |
| **R-15** | `joinClassroom` tem teto de 10 códigos errados por hora por conta. O prêmio de adivinhar um código é ler o material publicado de uma turma. |
| **R-16** | `questSlug` em toda ação é `z.string().min(1).max(80)` — recusado por schema antes de tocar o banco. |
| **R-17** | `checkQuest` confere **sem gravar**: conta anônima é recusada antes de qualquer trabalho — nem RDKit, nem missão resolvida —, e o teto de 120 conferências por conta por minuto é contado antes de resolver a missão e antes do RDKit; molblock inválido conta. Recusa não entra em cache no cliente. |
| **R-18** | Publicar no catálogo exige `Profile.institution` preenchida e missão não arquivada; a busca (`readCatalog`) indexa título e rótulos gerados, sem acento e sem caixa, e serializada nunca contém `answerInchiKey`, molblock nem `condition`. |

### 5.2 As ações

| Ação | Quem pode | Devolve | Não devolve |
|---|---|---|---|
| `createAssignment` `{ classroomId, title }` | professor dono da turma (R-5) | `{ status:'created', id }` | — |
| `renameAssignment` | dono da lista | `{ status:'ok' }` | — |
| `createTeacherQuest` `{ assignmentId, title, brief, hints[0..3], molblock, goalIds[1..10] }` | dono da lista | `{ status:'created', questSlug, position }` | condição nenhuma; nem eco do molblock |
| `updateTeacherQuestText` | dono da missão | `{ status:'ok' }` | — |
| `archiveTeacherQuest` / `unarchiveTeacherQuest` | dono da missão | `{ status:'ok' }` | — |
| `addItem` `{ assignmentId, questSlug }` | dono da lista **e** dono da missão (R-6) | `{ status:'added', position }` | — |
| `moveItem` `{ assignmentId, itemId, direction }` | dono da lista | `{ status:'ok' }` | — |
| `removeItem` `{ assignmentId, itemId }` | dono da lista | `{ status:'ok' }` | — |
| `publishAssignment` | dono da lista, com ≥ 1 item | `{ status:'published', at }` | — |
| `archiveAssignment` / `unarchiveAssignment` | dono da lista | `{ status:'ok' }` | — |
| `readAssignments` `{ classroomId, includeArchived? }` | dono da turma | listas com itens `{ id, position, questSlug, title, origin }`, `publishedAt`, `archivedAt` | `answerMolblock`, `answerInchiKey` (R-3) |
| `readAssignmentBoard` `{ assignmentId }` | dono da lista | `{ items, students: { name, cells: 'met'\|'stuck'\|'untouched'[] }[], hardest }` | molécula nenhuma (D-22) |
| `readStudentAssignments` | aluno logado, matriculado | listas **publicadas** das turmas dele: `{ title, classroomName, items: { position, questSlug, title, byTeacher, goals }[] }` | a resposta, e `condition` quando a missão tem `inchiKey` (R-4) |
| `readQuestDetail` `{ questSlug }` | qualquer conta com acesso (R-7) | título, enunciado, dicas, objetivos `{ id, label }`, autoria | a resposta |
| `checkQuest` `{ questSlug, molblock }` | conta com acesso (R-7, R-17) | veredito objetivo a objetivo, sem gravar | — |
| `publishToCatalog` / `withdrawFromCatalog` | dono da missão (R-18) | `{ status:'ok' }` | — |
| `reportQuest` `{ questSlug, reason ≤ 200 }` | conta com acesso à missão | `{ status:'ok' }` | — |
| `readCatalog` `{ query? }` | qualquer conta | `{ slug, title, track?, byTeacher, labels }[]` | resposta, InChIKey, condição (R-18) |

**Ações de outros arquivos que participam:** `saveAttempt` e `openQuest` (`attempt.ts`) usam
`resolveQuest` e `studentQuestAccess` (R-7, R-8, R-16); `askTutor` (`tutor.ts`) e `buildPrompt`
(`lib/tutor/prompt.ts`) obedecem R-7 e R-9; `readClassroomBoard` (`classroom.ts`) obedece R-11.

**O tipo do payload do aluno não tem os campos da resposta.** Não é "presente e não usado": não
existe no tipo. O `typecheck` faz parte da garantia.

---

## 6. Telas

Todo texto abaixo está em `apps/web/app/turmas/messages.ts`. Tokens de `packages/ui`, zero hex
solto, zero cor CPK em botão, borda ou estado.

### 6.1 Professor — a porta de entrada, em `/turmas/[id]`

Seção `Listas da turma` **entre** o título da turma e "Onde a turma travou", com o botão
`Nova lista`. Cada linha: nome (link) · chip de estado · `{n} missões` · data. Chip:
`rascunho · só você vê` ou `publicado`. Abaixo, `Listas arquivadas (n)`, com `Desarquivar`.

Vazio:
> **Nenhuma lista ainda.**
> Uma lista é a sequência de missões de uma aula. Você escolhe do catálogo, cria as suas
> desenhando a resposta, ou mistura os dois.

Rodapé da seção:
> O aluno só vê a lista depois de publicada. Rascunho é seu.

### 6.2 Professor — a lista, em `/turmas/[id]/listas/[assignmentId]`

Cabeçalho: o nome em campo editável (`Nome da lista`, placeholder
`Funções oxigenadas — 3ª série`), gravado ao sair do campo. Abaixo:
`Rascunho · 3 missões · só você vê` ou `Publicado em 28 ago · 3 missões · 12 alunos na turma`.

Uma linha por item, colunas `posição | título + origem | ações`:

- posição em `--font-mono`, `tabular-nums`;
- origem: `catálogo` ou `sua missão`; para a missão própria, ainda `no catálogo` /
  `fora do catálogo` e o botão `Publicar no catálogo` / `Retirar do catálogo` (D-27);
- ações `Subir`, `Descer`, `Remover`, alvos de `--tap-min`, com `aria-label`
  `Subir «Cheiro de fruta» para a posição 2`. Com a linha em foco, `Alt+↑`/`Alt+↓` fazem o mesmo.
  Primeiro item sem `Subir`, último sem `Descer`.

Subir/descer e não arrastar: arrastar não tem alvo de teclado, é hostil no toque e não sobrevive
a lista com rolagem.

`Remover` some a linha na hora, sem esperar o servidor, com desfazer inline por 8 s:
`«Cheiro de fruta» saiu da lista.` · `Desfazer`. Desfazer devolve à posição de origem.

Abaixo: `Escolher do catálogo` · `Criar missão desenhando`. No rodapé: **`Publicar para a
turma`**, e `Arquivar lista` / `Desarquivar lista`.

Vazio:
> **Esta lista ainda não tem missão nenhuma.**
> Escolha do catálogo, ou desenhe a resposta e crie a sua.

**Catálogo** — popover ancorado no botão, com rolagem interna. Filtros de trilha: `Todas`
`Estrutura` `Geometria` `Propriedade` — **não existe chip Otimização**, porque aquela trilha não
tem missão (D-09). Missão já na lista aparece marcada e desabilitada, com `já está na lista`.
Rodapé: `Acrescentar (2)` · `Cancelar`. Vazio pelo filtro: `Nenhuma missão desta trilha fora da
lista.`

**Publicar** — popover no próprio botão:
> **Publicar para 3º A — manhã?**
> 3 missões, nesta ordem. A partir daqui a turma vê a lista e os objetivos das suas missões ficam
> travados — mudar objetivo mudaria a nota de quem já tentou.
> `Publicar` · `Cancelar`

Depois de publicada:
> Publicado. Título, enunciado e dicas continuam editáveis; objetivo, não. Para cobrar outra
> coisa, duplique a missão.

### 6.3 Professor — "Criar missão desenhando", em `.../listas/[assignmentId]/criar`

A bancada é **a mesma**: o professor desenha exatamente como o aluno desenha. A `TopBar` mantém
os 46 px e troca o agrupamento da direita por `Criando missão · {nome da lista}` + `Autoria` +
`Cancelar` + `Salvar missão`. O painel abre na aba **`Autoria`**, que **substitui** a aba
`Missões` — aqui não se resolve missão, se escreve uma.

**(a) Estrutura lida** — `A resposta que você desenhou`, a fórmula por `<Formula>`, o selo
`calculado`. **Não existe selo âmbar nesta tela** — nada aqui passa por modelo de linguagem.

> A molécula-resposta fica guardada dentro da missão, não na sua estante. O aluno nunca a recebe.

**(b) Objetivos que dá para cobrar** — quatro blocos, `a molécula` · `fórmula` ·
`grupos funcionais` · `átomos e contagens`, cada linha uma caixa de `--tap-min` com o rótulo da
§4.2 e o valor medido à direita. Contador acima: `2 de 9 objetivos marcados`.

Aviso do InChIKey, sempre visível na linha `é exatamente esta molécula`:
> **Marcado, este é o único objetivo da missão.** A nota vira 0 ou 100 e um isômero parecido não
> vale nada. Para aceitar mais de uma resposta certa, cobre grupos e contagens em vez desta.

Ao marcar, os outros ficam desabilitados, com uma frase só no topo:
`desligado enquanto você cobra a molécula exata`.

Sob as contagens:
> Rotacionáveis na definição estrita do RDKit. O PubChem conta de outro jeito, e cada um está
> certo dentro da própria definição.

Fecho:
> Esta lista saiu da molécula que você desenhou. Não dá para acrescentar objetivo escrevendo — o
> que o aluno vai ter de cumprir é sempre o que o RDKit mediu aqui.

**(c) O que você escreve** — `Título da missão`, `Enunciado` com a ajuda
`Fale de química, não de interface: o aluno lê isto antes de desenhar.` e a linha que o
`security` pediu:

> O enunciado é lido pela turma inteira. Não escreva o nome de nenhum aluno.

`Dicas (até 3)`, uma de cada vez, com `Uma de cada vez, na ordem. O aluno só vê a dica quando
pede — dica dada antes da tentativa não ensina.`

**(d) Rodapé** — `Salvar missão` e a leitura `2 objetivos · 1 dica`. `Cancelar` abre popover:
`Sair sem criar a missão? O desenho não fica guardado.` Salvar volta à lista com a faixa
`«O álcool do dia a dia» entrou na lista, na posição 3.` — que some assim que a lista é mexida.

### 6.4 Aluno — "Da sua turma", no `QuestPanel`

**Acima** do seletor do catálogo, porque é o que a aula está fazendo agora:

```
DA SUA TURMA                                    2 de 5 cumpridas
Funções oxigenadas — 3ª série · 3º A — manhã

[✓] 1  O primeiro traço
[✓] 2  O álcool do dia a dia
[ ] 3  O ácido do vinagre        ← em curso
[ ] 4  Cheiro de fruta
[ ] 5  O hexágono que não alterna
```

Linhas de `--tap-min`, `role="radio"`. Missão do professor mostra `missão do seu professor`
embaixo do título. **Sem cadeado:** qualquer item abre em qualquer ordem.

Abaixo, o link `Catálogo` e o `<select>` do catálogo do produto. Quando o slug em curso é
missão de professor, o `<select>` mostra uma opção desabilitada `Da sua turma · O ácido do
vinagre`, para nunca exibir um estado que não é verdade.

> O catálogo é livre: dá para explorar por conta, mesmo fora da lista.

Missão sem condição local (InChIKey, ou alcançada só pelo catálogo) mostra `conferindo…` em cada
objetivo até `checkQuest` responder — nunca "por cumprir", porque o cliente não tem como saber.

Ao cumprir, além do que já existe:
> **Cumprida. Faltam 2 na lista.**
> `Próxima: Cheiro de fruta →`

No último item:
> **Cumprida. Você fechou a lista «Funções oxigenadas — 3ª série».**

Missão de professor traz ainda a autoria (`missão de Professora Ana · EE Dom Pedro II`) e o
botão `Denunciar`, que abre `Motivo da denúncia` em uma linha, `Enviar denúncia` · `Cancelar`,
e responde `Recebido.`

**Nunca aparece:** posição na turma, quantos colegas cumpriram, quem cumpriu antes, tempo
comparado (D-22).

### 6.5 Professor — o quadro, por lista

Um bloco por lista **publicada e não arquivada**, entre a seção "Listas da turma" e o "Onde a
turma travou" geral.

Topo — `ONDE A TURMA TRAVOU NESTA LISTA`, o `hardest` restrito aos slugs da lista. Mantém a
nota:
> Travar é ter tentado e não ter cumprido — quem nem abriu não conta aqui.

A matriz: linha por aluno, coluna por **número de posição** (com `title` do título inteiro e
legenda numerada abaixo — cinco títulos de missão não cabem em largura nenhuma, e o número é o
mesmo que o aluno vê). Três estados, cada um com **forma além da cor** (cor sozinha não passa em
deuteranopia nem em projetor de sala):

| Estado | Marca | Cor | `aria-label` |
|---|---|---|---|
| cumpriu | `✓` em círculo cheio | `--ok` / `--ok-wash` | `Ana, item 3: cumpriu` |
| travou | `•` em anel | `--warn` / `--warn-wash` | `Ana, item 3: travou` |
| não abriu | `–` sem anel | `--ink-400` / `--sunk` | `Ana, item 3: não abriu` |

Legenda fixa acima: `✓ cumpriu · • travou (abriu e não cumpriu) · – não abriu`. Últimas colunas:
`cumpridas` → `3 / 5` e `última vez`. Rodapé:
> O que aparece aqui é progresso de missão, avaliado no servidor a cada tentativa. As moléculas
> que o aluno desenhou não entram nesta tela.

### 6.6 Vazios e erros — textos exatos

**Vazios**

| Onde | Texto |
|---|---|
| Turma sem lista (professor) | **Nenhuma lista ainda.** Uma lista é a sequência de missões de uma aula. Você escolhe do catálogo, cria as suas desenhando a resposta, ou mistura os dois. |
| Lista sem itens | **Esta lista ainda não tem missão nenhuma.** Escolha do catálogo, ou desenhe a resposta e crie a sua. |
| Catálogo filtrado sem sobra | Nenhuma missão desta trilha fora da lista. |
| Turma sem aluno — a mesma frase no resumo do topo e no quadro por lista | Ninguém entrou ainda. Escreva o código no quadro. |
| Lista publicada, ninguém abriu | Ninguém abriu nenhuma missão desta lista ainda. |
| Aluno, turma sem lista publicada | **Seu professor ainda não publicou nenhuma lista.** Enquanto isso, o catálogo aqui embaixo é todo seu. |
| Aluno sem turma | Você ainda não está em nenhuma turma. Com o código que o professor passa, a lista da aula aparece aqui. |
| Catálogo sem resultado | Nenhuma missão encontrada. |

**Erros**

| Situação | Texto |
|---|---|
| RDKit recusou a resposta | **{a mensagem do RDKit, como ela já sai}** — p. ex. *O átomo de C tem 5 ligações, mas suporta no máximo 4.* Seguida de: `Enquanto a estrutura não fechar, não há objetivo nenhum para extrair. Corrija o desenho e a lista volta sozinha.` |
| Nada desenhado | Desenhe a resposta. Os objetivos que dá para cobrar saem dela. |
| Nenhum objetivo marcado | **Marque pelo menos um objetivo.** Sem objetivo, a missão não teria como ser cumprida — nem errada. |
| Título ou enunciado vazio | A missão precisa de um título e de um enunciado. O aluno lê isto antes de desenhar. |
| **R-2** — a própria resposta não cumpre | **Esta missão não é cumprida nem pela sua própria resposta.** O objetivo «{rótulo}» não fecha com a molécula que você desenhou, então ninguém conseguiria cumpri-la. Nada foi salvo: desmarque esse objetivo ou ajuste o desenho. |
| **R-1** — objetivo que não saiu da molécula | **Um dos objetivos não veio da molécula desenhada e foi recusado.** |
| Slug repetido | «{título}» já está nesta lista. A mesma missão duas vezes contaria o progresso duas vezes. |
| Publicar lista vazia | Não dá para publicar uma lista vazia. Acrescente pelo menos uma missão. |
| Editar objetivo depois de publicado | Esta lista já foi publicada: título, enunciado e dicas continuam editáveis, os objetivos não. Mudar objetivo mudaria a nota de quem já tentou. Para cobrar outra coisa, duplique a missão. |
| **R-7/R-8** — aluno sem acesso, ou slug inexistente | Essa missão não existe. |
| Aluno anônimo em slug de professor | Missão de turma precisa de conta. [Entre na sua conta] para abrir a lista. |
| **R-12** — teto de missões | Você chegou ao limite de {n} missões próprias. Arquive as que não usa mais — arquivar não apaga, e as listas que já as usam continuam funcionando. |
| **R-12** — resposta grande demais | A resposta tem {n} átomos. Uma missão de aula cabe em até 100 — a geometria acima disso não roda no celular do aluno. |
| **R-14** — link no enunciado | O enunciado não aceita link — cole o endereço no quadro ou no material da escola. |
| Lista arquivada | Esta lista foi arquivada. Ela some das duas telas até você desarquivar. |

### 6.7 O token que esta entrega criou

`--tap-min: 44px` em `packages/ui/src/tokens.css`, no bloco de forma do `:root`, fora de qualquer
`@media` e de `[data-theme]` — é medida, não cor. Alvo mínimo de toque: escola pública em
aparelho fraco é o caso de uso, e qualquer coisa que se toca mede isto no menor lado.

### 6.8 Toque e celular

- Aluno: toda linha de item, todo `Próxima`, toda caixa em `--tap-min`, com `--sp-2` entre
  alvos. Nada depende de `:hover` — "em curso" é borda e fundo permanentes. A faixa `Próxima:` é
  largura total abaixo de 480 px.
- Professor: abaixo de 720 px a lista empilha em duas colunas e as três ações viram uma linha
  própria. A matriz rola na horizontal **com a primeira coluna fixa** (`position: sticky`) — sem
  isso, ao rolar até o item 5 não se sabe mais de quem é a linha.
- `prefers-reduced-motion` zera a animação de reordenar e a do popover. Nada aqui é física, então
  nada se perde.

---

## 7. Os testes, um por regra

`apps/web/app/actions/assignment.test.ts`, contra o Postgres — pula avisando quando não há banco,
falha com `REQUIRE_DATABASE=1` (é assim no CI). O nome de cada teste diz o que ele protege:

- **R-5** `conta de aluno não cria missão nem lista` · `professor não adiciona item em lista de
  outro professor` · `aluno promovido a professor não publica na turma em que ele é aluno` ·
  `outro professor não desarquiva lista alheia`
- **R-6** `professor não adiciona à própria lista uma missão de outro professor`
- **R-7** `aluno da turma B tem a tentativa recusada no slug da turma A` (e nada gravado em
  `Attempt`) · `rascunho não publicado não é aberto por aluno matriculado` · `turma arquivada
  deixa de dar acesso à lista` · `quem já abriu e está fora de qualquer lista perde o acesso` ·
  `retirado do catálogo mas presente numa lista publicada da turma do aluno: continua` · `autor
  lê a própria missão não publicada em lista nenhuma, nem catalogada` · `outro professor não
  alcança a missão não publicada de um colega` · `missão catalogada é alcançada; a mesma turma,
  sem catalogar, não é`
- **R-3** `resposta ao aluno não contém answerMolblock nem answerInchiKey` — sobre a **string**
  serializada · `readCatalog serializado não contém answerInchiKey, molblock nem condition`
- **R-4** `missão com objetivo de InChIKey não manda condição ao cliente`
- **R-1 / R-2** `objetivo forjado que não está na lista regerada é recusado` · `candidato
  forjado cuja condição não fecha é recusado, e a razão nomeia o objetivo` · `butan-2-ol sem
  cunha: o candidato de configuração pendente nem é oferecido` · `butan-2-ol com cunha (centro
  configurado): o candidato aparece, e a missão é criada`
- **R-13 / R-14** `enunciado acima de 500 caracteres é recusado` · `enunciado com HTML sai como
  texto na tela (e2e) e enunciado com link é recusado`
- **R-12** `lista recusa o trigésimo primeiro item` · `resposta com mais de 100 átomos pesados é
  recusada, com mensagem de química` · `com 200 missões ativas, desarquivar uma missão a mais é
  recusado` · `com 50 listas ativas na turma, desarquivar uma lista a mais é recusado` ·
  `reportQuest grava a denúncia e recusa a décima primeira do dia`
- **R-8** `slug inexistente e slug sem matrícula devolvem a mesma recusa` · `conta anônima recebe
  a mesma recusa para um slug real e para um forjado` · `conta sem acesso à missão recebe a recusa
  uniforme, sem gravar denúncia`
- **R-11** `quadro da turma A não mostra missão da turma I`
- **R-9 / R-10** `prompt do tutor não contém o enunciado do professor` — sobre a string de
  `buildPrompt` · `atualizar título, enunciado ou dicas apaga o TutorHint desta missão`
- **R-15** `a décima primeira tentativa de código errado é bloqueada`
- **R-16** `slug maior que 80 caracteres é recusado por schema, antes de tocar o banco`
- **R-17** `chama três vezes seguidas e nenhum Attempt é gravado` · `sem conta, checkQuest recusa
  antes de qualquer trabalho — nem RDKit, nem missão resolvida` · `o teto de 120/minuto por conta
  é contado antes de resolver a missão e antes do RDKit; molblock inválido conta`
- **R-18 / D-27** `missão nasce fora do catálogo: catalogedAt nulo` · `publicar sem instituição
  é recusado, e catalogedAt continua nulo` · `readCatalog sempre traz institution preenchida` ·
  `a busca por "ester" acha a missão cujo rótulo é "tem pelo menos 1 grupo éster"`
- **§3.5** `arquiva, tenta publicar (recusa nomeando o caminho), desarquiva, publica (ok)` ·
  `arquiva, lê a lista de listas (some), desarquiva, volta a aparecer` · `com includeArchived:
  true, também devolve a lista arquivada, marcada por archivedAt`

`packages/quests/test/extract.test.ts` cobre a extração: etanol, aspirina e cafeína (com as duas
amidas e o imidazol aromático — 4 N, 2 anéis, **2 aromáticos**, o caso de referência do
`CLAUDE.md`), os rótulos caractere a caractere, os contínuos ausentes, o `id` determinístico e o
`:` travado em slug de catálogo. `assessable.test.ts` prova que `evaluateQuest` devolve o mesmo
veredito para uma `Quest` de catálogo e para um `Assessable` com os mesmos `goals`.

**Nenhuma dependência nova.** `extractGoals` é TypeScript puro sobre o que o RDKit já calculou;
enunciado e dicas são nó de texto, sem sanitizador nem renderizador de markdown (R-14).

---

## 8. O e2e que prova a entrega

`apps/web/e2e/listas.spec.ts` — **um teste só**, o caminho inteiro, em desktop e em celular. Se
ele passa, a entrega existe:

1. Promover uma conta a professor pelo `scripts/promote-teacher.mjs`.
2. A professora cria a turma `3º A — manhã` e guarda o código.
3. Em `/turmas/[id]`, `Listas da turma` mostra **Nenhuma lista ainda.**
4. `Nova lista` → `Funções oxigenadas — 3ª série`. A tela mostra
   `Rascunho · 0 missões · só você vê`.
5. `Escolher do catálogo` → `O primeiro traço` → `Acrescentar (1)`. Posição 1, origem `catálogo`.
   `Remover` some a linha **antes** de o servidor responder; `Desfazer` a traz de volta.
6. `Criar missão desenhando` → `Criando missão · Funções oxigenadas — 3ª série`, painel na aba
   `Autoria`.
7. Etanol pela entrada de SMILES. O painel mostra `C₂H₆O` e o selo `calculado`. Marcar
   `é exatamente esta molécula` desliga os demais com uma frase só; desmarcar libera.
8. Marcar `tem pelo menos 1 grupo álcool` e `tem exatamente 2 átomos de C`. Título
   `O álcool do dia a dia`; enunciado `Monte um álcool com dois carbonos.`; uma dica.
9. `Salvar missão` → `«O álcool do dia a dia» entrou na lista, na posição 2.`, origem `sua
   missão`. Subir e descer o item apaga a faixa, mesmo de volta à posição 2.
10. `Publicar para a turma` → confirmar → `Publicado em`. `Publicar no catálogo` →
    `Retirar do catálogo`. O chip da lista na turma diz `publicado`, e a frase de turma sem aluno
    é a mesma no resumo e no quadro por lista.
11. **Aluno da turma** cria conta, entra com o código, vê `DA SUA TURMA` com os dois itens,
    `0 de 2 cumpridas` e `missão do seu professor`.
12. Resolve o item 1 → `Próxima: O álcool do dia a dia →`. Metanol, propan-1-ol e butan-1-ol
    (válidos, mas errados) **não** geram `saveAttempt`. Etanol → `Cumprida. Você fechou a lista
    «Funções oxigenadas — 3ª série».`, e exatamente um `saveAttempt`.
13. **Nenhuma resposta que o navegador do aluno recebeu na sessão inteira** — HTML, payload RSC
    ou retorno de ação — contém a InChIKey do etanol nem a assinatura `V2000` (R-3, R-4). A
    varredura exige pelo menos cinco corpos, um deles vindo de ação de servidor.
14. **Aluna de outra turma** busca `álcool` em `/catalogo`, encontra a missão com `missão de
    Professora Ana · EE Dom Pedro II`, resolve, e `Denunciar` → `Recebido.` (D-27).
15. A professora volta e vê `2 / 2` no quadro — e a página dela não contém SMILES, fórmula nem
    molblock (D-22).
16. Arquivar a lista → `Listas arquivadas (1)`, em `tabular-nums`.

---

## 9. As perguntas que a especificação fez, e as respostas

Respondidas pelo dono do produto em 28/08/2026 (D-26) e fechadas no mesmo dia (D-27):

1. **Nota de lista não sai do produto.** Sem exportar, sem CSV, sem prazo. Continua sendo
   progresso, no vocabulário do D-22.
2. **Professor publica conteúdo lido por menor de idade, e a mitigação é o D-19** — o papel é
   dado por quem administra a instância ou por um administrador da própria escola (D-29), nunca
   autodeclarado. Com o catálogo compartilhado entraram autoria visível e denúncia (D-27). E
   revogar o papel **retira do catálogo** o que aquela conta publicou (D-29): enquanto não retirava,
   a mitigação tirava o acesso de quem escreveu e deixava o texto no ar.
3. **O catálogo de missões do produto continua livre**: qualquer pessoa, com conta ou sem, abre
   missão de catálogo. O catálogo **buscável** (`/catalogo`), que junta as do produto e as de
   professor publicadas, é de quem tem conta. O aluno com professor vê a lista da turma primeiro
   e o catálogo abaixo; o aluno sem professor vê o catálogo.
4. **A palavra da tela é "lista"**, sem consultar o professor. Se a sessão de observação mostrar
   outra palavra, troca-se `messages.ts`.
