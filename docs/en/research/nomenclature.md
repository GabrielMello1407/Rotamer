<!-- source: docs/pesquisa/nomenclatura.md · sha256:0ffd475a8e8c617a64d6066eab4b46430023b91c967c0252d941bf403f7c3fe4 -->
<p align="right"><a href="../../pesquisa/nomenclatura.md">Português</a> · <strong>English</strong></p>

# Nomenclature — will Rotamer name molecules?

**August 27, 2026.** A `researcher` survey covering four research tracks and seven attempts at
refutation. This is not a decision: scope belongs to the `pm`. This records what was known on
that date, with an address for every source.

> Written when the product was closed-source (D-08). On September 11, 2026, D-28 opened the code
> under MIT and changed the licensing rule — what this survey says about commercial licensing
> and a closed-source product records that date, not today's rule. The current assessment of
> the options is in `docs/en/OUT-OF-SCOPE.md`, under “Nomenclature — the five paths, and what
> unlocks each one.”

---

## The question

The teacher in the Phase 3 observation session will draw a structure and ask “what is this
called?” — and today Rotamer does not answer, because D-15 chose to let users give molecules
nicknames instead of naming them. The question is whether that decision still stands.

## Short answer

Technically D-15 remains correct, but **for the wrong reason**. The premise “RDKit.js cannot
do this” was checked three times and is true. But the implicit premise “there is no open,
permissively licensed engine” became **false on August 27, 2026**: `openclatura` exists (MIT,
deterministic, built on RDKit itself), and I measured it here naming 30 out of 30 high-school
organic chemistry molecules, with a perfect round trip and textbook-style names. The obstacle
is no longer licensing or quality — it is that it **only speaks English**, **runs in Python on
the server** (never in the browser, never offline), and is **beta 0.3.1, from a single lab**.

---

## What has been verified

### 1. What Rotamer has today — measured in the repository

- **The core has nothing close to nomenclature.** `@rotamer/core` exposes 39 runtime symbols,
  and the `/name|nomen|iupac|title/i` filter returns nothing. The `Molecule` object has no name
  field: `smiles, formula, inchi, inchiKey, molblock, descriptors, groups, atomHydrogens, stereo`.
  — temporary probe in `packages/core/test/`, created, run, and removed.
- **The closest thing to naming is `detectFunctionalGroups`**: 21 SMARTS patterns with pt-BR
  names (carboxylic acid, ester, amide, phenol, …). These identify functional classes, not compound
  names — they provide no parent chain, numbering, or branching.
  — `packages/core/src/chemistry/groups.ts`, lines 63-175.
- **Nickname validation rejects five categories**, each with its own pt-BR message: `curto`,
  `longo`, `caracteres`, `parece-formula`, `parece-sistematico` (short, long, characters,
  looks like a formula, looks systematic).
  — `apps/web/lib/molecule-name.ts`, `MESSAGES` lines 43-50, `checkName` lines 52-66.
- **The `parece-sistematico` rule makes mistakes in both directions, and this was measured.**
  It is a bare suffix (`/(ano|eno|ino|ol|al|ona|oico|amina|amida|ato|ila|ilo)$/i`) applied to a
  single word. Running `checkName`: it **rejects** `Camila`, `Sol`, `Cristal`, `Girassol`, `Farol`,
  `Carnaval`, `Ludmila`; it **accepts** `cafeina`, `aspirina`, `anilina`. In other words, it
  blocks a student's first name and lets through the trivial name of a real compound — exactly
  the opposite of its purpose. It also rejects `Ba` and `Na` as `parece-formula`.
  — probe `apps/web/lib/zz-probe.test.ts`, created, run, and removed.
- **Search resolves only one direction.** `findByName` sends the text to PubChem, and the
  returned SMILES passes through RDKit before becoming a molecule. `findCompoundByInchiKey`
  queries by key and, if found, gets the CID's `Title` — which becomes the “already exists out
  there” screen, never a name field.
  — `apps/web/app/actions/search.ts` lines 42-85; `apps/web/lib/pubchem.ts` lines 154-234.
- **The product can already check name→structure without any engine.** The condition
  `{ kind: 'inchiKey', value }` exists in `packages/quests/src/types.ts:42` and is evaluated in
  `conditions.ts:40-41`. And the key does not depend on how the student drew it: four different
  SMILES representations of aspirin (aromatic and Kekulé, different starting atoms) all returned
  `BSYNRYMUTXBXSQ-UHFFFAOYSA-N`. The name here is entered by a human in the mission data — the
  product never generates it, and D-15 remains intact.
- **Three states when PubChem goes down, not two**: a 5 s timeout per request, a 6 s budget per
  question, a circuit breaker that opens after 3 rejections and stays closed for 60 s;
  `knownCompound` returns `nao-sei` (I don't know), and the nickname remains valid, with the
  caveat on screen.
  — `apps/web/lib/pubchem.ts` lines 20-41; `known-compound.ts` lines 22-37.
- **The suite passes today**: `pnpm test` → 21 files across 5 packages, `Tasks: 5 successful, 5 total`.

### 2. The two chemistry libraries already in the stack do not name compounds

- **RDKit.js 2025.03.4 (BSD-3):** I enumerated the runtime, not the `.d.ts`. There are 21 module
  functions and 55 API methods on `JSMol`; the broad filter
  `/name|iupac|nomen|systematic|preferred|synonym|label|title/i` returns `(none)`.
  `get_descriptors()` contains 43 keys, all numeric. `get_prop_list()` on a mol from SMILES
  returns `{}`. Grep for `iupac` in the `.js` and `.wasm` → **0**, with a positive control:
  `inchi` in the same `.wasm` → **62**. The method finds a string that exists, so zero means
  actual absence. `nomencl`, `butane`, and `hexyl` in the `.wasm` → 0, meaning no nomenclature
  lexicon is compiled in. There is no alternative build: `dist/` contains only
  `RDKit_minimal.{js,wasm}`, and `Code/MinimalLib/dist/` is an identical copy by md5.
- **OpenChemLib 9.25.0 (BSD-3):** `iupac` → 0 in the bundle; no
  `toName`/`fromName`/`StructureName` in the `.d.ts`; `resources.json` (1.35 MB) contains only
  MMFF94, torsion, and toxpredictor.

**Consequence:** any nomenclature means a **new dependency**, not a flag to enable.

### 3. Name → structure: it exists, it is MIT, and it does not speak Portuguese

- **OPSIN 2.9.0, MIT.** I read the project's own `LICENSE.txt` at
  https://raw.githubusercontent.com/dan2097/opsin/master/LICENSE.txt — the full MIT text,
  “Copyright 2017 Daniel Lowe.” Release 2.9.0 was published on **March 15, 2026**
  (`api.github.com/repos/dan2097/opsin/releases`); the previous release was from 2023. An active
  repository, pushed to on August 19, 2026, with 232 stars.
- **One direction only.** The CLI's own banner: *“OPSIN converts systematic chemical names to
  CML, SMILES or InChI/StdInChI/StdInChIKey”*. There is no structure→name mode.
- **Fast and correct.** 15 names converted in 0.407 s wall time **including JVM startup**. It
  handles systematic and trivial names correctly (`acetic acid` and `ethanoic acid` produce
  the same SMILES) and returns stereochemistry (`(2R)-butan-2-ol` → `C[C@H](CC)O`). Passing its
  SMILES through this repository's RDKit reproduces the `CLAUDE.md` table: ethanol 46.07/20.23;
  acetic acid 60.05/37.30; aspirin 180.16/63.60; caffeine 194.19/61.82.
- **It does not understand Portuguese.** A set of 42 high-school names: **PT 3/42** (all three
  are spelling coincidences, such as `propan-2-ol`), **EN 42/42**. `etanol`, `benzeno`,
  `acido acetico`, `2-metilbutano`, `acido acetilsalicilico`, `propanona`, and `cafeina` fail.
  Also confirmed on the EMBL-EBI service: `curl https://www.ebi.ac.uk/opsin/ws/etanol.smi` → HTTP 404.
- **Every failure is loud and visible.** Across 62 names tested across the research tracks,
  there were **zero silent mismatches** — OPSIN never quietly returned the wrong molecule;
  it either got it right or rejected it. This matters under D-01: it is an error profile a
  classroom can tolerate.
- **A pt→en layer is manageable, but it is a lexicon and does not go away.** A morphological
  normalizer of ~20 lines (ano/ane, ol/ol, ona/one, oico/oic) brought the tuned set to 41/42 and
  a *held-out* set of 20 names, with no new rules, to 14/20, with **0 silent mismatches** in
  both. The 6 misses are dictionary entries: `hidroxi→hydroxy`, `gli→gly`, `ureia→urea`,
  `estireno→styrene`, and the ester “acetato de …”. Translating a compound name **means deciding
  structure**, so this layer cannot be an LLM (D-01).
- **A licensing caveat inside the jar.** `opsin-cli-2.9.0-jar-with-dependencies.jar`
  (14,335,652 bytes, sha256 `c2e29326c281f87b59a05d934d8589adac6e9d17b95b984931b3e739111b360f`)
  bundles `jna-inchi-core` 1.3.1, whose POM on Maven Central declares **LGPL 2.1 or later**
  (77 `io/github/dan2097/jnainchi/` entries inside the jar). LGPL is not in `CLAUDE.md`'s literal
  ban (GPL/AGPL) — precisely why it needs an explicit decision rather than an omission.
  `opsin-core` alone stays clean (automaton BSD-2, woodstox/commons-io/log4j Apache-2.0), but it
  is the artifact that stopped having a `Main-Class` as of 2.9.0.
- **There is no JS/WASM port.** The npm package `opsin` is an unrelated Vue library;
  `opsin-js`, `opsinjs`, `opsin-wasm`, `js-opsin`, `@opsin/core`, `node-opsin` → all 404.
  GitHub search for `opsin+wasm` → 0; `opsin+javascript` → 1 result, a 2014 Safari extension
  that calls the service. Using OPSIN means running Java or calling EBI.
- **The Spanish fork exists and is unusable here.** `quimifyapp/opsin` (14 stars) **has no
  license file at all** — derived from MIT with no declared grant.

### 4. Structure → name: the finding that changes the picture — `openclatura`

This **was not in the four research tracks**; a skeptic introduced it, and I measured it today.

- **`openclatura` 0.3.1, MIT, deterministic, built on RDKit.** I read `LICENSE` at the source
  (https://raw.githubusercontent.com/lamalab-org/openclatura/main/LICENSE): “MIT License /
  Copyright (c) 2026 lamalab-org.” GitHub API: `spdx_id: MIT`, created on **May 8, 2026**,
  pushed to on August 24, 2026, 80 stars, Python. PyPI: `openclatura 0.3.1`, classifier
  “License :: OSI Approved :: MIT License.” **Only runtime dependency: `rdkit>=2023.09`**
  (BSD-3) — I installed it in a disposable scratchpad venv, and the full tree was
  `numpy, pillow, rdkit, openclatura`. No GPL, no mandatory Java.
- **No model and no table.** README: *“There is no model and no lookup table: the same structure
  always yields the same name”* and *“Both are deterministic — same input, same output, no LLM in
  the loop”*. This is the opposite of STOUT and makes it compatible with “the deterministic
  core decides.”
- **MEASURED HERE — 30 molecules, with textbook-style names.** I ran `oc.name_smiles()` on the
  6 `CLAUDE.md` cases plus 24 high-school organic chemistry molecules. Literal output included:

  | I drew | openclatura returned |
  |---|---|
  | `CCO` | `ethanol` |
  | `CC(=O)O` | `acetic acid` |
  | `c1ccccc1` | `benzene` |
  | `CC(=O)Nc1ccc(O)cc1` | `N-(4-hydroxyphenyl)acetamide` |
  | `CC(=O)Oc1ccccc1C(=O)O` | `2-(acetoxy)benzoic acid` |
  | `Cn1cnc2c1c(=O)n(C)c(=O)n2C` | `1,3,7-trimethyl-3,7-dihydro-1H-purine-2,6-dione` |
  | `CC(=O)OCC` | `ethyl acetate` |
  | `CC(C)=O` | `propan-2-one` |
  | `C/C=C/C` | `(2E)-but-2-ene` |
  | `OCC(O)CO` | `propane-1,2,3-triol` |
  | `CC(O)C(=O)O` | `2-hydroxypropanoic acid` |
  | `C[C@@H](N)C(=O)O` | `(2R)-2-aminopropanoic acid` |
  | `CC(C)CC(C)(C)C` | `2,2,4-trimethylpentane` |

  Compare this with what the research track measured for **NISPO 0.1.7**, the other BSD-3
  candidate: acetic acid → `1-hydroxy-1-oxo-ethane`, ethyl acetate → `2-oxo-3-oxapentane`,
  propanone → `2-oxopropane`, cyclohexane → `cyclohexan`. NISPO is chemically correct but would
  fail an ester lesson; `openclatura` names an ester as an ester and a ketone as a ketone.

- **MEASURED HERE — round trip 30/30, zero silent mismatches.** I took the 30 `openclatura`
  names, passed them through local OPSIN 2.9.0 (`java -jar opsin-cli-2.9.0.jar -o smi`), and
  compared InChIKeys using RDKit. Output: `round-trip openclatura 0.3.1 -> OPSIN 2.9.0 ->
  InChIKey: 30/30 iguais` (30/30 equal) · `OPSIN nao entendeu o nome (falha alta): 0` (OPSIN did
  not understand the name, loud failure: 0) · `DIVERGENCIA SILENCIOSA: 0` (silent mismatch: 0).
- **MEASURED HERE — it verifies itself.** `NamingResult` has `opsin_check` and `self_audit`
  fields, and `verify_with_opsin(nome, smiles)` returns an `OpsinCheck` with a `status`. I
  installed the `py2opsin` extra, `oc.opsin_available()` → `True`, and ran it: ethyl acetate,
  caffeine, aspirin, and alanine → **`status=matched` for all four**. This is the mechanism
  that would allow showing **only** names confirmed by the round trip and staying silent for
  the rest — the design D-01 would require.
- **MEASURED HERE — the name comes out in pieces, not as a string.** `analyze_smiles()` returns
  a `NameAnalysis` with `trace_segments`, `decisions`, `substituent_tree`, and `operations`.
  Each segment contains `atoms`, `bonds`, `name_terms`, and a `rule_hint` pointing to a Blue
  Book rule (`P-44`, `P-45`). For `CC(=O)OCC`: `{'key':'parent', 'atoms':[0,1],
  'name_terms':['acetate', 'acetat'], 'rule_hint':'Parent hydride / parent structure: Blue Book
  P-44 and P-45.'}`. Two effects: **(i)** atom indices match the graph, so the drawing could
  highlight the part corresponding to each piece of the name — the same idea as “the
  highlighted atom is the same in both views”; **(ii)** localizing to pt-BR would mean mapping
  terms rather than translating a sentence — which reduces the problem but does not eliminate
  it, because the order changes (`ethyl acetate` → “acetato de etila”).
- **Two of the 30 names used a less common form than the textbook**: `1-ethoxyethane` (the
  locant seems superfluous beside “ethoxyethane”) and `2-(acetoxy)benzoic acid` (the form cited
  in ENEM/PubChem is “2-acetyloxybenzoic acid”). I checked that OPSIN accepts all four spellings
  and they all yield the **same molecule** — `ethoxyethane` and `1-ethoxyethane` → `C(C)OCC`;
  `2-(acetyloxy)benzoic acid` and `2-(acetoxy)benzoic acid` → the same aspirin SMILES. So the
  deviation is **style**, not chemistry. Whether that style would fail an exam is a question
  for a chemistry teacher, not for me — it remains open below.

### 5. Structure → name: the other candidates, and why they fail

- **NISPO 0.1.7, BSD-3** (Oxford Protein Informatics Group), Python on RDKit, published on PyPI
  on August 23, 2026. License verified from two sources. Round trip 26/26 in the research track
  that measured it — and its README warns: *“It is optimized for OPSIN round-trip validity
  rather than preferred IUPAC nomenclature”*. At least 8 of the 26 names would fail a lesson.
- **STOUT (MIT) is a neural network and fails the unbreakable rule.** MIT `LICENSE` verified;
  PyPI `STOUT-pypi 2.0.5`. But the authors' own paper (J. Cheminform. 2024, 16:146) measures
  **89.86%** exact-match accuracy in the best experiment and **83.52%** in large-scale training.
  This is literally the profile `CLAUDE.md` describes when banning the LLM. And it is unusable
  today: canonical repository 404, Zenodo weights **410 GONE** (control: another Zenodo record
  responds 200), `pip install STOUT-pypi` fails with `ResolutionImpossible`, and
  `stout.decimer.ai` does not resolve.
- **`nobyt/smiles2iupac`** is deterministic and active (pushed to on August 10, 2026), but
  **`license: null`** — all rights reserved, legally unusable.
- **`JasonYCHuang/chem-dl-iupac` is AGPL-3.0 and `sneedkap/iupac-to-structure` is GPL-3.0** —
  banned by `CLAUDE.md`.
- **No structure→name engine in JS or WASM with a permissive license.** An npm search for
  `iupac`, `smiles name`, and `opsin`: nothing. `indigo-ketcher` 1.46.0 (Apache-2.0, WASM, the
  most obvious candidate): I downloaded the 10,146,858-byte bundle, and
  `grep -c -i -a "iupac"` → **0**. `ketcher-core` 3.17.2 (Apache-2.0): also no.
  **Architectural consequence: any nomenclature in Rotamer is a network call, not worker code.**

### 6. The market — nomenclature is a paid, server-side feature

- **ChemDoodle Web Components is GPLv3, and more restrictive than claimed.** I downloaded the
  official distribution (`ChemDoodleWeb-11.0.0.zip`, 4,641,214 bytes) and read `COPYING.txt`:
  it is the FSF's GPLv3 text, 35,147 characters, **without a single modified line**. The source
  header says *“either version 3 of the License, or (at your option) any later version”* →
  **GPL-3.0-or-later**.
- **Its nomenclature does not run in the browser — this was executed, not read.** In the
  distributed source, `generateIUPACName` and `readIUPACName` are one-line wrappers around
  `_contactServer`, which calls `fetch(SERVER_URL, {method:'POST', credentials:'include'})`.
  I loaded the library in Node with instrumented `fetch`, built ethanol, and requested its name:
  **1 network request, zero local nomenclature**, and an errback when the network was blocked.
  The default `SERVER_URL` is
  `https://ichemlabs.cloud.chemdoodle.com/icl_cdc_v090000/WebHQ`; the `/cdcloud.php` on
  `iupacnaming.com` is that site's override. A direct POST returned
  `{"content":{"iupac":"Ethanol","attemptedPIN":"ethanol"}}`.
- **ChemDoodle's nomenclature is “powered by OPSIN”** — its own demo page says so, and OPSIN is
  MIT. In other words, their GPL does **not** close off the name→structure direction.
- **ChemDoodle pricing: US$29 is a monthly subscription per user, not a purchase.** The store
  lists `Monthly $29`, `Yearly $199`, `Lifetime $999` for the “iChemLabs Suite User License,”
  with four products, and says *“We do not license them separately”*. The academic discount
  **does not apply** to those prices: *“we offer a significant academic discount on our Site
  licenses… As for our user subscriptions or Lifetime user licenses, we are sorry”*. A site
  license requires a quote, with no public price.
- **Ketcher (EPAM, Apache-2.0) does no nomenclature at all** — it neither generates nor reads
  names. `api.github.com/repos/epam/ketcher` → Apache-2.0, pushed to on August 27, 2026.
- **MolView does not name compounds**: it searches PubChem, RCSB PDB, COD, and NIST WebBook —
  what Rotamer already does. And it is a GPL stack: `curl https://molview.org/` returns
  12 occurrences of ChemDoodle, 15 of Jmol, and 12 of GLmol; the repository is `NOASSERTION` on
  GitHub. It cannot even serve as a code reference.
- **Market consolidation.** Read on the manufacturer's own website
  (https://www.acdlabs.com/resources/free-chemistry-software-apps/chemsketch-freeware/):
  *“ChemSketch Freeware Discontinued. In January 2026, ACD/Labs was acquired by RS who develop
  ChemDraw”*. Two of the five suppliers cited as independent are now the same company, and the
  **free** option that existed for schools has disappeared.

### 7. What Brazilian education requires — and in which direction

- **The high-school BNCC does not require nomenclature.** I downloaded the official MEC PDF
  (http://basenacionalcomum.mec.gov.br/images/historico/BNCC_EnsinoMedio_embaixa_site_110518.pdf)
  and ran `pdftotext -layout` + `grep -c -i`: **IUPAC 0**, **carbono 0**, **hidrocarboneto 0**,
  **isomeria 0**, **átomo 0**; “nomenclatura” appears once, referring to educational
  terminology. The only mention of organic chemistry is “structure and properties of organic
  compounds,” in a list of knowledge that “may be mobilized” in Specific Competency 3
  (pp. 543-544) — suggested context, not a skill requirement. There are exactly 23 skills
  (EM13CNT101-106, 201-207, 301-310), and none mentions nomenclature, structural formulas, or
  organic functional groups.
- **The BNCC does not assign a school year.** The “13” in the code means “any year of high
  school, as defined by the curricula” (p. 33).
- **The state requires it, in the 3rd year, in both directions.** SEDUC-SP's “Habilidades
  Essenciais de Química – EM” (Essential Chemistry Skills — High School) document states, in
  **3rd year / 3rd two-month term**: *“Write structural formulas of hydrocarbons from their
  nomenclature and vice versa.”* Only São Paulo's document was read, in full.
- **ENEM hardly asks for it, and when it does, it is name → structure.** Official second-day
  exams, yellow booklet 5, from 2020 to 2025, downloaded from INEP: **0 occurrences of “IUPAC”
  across all six years**; “nomenclatura” once (2023). **Not one question across those six years
  asks for the name of a drawn structure.** Question 96 in 2023 lists five compounds by name
  only (n-decane, n-heptane, 2,2,4-trimethylpentane, …), without any drawn structures.
- **Unicamp asks students to draw, and students get it wrong.** Annotated exams from 2005 to
  2010: “structural formula” appears 18 times, and no question asks for a structure's IUPAC
  name. In 2005, question 9 gives “3-penten-2-ol” and asks for a drawing. The examiners themselves
  wrote that “this question was not expected to present much difficulty” — and **41.59% scored
  zero**.
- **Giving the answer before an attempt negates the feedback.** Shute, V. J. (2008), *Focus on
  Formative Feedback*, Review of Educational Research 78(1), 153-189, Table 2 (pp. 177-178):
  *“Provide feedback after learners have attempted a solution. Do not let learners see answers
  before trying to solve a problem on their own (i.e., presearch availability)”*; and in the
  body: *“feedback can inhibit learning if it encourages mindlessness, as when the answers are
  made available before learners begin their memory search”*. A peer-reviewed journal, with
  no product involved.
- **And for difficult tasks, feedback should be immediate** — *“a helpful safety net for the
  learner so she does not get bogged down and frustrated”* (Table 4, p. 179); for lower-achieving
  students, **elaborated** feedback works better than simple verification.
- **Brazilian literature has already diagnosed the problem.** Matos et al. (2009),
  *Nomenclatura de Compostos Orgânicos no Ensino Médio* (Organic Compound Nomenclature in High
  School), Química Nova na Escola 31(1), pp. 40-46: *“high-school students are led to memorize
  names, rules, and classifications, but because they do not use them often, they end up
  forgetting”*, and the content's basic purpose would be “to enable the connection between a
  substance's name and its functional class” — the value lies in the name↔function connection,
  not in the name itself.

### 8. PubChem was down all day

Five independent sets of attempts, between ~09:44 and ~14:00 (local time) on **August 27, 2026**,
all returning `PUGREST.ServerBusy`. My final attempt:
`curl -G ".../rest/pug/compound/smiles/property/IUPACName,Title/JSON" --data-urlencode
"smiles=CCO"` → `{"Fault":{"Code":"PUGREST.ServerBusy"}}` **[HTTP 503]**, and the same for
aspirin. Earlier, the regular HTML page (`/compound/2244`) also returned 503, and the headers
included `Retry-After: 30` and `X-Throttling-Control: … too many requests per second or
blacklisted`. GitHub's API responded 200 at the same moment, so this was not a network failure
on our end.

**This matters twice over:** the product **already depends** on PubChem today (D-15's existence
check), and PUG REST's `IUPACName` was a candidate naming source. I could measure neither its
format nor its coverage. D-15's third state (“could not verify”) is not a remote possibility —
it was the state of the world all day today.

### 9. Debris found in the repository

`git status` at the root shows two **untracked** files: `cd.html` (96,535 bytes) and `st.html`
(31,541 bytes), timestamped August 27, 2026, 09:55. The sizes exactly match the ChemDoodle and
iChemLabs store pages downloaded during this research. They are collection debris that
accidentally landed in the product root. I did not delete them — whoever cleans the tree
before committing decides.

---

## What the sources claim, and nobody checked

- **ChemDraw supports both directions, but only in the expensive edition.** “Name-to-Structure
  and Structure-to-Name functions” is listed as a ChemDraw **Professional** feature; Prime
  does not include it. — the manufacturer's page
  (https://perkinelmerinformatics.com/products/research/chemdraw/, **an interested source**) and
  Stanford's IT page (https://software.stanford.edu/index.php/node/1873, independent of the
  manufacturer), read on August 27, 2026. The official edition-comparison PDF returns HTTP 403
  for automated reading.
- **At Chemaxon (now under Certara), nomenclature is a separately licensed product, in both
  directions.** *“Name import is only available for a single molecule with the free
  MarvinSketch desktop application. For batch conversion … you need the 'Name to Structure'
  license.”* And in Marvin JS: *“a separate license for Name to Structure and/or Structure to
  Name is required”*. — manufacturer documentation (docs.chemaxon.com), **an interested source**.
- **Marvin JS sends almost everything to the server.** Listed Web Services include CIP Stereo
  Info, Elemental Analysis, Mol Export, Clean, Formats, Hydrogenizer, and similar services —
  nomenclature does not even appear in the default list. — manufacturer, **an interested source**.
- **Certara/ChemAxon Naming Toolkit is delivered through Java, Python, .NET, and a
  microservice**; **ACD/Name** is desktop/server; **Lexichem TK** (OpenEye/Cadence) is a
  server-side C++/Python toolkit; **ChemDraw JS** is the only one that runs in the browser and
  supports both directions, delivered as a private npm `.tgz` plus an XML license. — all from
  the products' own sales pages, **interested sources**. None publishes pricing. An aggregator
  (SourceForge) mentions US$475.00/year for ACD/Name, but it is a third party and describes a
  user license, not an embeddable SDK: **do not trust that number**.
- **ChemDoodle's commercial license technically supports closed-source products**: *“Contact
  us for a proprietary license instead, which can be integrated and distributed with
  proprietary products.”* — manufacturer, **an interested source**, with no public price.
- **PubChem's `IUPACName` comes from OpenEye's LexiChem** — found in PubChem SDF field
  descriptions reproduced in third-party datasets and cited in the STOUT paper's bibliography.
  I did not read primary PubChem documentation stating this. High confidence, primary source
  unread.
- **`openclatura` coverage: QM9 100%, PubChem 99.3%, ZINC22 97.4%.** — the authors' own README,
  **an interested source**, and this is *round-trip coverage*, not “a name a teacher accepts.”
  I measured 30 molecules; they measure millions. The two numbers answer different questions.
- **KingDraw is free and supports both directions**, in mobile and desktop apps, not the web.
  — manufacturer (kingdraw.com) and a Vanderbilt library guide. I do not know whether naming
  happens on the device or whether it sends the structure to KingAgroot's server, and I did
  not read the terms of use.
- **CheerpJ runs unmodified jars in WASM**, but the Community Edition is only for personal
  and FOSS projects; commercial use costs £100 per developer/month on the Small Business plan.
  — Leaning Technologies, **an interested source**. I did not test it with the OPSIN jar.
- **EMBL-EBI has hosted OPSIN since May 21, 2025.** The service responds HTTP 200 today (I
  checked), but the page **states no rate limit, quota, or availability commitment** — just
  generic “Terms of use.”

---

## What the skeptics disproved or called into question

This section is not empty. Seven refutations were attempted; **two claims fell, three became
uncertain, and two held up under tougher testing**.

**REFUTED — “there is no open, permissively licensed structure→name engine.”** This statement
supported half the answer, and it is false. At least two exist: STOUT (MIT) and `openclatura`
(MIT). The person who reported the finding had qualified it — “this is absence of evidence,
not proof of absence; if one appears, this changes.” Two appeared. **If D-15 is retained,
this cannot be its justification**, because someone will discover it is false. The defensible
justification is different, and better: open engines are either neural, with 83-90% accuracy
(STOUT), or single-lab beta software, and **none speaks Portuguese or runs in the browser**.

**REFUTED — “ChemDoodle is banned in both cases.”** `CLAUDE.md` bans GPL and AGPL; iChemLabs'
commercial license explicitly covers closed-source proprietary products. The paid route is
**not banned by policy** — it is expensive, has unpublished pricing, and depends on a
third-party server for each call. Calling it “banned” turns a business judgment into a rule,
and someone reading this in six months will believe that door was closed.

**REFUTED — “US$29 for the 2D+3D bundle” and “the testimonials are from schools.”** It is
US$29/month per named user, with no academic discount. And the testimonial about
*“cash-strapped state schools”* is attributed in the raw HTML to “University of Missouri,
Kansas City” — in American English, “state school” means a public university. Of the 37
attributed testimonials, 4 seem to be from high schools, 21 from universities, and 12 from
companies. Furthermore, **none of the 37 mentions naming, nomenclature, or IUPAC**: connecting
“sells nomenclature” to “sells to schools” was an inference presented as an observation.

**UNCERTAIN — “OPSIN's Portuguese support is the central obstacle.”** The measurements are
reproducible and became stronger (PT 3/42 versus EN 42/42), but one of the eight names failed
with a different message from the one cited; “aspirin” suggested a class limitation that does
not exist (`caffeine` and `acetylsalicylic acid` pass — it is a missing dictionary synonym);
and above all, **OPSIN works in the opposite direction from the question**. It does not block
“naming”; it blocks “entering by name,” which D-09 item 3 already places after the MVP. And
the size of the obstacle was measured: ~20 lines of morphological rules recover 14/20 on a
held-out set, with zero silent mismatches. **It is a lexicon, not a wall.**

**UNCERTAIN — “OPSIN is MIT” (correct, and incomplete).** The jar you download and run contains
`jna-inchi` **LGPL-2.1-or-later** inside. Saying “OPSIN is MIT” and stopping there leads the
team to install copyleft while believing it installed permissively licensed software. And the
conclusion “it would mean a Java service alongside Next.js” is a false binary: EBI's hosted
service exists (it works today, and brings a different problem — sending what a student typed
to a third-party server).

**UNCERTAIN — “ChemDoodle nomenclature is a network call with a quota.”** The mechanism was
proved (POST, and the page intercepts a message containing `exceeded`), but **the quota was
not observed**: all 10 identical calls succeeded. Mechanism proved, limit not proved.

**CONFIRMED under tougher testing — “RDKit.js has no nomenclature.”** It survived four
attempts to disprove it, with a broader search than the original and the missing **positive
control** (`inchi` → 62 in the same `.wasm` where `iupac` → 0). Two corrections remain: the
package's `.d.ts` **is outdated** and promises `get_mol_from_pickle`, which does not exist at
runtime — grep on the `.d.ts` yields both false negatives and false positives, and “57 methods”
cannot be reproduced under any counting method (there are 55 API methods). And the package's
`LICENSE` says BSD-3, but the `.wasm` statically links InChI, Boost, coordgen, FreeType, and
Avalon; **FreeType's FTL requires attribution**, and `docs/en/THIRD-PARTY.md` needs more than one line.

**A warning none of the research tracks raised:** RDKit.js's `condense_abbreviations` produces
labels such as `CO2Et` (executed: ethyl salicylate → CXSMILES `*Oc1ccccc1* |$Et;;;;;;;;CO2Et$|`).
This is not nomenclature, but **it is exactly the kind of string a student reads as a name**.
If those labels reach the screen, D-15's rule needs to cover them.

---

## The possible paths, and the cost of each

Ordered from cheapest to most expensive. **None is a recommendation** — scope belongs to the `pm`.

### (a) Do not name compounds, and say so openly

Keep D-15 as it is and prepare a written answer to the teacher's question instead of letting
silence answer it.

- **Cost:** almost zero engineering. A sentence on screen and a rewritten decision — because
  the current justification **has been false since today** (see the skeptics).
- **Risk:** the teacher reads it as a limitation, not a choice. And there is a free competitor
  that names compounds for free on a student's phone (KingDraw, unchecked). The risk grows if
  the answer is “it can't be done”; it shrinks if the answer is “it can, but in English and
  with 1 in 15 names outside textbook conventions — we'd rather not confuse your class.”
- **What it commits us to maintaining forever:** the discipline of rejecting nicknames that
  pass for nomenclature. And this rule **has now been measured making mistakes in both
  directions** — it rejects “Camila” and accepts “aspirina.” This is the cheapest path, and
  even it has outstanding debt.

### (b) The student names it and the product checks

Name→structure: the student types a name, and the product converts it and compares it with
what they drew, or with the mission target.

- **Cost:** the lowest among paths that do something new, because **half already exists**:
  the missions' `inchiKey` condition makes exactly this comparison today, without any engine,
  with a name entered by a human in the mission data. Free-form nomenclature (the student
  writes any name) requires OPSIN — a Java service on the VPS, or `opsin-core` without InChI,
  or EBI — **plus** the pt→en layer.
- **Risk:** (1) OPSIN does not speak Portuguese, as measured; (2) the translation layer
  **decides structure**, so it cannot be an LLM (D-01) and becomes our own deterministic code,
  with a dictionary; (3) the full jar includes LGPL; (4) EBI promises no availability and
  would receive student text.
- **What it commits us to maintaining forever:** a pt→en organic nomenclature dictionary,
  reviewed by someone qualified, plus another production process (JVM) or a third-party dependency.
- **In its favor:** this is the direction ENEM and Unicamp test, where students make mistakes
  (41.59% zeros), and what Shute prescribes — the student produces, the software checks. It is
  also the only direction where engine errors are **loud and visible**: zero silent mismatches
  across 62 names.
- **Against it, seriously:** D-09 item 3 already placed “search by name” **after the MVP**.
  This path reopens a scope decision that has already been made.

### (c) Integrate a third-party engine for structure→name

Literally what the teacher asked for. The only realistic candidate: `openclatura` (MIT),
running as a Python microservice alongside Next.js — the package already includes a `[web]`
extra with FastAPI.

- **Cost:** one more production service, forever. Plus **pt-BR localization**, which is the
  real work: `NameAnalysis` provides the name in segments with `name_terms`, so it involves
  term mapping and reordering, not sentence translation — but nobody has measured how much
  of that is rules and how much is exceptions.
- **Risk:** (1) **beta 0.3.1**, one lab, created on May 8, 2026, 80 stars — if it stops, the
  problem is ours; MIT allows a fork, which limits but does not eliminate the damage;
  (2) **English**; (3) **a network call for each name** — it does not work offline and
  disappears when the VPS goes down, just as PubChem disappeared all day today;
  (4) a valid round trip does not imply a textbook name: 2 of the 30 used a less common form.
- **What it commits us to maintaining forever:** the policy of **showing only names that
  verification confirmed**. `openclatura` already includes the mechanism (`verify_with_opsin`
  → `status=matched`, executed here), but enabling it pulls in OPSIN, along with Java and
  LGPL. Without verification, it is a beta engine speaking unchecked to an entire classroom.
- **In its favor, and this is the strong argument:** it is deterministic, with no model or
  table; it carries a decision trace with the Blue Book rule number; and the atom indices for
  each segment match the graph — opening up a version of the product nobody else has:
  **highlighting the part of the drawing corresponding to each piece of the name**. That
  stops being “giving the answer” and becomes an explanation.

### (d) Nomenclature only within a restricted range

Name only what can be guaranteed: open chains up to N carbons, a single functional group,
no stereocenter — and stay silent elsewhere, explaining why.

- **Cost:** lower risk than (c), greater ongoing attention. The range needs to be **defined
  in tests**, not in a comment.
- **Risk:** (1) the boundary is invisible to users — students draw whatever they want, and a
  product that sometimes names compounds and sometimes does not seems broken unless the
  message explains the chemistry behind the refusal; (2) **the range grows**, and expanding
  scope is this project's declared number-one risk: every lesson brings another case that
  “almost worked.”
- **What it commits us to maintaining forever:** the range definition, a test that locks its
  boundary, and a pt-BR message explaining the silence.
- **An observation that changes the cost:** with `openclatura` verifying itself, the range
  need not be handwritten — it can be **“everything the round trip confirmed,”** a measured
  boundary rather than an opinion. This combines (c) and (d), and is the cheapest combination
  that answers the teacher.

### (e) Name only curated content, never live

It was not requested, but it is the cheapest path that produces some answer. Missions use a
**closed** set of molecules. We could run `openclatura` once at build time on that list, have
a teacher check each name, and store the result as **data**, just as names already enter
mission data today.

- **Cost:** none in production. No service, no network; it works offline and on low-end phones.
- **Risk:** it only answers within a mission. A teacher who draws something outside the list
  still gets no answer — which is exactly what they will do in the observation session.
- **What it commits us to maintaining forever:** a human-review step whenever the list
  changes. It is recurring teacher work, and disappears if nobody is paid to do it.
- **Note:** this **is not naming**. It is a catalog. The difference must be stated on screen,
  or users will think the product names compounds — exactly what D-15 aimed to avoid.

---

## Open questions

- **D-15's literal trigger has not fired.** It says “revisit if a reliable nomenclature
  engine **in WebAssembly** appears.” `openclatura` is Python. If the trigger applies as
  written, nothing has changed; if it meant “a reliable engine with a suitable license,”
  then things changed today. Whoever wrote the decision knows which one. — for the `pm`.
- **Which question the teacher actually asks.** “Name what I drew” (structure→name, path c)
  or “correct the name my student wrote” (name→structure, path b)? These are different products,
  with very different costs. **The Phase 3 observation session answers this for free, before
  choosing an engine.** It is the cheapest item on this list.
- **How many `openclatura` names are wrong pedagogically rather than chemically.** My 30
  are a sample I selected; 2 used a less common form. To find out: assemble the list of
  molecules the tracks actually use (`packages/quests`), run `openclatura` on it, and have a
  chemistry teacher mark each name accepted/rejected. Without that number, nobody knows
  whether it is “almost there” or “not suitable.”
- **How much pt-BR localization of `openclatura` costs.** Names come out in segments with
  `name_terms`, suggesting mapping rather than translation. Measure by counting distinct
  terms generated when naming the mission list, and cases requiring reordering (“ethyl
  acetate” → “acetato de etila”). I did not do this.
- **PubChem's `IUPACName`** remains unmeasured: 503 all day, across five sets of attempts.
  Retry at another time and from another IP. If it names arbitrary SMILES, there is a free,
  deterministic structure→name path with nothing to install — but PubChem only names what
  already exists there, the opposite of the nickname use case.
- **Was PubChem down, or was this IP blocked?** If it is a source-based block, the production
  VPS could meet the same fate and nobody would know until a lesson happened. Find out by
  repeating the same `curl` from another network. — for `backend` and `deploy`.
- **The actual false-positive rate of `SYSTEMATIC`.** I invented my own test set. Find out
  by passing a list of Brazilian first names (IBGE) and a pt-BR vocabulary through `checkName`
  — it runs offline, in minutes.
- **Latency under classroom load.** A single call says nothing about 30 students at once.
  And testing a free public service's limit by taking it down is something we must not do —
  which is itself an argument against depending on one.
- **Fuvest and UNESP** were not checked (TLS error in the archive). The ENEM+Unicamp pattern
  is strong, but another exam board would make the case stronger. **Curricula from Goiás,
  Minas, Bahia, and Paraná** were not read either — if any requires structure→name under an
  EM13CNT code, that reopens the discussion.
- **A study directly comparing “software gives the name” with “student gives it and software
  checks”** in organic nomenclature was not found. Shute's argument is general, not chemistry
  specific. Find out by instrumenting the product itself.

---

## Who needs to know

- **`pm` — makes the decision, and there are two decisions, not one.** First: D-15's
  justification fell (“there is no open engine” has been false since today), even if the
  decision stands; if it does, it needs a new argument, and the new one is better than the
  old. Second: path (b) reopens D-09 item 3, which already placed name search after the MVP.
  Before any choice, the cheapest question on the list is the observation-session question:
  which of the two directions the teacher wants.
- **`security` — before any installation, and there are four issues.** (1)
  `opsin-cli-2.9.0-jar-with-dependencies.jar` contains `jna-inchi` **LGPL-2.1-or-later**;
  it is not in `CLAUDE.md`'s literal ban, which is precisely why it needs an explicit decision.
  (2) `openclatura` 0.3.1 is MIT with only one runtime dependency, `rdkit` (BSD-3) — clean,
  but it is the product's first **Python** dependency and changes deployment. (3) STOUT is
  the general lesson: an MIT LICENSE with **weights distilled from proprietary software
  under an academic license** — the code license does not cleanse training-data provenance,
  and this applies to any model the team considers. (4) `quimifyapp/opsin` and
  `nobyt/smiles2iupac` have no license at all. Add to this: any nomenclature engine is a
  network call, carrying a student's drawing, often a minor's, to a third-party server —
  the legal basis under LGPD must be defined before, not after.
- **`reviewer` — two ready vetoes.** If anyone proposes STOUT or any neural nomenclature
  engine, the figures **83.52% and 89.86%**, measured by the authors themselves, are the
  argument, and match the profile `CLAUDE.md` uses to ban the LLM. And if any nomenclature
  path is adopted, the accompanying rule is **do not show a name that verification did not confirm**.
- **`backend` and `deploy` — PubChem returned 503 all day on August 27, 2026**, and the
  product already depends on it. It is worth finding out whether it was the service or the
  IP, and measuring from the VPS's IP, which is the one that matters.
- **`frontend` and `ui-ux` — the `parece-sistematico` rule rejects “Camila” and accepts
  “aspirina,”** the opposite of its purpose. And RDKit's `condense_abbreviations` produces
  labels such as `CO2Et`, which students read as names — if they appear on screen, they fall
  under the same D-15 rule.
- **Whoever cleans the tree before the next commit:** `cd.html` and `st.html` at the root
  are untracked debris from this research.
