<!-- source: docs/PITCH.md · sha256:fa7aa67750b9d1eb26803a5363166cd9a21877df94832f9484c10d44ffcc2a2d -->
<p align="right"><a href="../PITCH.md">Português</a> · <strong>English</strong></p>

# Rotamer — why it exists

> **Draw a molecule in 2D. Discover what it is in 3D.**
> A Portuguese-language environment where molecular structure stops being rote memorization and becomes spatial
> intuition — with chemistry validated by a deterministic engine, not an AI guess.

---

**What it is:** an **open-source, MIT-licensed, free** tool for **teaching** organic chemistry
(D-28). Students use it; teachers decide what enters the lesson; researchers are welcome
advanced users. It does not compete with ChemDraw, Maestro, or PyMOL — and it is not sold to anyone: a
live instance is maintained by the author, and any school can run its own with Docker
([INSTALLATION.md](INSTALLATION.md)).

> How the idea got here, with pivots and mistakes along the way: [ORIGINS.md](ORIGINS.md).

## The problem

Organic chemistry is the subject with the highest failure rate in science and engineering courses, and the one most likely to drive high
school students away from the field. And the reason is specific, not generic:

**The book is flat; the molecule is not.** Students memorize that cyclohexane “forms a chair” without
ever seeing a chair form. They memorize that a double bond “does not rotate” without ever seeing
a single bond rotating alongside it for comparison. Spatial intuition — the one thing that
truly separates understanding organic chemistry from not understanding it — is precisely what teaching
materials cannot convey.

Tools that could solve this exist, but none serves this audience:

| Tool | Why it does not solve the problem |
|---|---|
| ChemDraw, Maestro, PyMOL | Expensive, require installation, designed for trained researchers. No student opens them. |
| MolView, ChemTube3D | Free, but dated, in English, designed for desktop. |
| PhET and simulators | Great for isolated concepts; do not do real organic chemistry. |
| YouTube videos | Passive. Students watch; they do not build. |

And none of them speaks Portuguese.

## Why now

Three things became possible almost simultaneously:

1. **RDKit compiles to WebAssembly.** Twenty years of validated computational chemistry run inside
   the browser, without a server, for free.
2. **WebGL is universal.** Smooth 3D rendering on a public school's phone, without installing anything.
3. **LLMs are cheap enough to tutor.** Explaining why an attempt failed, in Portuguese, for
   pennies — provided they never decide the chemistry.

## What the product does

A web environment where structures are drawn as flat formulas — as every chemist does — and
three-dimensional geometry appears immediately:

- **Folds.** The molecule starts tangled and folds until it finds its shape. This is not decorative
  animation: these are actual frames from energy minimization in the MMFF94 force field.
- **Vibrates.** Molecular dynamics in the same force field at 300 K — and **normal modes**, one by one,
  each with its own frequency. A single bond rotates, a double bond stays rigid, an aromatic ring
  shakes without leaving its plane. Students *see* the rule instead of memorizing it.
- **Evaluates.** Valence, formula, mass, functional groups, TPSA, logP, stereogenic centers —
  all calculated by RDKit and shown as the student draws. Where RDKit differs from PubChem, the
  screen shows RDKit's value and states whose definition is used.
- **Teaches.** When something is wrong, the error explains the chemistry; and if a key is configured, the tutor
  explains in Portuguese why it was wrong — reading the numbers already calculated, labeled as a hypothesis.

And it has a storyline: **missions** in the structure, geometry, and property tracks, from “build an ester
with four carbons” to a stereogenic center that only works with the correct wedge; **class assignment lists**,
which teachers assemble from catalog missions or create **by drawing the answer** — the product extracts
goals from the molecule, never from typed text; and a **searchable catalog**, with signed missions
published by teachers. The same tool serves a 16-year-old student and a master's student.

## What cannot be copied quickly

1. **The handwritten 2D editor.** This is where the feel lives — dragging from an atom and seeing the next
   one appear already bonded, selecting a section and moving it as a block, tidying the drawing and knowing what
   happened to every wedge. No ready-made library delivers that.
2. **The strict boundary between engine and AI.** The deterministic core decides; AI only explains. It is
   an architectural decision, not a feature — and it is what earns a chemist's trust.
3. **Scientific rigor inside a teaching tool.** Educational competitors simplify
   chemistry until it becomes wrong. Here the engine is the same one a researcher would use — and that
   matters because **a chemistry teacher is a chemist**: an app error does not confuse one student,
   it confuses an entire classroom.
4. **Portuguese as a first-class language.** Error messages that explain the chemistry, and a
   body of missions aligned with what is taught in Brazil.
5. **Teachers see where the class got stuck** — not who did best, not what each student drew
   (D-22). Information for teaching, not ranking.

## What it costs, and for whom

Nothing. The code is MIT; the live instance is maintained by the author without an availability guarantee; and
anyone needing a guarantee — an education department's IT team, a university — runs their own instance with
three commands and manages their own database. The existing cost is the author's: a small server and a
language-model key for the tutor. If that ever becomes unaffordable, the instance shrinks; the code
does not close (D-28).

## What already exists

Everything described above, with tests: three hundred and some core and server tests that run without a
browser, and 210 end-to-end tests on desktop and mobile. Values match the literature —
aspirin as C₉H₈O₄ with 180.16 g/mol and TPSA 63.6; benzene as a regular 120° hexagon; caffeine
with aromatic imidazole, the case the custom-kernel prototype got wrong.

What is missing is fieldwork: observation sessions with teachers and students, language review by
a chemist, and the live instance at its own address ([ROADMAP.md](ROADMAP.md)).

## Accepted risks

- **Scope.** The biggest of all. Mitigated by `OUT-OF-SCOPE.md`: out-of-scope ideas go
  there, not into the code.
- **A chemical error in public.** A chemist finding a subtle error destroys trust. That is why
  RDKit is never bypassed, and the `reviewer` has veto power over this.
- **Adoption.** Public school teachers have little time and little bandwidth. The product must
  work on low-end phones and make sense in five minutes, or it will not enter the classroom.
- **Tutor cost.** Controlled by caching, per-user caps, and fallback to handwritten hints
  — and the tutor is optional: without a key, it turns off and the product remains complete.

## What helps

Teachers testing with molecules from their own lessons and saying where they got stuck. IT teams installing it and saying
where installation misled them. Chemists reading the on-screen text. Programmers reading
[ARCHITECTURE.md](ARCHITECTURE.md) and the unbreakable rule in [`CLAUDE.md`](../../CLAUDE.md).
