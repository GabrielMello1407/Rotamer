<!-- source: SECURITY.md · sha256:433921065ba137279f44ac6536f92d0004402056d168a170fd5815ac3b8c943b -->
<p align="right"><a href="SECURITY.md">Português</a> · <strong>English</strong></p>

# Reporting a security flaw

Rotamer stores student accounts, class progress, and the code that resets a password in the
classroom. Whoever finds a flaw here may be holding the key to a minor's account. Thank you for
reporting it with care.

## How to report

**Use GitHub's private reporting**, never a public issue:

**[Security → Report a vulnerability](https://github.com/GabrielMello1407/Rotamer/security/advisories/new)**

The tab is under `Security` in the repository. The report is only seen by the maintainer until a
fix exists, and that is how a live instance does not stay exposed while the fix is written.

**Do not open a public issue** for a security flaw. An issue tells the world how to exploit the
flaw before a fix exists, and every school that runs its own instance stays open in the meantime.

## What to write

The more concrete, the faster it becomes a fix:

- **the path**, step by step, with the roles involved (student, teacher, administrator) and the
  school of each account — role and school are the boundary of almost everything here;
- **what you managed** to do that you should not have: read, write, get into an account, go past
  a limit;
- **where**: the screen, the server action, or the script, if you know;
- **the version**: the tag you deployed, or the `main` commit;
- whether it was on the **live instance** or on your own installation.

You do not need a ready exploit or an elaborate proof of concept. A paragraph saying “from
account X I reach Y” is enough for us to investigate.

## What counts as a flaw here

These are the boundaries the product promises, and breaking any of them is a flaw:

- **role.** Nobody declares themselves a teacher or an administrator; an administrator is only
  created in the terminal, and through the screen can promote no higher than teacher, within
  their own school (decisions D-19 and D-29 in [docs/en/DECISIONS.md](docs/en/DECISIONS.md));
- **password reset code.** It is only issued for an account that does not teach, at the same
  school as whoever issues it, and never for someone who has taught. Any path around this is a
  ladder to taking over someone else's account;
- **mission answer key.** `answerMolblock` and `answerInchiKey` never reach a student's browser,
  in any response — HTML, payload, or action return value;
- **student data.** A teacher sees mission progress for their own class, never the molecule a
  student drew outside missions, and never someone else's class;
- **teacher text.** A mission's brief and hints do not leave the server for the language model,
  nor for logs, nor for error messages;
- **secrets.** An API key, database password, or `.env` that shows up in a published image, in a
  versioned file, or in an HTTP response;
- **limits.** Any way around the per-account limits — tutor requests, mission checks, wrong class
  codes, role lookups.

## What is not a security flaw

These come up often and have a written answer:

- **RDKit's number does not match PubChem's.** It is not a bug, it is a difference of definition
  — TPSA with perceived aromaticity, rotatable bonds under the strict definition. The screen says
  whose definition it is, and the calculation is never adjusted to match a third party's table.
  If you still think it is wrong, open a **chemistry error issue** — it is the kind of report that
  matters most here, it just is not security;
- **the school is text a person types.** `Profile.institution` is not verified, and on an
  instance with more than one school an administrator reaches whoever typed the same text. It is
  a known, written-down limitation (D-29, and [docs/en/OUT-OF-SCOPE.md](docs/en/OUT-OF-SCOPE.md)) —
  what holds it is a person checking the name and e-mail before confirming, and the trail of who
  confirmed. Report it if you find a path that **does away with** that coincidence;
- **an administrator sees the e-mail of their school's teachers.** It is deliberate: without it,
  two people with the same name cannot be told apart when demoting;
- **a flaw in a dependency, already public and already fixed upstream.** Open a normal issue
  pointing to the version; updating a dependency does not need secrecy.

## Response

Rotamer is maintained by one person, with no company and no bounty program. I do not promise a
deadline I cannot meet: what I promise is to **read every private report**, reply saying whether I
understood it and what I intend to do, and handle account-takeover and student-data flaws before
anything else in the queue.

There is no payment. There is credit, if you want it: whoever reports is cited in the fix and in
the decision log, under the name they ask for.

## Versions

Versions ship as tags — the first was `v0.1.0`, on September 19, 2026 — and each one publishes the
`ghcr.io/gabrielmello1407/rotamer` image with its number and `latest`. **What is maintained is the
latest version and `main`**: the live instance runs `main`, and whoever runs their own instance
pulls the image of the latest tag or builds from `main`. The fix ships in a new tag, and that is the
one hosts should deploy.

If you maintain your own instance, [docs/en/INSTALLATION.md](docs/en/INSTALLATION.md) has the update step
and the backup step. Update before reporting, if you can: the flaw may already be fixed.
