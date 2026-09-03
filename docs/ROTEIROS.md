# Listas da turma — o professor monta, o aluno resolve

> Especificação de entrega do **D-25**. Este documento é o que o `backend`, o `frontend` e o
> `reviewer` executam sem precisar do `pm` por perto: modelo de dados, contrato das ações,
> textos de tela, ordem das tarefas e o teste que prova que a coisa está de pé.
>
> O arquivo se chama `ROTEIROS.md` porque foi assim que a tarefa nasceu. A palavra da tela é
> **lista**, e o porquê está na §2.

---

## 1. O que é, e o que não é

O professor monta uma **lista**: um punhado de missões, na ordem dele, com um nome
("Funções oxigenadas — 3ª série"), dentro de uma turma que já existe. Ele escolhe do catálogo,
cria as dele **desenhando a resposta**, ou mistura os dois; publica quando quiser, e a partir daí
a turma vê a lista no painel de missões, na ordem em que ele pôs. O aluno resolve como sempre
resolveu — o motor de missões avalia, o servidor reavalia, a nota sai do RDKit. O professor
acompanha no quadro que já existe: quem cumpriu, quem travou, quem não abriu. Progresso, nunca
molécula (D-22).

A parte que decide química **nunca é digitada**. O professor desenha a molécula-resposta, o RDKit
a analisa, o produto extrai dela os objetivos verificáveis e ele marca quais quer cobrar. Ele
escreve título, enunciado e dicas — texto, que é o que um professor sabe escrever melhor que
nós. Objetivo escrito à mão não existe neste produto, e é isso que impede a missão impossível
("um álcool com fórmula C₂H₄O") de chegar à sala.

**O que ficou de fora, e por quê:**

| Fora | Razão |
|---|---|
| Prazo de entrega | Traz fuso, atraso, entrega fora do prazo e nota parcial. A pergunta do quadro é onde a turma parou, não quem entregou a tempo (D-22). |
| Nota que vira nota escolar, exportação, CSV, boletim | A nota é proporcional a objetivos cumpridos; virar avaliação escolar é promessa pedagógica que escola nenhuma pediu ainda. Pergunta da Fase 3. |
| Copiar lista entre turmas, compartilhar entre professores | Publicar conteúdo de um professor para outro exige autoria e moderação, e o leitor é menor de idade. Adiado no `DEPOIS.md`. |
| Missão com mais de uma resposta certa (composição de `some`) | Exigiria um editor de condição — exatamente o que o D-25 evita. Já existe caminho: cobrar grupo e contagem em vez de InChIKey aceita muitas respostas. Isso precisa estar dito na tela de autoria. |
| Cadeado / pré-requisito entre itens | Missão que só abre depois de outra quebra a aula do professor que quer começar por onde quer. Classroom e Khan também não trancam por padrão. |
| Grafo de conceitos (`teaches`/`requires`) | Depende do plano de ensino do Idelcio, que o `DEPOIS.md` diz custar zero e decidir tudo. Desenhar a ordem antes de ler o plano é adivinhar. |
| Tour de primeira visita | O `DEPOIS.md` já decidiu: depois das sessões de observação, e não é missão — missão verifica molécula, não gesto. |
| Tempo por item e número de tentativas no quadro | `Attempt.elapsedMs` e a contagem de linhas já existem, e a grade por item é a tela que convida a mostrá-los. Três estados por célula, e ponto. Passar disso é o D-22 virando boletim sem ninguém ter decidido. |

**A trilha Otimização continua sem missão** (D-09). Ela não aparece no seletor de trilha do
catálogo, e nenhuma lista tem como conter item dela.

---

## 2. Vocabulário

O `researcher` mediu como o professor brasileiro já fala: o Google Classroom — que é o que ele
abre todo dia — chama o item de **atividade** e o agrupamento de **tópico**; em ciências exatas o
conjunto é coloquialmente **lista de exercícios**. E levantou o risco certo: em química,
"roteiro" é palavra ocupada — roteiro de experimento, de bancada. O professor que abre esperando
prática de laboratório perdeu a primeira impressão.

**Decisão: a tela diz "lista".** O código continua em inglês, `Assignment`, como manda a casa.

| A coisa | Na tela (pt-BR) | No código | O que nunca dizer |
|---|---|---|---|
| O conjunto ordenado que o professor monta | **lista** — "Nova lista", "Listas da turma" | `Assignment` | roteiro, tópico, trilha, módulo |
| Uma posição dentro da lista | **item** (na fala do quadro: "o item 3") | `AssignmentItem` | atividade, tarefa |
| O que o aluno resolve, dentro ou fora da lista | **missão** — a palavra que o produto já usa | `Quest` / `TeacherQuest` | exercício, questão |
| Missão escrita pelo professor | **sua missão** (para ele), **missão do seu professor** (para o aluno) | `TeacherQuest` | missão customizada, missão personalizada |
| A molécula que o professor desenhou para criar a missão | **a resposta** | `answerMolblock` | gabarito (é o que ela é, mas não se escreve na tela do professor: ele não está corrigindo prova) |
| Tornar a lista visível para a turma | **publicar** | `publishedAt` | liberar, atribuir, enviar |
| Lista não publicada | **rascunho · só você vê** | `publishedAt = null` | privado, oculto |
| Os três estados do quadro | **cumpriu · travou · não abriu** | `met` / `stuck` / `untouched` | nota, média, melhor, ranking |

Uma palavra por coisa. "Missão" não vira "exercício" no meio do caminho, e "lista" não vira
"roteiro" na frase seguinte.

**Todo texto de tela desta entrega vive num arquivo só:**
`apps/web/app/turmas/messages.ts` — chaves em inglês, textos em pt-BR. É o que impede a mesma
frase divergir entre a server action e o componente, e é o único arquivo a editar se a resposta
do Idelcio mudar a palavra.

**O que ainda pode mudar.** O plano de ensino do Idelcio não está no repositório
(`docs/pesquisa/` tem só `README.md` e `nomenclatura.md`), então "como ele chama isso" é pergunta
a ele, não a um documento. Se ele disser "atividade" ou "lista de exercícios", troca-se o mapa de
textos e nada mais. **O modelo de dados não espera essa resposta.**

---

## 3. Modelo de dados

Três modelos novos. **Nenhuma coluna existente muda**, e a migração é puramente aditiva.

### 3.1 `TeacherQuest` — a missão que o professor criou

```prisma
/// Uma missão escrita por um professor.
///
/// O que decide química aqui não foi digitado: `goals` só contém condições que
/// saíram de `extractGoals` sobre `answerMolblock`, reanalisado pelo RDKit no
/// servidor no momento de salvar (D-25). Título, enunciado e dicas são texto do
/// professor e não entram em nenhuma conta.
model TeacherQuest {
  id             String    @id @default(cuid())
  teacherId      String
  title          String
  /// O enunciado. Texto puro: sem HTML, sem markdown, sem link.
  brief          String
  /// `string[]`, no máximo 3, na ordem em que são liberadas.
  hints          Json
  /// `Goal[]` — a mesma forma do pacote `quests`: id, label e condition.
  /// Só os objetivos escolhidos; candidato não escolhido não é guardado.
  goals          Json
  /// A resposta que o professor desenhou. **Nunca sai para o cliente do aluno.**
  answerMolblock String
  answerInchiKey String
  createdAt      DateTime  @default(now())
  /// Quem publica conteúdo lido por menor de idade deixa rastro de quando
  /// escreveu — enunciado é editável depois de publicado.
  updatedAt      DateTime  @updatedAt
  /// Arquivar tira do seletor e não tira de mais nada. Apagar não existe.
  archivedAt     DateTime?

  teacher Profile @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@index([teacherId])
}
```

**Por que `goals` é `Json` e não tabela.** É a mesma forma do `Goal` do pacote `quests`, lida por
uma função só (`resolveQuest`) e nunca consultada por dentro. Tabela de condição seria um editor
de condição relacional — a coisa que o D-25 existe para não construir.

**Por que a resposta fica em coluna própria, e não passa por `rememberMolecule`.** A estante de
moléculas é do usuário; o professor não pediu para guardar nada, e se ele limpar a estante
depois, a missão não pode quebrar. Consequência que vale escrever em voz alta: **`answerMolblock`
é gabarito**, e gabarito não entra em `select` de caminho de aluno — em nenhum.

**Por que só os objetivos escolhidos são persistidos.** Guardar a lista inteira de candidatos e
filtrar na leitura é a mesma falha adiada: o candidato não escolhido descreve a resposta muito
além do que foi cobrado — o professor cobra "tem um álcool" e o candidato guardado entrega a
fórmula exata.

### 3.2 `Assignment` — a lista

```prisma
/// A sequência de missões de uma aula, dentro de uma turma.
model Assignment {
  id          String    @id @default(cuid())
  classroomId String
  /// Quem criou. Fica separado do dono da turma porque a autoria do conteúdo é
  /// pergunta de escola, e coluna esquecida não se recupera depois.
  createdById String
  title       String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  /// Enquanto for nulo, é rascunho: o aluno não vê e não abre.
  publishedAt DateTime?
  archivedAt  DateTime?

  classroom Classroom        @relation(fields: [classroomId], references: [id], onDelete: Cascade)
  createdBy Profile          @relation(fields: [createdById], references: [id], onDelete: Cascade)
  items     AssignmentItem[]

  @@index([classroomId])
}
```

### 3.3 `AssignmentItem` — uma posição

```prisma
/// Um item da lista. `questSlug` é do catálogo (`primeiro-traco`) ou de uma
/// missão do professor (`professor:<TeacherQuest.id>`) — ver §3.4.
model AssignmentItem {
  id           String @id @default(cuid())
  assignmentId String
  /// 1, 2, 3… É o número que o aluno vê na lista e a coluna que o professor lê no quadro.
  position     Int
  questSlug    String

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@unique([assignmentId, position])
  @@unique([assignmentId, questSlug])
  @@index([questSlug])
}
```

`@@unique([assignmentId, questSlug])`: o mesmo slug duas vezes na mesma lista duplicaria o tique
do aluno, porque progresso é por `(profile, slug)`. O mesmo slug em **listas diferentes** é
permitido e esperado.

### 3.4 Como `Attempt` e `QuestOpen` passam a apontar para missão de professor

**Não mudam de forma.** `questSlug` continua sendo uma `String`, e ganha espaço de nomes:

```
missão do catálogo   →  primeiro-traco          (nunca contém `:`)
missão do professor  →  professor:clx8k2m0000...
```

O que muda é a resolução. `findQuest(slug)` continua existindo para o catálogo, e ganha por cima:

```ts
// apps/web/lib/quest-resolve.ts
export async function resolveQuest(slug: string): Promise<Assessable | null>;
```

- Despacha **pelo prefixo**, nunca "tenta catálogo, depois banco" — fallback deixaria uma missão
  de professor sombrear um slug de catálogo.
- Depois do prefixo, o resto precisa casar `/^[a-z0-9]{20,32}$/` (formato cuid) **antes** de
  tocar o banco. Não casou, devolve `null` sem consultar.
- Um teste em `packages/quests` trava `:` em slug de catálogo. Os dois espaços nunca se cruzam.

**Não há chave estrangeira** de `Attempt.questSlug` / `QuestOpen.questSlug` / `AssignmentItem.questSlug`
para `TeacherQuest.id`, porque o mesmo campo também guarda slug de catálogo, que não é linha de
banco (D-12). O preço disso é que missão apagada deixaria tentativa órfã — que é exatamente por
que **apagar não existe** (§3.5).

`readProgress`, `readClassroomBoard` e o painel de missões não mudam de assinatura: eles já
trabalham com `slug` opaco.

### 3.5 Regras de exclusão — nada apaga

| Situação | O que acontece |
|---|---|
| Professor arquiva uma missão dele (`archivedAt`) | Sai do seletor de "escolher missão minha". Lista que já a usa continua funcionando; tentativa antiga continua resolvendo o título. |
| Professor arquiva uma lista | Some das duas telas. Nada é apagado, e o `Attempt` continua contando no quadro geral da turma. |
| Turma arquivada | As listas dela somem junto, dos dois lados. Nada é apagado. |
| Missão já usada em lista **publicada** | **Objetivos deixam de ser editáveis.** Título, enunciado e dicas continuam. Para cobrar outra coisa, duplica-se a missão. |
| Conta do professor apagada | `onDelete: Cascade` leva missões e listas. É o comportamento do resto do schema, e é o que a LGPD espera. |
| Professor rebaixado a aluno | As escritas param na hora (`requireTeacher` lê o papel do banco a cada chamada). **As listas publicadas continuam funcionando para os alunos** — isto é intencional e está escrito aqui para ninguém "consertar" e derrubar a aula de trinta pessoas. |

**Por que objetivo publicado congela:** é o D-12 aplicado ao conteúdo do professor. Objetivo
editado mudaria a nota de quem já tentou, sem ninguém ter mexido em nada.

---

## 4. Extração de objetivos

**Arquivo novo:** `packages/quests/src/extract.ts`. Função pura, sem React, sem DOM, sem rede —
roda em Vitest de linha de comando como o resto do núcleo.

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
escolhido saiu mesmo da molécula (§5, R-1).

### 4.1 O que é oferecido

Tudo lido do que o RDKit já calculou em `analysis.molecule`.

| `kind` | Candidato | Condição gerada |
|---|---|---|
| `identity` | a molécula exata | `{ kind: 'inchiKey', value }` — **`exclusive: true`** |
| `formula` | a fórmula molecular | `{ kind: 'formula', value }` |
| `group` | um por grupo funcional encontrado | `{ kind: 'group', group, min: count }` |
| `count` | um por elemento da fórmula | `{ kind: 'atoms', element, min: n, max: n }` |
| `count` | `rings`, `aromaticRings`, `rotatableBonds`, `hbDonors`, `hbAcceptors`, `heavyAtoms`, `heteroatoms`, `stereocenters` | `{ kind: 'descriptor', descriptor, min: n, max: n }` |
| `count` | só quando há centro estereogênico | `{ kind: 'descriptor', descriptor: 'unspecifiedStereocenters', max: 0 }` |

**O que não é oferecido, e por quê:** `molarMass`, `exactMass`, `tpsa`, `logP`. São contínuos —
igualdade exata é armadilha, e faixa teria que ser digitada, que é justamente o que o D-25
proíbe. Descritor de contagem sai com `min = max = n`: é inteiro, e "exatamente 2 anéis" é uma
frase que um aluno entende.

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

### 4.4 A interface mínima que o motor passa a receber

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

Duas travas, as duas **no servidor**, no momento de salvar:

1. **Regeneração.** O molblock da resposta é reanalisado pelo RDKit, `extractGoals` roda de novo,
   e **só é aceito objetivo cujo `id` está na lista regerada**. O cliente manda `goalIds: string[]`,
   nunca `Condition`. Condição digitada não vira missão.
2. **A própria resposta cumpre.** `evaluateQuest({ slug, goals }, analysis.molecule)` precisa
   passar. Se não passar, a missão é recusada e o erro **nomeia o objetivo** que não fecha. É o
   que mata a missão impossível que o D-25 cita.

E a terceira, de linguagem: **rótulo de objetivo é gerado, não editável.** Rótulo editável
permitiria escrever "tem um éster" numa condição que verifica álcool — erro silencioso de
química, para uma sala inteira.

---

## 5. Ações de servidor

Tudo em `apps/web/app/actions/assignment.ts`, salvo o que diz outro arquivo. Toda entrada
validada por zod, como o resto da casa.

### 5.1 As regras, antes das ações

Estas são **regras**, não sugestões. Cada uma tem um teste na §7.

| # | Regra |
|---|---|
| **R-1** | Nenhuma `Condition` chega ao banco sem ter saído de `extractGoals` sobre a resposta reanalisada no servidor. O cliente manda `goalIds`. |
| **R-2** | Missão que a própria resposta não cumpre é recusada, com o rótulo do objetivo que não fecha. |
| **R-3** | `answerMolblock` e `answerInchiKey` não entram em nenhum `select` de caminho de aluno. Nenhum `findMany`/`findUnique` de `TeacherQuest` sem `select` explícito. |
| **R-4** | Missão com objetivo `inchiKey` **não manda `condition` ao cliente**: o cliente recebe `{ id, label }` e o veredito vem do servidor. Para os outros tipos, a condição não conta nada que o rótulo já não conte; a InChIKey conta tudo. |
| **R-5** | Papel é pré-requisito, **dono é a autorização**. `requireTeacher` sozinho não autoriza nada. Toda escrita começa por `ownedClassroom` / `ownedAssignment` / `ownedTeacherQuest`. |
| **R-6** | `addItem` confere **dois** donos: a lista é minha **e** a missão `professor:` é minha. |
| **R-7** | Acesso de aluno a slug `professor:` exige: matrícula viva → turma não arquivada → lista da turma → `publishedAt IS NOT NULL` e `archivedAt IS NULL` → item com aquele slug. Vale em **quatro** portas: `saveAttempt`, `openQuest`, a leitura da missão e `askTutor`. |
| **R-8** | Recusa uniforme: `"Essa missão não existe."` para slug inexistente **e** para slug sem matrícula. Diferenciar transforma a ação em oráculo de existência (é a mesma regra do D-19 na recuperação de senha). |
| **R-9** | O prompt do tutor **não recebe `title` nem `brief` de missão `professor:`**. Recebe descritores calculados e os **rótulos gerados** dos objetivos. Texto de professor não sai do servidor — nem para o Gemini, nem para log, nem para mensagem de erro. |
| **R-10** | Editar título/enunciado/dicas de uma `TeacherQuest` invalida o cache: `db.tutorHint.deleteMany({ where: { questSlug } })`. |
| **R-11** | `readClassroomBoard` e o quadro por lista filtram `questSlug: { in: [...catálogo, ...slugs dos itens desta turma] }`. Slug `professor:` de outra turma não é lido, não é resolvido e não aparece — nem como título, nem como id. |
| **R-12** | Tetos, conferidos **dentro de transação** (contar fora da transação é trava decorativa): 200 `TeacherQuest` ativas por professor · 50 `Assignment` por turma · **30** itens por lista · 10 objetivos por missão · `answerMolblock` ≤ 20 KB **e** ≤ 100 átomos pesados (contados de `analysis.molecule`, nunca do cliente) · 200 salvamentos de autoria por dia por professor, no molde do `TutorUsage`. |
| **R-13** | Título ≤ 80, enunciado ≤ 500, dica ≤ 200, no máximo 3 dicas. Normalizar NFC; recusar controles `U+0000–U+001F` menos `\n`; colapsar mais de duas quebras seguidas; remover bidi `U+202A–U+202E` e `U+2066–U+2069`. |
| **R-14** | Enunciado e dicas são **nó de texto**. Sem markdown, sem HTML, sem auto-link. `http://` e `https://` são **recusados** no enunciado e nas dicas: não existe moderação, não existe denúncia, e o leitor é menor de idade. Se alguém quiser link, é decisão do dono e vira D-26 — não um `if` que se relaxa. |
| **R-15** | `joinClassroom` ganha teto de 10 códigos errados por hora por conta. Antes o prêmio de adivinhar um código era aparecer numa lista; agora é ler o material publicado de uma turma. |
| **R-16** | `apps/web/app/actions/attempt.ts:19` — `questSlug: z.string().min(1)` está sem `.max()`, ao contrário do `openSchema` da linha 65. Acrescentar `.max(80)`. Assimetria pequena que vira problema quando o slug passa a vir de dado e não de constante. |

Helpers novos em `apps/web/lib/roles.ts` (extraindo o `requireTeacher` que hoje está no fim de
`classroom.ts`): `requireTeacher()`, `ownedClassroom(id, profileId)`, `ownedAssignment(id, profileId)`,
`ownedTeacherQuest(id, profileId)` — cada uma devolvendo `null` quando não é do dono. Sete ações
com a conferência copiada à mão é como a oitava esquece.

### 5.2 As ações

| Ação | Entrada (zod) | Quem pode | Devolve | Não devolve |
|---|---|---|---|---|
| `createAssignment` | `{ classroomId: cuid, title: trim.min(2).max(80) }` | professor dono da turma (R-5) | `{ status:'created', id }` | — |
| `renameAssignment` | `{ assignmentId, title }` | dono da lista | `{ status:'ok' }` | — |
| `createTeacherQuest` | `{ assignmentId, title, brief, hints: string[0..3], molblock: max 20 KB, goalIds: string[1..10] }` | dono da lista | `{ status:'created', questSlug, position }` | condição nenhuma; nem eco do molblock |
| `updateTeacherQuestText` | `{ teacherQuestId, title, brief, hints }` | dono da missão | `{ status:'ok' }` | — |
| `archiveTeacherQuest` | `{ teacherQuestId }` | dono da missão | `{ status:'ok' }` | — |
| `addItem` | `{ assignmentId, questSlug: max 80 }` | dono da lista **e** dono da missão (R-6) | `{ status:'added', position }` | — |
| `moveItem` | `{ assignmentId, itemId, direction: 'up'\|'down' }` | dono da lista | `{ status:'ok' }` | — |
| `removeItem` | `{ assignmentId, itemId }` | dono da lista | `{ status:'ok' }` | — |
| `publishAssignment` | `{ assignmentId }` | dono da lista, com ≥ 1 item | `{ status:'published', at }` | — |
| `archiveAssignment` | `{ assignmentId }` | dono da lista | `{ status:'ok' }` | — |
| `readAssignments` | `{ classroomId }` | dono da turma | listas com `{ id, title, items: {position, questSlug, title, origin}[], publishedAt }` | `answerMolblock`, `answerInchiKey` (R-3) |
| `readAssignmentBoard` | `{ assignmentId }` | dono da lista | `{ items, students: {name, cells: 'met'\|'stuck'\|'untouched'[]}[], hardest }` | molécula nenhuma (D-22) |
| `readStudentAssignments` | — | aluno logado, matriculado | listas **publicadas** das turmas dele: `{ title, classroomName, items: {position, questSlug, title, byTeacher}[] }` | `answerMolblock`, `answerInchiKey`, e `condition` quando a missão tem `inchiKey` (R-4) |

**Ações existentes que mudam:**

- `saveAttempt` e `openQuest` (`actions/attempt.ts`): `findQuest` → `resolveQuest`, mais R-7, R-8
  e R-16.
- `askTutor` (`actions/tutor.ts`) e `buildPrompt` (`lib/tutor/prompt.ts`): R-7 e R-9.
- `readClassroomBoard` (`actions/classroom.ts`): R-11.

**O tipo do payload do aluno não tem os campos da resposta.** Não é "presente e não usado": não
existe no tipo. O `typecheck` é parte do critério de aceite.

---

## 6. Telas

Desenho completo do `ui-ux`, com a palavra da §2 aplicada. Tokens de `packages/ui`, zero hex
solto, zero cor CPK em botão, borda ou estado.

### 6.1 Professor — a porta de entrada, em `/turmas/[id]`

Seção nova **entre** o título da turma e "Onde a turma travou". Título `Listas da turma`, botão
`Nova lista` à direita. Cada linha: nome (link) · chip de estado · `{n} missões` · data.

Chip: `rascunho · só você vê` (`--info` / `--info-wash`) ou `publicado` (`--ok` / `--ok-wash`).

Vazio:
> **Nenhuma lista ainda.**
> Uma lista é a sequência de missões de uma aula. Você escolhe do catálogo, cria as suas
> desenhando a resposta, ou mistura os dois.

Rodapé da seção:
> O aluno só vê a lista depois de publicada. Rascunho é seu.

### 6.2 Professor — a lista, em `/turmas/[id]/listas/[assignmentId]`

Cabeçalho: o nome em campo editável (`aria-label="Nome da lista"`, placeholder
`Funções oxigenadas — 3ª série`), gravado ao sair do campo. Abaixo:
`Rascunho · 3 missões · só você vê` ou `Publicado em 28 ago · 3 missões · 12 alunos na turma`.

Uma linha por item, colunas `posição | título + origem | ações`:

- posição em `--font-mono`, `tabular-nums`;
- origem: `catálogo` (`--ink-400`) ou `sua missão` (`--brand-ink` / `--brand-wash`);
- ações `↑` `↓` `Remover`, alvos de `--tap-min`, `title="Subir (Alt+↑)"` e
  `aria-label="Subir «Cheiro de fruta» para a posição 2"`. Com a linha em foco, `Alt+↑`/`Alt+↓`
  fazem o mesmo. Primeiro item sem `↑`, último sem `↓`.

Subir/descer e não arrastar: arrastar não tem alvo de teclado, é hostil no toque e não sobrevive
a lista com rolagem.

`Remover` some a linha com desfazer inline por 8 s: `«Cheiro de fruta» saiu da lista.` · `Desfazer`.

Abaixo: `Escolher do catálogo` · `Criar missão desenhando`. No rodapé, sozinho:
**`Publicar para a turma`**.

Vazio:
> **Esta lista ainda não tem missão nenhuma.**
> Escolha do catálogo, ou desenhe a resposta e crie a sua.

**Catálogo** — popover ancorado no botão, 360 px, rolagem interna. Filtros de trilha:
`Estrutura` `Geometria` `Propriedade` — **não existe chip Otimização**, porque aquela trilha não
tem missão (D-09) e um filtro vazio insinuaria que teria. Missão já na lista aparece marcada e
desabilitada, com `já está na lista`. Rodapé: `Acrescentar (2)` · `Cancelar`. Vazio pelo filtro:
`Nenhuma missão desta trilha fora da lista.`

Popover e não modal: é olhando para a lista já montada que se decide o que falta.

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
os 46 px e troca o agrupamento da direita por `Criando missão · {nome da lista}` +
`Salvar missão` + `Cancelar`. O `AnalysisDrawer` abre na aba **`Autoria`**, que **substitui** a
aba `Missões` — aqui não se resolve missão, se escreve uma.

**(a) Estrutura lida**

```
A resposta que você desenhou
C₂H₆O · 46,07 g/mol · 1 grupo funcional          [• calculado]
```

Fórmula por `<Formula>`; selo `SourceBadge source="computed"`. **Não existe selo âmbar nesta
tela** — nada aqui passa por modelo de linguagem.

> A molécula-resposta fica guardada dentro da missão, não na sua estante. O aluno nunca a recebe.

**(b) Objetivos que dá para cobrar** — quatro blocos, `a molécula` · `fórmula` ·
`grupos funcionais` · `átomos e contagens`, cada linha uma caixa de `--tap-min` com o rótulo da
§4.2 e o valor medido à direita. Contador acima: `2 de 9 objetivos marcados`.

Aviso do InChIKey, sempre visível na linha `é exatamente esta molécula` (`--warn` / `--warn-wash`):
> **Marcado, este é o único objetivo da missão.** A nota vira 0 ou 100 e um isômero parecido não
> vale nada. Para aceitar mais de uma resposta certa, cobre grupos e contagens em vez desta.

Ao marcar, os outros ficam desabilitados com `desligado enquanto você cobra a molécula exata`.

Sob as contagens:
> Rotacionáveis na definição estrita do RDKit. O PubChem conta de outro jeito, e cada um está
> certo dentro da própria definição.

Fecho:
> Esta lista saiu da molécula que você desenhou. Não dá para acrescentar objetivo escrevendo — o
> que o aluno vai ter de cumprir é sempre o que o RDKit mediu aqui.

**(c) O que você escreve** — `Título da missão` (80), `Enunciado` (400 na tela, 500 no servidor)
com a ajuda `Fale de química, não de interface: o aluno lê isto antes de desenhar.` e a linha que
o `security` pediu:

> O enunciado é lido pela turma inteira. Não escreva o nome de nenhum aluno.

`Dicas (até 3)`, uma de cada vez, com `Uma de cada vez, na ordem. O aluno só vê a dica quando
pede — dica dada antes da tentativa não ensina.`

**(d) Rodapé** — `Salvar missão` e a leitura `2 objetivos · 1 dica`. `Cancelar` abre popover:
`Sair sem criar a missão? O desenho não fica guardado.` Salvar volta à lista com a faixa:
`«O álcool do dia a dia» entrou na lista, na posição 3.`

### 6.4 Aluno — "Da sua turma", no `QuestPanel`

**Acima** do seletor do catálogo, porque é o que a aula está fazendo agora:

```
DA SUA TURMA                                    2 de 5 cumpridas
Funções oxigenadas — 3ª série · 3º A — manhã

[✓] 1  O primeiro traço
[✓] 2  O álcool do dia a dia
[ ] 3  O ácido do vinagre        ← em curso: --brand-wash / --brand-ink
[ ] 4  Cheiro de fruta
[ ] 5  O hexágono que não alterna
```

Linhas de `--tap-min`, `role="radio"`, tique reusando `.markMet`. Missão do professor mostra
`missão do seu professor` embaixo do título. **Sem cadeado:** qualquer item abre em qualquer
ordem.

Abaixo, o catálogo com rótulo próprio `catálogo · 3 de 16` e o `<select>` que já existe. Quando o
slug em curso é item da lista, o `<select>` mostra uma opção desabilitada
`Da sua turma · O ácido do vinagre`, para nunca exibir um estado que não é verdade.

> O catálogo é livre: dá para explorar por conta, mesmo fora da lista.

Ao cumprir, além do que já existe:
> **Cumprida. Faltam 2 na lista.**
> `Próxima: Cheiro de fruta →`

No último item:
> **Cumprida. Você fechou a lista «Funções oxigenadas — 3ª série».**

**Nunca aparece:** posição na turma, quantos colegas cumpriram, quem cumpriu antes, tempo
comparado (D-22).

### 6.5 Professor — o quadro, por lista

Um bloco por lista **publicada**, entre a seção "Listas da turma" e o "Onde a turma travou" geral.

Topo — `ONDE A TURMA TRAVOU NESTA LISTA`, o `hardest` que já existe restrito aos slugs da lista,
contagem em `--warn`, mono, `tabular-nums`. Mantém a nota:
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
| Turma sem aluno, no quadro | Ninguém entrou ainda. Escreva o código no quadro. |
| Lista publicada, ninguém abriu | Ninguém abriu nenhuma missão desta lista ainda. |
| Aluno, turma sem lista publicada | **Seu professor ainda não publicou nenhuma lista.** Enquanto isso, o catálogo aqui embaixo é todo seu. |
| Aluno sem turma | Você ainda não está em nenhuma turma. Com o código que o professor passa, a lista da aula aparece aqui. |

**Erros**

| Situação | Texto |
|---|---|
| RDKit recusou a resposta | **{a mensagem do RDKit, como ela já sai}** — p. ex. *O átomo de C tem 5 ligações, mas suporta no máximo 4.* Seguida de: `Enquanto a estrutura não fechar, não há objetivo nenhum para extrair. Corrija o desenho e a lista volta sozinha.` |
| Nada desenhado | Desenhe a resposta. Os objetivos que dá para cobrar saem dela. |
| Nenhum objetivo marcado | **Marque pelo menos um objetivo.** Sem objetivo, a missão não teria como ser cumprida — nem errada. |
| Título ou enunciado vazio | A missão precisa de um título e de um enunciado. O aluno lê isto antes de desenhar. |
| **R-2** — a própria resposta não cumpre | **Esta missão não é cumprida nem pela sua própria resposta.** O objetivo «{rótulo}» não fecha com a molécula que você desenhou, então ninguém conseguiria cumpri-la. Nada foi salvo: desmarque esse objetivo ou ajuste o desenho. |
| **R-1** — objetivo que não saiu da molécula | **Um dos objetivos não veio da molécula desenhada e foi recusado.** Desenhe a resposta de novo e marque na lista — objetivo digitado não vira missão aqui. |
| Slug repetido | «{título}» já está nesta lista. A mesma missão duas vezes contaria o progresso duas vezes. |
| Publicar lista vazia | Não dá para publicar uma lista vazia. Acrescente pelo menos uma missão. |
| Editar objetivo depois de publicado | Esta lista já foi publicada: título, enunciado e dicas continuam editáveis, os objetivos não. Mudar objetivo mudaria a nota de quem já tentou. Para cobrar outra coisa, duplique a missão. |
| **R-7/R-8** — aluno fora da turma | Essa missão não existe. |
| Aluno anônimo em slug de professor | Missão de turma precisa de conta. [Entre na sua conta] para abrir a lista. |
| **R-12** — teto de missões | Você chegou ao limite de {n} missões próprias. Arquive as que não usa mais — arquivar não apaga, e as listas que já as usam continuam funcionando. |
| **R-12** — resposta grande demais | A resposta tem {n} átomos. Uma missão de aula cabe em até 100 — a geometria acima disso não roda no celular do aluno. |
| **R-14** — link no enunciado | O enunciado não aceita link — cole o endereço no quadro ou no material da escola. |

### 6.7 Token novo

`packages/ui/src/tokens.css`, no bloco de forma do `:root`, **fora** de qualquer `@media` e de
`[data-theme]` — é medida, não cor:

```css
/* Alvo mínimo de toque. Escola pública em aparelho fraco é o caso de uso,
   não o caso extremo: qualquer coisa que se toca mede isto no menor lado. */
--tap-min: 44px;
```

Os 44 px hoje estão escritos à mão em cada folha que precisou deles, e cinco telas novas
repetiriam a regra.

### 6.8 Toque e celular

- Aluno: toda linha de item, todo `Próxima`, toda caixa em `--tap-min`, com `--sp-2` entre
  alvos. Nada depende de `:hover` — "em curso" é borda e fundo permanentes. A faixa `Próxima:` é
  largura total abaixo de 480 px.
- Professor: abaixo de 720 px a lista empilha em duas colunas e as três ações viram uma linha
  própria. A matriz rola na horizontal **com a primeira coluna fixa** (`position: sticky; left: 0;
  background: var(--raised)`) — sem isso, ao rolar até o item 5 não se sabe mais de quem é a linha.
- `prefers-reduced-motion` zera a animação de reordenar e a do popover. Nada aqui é física, então
  nada se perde.

---

## 7. Tarefas, na ordem

**Onda 1 — em paralelo, arquivos disjuntos.**

**`backend` A · o pacote `quests`** — `packages/quests/src/extract.ts`, `types.ts`, `evaluate.ts`,
`index.ts`, `test/`.
Pronto quando `pnpm test` cobrir: `extractGoals` sobre **etanol**, **aspirina** e **cafeína**
devolvendo os candidatos esperados (a cafeína com as duas amidas e o imidazol aromático — 4 N, 2
anéis, 1 aromático); o rótulo gerado batendo caractere a caractere com a §4.2, inclusive singular
e plural; `molarMass`, `exactMass`, `tpsa` e `logP` **ausentes** da lista; `id` determinístico
(duas chamadas sobre a mesma molécula dão os mesmos ids); `evaluateQuest` devolvendo o mesmo
resultado para uma `Quest` de catálogo e para um `Assessable` com os mesmos `goals`; e um teste
travando `:` em slug de catálogo.

**`deploy` · a migração** — `apps/web/prisma/schema.prisma` + `migrations/`, mais a nota no
`docs/DEPLOY.md`.
Pronto quando a migração for **puramente aditiva** (nenhuma coluna alterada, nenhum dado
reescrito), rodar num banco com dados, os testes de turma existentes continuarem verdes, e o
`DEPLOY.md` disser que a ordem é **migrar antes de subir o build**.

**`ui-ux` · pendência única** — o token `--tap-min` em `packages/ui/src/tokens.css`.
Pronto quando `pnpm lint` e `pnpm typecheck` passarem e nenhuma folha nova escrever `44px` à mão.

**Onda 2 — depende da onda 1.**

**`backend` B · resolução e ações** — `apps/web/lib/quest-resolve.ts`, `apps/web/lib/roles.ts`,
`apps/web/app/actions/assignment.ts`, mais os ajustes em `attempt.ts`, `tutor.ts`,
`lib/tutor/prompt.ts` e `classroom.ts`.
Pronto quando existir um teste por regra R-1 a R-16 (lista na §7.1), todos verdes, e quando
`readStudentAssignments` **serializado** não contiver `answerInchiKey` nem nenhum trecho do
`answerMolblock` — asserção sobre a **string**, não sobre o objeto: é o payload que vaza, não o
tipo.

**Onda 3 — depende da onda 2.**

**`frontend` · as telas** — `apps/web/app/turmas/messages.ts`, rota
`/turmas/[id]/listas/[assignmentId]` e `.../criar`, `Assignment.tsx`, `CatalogPicker.tsx` (sobre
o `Popover.tsx` existente), `AuthoringPanel.tsx`, mais `EditorWorkspace.tsx` (prop `authoring`),
`AnalysisDrawer.tsx` (aba `Autoria` no lugar de `Missões`), `QuestPanel.tsx` e
`turmas/[id]/page.tsx`.
Pronto quando o e2e da §8 passar inteiro; quando o `typecheck` aceitar o payload do aluno **sem**
o campo da resposta (ele não existe no tipo); quando a `TopBar` continuar com 46 px; e quando
nenhuma folha nova tiver hex solto ou `--cpk-*` em botão, borda ou estado.

**Onda 4 — ao final, sempre.**

**`security` · parecer** — pronto quando cada regra da §5.1 tiver um teste apontado por nome de
arquivo e linha, e quando o POST à mão do slug de outra turma devolver `Essa missão não existe.`
com **zero** linhas gravadas em `Attempt`.

**`reviewer` · veto** — pronto quando o parecer disser, com **arquivo e linha**, onde está imposta
cada uma destas: nenhuma `Condition` chega ao banco sem ter saído de `extractGoals`; nenhum rótulo
de objetivo é digitado; nenhum número vem do LLM; a nota continua saindo do servidor; e a trilha
Otimização segue sem missão (D-09).

### 7.1 Os testes, um por regra

Em `apps/web/app/actions/assignment.test.ts`, nomes em pt-BR como o resto da casa:

1. `conta de aluno não cria missão nem lista` (R-5)
2. `professor não adiciona item em lista de outro professor` (R-5)
3. `professor não adiciona à própria lista uma missão de outro professor` (R-6)
4. `aluno promovido a professor não publica na turma em que ele é aluno` (R-5)
5. `aluno da turma B tem a tentativa recusada no slug da turma A` — e nada gravado em `Attempt` (R-7)
6. `rascunho não publicado não é aberto por aluno matriculado` (R-7)
7. `turma arquivada deixa de dar acesso à lista` (R-7)
8. `resposta ao aluno não contém answerMolblock nem answerInchiKey` — sobre a string (R-3)
9. `missão com objetivo de InChIKey não manda condição ao cliente` (R-4)
10. `objetivo forjado que não está na lista regerada é recusado` (R-1)
11. `missão que a própria resposta não cumpre é recusada, nomeando o objetivo` (R-2)
12. `enunciado com HTML sai como texto na tela` (e2e) e `enunciado com link é recusado` (R-14)
13. `enunciado acima de 500 caracteres é recusado` (R-13)
14. `lista recusa o trigésimo primeiro item` (R-12)
15. `resposta com mais de 100 átomos pesados é recusada, com mensagem de química` (R-12)
16. `slug inexistente e slug sem matrícula devolvem a mesma recusa` (R-8)
17. `quadro da turma A não mostra missão da turma I` (R-11)
18. `prompt do tutor não contém o enunciado do professor` — sobre a string de `buildPrompt` (R-9)

**Nenhuma dependência nova.** `extractGoals` é TypeScript puro sobre o que o RDKit já calculou.
Se aparecer PR com sanitizador ou renderizador de markdown, ele volta ao `security` antes do
`pnpm add` — e a resposta provável é "não precisa" (R-14), não "qual é a licença". O
`qtype_jme`, precedente conceitual levantado pelo `researcher`, é **GPL**: ninguém lê aquele
código, ninguém copia trecho, e ele não entra em `docs/TERCEIROS.md` porque não entra no produto.

---

## 8. O e2e que prova a entrega

`apps/web/e2e/listas.spec.ts` — **um teste só**, o caminho inteiro. Se ele passa, a entrega
existe.

1. Promover uma conta a professor pelo `scripts/promote-teacher.mjs`.
2. Professor entra e cria a turma `3º A — manhã`; guardar o código.
3. Em `/turmas/[id]`, a seção `Listas da turma` mostra **Nenhuma lista ainda.**
4. `Nova lista` → nome `Funções oxigenadas — 3ª série`. A tela mostra
   `Rascunho · 0 missões · só você vê`.
5. `Escolher do catálogo` → marcar `O primeiro traço` → `Acrescentar (1)`. O item aparece na
   posição 1 com origem `catálogo`.
6. `Criar missão desenhando` → o editor abre com a `TopBar` dizendo
   `Criando missão · Funções oxigenadas — 3ª série` e o painel na aba `Autoria`.
7. Desenhar **etanol**. O painel mostra `C₂H₆O`, o selo `calculado`, e a lista de candidatos.
8. Marcar `tem pelo menos 1 grupo álcool` e `tem exatamente 2 átomos de C`. Título
   `O álcool do dia a dia`; enunciado `Monte um álcool com dois carbonos.`; uma dica.
9. `Salvar missão` → volta à lista com
   `«O álcool do dia a dia» entrou na lista, na posição 2.`, origem `sua missão`.
10. `Publicar para a turma` → confirmar. O chip vira `publicado`.
11. Sair. **Aluno** cria conta e entra com o código da turma.
12. No `QuestPanel`, a seção `DA SUA TURMA` mostra os **dois** itens, nesta ordem, com
    `0 de 2 cumpridas`. O segundo traz `missão do seu professor`.
13. Resolver o item 1 → tique, e a faixa `Próxima: O álcool do dia a dia →`.
14. Clicar no botão, desenhar etanol, resolver o item 2 → `Cumprida. Você fechou a lista
    «Funções oxigenadas — 3ª série».`
15. **Afirmar que a página do aluno nunca conteve o molblock da resposta** — buscar na string do
    HTML e do payload RSC pela InChIKey do etanol (`LFQSCWFLJHTTHZ-UHFFFAOYSA-N`) e pela assinatura
    do molblock (`V2000`), e exigir ausência.
16. Sair. **Professor** abre `/turmas/[id]` e vê, no bloco da lista, a linha do aluno com os dois
    itens em `cumpriu` e `2 / 2`.
17. **Afirmar que nenhuma molécula aparece na tela do professor** — nem SMILES, nem fórmula, nem
    desenho (D-22).

---

## 9. Perguntas para o humano

1. **A nota da lista não sai do Rotamer nesta entrega** — sem exportar, sem CSV, sem boletim,
   sem prazo. Se alguma escola já pediu nota que entra no diário, isso muda a prioridade e eu
   preciso saber **antes**, não depois.
2. **"Professor publica conteúdo lido por menor de idade" está coberto pelo D-19?** Minha leitura:
   o D-19 cobre **quem** pode publicar, e cobre bem — o papel é dado por quem tem acesso ao
   servidor, nunca autodeclarado, então todo publicador é alguém que a escola avalizou por fora do
   produto. O que o D-19 **não** cobre é **o que** foi publicado; por isso `updatedAt` entra nas
   duas tabelas agora (coluna esquecida não se recupera retroativamente). Se a escola exigir tela
   de consulta — quem escreveu o quê, e quando —, isso é tela a mais e não está nesta fatia.
   Também não existe canal de denúncia nem revisão do que um professor publica: a mitigação, hoje,
   é o D-19. Isso precisa ser dito em voz alta para a escola.
3. **A pergunta em aberto do D-25 — o catálogo continua livre?** Minha resposta provisória, e é o
   que este documento implementa: **continua livre, aberto e sem conta**. É a porta de entrada e a
   distribuição da camada gratuita (D-08); não existe nenhuma escola ainda, e fechá-lo hoje
   deixaria o visitante sem nada para fazer. Para quem **tem** professor, a lista vem primeiro na
   tela e o catálogo fica abaixo — hierarquia, não cadeado. **O que me faria mudar:** sessão de
   observação mostrando aluno matriculado se perdendo no catálogo e ignorando a lista, ou
   professor dizendo que a turma resolve missão fora da aula e chega sem assunto; aí o catálogo
   vira recolhido por padrão para quem está matriculado, nunca removido. **Quando o dono
   confirmar, isto vira D-26 no `docs/DECISOES.md`** — até lá não é decisão registrada, é escolha
   de implementação desta entrega.
4. **A palavra da tela.** A §2 decidiu "lista" com a medição do `researcher` e o risco de
   "roteiro" ser palavra ocupada em química. Falta perguntar ao Idelcio como **ele** chama isso —
   uma frase, e ela troca um arquivo de textos. Vale perguntar junto se a escola dele usa Google
   Classroom: se usar, alinhar o vocabulário com o Classroom vale mais que qualquer argumento de
   literatura.
