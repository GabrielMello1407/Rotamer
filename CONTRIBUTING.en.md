<!-- source: CONTRIBUTING.md · sha256:fdac4214a4f71d72f35c07487450cab648992b3873e74db931921581ac2289b7 -->
<p align="right"><a href="CONTRIBUTING.md">Português</a> · <strong>English</strong></p>

# Contributing to Rotamer

Thank you for making it this far. This file is the path for anyone working on the code: how to
start the environment, what must remain true, and how a change becomes a commit.

## First: the nonnegotiable rules

They are in [CLAUDE.md](CLAUDE.md) (written in Portuguese), and apply to everyone, with or without
a coding assistant. The most important ones:

- **The deterministic core decides. AI explains.** Validity, valence, formula, mass, SMILES,
  InChIKey, descriptors, aromaticity, stereochemistry, normal-mode frequency, and mission scores
  **always** come from RDKit, the force field, or the mission engine. Never from a language
  model, and never from a homegrown calculation “for a quick fix.” A chemist who finds a subtle
  error stops trusting the entire product.
- **Code in English, text in both languages.** File, variable, function, type, and data-key
  names are in English; comments and test names are in pt-BR. Interface strings and error
  messages are in **pt-BR and English**, side by side. Errors explain the chemistry, not the
  code: “The C atom has 5 bonds, but it supports at most 4.”
- **A new feature ships translated, or it does not ship.** This is not a checklist item: text is
  declared with `dictionary({ 'pt-BR': …, en: … })`, and **a key without its pair does not
  compile**. The whole contract is in [docs/en/LANGUAGES.md](docs/en/LANGUAGES.md)—read it before writing
  the first sentence that appears on screen.
- **CPK colors belong to atoms.** No button, border, or semantic state uses a CPK color. Every
  color, spacing, radius, and duration comes from `packages/ui/src/tokens.css`. Light and dark
  themes always ship together.
- **An MIT-compatible license.** MIT, BSD, Apache-2.0, and ISC are accepted; GPL, LGPL, and AGPL
  are not. Every new dependency goes into `docs/TERCEIROS.md`, and into its English twin
  `docs/en/THIRD-PARTY.md`, in the same commit.
- **Out-of-scope ideas go in `docs/FORA-DE-ESCOPO.md`** (in English, `docs/en/OUT-OF-SCOPE.md`),
  not in the code. Scope creep is the
  project's number-one risk.

## The path, from outside in

No one besides the maintainer has write access to this repository, and that is how it works in
most open projects: you work on your own copy and ask for it to be merged.

1. **Fork the repository**—the button is at the top of the repository page.
2. **Clone your fork** and point to the original as `upstream`, so you can update later:

   ```
   git clone https://github.com/YOUR-USERNAME/Rotamer.git
   cd Rotamer
   git remote add upstream https://github.com/GabrielMello1407/Rotamer.git
   ```

3. **Create a branch** from `main`. Never work on your fork's `main`—it is your mirror of the
   original:

   ```
   git switch -c fix-caffeine-tpsa
   ```

4. **Work, test, and commit**—what that requires is in the section “How a change becomes a
   commit.”
5. **Push to your fork** and open the pull request against `main` here:

   ```
   git push -u origin fix-caffeine-tpsa
   ```

   GitHub offers the pull request link in the output of the `push`.

**CI runs on your pull request**, even when it comes from outside: lint, types, unit tests,
browser tests, and the Docker image. The result appears on the PR page itself, and it does not
need approval to start. A `pnpm lint && pnpm typecheck && pnpm test` before pushing saves a round
trip.

To update your branch when `main` moves on:

```
git fetch upstream
git rebase upstream/main
```

**Opening an issue first is welcome, and never required.** For a small fix, send the PR straight
away. For a change that crosses more than one package, or that changes behavior someone already
relies on, an issue first saves you from writing code that will be turned down on scope—which is
the number-one risk here.

## What you can contribute without starting the whole environment

The full environment needs Node, pnpm, Docker, and Postgres. Three valuable contributions need
none of that:

- **Chemistry errors.** This is the most important report in this project, and it is an issue,
  not code—there is a dedicated form that asks for the SMILES, what the screen showed, what you
  expected, and the source. A teacher who finds a wrong number helps more than many lines of
  code.
- **Documentation.** Everything in `docs/`, plus this file and the `README.md`. A document that
  disagrees with the code is wrong—if you find one, fixing it is a complete contribution. Each
  document has an English twin, and a fix goes into both.
- **Core tests.** `packages/core/` depends on neither a browser nor a database:
  `pnpm --filter @rotamer/core test` runs on its own. A new case in `packages/core/test/`, with
  the value RDKit calculates, is the cheapest code contribution to make and the hardest to
  break.

**Where to start**, if you want to work on the code and do not know where: the issues labeled
[`good first issue`](https://github.com/GabrielMello1407/Rotamer/labels/good%20first%20issue),
and the list of known debt in [docs/en/OUT-OF-SCOPE.md](docs/en/OUT-OF-SCOPE.md)—the sections
“Debt from the assignment-list delivery” and “Items left from the review” are real work, already
described, still unclaimed.

## Community and security

This product is used by people aged 14 to 18 in the classroom, and that changes what goes into an
issue: no sexual, violent, or harassing content, and **no real student data**—name, e-mail,
class, or a screenshot with identifiable people. The rest is in
[CODE_OF_CONDUCT.en.md](CODE_OF_CONDUCT.en.md).

**Found a security flaw?** Do not open an issue. The way is GitHub's private reporting, and what
counts as a flaw here is in [SECURITY.en.md](SECURITY.en.md).

## Starting the environment

Use **Node 24**, **pnpm 11.24.0**, and **Docker** for Postgres. This is the Node version used
in Docker and CI; the database dependencies require versions newer than the minimum declared at
the monorepo root.

```
corepack enable                        # or: npm install --global pnpm@11.24.0
pnpm install
docker compose up -d postgres          # only the database; the app runs outside the container
cp apps/web/.env.example apps/web/.env # DATABASE_URL already points to this Postgres
```

If you already configured `POSTGRES_PASSWORD` in the root `.env`, set the password in
`apps/web/.env`'s `DATABASE_URL` to the same value.

With the connection configured, apply the migrations and start the app:

```
pnpm --filter @rotamer/web db:migrate  # applies the migrations
pnpm dev
```

`http://localhost:3000`. `predev` copies RDKit and the MMFF94 tables from `node_modules` to
`apps/web/public/chem/` and generates the Prisma client—do not commit this directory or edit it
by hand.

Without `DATABASE_URL`, the product starts without accounts, classes, or assignments, and the
editor works in full. Without `GEMINI_API_KEY`, the tutor switches itself off and says so on
screen.

To become a teacher on your development instance, after creating an account at `/entrar`:

```
cd apps/web && node scripts/promote-teacher.mjs you@example.com --escola "Test school"
```

With `--administrador` at the end, the account also gets the `Teachers at this school` section
at `/turmas`, which is how a school promotes its own teachers (D-29). An administrator can only be
created by this script, and through the screen can promote no higher than teacher.

## Where things live

```
apps/web            Next.js 16 · routes, server actions, accounts, classes, assignments, tutor
packages/core       graph · RDKit · geometry, dynamics, and normal modes — runs without a browser
packages/i18n       pt-BR and English: typed dictionary, formatting, the chemistry sentences
packages/editor2d   the 2D canvas: tools, selection, menu, shortcuts, history
packages/viewer3d   Three.js · rendering only
packages/quests     declarative missions, goal extraction, scoring
packages/ui         tokens and components
docs/               architecture, decisions, design system, assignments, installation, guide
docs/en/            the same documents, in English
```

**Dependency rule:** `core` depends on no one, and no package depends on `editor2d`.
The full map is in [docs/en/ARCHITECTURE.md](docs/en/ARCHITECTURE.md); the reasoning behind each choice
is in [docs/en/DECISIONS.md](docs/en/DECISIONS.md).

**`R-1`, `§4.5`, and similar references.** The classroom code cites rules by number—`R-3` in a
`select`, `§6.3` in a component. They all live in [docs/en/CLASS-ASSIGNMENTS.md](docs/en/CLASS-ASSIGNMENTS.md): §5.1 has
the server-rule table, §6 the screen copy, and §7 the test protecting each rule. Read it first if
you work on assignments, teacher missions, or the catalog.

## How a change becomes a commit

1. **Every change ends with a test that would fail without it.** New chemistry needs a case in
   `packages/core/test/`, running without a browser, with the value RDKit calculates—never a
   value from a third-party table. Where RDKit differs from PubChem, RDKit wins, and the screen
   identifies whose definition is used.
2. **Run what CI runs**, before opening the pull request:

   ```
   pnpm lint
   pnpm typecheck
   pnpm test          # with Postgres running, action tests run; without it, they skip with a warning
   pnpm test:e2e      # Playwright, desktop and mobile, against the production build
   ```

   `test:e2e` builds and starts the app on port 3100. Account, class, and assignment tests need
   Postgres; name-search tests skip when PubChem does not respond; tutor tests cover the
   behavior your `.env` allows—with a key, the answer; without a key, the switched-off state.
3. **Schema changes need additive migrations.** `pnpm --filter @rotamer/web db:migrate` creates
   the migration in `apps/web/prisma/migrations/`. Columns are never dropped or rewritten:
   self-hosters update with `docker compose up -d`, and the migration runs before the app opens
   its port.
4. **Screen copy is content, and it comes in two sentences.** Every sentence the student reads
   gets the same care as code: no programming jargon, and no claims about things the product
   does not do—the “Never claim” section of `CLAUDE.md`. And it arrives in pt-BR **and** in
   English, in the `messages.ts` next to the screen. `pnpm typecheck` refuses a key with only one
   side; what it does not catch is a poor translation, and that is human review.
5. **Documents describe what exists—in both languages.** If a change contradicts a document in
   `docs/`, the document changes in the same commit, and so does its English twin (`docs/en/`,
   or the `.en.md` next to a root document). `pnpm test` fails until the hash at the top of the
   twin matches the original. New or revised decisions go into `docs/DECISOES.md` (and its twin, `docs/en/DECISIONS.md`), without
   deleting the previous one. Comments explain **why**, not what the line does; test names say
   what they protect.
6. **Commit messages in Portuguese**, in the format `tipo: o que mudou` (type: what changed)—
   `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Found a chemistry error?

It is the kind of issue that matters most, and it has its own form: **Erro de química**
(Chemistry error), when you open the issue. It asks for the SMILES (or the molblock), what the
screen showed, what you expected, and the source.

The source is not red tape. Many discrepancies between RDKit and another tool come from
**definitions**—TPSA with perceived aromaticity, rotatable bonds under the strict definition—and
in those cases the right answer is for the screen to say whose definition it uses, never to
adjust the calculation to match the other table. Without the source, the two cases cannot be
told apart, and telling them apart is what decides what gets fixed.

## The agent team

Nine roles live in `.claude/agents/` for people working with a coding assistant—`pm`,
`ui-ux`, `frontend`, `backend`, `security`, `deploy`, `researcher`, `marketing`, and `reviewer`.
They are optional: they describe how the project approaches each kind of task, and they are
useful reading even for people who do not use any agent. They are written in Portuguese.

## License

By contributing, you agree that your contribution is published under the repository's MIT
license ([LICENSE](LICENSE)).
