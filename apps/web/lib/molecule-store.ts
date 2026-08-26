import 'server-only';
import type { Molecule } from '@rotamer/core';
import { db } from './db';

/**
 * Guardar uma estrutura na estante de alguém.
 *
 * Três caminhos chegam aqui, e é de propósito que seja um só lugar: guardar de
 * propósito, cumprir uma missão e batizar uma estrutura. Nos três, o que a
 * pessoa fez foi dizer "esta molécula importa para mim" — e ela precisa
 * encontrá-la depois em "minhas moléculas", sem ter de lembrar por qual porta
 * entrou.
 *
 * O que vai para o banco é o **grafo**, no formato molblock. Fórmula, massa e
 * descritores viajam junto só para a lista poder mostrar do que se trata sem
 * levantar o RDKit por linha; abrir a molécula recalcula tudo a partir do grafo.
 *
 * A mesma estrutura guardada duas vezes continua sendo uma linha só: a chave é
 * o par dono e InChIKey.
 */
export async function rememberMolecule(
  ownerId: string,
  molecule: Molecule,
): Promise<{ readonly id: string }> {
  return db.molecule.upsert({
    where: { ownerId_inchiKey: { ownerId, inchiKey: molecule.inchiKey } },
    create: {
      ownerId,
      graph: { molblock: molecule.molblock },
      smiles: molecule.smiles,
      inchiKey: molecule.inchiKey,
      formula: molecule.formula,
      descriptors: { ...molecule.descriptors },
    },
    // O desenho mais recente ganha: mexer na estrutura e guardar de novo é
    // atualizar o que estava lá, não criar uma segunda linha.
    update: { graph: { molblock: molecule.molblock } },
    select: { id: true },
  });
}
