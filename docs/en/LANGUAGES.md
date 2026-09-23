<!-- source: docs/IDIOMAS.md · sha256:25531ff0248a4b484e6d92f78623e441c877f0e6c820f6442178fe992a535360 -->
<p align="right"><a href="../IDIOMAS.md">Português</a> · <strong>English</strong></p>

# Languages

Rotamer speaks **Brazilian Portuguese and English**. Portuguese is the language the product was
written in, and it remains the default — the classroom that motivated Rotamer is Brazilian.
English exists so that the same instance can serve people who do not read Portuguese, and so that
any school can run its own without translating anything by hand.

The delivery rule is short: **a new feature ships in both languages, or it does not ship.** It is
not a review checklist item — the compiler enforces it, and the section “How the rule is enforced”
explains how.

## Where the text lives

Next to whoever uses it, in a `messages.ts` file beside the component, the route, or the server
action. There is no central translation file: a screen and its words change together, and
whoever touches one runs into the other.

```
apps/web/app/messages.ts                   site title and description
apps/web/app/components/messages.ts        the workbench pieces
apps/web/app/turmas/messages.ts            classes, assignments, and school roles
packages/editor2d/src/messages.ts          toolbar, periodic table, shortcuts
packages/quests/src/messages.ts            the mission catalog
packages/i18n/src/messages/chemistry.ts    the exception explained below
```

The exception is chemistry. `packages/core` **depends on no one** — not even `@rotamer/i18n` —
because it has to run in command-line tests. So the core decides and returns a **code**
(`valence_exceeded`) with the numbers that justify the refusal, and what turns the code into a
sentence is `chemistryErrorText`, in `@rotamer/i18n`. The same holds for functional-group names:
`functionalGroupName('en', 'carboxylicAcid')`.

## How a dictionary is written

```ts
import { dictionary } from '@rotamer/i18n';

export const saveMoleculeMessages = dictionary({
  'pt-BR': {
    save: 'Guardar na estante',
    saved: (name: string) => `${name} está na estante.`,
    attempts: (n: number) => `${String(n)} ${plural(n, 'tentativa', 'tentativas')}`,
  },

  en: {
    save: 'Save to the shelf',
    saved: (name: string) => `${name} is on the shelf.`,
    attempts: (n: number) => `${String(n)} ${plural(n, 'attempt', 'attempts')}`,
  },
});
```

Three things are worth noting:

- **Keys in English, text in the language.** It is the same convention as the rest of the code:
  names of things in English, screen text in each language.
- **Text with a number or a name inside is a function, not a template with `{key}`.** A template
  with placeholders forces you to invent grammar — plural, gender, word order — and what gets
  invented never covers both languages. One function per language does, because each one is
  written by someone who knows that language.
- **A number is an argument, never ready-made text.** `plural()` and `formatNumber()` exist for
  that. 46,07 and 46.07 are the same number written in two languages.

## How a dictionary is read

| Where | How |
|---|---|
| Client component | `const m = useMessages(saveMoleculeMessages);` |
| Server component, `page.tsx` | `const m = await serverMessages(saveMoleculeMessages);` |
| Server action | `const m = pick(saveMoleculeMessages, await currentLocale());` |
| Outside React, with the language in hand | `pick(dictionary, locale)` |

Numbers and dates on the client come from `useFormatters()`; on the server, from `formatNumber`
and `formatDate`, which take the language. No hand-written `Intl` with `'pt-BR'` is left in the
code — that is how the date stops showing up as 21/09/2026 to someone who reads English.

## How the choice reaches the screen

The `rotamer-locale` cookie, read on the server. Without a cookie, the browser's
`Accept-Language` applies; without anything, pt-BR. It is a cookie, and not `localStorage` like
the theme, because the server needs the language: half the text is rendered there, and mission
scores are re-evaluated there. With the language only in the browser, the page would arrive in
Portuguese and switch after hydration.

**Where to switch it.** A button with a globe sits in the editor's top bar and in the header of
every page, and shows the name of the **other** language — `English` on a Portuguese screen,
`Português` on an English one (`LanguageSwitch`). The selector with both options side by side
(`LanguageToggle`) sits in the footer of the analysis panel, next to the theme selector, and on
the `/marca` page. Both save the choice through a server action followed by `router.refresh()` —
the server renders again, in the new language.

The first bilingual version only had the selector in the panel footer, which starts closed — and
whoever tested it could not find where to switch the language. That is why the button sits where
people are already looking.

**Routes do not change language.** `/turmas` stays `/turmas` for English readers. An address is
identity: a link the teacher sent to the class last year has to open, and a parallel `/classes`
would double the route surface to gain nothing the HTML `lang` does not already say.

## What is not translated

- **Content from the people who use the product.** Class names, missions written by teachers,
  molecule nicknames, assignment names. Translating what a person wrote is rewriting them.
- **Chemical notation.** Formula, SMILES, InChIKey, element symbol, `R`/`S`, `E`/`Z`, units
  (`g/mol`, `Å²`). They are the same in every language, and touching them would be a chemistry
  error, not a translation error.
- **Language names.** “Português” and “English” always appear in their own language: whoever
  looks for the selector is precisely whoever does not understand the screen.
- **The product's name.** Rotamer is Rotamer.

## The glossary

One word per thing, in both languages — on screen, in error messages, and in the documentation.
The English is American: it is what the translated documentation uses, and switching spelling
halfway through the product would be the same as switching words.

| pt-BR | English |
|---|---|
| turma | class |
| lista | assignment |
| missão | mission |
| tentativa | attempt |
| estante | shelf |
| catálogo | catalog |
| apelido · batizar | nickname · give a nickname |
| professor · aluno | teacher · student |
| código de senha | password reset code |
| cumpriu · travou · não abriu | completed · stuck · not opened |
| Estrutura · Geometria · Propriedade | Structure · Geometry · Property |

The detail for the class screens — `assignment`, `item`, `publish to the catalog`, `draft`, and
what is never said in place of each — is in the table in §2 of `CLASS-ASSIGNMENTS.md`. Element names follow
IUPAC (`Aluminium`, `Caesium`, `Sulfur`); the periodic table search also accepts `aluminum` and
`cesium`, because that is how someone who reads American English will type them.

## The documentation

The documents also exist in both languages. The original is the Portuguese one; the English twin
has an **English name**, because the file name is the first thing a reader sees — and `ROTEIROS.md`
tells someone who only reads English nothing:

| Original | In English |
|---|---|
| `README.md` | `README.en.md` |
| `CONTRIBUTING.md` | `CONTRIBUTING.en.md` |
| `CODE_OF_CONDUCT.md` | `CODE_OF_CONDUCT.en.md` |
| `SECURITY.md` | `SECURITY.en.md` |
| `docs/GUIA.md` | `docs/en/USER-GUIDE.md` |
| `docs/INSTALACAO.md` | `docs/en/INSTALLATION.md` |
| `docs/ARQUITETURA.md` | `docs/en/ARCHITECTURE.md` |
| `docs/DESIGN-SYSTEM.md` | `docs/en/DESIGN-SYSTEM.md` |
| `docs/ROTEIROS.md` | `docs/en/CLASS-ASSIGNMENTS.md` |
| `docs/DECISOES.md` | `docs/en/DECISIONS.md` |
| `docs/PITCH.md` | `docs/en/PITCH.md` |
| `docs/ORIGEM.md` | `docs/en/ORIGINS.md` |
| `docs/ROADMAP.md` | `docs/en/ROADMAP.md` |
| `docs/DEPLOY.md` | `docs/en/DEPLOY.md` |
| `docs/FORA-DE-ESCOPO.md` | `docs/en/OUT-OF-SCOPE.md` |
| `docs/IDIOMAS.md` | `docs/en/LANGUAGES.md` |
| `docs/TERCEIROS.md` | `docs/en/THIRD-PARTY.md` |
| `docs/pesquisa/README.md` | `docs/en/research/README.md` |
| `docs/pesquisa/nomenclatura.md` | `docs/en/research/nomenclature.md` |

The first line of each English document records **which original it translates, and which
version** — the path and the SHA-256 hash of the text:

```
<!-- source: docs/GUIA.md · sha256:41dbeef3… -->
```

That line, and not the file name, is what links the two. When the original changes, the hash stops
matching, and `packages/i18n/test/docs.test.ts` fails, saying which English document fell behind
and what the new hash is. Whoever changed the Portuguese updates the English and replaces the hash
in the same delivery. The same test checks that every original has exactly one twin, and that both
have the same headings, in the same order and at the same levels — which catches a new section that
went in on one side only. A new Portuguese document is born with its twin: an English name and the
source line.

What has **no** twin: `CLAUDE.md`, `AGENTS.md`, and `.claude/` are instructions for a coding
assistant, not documents for readers — and they stay in Portuguese only.

## How the rule is enforced

1. **`dictionary()` does not compile without the pair.** The English type is inferred from the
   Portuguese, with no inference of its own: a new key without a translation fails
   `pnpm typecheck`. That is why dictionaries are declared with this function and not as two
   loose objects.
2. **`dictionaryDivergences()` catches what the type does not see** — a hint list with three items
   on one side and two on the other, a function on one side and a sentence on the other, empty
   text. Each package with a dictionary has a one-line test calling it.
3. **The core cannot go back to speaking Portuguese.** `packages/core/test/errors.test.ts`
   requires the refusal to carry only a code and numbers.
4. **`packages/i18n/test/chemistry.test.ts` reads the core's types file** and fails if an error
   code appears without a sentence in both languages.
5. **`apps/web/app/messages.test.ts` finds every `messages.ts` in the app on its own** and fails
   if a new dictionary appears that nobody included in the check.
6. **`packages/i18n/test/docs.test.ts` checks each document against its English twin** — the
   original's hash and the heading structure.

## Adding a language

1. `LOCALES` in `packages/i18n/src/locale.ts`, and its name in `LOCALE_NAMES`.
2. `negotiateLocale` learns to recognize it.
3. `Dictionary` and `dictionary()`, in `packages/i18n/src/dictionary.ts`, gain the new language's
   key, with the same `NoInfer` as English — until then, `pick` does not even compile.
4. `pnpm typecheck` lists, one by one, every dictionary that is missing — that is the task list,
   and it is complete by construction.

Before that, the question is worth asking: an extra language is extra maintenance forever.
English came in because it opens the product beyond Brazil without asking anything of current
users. A third needs a reason of that size.
