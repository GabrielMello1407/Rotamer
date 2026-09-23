<!-- source: docs/TERCEIROS.md · sha256:6a3121f1f66af48e2a6ee1912d0594a6484a66728bb7578b8262759117a93da2 -->
<p align="right"><a href="../TERCEIROS.md">Português</a> · <strong>English</strong></p>

# Third-party libraries

Rotamer is **MIT** (D-28), and anyone redistributing it—the live instance, the Docker image, a
fork—also ships the libraries below. Every dependency therefore needs a license **compatible
with MIT redistribution**: MIT, BSD (2- and 3-clause), Apache-2.0, ISC. **GPL, LGPL, and AGPL
are not accepted** without prior discussion: they would impose obligations on Rotamer's
redistributors that our license does not impose.

The licenses below were read from each installed package's `package.json`, at the version
locked in `pnpm-lock.yaml`, on September 11, 2026. This file is a working record, not a legal
opinion.

## What ships with the product

| Library | Version | License | Use | What the license requires |
|---|---|---|---|---|
| RDKit.js (`@rdkit/rdkit`) | 2025.3.4 | BSD-3-Clause | every chemistry question: validation, descriptors, SMILES, InChIKey, stereochemistry, 2D depiction | retain the copyright notice; do not use the RDKit name to endorse the product |
| OpenChemLib (`openchemlib`) | 9.25.0 | BSD-3-Clause | 3D conformation and the MMFF94 force field (D-10) | same as above |
| Three.js (`three`) | — | MIT | 3D scene rendering | retain the copyright notice |
| React Three Fiber, Drei | — | MIT | React over Three.js | same as above |
| React, React DOM | 19.2 | MIT | interface | same as above |
| Next.js (`next`) | 16.3 | MIT | application, routes, server | same as above |
| Zustand | 5.0 | MIT | 2D editor state | same as above |
| Zod | 4.4 | MIT | validation of every server input | same as above |
| Comlink | 4.4 | Apache-2.0 | communication with the Web Worker | retain the notice and the package's `NOTICE` |
| Prisma (`@prisma/client`, `@prisma/adapter-pg`) | 7.10 | Apache-2.0 | Postgres access | same as above |
| `pg` | 8.23 | MIT | Postgres driver, used by Prisma and the promotion script | retain the notice |
| `bcryptjs` | 3.0 | BSD-3-Clause | passwords with cost 12 | retain the notice |
| Archivo, IBM Plex Sans, IBM Plex Mono | — | SIL Open Font License 1.1 | typography; downloaded during the build and served by the instance itself | retain the license alongside the fonts; do not sell the fonts on their own |

Copyright notices travel inside the `node_modules` included in the Docker image and in the
repository, in each package's `LICENSE`. The public molecule page states in its footer that
the chemistry comes from RDKit.

## What stays out of the image

Next.js includes `sharp` as an optional dependency, bringing the **libvips** binaries
(`@img/sharp-libvips-*`, licensed `Apache-2.0 AND LGPL-3.0-or-later`). They serve the image
optimizer, which the product does not use—no page uses `next/image`, and the public page's
link-preview image comes from `next/og`. The `Dockerfile` removes both from the standalone
output before finishing the image: there is no reason to redistribute a library nothing
calls, and LGPL requires prior discussion (D-28). If someone uses `next/image` someday, this
line becomes a question again.

## External services

None is a package dependency. Each is optional, and the product works in full without it.

| Service | What it is | When it is used | What leaves here |
|---|---|---|---|
| **PubChem** (NCBI/NLM) | public-domain data | molecule search by name; known-compound checks when giving a nickname | the entered name or the structure's InChIKey—never who asked. The response is stored in the instance database to avoid asking twice |
| **Gemini** (Google) | the tutor's language model | only with `GEMINI_API_KEY` configured | already calculated descriptors and generated goal labels—never names, emails, or teacher-written text (R-9) |
| **Umami** | MIT telemetry, self-hosted by the instance operator | only with `UMAMI_SCRIPT_URL` and `UMAMI_WEBSITE_ID` | the event name (`primeira-molecula`, `missao-cumprida`…), without cookies, molecules, or user identity |

PubChem has rate limits and occasionally goes down. Without a response, name search displays
a notice and everything else continues as before; giving a nickname remains possible, with
a message that the external check could not be completed.

## Development tools

These are not part of the package delivered to users, but count toward the repository's
license inventory.

| Tool | License |
|---|---|
| Turborepo, pnpm | MIT |
| TypeScript | Apache-2.0 |
| ESLint, typescript-eslint, eslint-config-next | MIT |
| Vitest | MIT |
| Playwright | Apache-2.0 |
| Prisma CLI | Apache-2.0 |

## When adding a dependency

1. Read the license **before** installing—from the package's `package.json`, not its website.
2. GPL, LGPL, or AGPL: stop and take the question to `security`, along with the alternative
   you found.
3. If accepted: add a row to the table above **in the same commit**, stating the license requirements.

No chemistry enters through a new dependency without passing the unbreakable rule: if the
package calculates something RDKit already calculates, the answer is RDKit.
