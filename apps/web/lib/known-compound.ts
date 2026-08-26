import 'server-only';
import { db, hasDatabase } from './db';
import { findCompoundByInchiKey } from './pubchem';

/**
 * Se a estrutura já é conhecida fora do Rotamer.
 *
 * É o que o batismo precisa saber para separar "ninguém batizou aqui dentro" de
 * "este composto já existe e tem nome" (D-15). Quando o PubChem não responde, a
 * resposta honesta é **não sei** — e nesse caso o batismo continua permitido,
 * com a ressalva que a tela já dá.
 */

export type Known =
  | { readonly status: 'conhecido'; readonly cid: number; readonly title: string | null }
  | { readonly status: 'inedito' }
  | { readonly status: 'nao-sei' };

/** Quanto tempo a resposta guardada continua valendo. */
const FRESH_DAYS = 90;

export async function knownCompound(inchiKey: string): Promise<Known> {
  const cached = await readCache(inchiKey);
  if (cached !== null) return cached;

  const lookup = await findCompoundByInchiKey(inchiKey);

  if (lookup.status === 'indisponivel') return { status: 'nao-sei' };

  if (lookup.status === 'nao-encontrado') {
    await writeCache(inchiKey, { known: false });
    return { status: 'inedito' };
  }

  await writeCache(inchiKey, { known: true, cid: lookup.value.cid, title: lookup.value.title });
  return { status: 'conhecido', cid: lookup.value.cid, title: lookup.value.title };
}

async function readCache(inchiKey: string): Promise<Known | null> {
  if (!hasDatabase()) return null;

  const row = await db.pubChemKnown.findUnique({ where: { inchiKey } }).catch(() => null);
  if (row === null) return null;

  const age = Date.now() - row.checkedAt.getTime();
  if (age > FRESH_DAYS * 24 * 60 * 60 * 1000) return null;

  if (!row.known) return { status: 'inedito' };
  if (row.cid === null) return null;

  return { status: 'conhecido', cid: row.cid, title: row.title };
}

async function writeCache(
  inchiKey: string,
  data: { known: boolean; cid?: number; title?: string | null },
): Promise<void> {
  if (!hasDatabase()) return;

  const record = {
    known: data.known,
    cid: data.cid ?? null,
    title: data.title ?? null,
    checkedAt: new Date(),
  };

  await db.pubChemKnown
    .upsert({ where: { inchiKey }, create: { inchiKey, ...record }, update: record })
    .catch(() => null);
}
