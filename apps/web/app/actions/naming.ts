'use server';

import { z } from 'zod';
import { currentProfile } from '../../lib/auth';
import { analyzeOnServer } from '../../lib/chemistry-server';
import { db, hasDatabase } from '../../lib/db';
import { rememberMolecule } from '../../lib/molecule-store';
import { knownCompound } from '../../lib/known-compound';
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
  /** O composto já existe fora do Rotamer, e já tem nome de verdade. */
  | {
      readonly status: 'known';
      readonly title: string | null;
      readonly cid: number;
    }
  | { readonly status: 'anonymous' }
  | { readonly status: 'rejected'; readonly reason: string };

/** O que se sabe sobre uma estrutura antes de alguém tentar batizá-la. */
export type NamingState =
  | { readonly status: 'named'; readonly named: NamedMolecule }
  | { readonly status: 'known'; readonly title: string | null; readonly cid: number }
  /** Confirmado inédito: o PubChem respondeu e não conhece esta estrutura. */
  | { readonly status: 'free'; readonly verified: true }
  /** Livre aqui dentro, mas o PubChem não respondeu — não sabemos lá fora. */
  | { readonly status: 'free'; readonly verified: false };

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

  // Composto que já existe lá fora não se batiza: ele já tem nome, e dar
  // apelido a ele seria justamente a confusão que o D-15 evita.
  const known = await knownCompound(inchiKey);
  if (known.status === 'conhecido') {
    return { status: 'known', title: known.title, cid: known.cid };
  }

  try {
    const row = await db.moleculeName.create({
      data: { inchiKey, name, formula, smiles, profileId: profile.id },
      include: { profile: { select: { displayName: true } } },
    });

    /*
     * Quem batiza, guarda.
     *
     * Batizar e guardar são coisas diferentes — o apelido é da **estrutura** e
     * vale para todo mundo; a estante é **de quem entrou**. Mas ninguém dá nome
     * a uma molécula que não quer manter, e não encontrá-la depois em "minhas
     * moléculas" seria a surpresa mais boba possível.
     *
     * Se este passo falhar, o batismo continua valendo: o nome já está gravado, e
     * perder a cópia na estante é menos grave que desfazer autoria.
     */
    await rememberMolecule(profile.id, analysis.molecule).catch(() => null);

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

/**
 * O estado de batismo de uma estrutura: já batizada, já conhecida lá fora, ou
 * livre — e, se livre, se a gente conseguiu confirmar isso.
 */
export async function readNamingState(inchiKey: string): Promise<NamingState> {
  const named = await readName(inchiKey);
  if (named !== null) return { status: 'named', named };

  const known = await knownCompound(inchiKey);
  if (known.status === 'conhecido') {
    return { status: 'known', title: known.title, cid: known.cid };
  }

  return { status: 'free', verified: known.status === 'inedito' };
}
