'use server';

import { z } from 'zod';
import { analyzeOnServer } from '../../lib/chemistry-server';
import { db, hasDatabase } from '../../lib/db';
import { findCompoundByName } from '../../lib/pubchem';

/**
 * Buscar molécula por nome.
 *
 * Quem sabe dizer "cafeína" não devia precisar saber escrever
 * `Cn1cnc2c1c(=O)n(C)c(=O)n2C`. O nome vai ao PubChem; o que volta de lá é uma
 * estrutura, e quem decide se ela é válida continua sendo o RDKit, aqui no
 * servidor, antes de qualquer coisa chegar à tela.
 *
 * O resultado é guardado — inclusive o "não existe". Consulta externa é lenta,
 * limitada em ritmo e às vezes está fora; perguntar duas vezes a mesma coisa é
 * desperdício de um recurso que não é nosso.
 */

const schema = z.object({ name: z.string().trim().min(2).max(120) });

/** Quanto tempo uma resposta guardada continua valendo. */
const FRESH_DAYS = 30;

export interface FoundCompound {
  /** SMILES já canonizado pelo RDKit, não o que veio do PubChem. */
  readonly smiles: string;
  readonly formula: string;
  /** O nome que o PubChem dá ao composto, quando dá. */
  readonly title: string | null;
  readonly cid: number;
}

export type SearchOutcome =
  | { readonly status: 'found'; readonly compound: FoundCompound }
  | { readonly status: 'not-found' }
  /** O PubChem não respondeu. Colar o SMILES continua funcionando. */
  | { readonly status: 'unavailable' }
  | { readonly status: 'rejected'; readonly reason: string };

export async function findByName(rawName: string): Promise<SearchOutcome> {
  const parsed = schema.safeParse({ name: rawName });
  if (!parsed.success) return { status: 'rejected', reason: 'Digite ao menos duas letras.' };

  const query = parsed.data.name.toLowerCase();

  const cached = await readCache(query);
  if (cached !== null) return cached;

  const lookup = await findCompoundByName(query);

  if (lookup.status === 'indisponivel') {
    // Não guarda: o PubChem estar ocupado agora não diz nada sobre o nome.
    return { status: 'unavailable' };
  }

  if (lookup.status === 'nao-encontrado') {
    await writeCache(query, { found: false });
    return { status: 'not-found' };
  }

  // O que veio de fora passa pelo RDKit antes de virar molécula na tela.
  const analysis = await analyzeOnServer(lookup.value.smiles);
  if (!analysis.ok) {
    return { status: 'rejected', reason: 'O PubChem devolveu uma estrutura que não sei ler.' };
  }

  const compound: FoundCompound = {
    smiles: analysis.molecule.smiles,
    formula: analysis.molecule.formula,
    title: lookup.value.title,
    cid: lookup.value.cid,
  };

  await writeCache(query, {
    found: true,
    cid: compound.cid,
    smiles: compound.smiles,
    title: compound.title,
    formula: compound.formula,
  });

  return { status: 'found', compound };
}

interface CacheRow {
  readonly found: boolean;
  readonly cid?: number;
  readonly smiles?: string;
  readonly title?: string | null;
  readonly formula?: string;
}

async function readCache(query: string): Promise<SearchOutcome | null> {
  if (!hasDatabase()) return null;

  const row = await db.pubChemName.findUnique({ where: { query } }).catch(() => null);
  if (row === null) return null;

  const age = Date.now() - row.checkedAt.getTime();
  if (age > FRESH_DAYS * 24 * 60 * 60 * 1000) return null;

  if (!row.found) return { status: 'not-found' };
  if (row.smiles === null || row.cid === null || row.formula === null) return null;

  return {
    status: 'found',
    compound: { smiles: row.smiles, formula: row.formula, title: row.title, cid: row.cid },
  };
}

async function writeCache(query: string, data: CacheRow): Promise<void> {
  if (!hasDatabase()) return;

  const record = {
    found: data.found,
    cid: data.cid ?? null,
    smiles: data.smiles ?? null,
    title: data.title ?? null,
    formula: data.formula ?? null,
    checkedAt: new Date(),
  };

  await db.pubChemName
    .upsert({ where: { query }, create: { query, ...record }, update: record })
    .catch(() => null);
}
