import type { JSMol, RDKitModule } from '@rdkit/rdkit';
import { elementSymbol, hillFormula, maxValence } from './elements';
import { detectFunctionalGroups } from './groups';
import {
  parseJson,
  resolveAtoms,
  type JsonDocument,
  type RDKitDescriptors,
} from './rdkit-json';
import { loadRDKit, type RDKitOptions } from './rdkit';
import type {
  AnalysisResult,
  ChemistryError,
  Descriptors,
  Molecule,
  StereoLabels,
} from './types';

const NOTHING_DRAWN: ChemistryError = {
  code: 'empty',
  message: 'Não há nenhum átomo para analisar.',
};

/**
 * Analisa uma estrutura — SMILES ou molblock — e devolve a molécula sanitizada
 * ou o motivo químico de ela não existir.
 *
 * Esta função é o ponto onde o produto responde "é válido?". A resposta vem do
 * RDKit; o que fazemos aqui é traduzir a recusa dele para português que explica
 * a química.
 */
export async function analyze(input: string, options?: RDKitOptions): Promise<AnalysisResult> {
  if (drawsNothing(input)) {
    return { ok: false, error: NOTHING_DRAWN };
  }

  const rdkit = await loadRDKit(options);
  const mol = parseMol(rdkit, input);

  if (mol === null) {
    return { ok: false, error: diagnose(rdkit, input) };
  }

  try {
    if (!mol.is_valid()) {
      return { ok: false, error: diagnose(rdkit, input) };
    }

    const molecule = describe(rdkit, mol);

    // Estrutura sem nenhum átomo é tela vazia, não erro de química.
    if (molecule.formula === '') {
      return { ok: false, error: NOTHING_DRAWN };
    }

    return { ok: true, molecule };
  } finally {
    mol.delete();
  }
}

/** Monta a molécula a partir do que o RDKit já calculou. */
function describe(rdkit: RDKitModule, mol: JSMol): Molecule {
  // Estrutura vinda de SMILES chega sem coordenada nenhuma. O molblock é a
  // ponte para o editor e para a geometria 3D, e os dois precisam de um
  // desenho plano de partida — quem faz esse desenho também é o RDKit.
  if (!mol.has_coords()) mol.set_new_coords();

  const inchi = mol.get_inchi();

  return {
    smiles: mol.get_smiles(),
    formula: formulaOf(mol),
    inchi,
    inchiKey: rdkit.get_inchikey_for_inchi(inchi),
    molblock: mol.get_molblock(),
    descriptors: descriptorsOf(mol),
    groups: detectFunctionalGroups(rdkit, mol),
    atomHydrogens: hydrogensOf(mol),
    stereo: stereoOf(mol),
  };
}

/**
 * Fórmula em notação de Hill, contando os átomos que o RDKit percebeu —
 * inclusive os hidrogênios implícitos que ele mesmo completou.
 */
function formulaOf(mol: JSMol): string {
  const document = parseJson<JsonDocument>(mol.get_json());
  const counts = new Map<string, number>();

  const add = (symbol: string, amount: number): void => {
    if (amount <= 0) return;
    counts.set(symbol, (counts.get(symbol) ?? 0) + amount);
  };

  for (const atom of resolveAtoms(document)) {
    add(elementSymbol(atom.atomicNumber), 1);
    add('H', atom.implicitHydrogens);
  }

  return hillFormula(counts);
}

/** Quantos hidrogênios o RDKit completou em cada átomo. */
function hydrogensOf(mol: JSMol): number[] {
  const document = parseJson<JsonDocument>(mol.get_json());
  return resolveAtoms(document).map((atom) => atom.implicitHydrogens);
}

/**
 * O que o RDKit devolve em `get_stereo_tags`.
 *
 * As duas listas têm formatos diferentes, e a diferença tem razão de ser: um
 * centro é um átomo (`[1, "(R)"]`), e uma geometria de dupla é uma ligação entre
 * dois (`[1, 2, "(E)"]`).
 */
interface StereoTags {
  readonly CIP_atoms?: readonly (readonly [number, string])[];
  readonly CIP_bonds?: readonly (readonly [number, number, string])[];
}

/**
 * Configuração de cada centro, no vocabulário de Cahn–Ingold–Prelog.
 *
 * Quem atribui R, S, E e Z é o RDKit, lendo as cunhas do desenho — a regra de
 * prioridade CIP tem casos que ninguém acerta de cabeça, e escrever isso à mão
 * seria justamente o tipo de perícia química que o D-01 proíbe.
 *
 * O rótulo vem entre parênteses (`(R)`), e aqui ele perde os parênteses: a tela
 * põe a letra ao lado do átomo, e parêntese ali seria enfeite.
 *
 * Centro sem configuração vem como `?` — e isso não é ausência de resposta, é a
 * resposta: existe um centro aqui e o desenho não disse de que lado. É o que
 * permite apontar na tela onde falta a cunha.
 */
function stereoOf(mol: JSMol): StereoLabels {
  const tags = parseJson<StereoTags>(mol.get_stereo_tags());
  const clean = (label: string): string => label.replace(/[()]/g, '');

  const atoms = (tags.CIP_atoms ?? [])
    .map(([index, label]) => ({ index, label: clean(label) }))
    .filter((entry) => entry.label !== '');

  const bonds = (tags.CIP_bonds ?? [])
    .map(([first, second, label]) => ({
      atoms: [first, second] as readonly [number, number],
      label: clean(label),
    }))
    .filter((entry) => entry.label !== '');

  return { atoms, bonds };
}

/** Traduz o mapa de descritores do RDKit para os nomes usados no produto. */
function descriptorsOf(mol: JSMol): Descriptors {
  const raw = parseJson<RDKitDescriptors>(mol.get_descriptors());

  return {
    molarMass: raw.amw,
    exactMass: raw.exactmw,
    tpsa: raw.tpsa,
    logP: raw.CrippenClogP,
    molarRefractivity: raw.CrippenMR,
    heavyAtoms: raw.NumHeavyAtoms,
    heteroatoms: raw.NumHeteroatoms,
    rotatableBonds: raw.NumRotatableBonds,
    hbDonors: raw.NumHBD,
    hbAcceptors: raw.NumHBA,
    rings: raw.NumRings,
    aromaticRings: raw.NumAromaticRings,
    aromaticHeterocycles: raw.NumAromaticHeterocycles,
    fractionCsp3: raw.FractionCSP3,
    amideBonds: raw.NumAmideBonds,
    stereocenters: raw.NumAtomStereoCenters,
    unspecifiedStereocenters: raw.NumUnspecifiedAtomStereoCenters,
  };
}

/**
 * Descobre por que o RDKit recusou a estrutura.
 *
 * A estratégia: se ela nem sem sanitizar é legível, o problema é de leitura. Se
 * é legível, procuramos um átomo com ligações demais — é o erro de longe mais
 * comum e o único que dá para nomear com certeza. Sem átomo culpado, a mensagem
 * fica genérica de propósito: melhor não explicar do que explicar errado.
 */
function diagnose(rdkit: RDKitModule, input: string): ChemistryError {
  const unsanitized = parseMol(rdkit, input, JSON.stringify({ sanitize: false }));

  if (unsanitized === null) {
    return {
      code: 'invalid_syntax',
      message:
        'Não consegui ler essa estrutura. Verifique se todos os anéis estão fechados e se os símbolos dos elementos existem.',
    };
  }

  try {
    const document = parseJson<JsonDocument>(unsanitized.get_json());

    for (const atom of resolveAtoms(document)) {
      if (atom.charge !== 0) continue;

      const symbol = elementSymbol(atom.atomicNumber);
      const max = maxValence(symbol);
      if (max === null) continue;

      const bonds = atom.bondOrderSum + atom.implicitHydrogens;
      if (bonds > max) {
        return {
          code: 'valence_exceeded',
          message: `O átomo de ${symbol} tem ${String(bonds)} ligações, mas suporta no máximo ${String(max)}.`,
          atom: { index: atom.index, symbol, bonds, max },
        };
      }
    }

    if (looksAromatic(input)) {
      return {
        code: 'impossible_aromaticity',
        message:
          'Há um anel marcado como aromático que não fecha: não existe alternância de ligações simples e duplas que satisfaça a valência de todos os átomos dele.',
      };
    }

    return {
      code: 'invalid_structure',
      message:
        'Essa estrutura não passa na verificação química: os átomos estão legíveis, mas o arranjo entre eles não descreve uma molécula possível.',
    };
  } finally {
    unsanitized.delete();
  }
}

/**
 * Lê a estrutura sem deixar exceção do WebAssembly vazar.
 *
 * O RDKit devolve `null` para quase toda entrada ruim, mas em alguns casos —
 * molblock sem nenhum átomo, por exemplo — ele lança de dentro do WASM, e a
 * exceção chega aqui como um número sem significado nenhum para o usuário.
 */
function parseMol(rdkit: RDKitModule, input: string, details?: string): JSMol | null {
  try {
    return details === undefined ? rdkit.get_mol(input) : rdkit.get_mol(input, details);
  } catch {
    return null;
  }
}

/** Tela em branco não é erro de química: é só nada desenhado ainda. */
function drawsNothing(input: string): boolean {
  if (input.trim() === '') return true;

  // Num molblock, a quarta linha conta os átomos nas três primeiras colunas.
  const counts = input.split(/\r?\n/)[3];
  if (counts === undefined) return false;

  return Number.parseInt(counts.slice(0, 3).trim(), 10) === 0;
}

/** Heurística de texto, usada só para escolher a mensagem — nunca para julgar. */
function looksAromatic(input: string): boolean {
  return /[bcnops]\d/.test(input);
}
