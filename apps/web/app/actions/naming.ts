'use server';

import { z } from 'zod';
import { currentProfile } from '../../lib/auth';
import { analyzeOnServer } from '../../lib/chemistry-server';
import { db, hasDatabase } from '../../lib/db';
import { checkName, normalizeName, NAME_MAX } from '../../lib/molecule-name';

/**
 * Batizar uma estrutura.
 *
 * Duas condições, nesta ordem: a estrutura precisa **existir quimicamente** —
 * quem diz isso é o RDKit, aqui no servidor — e precisa estar **sem dono**, o
 * que se descobre pela InChIKey. Quem chega primeiro fica com o apelido.
 *
 * O que isto não é: nomenclatura. O produto não calcula nome de composto, e o
 * apelido nunca aparece sem o nome de quem deu (D-15).
 */

const schema = z.object({
  molblock: z.string().min(1).max(200_000),
  name: z.string().min(1).max(NAME_MAX * 2),
});

export interface NamedMolecule {
  readonly name: string;
  readonly by: string;
  readonly at: string;
}

export type NamingOutcome =
  | { readonly status: 'named'; readonly named: NamedMolecule }
  /** Já tem apelido: quem batizou chegou antes. */
  | { readonly status: 'taken'; readonly named: NamedMolecule }
  | { readonly status: 'anonymous' }
  | { readonly status: 'rejected'; readonly reason: string };

export async function nameMolecule(input: {
  molblock: string;
  name: string;
}): Promise<NamingOutcome> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: 'Pedido mal formado.' };
  if (!hasDatabase()) return { status: 'rejected', reason: 'Batismo indisponível neste ambiente.' };

  const profile = await currentProfile();
  if (profile === null) return { status: 'anonymous' };

  const name = normalizeName(parsed.data.name);
  const check = checkName(name);
  if (!check.ok) return { status: 'rejected', reason: check.message ?? 'Apelido inválido.' };

  // Estrutura impossível não recebe apelido: o veredito é do RDKit, no servidor,
  // e não do que o navegador mandou.
  const analysis = await analyzeOnServer(parsed.data.molblock);
  if (!analysis.ok) return { status: 'rejected', reason: analysis.error.message };

  const { inchiKey, formula, smiles } = analysis.molecule;

  const existing = await readName(inchiKey);
  if (existing !== null) return { status: 'taken', named: existing };

  try {
    const row = await db.moleculeName.create({
      data: { inchiKey, name, formula, smiles, profileId: profile.id },
      include: { profile: { select: { displayName: true } } },
    });

    return {
      status: 'named',
      named: {
        name: row.name,
        by: row.profile.displayName,
        at: row.createdAt.toISOString(),
      },
    };
  } catch {
    // Corrida entre duas pessoas na mesma estrutura: quem perdeu vê o apelido
    // de quem ganhou, que é a resposta honesta.
    const winner = await readName(inchiKey);
    if (winner !== null) return { status: 'taken', named: winner };
    return { status: 'rejected', reason: 'Não foi possível registrar o apelido.' };
  }
}

/** O apelido de uma estrutura, se alguém já tiver batizado. */
export async function readName(inchiKey: string): Promise<NamedMolecule | null> {
  if (!hasDatabase()) return null;

  const row = await db.moleculeName
    .findUnique({
      where: { inchiKey },
      include: { profile: { select: { displayName: true } } },
    })
    .catch(() => null);

  if (row === null) return null;

  return { name: row.name, by: row.profile.displayName, at: row.createdAt.toISOString() };
}
