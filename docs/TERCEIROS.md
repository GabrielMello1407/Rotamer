# Bibliotecas de terceiros

O Rotamer é **MIT** (D-28), e quem o redistribui — a instância no ar, a imagem Docker, um fork —
carrega junto as bibliotecas abaixo. Por isso toda dependência precisa de licença **compatível com
o MIT em redistribuição**: MIT, BSD (2 e 3 cláusulas), Apache-2.0, ISC. **GPL, LGPL e AGPL não
entram** sem conversa antes: imporiam a quem redistribui o Rotamer obrigações que a nossa licença
não impõe.

As licenças abaixo foram lidas no `package.json` de cada pacote instalado, na versão travada no
`pnpm-lock.yaml`, em 11 de setembro de 2026. Este arquivo é registro de trabalho, não parecer
jurídico.

## O que vai junto com o produto

| Biblioteca | Versão | Licença | Uso | O que a licença pede |
|---|---|---|---|---|
| RDKit.js (`@rdkit/rdkit`) | 2025.3.4 | BSD-3-Clause | toda pergunta química: validação, descritores, SMILES, InChIKey, estereoquímica, desenho 2D | manter o aviso de copyright; não usar o nome do RDKit para endossar o produto |
| OpenChemLib (`openchemlib`) | 9.25.0 | BSD-3-Clause | conformação 3D e campo de força MMFF94 (D-10) | idem |
| Three.js (`three`) | — | MIT | render da cena 3D | manter o aviso de copyright |
| React Three Fiber, Drei | — | MIT | React sobre o Three.js | idem |
| React, React DOM | 19.2 | MIT | interface | idem |
| Next.js (`next`) | 16.3 | MIT | aplicação, rotas, servidor | idem |
| Zustand | 5.0 | MIT | estado do editor 2D | idem |
| Zod | 4.4 | MIT | validação de toda entrada no servidor | idem |
| Comlink | 4.4 | Apache-2.0 | conversa com o Web Worker | manter o aviso e o `NOTICE` do pacote |
| Prisma (`@prisma/client`, `@prisma/adapter-pg`) | 7.10 | Apache-2.0 | acesso ao Postgres | idem |
| `pg` | 8.23 | MIT | driver do Postgres, usado pelo Prisma e pelo script de promoção | manter o aviso |
| `bcryptjs` | 3.0 | BSD-3-Clause | senha com custo 12 | manter o aviso |
| Archivo, IBM Plex Sans, IBM Plex Mono | — | SIL Open Font License 1.1 | tipografia; baixadas na construção e servidas pela própria instância | manter a licença junto das fontes; não vender as fontes sozinhas |

Os avisos de copyright viajam dentro do `node_modules` que a imagem Docker carrega e no
repositório, no `LICENSE` de cada pacote. A página pública de molécula diz, no rodapé, que a
química é do RDKit.

## O que fica de fora da imagem

O Next.js traz o `sharp` como dependência opcional, e com ele os binários do **libvips**
(`@img/sharp-libvips-*`, licença `Apache-2.0 AND LGPL-3.0-or-later`). Servem ao otimizador de
imagem, que o produto não usa — nenhuma página usa `next/image`, e a imagem de link da página
pública sai do `next/og`. O `Dockerfile` apaga os dois da saída standalone antes de fechar a
imagem: biblioteca que nada chama não tem por que ser redistribuída, e LGPL não entra sem
conversa (D-28). Se um dia alguém usar `next/image`, esta linha volta a ser pergunta.

## Serviços de fora

Nenhum deles é dependência do pacote. Cada um é opcional, e o produto funciona inteiro sem ele.

| Serviço | O que é | Quando entra | O que sai daqui |
|---|---|---|---|
| **PubChem** (NCBI/NLM) | dados de domínio público | busca de molécula por nome; verificação de composto conhecido, no batismo | o nome digitado ou a InChIKey da estrutura — nunca quem perguntou. A resposta é guardada no banco da instância para não perguntar duas vezes |
| **Gemini** (Google) | modelo de linguagem do tutor | só com `GEMINI_API_KEY` configurada | descritores já calculados e os rótulos gerados dos objetivos — nunca nome, e-mail, nem texto escrito por professor (R-9) |
| **Umami** | telemetria, MIT, auto-hospedada por quem hospeda a instância | só com `UMAMI_SCRIPT_URL` e `UMAMI_WEBSITE_ID` | o nome do momento (`primeira-molecula`, `missao-cumprida`…), sem cookie, sem molécula, sem quem |

O PubChem tem limite de ritmo e sai do ar de vez em quando. Sem resposta, a busca por nome avisa
e o resto segue igual; o batismo continua possível, dizendo que não deu para conferir lá fora.

## Ferramentas de desenvolvimento

Não vão para o pacote entregue ao usuário, mas entram na conta de licenças do repositório.

| Ferramenta | Licença |
|---|---|
| Turborepo, pnpm | MIT |
| TypeScript | Apache-2.0 |
| ESLint, typescript-eslint, eslint-config-next | MIT |
| Vitest | MIT |
| Playwright | Apache-2.0 |
| Prisma CLI | Apache-2.0 |

## Ao adicionar uma dependência

1. Leia a licença **antes** de instalar — no `package.json` do pacote, não no site.
2. GPL, LGPL ou AGPL: pare, e leve a pergunta ao `security` com a alternativa que você achou.
3. Aceita: acrescente a linha na tabela acima **no mesmo commit**, com o que a licença pede.

Nada de química entra por dependência nova sem passar pela regra que não se quebra: se o pacote
calcula alguma coisa que o RDKit já calcula, a resposta é o RDKit.
