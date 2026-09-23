<!-- source: docs/FORA-DE-ESCOPO.md · sha256:76f7aa8e45a7547145a509ba60b251e2b3b9357b201b76b318a1c2f2a987fc63 -->
<p align="right"><a href="../FORA-DE-ESCOPO.md">Português</a> · <strong>English</strong></p>

# Out of scope

What does **not** enter the product now, and why. Each item states the cost of doing it and what
would unlock the decision — an answered question, a teacher's request, a measurement.

This is the companion to `DECISIONS.md`: that file records what was decided to do; this one records what was decided not to do
for now. An idea arising in the middle of another task goes here, then work resumes on the original
task. Scope creep is this project's number one risk.

> Reviewed on September 11, 2026, after D-28. Delivered items were removed from here — they live
> in `docs/en/ROADMAP.md`, marked as done. What remains is deliberately excluded, with the
> reason and what would unlock each item.

## Open questions

- **The direction of nomenclature.** The product does not name compounds, by choice (D-15) — and the remaining question
  is not “whether,” but “in which direction”: does the teacher want *name what I drew* or *correct
  the name my student wrote*? The Phase 3 observation session answers, using the
  exact questions in `docs/en/ROADMAP.md`. The options, with the cost of each, appear below.
- **Canvas accessibility.** Drawing requires a pointer; the keyboard only has shortcuts. A student who
  uses neither mouse nor touch is excluded from the lesson, and public schools have a legal obligation to provide
  accessibility. There is no cheap answer: the editor is a custom canvas, and a keyboard
  interface is a second editor.
- **Research track.** The entire roadmap serves teaching. For researchers — medicinal
  chemists, master's students — there is no track: no systematic comparison, batch processing, or
  reproducibility. D-09 said researchers were advanced users, not customers; D-28
  removed “customers” and made the question legitimate. What would need to exist, each one
  a full phase: comparing molecules side by side with tabulated descriptors; batch processing, with dozens
  of structures at once and a spreadsheet output; conformer ensembles with relative energies and
  Boltzmann populations; exploration history; SDF export with properties; and citation —
  versions of RDKit and the force field, plus the seed, alongside the result. **Why it does not enter
  now:** it competes with Phase 3, contact with real teachers. **Unlocked if**
  a Phase 3 teacher is also a researcher and says what they would do with it — then D-09 is
  reaffirmed or revised in writing, with a dedicated phase in the roadmap.

## Nomenclature — the five paths, and what unlocks each one

**Written on August 27, 2026, based on `docs/en/research/nomenclature.md`.** None of this enters now.
D-15 stands with a new rationale, and the choice among the paths below awaits the observation
session.

Ordered by cost, from cheapest to most expensive.

**(a) Do not name compounds, and say so clearly.** This is the current approach. Almost zero cost: the
rewritten rationale (done) and the on-screen sentence that answers before the teacher asks
(done: “Apelido é autoria, não nomenclatura. O Rotamer escolheu não nomear” — “A nickname is authorship, not nomenclature. Rotamer chose not to name compounds”). Risk: teachers read this as
a limitation instead of a choice. Permanent obligation: the discipline of rejecting nicknames that masquerade as
nomenclature — supported by attribution and the rule written in D-15.

**(b) The student names it and the product checks** (name → structure). **Half already exists and costs nothing:** the
`inchiKey` mission condition (`packages/quests/src/types.ts`) compares the student's drawing
with the target, whose name is typed by a human in the instructions — no engine, no network,
D-15 intact. It is the direction tested by ENEM, Unicamp, and SEDUC-SP, where students make mistakes (41.59% scored
zero at Unicamp 2005), and what Shute (2008) prescribes: students produce, software checks. The
**other** half — free-form nomenclature, students writing any name — requires OPSIN (a JVM on the
instance, or the EBI service) plus a pt→en layer that **decides structure** and therefore cannot
be the LLM (D-01). Permanent obligation: a pt→en dictionary reviewed by a chemist, plus another production
process or third-party dependency. **Unlocked if** the session says “correct my
student's name” — and then the first delivery is the free half: a mission with a target given by name, which
teachers can already create today by requiring “is exactly this molecule.”

**(c) Integrate a third-party engine** (structure → name). The only realistic candidate: `openclatura`
0.3.1, MIT, deterministic, based on RDKit, as a Python microservice alongside Next.js. Cost: one
more service in every instance forever — including self-hosting, which would become two
containers instead of one —, **plus** pt-BR localization, which is the real work. Risk: beta
0.3.1 from a single laboratory; English; a network call per name. Permanent obligation: **only show
names confirmed by verification** — and enabling `verify_with_opsin` pulls in OPSIN, Java, and LGPL
together, excluded by D-28. In its favor, and this is the strong argument: `NameAnalysis` returns names
**in pieces**, with atom indices that match the graph — it would let us highlight in the drawing the
part corresponding to each part of the name, the same idea as “the highlighted atom is the same” (D-18).
**Unlocked if** all three D-15 triggers are satisfied, in this order: session → chemist
checking each name → deterministic pt-BR.

**(d) A restricted range** — name only what can be guaranteed, and stay silent on the rest. Risk: the boundary is
invisible to users, and the range **grows**. With `openclatura` round-trips, the range need not
be handwritten — it can be “everything verification confirmed.” In practice this is not a
separate path: it is (c) done properly.

**(e) Name only curated content, at build time.** Run the engine once over the catalog,
have a chemist check every name, and include the result as **data**. Zero production cost:
no service, works offline and on low-end phones. Risk: it only answers within the mission, and the
teacher will draw things outside the list. Permanent obligation: human review for every catalog
change — and the catalog now includes teacher missions (D-27), which nobody reviews. **And this is not
naming; it is a catalog** — the screen must state the difference. **Unlocked if** the session says
“name what I drew” **and** the teacher accepts that the product answers only within the track.

**Rejected, for a reason already recorded.** Any **neural** nomenclature engine, including
STOUT (MIT): 83.52% to 89.86% accuracy measured by its own authors is the same profile
`CLAUDE.md` uses to rule out the LLM. `chem-dl-iupac` (AGPL-3.0) and `iupac-to-structure` (GPL-3.0) fail
on licensing (D-28); `smiles2iupac` and the Spanish OPSIN fork have no license at all.
ChemDoodle is proprietary — it cannot be redistributed in an MIT repository — and still depends on the
iChemLabs server for every call.

## Two smaller debts left by nomenclature

- **A list of trivial compound names.** Today `checkName` accepts `aspirina`, `cafeina`, and
  `anilina` as nicknames. **This is chemical data**: it either comes from a source reviewed by a chemist or it does not come
  at all — inventing the list here would be the custom kernel again (D-02). It only enters if the Phase 3 review
  shows the collision truly causes problems. Until then, attribution bears the burden:
  “batizada por Camila” (“named by Camila”) next to the nickname.
- **RDKit's `condense_abbreviations`.** It produces labels such as `CO2Et`, which students read as names. It
  is not enabled anywhere in the product. If someone enables it, those labels fall under D-15's rule
  and need their source stated on screen.

## Selection — what stayed out of the first cut

Written on August 27, 2026, alongside D-23. The Selecionar (“Select”) tool delivered bulk moving, deleting, and changing.
Left out, ordered by cost:

- **Invert selection** and **freehand lasso.** Cheap, but nobody asked: rectangles and fragments
  cover what the request described.
- **Copy, paste, and duplicate.** Brings in the clipboard, anchoring pasted content, and identifier
  conflicts. A separate delivery.
- **Rotate, mirror, and scale the selection.** Mirroring **inverts the configuration** of a stereogenic
  center: it falls under D-21 and needs a test proving RDKit sees the enantiomer, not an
  arbitrary molecule.
- **“Select the ring” and “select the functional group.”** Ring and group perception belong to
  RDKit, and `editor2d` does not talk to the worker — that is the repository's dependency rule. It would enter
  as a function supplied by whoever assembles the screen, just like “Tidy the drawing.”
- **Highlight the selection in the 3D scene too.** The path already exists (`source` connects a graph atom to a
  geometry atom, D-18); what is missing is deciding what the scene shows when the selection contains
  bonds, not just atoms.
- **Bulk stereochemistry.** Rejected in D-23, not postponed: applying wedges to several bonds defines
  configurations nobody chose.

## Dipole moment — requested by a real teacher

**August 28, 2026.** Pedro, a teacher at IFPR, asked whether the product shows dipole
moments before even trying it. This is the first feature request from outside, which makes it
worth more than any idea of our own.

Today it **does not exist**: it is not in the descriptors, not on screen, not anywhere in the
code.

What makes the request interesting: the 3D geometry is already calculated, and MMFF94 assigns a partial
charge to each atom. Summing charge times position yields a dipole vector — and the **arrow** drawn
over the molecule in 3D is precisely what a lesson on polarity needs, more than the number.

**Validated by the teacher on August 28, 2026**, before any testing: *“It would show the molecule's
polarity. Just the arrow, with the direction of the resultant dipole, helps a lot.”* In other words, the cheap option
— an arrow without a number — is exactly what serves his lesson.

**But it is not cheap, and that was measured on August 28, 2026.** Neither engine provides
partial charges through the API we use:

- **OpenChemLib 9.25.0**: `ForceFieldMMFF94` exposes `size()`, `getTotalEnergy()`, and `minimise()`, and
  nothing else. MMFF94 calculates charges internally to assemble the electrostatic term but does not
  return them.
- **RDKit MinimalLib**: `JSMol` has no partial-charge method (only generic `get_prop`/`set_prop`),
  and `get_json` provides only `impHs` per atom. The string `gasteiger` exists in the `.wasm`,
  so the code is compiled — but it is not exposed in JavaScript.

Thus the possible options, none of which takes an afternoon:

1. **Find another source of charges with a suitable license** (MIT, BSD, Apache) — a question for the
   `researcher`.
2. **Compile our own MinimalLib** with the RDKit function exposed. Chemically the most correct path,
   and the most expensive in infrastructure; it changes `prebuild`, the Docker image, and
   `docs/en/INSTALLATION.md`.
3. **Implement Gasteiger–Marsili by hand.** Tempting and prohibited by the spirit of D-01 and D-02:
   it would be the custom kernel again, now for partial charges, with a silent error in an arrow
   pointing the wrong way.
4. **Do not do it**, and say why.

What prevents this from entering without discussion:

- **A force-field dipole is a rough estimate.** MMFF94 charges serve energy calculations, not
  dipole moments; the real reference value comes from a quantum calculation. Showing
  “1.85 D” for water when the calculation yields something else would be the error this product cannot
  make (D-01) — and water's number is the first any teacher checks.
- So there are two honest options, and the choice belongs to the `pm`: show **only the direction** (the arrow, without a
  number, stating that it is the direction of polarity, not a measurement), or show the number with its
  source and a comparison — which requires first measuring its errors for classroom molecules.
- Before either: **ask Pedro what he would do with this in class**. If the use is “show that
  water is polar and CO₂ is not,” the arrow is enough.

## Assignment lists and catalog — what stayed out (D-25, D-26, D-27)

Class assignment lists, missions created by drawing the answer, and the shared catalog exist
(`docs/en/CLASS-ASSIGNMENTS.md`). What stayed out, and why:

- **Due dates** — bring time zones, late submissions, and partial grades; the board asks where the class
  got stuck, not who submitted on time (D-22).
- **Scores that become school grades, exports, CSV, report cards** — an educational promise no school
  has asked for yet. A Phase 3 question.
- **Copying lists between the same teacher's classes** — purely a scope cut, and the most likely to
  return early: it is the first thing a teacher with two classes will ask for.
- **Missions with more than one correct answer** (composing `some`) — would require a condition
  editor, exactly what D-25 exists to avoid building. There is already a path: requiring groups and
  counts instead of InChIKey accepts many answers, and the authoring screen says so.
- **Locks between items** — Classroom and Khan do not lock by default either; a mission that opens only
  after another disrupts the lesson of someone who wants to start where they choose.
- **Time per item and attempt counts on the board** — `Attempt.elapsedMs` and row counts
  already exist, and the per-item grid invites displaying them. Three states per cell, period. Going
  further is D-22 turning into a report card without anyone deciding so.
- **Concept graph (`teaches`/`requires`).** Each mission would declare what it teaches and
  presupposes, in subject concepts; the suggested order would derive from the graph instead of being set
  by hand, and `difficulty` would become a consequence. It enters as a **suggestion, never a lock**. It awaits
  Idelcio's teaching plan: the list of concepts and their order should not come from our
  heads — ask for the plan, transcribe it, and compare it with the 15 missions; surplus and missing content
  reveal themselves.
- **First-visit tour.** Missions verify molecules, not gestures (D-01): “rotate the molecule,”
  “tidy the drawing,” and “view a vibration mode” do not change the graph and cannot be goals.
  What fits is **tour missions** — chemistry missions written so completing the goal
  requires discovering a tool (double bond, heteroatom, wedge, selection) — and a **first-visit
  guide** for non-chemistry actions, as a checklist without scores or checkmarks. Only
  after observation sessions: where new users get stuck is data only the session provides.
- **Report moderation screen.** Today a report (D-27) records who, when, and why, and
  removal from the catalog is performed by the teacher or an administrator through a script. It becomes a screen when
  the first real report arrives with nobody to read it.
- **What Idelcio calls it.** “Lista” (“list”) was chosen based on the `researcher`'s findings (D-26). If the
  session finds him using another word, change `apps/web/app/turmas/messages.ts` and nothing
  else.

## Debt from the assignment-list delivery

- **In-memory limits** (`apps/web/app/actions/assignment.ts` — daily authoring saves,
  checks per minute; `apps/web/app/actions/classroom.ts` — incorrect codes per hour) —
  persist them when there is more than one app process. With a single container, as
  `docker-compose.yml` starts, this is correct; restarting the container resets the count, which is
  acceptable for an abuse limit and unacceptable for a billing quota — and there is no billing.

## Server-side RDKit blocks the event loop

**Measured on September 12, 2026, in the end-to-end suite.** `saveAttempt`, `checkQuest`, and the
public molecule page run RDKit inside the Next process, and WebAssembly does not yield the
event loop while calculating. Therefore, **server chemistry requests do not run in parallel**:
they queue, and while one calculates, the process serves nothing else — neither another action nor
a page.

The cost so far has been in tests, twice. With four browsers in parallel, the queue exceeded
one minute and failed the assignment-list test; the suite dropped to two workers and passed again.
On **September 18, 2026** the same test failed again, this time only in CI: the runner has two
cores, both workers run the same heavy path at the same time—desktop and mobile—and it took 2m12s
against 7.5 s alone on this machine. The cost-12 bcrypt of every sign-in competes for the same
core. There were three fixes, and none of them touched the product: the test budget went up to
seven minutes, the internal wait for the count went back to one minute (two made the failure
worse, because it consumed the budget and the test died at a later step, far from the cause), and
the role paths became short tests instead of one long path.

**A single worker is not a way out.** Measured on this machine: the whole suite in series takes
more than twenty minutes, against 1.4 min with four. In CI it would be much worse than the
eighteen minutes the suite takes today with two workers.

**On September 23, 2026, measurement pointed elsewhere: the assignment-list test failure is a hang,
not slowness.** The whole suite ran six times on this machine, with four workers. In the four runs
without `--trace`, the long path failed — twice stuck in the `page.goto('/')` of `sair()` until the
seven minutes ran out, twice without seeing the `saveAttempt` response within the minute; in the two
runs with `--trace=retain-on-failure`, the whole suite passed in 1.5 min and the path took 13 s.
Alone, or with its twin from the other project in parallel, it takes 8 to 10 s. During the hang the
server answered in 8 ms and Postgres had no app connection open — nobody was waiting on the database
or on RDKit. At each failure the server logs `The destination stream closed early`, from React's
HTML render: a document started going out and did not finish before the browser closed. The CI run
of September 16 failed with the same signature, before any budget change, and the larger budgets
only postponed the failure. Client server actions go out in a queue, one at a time; an action that
does not come back holds up the `saveAttempt` behind it. If the same hang happens outside the test,
in a lesson it is a completed attempt that does not get saved — which is why it calls for a cause,
not a budget. The cause has not been found yet, and the trace does not help find it, because with
it the hang does not show up.

What this could cost during a lesson: thirty students completing the same mission in the same minute means
thirty queued analyses. Each takes tens to a few hundred milliseconds, so the
wait is seconds, not minutes — but it exists, and grows with molecule size.

**Not included now; these are the known options**, ordered by cost:

- **Measure before changing.** Nobody has timed `analyzeOnServer` with classroom molecules under real
  load. Without that number, any option below is a guess dressed as engineering.
- **Move RDKit out of the event loop**, into `worker_threads` within the same process. It is the right fix
  and fits a single-container self-hosted setup.
- **More than one app process.** Resolves the queue and breaks the in-memory limits
  (`assignment.ts`, `classroom.ts`), which must become tables the same day — noted just above.

**Reconsider if** a teacher reports waiting at the end of a lesson, or the live instance shows
slow requests with more than one active class.

## Items left from the review of September 12, 2026

Two reviews read the entire repository through the eyes of someone arriving for the first time. Defects
were fixed; what follows is what was observed, measured, and deliberately left.

- **The flame-test palette colors nothing.** `--flame-litio`, `--flame-sodio`, and the other
  five exist only to feed `--cat-1`…`--cat-7`, and no file uses `--cat-*`: the product
  has no charts yet. `--t-fold`, `--t-slow`, and `--track-flat` also have no consumers. They are
  the brand narrative in `DESIGN-SYSTEM.md`, so deleting them is a decision for `ui-ux`, not cleanup —
  and the product's first chart will decide whether they remain as they are or change.
- **`assignment.ts` has 1594 lines and three subjects.** Lists and items, teacher missions, and
  the catalog with reporting. The split is already outlined: `actions/teacher-quest.ts`,
  `actions/catalog.ts`, `checkQuest` moving to `attempt.ts` alongside its sibling `saveAttempt`,
  `lib/text.ts` for rules R-13 and R-14, and `lib/rate-limit.ts` for the in-memory window
  currently written identically three times. Not now, because moving thirty exports at once
  spans the entire assignment-list delivery; it enters with the next change that already touches these files.
- **`Editor2D.tsx` has 1453 lines.** Two pieces can leave without touching the DOM: context-menu
  construction (`entriesFor`, `selectionEntries`, `commonElementOf`, and the charge,
  order, and wedge constants) and hint text (`hintFor`, `selectionCount`, `selectedWord`). Both become
  pure functions testable from the command line. `render.ts`, at 641 lines, is **not** included: it has a
  single responsibility, in the order the scene is painted.
- **`questsOfTrack` exists and nobody uses it.** Two screens filter the catalog by hand and lose the
  difficulty ordering provided by the engine's function. Replacing it takes one line in each place; what
  remains is deciding whether difficulty order is what the screens want.
- **Test identifiers in Portuguese.** There are 142, all in pt-BR, against a written rule requiring
  data keys in English. Changing them touches every `data-testid` and every test looking for one,
  without changing anything for users. The cheap option is for the rule to state that test
  identifiers are the exception, and that is for `ui-ux` to decide.

## Self-hosting — what stayed out (D-28)

- **An `arm64` image.** The image is `amd64`. Raspberry Pi and Apple Silicon Macs build
  locally with `docker compose up -d --build`, which works and takes time; publishing both
  architectures takes a `platforms:` entry in `image.yml` and doubles CI time.
- **A TLS proxy inside compose.** Today `docs/en/INSTALLATION.md` shows Caddy outside it.
  It would enter as an optional compose profile, with the domain in a variable. It awaits the first
  school that installs and asks.
- **Exporting and importing between instances.** Each self-hosted installation is its own world, with its own
  nicknames and catalog (D-28). How does a school moving from the live instance to its own take its
  students' progress? Today, it does not. It is a question for schools, and none has asked.
- **Umami inside compose.** Telemetry is opt-in, and whoever enables it runs their own Umami. A compose
  profile with it ready would make the option cheaper — and the decision to enable it remains
  with the host.
- **A lighter image.** The Prisma command line weighs close to 250 MB inside the image and only
  serves `prisma migrate deploy` at startup; when loading it requires the modules for
  `prisma studio` and `prisma dev`, so it cannot be pruned (measured on September 11, 2026: pruning
  broke migration in `effect` and `@prisma/studio-core`). The options would be applying
  migrations another way or waiting for Prisma to separate the CLI. It enters when someone complains about
  size — the whole image stays below 1 GB and starts in seconds.

## School roles — what stayed out (D-29)

D-29 delegated **one** step: an administrator, created in the terminal, promotes teachers from their
own school. Four things were deliberately excluded, and the decision says why.

- **Verified schools.** `Profile.institution` is text people enter themselves during registration;
  nobody checks it, and no screen exists to change it. In an instance with more than one school — the
  live one — schools coexist separated only by that text, and an administrator reaches everyone who
  typed the same thing. What holds this together today is someone checking the name before confirming, and the
  audit trail stating who confirmed. It enters when the live instance has two real schools
  using it; then the boundary must be an entity, not a string, and the likely path is teachers
  joining a school by code, like students join a class.
- **Writing an account's school through the interface**, including a blank one. Only the terminal does
  that, with `--escola`. D-29's first version filled an empty school during promotion to handle
  people who skipped the registration field; the audit showed that this gave any
  administrator reach over every account with a blank school on the instance, and enabled the account takeover that
  followed. Changing an account's school **is** changing who can reach it, so no screen does it. Someone
  who entered the wrong school at registration depends on whoever has server access.
- **Code invitations for teachers**, instead of direct promotion. This would be consistent with the
  product's other two flows, and people would consent instead of being promoted. It costs a table,
  expiration, and a redemption screen to solve what confirmation by name already solves. It enters on the
  day administrators do not know the email addresses of the people who will teach.
- **A screen for role history.** `RoleChange` records every change, and the
  `Teachers at this school` list shows only the most recent one per account. The complete history is available through SQL to
  whoever has server access. It enters if a school asks for a real audit.

## Considered and postponed

- [ ] Compare two analogs side by side — for advanced users, and part of the research
      track (above)
- [ ] Presentation mode for teachers to project without the editing interface
- [ ] Retrosynthesis and reaction prediction — requires a model on a GPU server, and is what the
      product promises not to do
- [ ] Protein docking — a heavy server workload, and creates expectations of biological claims
- [ ] DFT / quantum chemistry — impossible in the browser
- [ ] Open community campaigns — depends on critical mass and moderation, which does not exist
- [ ] Real-time collaborative editing
- [ ] Native app
- [ ] Simulated spectra (NMR, IR) — tempting, but a different product

## Loose ideas

_(write them here and move on)_
