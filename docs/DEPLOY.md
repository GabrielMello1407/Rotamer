# Deploy

O que já está pronto no repositório e o que ainda depende de conta, cartão e registrador.

## Já funciona

- **Integração contínua** em `.github/workflows/ci.yml`: a cada push e a cada pull request roda
  `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm test:e2e` (Chromium, perfis desktop e
  celular). O relatório do Playwright sobe como artefato.
- **Build de produção** do app: `pnpm --filter @rotamer/web build`. O passo `prebuild` copia o
  RDKit compilado de `node_modules` para `apps/web/public/rdkit/`, então o `.js` e o `.wasm`
  servidos são sempre da versão que está no `pnpm-lock.yaml`.

## Falta — precisa de você

### 1. Vercel

O projeto é um monorepo pnpm com Turborepo. Na criação do projeto na Vercel:

| Campo | Valor |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Install Command | `pnpm install --frozen-lockfile` (padrão) |
| Build Command | `pnpm build` (padrão — já dispara o `prebuild`) |
| Node.js Version | 24.x |

Marque **Include files outside the Root Directory** — o app importa `packages/core` e
`packages/ui` do próprio repositório.

Deploy de produção sai de `main`; cada pull request ganha uma URL de pré-visualização.

### 2. Domínio

`rotamer.app`, `rotamer.dev` ou `rotamer.org` — ainda **não confirmados no registrador**. Ver a
ressalva em `DECISOES.md` D-07: DNS sem registro não é o mesmo que disponível no registrador, e
disponível no registrador não é o mesmo que livre no INPI. Confirme os dois antes de comprar.

Depois de comprado, apontar na Vercel em *Settings → Domains*.

### 3. Variáveis de ambiente

Nenhuma até aqui. A Fase 2 traz a chave do Gemini e a conexão do Postgres — quando isso chegar,
elas entram como *Environment Variables* na Vercel e nunca no repositório.

## Cuidados

- **`apps/web/public/rdkit/` não é versionado.** Ele é gerado no build. Se algum dia o build
  quebrar com "RDKit não expôs initRDKitModule", é sinal de que o `prebuild` não rodou.
- **O `.wasm` tem quase 7 MB** e é servido como arquivo estático, com cache longo. Ele carrega
  depois da primeira pintura, dentro do worker — a meta de 3 s para o primeiro desenho num
  celular fraco em 3G depende disso continuar assim.
