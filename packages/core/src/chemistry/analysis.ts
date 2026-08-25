import type { JSMol, RDKitModule } from '@rdkit/rdkit';
import { elementSymbol, hillFormula, maxValence } from './elements';
import {
  parseJson,
  resolveAtoms,
  type JsonDocument,
  type RDKitDescriptors,
} from './rdkit-json';
import { loadRDKit, type RDKitOptions } from './rdkit';
import type { AnalysisResult, ChemistryError, Descriptors, Molecule } from './types';

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
  if (input.trim() === '') {
    return { ok: false, error: NOTHING_DRAWN };
  }

  const rdkit = await loadRDKit(options);
  const mol = rdkit.get_mol(input);

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
  const inchi = mol.get_inchi();

  return {
    smiles: mol.get_smiles(),
    formula: formulaOf(mol),
    inchi,
    inchiKey: rdkit.get_inchikey_for_inchi(inchi),
    molblock: mol.get_molblock(),
    descriptors: descriptorsOf(mol),
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
  const unsanitized = rdkit.get_mol(input, JSON.stringify({ sanitize: false }));

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

/** Heurística de texto, usada só para escolher a mensagem — nunca para julgar. */
function looksAromatic(input: string): boolean {
  return /[bcnops]\d/.test(input);
}
