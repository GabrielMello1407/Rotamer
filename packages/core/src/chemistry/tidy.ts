import { fromMolblock, toMolblock } from '../graph/molfile';
import { BOND_LENGTH, type MoleculeGraph } from '../graph/types';
import { loadRDKit, type RDKitOptions } from './rdkit';

/**
 * Organizar o desenho.
 *
 * O editor deixa desenhar de qualquer jeito, e é assim que tem que ser: quem
 * está aprendendo põe o átomo onde a mão levou. O resultado é uma molécula
 * torta, com ligações de comprimentos diferentes e ângulos que não existem — e
 * uma estrutura torta é mais difícil de ler do que uma estrutura errada.
 *
 * Quem endireita é o **RDKit**, com o mesmo algoritmo de layout que ele usa para
 * desenhar. Não existe um "organizador" nosso: distância de ligação, ângulo de
 * cadeia e forma de anel são química, e valem aqui as mesmas regras do D-01.
 *
 * O que muda são as coordenadas. Átomos, ligações, ordens e configuração
 * continuam os mesmos — o RDKit reescreve as cunhas de acordo com as
 * coordenadas novas, que é o que mantém R como R depois de endireitar.
 */
export async function tidy(input: string, options: RDKitOptions = {}): Promise<string | null> {
  if (input.trim() === '') return null;

  const rdkit = await loadRDKit(options);

  let mol;
  try {
    mol = rdkit.get_mol(input);
  } catch {
    return null;
  }

  if (mol === null) return null;

  try {
    if (!mol.is_valid()) return null;

    // `true` pede o CoordGen, que é o que dá anel hexagonal regular e cadeia em
    // ziguezague. Quando ele não está compilado no motor, o RDKit cai no layout
    // próprio, que é pior mas continua sendo layout de verdade.
    mol.set_new_coords(true);

    const molblock = mol.get_molblock();
    if (molblock.trim() === '') return null;

    return toMolblock(atOurScale(fromMolblock(molblock)));
  } catch {
    return null;
  } finally {
    mol.delete();
  }
}

/**
 * O desenho do RDKit, na escala do editor.
 *
 * O layout dele usa ligação de comprimento 1; o editor desenha em ångström e
 * usa 1,5. Sem esta conta, organizar encolheria a molécula a dois terços do
 * tamanho toda vez — e a pessoa leria isso como "organizar afastou meu desenho".
 *
 * É escala, não química: multiplica todo mundo pelo mesmo número, então ângulo,
 * proporção e configuração ficam onde estavam.
 */
function atOurScale(graph: MoleculeGraph): MoleculeGraph {
  const lengths = graph.bonds
    .map((bond) => {
      const from = graph.atoms.find((atom) => atom.id === bond.from);
      const to = graph.atoms.find((atom) => atom.id === bond.to);
      if (!from || !to) return null;

      return Math.hypot(from.x - to.x, from.y - to.y);
    })
    .filter((length): length is number => length !== null && length > 1e-6);

  if (lengths.length === 0) return graph;

  // A mediana, e não a média: uma ligação esticada num desenho apertado puxaria
  // a média e encolheria todo o resto.
  const sorted = [...lengths].sort((first, second) => first - second);
  const middle = sorted[Math.floor(sorted.length / 2)];
  if (middle === undefined || middle <= 1e-6) return graph;

  const factor = BOND_LENGTH / middle;

  return {
    ...graph,
    atoms: graph.atoms.map((atom) => ({ ...atom, x: atom.x * factor, y: atom.y * factor })),
  };
}
