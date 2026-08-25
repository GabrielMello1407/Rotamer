/**
 * Leitura do JSON que o RDKit devolve — tanto o formato commonchem de
 * `get_json()` quanto o mapa de descritores de `get_descriptors()`.
 *
 * O commonchem é esparso: cada átomo e cada ligação só trazem os campos que
 * diferem do bloco `defaults`.
 */

export interface JsonAtom {
  readonly z?: number;
  readonly impHs?: number;
  readonly chg?: number;
}

export interface JsonBond {
  readonly bo?: number;
  readonly atoms: readonly number[];
}

export interface JsonStructure {
  readonly atoms: readonly JsonAtom[];
  readonly bonds: readonly JsonBond[];
}

export interface JsonDocument {
  readonly defaults: {
    readonly atom: { readonly z: number; readonly impHs: number; readonly chg: number };
    readonly bond: { readonly bo: number };
  };
  readonly molecules: readonly JsonStructure[];
}

/** `JSON.parse` com o tipo declarado por quem chama. */
export function parseJson<T>(text: string): T {
  return JSON.parse(text) as T;
}

/** Átomo já resolvido contra os `defaults` do documento. */
export interface ResolvedAtom {
  readonly index: number;
  readonly atomicNumber: number;
  readonly implicitHydrogens: number;
  readonly charge: number;
  /** Soma das ordens das ligações que chegam neste átomo. */
  readonly bondOrderSum: number;
}

/**
 * Resolve a primeira estrutura do documento contra os `defaults` e soma a ordem
 * das ligações de cada átomo. É contagem, não perícia química: o veredito de
 * validade continua sendo do RDKit.
 */
export function resolveAtoms(document: JsonDocument): ResolvedAtom[] {
  const structure = document.molecules[0];
  if (!structure) return [];

  const fallback = document.defaults;
  const orders = new Array<number>(structure.atoms.length).fill(0);

  for (const bond of structure.bonds) {
    const order = bond.bo ?? fallback.bond.bo;
    for (const index of bond.atoms) {
      const current = orders[index];
      if (current !== undefined) orders[index] = current + order;
    }
  }

  return structure.atoms.map((atom, index) => ({
    index,
    atomicNumber: atom.z ?? fallback.atom.z,
    implicitHydrogens: atom.impHs ?? fallback.atom.impHs,
    charge: atom.chg ?? fallback.atom.chg,
    bondOrderSum: orders[index] ?? 0,
  }));
}

/** Mapa de descritores do RDKit, com os nomes originais da biblioteca. */
export interface RDKitDescriptors {
  readonly amw: number;
  readonly exactmw: number;
  readonly tpsa: number;
  readonly CrippenClogP: number;
  readonly CrippenMR: number;
  readonly NumHeavyAtoms: number;
  readonly NumHeteroatoms: number;
  readonly NumRotatableBonds: number;
  readonly NumHBD: number;
  readonly NumHBA: number;
  readonly NumRings: number;
  readonly NumAromaticRings: number;
  readonly NumAromaticHeterocycles: number;
  readonly FractionCSP3: number;
  readonly NumAmideBonds: number;
  readonly NumAtomStereoCenters: number;
  readonly NumUnspecifiedAtomStereoCenters: number;
}
