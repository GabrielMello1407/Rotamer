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

/** Um centro estereogênico com configuração atribuída. */
export interface StereoLabel {
  /** Índice do átomo na estrutura, começando em zero. */
  readonly index: number;
  /** `R`, `S` — ou `?` quando o centro existe e o desenho não disse de que lado. */
  readonly label: string;
}

/**
 * Uma ligação dupla com geometria atribuída.
 *
 * Ela é identificada pelos **dois átomos**, não por um índice de ligação: é
 * assim que o RDKit devolve, e é o que sobrevive a qualquer reordenação.
 */
export interface StereoBondLabel {
  readonly atoms: readonly [number, number];
  /** `E` ou `Z`, sem parênteses. */
  readonly label: string;
}

/**
 * As configurações que o RDKit atribuiu, lendo as cunhas do desenho.
 *
 * Vazio quando não há centro definido — que é o caso da imensa maioria das
 * estruturas desenhadas em aula, e por isso a tela precisa saber diferenciar
 * "não tem centro" de "tem centro e ninguém disse de que lado".
 */
export interface StereoLabels {
  readonly atoms: readonly StereoLabel[];
  readonly bonds: readonly StereoBondLabel[];
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
  /** R, S, E e Z atribuídos pelo RDKit a partir das cunhas do desenho. */
  readonly stereo: StereoLabels;
}

/**
 * O que aconteceu com a estereoquímica ao organizar o desenho.
 *
 * Organizar redesenha as coordenadas; o RDKit reescreve as cunhas para que a
 * configuração continue a mesma na posição nova. Três coisas podem acontecer, e
 * a tela precisa poder contar cada uma:
 *
 * - uma cunha que não definia centro nenhum some — é enfeite que o desenho novo
 *   não carrega, não um traço perdido;
 * - uma cunha de um centro de verdade troca de cheia para tracejada ou o
 *   contrário — o centro é o mesmo, só está desenhado do outro lado;
 * - em qualquer um dos dois casos, a configuração de cada centro (R/S/E/Z) devia
 *   continuar a mesma. Isso não se supõe: `tidy` pergunta ao RDKit antes e
 *   depois e compara.
 */
export interface TidyStereoChanges {
  /** Cunhas que estavam no desenho de entrada e não sobreviveram no de saída. */
  readonly removedWedges: number;
  /** Cunhas que continuam ali, mas trocaram de cheia para tracejada ou vice-versa. */
  readonly flippedWedges: number;
  /**
   * Cunhas que continuam no mesmo átomo, em outra ligação dele.
   *
   * É o caso mais comum, e o que mais engana: o RDKit escolhe de qual ligação
   * do centro a cunha sai, e a escolha muda com as coordenadas. Contar isso
   * como remoção faria a tela dizer que a cunha não valia nada — para um
   * centro que continua ali, com a mesma configuração.
   */
  readonly movedWedges: number;
  /**
   * `false` quando algum centro mudou de letra (R virou S, E virou Z, etc.).
   *
   * Isso nunca deveria acontecer só de reorganizar o desenho — é defeito do
   * organizador, não do desenho do aluno, e a tela precisa poder dizer isso.
   */
  readonly sameConfiguration: boolean;
}

/** Resultado de organizar: as coordenadas novas e o relatório de estereoquímica. */
export interface TidyResult {
  /** Molblock nas coordenadas novas, na escala do editor. */
  readonly molblock: string;
  readonly stereo: TidyStereoChanges;
}

/** Código de erro químico. A interface escolhe o tratamento a partir dele. */
export type ChemistryErrorCode =
  | 'empty'
  | 'invalid_syntax'
  | 'valence_exceeded'
  | 'impossible_aromaticity'
  | 'invalid_structure'
  /**
   * A estrutura existe, mas a forma no espaço não pôde ser calculada.
   *
   * É outra categoria de recusa: não é a molécula que está errada, é o campo de
   * força que não conhece aquele elemento. Fórmula, massa e descritores
   * continuam valendo — só a cena 3D fica de fora, e a tela precisa dizer isso
   * sem transformar uma limitação nossa em erro do aluno.
   */
  | 'geometry_unavailable'
  /**
   * Nem um arranjo tridimensional saiu — o gerador de conformações desistiu.
   *
   * Também não é erro do aluno, e é uma recusa mais estreita que
   * `geometry_unavailable`: ali o cálculo falhou em algum ponto; aqui não houve
   * sequer uma primeira posição para os átomos.
   */
  | 'conformer_unavailable';

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
 * A recusa do núcleo: o código e os números que a justificam.
 *
 * **Não há frase aqui.** O núcleo não depende de ninguém e não fala idioma
 * nenhum; quem transforma `valence_exceeded` em "o átomo de C tem 5 ligações,
 * mas suporta no máximo 4" é `chemistryErrorText`, em `@rotamer/i18n`. Assim a
 * mesma recusa sai em português para a turma e em inglês para quem não lê
 * português, sem o núcleo saber que idiomas existem.
 */
export interface ChemistryError {
  readonly code: ChemistryErrorCode;
  readonly atom?: OffendingAtom;
}

/** Resultado de uma análise. Ou a molécula, ou o motivo de ela não existir. */
export type AnalysisResult =
  | { readonly ok: true; readonly molecule: Molecule }
  | { readonly ok: false; readonly error: ChemistryError };
