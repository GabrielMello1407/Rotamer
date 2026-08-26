import type { FunctionalGroup } from './groups';

/**
 * Tipos da camada química. Tudo aqui é **calculado**, nunca gerado por modelo de
 * linguagem: quem responde é o RDKit. O tutor lê estes números e explica; não os
 * recalcula e não os contradiz.
 */

/** Descritores moleculares, todos vindos diretamente do RDKit. */
export interface Descriptors {
  /** Massa molar média, em g/mol. RDKit: `amw`. */
  readonly molarMass: number;
  /** Massa monoisotópica exata, em g/mol. RDKit: `exactmw`. */
  readonly exactMass: number;
  /** Área de superfície polar topológica, em Å². RDKit: `tpsa`. */
  readonly tpsa: number;
  /** Coeficiente de partição calculado por Crippen. RDKit: `CrippenClogP`. */
  readonly logP: number;
  /** Refratividade molar de Crippen. RDKit: `CrippenMR`. */
  readonly molarRefractivity: number;
  /** Átomos diferentes de hidrogênio. RDKit: `NumHeavyAtoms`. */
  readonly heavyAtoms: number;
  /** Átomos que não são carbono nem hidrogênio. RDKit: `NumHeteroatoms`. */
  readonly heteroatoms: number;
  /**
   * Ligações rotacionáveis pela definição **estrita** do RDKit — amidas e
   * ésteres não contam. Outras bases, como o PubChem, usam definição mais larga
   * e chegam a números maiores para a mesma molécula.
   */
  readonly rotatableBonds: number;
  /** Doadores de ligação de hidrogênio. RDKit: `NumHBD`. */
  readonly hbDonors: number;
  /** Aceitadores de ligação de hidrogênio. RDKit: `NumHBA`. */
  readonly hbAcceptors: number;
  /** Anéis no menor conjunto de anéis independentes. RDKit: `NumRings`. */
  readonly rings: number;
  /** Anéis aromáticos. RDKit: `NumAromaticRings`. */
  readonly aromaticRings: number;
  /** Anéis aromáticos com heteroátomo. RDKit: `NumAromaticHeterocycles`. */
  readonly aromaticHeterocycles: number;
  /** Fração de carbonos sp³. RDKit: `FractionCSP3`. */
  readonly fractionCsp3: number;
  /** Ligações amida. RDKit: `NumAmideBonds`. */
  readonly amideBonds: number;
  /** Centros estereogênicos atribuídos. RDKit: `NumAtomStereoCenters`. */
  readonly stereocenters: number;
  /** Centros estereogênicos ainda sem configuração definida. */
  readonly unspecifiedStereocenters: number;
}

/** Uma molécula que passou pela sanitização do RDKit. */
export interface Molecule {
  /** SMILES canônico — a mesma molécula sempre produz a mesma cadeia. */
  readonly smiles: string;
  /** Fórmula molecular em notação de Hill, ex.: `C9H8O4`. */
  readonly formula: string;
  readonly inchi: string;
  /** Chave de 27 caracteres. É por ela que o cache e a deduplicação funcionam. */
  readonly inchiKey: string;
  /** Molblock 2D, entrada da geração de conformação. */
  readonly molblock: string;
  readonly descriptors: Descriptors;
  /** Grupos funcionais reconhecidos pelo RDKit, do mais específico ao menos. */
  readonly groups: readonly FunctionalGroup[];
  /**
   * Hidrogênios implícitos de cada átomo, na ordem em que eles aparecem na
   * estrutura.
   *
   * É o que permite o desenho escrever `OH` em vez de `O` solto — sem isso o
   * ácido da aspirina aparece na tela com cara de éter. Quem conta é o RDKit; o
   * editor só escreve o que ele contou.
   */
  readonly atomHydrogens: readonly number[];
}

/** Código de erro químico. A interface escolhe o tratamento a partir dele. */
export type ChemistryErrorCode =
  | 'empty'
  | 'invalid_syntax'
  | 'valence_exceeded'
  | 'impossible_aromaticity'
  | 'invalid_structure';

/** Átomo que causou o erro, quando foi possível apontar um. */
export interface OffendingAtom {
  /** Índice do átomo na estrutura, começando em zero. */
  readonly index: number;
  /** Símbolo do elemento, ex.: `C`. */
  readonly symbol: string;
  /** Ligações contadas neste átomo, contando hidrogênios e ordem de ligação. */
  readonly bonds: number;
  /** Máximo que o elemento suporta neutro. */
  readonly max: number;
}

/**
 * Erro químico em português, explicando a química e não o código.
 * "O átomo de C tem 5 ligações, mas suporta no máximo 4" — nunca "valence error".
 */
export interface ChemistryError {
  readonly code: ChemistryErrorCode;
  readonly message: string;
  readonly atom?: OffendingAtom;
}

/** Resultado de uma análise. Ou a molécula, ou o motivo de ela não existir. */
export type AnalysisResult =
  | { readonly ok: true; readonly molecule: Molecule }
  | { readonly ok: false; readonly error: ChemistryError };
