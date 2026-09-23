<!-- source: docs/ORIGEM.md · sha256:62df7a812bd19ba63a58f4aee0f29ebc0cd160db6474fe3b87943b67f8a1bcf1 -->
<p align="right"><a href="../ORIGEM.md">Português</a> · <strong>English</strong></p>

# How Rotamer began

A history document, not a specification. It exists because this project's decisions did not come
from planning — they came from mistakes discovered early. Newcomers need to know what they were,
or they will repeat them.

---

## The starting point

It did not start with a market problem. It started with a personal interest — chemistry — and a vague
desire: **to make something that created value for the community.** In that order.

The first formulation was:

> “something that encourages children to learn more about chemistry with 3D animations, about
> organic chemistry”

Nothing more. No product, no defined audience, no technology.

## First pivot: from children to scientists

The initial idea did not last long. The reformulation was:

> “a system where scientists can try to form molecules, but it has to have a whole storyline”

Two things changed here, and both stayed. The first was the audience — from children to people doing
science. The second was more important and almost went unnoticed: **“it has to have a storyline.”**
An open sandbox is a dead product. A blank screen engages nobody, neither children nor PhDs. That
intuition became the product's backbone and survived everything else.

## The tension that nearly killed the project

Serving children and scientists with the same screen pulls in opposite directions: too childish for
researchers, too dense for students. This is how educational chemistry projects die.

The way out was not to choose one audience. It was to realize that **medicinal chemistry is applied organic
chemistry** — not two products, but two depths of the same engine. What changes between a
high school student and a master's student is not the engine: it is the standard for success.

That became the track structure: Estrutura → Geometria → Propriedade → Otimização (Structure → Geometry → Property → Optimization). Students
enter through the first and do not notice when they have moved to the second. Researchers go straight to the
fourth. Same editor, same ranking, same data.

> Recorded as a decision in `DECISIONS.md` D-04.

## The construction constraint

One requirement came along and shaped the entire architecture:

> “something in 3D but without a ready-made external library to build it, at most a library that helps
> our own development, like three.js”

The rule was right, but needed a clear boundary. Where it falls:

- **Build from scratch:** the 2D canvas, 3D rendering, mission mechanics, AI layer. This is
  where the value and distinctiveness live.
- **Do not build:** SMILES parsing, valence, aromaticity, conformation, force fields.
  That is RDKit — decades of validated scientific work.

RDKit passes the criterion itself: it is not a ready-made viewer that cages the interface; it is a
kernel with no UI at all, compiled to WebAssembly. The same category as Three.js — a library that supports
development, not one that makes the product.

> The analogy that settled the discussion: you write your own game engine, but you do not
> reimplement floating-point arithmetic.

## 2D arrived last and became the center

2D was added almost as a footnote — “I think having a 2D format would be interesting
too.” It ended up being the piece that made the architecture fit together.

Nobody designs molecules by dragging atoms through three-dimensional space. Chemists have always drawn flat,
skeletal formulas. 2D is the input surface; 3D is the **consequence**.

And from that comes the product's most valuable teaching moment, for free: *“I drew it flat, and now I see
that it does not fit together in space.”* It is the hardest intuition to teach in organic chemistry, and it appears
as a side effect of the architecture.

> `DECISIONS.md` D-03.

## The prototype, and caffeine

Before any plan, a core prototype was built to resolve the technical doubt:
can this be done without a ready-made chemistry library?

It had its own 2D editor, 3D geometry from a handwritten force field, and deterministic chemical
validation. And it worked — the values matched the literature: aspirin as C₉H₈O₄ with
180.16 g/mol and TPSA 63.6; benzene converging to a regular 120° hexagon; cyclohexane settling
into a chair at 110.6°.

**And it got caffeine wrong.**

Caffeine's five-membered nitrogen-containing ring really is aromatic — it is an imidazole. The
homemade detector only recognized aromaticity in six-membered rings, so it labeled that ring as an alkene
and an imine. And the error leaked into the physics: without aromaticity detection, the ring received no
planarity constraint and moved incorrectly during vibration.

The error was **deliberately left in the prototype**, with the app itself exposing the limitation in
text. Because it is practical proof of the argument: a reasonable chemical core was written in
a few hundred lines and broke on the third molecule any chemist would test.
Tautomerism, stereochemistry, and resonance are the same trap, on a larger scale.

Caffeine settled the decision to use RDKit in production.

> `DECISIONS.md` D-02.

## The interface was cluttered

The first prototype version showed everything all the time — an instrument panel with
metrics, missions, tools, and analysis simultaneously. The assessment was direct:

> “I found it a bit cluttered; it would need a clean but intuitive structure so users can
> do whatever they want and get feedback easily”

The criticism was right. Rebuilding changed the mental model: from an instrument panel to a
**workspace**. The drawing canvas fills the screen, tools float in a discreet
toolbar, five essential metrics sit in a compact strip, and everything else lives in a drawer on demand.

The reference became Figma and Excalidraw, not Bloomberg Terminal.

> `DECISIONS.md` D-05.

## The animation was already ready, and nobody had noticed

The request was: “in the 3D model, I think it would be interesting to animate molecules
behaving as they should.”

The engine already had everything needed, for free:

**Folding** — energy minimization produces a trajectory. All it took was recording the frames and
playing them. The molecule starts tangled and folds until it finds its shape. This is not decorative
interpolation: these are the optimizer's real steps.

**Vibration** — the same force field, now integrated over time. Molecular dynamics with a
thermostat.

And the measured result was chemically correct:

| | Dihedral variation | Behavior |
|---|---|---|
| Ethane (single bond) | 23° → 77° | Rotates freely ✓ |
| Ethene (double bond) | 0° → 3° | Rigid ✓ |
| Benzene | Bonds ±4% | Shakes without leaving the plane ✓ |

In other words: the animation **demonstrates the rule** instead of illustrating it. Students see a single bond
rotating next to a double bond that refuses to. No textbook does that.

This became the product's signature moment — and, months later, its name.

## The name took six attempts

Five names were chosen, celebrated, and discarded because of collisions: **Kekulé**, **Bunsen**,
**Ylide**, **Anomer**, **Moiety**, and **Kovalent**.

Kovalent hurt most because the initial check said “available” — and was wrong. The search
returned naming blogs instead of companies, and DNS was never checked. Redoing it
properly revealed **Grupo Kovalent**: a Brazilian company in Niterói selling reagents for
clinical testing. Same country, same language, adjacent field.

**The lesson became a process:** DNS first (cheap and decisive), then company search, then
INPI. In that order.

**Rotamer** came from the very physics the product demonstrates. A rotamer is an isomer that exists
because of rotation around a single bond — exactly what the vibration shows. In
Portuguese it is *rotâmero*, recognizable without translation. And “rotatable bonds” was already one of the
five permanent metrics on screen since the prototype.

The symbol came with it: a staggered **Newman projection**, the drawing every organic
chemistry student learns precisely to visualize conformation.

> Full history in `DECISIONS.md` D-07.

## The commercial turn — and the return

The original recommendation was AGPL-3.0 with the trademark reserved — opening the code served the community,
the portfolio, and possible formalization as university outreach.

The decision was different: **a closed-source product, for sale.** Legitimate and technically viable — RDKit
is BSD-3 and Three.js is MIT, both allowing commercial use in proprietary products — and it was
recorded in `DECISIONS.md` D-08, with three open points: no GPL dependencies, the community
campaign model to rethink, and the relationship with UENP to verify.

It lasted until the product stood on its own. With the editor, missions, classes, and assignment lists ready and
tested, “who do we sell this to?” had no answer worth more than the
answer to “who does this help?” On September 11, 2026, the decision was undone in writing:
Rotamer is **open-source, under the MIT license, and will not be commercialized** — a live instance is
maintained by the author, and any school can run its own with Docker (`DECISIONS.md` D-28).

What the return taught: the closed-source license had a daily cost nobody added up. Every document
spoke of customers, buyers, and paid tiers; the GPL prohibition existed to protect a business that did not
exist; the research track was held back by commercial tension. Opening the code was less
a new decision than the removal of one that was no longer true.

## The audience only became clear at the end

Throughout nearly all development, the product was described as “for scientists” — a legacy of the
first pivot. Documents were written with that premise until someone asked the obvious question:

> “why do we need missions if this is for scientists? that makes no sense”

The criticism was right and revealed a contradiction written in the repository itself: the
history said “scientists,” while the pitch described students failing organic chemistry and listed
schools and exam preparation centers as buyers.

The resolution reversed the hierarchy: **the product is for teaching, and researchers are advanced users.**
Missions remain the heart — not because gamification is good, but because a blank screen is a
dead product and students do not arrive with a molecule in mind. Researchers do, which is why
their answer is to paste a SMILES, not complete a task.

And a rule remained that matters more than the decision: **education is no license for imprecision.** A chemistry
teacher is a chemist. In a teaching app, an error does not confuse one user — it confuses a classroom.

> `DECISIONS.md` D-09.

---

## The thread running through it all

Looking back, none of the good decisions came from planning. They all came from discovering a
mistake early enough:

- The student/scientist tension appeared before becoming two codebases.
- Caffeine broke before a user existed to see it break.
- The cluttered interface was criticized while it was still a prototype.
- The name collided before the domain was bought and the trademark filed.
- The wrong audience was pointed out before Phase 2 was built around it.

The final product will differ from what these documents describe. What needs to
survive is not the conclusions — it is the habit of discovering mistakes while they are still cheap.
