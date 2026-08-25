import { analyze, type Molecule } from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import { CATALOG, findQuest, questsOfTrack } from '../src/catalog';
import { countElements } from '../src/conditions';
import { evaluateAnalysis, evaluateQuest } from '../src/evaluate';

/**
 * A nota da missão nunca é opinião: ela sai da comparação com números que o
 * RDKit calculou. Estes testes montam a molécula de verdade e conferem o
 * veredito.
 */
async function moleculeOf(smiles: string): Promise<Molecule> {
  const result = await analyze(smiles);
  if (!result.ok) throw new Error(`esperava molécula, veio erro: ${result.error.message}`);
  return result.molecule;
}

function quest(slug: string) {
  const found = findQuest(slug);
  if (!found) throw new Error(`missão ${slug} não existe no catálogo`);
  return found;
}

describe('catálogo', () => {
  it('tem entre 12 e 15 missões, como o escopo do MVP manda', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(12);
    expect(CATALOG.length).toBeLessThanOrEqual(15);
  });

  it('não repete slug', () => {
    const slugs = CATALOG.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('cobre as três trilhas com missão, e deixa Otimização de fora', () => {
    expect(questsOfTrack('structure').length).toBeGreaterThan(0);
    expect(questsOfTrack('geometry').length).toBeGreaterThan(0);
    expect(questsOfTrack('property').length).toBeGreaterThan(0);

    // A trilha Otimização é ferramenta livre: sem missão, sem pontuação (D-09).
    const trilhas = new Set(CATALOG.map((entry) => entry.track));
    expect([...trilhas].sort()).toEqual(['geometry', 'property', 'structure']);
  });

  it('toda missão tem objetivo e dica escritos à mão', () => {
    for (const entry of CATALOG) {
      expect(entry.goals.length).toBeGreaterThan(0);
      expect(entry.hints.length).toBeGreaterThan(0);
      expect(entry.brief.length).toBeGreaterThan(40);
    }
  });
});

describe('fórmula', () => {
  it('conta os átomos de cada elemento', () => {
    expect(countElements('C9H8O4').get('C')).toBe(9);
    expect(countElements('C9H8O4').get('O')).toBe(4);
    expect(countElements('CH4').get('H')).toBe(4);
    expect(countElements('C8H10N4O2').get('N')).toBe(4);
    // Elemento de duas letras não vira dois elementos.
    expect(countElements('C2H5Cl').get('Cl')).toBe(1);
  });
});

describe('veredito', () => {
  it('metano cumpre a primeira missão', async () => {
    const resultado = evaluateQuest(quest('primeiro-carbono'), await moleculeOf('C'));

    expect(resultado.passed).toBe(true);
    expect(resultado.score).toBe(100);
  });

  it('etanol cumpre a missão do álcool; metanol não', async () => {
    const missao = quest('alcool-de-dois-carbonos');

    expect(evaluateQuest(missao, await moleculeOf('CCO')).passed).toBe(true);

    const metanol = evaluateQuest(missao, await moleculeOf('CO'));
    expect(metanol.passed).toBe(false);
    expect(metanol.goals.find((goal) => goal.id === 'alcool')?.met).toBe(true);
    expect(metanol.goals.find((goal) => goal.id === 'carbonos')?.met).toBe(false);
  });

  it('acetato de etila é o éster de quatro carbonos; ácido butanoico não', async () => {
    const missao = quest('ester-de-quatro-carbonos');

    expect(evaluateQuest(missao, await moleculeOf('CCOC(=O)C')).passed).toBe(true);
    expect(evaluateQuest(missao, await moleculeOf('CCCC(=O)O')).passed).toBe(false);
  });

  it('propanona passa na missão da cetona; propanal não', async () => {
    const missao = quest('cetona-de-tres-carbonos');

    expect(evaluateQuest(missao, await moleculeOf('CC(=O)C')).passed).toBe(true);
    expect(evaluateQuest(missao, await moleculeOf('CCC=O')).passed).toBe(false);
  });

  it('eteno trava a rotação; etano não', async () => {
    const missao = quest('ligacao-que-nao-gira');

    expect(evaluateQuest(missao, await moleculeOf('C=C')).passed).toBe(true);
    expect(evaluateQuest(missao, await moleculeOf('CC')).passed).toBe(false);
  });

  it('a aspirina cabe na regra dos cinco', async () => {
    const resultado = evaluateQuest(quest('regra-de-lipinski'), await moleculeOf('CC(=O)Oc1ccccc1C(=O)O'));
    expect(resultado.passed).toBe(true);
  });

  it('a cafeína tem dois anéis', async () => {
    const resultado = evaluateQuest(quest('dois-aneis'), await moleculeOf('Cn1cnc2c1c(=O)n(C)c(=O)n2C'));
    expect(resultado.passed).toBe(true);
  });

  it('a glicose é polar e pequena; a glicina fica no meio do caminho', async () => {
    // Glicose de cadeia aberta: cinco hidroxilas e um aldeído somam muita área
    // polar em pouca massa.
    const glicose = evaluateQuest(quest('polar-e-leve'), await moleculeOf('OCC(O)C(O)C(O)C(O)C=O'));
    expect(glicose.passed).toBe(true);

    // A glicina é leve, mas a área polar dela ainda não chega a 80 Å².
    const glicina = evaluateQuest(quest('polar-e-leve'), await moleculeOf('NCC(=O)O'));
    expect(glicina.passed).toBe(false);
    expect(glicina.score).toBe(50);
  });

  it('a nota é proporcional ao que já foi cumprido', async () => {
    // Ácido acético cumpre o ácido carboxílico mas erra a contagem de carbonos.
    const resultado = evaluateQuest(quest('ester-de-quatro-carbonos'), await moleculeOf('CC(=O)O'));

    expect(resultado.passed).toBe(false);
    expect(resultado.met).toBe(0);
    expect(resultado.score).toBe(0);

    const meio = evaluateQuest(quest('alcool-de-dois-carbonos'), await moleculeOf('CO'));
    expect(meio.score).toBe(50);
  });
});

describe('estrutura inválida', () => {
  it('não reprova a missão nem dá nota', async () => {
    const resultado = evaluateAnalysis(quest('primeiro-carbono'), await analyze('C(C)(C)(C)(C)C'));

    expect(resultado.passed).toBe(false);
    expect(resultado.score).toBe(0);
    expect(resultado.goals.every((goal) => !goal.met)).toBe(true);
  });

  it('tela em branco também não', () => {
    const resultado = evaluateAnalysis(quest('primeiro-carbono'), null);
    expect(resultado.passed).toBe(false);
  });
});
