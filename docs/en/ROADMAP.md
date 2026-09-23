<!-- source: docs/ROADMAP.md · sha256:c112e78a31fd15c7ed712e82f6d935d3eb2d5177d1b3c051605a2731ac9e62ae -->
<p align="right"><a href="../ROADMAP.md">Português</a> · <strong>English</strong></p>

# Roadmap

> Phases are an **order**, not a date promise. What is marked done exists in the
> code, with tests; what remains open is what the product still needs to serve someone outside this
> repository.

Pace reference: 20h per week. Each phase ends with something valuable on its own.

---

## Phase 0 · Foundation — complete, except going live

- [x] Turborepo monorepo, strict TypeScript, ESLint, Vitest, Playwright
- [x] `tokens.css` in `packages/ui` and UI primitives
- [x] RDKit.js loading in a worker through Comlink, with a test that sanitizes aspirin
- [x] Continuous integration in GitHub Actions — lint, types, core tests, action tests with
      Postgres, and desktop and mobile browsers
- [ ] **Live instance with its own domain** — see `docs/en/DEPLOY.md`; depends on a VPS and registrar

---

## Phase 1 · Core — complete

The whole product without accounts, a server, or AI. Everything on the client.

- [x] 2D editor: drawing, drag-to-create, bond order, element, move, erase,
      undo, fit in view — plus rectangle and fragment selection, right-click menu,
      long press, page-wide shortcuts, periodic table, and shortcuts in a popover
- [x] Tidy the drawing through RDKit, with a report of what happened to each wedge (D-24)
- [x] RDKit bridge: sanitization, SMILES, InChIKey, descriptors, charge in the formula
- [x] Functional groups recognized through SMARTS in RDKit, with names in Portuguese and English
- [x] Geometry and animated folding — OpenChemLib conformation and MMFF94 (D-10); elements outside
      MMFF94 show their shape without vibration and explain why
- [x] Molecular dynamics vibration — velocity-Verlet over the numerical MMFF94 gradient at
      300 K, trajectory precalculated in the worker and cached by InChIKey (D-14)
- [x] Normal modes — Hessian, mass weighting, rigid-body projection, and diagonalization:
      3N − 6 (3N − 5 if linear), each with its own wavenumber and motion (D-20)
- [x] Double and triple bonds as parallel rods in the scene; CIP letters in the drawing and scene
- [x] 2D↔3D synchronization — the highlighted atom is the same (D-18); light and dark themes; responsive down to 390px
- [x] Error messages that explain the chemistry, not the code — in Portuguese and English (D-30)

---

## Phase 2 · Storyline — complete

- [x] Mission engine with declarative `spec` — the same function evaluates on client and server
- [x] 15 missions covering Structure, Geometry, and Property, with handwritten hints
- [x] Paste SMILES and name search through PubChem, with a third state when PubChem does not
      respond
- [x] Open-ended tool mode, **without missions, scores, or achievements** (D-09)
- [x] Tutor with a closed schema and no numeric fields, source indicator, cache by
      molecule/mission/type, and a daily cap — optional: without `GEMINI_API_KEY` it turns off; the default
      model uses an alias with a fixed fallback, because models leave circulation (`GEMINI_MODEL`
      changes it without touching code)
- [x] Accounts, saved progress, server-side `spec` reevaluation — Postgres (D-11)
- [x] Password recovery through teacher-issued codes, no email in the path (D-19)
- [x] My molecules: save, start another, export SVG and PNG; giving a nickname also saves (D-15)
- [x] Public molecule page with SSR and Open Graph — `/m/<smiles>`, no database
- [x] Stereochemistry: wedges and dashes in the editor, `wedge` in the graph, V2000 molblock, `R`/`S`/`E`/`Z`
      assigned by RDKit, enantiomers as mirrored shapes in the scene, and the mission that only succeeds with the correct
      wedge (D-21)

---

## Phase 3 · Teacher — complete in code, open in the field

- [x] Teacher dashboard: classes with codes, a board showing where each student got stuck — progress, never
      molecules (D-22)
- [x] **Class assignment lists**: teachers assemble sequences from catalog missions or create their own
      **by drawing the answer** — the product extracts goals from the molecule, never from typed
      text; a mission whose own answer does not satisfy it is rejected; the answer key never reaches
      students (D-25, `docs/en/CLASS-ASSIGNMENTS.md`)
- [x] **Searchable catalog**, for account holders, with missions published by teachers —
      opt-in per mission, visible authorship, reporting with an audit trail (D-26, D-27)
- [x] **A school manages itself**: its first administrator comes from the terminal and promotes
      teachers from the same school through the interface, checking the name before writing — only up to
      teacher, and every role change leaves a trail (D-29)
- [x] Telemetry implemented and disabled — self-hosted Umami, no cookies, a closed list of
      events in `apps/web/lib/track.ts`; without both variables, the script does not even load
- [x] Backup and restore rehearsal as scripts (`scripts/backup-db.sh`, `restore-db.sh`)
- [x] Low-end phone performance measured with throttling: loading the 3D scene on demand reduced first
      paint from 11.7 s to 6.9 s; `immutable` on the engine; precompressed `.wasm`

What is missing here **is not code**:

- [ ] Observation sessions with 3 teachers and 8–10 students — watching, explaining nothing. The
      nomenclature questions, and the rule **not to raise the subject**, are below
- [ ] Nomenclature and language review by a chemist
- [ ] Live telemetry and scheduled cron backups with the first restore rehearsal completed (D-11)
- [ ] Usability fixes that only the sessions will reveal

### What to ask teachers about nomenclature — and in what order

The product does not name compounds, by choice (D-15). The session means watching without explaining anything. Nomenclature is not
introduced: **wait**.

1. **Do not raise the subject.** Record whether the teacher or student asks for a name unprompted: at
   what minute, and with what structure on screen. Someone who does **not** ask provides data just as useful as someone who
   does.
2. **If they ask**, the only question is *“what would you do with that name in your lesson?”* — then
   be silent. Record their answer in their words.
3. **If nobody asks before the end**, when closing, in this exact order:
   - *“In your class, when nomenclature comes up, what do students do more: receive a structure and
     write its name, or receive a name and draw the structure?”*
   - *“If Rotamer could do only one of those, which would serve you better?”*
   - *“And if the name came out in English — 'ethyl acetate' instead of 'acetato de etila' — would that
     help, get in the way, or be worse than no name at all?”*

The third question determines the cost of any path: it separates a term mapping
from a nomenclature dictionary maintained forever. The paths, with the cost of each, are
in `OUT-OF-SCOPE.md`; the research behind them is in `docs/en/research/nomenclature.md`.

---

## Phase 4 · Open — in progress

Rotamer is open-source, MIT, and noncommercial (D-28). What that decision requires:

- [x] MIT license, `CLAUDE.md`, and agents describing an open project
- [x] **Self-hosting in three commands** — a three-stage `Dockerfile` with `standalone` output,
      `docker-compose.yml` with the app and Postgres, migration at startup through `docker/entrypoint.sh`,
      image built in CI on every push and published to GHCR on every `v*` tag
- [x] **Documentation for three audiences**, in `docs/` and, in English, `docs/en/`: users (`USER-GUIDE.md`), installers
      (`INSTALLATION.md`), contributors (`ARCHITECTURE.md`, `CONTRIBUTING.en.md`); documents that
      described intentions now describe what exists, and obsolete material was removed
- [x] Opt-in telemetry, stated clearly — off by default, and `INSTALLATION.md` says what
      it measures and what never leaves
- [x] **First `v0.1.0` tag** (September 19, 2026) — the published image exists, the package is
      public in GHCR, and `docker compose pull` works without building
- [x] **Landing page in a separate repository**, static, pulling `docs/` at build time —
      `rotamer-site` (Astro + Starlight): a landing page with real product screenshots and the
      complete documentation at `/docs/`, with edit links pointing to the source file
- [ ] **Publish `rotamer-site`** — create the GitHub repository and enable Pages; while
      Rotamer is private, the workflow needs a read token in `ROTAMER_TOKEN`
- [x] **The product in two languages** (D-30) — pt-BR and English end to end: screens, chemistry
      refusals, the mission catalog, metadata, and the link image. The choice lives in a cookie,
      is read on the server, and the pt-BR/English pair is enforced by the compiler, not by review.
      Opening the code without opening the language would have meant offering a tool that only
      one kind of classroom uses
- [x] **The documentation in English** — every reader-facing document has an English twin
      (`README.en.md`, `docs/en/`), with the original's hash at the top and a test that fails when
      the Portuguese changes and the English does not follow

**Open question, recorded in `OUT-OF-SCOPE.md`:** the entire roadmap serves teaching. Without the
commercial tension that held it back, the research track becomes a legitimate question again — and still
awaits Phase 3 sessions for a written answer.

---

## Risks

| Risk | Sign it happened | What to do |
|---|---|---|
| **Scope creep** — the most likely | A new idea enters the code without going through `OUT-OF-SCOPE.md` | New ideas go to `OUT-OF-SCOPE.md`. The `pm` decides whether they enter. |
| **A chemist finds an error** | Someone points out incorrect tautomerism or stereochemistry | Never bypass RDKit. Admitting it quickly builds more trust than no errors at all. |
| **Tutor cost runs away** | The bill rises without proportional usage | Cache by InChIKey, daily caps, fallback to written hints; and the tutor is optional. |
| **Nobody uses it** | Phase 3 with no interested teachers | Talk to teachers **now**, with the product as it is. |
| **Heavy WASM on phones** | More than 5 s to the first drawing on 3G | RDKit loads after first paint; the 3D scene loads on demand. |
| **The live instance costs more than the author can sustain** | Server or key costs strain the budget | Shrink the instance. The code does not close (D-28). |

## How to know whether it is working

**Real signals**

- A teacher shares the link in the class group without being asked
- Someone returns on another day, without a reminder
- A molecule built in Rotamer appears on a lesson slide
- A school runs its own instance
- A chemist opens an issue pointing out a subtle error — it means they took it seriously

**Misleading signals**

- Likes
- Launch-day traffic spikes
- Praise for the visuals without anyone building a molecule
