# syntax=docker/dockerfile:1

# A imagem do Rotamer: o app inteiro num container, para quem sobe a própria
# instância (D-28). Três estágios — o primeiro instala, o segundo constrói, o
# terceiro só carrega o que o servidor usa. Segredo nenhum entra aqui: tudo o
# que é de ambiente chega em tempo de execução, pelo `docker-compose.yml`.

FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@11.24.0

# ---------------------------------------------------------------- construção
FROM base AS build
WORKDIR /repo

# O repositório inteiro, menos o que o `.dockerignore` deixa de fora. O
# `postinstall` do app gera o cliente do Prisma e por isso o schema precisa
# estar aqui antes do `pnpm install`.
COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

# `prebuild` copia o RDKit e as tabelas do MMFF94 para `public/chem/` e gera o
# cliente do Prisma; `next build` produz a saída `standalone`, que é o servidor
# com só as dependências que ele usa. As fontes (Archivo e IBM Plex) são
# baixadas uma vez aqui e servidas pela própria instância: o produto no ar não
# fala com o Google.
RUN pnpm --filter @rotamer/web build

# ---------------------------------------------------------------- execução
FROM node:24-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# O motor de migração do Prisma é um binário que precisa da libssl.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# A linha de comando do Prisma, só para `prisma migrate deploy` na subida. Ela é
# dependência de desenvolvimento do app e não entra na saída `standalone`, então
# mora à parte e é ligada por link simbólico onde o `prisma.config.ts` a procura.
#
# A linha de comando carrega junto o que `prisma studio` e `prisma dev` usam, e
# não dá para tirar: o pacote exige esses módulos ao subir, mesmo para
# `migrate deploy`. É o maior peso da imagem, e está anotado no `DEPOIS.md`.
RUN mkdir -p /opt/prisma \
    && cd /opt/prisma \
    && npm init --yes > /dev/null \
    && npm install --omit=dev --no-package-lock --no-audit --no-fund --cache /tmp/npm-cache prisma@7.10.0 \
    && rm -rf /tmp/npm-cache \
    && node node_modules/prisma/build/index.js --version > /dev/null

WORKDIR /app

COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
COPY --from=build --chown=node:node /repo/apps/web/prisma ./apps/web/prisma
COPY --from=build --chown=node:node /repo/apps/web/prisma.config.ts ./apps/web/prisma.config.ts
COPY --from=build --chown=node:node /repo/apps/web/scripts/promote-teacher.mjs ./apps/web/scripts/promote-teacher.mjs
COPY --chown=node:node docker/entrypoint.sh ./entrypoint.sh

# A saída `standalone` guarda as dependências só no repositório do pnpm
# (`node_modules/.pnpm`); o `pg` ganha um link onde o script de promoção o
# procura.
RUN mkdir -p /app/apps/web/node_modules \
    && ln -s /opt/prisma/node_modules/prisma /app/apps/web/node_modules/prisma \
    && ln -s "$(find /app/node_modules/.pnpm -maxdepth 1 -name 'pg@*' | head -1)/node_modules/pg" /app/apps/web/node_modules/pg \
    && chmod +x /app/entrypoint.sh \
    && chown -R node:node /app/apps/web/node_modules

# É daqui que `docker compose exec app node scripts/promote-teacher.mjs …` roda.
WORKDIR /app/apps/web
USER node
EXPOSE 3000

# A página de marca não toca o banco: se ela responde, o servidor está de pé.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/marca').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/app/entrypoint.sh"]
