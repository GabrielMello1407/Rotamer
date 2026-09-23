<!-- source: docs/ROTEIROS.md · sha256:8c75c3996e69ff2a02b1e9754f351665dcda946af00b34def66326887c5f9d28 -->
<p align="right"><a href="../ROTEIROS.md">Português</a> · <strong>English</strong></p>

# Class assignments — the teacher creates them, the student solves them

> What the code implements for class assignments (D-25), the searchable catalog (D-26), and the
> shared catalog of teacher missions (D-27): data model, server rules, goal extraction, screens,
> and the tests that prove each rule. The decisions are in `DECISIONS.md`; what was left out is
> in `OUT-OF-SCOPE.md`.
>
> The Portuguese original is named `ROTEIROS.md` because that was the task's original name. The word
> on the screen is **lista** — in English, **assignment** — and §2 explains why. The code references
> these sections by number.

---

## 1. What it is, and what it is not

The teacher creates an **assignment**: a handful of missions, in their chosen order, with a name
(“Oxygen-containing functional groups — 3rd year of high school”), inside an existing class. They choose from
the catalog, create their own **by drawing the answer**, or mix both; they publish whenever they
want, and from then on the class sees the assignment in the mission panel, in the order they set.
The student solves it as before — the mission engine evaluates it, the server reevaluates it, and
the score comes from RDKit. The teacher follows the class board: who completed it, who got stuck,
who never opened it. Progress, never molecules (D-22).

The part that decides chemistry **is never typed**. The teacher draws the answer molecule, RDKit
analyzes it, the product extracts verifiable goals from it, and the teacher checks the ones they
want to require. They write the title, brief, and hints — text, which teachers know how to write
better than we do. Handwritten goals do not exist in this product, which prevents impossible
missions (“an alcohol with the formula C₂H₄O”) from reaching the classroom.

A teacher's mission can also be **published in the catalog** (D-27): then any account can find it
through search, see its author's name and school, and report it.

**What was left out** — deadlines, scores that become report-card grades, copying assignments
between classes, more than one correct answer by composition, locks between items, a concept
graph, a first-visit tour, time per item on the board, a moderation screen — is in
`OUT-OF-SCOPE.md`, with the reason for each.

**The Optimization track still has no missions** (D-09). It does not appear in the catalog's
track selector, and no assignment can contain an item from it.

---

## 2. Vocabulary

The `researcher` assessed how Brazilian teachers already speak: Google Classroom calls the item
an **atividade** (activity) and the grouping a **tópico** (topic); in the exact sciences, a set is
colloquially a **lista de exercícios** (exercise set). And in chemistry, “roteiro” already has a
meaning — an experimental or laboratory procedure. **The screen says “lista”** (D-26). The code
stays in English, `Assignment`, as the project requires.

| The thing | On screen (pt-BR) | On screen (English) | In the code | What never to call it |
|---|---|---|---|---|
| The ordered set the teacher creates | **lista** — “Nova lista”, “Listas da turma” | **assignment** — “New assignment”, “Assignments for this class” | `Assignment` | roteiro (procedure), tópico (topic), trilha (track), módulo (module) |
| One position in the assignment | **item** (in board wording: “o item 3”) | **item** (“item 3”) | `AssignmentItem` | atividade (activity), tarefa (task) |
| What the student solves, inside or outside an assignment | **missão** — the word the product already uses | **mission** | `Quest` / `TeacherQuest` | exercício (exercise), questão (question) |
| A mission written by the teacher | **sua missão** (for the teacher), **missão do seu professor** (for the student) | **your mission** / **mission from your teacher** | `TeacherQuest` | missão customizada, missão personalizada (custom/personalized mission) |
| The molecule the teacher drew to create the mission | **a resposta** | **the answer** | `answerMolblock` | gabarito (answer key — that is what it is, but the teacher's screen does not say this: they are not grading an exam) |
| Making the assignment visible to the class | **publicar** | **publish** | `publishedAt` | liberar (release), atribuir (assign), enviar (send) |
| Making a mission visible to any account | **publicar no catálogo** / **retirar do catálogo** | **publish to the catalog** / **withdraw from the catalog** | `catalogedAt` | compartilhar (share), tornar pública (make public) |
| An unpublished assignment | **rascunho · só você vê** | **draft · only you see it** | `publishedAt = null` | privado (private), oculto (hidden) |
| The board's three states | **cumpriu · travou · não abriu** | **completed · stuck · not opened** | `met` / `stuck` / `untouched` | nota (grade), média (average), melhor (best), ranking |
| The collection of whoever signed in | **estante** | **shelf** | `Molecule` with `ownerId` | biblioteca (library — that is what PubChem has) |

One word per thing. “Mission” does not become “exercise” halfway through, and “assignment” does
not become “procedure” in the next sentence.

**All UI copy for these screens lives in a single file:** `apps/web/app/turmas/messages.ts` —
English keys, text **in both languages** (D-30). This prevents the same sentence from diverging
between the server action and the component, and it is the only file to edit if an observation
session reveals that teachers use a different word. The English column of the table above is the
glossary that file follows, and no key strays from it: one word per thing, in both languages.

---

## 3. Data model

Four models, all in `apps/web/prisma/schema.prisma`, with a comment beside each column. No
preexisting column changed; the two migrations (`listas_da_turma`, `catalogo_e_denuncia`) are
purely additive.

### 3.1 `TeacherQuest` — the mission the teacher created

A title, brief, and up to three hints — the teacher's text, which enters no calculation. `goals`
is `Goal[]`, the same shape as in the `quests` package: only the selected goals, each with `id`,
`label`, and `condition` produced by `extractGoals` on the answer reanalyzed on the server.
`answerMolblock` and `answerInchiKey` are the drawn answer. `archivedAt` archives it;
`catalogedAt` being null means “only in my assignments”; being set means “published in the
catalog” (D-27).

**Why `goals` is `Json`, not a table.** Only one function reads it (`resolveQuest`), and its
contents are never queried. A condition table would be a relational condition editor — exactly
what D-25 exists to avoid building.

**Why the answer has its own column, rather than living on the shelf.** The shelf belongs to
the user; the teacher did not ask to save anything there, and if they clear the shelf later,
the mission must not break. **`answerMolblock` is an answer key**, and an answer key must not
enter a `select` on a student path — any student path (R-3).

**Why only selected goals are persisted.** An unselected candidate describes the answer far
beyond what was required — the teacher asks for “has an alcohol,” and the stored candidate
would reveal the exact formula.

### 3.2 `Assignment` — the assignment

Name, class, creator (`createdById`, separate from the class owner because content authorship
is a school concern), `publishedAt` (null means draft), and `archivedAt`.

### 3.3 `AssignmentItem` — one position

`position` (1, 2, 3… — the number the student sees and the column the teacher reads) and
`questSlug`. `@@unique([assignmentId, questSlug])`: the same slug twice in one assignment would
duplicate the student's check mark, because progress is per `(profile, slug)`. The same slug
in **different assignments** is allowed and expected.

### 3.4 How `Attempt` and `QuestOpen` reference a teacher's mission

**Their shape does not change.** `questSlug` remains a `String`, with namespaces:

```
catalog mission   →  primeiro-carbono        (never contains `:`)
teacher mission   →  professor:clx8k2m0000...
```

Resolution uses `resolveQuest(slug)` in `apps/web/lib/quest-resolve.ts`:

- It dispatches **by prefix**, never “try the catalog, then the database” — a fallback would let
  a teacher mission shadow a catalog slug.
- After the prefix, the remainder must match `/^[a-z0-9]{20,32}$/` (cuid format) **before**
  touching the database. If it does not match, it returns `null` without querying.
- A test in `packages/quests` prohibits `:` in catalog slugs. The namespaces never intersect.

**There is no foreign key** from `Attempt.questSlug` / `QuestOpen.questSlug` /
`AssignmentItem.questSlug` to `TeacherQuest.id`, because the same field also stores catalog
slugs, which are not database rows (D-12). The price is that deleting a mission would leave an
orphaned attempt — exactly why **deletion does not exist** (§3.5).

### 3.5 Deletion rules — nothing gets deleted

| Situation | What happens |
|---|---|
| A teacher archives one of their missions (`archivedAt`) | It leaves the selector and catalog. Assignments already using it keep working; old attempts still resolve its title. Unarchiving respects the limit of 200 active missions. |
| A teacher archives an assignment | It disappears from both screens; it appears under “Archived assignments (n)” in the class, where it can be unarchived. Nothing is deleted, and `Attempt` still counts on the overall board. |
| A class is archived | Its assignments disappear with it, on both sides. Nothing is deleted. |
| A mission is already used in a **published** assignment | **Goals can no longer be edited.** The title, brief, and hints remain editable. To require something else, duplicate the mission. |
| A mission is withdrawn from the catalog | Users whose only access was through the catalog lose access; those accessing it through a published assignment in their own class retain it (D-27). |
| The teacher's account is deleted | `onDelete: Cascade` removes missions and assignments. This matches the rest of the schema and what Brazil's LGPD expects. |
| A teacher is demoted to student | Writes stop immediately (`requireTeacher` reads the role from the database on every call). **Published assignments keep working for students** — intentionally, so nobody “fixes” this and disrupts a lesson for thirty people. |

**Why published goals freeze:** this is D-12 applied to teacher content. Editing a goal would
change the score of someone who already attempted it, without them changing anything.

---

## 4. Goal extraction

`packages/quests/src/extract.ts`. A pure function, with no React, DOM, or network — it runs in
command-line Vitest like the rest of the core.

```ts
export type CandidateKind = 'identity' | 'formula' | 'group' | 'count';

/** A goal that can be required from this molecule. */
export interface CandidateGoal {
  /** Deterministic: `formula`, `inchi-key`, `group:alcohol:1`, `atoms:C:2`, `descriptor:rings:1`. */
  readonly id: string;
  /** The measured value for the assignment's right-hand column: `2`, `C2H6O`. */
  readonly measured: string;
  readonly kind: CandidateKind;
  /** True only for InChIKey: when checked, it is the mission's only goal. */
  readonly exclusive: boolean;
  readonly condition: Condition;
}

export function extractGoals(molecule: Molecule): readonly CandidateGoal[];
```

The `id` is a **function of the condition**, not a counter: the server uses it to verify that
the chosen goal actually came from the molecule (§4.5, R-1).

### 4.1 What is offered

Everything is read from what RDKit has already calculated in `analysis.molecule`.

| `kind` | Candidate | Generated condition |
|---|---|---|
| `identity` | the exact molecule | `{ kind: 'inchiKey', value }` — **`exclusive: true`** |
| `formula` | the molecular formula | `{ kind: 'formula', value }` |
| `group` | one per functional group found | `{ kind: 'group', group, min: count }` |
| `count` | one per element in the formula | `{ kind: 'atoms', element, min: n, max: n }` |
| `count` | `rings`, `aromaticRings`, `rotatableBonds`, `hbDonors`, `hbAcceptors`, `heavyAtoms`, `heteroatoms`, `stereocenters` — always, including when the value is zero | `{ kind: 'descriptor', descriptor, min: n, max: n }` |
| `count` | only when there is a stereogenic center **and all centers have a configuration** | `{ kind: 'descriptor', descriptor: 'unspecifiedStereocenters', max: 0 }` |

**What is not offered, and why:** `molarMass`, `exactMass`, `tpsa`, `logP`. They are continuous —
exact equality is a trap, and a range would have to be typed, which is precisely what D-25
forbids. Count descriptors get `min = max = n`: they are integers, and “exactly 2 rings” is a
sentence a student understands. The “no stereogenic center is left without a configuration”
candidate appears only when the answer itself meets it — if a center lacks a wedge, it is not
even offered, because R-2 would reject the mission based on its own answer.

### 4.2 The labels, word for word

The generator produces exactly these texts, in each language:

```
English                                              pt-BR
the formula is {formula}                             a fórmula é {fórmula}
is exactly this molecule                             é exatamente esta molécula
has at least {n} {name} group / groups               tem pelo menos {n} grupo / grupos {nome}
has exactly {n} {symbol} atom / atoms                tem exatamente {n} átomo / átomos de {símbolo}
has exactly {n} ring / rings                         tem exatamente {n} anel / anéis
has exactly {n} aromatic ring / rings                tem exatamente {n} anel aromático / anéis aromáticos
has exactly {n} rotatable bond / bonds               tem exatamente {n} ligação rotacionável / ligações rotacionáveis
has exactly {n} hydrogen bond donor / donors         tem exatamente {n} doador / doadores de ligação de hidrogênio
has exactly {n} hydrogen bond acceptor / acceptors   tem exatamente {n} aceitador / aceitadores de ligação de hidrogênio
has exactly {n} heavy atom / atoms                   tem exatamente {n} átomo pesado / átomos pesados
has exactly {n} heteroatom / heteroatoms             tem exatamente {n} heteroátomo / heteroátomos
has exactly {n} stereocenter / stereocenters         tem exatamente {n} centro estereogênico / centros estereogênicos
no stereocenter is left unspecified                  nenhum centro estereogênico fica sem configuração
```

**The label is not stored: it is derived.** `goalLabel(locale, condition)`, in
`packages/quests/src/messages.ts`, writes the sentence from the condition, in the reader's
language. Storing it with the goal tied the mission to the language it was built in — a student
who switched to English would read the goals in Portuguese, in an assignment their teacher could
never fix. The InChIKey goal never sends its condition to the client (R-4), so **the server writes
its sentence**, since it knows the language cookie.

**This language rule is not just style.** In Portuguese, the article and plural always come from
the word `grupo`/`átomo` (group/atom), **never** from the group's name. `um álcool` and
`uma amida` change grammatical gender; `álcoois` and `ésteres` have different plural forms; none
of this is in the data. A generator that guessed would display incorrect Portuguese in front of a
class. `1 grupo álcool` / `2 grupos amida` is invariant and still reads naturally to a chemist.
English agreement works differently — the group's name comes first, and the plural falls on
`group` — which is why each language writes its own function instead of both sharing a template
with placeholders. The group's name comes from `functionalGroupName`, in `@rotamer/i18n`, from the
identifier `core` returns — the core speaks no language (D-30).

When an element symbol appears in text, it uses `--cpk-ink-{símbolo}` — there, the letter **is**
the atom (D-17). Nothing else on this screen uses a CPK color.

### 4.3 Serialized form

What goes into `TeacherQuest.goals` is `Goal[]` from the `quests` package — `{ id, condition }`,
without `measured`, `kind`, or `exclusive`, which are only for the UI, and **without `label`**,
which is derived from the condition at display time. Storing the same shape as the catalog means
`evaluateQuest` cannot tell them apart — and storing no sentence is what lets the same mission open
legibly in both languages.

### 4.4 The minimum interface the engine receives

```ts
/** All evaluation needs: a slug and goals. */
export interface Assessable {
  readonly slug: string;
  readonly goals: readonly Goal[];
}

/** What the catalog stores: only what decides. */
export interface QuestSpec extends Assessable { /* track, difficulty */ }

/** The same mission ready for the screen, in one language: `localize(spec, locale)`. */
export interface Quest extends QuestSpec { /* title, brief, hints, goals with label */ }

export function evaluateQuest(quest: Assessable, molecule: Molecule): QuestResult;
```

Without this, a teacher mission would have to invent a `track` and `difficulty` that nobody
chose — false database values just to fit a type.

### 4.5 The rule: nothing is typed

Two safeguards, both **on the server**, at save time — `validateAuthoredGoals` in
`apps/web/lib/quest-resolve.ts`, a pure function tested with a forged candidate:

1. **Regeneration.** RDKit reanalyzes the answer molblock, `extractGoals` runs again, and
   **only goals whose `id` is in the regenerated list are accepted**. The client sends
   `goalIds: string[]`, never a `Condition`. A typed condition does not become a mission.
2. **The answer itself satisfies the goals.** `evaluateQuest({ slug, goals }, analysis.molecule)`
   must pass. Otherwise, the mission is rejected and the error **names the goal** that fails.
   This eliminates the impossible mission mentioned in D-25. Between the two safeguards,
   InChIKey exclusivity is checked on the server too — it does not trust the client to disable
   the others.

And a third, linguistic safeguard: **goal labels are generated, not editable.** An editable
label would allow “has an ester” on a condition that checks for alcohol — a silent chemistry
error for an entire classroom.

---

## 5. Server actions

Everything is in `apps/web/app/actions/assignment.ts`, except where another file is specified.
Every input is validated with zod, as elsewhere in the project.

### 5.1 The rules

These are **rules**, not suggestions. Each has a test in §7.

| # | Rule |
|---|---|
| **R-1** | No `Condition` reaches the database unless it came from `extractGoals` on the answer reanalyzed on the server. The client sends `goalIds`. |
| **R-2** | A mission its own answer cannot satisfy is rejected, with the label of the failing goal. |
| **R-3** | `answerMolblock` and `answerInchiKey` never enter a `select` on a student path. No `findMany`/`findUnique` on `TeacherQuest` without an explicit `select`. |
| **R-4** | A mission with an `inchiKey` goal **does not send `condition` to the client**: the client receives `{ id, label }`, and the verdict comes from the server through `checkQuest`. For other types, the condition reveals nothing the label does not already reveal; the InChIKey reveals everything. |
| **R-5** | The role is a prerequisite; **ownership is authorization**. `requireTeacher` alone authorizes nothing. Every write starts with `ownedClassroom` / `ownedAssignment` / `ownedTeacherQuest` (`lib/roles.ts`). |
| **R-6** | `addItem` checks **two** owners: the assignment is mine **and** the `professor:` mission is mine. |
| **R-7** | Student access to a `professor:` slug (`studentQuestAccess`) has three routes; any one is enough: active **enrollment** → unarchived class → published, unarchived assignment → item with the slug; **catalog** — `catalogedAt` set and `archivedAt` null (D-27); **authorship** — authors always have access to what they wrote. “Already opened” (`QuestOpen`) is **not** a route: it is history, not a key. This applies at **six** entry points: `saveAttempt`, `openQuest`, `readQuestDetail`, `checkQuest`, `reportQuest`, and `askTutor`. |
| **R-8** | Uniform rejection: `"Essa missão não existe."` (in English, “That mission does not exist.”) for both nonexistent **and** inaccessible slugs, including anonymous accounts. Distinguishing them turns the action into an existence oracle (the same rule as D-19 for password recovery). |
| **R-9** | The tutor prompt **receives neither `title` nor `brief` from a `professor:` mission**. It receives calculated descriptors and the goals' **generated labels**. Teacher text does not leave the server — neither to Gemini, nor to logs, nor to error messages. |
| **R-10** | Editing a `TeacherQuest` title/brief/hints invalidates the cache: `db.tutorHint.deleteMany({ where: { questSlug } })`. |
| **R-11** | `readClassroomBoard` and the per-assignment board filter `questSlug: { in: [...catálogo, ...slugs dos itens desta turma] }` (catalog slugs plus the slugs of this class's items). A `professor:` slug from another class is neither read nor resolved nor displayed — as either a title or an id. |
| **R-12** | Limits, checked **inside a transaction**: 200 active `TeacherQuest` per teacher (unarchiving counts too) · 50 active `Assignment` per class · 30 items per assignment · 10 goals per mission · `answerMolblock` ≤ 20 KB **and** ≤ 100 heavy atoms (counted from `analysis.molecule`, never from the client) · 200 authorship saves per teacher per day · 10 reports per account per day. |
| **R-13** | Title ≤ 80, brief ≤ 500, hint ≤ 200, at most 3 hints. Normalize NFC; reject controls `U+0000–U+001F` except `\n`; collapse more than two consecutive line breaks; remove bidi `U+202A–U+202E` and `U+2066–U+2069`. |
| **R-14** | Brief and hints are **text nodes**. No markdown, HTML, or auto-linking. `http://` and `https://` are **rejected**: there is no moderation, and the reader is a minor. |
| **R-15** | `joinClassroom` allows at most 10 wrong codes per account per hour. Guessing a code grants access to a class's published material. |
| **R-16** | `questSlug` in every action is `z.string().min(1).max(80)` — rejected by the schema before touching the database. |
| **R-17** | `checkQuest` checks **without writing**: anonymous accounts are rejected before any work — no RDKit, no mission resolution — and the limit of 120 checks per account per minute is counted before resolving the mission and before RDKit; invalid molblocks count. Rejections are not cached on the client. |
| **R-18** | Publishing in the catalog requires `Profile.institution` to be filled in and the mission to be unarchived; search (`readCatalog`) indexes titles and generated labels, ignoring accents and case, and its serialized form never contains `answerInchiKey`, molblocks, or `condition`. |

### 5.2 The actions

| Action | Who can use it | Returns | Does not return |
|---|---|---|---|
| `createAssignment` `{ classroomId, title }` | teacher who owns the class (R-5) | `{ status:'created', id }` | — |
| `renameAssignment` | assignment owner | `{ status:'ok' }` | — |
| `createTeacherQuest` `{ assignmentId, title, brief, hints[0..3], molblock, goalIds[1..10] }` | assignment owner | `{ status:'created', questSlug, position }` | any condition; even an echo of the molblock |
| `updateTeacherQuestText` | mission owner | `{ status:'ok' }` | — |
| `archiveTeacherQuest` / `unarchiveTeacherQuest` | mission owner | `{ status:'ok' }` | — |
| `addItem` `{ assignmentId, questSlug }` | assignment owner **and** mission owner (R-6) | `{ status:'added', position }` | — |
| `moveItem` `{ assignmentId, itemId, direction }` | assignment owner | `{ status:'ok' }` | — |
| `removeItem` `{ assignmentId, itemId }` | assignment owner | `{ status:'ok' }` | — |
| `publishAssignment` | assignment owner, with ≥ 1 item | `{ status:'published', at }` | — |
| `archiveAssignment` / `unarchiveAssignment` | assignment owner | `{ status:'ok' }` | — |
| `readAssignments` `{ classroomId, includeArchived? }` | class owner | assignments with items `{ id, position, questSlug, title, origin }`, `publishedAt`, `archivedAt` | `answerMolblock`, `answerInchiKey` (R-3) |
| `readAssignmentBoard` `{ assignmentId }` | assignment owner | `{ items, students: { name, cells: 'met'\|'stuck'\|'untouched'[] }[], hardest }` | any molecule (D-22) |
| `readStudentAssignments` | signed-in, enrolled student | **published** assignments from their classes: `{ title, classroomName, items: { position, questSlug, title, byTeacher, goals }[] }` | the answer, and `condition` when the mission has `inchiKey` (R-4) |
| `readQuestDetail` `{ questSlug }` | any account with access (R-7) | title, brief, hints, goals `{ id, label }`, authorship | the answer |
| `checkQuest` `{ questSlug, molblock }` | account with access (R-7, R-17) | a verdict for each goal, without writing | — |
| `publishToCatalog` / `withdrawFromCatalog` | mission owner (R-18) | `{ status:'ok' }` | — |
| `reportQuest` `{ questSlug, reason ≤ 200 }` | account with access to the mission | `{ status:'ok' }` | — |
| `readCatalog` `{ query? }` | any account | `{ slug, title, track?, byTeacher, labels }[]` | answer, InChIKey, condition (R-18) |

**Participating actions from other files:** `saveAttempt` and `openQuest` (`attempt.ts`) use
`resolveQuest` and `studentQuestAccess` (R-7, R-8, R-16); `askTutor` (`tutor.ts`) and `buildPrompt`
(`lib/tutor/prompt.ts`) follow R-7 and R-9; `readClassroomBoard` (`classroom.ts`) follows R-11.

**The student's payload type has no answer fields.** They are not “present but unused”: they
do not exist in the type. `typecheck` is part of the guarantee.

---

## 6. Screens

All text below lives in `apps/web/app/turmas/messages.ts`, in both languages — except the
refusals born outside the class screens: those of R-1 and R-2 in `apps/web/lib/messages.ts`, and
the limits (R-12) in `apps/web/app/actions/messages.ts`. The quotes here are the English
interface's; the Portuguese original of this document quotes the pt-BR one. Tokens come from
`packages/ui`, with no standalone hex values and no CPK colors on buttons, borders, or states.

### 6.1 Teacher — the entry point, at `/turmas/[id]`

The `Assignments for this class` section sits **between** the class title and “Where the class
got stuck,” with a `New assignment` button. Each row: name (link) · status chip · `{n} missions` ·
date. Chip: `draft · only you see it` or `published`. Below it, `Archived assignments (n)`, with
`Unarchive`.

Empty state:
> **No assignments yet.**
> An assignment is the sequence of missions for one lesson. You pick from the catalog, create
> your own by drawing the answer, or mix the two.

Section footer:
> Students only see an assignment once it is published. A draft is yours.

### 6.2 Teacher — the assignment, at `/turmas/[id]/listas/[assignmentId]`

Header: the name in an editable field (`Assignment name`, placeholder
`Oxygen-containing groups — year 12`), saved when the field loses focus. Below:
`Draft · 3 missions · only you see it` or
`Published on August 28, 2026 · 3 missions · 12 students in the class`.

One row per item, columns `position | title + origin | actions`:

- Position uses `--font-mono`, `tabular-nums`.
- Origin: `catalog` or `your mission`; for your own mission, also `in the catalog` when it is
  there, and the `Publish to the catalog` / `Withdraw from the catalog` button (D-27).
- Actions `Move up`, `Move down`, `Remove`, with `--tap-min` targets and an `aria-label` such as
  `Move «Smells of fruit» up to position 2`. When the row has focus, `Alt+↑`/`Alt+↓` do the same.
  The first item has no `Move up`; the last has no `Move down`.

Move up/down rather than drag: dragging has no keyboard target, is awkward with touch, and
does not work well in a scrolling assignment.

`Remove` hides the row immediately, without waiting for the server, with inline undo for 8 s:
`«Smells of fruit» left the assignment.` · `Undo`. Undo restores the original position.

Below: `Pick from the catalog` · `Create a mission by drawing`. In the footer:
**`Publish to the class`**, and `Archive assignment` / `Unarchive assignment`.

Empty state:
> **This assignment has no missions yet.**
> Pick from the catalog, or draw the answer and create your own.

**Catalog** — a popover anchored to the button, with internal scrolling. Track filters: `All`
`Structure` `Geometry` `Property` — **there is no Optimization chip**, because that track has
no missions (D-09). Missions already in the assignment appear checked and disabled, with
`already in the assignment`. Footer: `Add (2)` · `Cancel`. Empty filtered state:
`No mission on this track is outside the assignment.`

**Publish** — a popover on the button itself:
> **Publish to 3rd-year A — morning?**
> 3 missions, in this order. From here on the class sees the assignment and the goals of your
> missions are locked — changing a goal would change the score of anyone who has already tried.
> `Publish` · `Cancel`

After publication:
> Published. Title, brief and hints stay editable; goals do not. To ask for something else,
> duplicate the mission.

### 6.3 Teacher — “Create a mission by drawing,” at `.../listas/[assignmentId]/criar`

The workbench is **the same**: the teacher draws exactly as a student does. `TopBar` keeps its
46 px height and replaces its right-hand group with `Creating a mission · {assignment name}` +
`Authoring` + `Cancel` + `Save mission`. The panel opens on the **`Authoring`** tab, which
**replaces** the `Missions` tab — here you write a mission rather than solve one.

**(a) Read structure** — `The answer you drew`, the formula rendered with `<Formula>`, the
`computed` badge. **There is no amber badge on this screen** — nothing here passes through a
language model.

> The answer molecule is kept inside the mission, not on your shelf. Students never receive it.

**(b) Goals you can ask for** — four blocks, `the molecule` · `formula` · `functional groups` ·
`atoms and counts`, each row a `--tap-min` checkbox with the §4.2 label and the measured value
on the right. Counter above: `2 of 9 goals ticked`.

InChIKey warning, always visible on the `is exactly this molecule` row:
> **Ticked, this is the only goal of the mission.** The score becomes 0 or 100 and a close
> isomer is worth nothing. To accept more than one right answer, ask for groups and counts
> instead of this one.

Selecting it disables the others, with one sentence at the top:
`switched off while you ask for the exact molecule`.

Below the counts:
> Rotatable bonds in RDKit’s strict definition. PubChem counts them another way, and each is
> right within its own definition.

Closing text:
> This list came out of the molecule you drew. There is no way to add a goal by writing one —
> what the student has to meet is always what RDKit measured here.

**(c) What you write** — `Mission title`, `Brief`, with the help text
`Talk chemistry, not interface: the student reads this before drawing.` and the line
requested by `security`:

> The brief is read by the whole class. Do not write any student’s name in it.

`Hints (up to 3)`, one at a time, with `One at a time, in order. The student only sees a hint
on asking — a hint given before the attempt does not teach.`

**(d) Footer** — `Save mission` and the count `2 goals · 1 hint`. `Cancel` opens a popover:
`Leave without creating the mission? The drawing will not be kept.` Saving returns to the
assignment with the banner `«The everyday alcohol» joined the assignment, at position 3.` —
which disappears as soon as the assignment is changed.

### 6.4 Student — “From your class,” in `QuestPanel`

**Above** the catalog selector, because this is what the class is doing now:

```
FROM YOUR CLASS                                2 of 5 completed
Oxygen-containing groups — year 12 · 3rd-year A — morning

[✓] 1  The first stroke
[✓] 2  The everyday alcohol
[ ] 3  The acid in vinegar      ← in progress
[ ] 4  Smells of fruit
[ ] 5  The hexagon that does not alternate
```

Rows use `--tap-min`, `role="radio"`. A teacher's mission displays `mission from your teacher`
below the title. **No locks:** any item can be opened in any order.

Below are the `Catalog` link and the product catalog's `<select>`. When the active slug is a
teacher mission, the `<select>` shows a disabled option `From your class · The acid in vinegar`,
so it never displays an untrue state.

> The catalog is open: you can explore on your own, even outside the assignment.

A mission without a local condition (InChIKey, or one accessed only through the catalog)
displays `checking…` on every goal until `checkQuest` responds — never “not yet met,” because
the client has no way to know.

On completion, in addition to the existing behavior:
> **Completed. 2 left in the assignment.**
> `Next: Smells of fruit →`

On the last item:
> **Completed. You finished the assignment «Oxygen-containing groups — year 12».**

A teacher mission also includes authorship (`mission by Teacher Ana · EE Dom Pedro II`) and
the `Report` button, which opens a one-line field (`In one line: what is wrong with this
mission?`), `Send report` · `Cancel`, and responds `Received.`

**Never displayed:** rank in the class, how many classmates completed it, who completed it
first, or comparative time (D-22).

### 6.5 Teacher — the board, by assignment

One block per **published, unarchived** assignment, between the “Assignments for this class”
section and the overall “Where the class got stuck.”

Top — `WHERE THE CLASS GOT STUCK ON THIS ASSIGNMENT`, with `hardest` restricted to the
assignment's slugs. It retains the note:
> Getting stuck means having tried and not completed it — anyone who never opened it is not
> counted here.

The matrix: one row per student, one column per **position number** (with the full title in
`title` and a numbered legend below — five mission titles do not fit at any width, and the
number is the same one the student sees). Three states, each with **shape as well as color**
(color alone does not work for deuteranopia or a classroom projector):

| State | Mark | Color | `aria-label` |
|---|---|---|---|
| completed | `✓` in a filled circle | `--ok` / `--ok-wash` | `Ana, item 3: completed` |
| stuck | `•` in a ring | `--warn` / `--warn-wash` | `Ana, item 3: stuck` |
| not opened | `–` without a ring | `--ink-400` / `--sunk` | `Ana, item 3: not opened` |

Fixed legend above: `✓ completed · • stuck (opened, not completed) · – not opened`. Last
columns: `completed` → `3 / 5` and `last seen`. Footer:
> What appears here is mission progress, assessed on the server at every attempt. The molecules
> the student drew do not enter this screen.

### 6.6 Empty states and errors — exact wording

**Empty states**

| Where | Text |
|---|---|
| Class without assignments (teacher) | **No assignments yet.** An assignment is the sequence of missions for one lesson. You pick from the catalog, create your own by drawing the answer, or mix the two. |
| Assignment without items | **This assignment has no missions yet.** Pick from the catalog, or draw the answer and create your own. |
| Filtered catalog with nothing left | No mission on this track is outside the assignment. |
| Class without students — the same sentence in the top summary and per-assignment board | Nobody has joined yet. Write the code on the board. |
| Published assignment, nobody has opened it | Nobody has opened a mission from this assignment yet. |
| Student, class without a published assignment | **Your teacher has not published an assignment yet.** In the meantime, the catalog below is all yours. |
| Student without a class | You are not in a class yet. With the code your teacher gives out, the lesson’s assignment appears here. |
| Catalog with no results | No mission found. |

**Errors**

| Situation | Text |
|---|---|
| RDKit rejected the answer | **{the chemistry refusal, as already produced}** — e.g. *The C atom has 5 bonds, but it supports at most 4.* Followed by: `Until the structure is valid, there is no goal to extract. Fix the drawing and the list comes back on its own.` |
| Nothing drawn | Draw the answer. The goals you can ask for come out of it. |
| No goal selected | **Tick at least one goal.** With no goal, the mission could not be completed — nor gotten wrong. |
| Empty title or brief | The mission needs a title and a brief. The student reads this before drawing. |
| **R-2** — the answer itself does not satisfy the goals | **Not even your own answer completes this mission.** The goal «{label}» does not hold for the molecule you drew, so nobody could complete it. Nothing was saved: untick that goal or adjust the drawing. |
| **R-1** — a goal that did not come from the molecule | **One of the goals did not come from the molecule drawn, and was refused.** |
| Duplicate slug | «{title}» is already in this assignment. The same mission twice would count the progress twice. |
| Publishing an empty assignment | An empty assignment cannot be published. Add at least one mission. |
| Editing a goal after publication | This assignment has already been published: title, brief and hints stay editable, the goals do not. Changing a goal would change the score of anyone who has already tried. To ask for something else, duplicate the mission. |
| **R-7/R-8** — student without access, or nonexistent slug | That mission does not exist. |
| Anonymous student on a teacher slug | A class mission needs an account. [Sign in to your account] to open the assignment. |
| **R-12** — mission limit | You’ve reached the limit of {n} missions of your own. Archive the ones you no longer use — archiving doesn’t delete, and assignments already using them keep working. |
| **R-12** — answer too large | The answer has {n} atoms. A class mission fits up to 100 — geometry above that doesn’t run on a student’s phone. |
| **R-14** — link in the brief | The brief does not take links — write the address on the board or in the school material. |
| Archived assignment | This assignment has been archived. It disappears from both screens until you unarchive it. |

### 6.7 The token this release created

`--tap-min: 44px` in `packages/ui/src/tokens.css`, in the `:root` shape block, outside any
`@media` and `[data-theme]` — it is a measurement, not a color. Minimum touch target: a public
school on a low-end device is the use case, and every touch target must measure at least this
on its shorter side.

### 6.8 Touch and mobile

- Student: every item row, every `Next`, every checkbox uses `--tap-min`, with `--sp-2` between
  targets. Nothing depends on `:hover` — “in progress” has a permanent border and background.
  The `Next:` banner spans the full width below 480 px.
- Teacher: below 720 px, the assignment stacks into two columns and the three actions get their
  own row. The matrix scrolls horizontally **with its first column fixed** (`position: sticky`)
  — otherwise, when scrolling to item 5, you no longer know whose row it is.
- `prefers-reduced-motion` removes the reorder and popover animations. Nothing here is physics,
  so nothing is lost.

---

## 7. Tests, one per rule

`apps/web/app/actions/assignment.test.ts`, against Postgres — skips with a warning when there
is no database, fails with `REQUIRE_DATABASE=1` (as in CI). Each test's name states what it
protects:

- **R-5** `a student account cannot create a mission or assignment` · `a teacher cannot add an
  item to another teacher's assignment` · `a student promoted to teacher cannot publish in a
  class where they are a student` · `another teacher cannot unarchive someone else's assignment`
- **R-6** `a teacher cannot add another teacher's mission to their own assignment`
- **R-7** `a student in class B has their attempt rejected on class A's slug` (with nothing
  written to `Attempt`) · `an enrolled student cannot open an unpublished draft` · `an archived
  class no longer grants access to the assignment` · `someone who already opened it and is
  outside every assignment loses access` · `withdrawn from the catalog but present in a
  published assignment in the student's class: access continues` · `the author can read their
  own mission that is neither published in any assignment nor cataloged` · `another teacher
  cannot access a colleague's unpublished mission` · `a cataloged mission is accessible; the
  same class, without cataloging, is not`
- **R-3** `the student response contains neither answerMolblock nor answerInchiKey` — checked on
  the serialized **string** · `serialized readCatalog contains no answerInchiKey, molblock, or condition`
- **R-4** `a mission with an InChIKey goal does not send the condition to the client`
- **R-1 / R-2** `a forged goal outside the regenerated list is rejected` · `a forged candidate
  whose condition does not match is rejected, and the reason names the goal` · `butan-2-ol
  without a wedge: the pending-configuration candidate is not even offered` · `butan-2-ol with
  a wedge (configured center): the candidate appears, and the mission is created`
- **R-13 / R-14** `a brief above 500 characters is rejected` · `a brief with HTML appears as
  text on screen (e2e), and a brief with a link is rejected`
- **R-12** `an assignment rejects the thirty-first item` · `an answer with more than 100 heavy
  atoms is rejected with a chemistry message` · `with 200 active missions, unarchiving one more
  mission is rejected` · `with 50 active assignments in the class, unarchiving one more
  assignment is rejected` · `reportQuest records the report and rejects the eleventh of the day`
- **R-8** `a nonexistent slug and a slug without enrollment return the same rejection` · `an
  anonymous account receives the same rejection for a real slug and a forged one` · `an account
  without mission access receives the uniform rejection without recording a report`
- **R-11** `class A's board does not show class I's mission`
- **R-9 / R-10** `the tutor prompt does not contain the teacher's brief` — checked on the
  `buildPrompt` string · `updating the title, brief, or hints deletes this mission's TutorHint`
- **R-15** `the eleventh wrong-code attempt is blocked`
- **R-16** `a slug longer than 80 characters is rejected by the schema before touching the database`
- **R-17** `calling three times in a row records no Attempt` · `without an account, checkQuest
  rejects before any work — no RDKit and no resolved mission` · `the 120/minute per-account
  limit is counted before resolving the mission and before RDKit; invalid molblocks count`
- **R-18 / D-27** `a mission starts outside the catalog: catalogedAt is null` · `publishing
  without an institution is rejected, and catalogedAt remains null` · `readCatalog always
  returns a populated institution` · `searching for "ester" finds the mission whose label is
  "tem pelo menos 1 grupo éster" (has at least 1 ester group)`
- **§3.5** `archive, try to publish (rejected with the path named), unarchive, publish (ok)` ·
  `archive, read the assignment list (disappears), unarchive, appears again` · `with
  includeArchived: true, also returns the archived assignment, marked by archivedAt`

`packages/quests/test/extract.test.ts` covers extraction: ethanol, aspirin, and caffeine (with
both amides and aromatic imidazole — 4 N, 2 rings, **2 aromatic**, the reference case in
`CLAUDE.md`), labels character by character, the absence of continuous values, deterministic
`id`, and the ban on `:` in catalog slugs. `assessable.test.ts` proves that `evaluateQuest`
returns the same verdict for a catalog `Quest` and an `Assessable` with the same `goals`.

**No new dependency.** `extractGoals` is pure TypeScript over what RDKit already calculated;
briefs and hints are text nodes, with no sanitizer or markdown renderer (R-14).

---

## 8. The e2e test that proves the release

`apps/web/e2e/listas.spec.ts` — **a single test**, covering the whole journey, on desktop and
mobile. If it passes, the release exists:

1. Promote an account to teacher using `scripts/promote-teacher.mjs`.
2. The teacher creates the class `3rd-year A — morning` and saves its code.
3. At `/turmas/[id]`, `Class assignments` shows **No assignments yet.**
4. `New assignment` → `Oxygen-containing functional groups — 3rd year of high school`. The screen shows
   `Draft · 0 missions · only you can see it`.
5. `Choose from the catalog` → `The first stroke` → `Add (1)`. Position 1, origin `catalog`.
   `Remove` hides the row **before** the server responds; `Undo` brings it back.
6. `Create a mission by drawing` → `Creating a mission · Oxygen-containing functional groups —
   3rd year of high school`, with the panel on the `Authoring` tab.
7. Ethanol through SMILES input. The panel shows `C₂H₆O` and the `calculated` badge. Selecting
   `it is exactly this molecule` disables the others with one sentence; deselecting re-enables them.
8. Select `has at least 1 alcohol group` and `has exactly 2 atoms of C`. Title
   `The everyday alcohol`; brief `Build an alcohol with two carbons.`; one hint.
9. `Save mission` → `«The everyday alcohol» was added to the assignment at position 2.`, origin
   `your mission`. Moving the item up and down removes the banner, even back at position 2.
10. `Publish for the class` → confirm → `Published on`. `Publish in the catalog` →
    `Withdraw from the catalog`. The assignment's chip in the class says `published`, and the
    no-students sentence is the same in the summary and the per-assignment board.
11. **A student in the class** creates an account, joins with the code, sees `FROM YOUR CLASS`
    with the two items, `0 of 2 completed`, and `your teacher's mission`.
12. Solves item 1 → `Next: The everyday alcohol →`. Methanol, propan-1-ol, and butan-1-ol
    (valid, but wrong) do **not** trigger `saveAttempt`. Ethanol → `Completed. You finished the
    assignment «Oxygen-containing functional groups — 3rd year of high school».`, and exactly one `saveAttempt`.
13. **No response received by the student's browser during the entire session** — HTML, RSC
    payload, or action response — contains ethanol's InChIKey or the `V2000` signature (R-3,
    R-4). The scan requires at least five bodies, one from a server action.
14. **A student from another class** searches for `álcool` (alcohol) at `/catalogo`, finds the
    mission with `mission by Teacher Ana · EE Dom Pedro II`, solves it, and `Report` → `Received.` (D-27).
15. The teacher returns and sees `2 / 2` on the board — and her page contains no SMILES,
    formula, or molblock (D-22).
16. Archive the assignment → `Archived assignments (1)`, in `tabular-nums`.

---

## 9. The questions the specification asked, and the answers

Answered by the product owner on August 28, 2026 (D-26) and finalized the same day (D-27):

1. **Assignment scores do not leave the product.** No export, CSV, or deadline. It remains
   progress, using D-22's vocabulary.
2. **Teachers publish content read by minors, and D-19 is the mitigation** — the role is
   granted by the instance administrator or an administrator at the school itself (D-29),
   never self-declared. The shared catalog added visible authorship and reporting (D-27).
   Revoking the role also **withdraws from the catalog** what that account published (D-29):
   before that withdrawal existed, the mitigation removed the author's access but left the text up.
3. **The product's mission catalog remains open**: anyone, with or without an account, can
   open a catalog mission. The **searchable** catalog (`/catalogo`), combining product missions
   and published teacher missions, requires an account. Students with a teacher see their
   class assignment first and the catalog below; students without a teacher see the catalog.
4. **The word on screen is “lista”** (assignment), without consulting teachers first. If the
   observation session reveals another word, change `messages.ts`.
