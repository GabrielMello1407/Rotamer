<!-- source: docs/DESIGN-SYSTEM.md · sha256:f6ba755034afa11ca4269f03ce0bc52fcae189482e548974a13a6bb058833740 -->
<p align="right"><a href="../DESIGN-SYSTEM.md">Português</a> · <strong>English</strong></p>

# Design system

> This describes what the product uses today. Color, typography, form, and motion have been
> measured and validated; anything a new screen needs that is not here goes into the tokens
> first, then into this document.

Source of truth in code: [`packages/ui/src/tokens.css`](../../packages/ui/src/tokens.css). No raw
hex values in application code.

## Color

The palette comes from the **flame test**—the color each element emits when burned. The
neutrals come from the blue cone of a Bunsen burner: grays with a blue-violet bias, never pure gray.

### Flame—pure colors

For fills, surfaces, and chart series. In this saturated form, they do not meet contrast
requirements for small text.

| Element | Token | Hex |
|---|---|---|
| Copper—turquoise (brand) | `--flame-cobre` | `#00A98F` |
| Potassium—lilac | `--flame-potassio` | `#A855C8` |
| Sodium—amber | `--flame-sodio` | `#F5A524` |
| Cesium—blue-violet | `--flame-cesio` | `#4C5FD5` |
| Strontium—scarlet | `--flame-estroncio` | `#F2542D` |
| Barium—apple green | `--flame-bario` | `#7FBF3F` |
| Lithium—carmine | `--flame-litio` | `#E01A4F` |

### Flame—text variants

Darkened until they pass 4.5:1 against the lightest surface; lightened in the dark theme.
Each measured individually.

| Token | Light | Dark |
|---|---|---|
| `--ink-cobre` | `#00806C` (4.60:1) | `#35D8BC` (10.1:1) |
| `--ink-potassio` | `#A24AC5` (4.58:1) | `#C98CE0` |
| `--ink-sodio` | `#9F6507` (4.56:1) | `#F7B84B` |
| `--ink-bario` | `#537D29` (4.57:1) | `#A0DC63` |
| `--ink-litio` | `#DE1A4E` (4.53:1) | `#FF6B85` (6.36:1) |
| `--ink-estroncio` | `#D5350D` | `#FF8256` |
| `--ink-cesio` | `#4C5FD5` (5.07:1) | `#8B99F5` |

### Neutrals—the blue cone

| Token | Light | Dark |
|---|---|---|
| `--ink-900` | `#12131A` | `#ECEDF5` |
| `--ink-700` | `#2E3140` | `#C7CAD9` |
| `--ink-500` | `#5A5D72` | `#9598AE` |
| `--ink-400` | `#6E7189` | `#7E8196` |
| `--ink-300` (decorative) | `#9A9DB2` | `#676A80` |
| `--bg` | `#F7F8FC` | `#0D0E14` |
| `--surface` | `#FFFFFF` | `#171A24` |
| `--line` | `#E2E4EF` | `#272B38` |

`--ink-300` is decorative—never for body text.

### Semantic roles

| Role | Element | Where it appears |
|---|---|---|
| Brand / action | Copper | primary button, link, selection, focus |
| Success | Barium | mission completed, valid structure, within Lipinski limits |
| Attention | Sodium | AI-generated hypothesis, approximate value, residual strain |
| Error | Lithium | exceeded valence, Lipinski violation |
| Information | Cesium | contextual note, reference |

### ⚠️ CPK belongs to the atom

CPK colors—graphite for carbon, red for oxygen, blue for nitrogen, yellow for sulfur, green
for halogens—have been chemistry's shared vocabulary for decades.

**No button, link, border, badge, or semantic state may use a CPK color.**

If the interface paints a button red, red stops meaning oxygen, and the whole screen becomes
ambiguous precisely where it must be exact. That is why the brand accent is turquoise: no
common element is turquoise in CPK. The two palettes live in separate layers and never meet.

**All 118, in two forms.** `packages/ui/src/cpk.css` contains the complete CPK/Jmol palette in
two sets:

| Token | Purpose |
|---|---|
| `--cpk-c`, `--cpk-fe`, … | the **drawn** atom: the sphere in the 3D scene |
| `--cpk-ink-c`, `--cpk-ink-fe`, … | the **written** atom: a label in the drawing, letter in the toolbar, symbol in the table |

The hydrogen sphere is white and stays white; the letter H does not—the `ink` variant takes
the same color to 4.5:1 against the theme's surface. Hue never changes with the theme, only
lightness.

**The element symbol is an atom.** The letter `O` in the toolbar and periodic table may be red:
there, it *is* oxygen, not an interface state. The button's background, border, or state must
never receive a CPK color—selection and focus are always turquoise.

### Chart series

Fixed order: copper, potassium, sodium, cesium, strontium, barium, lithium. Ordered so adjacent
series remain distinguishable with deuteranopia—the first separation is hue and luminance,
not hue alone. Above seven series, group into “other” instead of inventing an eighth color.

## Stereochemistry in the drawing

| What | How it appears |
|---|---|
| Solid wedge | filled triangle, narrow end at the stereogenic center |
| Hashed wedge | perpendicular bars that **grow** toward the back—equal widths would be a dotted line, which means something else |
| Center configuration | italic `R` or `S`, beside the atom, in the text ink color |
| Unspecified center | italic `?`, in a lighter shade—it exists, and no one specified which side |
| Double-bond geometry | italic `E` or `Z`, beside the bond, on the outside |

None of this is a stylistic choice: it is the textbook convention, and a student learning
here must recognize the same thing on the board. RDKit assigns the letters (D-21).

**There are no solid or hashed wedges in the 3D scene.** They are projection notation, and
depth is real there; a dotted line in space would mean a hydrogen bond. What carries across
is the letter `R` or `S`, beside the same atom. **Bond order does carry across**: double bonds
are two parallel sticks and triple bonds are three, like a plastic model—in the bond plane
when a neighbor defines one, and in the screen plane when the molecule is linear and there
is no chemical plane to respect.

## Workbench

The drawing screen is the page. Everything else rests along its edges:

| Where | What | Why |
|---|---|---|
| Top bar, 46 px | brand, formula, mass, status, examples, missions, analysis | the three things that must always be visible |
| Left edge, vertical | tools, elements, rings, history | a horizontal bar takes height the molecule needs |
| Bottom, centered | mass, TPSA, rotatable bonds, rings, donors/acceptors, Lipinski | the numbers that change with every stroke |
| Bottom-right corner | floating 3D scene, with vibration, volume, hydrogens, and recentering | beside the drawing, not on a distant tab |
| Side panel, closed by default | full analysis, missions, tutor, nicknames, SMILES | support, not the object itself |

Enlarging the 3D scene does **not** take over the screen: it grows to half the workbench, and
the drawing remains visible beside it—seeing the flat structure and its shape in space at
the same time is the product.

Fit to view accounts for overlays: toolbar, bars, and scene become margins, and the molecule
is centered in the free space. On mobile, everything stacks—drawing above, panel below—because
choosing a mission must not mean being unable to draw.

## Typography

- **Archivo**—display. Designed for high-performance headlines; it has the industrial weight
  of laboratory signage.
- **IBM Plex Sans**—interface. An engineering heritage, used in scientific software.
- **IBM Plex Mono**—every number and every formula.

| Role | Size | Tracking |
|---|---|---|
| display | 52px | −0.035em |
| title | 36px | −0.025em |
| section | 26px | −0.018em |
| body | 16px | 0 |
| interface | 14px | 0 |
| uppercase label | 11px | +0.13em |

**Rules:**

- Every number uses `font-variant-numeric: tabular-nums`. No exceptions.
- Display text always has negative tracking—Archivo is too widely spaced by default.
- Uppercase labels never exceed three words.
- Body text is no wider than 66 characters.
- Molecular formulas use mono with true subscripts—never `C6H6` in body text.

## Form

- **Spacing:** a scale of 4—`4 8 12 16 24 32 48 64 96`.
- **Radius:** `6` control · `10` card · `14` floating panel · `20` 3D card. Radius encodes the
  elevation hierarchy; do not use the same value everywhere.
- **Elevation:** only two levels. A small shadow for things that respond to the mouse, a
  large shadow for things that float above the screen. Anchored panels use a 1px line, not a shadow.

## Motion

| Motion | Duration | What it is |
|---|---|---|
| Control state | 120ms ease-out | hover, focus, pressed |
| Panel and drawer | 260ms ease-out | side entry, 3D card expansion |
| **Folding** | ~2000ms | actual energy-minimization frames |
| **Vibration** | continuous | molecular dynamics in the same force field |

The last two are physics, not decoration. `prefers-reduced-motion` disables both and goes
straight to the final geometry; every transition drops to 0.01 ms.

## Themes

Light and dark always ship together, in three states: an explicit choice sets `data-theme`
on the root element, while the default “system” choice sets nothing—only
`prefers-color-scheme` distinguishes them.

**No color may be defined only inside an `@media (prefers-color-scheme)` or `[data-theme]`
block.** Plain `:root` defines the complete light palette; conditional blocks only redefine
tokens. A color defined only behind a conditional does not apply in the unmarked state, and
the page renders one theme's text against the other theme's background.

## Brand

The symbol is a **Newman projection** in the staggered conformation: looking along the axis of
a single bond. The circle is the rear atom; the three spokes starting at the center are the
front atom's bonds; the three starting at the rim belong to the rear atom.

The 60° separation is not aesthetic—it is the lowest-energy conformation, the one the
molecule tends toward.

### Construction

- A 96-unit grid, centered at `48,48`. Circle radius 26; front spokes from the center to radius
  26; rear spokes from radius 26 to radius 41.
- Front angles: `−90°`, `30°`, `150°`. Rear angles: `−30°`, `90°`, `210°`.
- Stroke 5 on the grid, with rounded ends. Below 32px, increase it to 6.5 and shrink the circle
  to 24.
- Clear space equal to the circle's radius around the entire symbol.

### Color separates depth

Front in turquoise, rear and circle in the text color. **Never reverse them**—reversing makes
the rear atom look like the front one, making the drawing chemically wrong.

### What not to do

Do not rotate to the eclipsed conformation · do not paint rear spokes in the accent color ·
do not fill the circle · do not replace copper with another palette element · do not add a
rotation arrow · do not stack the wordmark below the symbol.

### Files

| File | Use |
|---|---|
| `brand/rotamer-mark.svg` | primary symbol |
| `brand/rotamer-mark-mono.svg` | single color, engraving, and complex backgrounds |
| `brand/rotamer-favicon.svg` | below 32px |

## Keyboard shortcuts

Drawing molecules means repetition: the same element, the same tool, dozens of times. Anyone
who gets past the first day leaves the toolbar behind and uses the letter.

| Key | What it does |
|---|---|
| `C` `N` `O` `S` `P` `F` `I` `H` | changes the active element |
| `L` `B` | chlorine and bromine—the first letter already belongs to carbon, and no letter was left from bromine |
| `D` `M` `V` `W` `E` | draw · move · select · solid and hashed wedges · erase |
| `0` | fits the molecule to the view |
| `Ctrl+A` | selects everything |
| `Delete` | deletes the selection, or whatever is under the cursor |
| `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` | undo and redo |
| `?` | the sheet with all these shortcuts |

Three rules that came from defects, not taste:

- **They work throughout the page**, not just when the drawing screen has focus. A mission
  says “press O,” and that used to be true only after clicking the screen—anyone coming from
  the panel typed into nothing.
- **They do not apply while typing.** In a text field, `o` is the letter o. With a modal sheet
  open, the sheet takes control.
- **An element letter never shares a key with a tool.** Fit to view used to use `F` and handle
  the key before the element map: fluorine was the only toolbar element without a shortcut.
  Fit to view moved to `0`.

The button states its key in `title`. A shortcut no one discovers is a shortcut that does
not exist.

## A box from the button, not a modal

The periodic table and shortcut sheet used to be full-screen modals: they darkened the
entire workbench to show a grid and a list. A modal is for a decision that cannot wait—choosing
silicon is an ordinary choice made while drawing, and the molecule must remain visible
while choosing.

Both became **popovers anchored to their buttons** (`Popover.tsx`): they open on the side
with room, stay inside the window, and close with Escape, an outside click, or another click
on the button. No dark backdrop, because there is nothing to block.

The right-click menu follows the same idea—it appears where the cursor is, and its periodic
table is the same grid in miniature.

## Cleaning up the drawing

The editor lets people draw however they like, as it should: a learner places the atom where
their hand takes it. The price is a crooked structure—bonds of different lengths, angles
that do not exist—and a crooked structure is harder to read than a wrong one.

**RDKit straightens it**, using its layout algorithm. We do not have our own cleanup engine:
bond length, chain angle, and ring shape are chemistry, and the same D-01 rule applies here.
What the product adds is a scale calculation—RDKit's layout uses a bond length of 1, while
the editor draws in ångström with 1.5—and that calculation multiplies everything by the same
number, so angles and configurations stay where they were.

It is in the toolbar and the empty-space menu, and enters history: `Ctrl+Z` restores the
crooked drawing.
