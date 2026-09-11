import {
  addAtom,
  addBond,
  analyze,
  emptyGraph,
  setBondWedge,
  toMolblock,
  type Molecule,
} from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import { CATALOG } from '../src/catalog';
import { extractGoals } from '../src/extract';

/**
 * `extractGoals` é a extração de objetivos do D-25: o professor desenha, o
 * RDKit calcula, e só o que o RDKit calculou vira candidato. Nenhuma molécula
 * aqui é montada à mão — todas passam pela sanitização de verdade do RDKit,
 * do mesmo jeito que `packages/core/test/`.
 */
async function moleculeOf(smiles: string): Promise<Molecule> {
  const result = await analyze(smiles);
  if (!result.ok) throw new Error(`esperava molécula, veio erro: ${result.error.message}`);
  return result.molecule;
}

/**
 * Bromoclorofluormetano — um centro estereogênico, com a ligação ao flúor em
 * cunha ou sem cunha, conforme `wedge`. Sem cunha, o RDKit conta o centro e
 * não atribui configuração (`unspecifiedStereocenters: 1`); com cunha, o
 * centro fica configurado (`unspecifiedStereocenters: 0`).
 */
async function bromoclorofluormetano(wedge: 'none' | 'up'): Promise<Molecule> {
  let graph = emptyGraph();
  const center = addAtom(graph, { element: 'C', x: 0, y: 0 });
  graph = center.graph;

  const fluorine = addAtom(graph, { element: 'F', x: 1.5, y: 0 });
  graph = fluorine.graph;
  const chlorine = addAtom(graph, { element: 'Cl', x: -0.75, y: 1.3 });
  graph = chlorine.graph;
  const bromine = addAtom(graph, { element: 'Br', x: -0.75, y: -1.3 });
  graph = bromine.graph;

  const first = addBond(graph, center.atomId, fluorine.atomId);
  graph = first.graph;
  graph = addBond(graph, center.atomId, chlorine.atomId).graph;
  graph = addBond(graph, center.atomId, bromine.atomId).graph;
  if (first.bondId === null) throw new Error('a ligação com o flúor não foi criada');

  return moleculeOf(toMolblock(setBondWedge(graph, first.bondId, wedge)));
}

describe('extractGoals — etanol', () => {
  it('oferece a molécula exata, exclusiva', async () => {
    const etanol = await moleculeOf('CCO');
    const candidatos = extractGoals(etanol);

    const identidade = candidatos.find((candidato) => candidato.id === 'inchi-key');
    expect(identidade).toBeDefined();
    expect(identidade?.label).toBe('é exatamente esta molécula');
    expect(identidade?.measured).toBe(etanol.inchiKey);
    expect(identidade?.kind).toBe('identity');
    expect(identidade?.exclusive).toBe(true);
    expect(identidade?.condition).toEqual({ kind: 'inchiKey', value: etanol.inchiKey });
  });

  it('oferece a fórmula', async () => {
    const candidatos = extractGoals(await moleculeOf('CCO'));
    const formula = candidatos.find((candidato) => candidato.id === 'formula');

    expect(formula?.label).toBe('a fórmula é C2H6O');
    expect(formula?.measured).toBe('C2H6O');
    expect(formula?.exclusive).toBe(false);
    expect(formula?.condition).toEqual({ kind: 'formula', value: 'C2H6O' });
  });

  it('oferece o grupo álcool, no singular', async () => {
    const candidatos = extractGoals(await moleculeOf('CCO'));
    const alcool = candidatos.find((candidato) => candidato.id === 'group:alcohol:1');

    expect(alcool).toBeDefined();
    expect(alcool?.label).toBe('tem pelo menos 1 grupo álcool');
    expect(alcool?.measured).toBe('1');
    expect(alcool?.kind).toBe('group');
    expect(alcool?.condition).toEqual({ kind: 'group', group: 'alcohol', min: 1 });
  });

  it('oferece um objetivo de contagem por elemento, singular e plural corretos', async () => {
    const candidatos = extractGoals(await moleculeOf('CCO'));

    const carbono = candidatos.find((candidato) => candidato.id === 'atoms:C:2');
    expect(carbono?.label).toBe('tem exatamente 2 átomos de C');
    expect(carbono?.condition).toEqual({ kind: 'atoms', element: 'C', min: 2, max: 2 });

    const hidrogenio = candidatos.find((candidato) => candidato.id === 'atoms:H:6');
    expect(hidrogenio?.label).toBe('tem exatamente 6 átomos de H');

    const oxigenio = candidatos.find((candidato) => candidato.id === 'atoms:O:1');
    expect(oxigenio?.label).toBe('tem exatamente 1 átomo de O');
  });

  it('não oferece o InChIKey como objetivo comum e não some com nenhum contínuo', async () => {
    const candidatos = extractGoals(await moleculeOf('CCO'));

    // molarMass, exactMass, tpsa e logP são contínuos — nunca viram candidato
    // (§4.1). Testar por prefixo do id cobre os dois formatos possíveis.
    for (const contínuo of ['molarMass', 'exactMass', 'tpsa', 'logP']) {
      expect(candidatos.some((candidato) => candidato.id.includes(contínuo))).toBe(false);
    }
  });

  it('sem centro estereogênico, não oferece "nenhum centro sem configuração"', async () => {
    const candidatos = extractGoals(await moleculeOf('CCO'));
    expect(candidatos.some((candidato) => candidato.condition.kind === 'descriptor' && candidato.condition.descriptor === 'unspecifiedStereocenters')).toBe(false);
  });
});

describe('extractGoals — aspirina', () => {
  it('oferece éster e ácido carboxílico como grupos separados', async () => {
    const aspirina = await moleculeOf('CC(=O)Oc1ccccc1C(=O)O');
    const candidatos = extractGoals(aspirina);

    expect(candidatos.find((candidato) => candidato.id === 'group:ester:1')?.label).toBe(
      'tem pelo menos 1 grupo éster',
    );
    expect(candidatos.find((candidato) => candidato.id === 'group:carboxylicAcid:1')?.label).toBe(
      'tem pelo menos 1 grupo ácido carboxílico',
    );
  });

  it('os oito descritores de contagem batem caractere a caractere com o valor do RDKit', async () => {
    const aspirina = await moleculeOf('CC(=O)Oc1ccccc1C(=O)O');
    const candidatos = extractGoals(aspirina);
    const { descriptors } = aspirina;

    const esperado: Record<string, string> = {
      rings: `tem exatamente ${descriptors.rings} ${descriptors.rings === 1 ? 'anel' : 'anéis'}`,
      aromaticRings: `tem exatamente ${descriptors.aromaticRings} ${
        descriptors.aromaticRings === 1 ? 'anel aromático' : 'anéis aromáticos'
      }`,
      rotatableBonds: `tem exatamente ${descriptors.rotatableBonds} ${
        descriptors.rotatableBonds === 1 ? 'ligação rotacionável' : 'ligações rotacionáveis'
      }`,
      hbDonors: `tem exatamente ${descriptors.hbDonors} ${
        descriptors.hbDonors === 1
          ? 'doador de ligação de hidrogênio'
          : 'doadores de ligação de hidrogênio'
      }`,
      hbAcceptors: `tem exatamente ${descriptors.hbAcceptors} ${
        descriptors.hbAcceptors === 1
          ? 'aceitador de ligação de hidrogênio'
          : 'aceitadores de ligação de hidrogênio'
      }`,
      heavyAtoms: `tem exatamente ${descriptors.heavyAtoms} ${
        descriptors.heavyAtoms === 1 ? 'átomo pesado' : 'átomos pesados'
      }`,
      heteroatoms: `tem exatamente ${descriptors.heteroatoms} ${
        descriptors.heteroatoms === 1 ? 'heteroátomo' : 'heteroátomos'
      }`,
      stereocenters: `tem exatamente ${descriptors.stereocenters} ${
        descriptors.stereocenters === 1 ? 'centro estereogênico' : 'centros estereogênicos'
      }`,
    };

    for (const [descritor, label] of Object.entries(esperado)) {
      const candidato = candidatos.find(
        (item) => item.id === `descriptor:${descritor}:${descriptors[descritor as keyof typeof descriptors]}`,
      );
      expect(candidato, `candidato de ${descritor} não encontrado`).toBeDefined();
      expect(candidato?.label).toBe(label);
      expect(candidato?.condition).toEqual({
        kind: 'descriptor',
        descriptor: descritor,
        min: descriptors[descritor as keyof typeof descriptors],
        max: descriptors[descritor as keyof typeof descriptors],
      });
    }

    // Ao menos um dos oito veio no singular e um no plural nesta molécula —
    // se não viesse, o teste não estaria de fato cobrindo os dois ramos.
    expect(Object.values(esperado).some((label) => / 1 /.test(label))).toBe(true);
    expect(Object.values(esperado).some((label) => !/ 1 /.test(label))).toBe(true);
  });
});

describe('extractGoals — cafeína', () => {
  it('tem 4 N, 2 anéis e os dois aromáticos — o imidazol é aromático de verdade', async () => {
    // A cafeína é o caso do CLAUDE.md que um detector caseiro erra: o anel de
    // cinco com nitrogênio (imidazol) é aromático, e o RDKit o reconhece. O
    // `packages/core/test/molecules.test.ts` já prova `aromaticRings: 2` — os
    // dois anéis, não só o de seis. Quem manda é o RDKit (D-01): este teste
    // segue o valor calculado.
    const cafeina = await moleculeOf('Cn1cnc2c1c(=O)n(C)c(=O)n2C');
    expect(cafeina.formula).toBe('C8H10N4O2');
    expect(cafeina.descriptors.rings).toBe(2);
    expect(cafeina.descriptors.aromaticRings).toBe(2);

    const candidatos = extractGoals(cafeina);

    expect(candidatos.find((candidato) => candidato.id === 'atoms:N:4')?.label).toBe(
      'tem exatamente 4 átomos de N',
    );
    expect(candidatos.find((candidato) => candidato.id === 'descriptor:rings:2')?.label).toBe(
      'tem exatamente 2 anéis',
    );
    expect(
      candidatos.find((candidato) => candidato.id === 'descriptor:aromaticRings:2')?.label,
    ).toBe('tem exatamente 2 anéis aromáticos');
  });

  it('oferece as duas amidas como um grupo só, no plural', async () => {
    const candidatos = extractGoals(await moleculeOf('Cn1cnc2c1c(=O)n(C)c(=O)n2C'));
    const amida = candidatos.find((candidato) => candidato.id === 'group:amide:2');

    expect(amida).toBeDefined();
    expect(amida?.label).toBe('tem pelo menos 2 grupos amida');
    expect(amida?.condition).toEqual({ kind: 'group', group: 'amide', min: 2 });
  });
});

describe('centro estereogênico sem configuração', () => {
  it('sem centro estereogênico, não oferece o candidato', async () => {
    const semCentro = extractGoals(await moleculeOf('CCO'));
    expect(
      semCentro.some((candidato) => candidato.id === 'descriptor:unspecifiedStereocenters:0'),
    ).toBe(false);
  });

  it('com centro configurado (cunha), oferece o candidato e lê o valor calculado', async () => {
    const configurado = extractGoals(await bromoclorofluormetano('up'));
    const semDefinicao = configurado.find(
      (candidato) => candidato.id === 'descriptor:unspecifiedStereocenters:0',
    );

    expect(semDefinicao).toBeDefined();
    expect(semDefinicao?.label).toBe('nenhum centro estereogênico fica sem configuração');
    expect(semDefinicao?.measured).toBe('0');
    expect(semDefinicao?.condition).toEqual({
      kind: 'descriptor',
      descriptor: 'unspecifiedStereocenters',
      max: 0,
    });
  });

  it('com centro sem cunha, NÃO oferece o candidato — R-2 recusaria a missão pela própria resposta', async () => {
    // O candidato "nenhum centro fica sem
    // configuração" era oferecido mesmo quando a resposta do professor tinha
    // um centro sem configuração, e R-2 recusava a missão pela própria
    // resposta. `extractGoals` nunca deve oferecer um candidato que a
    // molécula que o originou não cumpre.
    const semConfiguracao = extractGoals(await bromoclorofluormetano('none'));
    expect(
      semConfiguracao.some((candidato) => candidato.id === 'descriptor:unspecifiedStereocenters:0'),
    ).toBe(false);
  });
});

describe('id determinístico', () => {
  it('duas análises da mesma molécula dão exatamente os mesmos ids', async () => {
    const primeira = extractGoals(await moleculeOf('CC(=O)Oc1ccccc1C(=O)O'));
    const segunda = extractGoals(await moleculeOf('CC(=O)Oc1ccccc1C(=O)O'));

    expect(segunda.map((candidato) => candidato.id)).toEqual(
      primeira.map((candidato) => candidato.id),
    );
  });
});

describe('slug de catálogo nunca contém ":"', () => {
  it('o espaço de nomes de missão de professor não se cruza com o catálogo', () => {
    for (const quest of CATALOG) {
      expect(quest.slug.includes(':')).toBe(false);
    }
  });
});
