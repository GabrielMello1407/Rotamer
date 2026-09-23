<!-- source: docs/ARQUITETURA.md · sha256:ea6a505f736d839b934942591fc81c5e6730a711fa791ce9a05f01fdde1673c7 -->
<p align="right"><a href="../ARQUITETURA.md">Português</a> · <strong>English</strong></p>

# Architecture

What exists in the code, and why. The reasoning behind each choice is in `DECISIONS.md`; this
document describes the shape those choices took.

## The principle

**The graph is the single source of truth.** Formula, descriptors, 3D coordinates, mission
score, and tutor text are derived from it and can be recalculated at any time. Nothing beyond
the graph—and the record of what the person did with it—is persisted as user state.

This keeps persistence minimal, makes any defect reproducible from a single object, and allows
the implementation of any derived layer to change without a data migration.

## Flow, from drawing to verdict

```
                            ┌──────────────────────────────┐
                            │  RDKit · WASM (worker)       │──► metrics, groups, stereo,
              ┌── molblock ─►  valence, descriptors        │    mission verdict
              │             └──────────────────────────────┘         │ reads
  2D editor ──► GRAPH                                               ▼
   (custom    (source of                                      ┌───────────┐
    canvas)    truth)       ┌──────────────────────────────┐   │ LLM tutor │
              │             │ OpenChemLib · WASM (worker)  │   └───────────┘
              └── graph ────►  conformation + MMFF94       │──► 3D scene, dynamics, ▲
                            │  Hessian → normal modes     │    normal modes        │ reads
                            └──────────────────────────────┘         └─────────────┘

              ◄────────────── never writes ──────────────────────────────┘
```

Every atom produced by the geometry carries the index of the graph atom it came from (`source`),
and hydrogen added by the force field carries the index of the neighbor it is attached to.
This index makes the vertex in the drawing and the sphere in the scene light up together, in
both directions (D-18).

The return path is drawn precisely because **it does not exist**. The tutor reads the metrics
and verdict and has no way to change the graph, descriptors, or score. This structurally
guarantees that no chemical claim reaches the user without passing through the deterministic engine.

## Packages

```
apps/web            Next.js 16 App Router — routes, server actions, accounts, classes, assignments, tutor
packages/
  core              graph · RDKit bridge (worker and Node) · geometry, dynamics, and normal modes
  i18n              pt-BR and English: typed dictionary, formatting per language, the chemistry sentences
  editor2d          custom 2D canvas: tools, selection, context menu, shortcuts, history
  viewer3d          Three.js + React Three Fiber: folding, vibration, modes — rendering, no chemistry
  quests            declarative missions, goal extraction, and scoring
  ui                tokens, CPK, and basic components
```

**The dependency rule:** `core` depends on no one, and no one depends on `editor2d`.

- `core` knows nothing about React, Three.js, or the DOM. It runs in command-line tests, making
  the chemistry testable without a browser and quick to verify. RDKit enters through two
  loaders—the browser loader (`chemistry/browser.ts`, inside the worker) and the Node loader
  (`chemistry/node.ts`, from the npm package)—and is the same engine in both.
- `quests` depends only on `core`: a mission is a list of conditions on the **molecule** that
  RDKit analyzed, never on the drawing. The same function therefore evaluates in the browser,
  for an instant response, and on the server, before saving.
- **No package** depends on `editor2d`—it is a leaf. The app imports it because it needs it to
  draw the screen; the rule guarantees that the drawing interface can be replaced without
  touching anything underneath it.

- `i18n` also depends on no one, and that is why `core` **does not use it**: the dependency
  would exist by the back door. The core returns a refusal code and a functional-group
  identifier; it is `i18n` that turns them into sentences. See D-30 and `LANGUAGES.md`.

When one of these rules needs to be broken, the right answer is almost always to move the
logic into `core`, rather than create the dependency.

### What lives in each package

| Package | Contents |
|---|---|
| `core/graph` | graph types, operations (atom, bond, wedge, charge), V2000 molblock |
| `core/chemistry` | worker protocol via Comlink, `analyze` (sanitization, descriptors, SMARTS groups, R/S/E/Z stereo), `depict` (RDKit SVG), `tidy` (clean up the drawing), elements |
| `core/geometry` | conformation and MMFF94 through OpenChemLib, velocity-Verlet at 300 K, numerical Hessian and Jacobi diagonalization for normal modes |
| `editor2d` | `store.ts` (Zustand, history, selection), `render.ts`, `Toolbar`, `PeriodicTable`, `ContextMenu`, `Shortcuts`, `Popover`, `keys.ts`, `templates.ts` (rings) |
| `viewer3d` | `Viewer3D`, `Molecule` (spheres and sticks, CPK), `folding.ts`, `sticks.ts` |
| `quests` | `catalog.ts` (what decides: slug, track, conditions), `catalog-text.ts` (title, brief, and hints, in both languages), `conditions.ts`, `evaluate.ts`, `extract.ts` (goals from the molecule, D-25), `types.ts` |
| `ui` | `tokens.css`, `cpk.css`, `base.css`, `Button`, `Card`, `Formula`, `Label`, `Logo`, `NumberValue`, `SourceBadge` |
| `i18n` | `dictionary.ts` (the pt-BR/English pair the type system enforces), `locale.ts` (cookie, `Accept-Language`), `format.ts` (numbers and dates per language), `plural.ts`, `parity.ts`, `react.tsx` (provider and hooks), `messages/chemistry.ts` (refusal codes and functional groups become sentences) |

## The stack and its rationale

| Layer | Choice | Why |
|---|---|---|
| Application | Next.js 16 (App Router) + strict TypeScript | SSR for public molecule pages; server actions without a separate API layer |
| Chemistry | RDKit.js (WASM) in a Web Worker via Comlink—and on the server, from the npm package | See D-02. The same engine reevaluates on the server what the browser evaluated |
| Geometry | OpenChemLib: conformation + MMFF94 | The published RDKit.js has neither a 3D generator nor a force field. See D-10 |
| Vibration | Velocity-Verlet over the numerical MMFF94 gradient, at 300 K | The same physics as folding, in a different regime. See D-14 |
| Normal modes | Finite-difference Hessian, mass weighting, rigid-body projection, Jacobi | 3N − 6, or 3N − 5 when linear. See D-20 |
| 3D | Three.js + React Three Fiber | Rendering engine only—no chemistry inside |
| 2D editor | Custom 2D canvas + Zustand | It is the distinguishing feature; no ready-made library gives it the right feel |
| Data | Postgres + Prisma 7 with the `pg` driver | A container in development and in the Docker image; no managed service. See D-11 |
| Accounts | bcrypt (cost 12); random-token sessions, with only the SHA-256 digest in the database | `httpOnly`, `sameSite=lax` cookie, `secure` in production; 30 days |
| LLM | Gemini, server route, closed-schema JSON | A closed schema prevents the model from inventing a chemistry field. Optional: disabled without a key |
| Telemetry | Self-hosted Umami, opt-in | No cookies; off by default; a closed list of events in `apps/web/lib/track.ts` |
| Delivery | Docker image (`Dockerfile`, Next `standalone` output) + `docker-compose.yml` with Postgres | Self-hosting in three commands (D-28). See `INSTALLATION.md` |

## The server

Every write goes through a **server action** in `apps/web/app/actions/`, with input validated
by `zod`. There is no public API route beyond the pages.

| File | What it does |
|---|---|
| `account.ts` | create an account, sign in, sign out |
| `attempt.ts` | save an attempt (`saveAttempt`), open a mission (`openQuest`), read progress |
| `library.ts` | save, remove, and list molecules—the shelf |
| `naming.ts` | give a structure a nickname (D-15), read the nickname and naming status |
| `search.ts` | PubChem name search, with a database cache and circuit breaker |
| `tutor.ts` | ask the tutor, with a cache keyed by `(inchiKey, missão, tipo)` and a daily limit |
| `recovery.ts` | issue a password reset code (teachers) and change a password with it (D-19) |
| `staff.ts` | read who teaches at the school, promote to teacher, and demote—administrators only (D-29) |
| `classroom.ts` | create a class, join with a code, read the class board (D-22) |
| `assignment.ts` | class assignments, teacher missions, searchable catalog, and reports (D-25 to D-27)—see `CLASS-ASSIGNMENTS.md` |

Rules that apply to every action:

- **The browser sends the drawing, never the verdict.** The mission `spec` runs in the browser
  for an instant response, then runs again on the server—on the molblock, reanalyzed by Node's
  RDKit—before saving any `Attempt`.
- **Role is a prerequisite; ownership is authorization.** `requireTeacher` says that the
  account teaches; every write starts with `ownedClassroom` / `ownedAssignment` /
  `ownedTeacherQuest` (`lib/roles.ts`). No one assigns their own role: it comes from the
  `apps/web/scripts/promote-teacher.mjs` script, run by the instance administrator (D-19), or
  from an administrator at the school itself, who can promote **only as far as teacher**
  (D-29). The three roles—`aluno`, `professor`, `administrador`—are read in one place,
  `teaches` in `lib/roles.ts`.
- **Uniform rejection.** A nonexistent slug and a slug the account cannot access get the same
  message, `Essa missão não existe.` (This mission does not exist); a wrong password and an
  unknown email get the same `E-mail ou senha não conferem.` (Email or password does not match).
  An action must not become an existence oracle.
- **No database, no wall.** `hasDatabase()` is false when `DATABASE_URL` is absent: accounts,
  classes, assignments, and the shelf disappear from the interface, and the editor works in full.
- **Limits.** Tutor requests per account per day (`TutorUsage`); mission checks per account
  per minute, authored-content saves per day, wrong class codes per hour, and role lookups per
  administrator per hour—the latter are in memory, in a single process.

## Data model

The schema, with comments for every column, is `apps/web/prisma/schema.prisma`; migrations sit
beside it in `prisma/migrations/`, and are all additive.

| Group | Tables | What they store |
|---|---|---|
| Account | `Profile`, `Session`, `ResetCode` | users (`role` is `aluno` or `professor`, `institution` is the school), sessions by token digest, password reset codes by digest |
| Work | `Molecule`, `MoleculeName`, `PubChemName`, `PubChemKnown` | the shelf (the graph, unique per owner and InChIKey), the nickname per InChIKey with authorship, and PubChem's previous answers |
| Mission | `Attempt`, `QuestOpen`, `TutorHint`, `TutorUsage` | attempts with scores reevaluated on the server, who opened what (the board's “stuck” status, D-22), tutor cache, daily count |
| Class | `Classroom`, `Enrollment`, `Assignment`, `AssignmentItem`, `TeacherQuest`, `QuestReport` | class with a code, enrollment, assignment with ordered items, teacher mission with its answer and goals extracted from it, report |

**There is no table for catalog missions.** The catalog lives in `packages/quests/src/catalog.ts`,
versioned with the engine that evaluates it (D-12): a mission in the database could disagree
with the `spec` the code executes, changing a score without anyone having changed anything.
`Attempt.questSlug` stores the `slug`; teacher missions use the same field, in the
`professor:<id>` namespace.

**The answer key never leaves.** `TeacherQuest.answerMolblock` and `answerInchiKey` never appear
in any `select` on a student path (R-3, `CLASS-ASSIGNMENTS.md`).

## How the product starts

- **Development:** `docker compose up -d postgres` starts only the database; `pnpm dev` starts
  the app with `apps/web/.env`. `predev` copies RDKit and the MMFF94 tables from `node_modules`
  to `apps/web/public/chem/` and generates the Prisma client.
- **Image:** the `Dockerfile` builds in three stages and carries only Next's `standalone`
  output, plus the schema, migrations, promotion script, and Prisma CLI.
  `docker/entrypoint.sh` applies pending migrations when `DATABASE_URL` is present, and starts
  only the editor when it is absent. No secrets enter the image.
- **Full instance:** `docker compose up -d` starts the app and Postgres, with the
  `rotamer-postgres` volume holding the data. Details, variables, and operations are in
  `INSTALLATION.md`; the instance maintained by the author is described in `DEPLOY.md`.
- **Continuous integration** (`.github/workflows/ci.yml`): one job without a database (lint,
  types, core tests—action tests skip with a warning), one with Postgres (migration, action
  tests with `REQUIRE_DATABASE=1`, Playwright on desktop and mobile), and one that builds the
  image and starts it against a fresh database. The image is published to GHCR on every `v*`
  tag (`image.yml`).

## Performance—constraints, not suggestions

- **All heavy work runs in the worker.** Sanitization, descriptors, conformation, dynamics,
  and the Hessian never touch the main thread. Drawing continues at 60 fps while RDKit works.
- **Debounce by intent, not by a fixed interval.** Metrics after every 120 ms of silence; 3D
  geometry only when topology changes, never when an atom is dragged.
- **Cache by InChIKey.** Conformation, trajectory, and descriptors are pure functions of the
  graph. The same molecule is never calculated twice.
- **WASM loads after the first paint**, and the 3D scene loads on demand. `/chem/*` is served
  with `immutable`, and `prebuild` writes `.br` and `.gz` files alongside it for a proxy that
  can serve them. Measured target: the first interactive drawing in under 3 s on a low-end
  phone over 3G, and 605 ms on a return visit with the engine cached.

A public-school student on a low-end phone is the use case, not the edge case.

## The AI layer

The tutor is the only part of the product that can be wrong, and the only part marked in amber.

1. The prompt (`lib/tutor/prompt.ts`) receives the **already calculated** descriptors, the
   groups RDKit recognized, and the mission verdict goal by goal, and is instructed
   never to recalculate or contradict them.
2. The output (`lib/tutor/schema.ts`) is closed-schema JSON, **with no numeric fields**: the
   model writes `{{tpsa}}`, and the interface supplies the value from RDKit's calculation.
   Text containing a bare digit is rejected.
3. Every on-screen block carries a source indicator—green for calculated, amber for generated.
4. Cache by `(inchikey, quest_slug, tipo_de_dica)` in `TutorHint`. The same error in the same
   mission does not incur the cost twice—and the text discusses the chemistry, not the person.
5. A daily per-account limit (`TUTOR_DAILY_LIMIT`), falling back to handwritten hints.
6. The default model is an alias with a fixed fallback (`GEMINI_MODEL` changes it without code
   changes), because models are retired and the symptom used to be the tutor going silent as
   though no key were configured.
7. Teacher missions: the prompt receives the goals' **generated labels**, never the
   instructions written by the teacher (R-9).

## Tests

| Where | What | How it runs |
|---|---|---|
| `packages/core/test` | reference values from `CLAUDE.md`, groups, stereo, geometry, dynamics, modes, cleanup | Vitest, RDKit from the npm package, no browser |
| `packages/quests/test` | catalog, verdict, `Assessable`, goal extraction | Vitest |
| `packages/editor2d/test` | 2D geometry, rendering, store, rings | Vitest |
| `packages/i18n/test` | language negotiation, every core refusal with a sentence in both languages, every document with an English twin and an up-to-date hash | Vitest, no browser |
| `apps/web/lib/*.test.ts` | nicknames, PubChem with recorded responses, password reset codes, tutor prompt and schema | Vitest |
| `apps/web/app/actions/assignment.test.ts` | assignment and catalog rules, one by one, against Postgres | Vitest; skips with a warning without a database, fails with `REQUIRE_DATABASE=1` |
| `apps/web/e2e/*.spec.ts` | the product in the browser, desktop and mobile, against the production build | Playwright, `pnpm test:e2e` |

## What the system never claims

- That it predicted a reaction product or a synthesis route.
- That a molecule has biological activity. Descriptors are descriptors.
- That it replaces PyMOL, ChemDraw, or Maestro.
- That it names compounds. It lets people give them nicknames, with authorship always attributed.
