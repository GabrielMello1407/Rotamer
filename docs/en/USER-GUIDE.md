<!-- source: docs/GUIA.md · sha256:6ca5ddc49a06902a28171b175c35dbbadb86d320221e70bd136419fb9db7c7d8 -->
<p align="right"><a href="../GUIA.md">Português</a> · <strong>English</strong></p>

# User guide

How to use Rotamer, screen by screen—for learners and teachers. Quoted labels are the ones shown
on screen, in English.

The editor opens **without registration**: visit the address and start drawing. An account is
only needed to save progress and molecules, join a class, and give a structure a nickname.

**The product speaks Portuguese and English.** With no saved choice, the browser's language
applies; failing that, Brazilian Portuguese. **To switch, use the globe button** in the editor's
top bar, or in the corner of the header on any other page: it shows the name of the other
language—`English` on a screen in Portuguese, `Português` on a screen in English. The selector with
both options side by side is also at the foot of the `Analysis` panel, next to the theme selector,
and on the `/marca` page. The choice applies to the whole instance and survives a reload. Numbers
follow it: 46,07 in Portuguese, 46.07 in English. What does **not** change language is what a
person wrote—class names, molecule nicknames, a teacher's mission brief—nor chemical notation:
formula, SMILES, InChIKey, symbols, units, `R`/`S`. Addresses do not change either: `/turmas` is
`/turmas` in both languages.

---

## 1. The workbench

The drawing screen fills the page; everything else sits around its edges.

| Where | What |
|---|---|
| Top bar | the brand, the **formula and mass** of the drawing, its status (`valid`, `impossible structure`, `loading the engine`), `Save`, `Examples`, `Missions`, `Analysis`, the language button (`Português`), and `Sign in` or your name |
| Vertical toolbar on the left | tools, elements, ready-made rings, tidy, undo and redo, fit to view, new molecule, shortcuts |
| Bottom bar | five values that change with every stroke—mass, TPSA, rotatable bonds, rings, donors/acceptors—and the rule of five |
| Bottom-right corner | the **3D scene**, which folds and vibrates |
| Side panel | closed by default: `Analysis` (everything RDKit calculated) and `Missions` (the storyline and the tutor) |

On mobile, everything stacks: drawing above, panel below. Nothing requires a mouse.

## 2. Drawing

- **Click an empty area** to place an atom of the active element (carbon, initially). A single
  carbon is already methane: hydrogens are implicit.
- **Drag from an atom** to create another atom already bonded to it. The angle snaps to 30°,
  and the chain comes out in a zigzag, just like on the board.
- **Click a bond** to cycle its order: single, double, triple, single.
- **Active element:** the `C` `N` `O` `S` toolbar buttons, or `···` for the entire periodic
  table. With an element selected, click an atom to replace it or an empty area to place a new one.
- **Ready-made rings:** benzene, cyclohexane, cyclopentane, and pyridine, in one click.
- **Tidy the drawing:** RDKit recalculates positions—equal bond lengths, correct angles, regular
  rings. `Ctrl+Z` restores the previous drawing. If there were wedges, a banner at the top
  explains what happened to them (§ 5).
- **Undo and redo:** `Ctrl+Z` and `Ctrl+Shift+Z` (or `Ctrl+Y`), with no limit within the session.
- **New molecule:** clears the screen; `Ctrl+Z` brings it back.

**Tools** (shortcut in parentheses):

| Tool | What it does |
|---|---|
| Draw (`D`) | the normal mode, described above |
| Move (`M`) | drags an atom without creating anything; dragging an empty area pans the view |
| Select (`V`) | a rectangle selects several atoms; **double-click** selects the entire fragment; dragging from inside moves the block; `Delete` erases everything at once; `Ctrl+A` selects all; `Esc` drops the selection |
| Stereochemistry (`W`) | click a bond to add a bold wedge; click again for a dash; again to remove it. The narrow end belongs at the stereocenter |
| Erase (`E`) | click an atom or bond |

**Shortcuts** work throughout the page, except while you type in a text field. `?` opens the
sheet listing them all. Elements: `C` `N` `O` `S` `P` `F` `I` `H`, plus `L` for chlorine and
`B` for bromine. `0` fits the molecule to the view.

**Right-click menu** (on mobile, **long press**): on an atom, change its element with the
miniature periodic table, set formal charge, erase; on a bond, choose its order directly and its
stereochemistry (bold wedge, dash, flip the narrow end); on empty space, tidy, fit to view, undo,
clear; with a selection, change every element or bond order at once, drop the selection, erase.

**On mobile:** use two fingers to zoom in and out; double-tap selects the fragment; long press
opens the menu.

## 3. Reading the screen

**The top bar** shows the formula and mass as soon as the structure closes, plus its status:

- `valid`—RDKit accepted it.
- `impossible structure`—and the bottom bar explains why, in the reader's language: *"The C atom
  has 5 bonds, but it supports at most 4."* A dashed circle marks the problem atom.
  `See what to do` opens the panel with the explanation and the fix.
- `loading the engine`—RDKit is still starting up (once per visit; then it stays cached).

**The bottom bar:** mass (g/mol), TPSA (Å²), rotatable bonds, rings (including how many are
aromatic), hydrogen-bond donors/acceptors, and whether the molecule falls within Lipinski's
**rule of five**. Everything is calculated by RDKit, with every stroke.

**Where RDKit differs from another table, the screen shows RDKit's value and identifies whose
definition it uses.** Caffeine has TPSA 61.82 (PubChem publishes 58.44—the difference is
aromaticity perception); aspirin has 2 rotatable bonds under the strict definition (PubChem
counts 3).

## 4. The `Analysis` panel

- **SMILES or name.** Paste a SMILES (`CC(=O)Oc1ccccc1C(=O)O`) and choose `Load`. Anything RDKit
  cannot read as a structure becomes a PubChem name search: `caffeine`, `aspirin`. If PubChem
  does not respond, the screen tells you—pasting SMILES still works.
- **Examples** (in the top bar): ethanol, acetic acid, benzene, paracetamol, aspirin, caffeine.
- Recognized **functional groups**, named in the reader's language: ester, carboxylic acid,
  amide… RDKit does the recognizing, by matching SMARTS; the language only changes the word.
- **Identity:** heavy atoms, heteroatoms, rings, rotatable bonds, donors/acceptors, TPSA, logP,
  molar refractivity, sp³ fraction, stereocenters (and how many are unspecified), exact mass,
  InChIKey, SMILES.
- **Normal modes:** `3N − 6` modes (`3N − 5` for a linear molecule), each with its wavenumber in
  cm⁻¹ and whether it is stretching or bending. **Click a mode and the scene shows only that
  mode.** Frequencies come from the MMFF94 force field, calculated on the spot—they are not
  measured spectra, and the screen explains that classical force fields tend to overestimate
  stretching by 5% to 10%. A mode with a negative number is an imaginary frequency, and the
  screen explains what that means.
- **Rule of five:** four bars—mass, logP, donors, and acceptors—against the published limits.
  This is not a prediction of activity: it describes where the molecule stands against four
  limits.
- **Take it away:** `SVG` (RDKit's drawing), `PNG` (the screen as it is), `Share` (copies the
  public-page link, § 8).
- **Theme:** `System`, `Light`, or `Dark`.

Panel footer: *"Computed by RDKit… No number on this screen goes through a language model."*

## 5. Stereochemistry

With the `W` tool, click a bond: bold wedge; again, dash; again, none. RDKit assigns **R** or
**S** by reading the wedges—the letter appears next to the atom in both the drawing and the
scene. A center without a wedge appears with `?`, and under Identity as "unspecified". Double
bonds receive **E** or **Z**.

When you **tidy a drawing** that has wedges, the top banner explains what happened to each one:
a wedge that did not define any configuration (the atom was not a stereocenter) disappears, and
the banner says why; a wedge at a true center may become a dash when the atom moves to the other
side of the paper—the same configuration, so the letter stays the same.

Wedges and dashes survive SMILES (`F[C@H](Cl)Br`) and the public page.

## 6. The 3D scene

As soon as the structure closes, the molecule **starts tangled and folds** into its
lowest-energy shape—these are actual minimization frames from the MMFF94 force field—and then
**vibrates**, through molecular dynamics at 300 K. A single bond rotates; a double bond does not.

Controls: rotate with the mouse or a finger; show or hide hydrogens; show the volume; recenter;
expand (the scene grows to half the workbench while the drawing stays beside it). Touching an
atom in the drawing lights it up in the scene, and vice versa. Double and triple bonds appear as
parallel sticks.

For an element MMFF94 does not parameterize (the panel identifies it), the shape still appears,
assembled from bond lengths and angles—what is unavailable is energy, and without energy there
is no vibration and there are no normal modes.

With "reduce motion" enabled in the system, folding and vibration are switched off and the final
geometry appears immediately.

## 7. Missions

Open `Missions` in the top bar. The `Choose a mission` selector lists the catalog by
track—**Structure**, **Geometry**, **Property**—plus `No mission — free tool`, the mode with no
storyline: *"Draw whatever you like. The descriptors still come from RDKit at every stroke."*

Each mission has a brief, **goals** ticked off as you meet them, and a score from 0 to 100,
proportional to the goals met. The verdict comes from the mission engine comparing the numbers
RDKit calculated—never from a language model. `See a hint` shows one hint at a time; hints are
handwritten and only appear when requested.

When all goals are met, `completed` appears. With an account, progress is saved—*"Progress
saved. Score checked on the server: 100 out of 100."*—and the mission gains a `✓` in the
selector. Without an account, the screen invites you to `Sign in to your account` to keep what
you have completed.

**The tutor** lives in the same panel, with three questions: `What next?`, `Why didn’t it work?`,
`What is this?`. It only accepts a question once there is a valid molecule. The answer is marked
in amber and carries the sentence *"Text generated by a language model from the computed
numbers. It is a hypothesis, not a measurement."*—the numbers that appear in the text are the
ones RDKit calculated, inserted by the interface. The tutor answers in the language of the
screen. On an instance without a Gemini key, it says it is switched off and sends you back to the
handwritten hints. There is a daily limit on questions.

## 8. A molecule's public page

`Share` copies a `/m/<smiles>` link that opens anywhere, without an account or JavaScript:
formula, mass, descriptors, groups, RDKit's drawing, and the nickname (§ 10), if there is one.
Pasted into a WhatsApp group, the link comes with an image and a title. `Open this molecule in the
editor →` brings the drawing back.

## 9. Account and shelf

`Sign in`, in the top bar, leads to `/entrar`: **sign in** with e-mail and password, or **sign
up** with what we should call you, e-mail, password (8 characters or more), and school or
institution—optional, but it is what lets you follow the class later. Signing up takes you
straight back to the workbench, already signed in.

What the account keeps: your mission progress and the molecules you saved. **`Sign out` clears
the screen and the draft**: the lab computer is shared, and the next person to sit down will not
find your molecule.

**`Save`**, in the top bar, puts the structure in `My molecules`. Saving the same structure
twice still leaves just one row. Each row shows formula, mass, and date; opens in the editor;
and has `Public page` and `Remove from the shelf` (with confirmation in the row itself). What is
saved is the graph: formula, mass, and descriptors are recalculated whenever the molecule opens.

Without an account, the draft stays in the browser and comes back when you reopen it—and a link
with a molecule in it takes precedence over the draft.

## 10. Giving a structure a nickname

In the `Analysis` panel, a structure no one has named can receive a **nickname** from the person
who drew it: `Give it a nickname` → `Name it`. The nickname belongs to the structure, applies to
everyone on this instance, and **never appears without the name of whoever gave it**—*"Ana's
molecule · named by Teacher Ana"*—in the panel, on the public page, and on the shelf. Naming a
structure also saves it in `My molecules`.

What naming **is not**: nomenclature. *"A nickname is authorship, not nomenclature. Rotamer
chose not to name compounds: naming them is a decision about structure, and this product does
not make it."* That is why the screen rejects a nickname that passes itself off as a systematic
name (`butanol`) or as a formula (`C9H8O4`), and explains why.

Before offering a nickname, the product asks PubChem whether the compound already exists out
there. A known compound cannot be nicknamed: the screen shows the name PubChem records and the
CID. If PubChem does not respond, naming remains possible, and the screen says the check could
not be made.

## 11. Classes—for students

`Classes` is at the top of the screen, next to your name. Type the **six-character code** the
teacher wrote on the board and choose `Join the class`. Until you are in a class, the missions
panel says so and offers the `Join a class` link. There is no e-mail invitation. *"Your teacher
sees which missions you have completed and where you left off. What you draw outside the
missions is yours, and nobody else sees it."*

After that, the `Missions` panel gains the **`FROM YOUR CLASS`** section above the catalog: the
assignment the teacher published, in their order, with `0 of 5 completed`. Any item opens in any
order—nothing is locked. A mission written by the teacher carries `mission from your teacher`
and its authorship. Completing one shows `Completed. 2 left in the assignment.` and `Next: … →`;
the last one shows `Completed. You finished the assignment «…».`

The **Catalog** (`/catalogo`, in the account menu) lists everything there is to do—the product's
missions and those teachers have published—with search by name, track, or functional group
(`«ester», «ring»…`). A teacher's mission appears signed (`mission by Teacher Ana · EE Dom Pedro
II`) and has `Report`, with a one-line reason.

**Forgot your password?** At `/entrar`, `Reset it with your teacher’s code` leads to `/senha`:
the account e-mail, the eight-character code the teacher handed you, and a new password. The
code lasts one day and works once; changing the password ends the old sessions.

## 12. Classes—for teachers

**Becoming a teacher.** No one declares themselves a teacher: anyone who can issue a password
reset code can get into a student's account. Create an account with the school filled in and ask
for promotion using its e-mail—from **whoever administers Rotamer at your school**, who promotes
through the screen, or from whoever installed the instance, who promotes with a command on the
server (`docs/en/INSTALLATION.md`, "The first administrator"). The screen itself explains this:
under `Classes`, anyone who is not yet a teacher reads **"Do you teach, and want to open a
class?"** with the way forward. After promotion, `Classes you teach` appears on the next page
you open—no need to sign out and back in.

**Promoting the school's teachers.** If your account is an **administrator**, `Classes` has the
**`Teachers at this school`** section: who teaches, with name, e-mail, who granted the role and
when, plus an e-mail field. `Check` shows **the name** of the person with that e-mail, and only
then does `Promote to teacher` appear—that step catches typos, because promoting the wrong
account gives someone the power to issue a student's password reset code.

An administrator promotes **only as far as teacher**, and **only accounts from the same school,
already filled in on both sides**. Another administrator comes only from the terminal, from
whoever looks after the installation: that is what ensures no one loses control of the instance
through a compromised account. The screen never writes anyone's school—an account created
without that field is promoted from the terminal, with `--escola`. An account at another school
gets the same rejection as an e-mail that does not exist: the screen cannot be used to discover
who has a Rotamer account.

**Demoting.** Next to each teacher, `Demote` returns the account to student. What it loses:
opening classes, building assignments, seeing the class board, and issuing password codes; and
the missions it published **leave the catalog**. What stays saved: the classes and assignments,
which come back in full if the account is promoted again. An account that has ever taught can
only recover its password through the terminal from then on, even after demotion—otherwise,
demotion would be the first step toward getting into a teacher's account.

**Opening the class.** At `/turmas`, `Classes you teach` → class name (`Year 12A — morning`) →
`Open class`. The response carries the **code**: *"Class "Year 12A — morning" is open. The code
is K7M2QX."* Write it on the board. The list shows how many students have joined.

**The class board** (click its name): the summary (*"12 students, out of 15 missions in the
catalog."*), the **class's assignments**, a board for each published assignment, **`Where the
class got stuck`**—the missions where the most people tried without completing them, which is
where the next lesson comes from—and **`Student by student`**: who, completed, stuck on, last
seen. *"Getting stuck means having tried and not completed the mission—anyone who never opened
it is not counted here."* No student molecule appears on this screen.

**Building an assignment.** `New assignment` → name (`Oxygen-containing groups — year 12`).
Inside the assignment:

- `Pick from the catalog`: tick missions, by track, and `Add (n)`.
- `Create a mission by drawing`: the workbench opens with `Creating a mission · <assignment>`
  and the **`Authoring`** tab. Draw the **answer**; the panel shows its formula with the
  `computed` badge and the **goals you can ask for**, extracted from the molecule—the formula,
  the exact molecule, each functional group, each atom count, and each descriptor count. Tick
  the ones you want to ask for. Write the `Mission title`, the `Brief` (*"Talk chemistry, not
  interface"*; no links; no student names), and up to three `Hints`, one at a time.
  `Save mission` puts the mission in the assignment: *"«The everyday alcohol» joined the
  assignment, at position 2."*

  Ticking `is exactly this molecule` switches the other goals off—*"The score becomes 0 or 100
  and a close isomer is worth nothing. To accept more than one right answer, ask for groups and
  counts instead of this one."* There is no way to write a goal: *"what the student has to meet
  is always what RDKit measured here"*. A mission its own answer does not complete is rejected,
  naming the goal. The answer is stored inside the mission, and **the student never receives
  it**.
- Order: `Move up`, `Move down`, `Remove` (with `Undo` for a few seconds).
- `Publish to the class`: from then on the class sees the assignment, and **the goals of your
  missions are locked**—changing a goal would change the score of anyone who has already tried.
  Title, brief, and hints stay editable.
- `Publish to the catalog` / `Withdraw from the catalog`, mission by mission: once published,
  any account on the instance finds it through search, with your name and school. Requires the
  school to be filled in. Withdrawing ends access through the catalog; students who arrive
  through their own class's assignment keep it.
- `Archive assignment` takes the assignment off both screens without deleting anything;
  `Unarchive` brings it back.

**The assignment board:** one row per student, one column per item, with `✓ completed · • stuck
(opened, not completed) · – not opened`, `completed` (`3 / 5`), and `last seen`. Above it,
`WHERE THE CLASS GOT STUCK ON THIS ASSIGNMENT`.

**Password codes.** The `Password reset codes` link sits in two places you already visit: the
`Classes you teach` section under `Classes`, and the top of each class page. Inside: the e-mail
of the person who lost their password → `Issue code`. The code appears **once**—write it down
and hand it over in person. It lasts one day, works once, and only for someone at the same
school as you. Issuing another invalidates the previous one.

## 13. What Rotamer does not do

- It does not predict reaction products or propose synthesis routes.
- It does not claim biological activity. Descriptors are descriptors.
- It does not calculate IUPAC names. It lets people give nicknames, which is something else.
- It does not replace PyMOL, ChemDraw, or Maestro.
- Frequencies come from the force field, not measured spectra—and the screen says so.
