<!-- source: docs/INSTALACAO.md · sha256:572f26ebdd1e35aaba522f8498e6a2472d201fc45927be192b77d9247b44664a -->
<p align="right"><a href="../INSTALACAO.md">Português</a> · <strong>English</strong></p>

# Install Rotamer on your own machine

For anyone running their own instance: a school's IT department, a teacher with a server, or
someone who wants to try it without depending on anyone else. The entire product runs in two
containers—the app and Postgres—and the data stays in your own volume. Name searches and known
compound checks query PubChem; the Gemini tutor and Umami telemetry require configuration.
The “Where the data lives” section details these queries.

## Requirements

- **Docker** 24 or newer, with Compose v2 (`docker compose version` responds). On Windows and
  Mac, Docker Desktop; on Linux, the distribution's `docker-ce` package.
- **2 GB of free memory** to build the image the first time; half a gigabyte is enough to run
  it. Around 1 GB of disk space for the image.
- **An available port**—3000 by default.
- **Internet during the build**, to download dependencies and fonts. Once built, the editor
  and calculations work without external services; PubChem search, the tutor, and telemetry
  need a network connection when used.
- For access beyond the local network, a **domain** and a TLS proxy (§ TLS proxy).

## Three commands

The examples in this guide use **Bash**, available on Linux, macOS, and Windows through WSL.
The backup and restore scripts also require Bash; do not run the binary-file redirections
below in Windows PowerShell.

```
git clone https://github.com/GabrielMello1407/Rotamer.git && cd Rotamer
cp .env.example .env          # open .env and change POSTGRES_PASSWORD
docker compose up -d
```

Open `http://localhost:3000`. The editor appears without registration; accounts, classes, and
assignments are under `Entrar` (Sign in), at the edge of the top bar.

The first time, Docker **builds** the image, which takes five to ten minutes. On subsequent
starts, it comes up in seconds. To follow its progress:

```
docker compose logs -f app
```

Expected output, in order: `Prisma schema loaded`, the migration list with
`No pending migrations to apply` (or `Applying migration …` on the first startup), and
`▲ Next.js … Ready`. Meanwhile, Postgres is already running—the app only opens its port after
applying migrations.

**Without building.** Starting with the first tagged version, the image is published at
`ghcr.io/gabrielmello1407/rotamer`, and `docker compose pull && docker compose up -d` avoids the
build. Until it exists—`ROADMAP.md` says whether it does—`docker compose pull` returns
`manifest unknown`, and `docker compose up -d` builds on your machine, as above.

**What `up -d` does.** Starts Postgres with the `rotamer-postgres` volume, waits for it to
respond, starts the app, applies pending migrations, and opens the port. Both containers
restart automatically with the machine (`restart: unless-stopped`).

## Variables

These go in `.env`, beside `docker-compose.yml`. The file is not committed to the repository.

| Variable | What it does | Without it |
|---|---|---|
| `POSTGRES_PASSWORD` | password for the database Compose creates—letters, numbers, and hyphens only, because it becomes part of a URL | remains `rotamer`, the development password. **Change it before the first startup**: it is written into the database volume, and changing it later requires changing the database too (§ Troubleshooting) |
| `POSTGRES_USER`, `POSTGRES_DB` | database user and name | remain `rotamer` |
| `ROTAMER_PORT` | the machine port where the app appears | 3000 |
| `GEMINI_API_KEY` | Gemini key for the **tutor**, used only on the server | the tutor disables itself and says so on screen: `O tutor está desligado neste ambiente. As dicas da missão continuam valendo` (The tutor is disabled in this environment. Mission hints still apply). Everything else works |
| `GEMINI_MODEL` | which Gemini model the tutor uses | the code's default, an alias with a fixed fallback. Look here if the tutor suddenly goes silent—Gemini models get retired |
| `TUTOR_DAILY_LIMIT` | tutor requests per account per day | 30 |
| `UMAMI_SCRIPT_URL`, `UMAMI_WEBSITE_ID` | optional telemetry (§ Telemetry) | no measurement script loads |

Compose builds `DATABASE_URL` to point at the `postgres` service; it reads `.env` automatically
and passes only the variables above to the app. Write `DATABASE_URL` manually only when the
image runs without Compose (§ The image on its own).

## The first administrator

No one declares themselves a teacher: someone who issues a password reset code can take over
a student's account. The role comes from outside the applicant's own interface—decision D-19,
which applies to every instance.

**You will run a command once.** After that, the school's coordinator promotes teachers through
the interface, and you no longer need the terminal for this (D-29).

1. The coordinator creates an account at `/entrar`, **with the “school or institution” field
   filled in**. Without a school, no one can issue codes or publish missions to the catalog.
2. On the instance's machine, run:

   ```
   docker compose exec app node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II" --administrador
   ```

   The response has two lines—who became what, and what that person can now do:

   ```
   Ana <ana@escola.br> agora é administrador na escola "EE Dom Pedro II".
   Administrador promove os professores da própria escola em /turmas, e só até professor.
   ```

   In English: Ana is now an administrator at “EE Dom Pedro II”; an administrator promotes
   teachers at their own school through `/turmas`, and only as far as teacher.
   `--escola` fills the field if empty, and the script refuses promotion without a school.
3. On the next page they open, `/turmas` shows `Turmas que você dá` (Classes you teach), the
   `Professores da escola` (School teachers) section, and the route to `/codigos`. No need to
   sign out and back in.

**From then on, use the interface.** Under `Professores da escola` (School teachers), the
administrator enters the future teacher's email, **checks the name** shown, and confirms.
They can promote only to **teacher**, and only accounts at the **same school, already filled
in on both sides**—the interface never writes anyone's school, because writing that field is
equivalent to expanding who can reach that account. Anyone who created an account without
filling in the school must be promoted here, with `--escola`.

**Another administrator can only be created here.** There is deliberately no path through the
interface to create an administrator: this prevents a compromised account from multiplying
and ensures that you, with machine access, can always recover the instance. If the school
needs a second coordinator, run the command again with their email.

To promote someone directly to teacher, without making them an administrator, use the same
command without `--administrador`. To undo either promotion, use the same command with `--rebaixar`.

**What demotion does, through the terminal or interface.** The account can no longer create
classes, build assignments, view the board, or issue password codes, and its published
missions **leave the catalog**—revoking the role is the mitigation this installation promises
for content read by minors, and it is worthless if the text remains public. Classes and
assignments are kept and return in full if the account is promoted again; already published
assignments remain valid for students in that class. An account that has ever taught can
**recover its password only here**, even after demotion: otherwise, demotion would become
the first step toward someone at the school entering a teacher's account.

**Who promoted whom is recorded.** Every role change leaves a row identifying who changed
whom, from which role to which, and when; a terminal change appears without an author, which
is exactly what it is. Beside each name, `Professores da escola` (School teachers) shows the
latest promotion—who performed it and when, or “role assigned through the terminal.” The full
history lives in the database's `RoleChange` table and can be retrieved with SQL.

## Updating

Before updating, make a backup (§ Backup). Then:

```
git pull
docker compose up -d --build
```

Or, with the published image, `docker compose pull && docker compose up -d`. Pending
migrations run on startup, before the app opens its port. Every migration so far is
additive—creating a table or column, never deleting or rewriting data.

**Rolling back a version.** Revert the code with
`git checkout v0.2.0 && docker compose up -d --build` (or point `image:` at the previous tag).
The database does not roll back by itself: to revert it, restore the backup made before the
update (§ Restoring).

**Postgres never changes major version automatically.** Compose pins Postgres 18 and its data
path (`/var/lib/postgresql/18/docker`, inside the volume). Upgrading to 19 someday will require
a deliberate `pg_upgrade`, with a backup first—never just changing the image tag.

## Backup

The database is the only state. Make a daily, verified dump and store it **off the machine**:

```
docker compose exec -T postgres pg_dump -U rotamer -Fc rotamer > rotamer-$(date +%Y%m%dT%H%M).dump
docker compose exec -T postgres pg_restore --list < rotamer-<carimbo>.dump > /dev/null && echo "backup legível"
```

`-T` matters: without it, `exec` opens a pseudoterminal, and the binary dump reaches the file
with translated line endings—a file `pg_restore` cannot open.

The `-Fc` format is compressed and supports restoring one table at a time. A file
`pg_restore --list` cannot read is not a backup. A backup on the same machine as the database
is not a backup: copy it elsewhere (another machine, object storage, an external drive).

On a Linux machine with the Postgres client installed, the repository's scripts do this with
retention and remote copying—Compose's port 5432 listens only on `127.0.0.1`, so the host can
reach the database without exposing it:

```
DATABASE_URL='postgresql://rotamer:<senha>@127.0.0.1:5432/rotamer' \
BACKUP_REMOTE='usuario@outra-maquina:/backups/rotamer/' \
./scripts/backup-db.sh
```

Run it in cron once a day, with output sent to a log file. The script aborts with an error if
any step fails—silence never means success.

### Restoring

Once a month, and always after updating, **rehearse** restoration into a separate database.
A backup that has never been restored is a file, not a guarantee.

```
docker compose exec postgres createdb -U rotamer rotamer_ensaio
docker compose exec -T postgres pg_restore -U rotamer -d rotamer_ensaio --no-owner < rotamer-<carimbo>.dump
docker compose exec postgres psql -U rotamer -d rotamer_ensaio -c 'select count(*) from "Profile";'
docker compose exec postgres dropdb -U rotamer rotamer_ensaio
```

The three counts that show whether the backup is worth anything: `"Profile"` (accounts),
`"Attempt"` (attempts), and `"MoleculeName"` (nicknames).

To restore **over** the instance after losing the database: stop the app
(`docker compose stop app`), restore into the `rotamer` database with `--clean --if-exists`,
and restart the app. `scripts/restore-db.sh` does the same from the host and requires
`RESTORE_CONFIRMO=sim` to touch the production database.

## TLS proxy

To make the instance accessible beyond the local network, put a proxy with a certificate in
front of it. With Caddy, it is one file:

```
rotamer.escola.br {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
```

Caddy obtains and renews the certificate automatically. `encode` matters: the chemistry engine
is 6.7 MB and shrinks by 70% when compressed—without compression, a student on a low-end phone
waits forty seconds longer in their first lesson. The Next server already compresses; the
proxy must not undo that.

The configuration used by the author's instance, with the engine's precompressed files served
directly by the proxy, is in `DEPLOY.md`.

## The image on its own

The image starts without a database: just the editor, with all its chemistry, and no accounts,
classes, or assignments.

```
docker run --rm -p 3000:3000 ghcr.io/gabrielmello1407/rotamer:latest
```

The tag is the same one `docker compose up -d` gives to the image it builds on your machine,
so this command works after a local build even before the image has been published.

The log says `subindo sem banco` (starting without a database). To use an existing Postgres
instead of Compose, pass `-e DATABASE_URL='postgresql://usuario:senha@host:5432/banco'`:
migrations run on startup.

## Telemetry

**Off by default**, and enabling it is the host's decision. The available integration is with
self-hosted, cookie-free [Umami](https://umami.is): anyone who wants it runs their own Umami
and fills in `UMAMI_SCRIPT_URL` and `UMAMI_WEBSITE_ID`.

When enabled, it measures a closed list of events—first valid molecule, mission completed,
molecule saved, tutor request, example loaded (`apps/web/lib/track.ts`). What **never** travels:
name, email, drawn molecule, SMILES, InChIKey. The script respects the browser's “do not track”
setting. If you enable it, say so in the school's privacy notice.

## Where the data lives

In Docker's `rotamer-postgres` volume, on the machine running the instance. The host holds the
data: email, display name, school, password (only its bcrypt hash), mission progress, saved
molecules, nicknames, and teacher-created missions. Deleting an account deletes everything
belonging to it (`onDelete: Cascade`).

What leaves the machine, and only when the feature is used: name searches and known-compound
checks query **PubChem** (an InChIKey or a name, never the identity of the person asking); the
tutor sends **Gemini** the already calculated descriptors and goal labels—never a name,
email, or teacher-written text. Without a key, nothing goes to Gemini.

## Troubleshooting

| What you see | What it means | What to do |
|---|---|---|
| The screen opens but stays on `carregando o motor` (loading the engine), and clicking does not draw | `/chem/RDKit_minimal.wasm` is not being served | `curl -I http://localhost:3000/chem/RDKit_minimal.wasm` must return 200. If it returns 404, the image was built without `prebuild`: `docker compose build --no-cache app` |
| The app keeps restarting; the log says `o banco não respondeu depois de 10 tentativas` (the database did not respond after 10 attempts) | the app cannot reach Postgres, the password does not match, or the password contains a character that cannot go in a URL (`@`, `#`, `/`, `:`) | Does `docker compose ps` show a healthy `postgres`? Does the password contain only letters, numbers, and hyphens? Was it changed after the first startup? If so, change it in the database: `docker compose exec postgres psql -U rotamer -c "alter user rotamer password '<nova>';"` |
| `ports are not available … 3000` | the port is already in use on the machine | `ROTAMER_PORT=3100` in `.env` |
| The build fails while downloading fonts or packages | no internet during `docker compose build` | connect and retry; the build resumes where it stopped |
| `Só conta de professor emite código` (Only a teacher account can issue a code) | the account is still a student | § The first administrator |
| `O tutor está desligado neste ambiente` (The tutor is disabled in this environment) | no `GEMINI_API_KEY` | fill it in and run `docker compose up -d` |
| The tutor had a key and stopped responding | the model was retired | set `GEMINI_MODEL` to a current model, then run `docker compose up -d` |
| Name search says `O PubChem não respondeu agora` (PubChem did not respond just now) | PubChem is down or rate-limiting | wait. Pasting SMILES still works |

To see the state: `docker compose ps` (the app is `healthy` when it responds). To see what
happened: `docker compose logs --tail 100 app`.

## Development

The route for working on the code is different—`pnpm dev` with Compose's Postgres—and is
described in [CONTRIBUTING.en.md](../../CONTRIBUTING.en.md).
