import { fromMolblock, toMolblock } from '../graph/molfile';
import { BOND_LENGTH, type GraphBond, type MoleculeGraph } from '../graph/types';
import { loadRDKit, type RDKitOptions } from './rdkit';
import type { RDKitModule } from '@rdkit/rdkit';
import { cleanStereoLabel, readStereoTags, type StereoTags } from './stereo-tags';
import type { TidyResult, TidyStereoChanges } from './types';

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
 * O que muda são as coordenadas. Átomos, ligações e ordens continuam os mesmos.
 * A cunha, porém, é desenho, não dado químico puro: o RDKit reescreve cada uma
 * de acordo com as coordenadas novas, e duas coisas podem acontecer com ela —
 * sumir, quando não definia centro nenhum, ou trocar de cheia para tracejada,
 * quando definia e passou a ficar do outro lado do papel. As duas são certas; a
 * tela é quem decide se conta isso para quem desenhou. Por isso `tidy` devolve
 * o relatório junto com o molblock, em vez de reescrever em silêncio.
 */
export async function tidy(input: string, options: RDKitOptions = {}): Promise<TidyResult | null> {
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

    // A estereoquímica de entrada, das duas formas que importam: as cunhas do
    // desenho (o grafo) e a configuração que o RDKit lê a partir delas (R, S, E,
    // Z). As duas são lidas antes de qualquer coordenada nova existir.
    const wedgesBefore = fromMolblock(input).bonds;
    const stereoBefore = readStereoTags(mol);

    // `true` pede o CoordGen, que é o que dá anel hexagonal regular e cadeia em
    // ziguezague. Quando ele não está compilado no motor, o RDKit cai no layout
    // próprio, que é pior mas continua sendo layout de verdade.
    mol.set_new_coords(true);

    const molblock = mol.get_molblock();
    if (molblock.trim() === '') return null;

    /*
     * A configuração de saída sai do **molblock devolvido**, e não do mesmo
     * objeto do RDKit.
     *
     * Perguntar duas vezes ao mesmo `mol` não verifica nada: `set_new_coords`
     * troca o confôrmero e não encosta na marca de quiralidade do átomo, então
     * a resposta seria sempre "igual" — uma tautologia com cara de conferência.
     * O que precisa ser conferido é o artefato que chega ao aluno: o desenho
     * novo, relido do zero, com as cunhas que o RDKit escreveu nele.
     */
    const stereoAfter = readStereoTagsOf(rdkit, molblock);
    if (stereoAfter === null) return null;

    const arranged = atOurScale(fromMolblock(molblock));

    return {
      molblock: toMolblock(arranged),
      stereo: stereoReport(wedgesBefore, arranged.bonds, stereoBefore, stereoAfter),
    };
  } catch {
    return null;
  } finally {
    mol.delete();
  }
}

/**
 * As marcas de configuração de um molblock, lidas do zero.
 *
 * Devolve `null` quando o desenho não volta a ser molécula — se isso acontecer,
 * organizar não tem resultado para entregar.
 */
function readStereoTagsOf(rdkit: RDKitModule, molblock: string): StereoTags | null {
  let mol;
  try {
    mol = rdkit.get_mol(molblock);
  } catch {
    return null;
  }

  if (mol === null) return null;

  try {
    return mol.is_valid() ? readStereoTags(mol) : null;
  } finally {
    mol.delete();
  }
}

/**
 * O relatório de estereoquímica: o que aconteceu com cada cunha, e se a
 * configuração de cada centro é a mesma de antes.
 */
function stereoReport(
  bondsBefore: readonly GraphBond[],
  bondsAfter: readonly GraphBond[],
  stereoBefore: StereoTags,
  stereoAfter: StereoTags,
): TidyStereoChanges {
  const { removedWedges, flippedWedges, movedWedges } = wedgeChanges(bondsBefore, bondsAfter);

  return {
    removedWedges,
    flippedWedges,
    movedWedges,
    sameConfiguration:
      sameLabels(labelsByAtom(stereoBefore), labelsByAtom(stereoAfter)) &&
      sameLabels(labelsByBondPair(stereoBefore), labelsByBondPair(stereoAfter)),
  };
}

/**
 * O que aconteceu com cada cunha do desenho de entrada.
 *
 * Casadas pelo **par de átomos**, nunca pela posição na lista: o RDKit é livre
 * para escrever as ligações do molblock de saída em outra ordem, e casar por
 * índice apontaria a cunha errada em silêncio — o mesmo risco do D-21, agora
 * sobre uma lista em vez de uma prioridade CIP.
 *
 * E olhar só a ligação não basta, porque o caso mais comum de todos não é a
 * cunha sumir nem virar: é ela **mudar de ligação**. O RDKit escolhe de qual
 * ligação do centro a cunha sai, e a escolha muda quando as coordenadas mudam.
 * Contando por ligação, a alanina com cunha no C–N sai como "uma cunha
 * removida" — idêntica ao etanol, onde a cunha realmente não valia nada. Os
 * dois casos dizem coisas opostas para quem está aprendendo, e um deles seria
 * mentira dita para uma sala inteira.
 *
 * Por isso a conta é por **átomo de origem**: a cunha nasce numa ponta (é ela
 * que sai do plano do papel), e o que importa é se aquela ponta continua tendo
 * cunha depois. Continua: o desenho mudou. Não continua: a cunha saiu de
 * verdade.
 */
function wedgeChanges(
  before: readonly GraphBond[],
  after: readonly GraphBond[],
): Pick<TidyStereoChanges, 'removedWedges' | 'flippedWedges' | 'movedWedges'> {
  const afterByAtomPair = new Map<string, GraphBond>();
  const wedgedAtomsAfter = new Set<number>();

  for (const bond of after) {
    afterByAtomPair.set(atomPairKey(bond.from, bond.to), bond);
    if ((bond.wedge ?? 'none') !== 'none') wedgedAtomsAfter.add(bond.from);
  }

  let removedWedges = 0;
  let flippedWedges = 0;
  let movedWedges = 0;

  for (const bond of before) {
    const wedge = bond.wedge ?? 'none';
    if (wedge === 'none') continue;

    const match = afterByAtomPair.get(atomPairKey(bond.from, bond.to));
    const wedgeAfter = match?.wedge ?? 'none';

    if (wedgeAfter === wedge) continue;

    if (wedgeAfter !== 'none') {
      flippedWedges += 1;
      continue;
    }

    // A cunha não está mais nesta ligação. Se o mesmo átomo continua tendo
    // cunha em alguma ligação, ela mudou de lugar — o centro continua
    // desenhado, e ninguém perdeu configuração nenhuma.
    if (wedgedAtomsAfter.has(bond.from)) movedWedges += 1;
    else removedWedges += 1;
  }

  return { removedWedges, flippedWedges, movedWedges };
}

function atomPairKey(first: number, second: number): string {
  return first < second ? `${String(first)}-${String(second)}` : `${String(second)}-${String(first)}`;
}

/** Configuração de cada átomo estereogênico (R, S, ou `?`), por índice do RDKit. */
function labelsByAtom(tags: StereoTags): ReadonlyMap<string, string> {
  const labels = new Map<string, string>();
  for (const [index, label] of tags.CIP_atoms ?? []) {
    const clean = cleanStereoLabel(label);
    if (clean !== '') labels.set(String(index), clean);
  }
  return labels;
}

/** Geometria de cada dupla estereogênica (E ou Z), pelo par de átomos que a define. */
function labelsByBondPair(tags: StereoTags): ReadonlyMap<string, string> {
  const labels = new Map<string, string>();
  for (const [first, second, label] of tags.CIP_bonds ?? []) {
    const clean = cleanStereoLabel(label);
    if (clean !== '') labels.set(atomPairKey(first, second), clean);
  }
  return labels;
}

/**
 * `true` quando os dois mapas trazem exatamente as mesmas chaves com o mesmo
 * rótulo. Um centro que aparece de um lado e some do outro conta como mudança:
 * organizar não devia fazer um centro deixar de existir.
 */
function sameLabels(before: ReadonlyMap<string, string>, after: ReadonlyMap<string, string>): boolean {
  if (before.size !== after.size) return false;

  for (const [key, label] of before) {
    if (after.get(key) !== label) return false;
  }

  return true;
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
