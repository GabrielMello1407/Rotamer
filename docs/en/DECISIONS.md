<!-- source: docs/DECISOES.md · sha256:bc37cb3f2ff807156c7a3dfe50a4dadf3c92532326ca3e5f5730cda19166aaf1 -->
<p align="right"><a href="../DECISOES.md">Português</a> · <strong>English</strong></p>

# Decision log

Each entry states what was decided, why, and what would have to change for the decision to be
reconsidered. A decision without context becomes dogma; with context, it becomes a tool.

---

## D-01 · The deterministic core decides; AI only explains

**Decision.** Validity, valence, formula, mass, SMILES, InChIKey, descriptors, and mission scores
always come from RDKit or the mission engine. The LLM never answers any of these questions — it
reads the numbers already calculated and explains, suggests, and prompts reflection, always labeled as a hypothesis.

**Why.** An LLM gets around 90% of valence questions right, and for the other 10% produces a
beautiful, confident, wrong explanation. A student may not notice. A chemist will stop using the
product — they test an edge case within the first thirty seconds, see the nonsense, and tell their
colleagues. Trust in a scientific tool cannot be recovered.

**How this appears in the product.** Every analysis block carries a source indicator: a green dot
for calculated results, amber for generated ones. The prompt receives the finished descriptors and is instructed never
to recalculate them. The output is JSON with a closed schema and no numeric fields.

**Reconsider if.** Never for convenience. Only if a model exists with a formal guarantee of chemical
correctness — which is not the case today.

---

## D-02 · Do not reimplement chemistry; use RDKit

**Decision.** The graph, 2D editor, 3D rendering, and game mechanics are written by hand. The
chemistry — SMILES parsing, valence, aromaticity, conformation, force field — is RDKit
compiled to WebAssembly.

**Why.** The prototype proved this in practice. A custom chemical core was written in a few
hundred lines and worked well for ethanol, acetic acid, benzene, paracetamol, and aspirin —
and **got caffeine wrong**: the five-membered nitrogen-containing ring really is aromatic
(imidazole), but a homemade detector only recognized aromaticity in six-membered rings. The error
also appeared in the physics, because without aromaticity detection the ring received no
planarity constraint.

Tautomerism, stereochemistry, and resonance forms are the same trap, on a larger scale.

**The analogy.** You write your own game engine, but you do not reimplement floating-point arithmetic.

**Reconsider if.** RDKit.js proves unviable on low-end phones — and then the answer is to move
the calculation to the server, not write chemistry by hand.

---

## D-03 · 2D is the input; 3D is the consequence

**Decision.** Drawing happens as a flat structural formula. The 3D geometry is derived and
synchronized, never edited directly.

**Why.** Nobody designs molecules by dragging atoms through three-dimensional space — it is imprecise,
tiring, and not how chemists think. Chemists have always drawn skeletal formulas in 2D.

**The bonus.** The moment of “I drew this flat, and now I can see that it does not fit together in space” is exactly
the hardest intuition to teach in organic chemistry. It comes for free, as a side effect of the
architecture.

---

## D-04 · Organic and medicinal chemistry in the same engine

**Decision.** One product, with tracks of increasing depth: Estrutura → Geometria →
Propriedade → Otimização (Structure → Geometry → Property → Optimization).

**Why.** Medicinal chemistry is applied organic chemistry. What changes between a high school
student and a master's student is not the engine — it is the standard for success. Splitting it into two products would duplicate
the work and divide the audience.

**The caveat.** The two are brought together through depth, not screen density. Showing everything to everyone at the
same time is what clutters the interface.

---

## D-05 · A canvas interface, not an instrument panel

**Decision.** The drawing canvas fills the screen. Tools float in a discreet toolbar, essential
metrics sit in a compact strip, and everything else lives in a drawer that opens on demand.

**Why.** The first version of the prototype showed everything all the time and became cluttered. A
creative environment needs the creation to be the main focus and everything else to step aside.

**The mental reference.** Figma and Excalidraw, not Bloomberg Terminal.

---

## D-06 · The palette comes from the flame test

**Decision.** Copper (turquoise) as the brand color; barium, sodium, lithium, and cesium for semantic
roles. Neutrals with a blue-violet bias, drawn from the inner cone of a Bunsen burner flame.

**Why.** These are literally chemistry's colors: each element emits at its own frequency
when burned. No color was chosen on taste alone — each has an element behind it. And this also
provides a coherent categorical palette for charts at no extra cost.

**The resulting constraint.** CPK colors belong to atoms. No button, link, border, or
semantic state may use a CPK color — if the interface uses red, red stops meaning
oxygen. That is why the accent is turquoise: no common element is turquoise
in CPK.

---

## D-07 · The name is Rotamer

**Decision.** Rotamer, with a symbol in staggered Newman projection.

**Why.** A rotamer is an isomer that exists because of rotation around a single
bond — the product's signature moment, when vibration shows ethane rotating freely and
ethene refusing to. In Portuguese it is *rotâmero*, recognizable without translation. And it spans both
tracks: conformational analysis in organic chemistry, rotatable bond counts in Lipinski and Veber
in medicinal chemistry.

**Rejected names, with the collision found:**

| Name | Collision |
|---|---|
| Kekulé | Kekule.js, a cheminformatics toolkit with a JCIM paper and an npm package |
| Bunsen | A product launched by Schrödinger, an AI co-scientist for molecular discovery |
| Ylide | ylide.io, a funded web3 messaging protocol |
| Anomer | anomer.bio, a synthetic monosaccharide company |
| Moiety | Moiety, Inc., with registered trademarks |
| Kovalent | Grupo Kovalent, a Brazilian company making reagents for clinical testing — same country, adjacent field |

**The process lesson.** The first check of Kovalent said “available” because the search used
returned naming blogs instead of companies, and DNS was not checked. **The correct order:
check DNS first, then search for companies, then INPI.** No DNS record does not mean
available at the registrar, and available at the registrar does not mean clear at INPI.

**Pending.** Confirm `rotamer.app` / `.org` / `.dev` at the registrar and the trademark at INPI.
The checks performed here used DNS and search; they do not replace a trademark search.

**Known caveat.** UCSF Chimera has a *tool* called Rotamers — a feature
inside a program, not a product. And rotamers are more strongly associated with protein side
chains than with small molecules.

---

## D-08 · Closed-source commercial product — **revoked by D-28 on September 11, 2026**

**Decision.** Proprietary code, all rights reserved. Tiered monetization, with
a free base driving distribution.

**Why.** The owner's decision. Replaces the previous recommendation of AGPL-3.0.

**What this allows.** RDKit is BSD-3 and Three.js is MIT — both allow commercial use in a
closed-source product, with attribution retained. There is no technical obstacle. See `THIRD-PARTY.md`.

**Update — charging waits until contact with a real school (August 26, 2026).** The
subscription tier was in Phase 4 and was **deliberately postponed**. The stated buyer is the
public school, which does not buy by card: it buys through a public purchase commitment, with an invoice, in a process that
no self-service checkout supports. Building a payment gateway now would mean choosing how to charge
before knowing what to charge for, why, and whom — and scope creep is the project's number one
risk.

When Phase 3 happens, the question returns with answers from real teachers. The path that
looks right today is **licensing by code**: the school pays separately and receives a code that unlocks the
paid tier for its accounts, using the same mechanics already behind classes and password changes. But that
is decided after listening, not before.

**What requires attention:**

1. **No GPL or AGPL dependencies are allowed.** A single one contaminates the whole product. Checking
   licenses before installing became a rule in `CLAUDE.md`.
2. **The community campaigns phase loses its original rationale.** The Foldit/Drugit model works
   because people contribute to open science. Contributing for free to a closed-source product
   is a different proposition. Either it becomes a B2B feature — the laboratory pays to run internal
   campaigns with its own team — or participants need a clear benefit in return.
3. **A university outreach project becomes questionable.** Outreach presupposes a public benefit, and
   developing a commercial product using an institution's time or resources may constitute a
   conflict of interest. **Before associating Rotamer with UENP in any way, check the
   institution's internal rules.** This concerns a career, not a legal detail.
4. **The original thesis was value for the community.** The tiered model preserves that — students and
   individual teachers use it for free, institutions pay — but it is an active choice that must
   be maintained when revenue pressure appears.

**Reconsider if.** Adoption stalls because academia distrusts a closed-source tool,
or if opening the core (while keeping the mission layer and classroom dashboard closed) proves
better for distribution.

---

## D-09 · Education is the product; researchers are advanced users, not customers — **relaxed by D-28 on September 11, 2026**

**Decision.** Rotamer is a tool for teaching organic chemistry. The buyer is the school, the
exam preparation center, and the educational institution. Researchers are welcome advanced users — they are not the ones
paying the bills, and the product stops being designed as though they were.

**What prompted it.** The question was direct: *“Why do we need missions if this is for
scientists?”* And the criticism was right — missions with green checkmarks and a “3/6” counter speak the language of
students; a master's student reads that as an educational toy and closes the tab.

Investigation revealed an inconsistency in this repository's own documents:
`ORIGINS.md` records a pivot “toward scientists,” but `PITCH.md` describes an educational
problem and lists schools and exam preparation centers as buyers. The two did not agree.

**Why education.**

- **Scientists are a poor market for this product.** Small, skeptical, and already equipped — ChemDraw and
  Maestro paid for by the institution, PyMOL for free. And the product itself states that it is not a
  laboratory tool and does not compete with them. Selling a scientific tool to people who already have
  scientific tools is an uphill climb.
- **Education has a real, defensible gap.** Nothing decent in Portuguese, nothing that works on a public
  school phone, nothing that shows a single bond rotating next to a locked double bond.
- **The missions are precisely what is being sold.** They are what teachers use to teach. Cutting them
  to please an audience that probably would not pay would remove the piece that sustains
  revenue.

**What changes in the product.**

1. Missions stay, and remain central. They keep speaking students' language, because students are the users.
2. The Otimização track continues to exist, but **without the language of missions, scores, or achievements**.
   For advanced users it is an open-ended tool, not a game.
3. What fills the blank screen for advanced users is not a mission — it is **importing**. Pasting
   SMILES enters the scope; name search and analog comparison wait until after the MVP.
4. `PITCH.md` retains its educational focus, now explicitly.

**What this does NOT mean.** Education is not a license for imprecision. **A chemistry teacher is a
chemist.** If the app states something chemically wrong, they are the one who notices — and they will not bring
their class back. The rigor of the deterministic core (D-01, D-02) applies just as strongly, perhaps more so:
in an educational tool, an error does not confuse one user; it confuses an entire classroom.

**Reconsider if.** A laboratory or company appears willing to pay before any school.
Then the market signal wins over the reasoning — but wait for that signal; do not assume it.

---

## D-10 · 3D geometry comes from OpenChemLib, not RDKit

**Decision.** RDKit continues to answer every chemical question — validity, valence,
aromaticity, formula, descriptors, InChIKey. The **geometry** — initial conformation and
force field minimization — comes from OpenChemLib (BSD-3-Clause), running in the same worker,
always from the molblock that RDKit has already sanitized.

**What prompted it.** `ARCHITECTURE.md` said “Geometry: RDKit ETKDG + MMFF94.” During implementation,
the published package proved incapable of this: npm's `@rdkit/rdkit` includes only MinimalLib,
which generates **2D** coordinates and nothing more. Verified at runtime — `has_coords()` returns 2, and there
is no entry point for ETKDG, a force field, or conformation. The original plan was not
executable with the library that exists.

**The three options assessed.**

| Option | Why it was not chosen now |
|---|---|
| Compile a custom RDKit WASM with `DGeomHelpers` and `ForceField` | Requires Docker and emscripten, a long build, a much larger WASM, and maintenance for every RDKit release. Blocks all of Phase 1 until the build is ready. |
| Calculate geometry on the server | The fallback anticipated in D-02, but it breaks Phase 1's “everything on the client”: every topology change becomes a server round trip, and schools with poor internet are the use case, not the edge case. |
| **OpenChemLib on the client** | **Chosen.** |

**Why OpenChemLib.** BSD-3-Clause license, compatible with a closed-source product. A real
conformation generator and MMFF94, measured here: aspirin goes from 102.22 to 18.91 kcal/mol, and the
force field takes 0.3 ms to assemble. It is 1.1 MB of JavaScript plus 1.3 MB of tables —
fractions of RDKit's WASM. And it returns energy at each stop, making the folding shown on screen the
actual minimization, not an invented interpolation between start and finish.

**How D-02 still holds.** We are not reimplementing chemistry: we are using a second
established library for the part the first one does not cover. The boundary is clear and verified
by tests: **OpenChemLib only receives structures RDKit has already approved**, and no chemical verdict
— validity, aromaticity, descriptor, mission score — goes through it.

**The detail that changed the implementation.** OpenChemLib's minimizer only writes coordinates
when it converges: asking for “twelve iterations, then show me” runs and returns nothing. Folding
frames are obtained by gradually tightening the gradient threshold — each stop is a real geometry on the
path to the minimum.

**Reconsider if.** An official RDKit.js build with ETKDG and MMFF94 becomes available, or OpenChemLib diverges from
RDKit in a case that reaches the screen. In that event, switching is inexpensive: the boundary is a single function,
`generateGeometry(molblock)`.

---

**Update — the force field does not cover the periodic table, and that does not remove the shape.** MMFF94
has parameters for organic elements and a handful of ions; drawing tin, tungsten, or
anything else outside that list makes OpenChemLib refuse to assemble the force field. Previously, the
raw exception (“Couldn't assign an atom type to atom 3 (Sn)”) reached the screen as a program error
and brought down the whole editor, along with the drawn molecule.

What the fix revealed: **the conformation generator does not depend on the force field**. It
builds the three-dimensional arrangement from bond lengths and angles, and builds it well —
tetramethyltin comes out with C–Sn at 2.15 Å, against a tabulated 2.14 Å. So the right distinction is not
“has geometry or does not”: it is **relaxed geometry** versus **assembled geometry**.

`Geometry` now states this (`relaxed`, `unsupported`, and `energy`, which can be `null`), and the
screen follows the same distinction: the shape appears and rotates normally; energy disappears, because it does not exist;
the vibration button is disabled, with the reason in its `title`; and the normal modes panel explains that
without energy there is no frequency. Everything removed from the screen is removed because it no longer exists, not because
the product gave up.

---

## D-11 · Local Postgres, no managed service

**Decision.** The database is Postgres running on our own infrastructure: a container in
development, a service on the VPS alongside PM2. No Supabase.

**Why.** The owner's decision. What Supabase delivered in the original plan — database, auth, and
storage in a single subscription — loses its value when deployment is already a VPS with PM2: Postgres becomes
one more service on the same machine, and authentication becomes a couple of hundred lines of cookie-based
session code, which can be read in full in an afternoon.

**What changes.** `ARCHITECTURE.md` said “Postgres + Prisma (Supabase initially).” It remains
Postgres + Prisma; the intermediary disappears. The only thing that changes between environments is
`DATABASE_URL`.

**What else we gain.** No third-party dependency in the login path, no row quota, and
student data stays somewhere the institution can point to — which matters when the buyer is a
school.

**What we lose.** Backups, replication, and version upgrades become our responsibility. This should be written
in `DEPLOY.md` before the first student arrives, not afterward.

---

## D-12 · The mission catalog lives in code, not in the database

**Decision.** There is no `quest` table. Missions are a TypeScript module versioned alongside
the engine that evaluates them; attempts store the `slug`.

**Why.** A mission's `spec` is executable code: conditions on descriptors that RDKit
calculates. Storing this in the database would create two sources — the table row and the function that interprets it
— and they could disagree. Editing a mission in the database would change everyone's score without a commit,
review, or test. Mission instructions are teaching material: they undergo review like code.

**The caveat in `ARCHITECTURE.md`.** The document anticipated a `quest` table with `spec jsonb`. This
becomes sensible again when a mission editor for teachers exists — then missions become
user data rather than product content. Until then, it would be complexity without an owner.

**Reconsider if.** A teacher asks to create their own mission. This is a likely request in Phase 4.

---

## D-13 · The tutor does not write numbers

**Decision.** The model's output is JSON with a closed schema and three text fields, and **text containing
a digit is rejected**. To cite a value, the model writes a reference in braces —
`{{tpsa}}`, `{{molarMass}}` — and the interface replaces the reference with the number
RDKit calculated.

**Why.** D-01 says AI explains and does not decide. In practice, this leaks through text: the
model only has to write “the mass is 180.2,” rounded differently from the metrics strip,
for the screen to contradict itself — and readers have no way to know which one is right. With
references, there is no path for a generated number to reach the screen.

**How it is enforced.** Validation rejects rather than corrects: a response with an unbound digit is discarded
and the tutor says it could not explain. Small quantities written out remain allowed —
“dois carbonos” (“two carbons”) is not a number on screen; it is Portuguese prose.

**What else came with it.** Caching by `(inchikey, missão, tipo de ajuda)` (InChIKey, mission, help type), because the same error in the
same mission produces the same explanation and it works for everyone; a daily request cap per person,
falling back to handwritten hints; and the tutor disabled when there is no key, without
removing anything from the rest of the product.

**Reconsider if.** The tutor needs to cite a value that the core does not calculate. Then the
answer is to expand the list of references — never to allow digits.

---

## D-14 · Vibration is real molecular dynamics

**Decision.** After folding reaches the minimum, the molecule begins vibrating through integration of
Newton's equations — velocity-Verlet, a half-femtosecond step, a 300 K bath — with forces from the
**same MMFF94 potential** that found the geometry. The trajectory is precalculated in the worker and
cached by InChIKey alongside the conformation.

**What almost happened.** `README.md` had promised “vibrating under molecular dynamics” from
day one, and that promise went unsupported throughout Phase 1: OpenChemLib exposes energy but
not the gradient, and rebuilding the force field for each evaluation took twenty milliseconds
per step. The alternative was to animate a sine wave and call it vibration — exactly the kind of
lie D-01 exists to prevent, only in physics rather than chemistry.

**What unblocked it.** The force field stores coordinates in an internal vector; writing to it makes
energy evaluation take three microseconds. This brings the central-difference gradient of an aspirin-sized
molecule below half a millisecond, and a ninety-frame trajectory takes
less than a hundred.

**The risk, which is real.** This vector is not part of OpenChemLib's public API: it is an internal detail,
accessed through a minified name that could change in the next version. Three defenses:

1. The vector is **discovered by its shape and confirmed by its behavior** — it must have 3N positions
   and changing it must change the energy. Nothing is assumed from its name.
2. Before simulation, the assembled energy is compared with the energy at the end of folding. If they do not match, the
   atom order is not the same and the simulation is abandoned — vibrating the wrong molecule is worse
   than not vibrating at all.
3. If either check fails, the scene shows a stationary shape and the product carries on. And
   `dynamics.test.ts` fails loudly, which is how the problem is found on upgrade day rather than during a lesson.

**Reconsider if.** OpenChemLib begins exposing an analytical gradient — then internal access disappears and the
simulation becomes more accurate for free.

---

**Update — playback needs two clocks.** The physics was right and the screen was
wrong. A single clock starting when the scene mounted did two bad things: from the second
molecule onward, time had already passed the two seconds of folding, so every new
structure appeared complete — the animation simply did not run; and vibration, sampled from the
same offset clock, started at an arbitrary frame in the cycle when the trajectory arrived from the
worker, causing a visible jump. There are now two clocks: folding resets when the geometry changes, and
vibration resets when the trajectory arrives or motion is turned back on — vibration
always starts at frame zero, which is the minimum geometry itself, and the transition has zero displacement.

Three hypotheses were raised and **disproved by measurement**, and are recorded here so they are not
reinvented: vibration is not too fast (above 2500 cm⁻¹ accounts for only 0.4%–6.9% of any hydrogen's
movement; what is visible is the modes below 800 cm⁻¹); folding does not need
to be parameterized by displacement instead of frame index; and replacing linear interpolation
between frames with Catmull-Rom would change less than one pixel on screen.

---

## D-15 · The product does not name compounds; whoever discovers them gives them a nickname

**Decision.** Rotamer has no nomenclature engine. What it has is **authorship**: a
structure accepted by RDKit and not previously registered can receive a nickname from whoever
drew it, and that nickname always appears alongside the name of the person who gave it.

**The question that prompted it.** “Will the product name molecules?” — raised during the scope review
after v0.1. Calculating an IUPAC name is a project of its own, with numbering,
branching, and group priority traps that RDKit.js does not solve. Pretending it does would repeat the
custom-kernel mistake, now in nomenclature.

**Why authorship instead of nomenclature.** InChIKey is already the molecule's identity in the product, and
the data model already mentioned “rediscovery credit.” Giving a nickname turns that same key into something
a student understands: if you reached that structure first, the name is yours. It is the product's
mechanics supporting what it already knows how to do.

**The rules, and why they exist.**

- **A nickname must not look like nomenclature.** A formula (`C9H8O4`) or a standalone systematic word
  (`butanol`) is rejected, with an explanation. A nickname masquerading as a real name is worse
  than no nickname: it gives students the impression that the product named the compound.
- **It never appears alone.** On every screen showing the nickname, “batizada por Fulano”
  (“named by So-and-so”) appears with it. This is authorship, and authorship has a visible owner.
- **It requires an account**, because a nickname without someone responsible is not authorship.
- **It belongs to the structure, not the drawing.** Two people reaching the same molecule by
  different paths find the same nickname. Whoever arrived first keeps it.

**The limit that must be stated.** Rotamer does not know whether the compound exists outside it. “Ninguém
batizou” (“nobody has named it”) means “ninguém batizou aqui dentro” (“nobody has named it here”), and the screen says exactly that. Checking
whether it really exists arrives with PubChem name search in v0.2 — and then the
message changes from “ninguém batizou” to “este composto já é conhecido como tal” (“this compound is already known as this”).

**Reconsider if.** A reliable nomenclature engine becomes available in WebAssembly, or PubChem search
shows that almost every structure drawn in class is already known — which would make
nickname-giving rare enough to become an achievement instead of a feature.

**Update — verification exists.** PubChem lookup by InChIKey arrived alongside
name search: known compounds cannot receive a nickname, and the screen shows the name registered there
with the CID. When PubChem does not respond, the product **says it does not know** and the
nickname remains valid here, with that caveat on screen — three states, not two, because “I could not
verify” is not “it is new.”

**Update — whoever gives a nickname saves the molecule.** Naming and saving remain different things: the
nickname belongs to the **structure** and applies to everyone; the shelf belongs to **the person signed in**. But nobody
names a molecule they do not want to keep, and the question “is naming the way to save?” appeared
as soon as the two actions sat side by side on the same screen. The product's answer became
“no, but naming also saves it”: naming writes `MoleculeName` and then puts the structure on
the namer's shelf. The three saving paths — deliberately saving, completing a mission,
and giving a nickname — go through the same place (`apps/web/lib/molecule-store.ts`), so there are not three
versions of the same write with different rules. If saving fails, the nickname still stands:
losing the shelf copy is less serious than undoing authorship.

**Update — August 27, 2026: the rationale fell; the decision stands for another reason.**

The `researcher` investigated the state of the world (`docs/en/research/nomenclature.md`) and disproved the implicit premise
of this decision. “There is no open nomenclature engine with a suitable license” **is
false as of today**: `openclatura` 0.3.1 is MIT, deterministic, has no model or lookup
table, runs on RDKit itself, and was measured here naming 30 out of 30 high school organic chemistry
molecules, with a 30/30 round-trip through OPSIN and **zero silent divergences**. STOUT also exists,
under MIT — and fails D-01: it is a neural network with 83.52% to 89.86% accuracy measured by
its own authors, precisely the profile this repository uses to rule out the LLM. The false premise
is recorded here because someone was going to discover it.

**The product still does not name compounds — not because it cannot, but because we choose not to.** Four reasons,
in this order:

1. **No engine speaks Portuguese.** `openclatura` returns `ethyl acetate`; OPSIN understands
   3 out of 42 names in pt-BR versus 42 out of 42 in English. This product's entire interface is pt-BR, and a
   final-year high school student reading `N-(4-hydroxyphenyl)acetamide` has not received a name; they have received a foreign
   string. And translating a compound name **means deciding structure**: it falls under D-01, cannot be done by the
   LLM, and becomes our dictionary, reviewed by a chemist, forever. It is the custom kernel again
   (D-02), now in nomenclature.
2. **Naming is a network call, not code in the worker.** Measured: no structure→name engine exists in
   JS or WASM with a permissive license — neither `indigo-ketcher`, nor `ketcher-core`, nor RDKit.js
   (`iupac` → 0 in the `.wasm`, with the positive control `inchi` → 62 in the same file). It would be
   one more production service, forever, that does not work offline and goes down with the VPS. On
   August 27, 2026 PubChem returned 503 all day, across five sets of attempts — not a
   remote possibility, but the state of the world today, and the product already depends on it. A public school on 3G is
   the use case, not the edge case.
3. **It is beta 0.3.1, from a single laboratory, created on May 8, 2026.** The MIT license allows a fork,
   which limits the damage but does not eliminate it: forking a nomenclature engine means taking ownership of
   nomenclature.
4. **Nobody asked for it, and Brazilian education tests the opposite direction.** The high school BNCC does not
   require nomenclature (IUPAC: 0 occurrences in the MEC PDF). In six years of ENEM, no question
   asked for the name of a drawn structure. SEDUC-SP and Unicamp test both directions, and where
   students make mistakes is **drawing from a name** — 41.59% scored zero on question 9 of Unicamp 2005. And
   Shute (2008) measures that giving the answer before an attempt nullifies feedback.

**The trigger was poorly written, and this is what it meant.** The text above says to reconsider “if
a reliable nomenclature engine becomes available **in WebAssembly**.” Taken literally, nothing triggered it —
`openclatura` is Python. But “WebAssembly” there was not a technology requirement: it was shorthand for
*runs where the product runs, without a new service, without a network, on a public school's low-end phone*.
Naming the technology instead of the constraint was a writing mistake, and it nearly hid a false premise
behind a trigger that would never fire. **The trigger now becomes this — three conditions that
must all hold:**

1. **The name is produced in Portuguese**, either by the engine or by our own deterministic mapping reviewed by a
   chemist. Never by the LLM.
2. **A chemistry teacher has checked every name** on the list of molecules used by the tracks and stated
   how many they would accept on an exam. A valid round-trip is not a textbook name: 2 of the 30 measured were
   correct but less common forms (`2-(acetoxy)benzoic acid` instead of “ácido acetilsalicílico”).
   Without that number, nobody knows whether it is “almost there” or “unsuitable.”
3. **Verification exists, and the product stays silent when it does not confirm.** A name unconfirmed by
   the round-trip does not reach the screen. A beta engine speaking alone to an entire classroom is D-01
   in reverse.

Before all three, the question that costs nothing: **which direction does the teacher want** — “name
what I drew” or “correct the name my student wrote.” They are different products with very
different costs, and the Phase 3 observation session answers for free. The exact questions are in
`docs/en/ROADMAP.md`. The options that remained viable, with the cost of each, are in
`OUT-OF-SCOPE.md`.

**Update — August 27, 2026: the nickname rule was wrong in both directions, and the remedy moves
elsewhere.**

Measured in `apps/web/lib/molecule-name.ts:35`: `parece-sistematico` is a loose suffix test on a single
word and **rejects** `Camila`, `Sol`, `Cristal`, `Girassol`, `Farol`, `Carnaval`, and `Ludmila`; the formula
rule rejects `Ba` and `Na`. Meanwhile, it **accepts** `cafeina`, `aspirina`, and `anilina`. It blocks a
student's first name and lets through a real compound's trivial name: the opposite of what it exists
to do. Rejecting “Camila” in front of the class ends an observation session before it
starts.

**What changes.** This decision says that “a nickname masquerading as a real name is worse than
no nickname.” That remains true — and it still is not a reason to make students bear the cost. No
regular expression over Portuguese morphology separates `Girassol` from `butanol` without errors on one side
or the other; the choice is which error is preferable, and **letting it through is preferred**. The burden that
rested entirely on the character string goes back where this decision had already placed it: **the nickname
never appears alone**. “Batizada por Camila” (“named by Camila”) next to it makes the nickname an act of authorship, and that is why
this part — already present in `NamePanel`, `/m/<smiles>`, and the shelf — now gets a test to lock it in,
instead of remaining a habit.

The written rule still rejects unambiguous cases (formulas, SMILES, and systematic nomenclature
that a chemist would recognize as such), but no nickname is rejected without a genuine case
justifying the rejection. **A list of trivial compound names is chemical data and is not invented here**:
it either comes from a source reviewed by a chemist or it does not come at all. It stays in
`OUT-OF-SCOPE.md`, and only enters if the Phase 3 review shows that the collision truly causes problems.


---

## D-16 · The workbench fills the screen; everything else enters when called

**Decision.** The drawing canvas fills the whole window. At the top, a thin strip with the formula,
mass, and structure status; on the left, a vertical toolbar; at the bottom, the numbers that
change with each stroke; in the corner, the floating 3D scene. Analysis, missions, the tutor, nicknames, and SMILES
live in a side panel that starts closed.

**Why.** The previous version split the window into two fixed columns and a tall
header: the molecule had less than half the screen, and on a laptop the benzene hexagon came out
the size of a coin. The drawing needs the space — that is where the work happens. Formula,
mass, and the “válida” (“valid”) verdict are the three things that need to be visible **always**, and they fit
in a 46 px strip.

**What this requires.** Fitting the molecule in view now accounts for what overlays the canvas: the vertical bar,
number strip, and 3D scene become margins, and the molecule is centered in the remaining space rather than the
window's geometric center. Otherwise, “enquadrar” (“fit in view”) would put half the structure behind the scene.

**On phones**, the panel enters below the drawing canvas, not over it: choosing a mission
must not mean being unable to draw.

---

## D-17 · Element color has two forms: the sphere and the letter

**Decision.** All 118 elements have CPK colors in `packages/ui/src/cpk.css`, in two sets:
`--cpk-*` is the drawn atom's color — the sphere in the 3D scene — and `--cpk-ink-*` is that same color adjusted
to 4.5:1 against the theme surface, for when the element appears **in writing**.

**Why.** Hydrogen's sphere is white, and must remain white: that is the convention throughout the
literature. But a white H on white paper is invisible. Either one accepts a gray
hydrogen in the scene — wrong to anyone who knows the convention — or one accepts an
illegible label in the drawing. With two tokens, neither is necessary.

**Where the values come from.** The ten organic elements retain the product's previously adjusted tones.
The other hundred and eight use the CPK/Jmol palette, the same one used by PyMOL and Avogadro — inventing
our own palette would show students a sulfur color that exists nowhere else. Only
lightness changes with the theme; never the hue.

**The rule still holds.** CPK colors appear only on atoms — including when the atom is a letter
in the toolbar or the periodic table. Selection, focus, and state remain turquoise.

---

## D-18 · The highlighted atom is the same on both screens

**Decision.** Hovering over a vertex in the drawing highlights the corresponding sphere in the
3D scene, and vice versa. The scene states which element it is and which atom in the drawing it represents.

**How.** Each geometry atom carries `source`: the index of the graph atom from which it originated. The
hydrogens added by the force field do not exist in the drawing, so they point to the neighbor
they are attached to — pointing at an H in the scene highlights its carbon, which is what the person is
looking for.

**Why it matters.** The two screens show the same molecule, and until now there was no way to tell which
sphere matched which stroke. In a chain with four similar carbons, that correspondence is the
difference between the 3D scene being information and being decoration.

**The halo is turquoise** — the brand color — precisely because no element is turquoise in CPK: the
highlight will never be read as an atom of a different element.

---

## D-19 · Password recovery without email: the teacher issues the code — **revised by D-29 on September 16, 2026**

**Decision.** Someone who forgets their password does not receive an email link. They ask the classroom
teacher for a code, enter it at `/senha`, and change the password right there.

**Why.** The buyer is the school and the user is the student. In public schools, many students have no
email address of their own; those who do will not open it during class — and class is exactly when the password
is missing. An email flow turns “I forgot my password” into “I missed the lesson.” Add to that what
email brings along: an SMTP account, a domain with SPF and DKIM, delivery to spam folders, and one more external
service on the critical path for someone already stuck.

**Who can issue a code.** Three rules, all enforced on the server:

1. only teaching accounts issue codes — and **nobody declares themselves a teacher**: promotion is done by
   `apps/web/scripts/promote-teacher.mjs`, run by someone with server access, or by an
   administrator of the same school through the interface (D-29);
2. only for an account at the **same school**, which must be filled in on both sides;
3. **never for someone who teaches, or who has ever taught** — otherwise this path becomes a ladder for taking over
   the account of someone who issues codes. An account that has ever taught recovers its password through the terminal.

**What D-29 revised.** Two things.

Item 1, the part about “who promotes”: the role can now be granted by an administrator of the same
school, who was themselves created through the terminal.

And item 3, which gained “or who has ever taught.” Previously, “teaches” was enough, because removing the role was
a terminal operation — rare, deliberate, performed by someone who already had database access and did not need a
password code for anything. With demotion available in the interface, D-29's audit revealed the ladder:
the administrator demotes a teacher from their school, and on the next click that teacher is no longer
“someone who teaches” — they become a valid target, and their account opens with a code the school administration itself issues.
The record of this happening is a `RoleChange` row leaving a teaching role, and it is never
deleted. The price is a rare false positive: a student accidentally promoted and demoted on the same day becomes
dependent on the terminal to change their password. Cheap, compared with the vulnerability the rule closes.

The rest of this decision remains intact — no self-declaration, no email in the path, and the person
issuing the code is still the one in the classroom.

**The code.** Eight characters from an alphabet without `0`, `O`, `1`, `I`, or `L`, because it will be read
from paper and dictated aloud in a room with thirty people. It lasts 24 hours, works only once,
and issuing another for the same account invalidates the previous one. Only the SHA-256 digest is stored in the database — if the
database leaks, the codes in circulation remain useless to the attacker, the same precaution used for passwords and
sessions. Changing the password ends that account's open sessions.

**What the screen does not reveal.** “Email does not exist,” “wrong code,” “expired code,” and “code already
used” all receive the same message. Distinguishing them would turn the screen into a way to discover
who has an account in the product.

**Reconsider if.** The school asks for self-service outside class, or the product gains individual use
outside classrooms — then email becomes worth its infrastructure cost. The teacher's
path stays, because it solves the classroom case better than any link.

---

## D-20 · A normal mode is a calculation, not an animation

**Decision.** The product calculates real **normal modes of vibration**: an MMFF94 Hessian through
finite differences, mass weighting, projection of rigid-body motions, and
diagonalization. Each mode appears in the list with its wavenumber and can be shown on its own in the
scene.

**Why this rather than a pretty animation.** Molecular vibration has structure: a molecule with N
atoms has exactly **3N − 6** modes — **3N − 5** if it is linear, because rotating around its
own axis does not move any atoms. Each mode has a frequency and a movement pattern in which
all atoms participate simultaneously. This is lesson content, and it can be checked: students count
the atoms, do the calculation, and the number must match.

**Dynamics at 300 K still exists** (D-14) — it is the real molecule, with all modes
superimposed, which is what happens in nature. An isolated mode is its decomposition. Both
appear in the same scene, one at a time.

**Where projection enters.** The six (or five) rigid-body motions are removed from the space
**before** diagonalization, rather than discarded afterward using a handpicked threshold. It is the difference
between the count being correct by construction and being correct by luck.

**What is exaggerated, and the screen says so.** Amplitude and speed. A C–H stretch completes one cycle
every 11 femtoseconds, and its thermal amplitude is a fraction of an ångström: in real time and at real
scale, nothing can be seen. What is correct is the shape of the motion — who moves, where, and in what
proportion.

**What is not ours.** The frequencies belong to MMFF94. A classical force field with a
harmonic potential overestimates stretching by around 5% to 10%, and the interface says so: the number is for
comparing modes with one another, not for checking an infrared table.

**CO₂ is the instructive case.** For it, MMFF94 gives two **imaginary** bending modes — the
linear geometry, which is correct, is not a minimum in this force field; we measured it, and energy falls from
70.0 to 49.5 kcal/mol when bent. The product **shows the negative number and explains it**, rather than
hiding it or, worse, bending the molecule to please the force field. Bending CO₂ to satisfy
poor parameterization would teach incorrect chemistry through the most famous geometry in high school.

**Size limit.** Fifty atoms, including hydrogens. The Hessian costs 36N² energy evaluations
and diagonalization is O(N³) — above that, the low-end phone, which is the use case, freezes. Beyond the
limit, the screen states that the calculation was not performed.

---

## D-21 · Stereochemistry: the drawing decides; RDKit assigns

**Decision.** The editor draws solid and hashed wedges, and the information lives **in the graph** —
`wedge` is a bond property, not a property of the stroke on screen. The molblock writes it in the
V2000 stereochemistry column (1 for a wedge, 6 for a dash), and RDKit reads it and assigns `R`, `S`, `E`, and `Z`
using the Cahn–Ingold–Prelog rules.

**Why RDKit rather than us.** CIP has cases nobody gets right from memory — priority by
atomic number, then by sphere, with atom duplication for multiple bonds and configuration-based
tiebreaks. Writing this by hand would be exactly the chemical judgment D-01 prohibits, with the
aggravating factor that the error would be silent: an `R` where there should be an `S` does not look wrong on any
screen.

**The narrow end is at the stereogenic atom.** That is why bond direction is part of the data:
`from` is the narrow end, `to` the wide one. Flipping the wedge — Shift with the tool — changes the
center's configuration, which is how to draw the enantiomer without erasing anything.

**The `?` is an answer, not the lack of one.** An existing center whose configuration is not defined by the drawing gets a `?`
next to the atom, in a lighter tone. Without this, “estereocentros: 1 — 1 sem configuração” (“stereocenters: 1 — 1 unconfigured”) in the
number strip does not say **which** atom is unresolved, and in a molecule with three centers that is the
difference between correcting and guessing.

**The wedge is part of the topology key.** Changing a center's configuration changes the molecule:
the 3D geometry is recalculated, the InChIKey cache separates enantiomers, and the scene shows the mirrored
shape — verified by a test using the sign of the scalar triple product of the center's neighbors.

**Wedges and dashes do not carry over to 3D — nor should they.** They are **projection** notation:
a way to write depth on paper that has no depth. In the three-dimensional scene,
depth is real, and drawing a dotted line there would mean something else — a hydrogen
bond, partial bond, or weak interaction. What carries over is the **letter**: `R` and `S` appear
next to the same atom on both screens, and the difference between enantiomers appears where it truly
exists, in their shape.

**What does not yet exist.** A wavy wedge (`either`, “the side is unknown”) is read from the
molblock as planar, because drawing something that means “undefined” and treating it as defined
would be worse than ignoring it. Ring stereochemistry and atropisomerism have no dedicated handling:
RDKit perceives what it can from the flat drawing, and nothing beyond that is claimed.

---

## D-22 · Teachers see where the class got stuck, not what each student drew

**Decision.** A class is a list of students and a six-character code the teacher writes on the
board. People join by entering the code — no email invitation, for the same reason as D-19. The class
dashboard shows, for each student: completed missions, missions they got stuck on, and when they last
showed up. And, at the top, **the list of missions where the most people got stuck**.

**Why this is the screen.** The teacher's question is not “who did best” — it is “where did the lesson
stop.” The list of missions that blocked the most students comes first because it informs the
next lesson's topic. A student leaderboard would be easy to build and would serve a different purpose:
comparing people.

**Stuck = opened but not completed.** Choosing a mission from the list is deliberate, and that is what the
product records — one row per person and mission, not multiplied by reopening. The alternative that
seemed better, recording abandonment when someone changes missions, fails in the most
common case of all: closing the tab. Effect cleanup does not run when class ends.

**What teachers do not see.** Molecules students drew outside missions. These stay on their
own shelves, and monitoring creative work is something else, with a different name. The screen shows
mission progress, evaluated on the server at each attempt — never the score sent by the browser.

**A class belongs to the teacher who created it.** Another teacher, even from the same school, cannot open the board of
a class that is not theirs: the query filters by owner, not by role.

---

## D-23 · Selection is a drawing gesture, and it dies when the graph changes

**Decision.** The 2D editor gains a **Selecionar** (“Select”) tool (`V` key), with a selection
rectangle, double-click to pick the entire connected fragment, and three bulk actions: move,
delete, and change — the element of all atoms or the order of all bonds. Bulk stereochemistry
is **not** included.

**The question that prompted it.** “There is no easy way to select a particular whole bond or a large part,
because right now I can only go one by one.” This is drawing friction, not a chemistry
feature: it does not touch RDKit or create any new claim.

**The key is `V`, not `S`.** `s` is sulfur in the element map, and thioethers appear in lessons. It is the
same mistake as `f`/fit in view, which already cost fluorine its shortcut — repeating it with sulfur would be worse.

**Wedges and dashes are not bulk actions, and that is D-01.** `BondWedge` anchors the narrow end to the
`from` atom (D-21): applying “solid wedge” to eight bonds defines eight configurations nobody
chose, and RDKit would return `R`/`S` assignments the person did not draw. A silent chemistry error,
the one kind this product cannot make.

**Selection dies when the graph changes, and that is not overcaution.** `fromMolblock` **renumbers**
atoms starting at 1 — and tidying the drawing, loading an example, and pasting SMILES all go through it.
A selection preserved across any of these points to **different atoms with the same number**:
wrong and silent, which is worse than empty. That is why `commit` clears selection by default, and anyone
needing to preserve it must ask (`keepSelection`); `amend` prunes what disappeared; `undo`, `redo`, and `clear`
reset it. Forgetting fails safely, never incorrectly — the same rule the `store` already used for
hydrogens, stereochemistry, and the offending atom: an old number in a new drawing is worse than no
number.

**Fragment traversal lives in the core**, not the editor: it is a graph operation, and graphs are tested without a
browser. Rings and functional groups remain questions for RDKit — that is why “select the ring” is
not included, and is in `OUT-OF-SCOPE.md`.

**One gesture changed meaning.** A stationary Shift+click on empty space stopped creating an atom and began
clearing the selection. A named regression test covers it, because gestures that change silently
return as bugs.

**What the review caught, and deserves recording.** Two fingers pan the view in Selecionar mode — and
the first finger changed the selection as soon as it touched: panning destroyed the selected block. The previous
selection is now restored when the pinch begins. And selection dragging now uses the
same click tolerance as the rest of the editor (12 px for touch): without it, a steady finger became a “drag,” and
a double-tap would never happen.

**Reconsider if.** Observation sessions show nobody finds the tool — then the path is
a modeless gesture (Shift+drag), not another button on the rail.

---

## D-24 · Tidying changes wedges, and the product says what it did

**Decision.** Tidying the drawing remains RDKit's job, and it remains free to rewrite
wedges. What changes is that the product **reports**: how many were removed, how many moved to a different bond, how many
changed type — and whether the centers' configurations remain the same. The screen explains this in a
sentence that teaches the chemistry of the case.

**The question that prompted it.** “When I tidy the drawing, the wedge disappears. That cannot be
right, can it?” It was right and it was silent, which was the problem. Measured: a wedge on an atom without a
stereogenic center **disappears**, because it defined nothing; a wedge on a real center **becomes a dash**
or **moves to another bond**, with the identical CIP label before and after.

**Three different things, three different sentences.** The first version counted wedges by bond,
turning “moved to another bond” into “removed.” Alanine with a wedge on C–N came out with the same count
as ethanol — and the screen would tell a legitimate stereogenic center that “wedges only apply to stereogenic
centers.” A lie told to an entire classroom, the error this product cannot
make. Counting moved to the **origin atom**: if that endpoint still has a wedge, the
drawing changed; otherwise, the wedge really was removed.

**The configuration check reads the resulting drawing.** The first version asked the same RDKit object twice,
before and after `set_new_coords` — which changes the conformer and does not touch the
atom's chirality flag. The answer was always “same”: a tautology disguised as
verification. Now the returned molblock is reread from scratch, because that is what reaches the student.

**When configuration would change, tidying does not happen.** The result is discarded and the screen says
it could not tidy the drawing without changing the molecule. This was never observed in more than sixty
chiral molecules measured — and that is exactly why the guard must exist: the day it happens,
the product cannot silently deliver a molecule the person did not draw.

**Reconsider if.** RDKit begins exposing why it removed a wedge — today the reason is
inferred from the absence of a center, and inference is replaced by fact as soon as the fact exists.

---

## D-25 · Only teachers organize and create exercises

**Product owner's decision, August 28, 2026.** The person who assembles the sequence of exercises for the
class and invents new exercises is **the teacher**. Students solve them; they do not organize or create them.

**Clarification, the same day.** Creating custom missions is **optional for teachers** — they can
assemble an activity sequence entirely from the catalog, entirely from their own missions, or a mixture. What the decision settles is
**who** can do it: only teachers create, and only teachers organize. The catalog remains
as ready-made material; it is no longer the only path.

**How to create without breaking the unbreakable rule.** A mission is verified by RDKit against the
molecule (D-01). Handwritten instructions are not verifiable, and a handwritten goal can be
impossible to satisfy — “an alcohol with formula C2H4O” does not exist, and students would spend the lesson
trying. The path that respects D-01 is **the teacher draws the answer, and the product extracts
its goals**: formula, functional groups, atom counts, stereogenic centers — all
calculated from the molecule accepted by RDKit. The teacher chooses which goals to require and
writes the instructions and hints; the part that decides chemistry is never typed in.

**What remains true.** Students see progress, not rankings (D-22). The Otimização track remains
without missions (D-09). And the teacher role is still granted by an administrator, never
self-declared (D-19) — which now matters more, because teachers will publish content for
minors.

**Open question.** Does the current catalog — the 15 missions anyone can open without an account — continue
as free exploration, or become solely raw material for teachers' activity sequences? Both
interpretations fit the decision; the difference is what a student without a teacher encounters on arrival.

---

## D-26 · The catalog is for account holders, and it is searchable

**Product owner's decision, August 28, 2026**, answering the questions in the assignment-list specification
(`docs/en/CLASS-ASSIGNMENTS.md`, §9).

1. **Assignment-list scores do not leave the product.** No school has asked for grades that go into a gradebook; no
   export, no CSV, no deadline. It remains progress, in D-22's vocabulary.
2. **The mission catalog is searchable and appears to students when they create an account.** It is not just the
   class assignment list: it is everything there is to do, searchable — by name, by track, by functional
   group. Students with a teacher see the class assignment list first and the catalog below; students without
   a teacher see the catalog. What changes from the specification's provisional choice is the
   **account**: the searchable catalog belongs to people who have signed in. Visitors without an account still
   encounter the editor and mission panel as they exist today — the decision did not touch that, and it is
   recorded here as an interpretation, not an instruction.
3. **Teachers publish content read by minors, and the mitigation is D-19.** Accepted as
   it stands: the role is granted by administrators, and there is no moderation or reporting channel in this
   slice. This is stated aloud to the school, when there is a school.
4. **The on-screen word is “lista”** (“list”), without consulting the teacher: the `researcher`'s findings (Google
   Classroom, “lista de exercícios,” “roteiro” already used by the workbench) suffice. If the observation session
   finds teachers using another word, change `apps/web/app/turmas/messages.ts`.

**Open, and a question of scope.** “Everything that has been created” can mean only product
missions, or also missions teachers have created. The second interpretation is a **shared
repository** of teacher content for students in any class — and the specification
excluded it for three reasons that still stand: it requires moderation (none exists), requires visible
authorship (only `createdById` exists), and the reader is a minor. This decision implements the
first interpretation. If the owner wants the second, it becomes a separate decision, with those three
conditions first.

---

## D-27 · Teacher missions can enter the catalog — with authorship, reporting, and opt-in

**Product owner's decision, August 28, 2026**, settling what D-26 left open: the
searchable catalog **also includes missions created by teachers**, for students in any
class. It is a shared repository of teacher content.

**The three conditions the specification treated as blockers become requirements.** None
is optional, and the delivery does not exist without all three:

1. **Opt-in per mission, never by default.** A mission starts **only in its teacher's assignment lists**. Entering the
   catalog is a separate action — “publicar no catálogo” (“publish to the catalog”) — taken one mission at a time and reversible
   whenever the teacher wants. **Removing a mission from the catalog ends catalog access**: people who could only reach it that
   way lose access; people reaching it through a published list retain access, because the item is on the
   list. Previous attempts remain recorded as history (`Attempt` is not deleted), but history
   is not a key — the first implementation used “already opened” (`QuestOpen`) as lifetime access,
   which negated rule R-7: opening it once was enough never to lose access, even if the
   teacher archived or withdrew it. Fixed on August 28, 2026, the same day.
2. **Visible authorship, always.** In the catalog, a teacher's mission appears with **who wrote it and where
   they are from** — display name and institution — never without them. It is D-15 applied to
   content: something signed by a human does not circulate without the signature. A teacher's mission cannot be
   published to the catalog if the institution field is empty; promotion (D-19) already requires that field.
3. **Reporting exists, and removal is immediate.** Every public mission has “denunciar” (“report”), with a one-line
   reason. The report records who, when, and what; the mission stays up until someone removes it —
   the teacher themselves, or the server administrator through a script (`scripts/`), like every administrative
   action today. There is no moderation screen in this slice; there is a record and a removal
   button. This must be explained to the school alongside D-19.

**What remains true, and makes this acceptable.** The part that decides chemistry in a teacher's
mission **was not typed in**: its goals came from `extractGoals` on the reanalyzed answer
(D-25). What a human wrote is the title, instructions, and hints — plain text, no links,
with the limits in R-13 and R-14. So the worst case for a public mission is inappropriate text, never
incorrect chemistry taught to a classroom.

**What changes in what is already being built.**

- `TeacherQuest` gains `catalogedAt DateTime?` — null means “only in my assignment lists.” Additive migration.
- Rule R-7 (student access to a `professor:` slug) gains a **second path**: enrollment in a
  class with a published list containing the slug, **or** `catalogedAt IS NOT NULL` and
  `archivedAt IS NULL`. The four entry points remain the same.
- R-3 remains absolute: a public mission does not expose its answer to anyone but its owner.
- Catalog search (D-26) indexes the title and generated goal labels — which is how someone
  searches for “something with an ester” without anyone having typed “ester” into a tag field.
- New model `QuestReport`: `id`, `questSlug`, `reporterId`, `reason` (≤ 200), `createdAt`,
  `resolvedAt?`. Index on `questSlug`.

**What stays out, and why.** Reviews by other teachers, curation, “verified missions,”
rankings of most-completed missions: all of that is a community product, and community is Phase 4 of the
roadmap with its own caveat (D-08). This is the minimum that makes sharing defensible to a
school.

**Reconsider if.** The first real report arrives with nobody to read it — then a record was not enough, and
the moderation screen stops being “later.”

---

## D-28 · Open-source, MIT, noncommercial

**Product owner's decision, September 11, 2026.** Rotamer becomes **open-source under the
MIT license**, and **will not be commercialized**: the goal is to share the tool with people
who teach and learn chemistry. Two ways to use it, both free: the **live instance**, maintained
by the author, and **self-hosting** — anyone can run the entire product with Docker and manage
their own database.

**What this revokes.** All of D-08: no closed-source product, no subscription tiers, no
“what to charge for.” Phase 4 of the roadmap stops being “Commercial.” The prohibition on GPL and AGPL changes
in nature: it existed to protect a closed-source product; now the rule is **compatibility with
MIT in redistribution** — MIT, BSD, Apache-2.0, and ISC are allowed; GPL, LGPL, and AGPL remain excluded,
because they would impose obligations on people redistributing Rotamer, which is not what an MIT license promises.

**What this relaxes.** D-09 said researchers are advanced users, not customers. With no
customers, everyone is a user — students still come first, teachers still decide what
enters the classroom, and the research track recorded in `OUT-OF-SCOPE.md` becomes a legitimate question again,
without the commercial tension that held it back.

**What changes in meaning.** “Applies to everyone” in nickname-giving (D-15) and the shared
catalog (D-27) now applies **per instance**: each self-hosted installation is its own world, with
its own nicknames and catalog. The live instance is one of those worlds, not the center.

**Why MIT, not AGPL.** AGPL protects a hosted business from someone taking the code and selling
a service on top of it. There is no business to protect. MIT is the lowest-friction license for an
education department's IT team, a university, and anyone wanting to study the code — and it is in the
same family as RDKit and OpenChemLib, which are BSD.

**What the decision requires us to build**, in this order:

1. **Installation in three commands** — `Dockerfile`, `docker-compose.yml` with the app and Postgres,
   migration on startup, an image published with each release, and `docs/en/INSTALLATION.md` explaining what each
   variable does and what happens without it.
2. **Documentation for three audiences**, all living in `docs/` so it is versioned with the code:
   users (students and teachers), installers (IT), contributors (architecture, the unbreakable
   rule, tests). What exists today serves the third audience; the first two do not have a
   page.
3. **A landing page in a separate repository**, static, showing the product, leading to the live
   instance, teaching installation, and **pulling documentation from `docs/` at build time** — so the
   site never describes a version other than the code's.
4. **Opt-in telemetry, clearly explained.** In open source, this is a matter of reputation.

**The documentation rule, reaffirmed more strongly.** Outdated documents are updated;
dead rules are removed; comments that only repeat what the line does are deleted. This file is the
deliberate exception: it records what was decided and undone, and revoked decisions stay here
marked as revoked — never deleted. Everything else describes what exists, and where it does not,
the document is wrong, not the code.

**Reconsider if.** A cost appears that the author cannot sustain alone for the live instance — then
the answer is to reduce the instance, never to close the source.

---

## D-29 · The first administrator comes from the terminal; they promote the school's teachers

**Product owner's decision, September 16, 2026.** There is a third role,
**`administrador`**: a teacher, plus the ability to promote and demote **teachers from their own
school**, through a section in `/turmas`. Administrators are **created only in the terminal**, through
`scripts/promote-teacher.mjs --administrador`, run by someone with server access.

**The problem.** The person who installs Rotamer is not the person who decides who teaches. IT brings the instance up and
leaves; the school administration is left with no way to promote teachers, and every new teacher means a server-access
request. Under D-19 alone, a school with eight teachers depends on a shell for its day-to-day
operation.

**What this changes in D-19, and what it does not.** **Nobody declares themselves a teacher** still holds:
there is no “sou professor” (“I am a teacher”) button, because whoever issues a password-change code can enter a
student's account. What changes is **who** grants the role: in addition to someone with server access, an administrator of the same
school. The root of trust remains the terminal, because that is where — and only where — administrators are
created.

**Containment rests in one place: an administrator cannot create another administrator.** This prevents a compromised
account from multiplying and ensures that whoever controls the machine can always recover the
instance. If that is ever opened up, the rest of this decision loses its meaning.

**The rules, all enforced on the server, each with a test in `apps/web/app/actions/staff.test.ts`:**

| # | Rule | What it prevents |
|---|---|---|
| 1 | Only an `administrador` account can promote or demote | An ordinary teacher becoming an escalation path |
| 2 | Only **up to** `professor` — never to administrator | A compromised account multiplying |
| 3 | Only an account at the **same school**, filled in on both sides. The action **never writes anyone's school** | Pulling any account on the instance into one's own school |
| 4 | Never demotes another administrator | Two administrators removing each other and leaving the instance with none |
| 5 | Never changes its own role | Losing the last administrator with one click |
| 6 | Every change records a `RoleChange` — whose role, changed by whom, from which role to which, when — in the same transaction, and the write is a **compare-and-swap** against the role read | The school asking who granted access and nobody knowing; and rule 4 failing in the window between reading and writing |
| 7 | A limit of 30 per administrator per hour across the **three** actions, and rejection of writes **without a name** | Email enumeration with confirmed names |
| 8 | Demotion **removes that account's missions from the catalog** | D-19's mitigation leaving text online while the revoked role removes the author's own ability to take it down |
| 9 | Demotion also removes **read access**: `readClassrooms` and `readClassroomBoard` now require a role, not just ownership | Someone whose access was revoked continuing to read student names and progress through a bookmarked `/turmas/<id>` (D-22) |
| 10 | An account that **has ever taught** cannot receive a password-change code through the interface, even after demotion | Demotion becoming the first step toward taking over a teacher's account |
| 11 | `requireTeacher` now accepts administrators, in one place (`teaches`, in `lib/roles.ts`) | Administrators losing access to classes, assignment lists, and password codes |

Rule 11 is the subtle trap. The role was read by comparing it with the string `'professor'` in five
places; one forgotten `===` would have left administrators without classes, and the error would have appeared during a lesson,
not in a test.

**Rules 8, 9, and 10 were not in the design — they came from the audit, and all three stem from the same
mistake.** When delegating demotion to the interface, I treated “removing the role” as an operation that only
subtracts. It is not. Removing the role **moves the account into another category**, and the product had three
places that responded to roles without expecting them to change with a click: password-change codes
(which began accepting newly demoted teachers as targets — an account takeover in two clicks), the
public catalog (which kept the text online with nobody able to remove it), and class reading
(which authorized solely by owner). None of the three was a flaw before: demotion was
a rare, deliberate terminal operation. **Delegation created them** — which is why it cost
more rules than the design anticipated.

**The screen.** In `/turmas`, for administrators only, the **Professores da escola** (“School teachers”) section: a list of
people who teach, with who granted their role and when; an email field; and **two steps** — typing checks
whose email it is, and confirmation shows the **name** before writing. The real risk here is not intrusion,
which the server already rejects: it is a typo. Promoting `ana.silva@` instead of `ana.silvia@` gives someone the
power to issue a student's password code, and rereading the typed email does not reveal the mistake. Each
row shows **name and email** — a name alone would leave two teachers with the same name indistinguishable
when demoting. The screen also states the full power being granted (“emitir código de senha é
poder entrar na conta de um aluno” — “issuing a password code means being able to enter a student's account”) and the administrator's own limit (“outro administrador só pelo
terminal” — “another administrator only through the terminal”).

**What checking the name does, and what it does not.** It catches the **typo**: an email with one
wrong letter no longer slips through silently. It does not catch malicious intent, because the name is also chosen by the
person themselves during registration, without verification — someone who registers `ana.silvia@` with the name “Ana Silva” makes
the screen confirm exactly the name the school administration expects to read. Against that, what exists is the audit trail.

**What was tried and undone the same day.** The first version also reached accounts **without** a
school, and promotion stamped the promoter's school onto them — to handle people who skipped the
registration field, a common case with no correction screen. The audit showed the price: because the field
is optional, this gave any administrator reach over **every account with a blank school on the instance**,
which on the live instance is most people joining on their own. Promotion marked the school, demotion
left that mark, and from then on the account was a valid target for a password code — account takeover in three clicks,
across schools. The original design was restored: **same school, filled in on both sides**,
and the action never writes the school. Someone who created an account without a school is promoted through the terminal, with
`--escola`. The lesson extends beyond this feature: **writing the field that defines the scope is the same as expanding the
scope**, and no product screen should be able to do that.

**What the decision does not solve, and the screen does not pretend to solve.** School is text that the
person enters during registration; nobody verifies it, and no screen exists to change it. In an instance with more
than one school — like the live one — two schools coexist separated only by that text, and an
administrator reaches everyone who typed the same thing. What holds this together is a person checking name and email
before confirming, and the audit trail stating who confirmed. Verified schools, or teachers joining a
school by code, are a separate delivery and only start to matter when the live instance has more than
one real school using it. This is in `docs/en/OUT-OF-SCOPE.md`.

**What was rejected, and why.**

- **Any teacher can promote.** This removes a step, but spreads the power to everyone — and then there is no
  longer anyone the school can identify as “this person coordinates.” In a school with eight
  teachers, all eight become roots of trust.
- **Invitation by code, like joining a class.** It would be consistent with the product's other two flows,
  and the person would consent instead of being promoted. But it costs a table, expiration, and a redemption screen
  to solve what confirmation by name already solves. It remains recorded as a path for the day
  administrators do not know the email addresses.
- **Self-service on first installation** — a “be the first administrator” on a freshly launched
  instance. It is a race: whoever finds the address before the owner gets the instance.
- **Ending sessions for accounts whose role changed.** Unnecessary: the role is read from the database on every
  request, never from the cookie. A teacher demoted during class loses their powers on the next page,
  without losing what they were doing.

**In the database.** One new table, `RoleChange`, and no altered columns — the migration is additive, like
every migration here. A null `changedById` means precisely “came from the terminal”: there is no requesting account
there, only server access. The row survives the departure of whoever promoted (`onDelete: SetNull`), because deleting
the account that granted access must not delete the record that access was granted.

**Reconsider if.** A school asks to let administrators create another administrator — and the answer
remains no while the terminal exists. Or the live instance receives two real
schools: then a typed school name is no longer enough, and the boundary must be an entity, not a
string.

## D-30 · The product speaks two languages, and the core speaks none

**Product owner's decision, September 21, 2026.** Rotamer now exists in **pt-BR and English**,
end to end — screens, chemistry errors, mission briefs, metadata text, and the link image.
Portuguese remains the default. The choice lives in a cookie and is read on the server, and the
delivery rule is: **a new feature ships in both languages, or it does not ship.**

**The problem.** D-28 opened the code and self-hosting: anyone can run their own instance. But the
whole product was written in Portuguese inside the code — not in a translation file, but inside
each component. A school outside Brazil that wanted to use Rotamer would have had to rewrite the
product, and rewrite it again with every update. Opening the code without opening the language
means offering a tool that only one kind of classroom can use.

**The rule that organizes everything: the core speaks no language.** `packages/core` depends on no
one — that is what keeps it running in command-line tests, without a browser. So it could not
receive a dictionary, and the way out was to take the sentences out of it. Before, `ChemistryError`
carried `{ code, message }`, with the Portuguese sentence built next to RDKit. Now it carries
**`{ code, atom }`** — the refusal code and the numbers that justify it — and the sentence is built
by `chemistryErrorText`, in `@rotamer/i18n`. The same went for functional groups: the core returns
`carboxylicAcid`, and `functionalGroupName` says “ácido carboxílico” or “carboxylic acid.”

This was not just tidying up. It was **the wrong layer**: the core is the authority on what the
molecule is, and the sentence that tells it belongs to whoever draws the screen. While the two
lived in the same object, a change of wording touched the file that decides chemistry.

**A typed dictionary, not a translation file.** Text is declared like this:

```ts
export const saveMoleculeMessages = dictionary({
  'pt-BR': { save: 'Guardar na estante' },
  en: { save: 'Save to the shelf' },
});
```

`dictionary()` infers the shape from the Portuguese side and forces the English to fit it, with no
inference of its own. **A new key without a translation does not compile.** That is the whole
reason this function exists: the rule “every new feature ships translated” is enforced by
`pnpm typecheck`, not remembered in review. Review forgets; types do not.

Two deliberate consequences:

- **Text with a number or a name inside is a function, not a template with `{key}`.** Placeholders
  force you to invent grammar — plural, gender, word order — and what gets invented never covers
  both languages. `(n: number) => …` does, because each language writes its own.
- **The dictionary lives next to whoever uses it**, in a `messages.ts` beside the component or
  route. There is no central file. A screen and its words change in the same delivery, and whoever
  touches one runs into the other.

**The catalog mission split in two.** `QuestSpec` is what decides — slug, track, difficulty,
conditions — and it is what the server re-evaluates and the database stores. The title, brief, and
hints moved to the dictionary, keyed by slug. **A slug is never translated**, because it is
identity recorded in student attempts. The goal label also left `Goal`: storing it with the
condition tied the mission to the language it was built in, and a student who switched to English
would read the goals in Portuguese.

**Routes do not change language.** `/turmas` stays `/turmas` for English readers. An address is
identity: a link a teacher sent to the class last year has to open. A parallel `/classes` would
double the route surface to gain nothing the HTML `lang` does not already say, and
`/pt-BR/turmas` would break every existing link at once.

**A cookie, not `localStorage`.** The theme lives in `localStorage` because only the browser needs
it. The language does not: half the text is rendered on the server, and mission scores are
re-evaluated there. With the choice only in the browser, the page would arrive in Portuguese and
switch after hydration — the whole screen flickering between languages on every visit. Without a
cookie, `Accept-Language` applies; without anything, pt-BR.

**What is not translated, and why.**

| What | Why |
|---|---|
| Class names, teacher mission briefs, molecule nicknames | it is what a person wrote; translating it is rewriting them |
| Formula, SMILES, InChIKey, symbol, unit, `R`/`S`, `E`/`Z` | chemical notation is the same in every language; touching it is a chemistry error |
| Mission slug | identity recorded in student attempts |
| “Português” and “English” | a language's name appears in that language — whoever looks for the selector is whoever does not understand the screen |

**Numbers are text too.** 46,07 and 46.07 are the same number written in two languages, and
showing a decimal comma to someone who reads English is showing a wrong number. Every hand-written
`Intl.NumberFormat('pt-BR')` left the code: numbers and dates come from `useFormatters()` or from
`formatNumber`/`formatDate` with the language in hand. The English short date writes the month as
a word, because 09/21 and 21/09 are the same date read backward.

The tutor prompt is the exception, and a deliberate one: there, descriptors always go with a
**decimal point**, whatever the language of the answer. A decimal comma in a prompt is ambiguity,
and ambiguity in a prompt becomes a wrong number on screen — exactly what D-01 exists to prevent.
The answer's language is instructed separately.

**What was considered and left out.**

- **`next-intl` or another i18n library.** They are all good, and they all live inside Next. The
  product needs text in four packages that do not know Next — `quests` runs in Node, `editor2d`
  draws on a canvas outside React, `core` cannot depend on anyone. A hundred-line typed dictionary
  covers all four and ties nothing down; it is the same choice as the hand-written drawing editor.
- **String keys, `t('quests.title')`.** Nobody checks the key: a typo only shows up on screen, in
  production, as the key's own name. Property access is checked by the compiler for free.
- **On-the-fly translation by a language model.** It would be D-01 in reverse: the text that
  explains chemistry would come out generated, different on every visit, with nobody answerable
  for it. An error that teaches wrong is worse than an error that does not show.
- **Routes per language (`/en/turmas`).** Described above.
- **A third language now.** Every extra language is extra maintenance forever. English came in
  because it opens the product beyond Brazil without asking anything of current users; a third
  needs a reason of that size.

**Where the language is switched — revised on September 23, 2026.** The first version only had the
selector in the footer of the analysis panel, which starts closed; whoever tested it asked where
the language was switched. Now a button with a globe sits in the editor bar and in the header of
every page, with the name of the **other** language written in that language — `English` on a
Portuguese screen. That is what someone who does not understand the screen looks for.

**The documentation too — September 23, 2026.** Every reader-facing document has an English twin:
`README.en.md` next to `README.md`, and in `docs/en/` a twin for each file in `docs/`, **with an
English name** — `GUIA.md` becomes `USER-GUIDE.md`. The first version repeated the Portuguese name,
and someone who only reads English could not tell what `ROTEIROS.md` was about before opening it.
What links the two is the twin's first line, with the path and the hash of the original it
translates, and a test fails when the original changes without the English following — the same lock `rotamer-site` already used for the
published guides, brought into the repository where the document is written. The 14 guides the
site had already translated were the base; those that changed since were updated, and the missing
ones were translated. `CLAUDE.md`, `AGENTS.md`, and `.claude/` stay in Portuguese only: they are
instructions for a coding assistant, not documents for readers.

**Reconsider if.** A school asks for Spanish — and then the question is not technical but about
who maintains it: `pnpm typecheck` lists everything missing on its own, but someone has to write
and review every sentence as lesson content. Or the product gains text long enough that one file
per language becomes easier to review than the two sides next to each other.
