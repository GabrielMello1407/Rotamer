import { describe, expect, it } from 'vitest';
import { analyze } from '../src/chemistry/analysis';
import type { Molecule } from '../src/chemistry/types';

/**
 * Casos de referência do produto. Se algum destes quebrar, a química quebrou.
 *
 * Os valores são os que o **RDKit** calcula — não os do PubChem. Onde as duas
 * fontes divergem, a divergência está anotada no caso: o produto mostra o que o
 * motor determinístico calculou e não maquia número para bater com tabela.
 */
interface ReferenceCase {
  readonly name: string;
  readonly smiles: string;
  readonly formula: string;
  readonly molarMass: number;
  readonly tpsa: number;
  readonly inchiKey: string;
  readonly aromaticRings: number;
  readonly note?: string;
}

const REFERENCE: readonly ReferenceCase[] = [
  {
    name: 'etanol',
    smiles: 'CCO',
    formula: 'C2H6O',
    molarMass: 46.07,
    tpsa: 20.23,
    inchiKey: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N',
    aromaticRings: 0,
  },
  {
    name: 'ácido acético',
    smiles: 'CC(=O)O',
    formula: 'C2H4O2',
    molarMass: 60.05,
    tpsa: 37.3,
    inchiKey: 'QTBSBXVTEAMEQO-UHFFFAOYSA-N',
    aromaticRings: 0,
  },
  {
    name: 'benzeno',
    smiles: 'c1ccccc1',
    formula: 'C6H6',
    molarMass: 78.11,
    tpsa: 0,
    inchiKey: 'UHOVQNZJYSORNB-UHFFFAOYSA-N',
    aromaticRings: 1,
  },
  {
    name: 'paracetamol',
    smiles: 'CC(=O)Nc1ccc(O)cc1',
    formula: 'C8H9NO2',
    molarMass: 151.16,
    tpsa: 49.33,
    inchiKey: 'RZVAJINKPMORJF-UHFFFAOYSA-N',
    aromaticRings: 1,
  },
  {
    name: 'aspirina',
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
    formula: 'C9H8O4',
    molarMass: 180.16,
    tpsa: 63.6,
    inchiKey: 'BSYNRYMUTXBXSQ-UHFFFAOYSA-N',
    aromaticRings: 1,
  },
  {
    name: 'cafeína',
    smiles: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C',
    formula: 'C8H10N4O2',
    molarMass: 194.19,
    // O PubChem publica 58,44 Å². O RDKit calcula 61,82 Å² porque a percepção
    // de aromaticidade dele muda a contribuição dos nitrogênios na soma de
    // Ertl. Quem manda aqui é o RDKit.
    tpsa: 61.82,
    inchiKey: 'RYYVLZVUVIJVGH-UHFFFAOYSA-N',
    aromaticRings: 2,
    note: 'o anel de cinco com nitrogênio precisa ser aromático',
  },
];

async function requireMolecule(smiles: string): Promise<Molecule> {
  const result = await analyze(smiles);
  if (!result.ok) {
    throw new Error(`esperava molécula válida, veio erro: ${result.error.message}`);
  }
  return result.molecule;
}

describe('moléculas de referência', () => {
  for (const reference of REFERENCE) {
    describe(reference.name, () => {
      it('tem a fórmula esperada', async () => {
        const molecule = await requireMolecule(reference.smiles);
        expect(molecule.formula).toBe(reference.formula);
      });

      it('tem a massa molar esperada', async () => {
        const molecule = await requireMolecule(reference.smiles);
        expect(molecule.descriptors.molarMass).toBeCloseTo(reference.molarMass, 2);
      });

      it('tem a TPSA esperada', async () => {
        const molecule = await requireMolecule(reference.smiles);
        expect(molecule.descriptors.tpsa).toBeCloseTo(reference.tpsa, 2);
      });

      it('tem a InChIKey esperada', async () => {
        const molecule = await requireMolecule(reference.smiles);
        expect(molecule.inchiKey).toBe(reference.inchiKey);
      });

      it(reference.note ?? 'conta os anéis aromáticos', async () => {
        const molecule = await requireMolecule(reference.smiles);
        expect(molecule.descriptors.aromaticRings).toBe(reference.aromaticRings);
      });
    });
  }
});

describe('cafeína — o caso que o kernel próprio errava', () => {
  it('reconhece o imidazol como aromático de verdade', async () => {
    const caffeine = await requireMolecule('Cn1cnc2c1c(=O)n(C)c(=O)n2C');

    // Dois anéis, os dois aromáticos e os dois com nitrogênio: o de seis
    // (pirimidinodiona) e o de cinco (imidazol). Um detector caseiro só pega o
    // de seis — foi exatamente esse o erro que motivou trocar por RDKit.
    expect(caffeine.descriptors.rings).toBe(2);
    expect(caffeine.descriptors.aromaticRings).toBe(2);
    expect(caffeine.descriptors.aromaticHeterocycles).toBe(2);
  });
});

describe('aspirina', () => {
  it('conta ligações rotacionáveis pela definição estrita do RDKit', async () => {
    const aspirin = await requireMolecule('CC(=O)Oc1ccccc1C(=O)O');

    // O PubChem conta 3. O RDKit, na definição estrita, conta 2 — a ligação do
    // éster não entra. Cada um está certo dentro da própria definição; o
    // produto mostra a do RDKit e diz qual é.
    expect(aspirin.descriptors.rotatableBonds).toBe(2);
  });

  it('é ácido, éster e aromático ao mesmo tempo', async () => {
    const aspirin = await requireMolecule('CC(=O)Oc1ccccc1C(=O)O');
    expect(aspirin.descriptors.aromaticRings).toBe(1);
    expect(aspirin.descriptors.hbDonors).toBe(1);
    expect(aspirin.descriptors.hbAcceptors).toBe(3);
  });
});

describe('a molécula é função pura do que se desenha', () => {
  it('a mesma estrutura escrita de dois jeitos dá a mesma InChIKey', async () => {
    const asDrawn = await requireMolecule('OCC');
    const canonical = await requireMolecule('CCO');

    expect(asDrawn.inchiKey).toBe(canonical.inchiKey);
    expect(asDrawn.smiles).toBe(canonical.smiles);
  });

  it('aceita molblock, não só SMILES', async () => {
    const fromSmiles = await requireMolecule('CC(=O)Oc1ccccc1C(=O)O');
    const fromMolblock = await requireMolecule(fromSmiles.molblock);

    expect(fromMolblock.inchiKey).toBe(fromSmiles.inchiKey);
    expect(fromMolblock.formula).toBe('C9H8O4');
  });
});
