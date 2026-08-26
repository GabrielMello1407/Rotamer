import { describe, expect, it } from 'vitest';
import { analyze } from '../src/chemistry/analysis';
import type { FunctionalGroupId } from '../src/chemistry/groups';

/**
 * Grupo funcional é o vocabulário da orgânica: é assim que a missão pede
 * ("monte um éster") e é assim que o aluno lê a própria molécula. Quem
 * reconhece é o RDKit, casando SMARTS — nada aqui é palpite.
 */
async function groupsOf(smiles: string): Promise<Map<FunctionalGroupId, number>> {
  const result = await analyze(smiles);
  if (!result.ok) throw new Error(`esperava molécula, veio erro: ${result.error.message}`);

  return new Map(result.molecule.groups.map((group) => [group.id, group.count]));
}

describe('reconhecimento de grupos', () => {
  it('etanol é álcool', async () => {
    const groups = await groupsOf('CCO');

    expect(groups.get('alcohol')).toBe(1);
    expect(groups.has('ether')).toBe(false);
  });

  it('ácido acético é ácido carboxílico, e não éster', async () => {
    const groups = await groupsOf('CC(=O)O');

    expect(groups.get('carboxylicAcid')).toBe(1);
    expect(groups.has('ester')).toBe(false);
    expect(groups.has('ketone')).toBe(false);
  });

  it('aspirina é éster e ácido ao mesmo tempo', async () => {
    const groups = await groupsOf('CC(=O)Oc1ccccc1C(=O)O');

    expect(groups.get('ester')).toBe(1);
    expect(groups.get('carboxylicAcid')).toBe(1);
  });

  it('paracetamol é amida e fenol', async () => {
    const groups = await groupsOf('CC(=O)Nc1ccc(O)cc1');

    expect(groups.get('amide')).toBe(1);
    expect(groups.get('phenol')).toBe(1);
    // Fenol não é álcool: o OH está no anel aromático, e a química é outra.
    expect(groups.has('alcohol')).toBe(false);
  });

  it('a cafeína tem duas amidas, não três', async () => {
    const groups = await groupsOf('Cn1cnc2c1c(=O)n(C)c(=O)n2C');

    // São duas carbonilas. O padrão casa três vezes porque uma delas fica
    // entre dois nitrogênios — contar por carbonila é o que dá o número certo.
    expect(groups.get('amide')).toBe(2);
  });

  it('anidrido acético é anidrido, e não dois ésteres', async () => {
    const groups = await groupsOf('CC(=O)OC(=O)C');

    expect(groups.get('anhydride')).toBe(1);
    expect(groups.has('ester')).toBe(false);
  });

  it('separa as aminas por quantos carbonos seguram o nitrogênio', async () => {
    expect((await groupsOf('CCN')).get('primaryAmine')).toBe(1);
    expect((await groupsOf('CNC')).get('secondaryAmine')).toBe(1);
    expect((await groupsOf('CN(C)C')).get('tertiaryAmine')).toBe(1);

    // Amida não é amina: o nitrogênio ao lado da carbonila tem outra química.
    expect((await groupsOf('CC(=O)N')).has('primaryAmine')).toBe(false);
  });

  it('reconhece insaturação, haleto e enxofre', async () => {
    expect((await groupsOf('C=C')).get('alkene')).toBe(1);
    expect((await groupsOf('C#C')).get('alkyne')).toBe(1);
    expect((await groupsOf('CCCl')).get('haloalkane')).toBe(1);
    expect((await groupsOf('CCS')).get('thiol')).toBe(1);
    expect((await groupsOf('CSC')).get('sulfide')).toBe(1);
    expect((await groupsOf('CC#N')).get('nitrile')).toBe(1);
  });

  it('benzeno não tem grupo funcional nenhum', async () => {
    const groups = await groupsOf('c1ccccc1');
    expect(groups.size).toBe(0);
  });
});

describe('desenho plano', () => {
  it('o SVG da estrutura vem do próprio RDKit', async () => {
    const { depict } = await import('../src/chemistry/depiction');
    const svg = await depict('CC(=O)Oc1ccccc1C(=O)O');

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('estrutura impossível não vira desenho', async () => {
    const { depict } = await import('../src/chemistry/depiction');

    expect(await depict('C(C)(C)(C)(C)C')).toBeNull();
    expect(await depict('   ')).toBeNull();
  });
});

describe('hidrogênios de cada átomo', () => {
  it('o RDKit conta o que o desenho não mostra', async () => {
    const resultado = await analyze('CCO');
    if (!resultado.ok) throw new Error('etanol deveria ser válido');

    // Etanol: CH3, CH2, OH — três, dois, um.
    expect(resultado.molecule.atomHydrogens).toEqual([3, 2, 1]);
  });

  it('é isso que permite escrever OH em vez de O solto', async () => {
    const resultado = await analyze('CC(=O)O');
    if (!resultado.ok) throw new Error('ácido acético deveria ser válido');

    // CH3, C da carbonila, O da dupla, OH.
    expect(resultado.molecule.atomHydrogens).toEqual([3, 0, 0, 1]);
  });

  it('a contagem tem um número por átomo pesado, na ordem da estrutura', async () => {
    const resultado = await analyze('Cn1cnc2c1c(=O)n(C)c(=O)n2C');
    if (!resultado.ok) throw new Error('cafeína deveria ser válida');

    expect(resultado.molecule.atomHydrogens).toHaveLength(14);
    expect(resultado.molecule.atomHydrogens.reduce((total, n) => total + n, 0)).toBe(10);
  });
});
