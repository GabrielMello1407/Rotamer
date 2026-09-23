<!-- source: README.md · sha256:fcbcd1887ee0a61aeed545fcd6dad2b3e732194394829591ccb0466910842ae7 -->
<p align="right"><a href="README.md">Português</a> · <strong>English</strong></p>

<div align="center">
  <img src="brand/rotamer-mark.svg" width="88" alt="Rotamer">
  <h1>Rotamer</h1>
  <p><strong>Draw a molecule in 2D. Discover what it is in 3D.</strong></p>
  <p>A tool for teaching organic chemistry — deterministic validation, computed geometry, AI as a tutor and never as a judge. Open source, MIT license, free.</p>
</div>

---

## What it is

A web environment where you draw a structure as a skeletal formula and the three-dimensional
geometry appears at once — folding until it finds its shape, then vibrating under molecular
dynamics. Alongside come the formula, the mass, the functional groups, the descriptors, the
normal modes of vibration, and the verdict on the mission in progress.

**Who it is for.** For those who teach and those who learn organic chemistry. Students use it;
teachers build assignments for the class and create missions by drawing the answer; researchers
are welcome as advanced users — paste the SMILES of the compound you already have and work with no
mission and no score. The product does not compete with ChemDraw, Maestro, or PyMOL, and does not
pretend to.

**Rigor is not optional because this is education.** A chemistry teacher is a chemist: if the app
states something wrong, they are the one who catches it. And in a teaching tool, an error does not
confuse one user — it confuses a whole classroom.

## Try it

- **On your machine, with Docker** — clone, copy `.env.example` to `.env`, change
  `POSTGRES_PASSWORD`, and:

  ```
  docker compose up -d
  ```

  It starts the app and Postgres, applies the migrations, and opens `http://localhost:3000`.
  Variables, the first teacher, updates, backups, and a proxy with TLS are in
  [docs/en/INSTALLATION.md](docs/en/INSTALLATION.md).
- **On the instance the author maintains:** the address goes here once it is live.
- **To develop:** `pnpm install`, `docker compose up -d postgres`, `pnpm dev`. The whole path is in
  [CONTRIBUTING.en.md](CONTRIBUTING.en.md).

How to use it, screen by screen: [docs/en/USER-GUIDE.md](docs/en/USER-GUIDE.md).

## The rule that does not break

> **The deterministic core decides. AI explains.**

| Question | Who answers |
|---|---|
| Is it valid? Valence, formula, mass, SMILES, InChIKey, TPSA, rings, rotatable bonds, R/S/E/Z | **RDKit.** Never the LLM. |
| What is its shape? How does it vibrate? What are the normal modes? | **MMFF94**, through OpenChemLib. Never the LLM. |
| Was the mission completed? What is the score? | **The mission engine**, on the server. Never the LLM. |
| Why is it wrong, and how do I fix it? | The LLM, reading the numbers already calculated, labeled as a hypothesis |

An LLM gets 90% of valence questions right, and in the other 10% it produces a beautiful,
confident, wrong explanation. With a student, it slips by. With a chemist, it ends the product.
Every block on screen declares its origin: a green dot for calculated, amber for generated. The
tutor is optional: with no key configured, it switches itself off and the product stays whole.

## Architecture

```
apps/web            Next.js 16 · App Router · routes, accounts, classes, assignments, tutor
  └── packages/
      core          graph · RDKit worker · geometry · descriptors · normal modes
      i18n          the two languages: typed dictionary, formatting, the chemistry sentences
      editor2d      custom 2D canvas, tools, selection, history
      viewer3d      Three.js · folding and molecular dynamics
      quests        declarative missions, goal extraction, and scoring
      ui            tokens and components
```

**Dependency rule:** `core` depends on no one, and no one depends on `editor2d`. The core runs in
command-line tests, without a browser.

The **graph is the single source of truth**. Formula, descriptors, 3D coordinates, score, and
tutor text are derived from it and can be recalculated. The **server does not trust the client**:
the browser sends the drawing, never the verdict.

| Layer | Choice |
|---|---|
| Application | Next.js 16 + strict TypeScript |
| Chemistry | RDKit.js (WASM) in a Web Worker via Comlink — and on the server, to re-evaluate |
| Geometry | OpenChemLib · conformation + MMFF94 |
| Vibration | velocity Verlet on the MMFF94 gradient, at 300 K; normal modes from a numerical Hessian |
| 3D | Three.js + React Three Fiber |
| 2D editor | custom 2D canvas + Zustand |
| Data | Postgres + Prisma |
| Tutor | Gemini, server route, closed-schema JSON with no numeric field |

Performance target: first interactive drawing in under 3 s on a low-end phone over 3G — the WASM
loads after the first paint, the 3D scene on demand. A public school is the use case, not the edge
case.

## Design system

The palette comes from the **flame test** — the color each element emits when it burns. The
neutrals come from the blue cone of the Bunsen burner: grays with a blue-violet bias, never pure
gray.

| Role | Element | Light | Dark |
|---|---|---|---|
| Brand / action | Copper | `#00806C` | `#35D8BC` |
| Success | Barium | `#537D29` | `#A0DC63` |
| Warning / AI hypothesis | Sodium | `#9F6507` | `#F7B84B` |
| Error | Lithium | `#DE1A4E` | `#FF6B85` |
| Information | Caesium | `#4C5FD5` | `#8B99F5` |

> **CPK belongs to the atom.** No button, link, border, or semantic state uses a CPK color. If the
> interface paints something red, red stops meaning oxygen. The brand accent is teal because no
> common element is teal in CPK.

Typography: **Archivo** (display), **IBM Plex Sans** (interface), **IBM Plex Mono** (every
number, always with `tabular-nums`). Tokens in
[`packages/ui/src/tokens.css`](packages/ui/src/tokens.css); the rest in
[docs/en/DESIGN-SYSTEM.md](docs/en/DESIGN-SYSTEM.md).

## Brand

A **Newman projection** in the staggered conformation: you look along the axis of a single bond.
The circle is the back atom; the three strokes leaving the center are the front atom's bonds; the
three leaving the edge are the back atom's. The 60° separation is the lowest-energy conformation —
the one the molecule tends toward.

| File | Use |
|---|---|
| `brand/rotamer-mark.svg` | main symbol, front strokes in `#00A98F` |
| `brand/rotamer-mark-mono.svg` | single color, for engraving and busy backgrounds |
| `brand/rotamer-favicon.svg` | below 32px — thicker stroke, smaller circle |

A rotamer is the isomer that exists because of rotation around a single bond — the product's
signature moment, when the vibration shows ethane turning freely and ethene refusing to.

## What this project does not do

- It does not predict the product of a reaction or propose a synthesis route.
- It does not claim biological activity. Descriptors are descriptors.
- It does not name compounds. It lets you **give a nickname** — authorship of a nickname, always
  with the name of whoever gave it.
- It does not compete with PyMOL, ChemDraw, or Maestro.

## Contributing

Start with [CONTRIBUTING.en.md](CONTRIBUTING.en.md): the path is fork, branch, pull request, and
CI runs on your PR. The nonnegotiable rules are in [CLAUDE.md](CLAUDE.md) (in Portuguese), and the
map of the code is in [docs/en/ARCHITECTURE.md](docs/en/ARCHITECTURE.md). Every change ends with a
test that would fail without it; new chemistry needs a case in `packages/core/test/` that runs
without a browser. An out-of-scope idea goes into
[docs/en/OUT-OF-SCOPE.md](docs/en/OUT-OF-SCOPE.md) before it becomes code.

**Three contributions do not need the whole environment:** reporting a chemistry error (it is an
issue, with its own form, and it is the report that matters most here), fixing a document that
disagrees with the code, and adding a test case in `packages/core/`, which runs without a browser
and without a database.

Conduct is in [CODE_OF_CONDUCT.en.md](CODE_OF_CONDUCT.en.md) — the product is used by teenagers in
class, and that changes what goes into an issue. A security flaw does **not** go into a public
issue: the private path, and what counts as a flaw, are in [SECURITY.en.md](SECURITY.en.md).

```
pnpm dev          # app in development
pnpm test         # Vitest — the core runs without a browser; the action tests need Postgres
pnpm test:e2e     # Playwright, desktop and mobile
pnpm lint · pnpm typecheck
```

## License

**MIT.** See [LICENSE](LICENSE). The base libraries and their licenses are in
[docs/en/THIRD-PARTY.md](docs/en/THIRD-PARTY.md); every dependency must be compatible with MIT for
redistribution.

## Documentation

| Document | What it covers |
|---|---|
| [docs/en/USER-GUIDE.md](docs/en/USER-GUIDE.md) | How to use it, for students and teachers |
| [docs/en/INSTALLATION.md](docs/en/INSTALLATION.md) | How to run your own instance with Docker |
| [docs/en/ARCHITECTURE.md](docs/en/ARCHITECTURE.md) | Layers, packages, data flow, data model |
| [docs/en/DESIGN-SYSTEM.md](docs/en/DESIGN-SYSTEM.md) | Color, typography, shape, motion, brand |
| [docs/en/CLASS-ASSIGNMENTS.md](docs/en/CLASS-ASSIGNMENTS.md) | Class assignments: model, server rules, screens |
| [docs/en/DECISIONS.md](docs/en/DECISIONS.md) | The decision log and the reason for each one, including the revoked ones |
| [docs/en/PITCH.md](docs/en/PITCH.md) | Why the project exists |
| [docs/en/ORIGINS.md](docs/en/ORIGINS.md) | How the idea was born, the pivots, and what each mistake taught |
| [docs/en/ROADMAP.md](docs/en/ROADMAP.md) | What is done, what is missing, risks |
| [docs/en/DEPLOY.md](docs/en/DEPLOY.md) | The instance the author maintains |
| [docs/en/OUT-OF-SCOPE.md](docs/en/OUT-OF-SCOPE.md) | Everything left out, and why |
| [docs/en/LANGUAGES.md](docs/en/LANGUAGES.md) | The two languages of the product and of the documentation |

**The documentation is written in Portuguese and translated into English.** This file's original
is [README.md](README.md); each document in [`docs/en/`](docs/en/) names its Portuguese original, in
[`docs/`](docs/), on its first line. A document that changes in Portuguese changes in English in the
same delivery — the full table is in [docs/en/LANGUAGES.md](docs/en/LANGUAGES.md).

The product page and this documentation in website form live in another repository,
`rotamer-site`, which pulls the `docs/` folder from here at build time — the site never describes
a version that is not the code's.

---

<details>
<summary><strong>Português</strong></summary>

O **Rotamer** é um editor de moléculas na web para o ensino de química orgânica. Desenha-se a
estrutura em 2D e a geometria 3D aparece no mesmo instante — dobrando-se até encontrar a forma e
depois vibrando sob dinâmica molecular —, com fórmula, massa, grupos funcionais, descritores,
modos normais e o veredito da missão ao lado. Toda a química é calculada de forma determinística
(RDKit e MMFF94); o tutor por LLM, opcional, só explica números que já foram calculados, e aparece
sempre marcado como hipótese. A interface e a documentação existem em português do Brasil e em
inglês — o README completo em português está em [README.md](README.md). Código aberto, licença
MIT; suba a sua instância com Docker ([docs/INSTALACAO.md](docs/INSTALACAO.md)).

</details>
