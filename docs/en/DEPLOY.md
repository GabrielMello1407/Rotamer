<!-- source: docs/DEPLOY.md · sha256:7d7b8ee10528449649c12ae08996f01e2ac7a18404e2b4bd53cd2bf359497e5c -->
<p align="right"><a href="../DEPLOY.md">Português</a> · <strong>English</strong></p>

# The live instance

The instance maintained by the author runs **the same image as any self-hosted instance**—the
repository's `docker-compose.yml`, on a VPS, behind Caddy with TLS. This document covers what
it adds to `INSTALLATION.md`, the baseline procedure that applies here in full.

## What already works

- **Continuous integration** in `.github/workflows/ci.yml`: every push to `main` and every
  pull request runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, action tests against a real
  Postgres, and `pnpm test:e2e` (Chromium, desktop and mobile), and builds and starts the Docker
  image against a fresh database—migration, public page with server-side RDKit, engine with
  `immutable`, promotion script. The Playwright report is uploaded as an artifact.
- **Published image** at `ghcr.io/gabrielmello1407/rotamer` on every `v*` tag
  (`.github/workflows/image.yml`):

  ```
  git tag v0.3.0
  git push --tags
  ```

  It receives the tags `0.3.0`, `0.3`, and `latest`. **GHCR packages start private**: after the
  first publication, make it public in the package settings on GitHub—otherwise,
  `docker compose pull` returns `denied` for people without an account.

## What the live instance adds

### 1. Domain

Still **not confirmed with the registrar**. See the caveat in `DECISIONS.md` D-07: no DNS record
does not mean availability at a registrar, and availability at a registrar does not mean
availability at INPI. Until there is an address, `README.md` does not promise a link.

### 2. Caddy in front, with the engine precompressed

`prebuild` writes `.br` and `.gz` files beside every file in `public/chem/`, and this determines
how an entire class's first lesson goes—**measured**, not estimated:

| File | Original | gzip | brotli |
|---|---|---|---|
| `RDKit_minimal.wasm` | 6753 KB | 1998 KB (−70%) | **1437 KB (−79%)** |
| `ocl-resources.json` | 1320 KB | 457 KB | 375 KB |
| `RDKit_minimal.js` | 125 KB | 29 KB | 26 KB |

The Next server compresses with gzip on the fly. To serve the ready-made brotli files, Caddy
needs them on the host's disk—they come from the image itself:

```
docker compose cp app:/app/apps/web/public/chem ./chem
```

And the `Caddyfile`:

```
rotamer.exemplo.br {
  encode zstd gzip

  handle_path /chem/* {
    root * /srv/rotamer/chem
    file_server {
      precompressed br gzip
    }
    header Cache-Control "public, max-age=31536000, immutable"
  }

  reverse_proxy 127.0.0.1:3000
}
```

Repeat `cp` after every update that changes the RDKit or OpenChemLib version—`prebuild` prints
both versions during the build.

`immutable` handles return visits even without a proxy: **605 ms with the engine cached,
versus 6.9 s on the first visit**. For thirty students in the same classroom, that is the
difference between starting the lesson and waiting to start.

### 3. Backup in cron, with a scheduled rehearsal

The VPS has the Postgres client installed, and the repository's scripts run from the host
against `127.0.0.1:5432`, where Compose exposes the database:

```
# once a day, at 3 a.m., in the crontab of the user running Compose
0 3 * * * DATABASE_URL='postgresql://rotamer:<senha>@127.0.0.1:5432/rotamer' BACKUP_REMOTE='usuario@outra-maquina:/backups/rotamer/' /srv/rotamer/scripts/backup-db.sh >> /var/log/rotamer-backup.log 2>&1
```

The script dumps in Postgres's custom format, **checks that the file opens**, sends a copy off
the machine, and deletes backups older than 30 days. Any failed step aborts with an error—cron
sends the email, and silence is no longer a sign of success.

**The rehearsal**, once a month and whenever the schema changes:

```
createdb -h 127.0.0.1 -U rotamer rotamer_ensaio     # once; pg_restore does not create a database
DATABASE_URL='postgresql://rotamer:<senha>@127.0.0.1:5432/rotamer' ./scripts/restore-db.sh /var/backups/rotamer/rotamer-<carimbo>.dump
```

This restores into `rotamer_ensaio`, never over production—that requires explicitly setting
`RESTORE_CONFIRMO=sim`. At the end, the script prints the three counts that show whether the
backup is worth anything: profiles, attempts, and nicknames. A backup that has never been
restored is a file, not a guarantee (D-11).

### 4. Updating

```
cd /srv/rotamer
DATABASE_URL='postgresql://rotamer:<senha>@127.0.0.1:5432/rotamer' ./scripts/backup-db.sh
git pull
docker compose pull
docker compose up -d
```

Migrations run when the container starts, before it opens its port. The order is always:
backup, new code, startup. If migration fails, the app does not start and the log explains why
(`docker compose logs app`); Postgres keeps running with the data intact.

### 5. Telemetry

Self-hosted Umami, in another Compose deployment on the same VPS, behind the same Caddy. It
exists because an observation session without measurement becomes an anecdote: you can see
one person get stuck, but cannot tell whether they are typical. Enable it with the two `.env`
variables; what is measured, and what never leaves, is described in `INSTALLATION.md`.

### 6. Teacher and administrator accounts

As on any instance: through the script, inside the container.

```
docker compose exec app node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II"
docker compose exec app node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II" --administrador
```

A teacher without a school filled in cannot issue anything—the code is only valid for someone
at the same school, and the script refuses promotion when the field is empty (D-19).

On the live instance, run the **second** command: one administrator per school. From then on,
the coordinator promotes their own teachers through the interface, without coming here—and
still cannot create another administrator, which keeps control of the instance with the
person who has the machine (D-29).

### 7. What to check when something goes down

- `docker compose ps`—the app shows `healthy` when `/marca` responds.
- `docker compose logs --tail 200 app`—migration, Next startup, route errors.
- If the screen stays on `carregando o motor` (loading the engine), the first suspect is
  `/chem/*`: the image was built without `prebuild`, or Caddy's `handle_path` points at an
  empty directory.
- WASM loads **after** the first paint, inside the worker. The 3 s target for the first
  drawing on a low-end phone over 3G depends on this remaining true.

## Costs, and what happens if they become unaffordable

A small VPS, a domain, and the Gemini key for the tutor. If they someday become unaffordable,
the instance scales down—the tutor turns off first, the instance goes away last—and the code
does not become closed (D-28). Anyone needing guaranteed availability should run their own
instance: that is why `INSTALLATION.md` exists.
