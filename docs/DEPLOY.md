# Deploy

Alvo: **VPS com PM2**, servindo o Next em modo `standalone` atrás de um proxy. O que já está
pronto no repositório e o que ainda depende de servidor, domínio e certificado.

## Já funciona

- **Integração contínua** em `.github/workflows/ci.yml`: a cada push e a cada pull request roda
  `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm test:e2e` (Chromium, perfis desktop e
  celular). O relatório do Playwright sobe como artefato.
- **Build de produção**: `pnpm --filter @rotamer/web build`. O passo `prebuild` copia o RDKit
  compilado e as tabelas do MMFF94 de `node_modules` para `apps/web/public/chem/`, então os
  arquivos servidos são sempre da versão travada no `pnpm-lock.yaml`.

## Falta — precisa de servidor

### 1. Build para o servidor

Antes do primeiro deploy, ligar a saída `standalone` no `apps/web/next.config.ts`
(`output: 'standalone'`): ela empacota o servidor com só as dependências que ele usa, o que
importa num monorepo pnpm, onde `node_modules` é uma teia de links simbólicos.

Sequência no servidor:

```
pnpm install --frozen-lockfile
pnpm --filter @rotamer/web build
```

### 2. PM2

O processo é o servidor do Next, não `next start` via pnpm — PM2 precisa enxergar o Node
diretamente para reiniciar e coletar log direito.

```js
// ecosystem.config.cjs — a escrever quando o servidor existir
module.exports = {
  apps: [
    {
      name: 'rotamer',
      script: 'apps/web/.next/standalone/apps/web/server.js',
      instances: 'max',        // uma por núcleo; o app é stateless
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 3000, HOSTNAME: '127.0.0.1' },
    },
  ],
};
```

Cuidados do modo `standalone`: `public/` e `.next/static/` **não** entram no pacote e precisam ser
copiados para dentro de `.next/standalone/apps/web/` depois do build. É lá que mora o
`public/chem/` — sem ele, o worker sobe e o motor de química não carrega.

`pm2 startup` e `pm2 save` para o app voltar sozinho depois de reiniciar a máquina.

### 3. Proxy e certificado

Nginx ou Caddy na frente, com TLS. Dois pontos que valem atenção:

- **O `.wasm` tem quase 7 MB.** Servir com `Content-Type: application/wasm` e cache longo
  (`immutable`), senão cada visita paga o download de novo.
- **Compressão**: o `.js` do RDKit e o `ocl-resources.json` comprimem muito bem; o `.wasm` já vem
  compacto e não precisa de gzip.

### 4. Domínio

`rotamer.app`, `rotamer.dev` ou `rotamer.org` — ainda **não confirmados no registrador**. Ver a
ressalva em `DECISOES.md` D-07: DNS sem registro não é o mesmo que disponível no registrador, e
disponível no registrador não é o mesmo que livre no INPI. Confirme os dois antes de comprar.

### 5. Banco

Postgres na própria máquina, sem serviço gerenciado (D-11). Em desenvolvimento sobe pelo
`docker-compose.yml` da raiz:

```
docker compose up -d
cp apps/web/.env.example apps/web/.env    # e preencha SESSION_SECRET
pnpm --filter @rotamer/web exec prisma migrate dev
```

No servidor, a migração roda **antes** de o PM2 recarregar o processo:

```
pnpm --filter @rotamer/web exec prisma migrate deploy
pm2 reload rotamer
```

O que passa a ser nosso, e precisa de rotina antes do primeiro aluno:

- **Backup.** `pg_dump` diário com retenção, guardado fora da máquina. Banco sem backup testado
  é banco sem backup.
- **Atualização de versão maior.** Postgres não sobe de major sozinho; agende.
- **Acesso.** O banco escuta em `localhost`; nada de expor a 5432 na internet.

### 6. Variáveis de ambiente

Todas em `apps/web/.env.example`, que é o arquivo que documenta o que existe. No servidor elas
ficam no ambiente do PM2, num arquivo fora do repositório:

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | conexão do Postgres |
| `SESSION_SECRET` | assina o cookie de sessão — um por ambiente, gerado com `randomBytes(32)` |
| `GEMINI_API_KEY` | tutor. Sem ela, o tutor não aparece; o resto do produto funciona igual |
| `TUTOR_DAILY_LIMIT` | teto de pedidos por usuário por dia |

## Cuidados

- **`apps/web/public/chem/` não é versionado.** É gerado no build. Se a tela ficar em "carregando
  o RDKit" para sempre, o primeiro suspeito é o `prebuild` não ter rodado no servidor.
- **O WASM carrega depois da primeira pintura**, dentro do worker. A meta de 3 s para o primeiro
  desenho num celular fraco em 3G depende de isso continuar assim.
