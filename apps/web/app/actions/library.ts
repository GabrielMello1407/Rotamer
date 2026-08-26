'use server';

import { z } from 'zod';
import { currentProfile } from '../../lib/auth';
import { analyzeOnServer } from '../../lib/chemistry-server';
import { db, hasDatabase } from '../../lib/db';
import { rememberMolecule } from '../../lib/molecule-store';

/**
 * As moléculas de quem entrou.
 *
 * Guardar é um ato deliberado: até aqui, molécula só ia para o banco de raspão,
 * como efeito de uma missão cumprida. Quem desenha fora de missão — que é o uso
 * do pesquisador — não tinha onde deixar o que fez.
 *
 * O que vai para o banco é o **grafo**, no formato molblock. Fórmula, massa e
 * descritores são derivados dele e recalculáveis; ficam junto só para a lista
 * poder mostrar do que se trata sem levantar o RDKit para cada linha.
 *
 * E a validade continua sendo do RDKit **no servidor**: o navegador manda o
 * desenho, nunca o veredito.
 */

const saveSchema = z.object({
  molblock: z.string().min(1).max(200_000),
});

const forgetSchema = z.object({
  inchiKey: z.string().min(1).max(64),
});

export interface SavedMolecule {
  readonly inchiKey: string;
  readonly smiles: string;
  readonly formula: string;
  readonly molarMass: number;
  /** ISO 8601, para a tela formatar como quiser. */
  readonly savedAt: string;
  /** O apelido, quando alguém batizou esta estrutura. */
  readonly name: string | null;
  readonly namedBy: string | null;
}

export type SaveOutcome =
  | { readonly status: 'saved'; readonly molecule: SavedMolecule }
  | { readonly status: 'anonymous' }
  | { readonly status: 'rejected'; readonly reason: string };

export async function saveMolecule(input: { molblock: string }): Promise<SaveOutcome> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: 'Pedido mal formado.' };
  if (!hasDatabase()) return { status: 'rejected', reason: 'Guardar não está disponível aqui.' };

  const profile = await currentProfile();
  if (profile === null) return { status: 'anonymous' };

  const analysis = await analyzeOnServer(parsed.data.molblock);
  if (!analysis.ok) return { status: 'rejected', reason: analysis.error.message };

  const { molecule } = analysis;

  await rememberMolecule(profile.id, molecule);

  const row = await db.molecule.findUniqueOrThrow({
    where: { ownerId_inchiKey: { ownerId: profile.id, inchiKey: molecule.inchiKey } },
    select: { inchiKey: true, smiles: true, formula: true, descriptors: true, createdAt: true },
  });

  const named = await db.moleculeName
    .findUnique({
      where: { inchiKey: molecule.inchiKey },
      include: { profile: { select: { displayName: true } } },
    })
    .catch(() => null);

  return {
    status: 'saved',
    molecule: {
      inchiKey: row.inchiKey,
      smiles: row.smiles,
      formula: row.formula,
      molarMass: molarMassOf(row.descriptors),
      savedAt: row.createdAt.toISOString(),
      name: named?.name ?? null,
      namedBy: named?.profile.displayName ?? null,
    },
  };
}

/** Tirar da estante. O desenho não some do mundo — some da lista de quem salvou. */
export async function forgetMolecule(input: { inchiKey: string }): Promise<{ ok: boolean }> {
  const parsed = forgetSchema.safeParse(input);
  if (!parsed.success || !hasDatabase()) return { ok: false };

  const profile = await currentProfile();
  if (profile === null) return { ok: false };

  const removed = await db.molecule
    .deleteMany({ where: { ownerId: profile.id, inchiKey: parsed.data.inchiKey } })
    .catch(() => null);

  return { ok: (removed?.count ?? 0) > 0 };
}

/** A estante inteira, da mais recente para a mais antiga. */
export async function readLibrary(): Promise<readonly SavedMolecule[]> {
  if (!hasDatabase()) return [];

  const profile = await currentProfile();
  if (profile === null) return [];

  const rows = await db.molecule
    .findMany({
      where: { ownerId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { inchiKey: true, smiles: true, formula: true, descriptors: true, createdAt: true },
    })
    .catch(() => []);

  if (rows.length === 0) return [];

  // Os apelidos vêm numa consulta só: uma por linha seria uma ida ao banco por
  // molécula da estante.
  const named = await db.moleculeName
    .findMany({
      where: { inchiKey: { in: rows.map((row) => row.inchiKey) } },
      include: { profile: { select: { displayName: true } } },
    })
    .catch(() => []);

  const byKey = new Map(named.map((row) => [row.inchiKey, row]));

  return rows.map((row) => {
    const label = byKey.get(row.inchiKey);

    return {
      inchiKey: row.inchiKey,
      smiles: row.smiles,
      formula: row.formula,
      molarMass: molarMassOf(row.descriptors),
      savedAt: row.createdAt.toISOString(),
      name: label?.name ?? null,
      namedBy: label?.profile.displayName ?? null,
    };
  });
}

/**
 * A massa que ficou guardada junto com a estrutura.
 *
 * O campo é JSON e pode ter vindo de uma versão anterior do produto; quando não
 * dá para ler um número, a tela mostra a fórmula e omite a massa em vez de
 * inventar uma.
 */
function molarMassOf(descriptors: unknown): number {
  if (typeof descriptors !== 'object' || descriptors === null) return 0;

  const value = (descriptors as Record<string, unknown>)['molarMass'];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
