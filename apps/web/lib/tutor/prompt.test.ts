import { analyze, configureRDKit, type Molecule } from '@rotamer/core';
import { packageFactory } from '@rotamer/core/chemistry/node';
import { evaluateQuest, findQuest } from '@rotamer/quests';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildPrompt, referenceValues, SYSTEM_RULES } from './prompt';

/**
 * O prompt recebe os números **já calculados** e manda o modelo não recalcular.
 * É a diferença entre um tutor que explica e um oráculo que chuta.
 */
beforeAll(() => {
  configureRDKit({ loadFactory: packageFactory });
});

async function aspirina(): Promise<Molecule> {
  const resultado = await analyze('CC(=O)Oc1ccccc1C(=O)O');
  if (!resultado.ok) throw new Error('a aspirina deveria ser válida');
  return resultado.molecule;
}

describe('regras do sistema', () => {
  it('proíbem recalcular, contradizer e escrever número', () => {
    expect(SYSTEM_RULES).toContain('NUNCA recalcule');
    expect(SYSTEM_RULES).toContain('NUNCA escreva um número');
    expect(SYSTEM_RULES).toContain('atividade biológica');
  });

  it('listam as referências disponíveis', () => {
    expect(SYSTEM_RULES).toContain('{{tpsa}}');
    expect(SYSTEM_RULES).toContain('{{formula}}');
  });
});

describe('contexto', () => {
  it('leva os descritores prontos, com unidade', async () => {
    const molecula = await aspirina();
    const prompt = buildPrompt({ molecule: molecula, quest: null, goals: [], kind: 'proximo-passo' });

    expect(prompt).toContain('C9H8O4');
    expect(prompt).toContain('180,16 g/mol');
    expect(prompt).toContain('63,60 Å²');
    expect(prompt).toContain('não recalcule');
  });

  it('nomeia os grupos funcionais reconhecidos pelo RDKit', async () => {
    const prompt = buildPrompt({
      molecule: await aspirina(),
      quest: null,
      goals: [],
      kind: 'entender-a-molecula',
    });

    expect(prompt).toContain('éster');
    expect(prompt).toContain('ácido carboxílico');
  });

  it('leva o veredito da missão já decidido, objetivo por objetivo', async () => {
    const missao = findQuest('ester-de-quatro-carbonos');
    if (!missao) throw new Error('missão sumiu do catálogo');

    const molecula = await aspirina();
    const prompt = buildPrompt({
      molecule: molecula,
      quest: missao,
      goals: evaluateQuest(missao, molecula).goals,
      kind: 'por-que-nao-fechou',
    });

    // A aspirina tem éster, mas nove carbonos: um objetivo cumprido, outro não.
    expect(prompt).toContain('[cumprido] tem um éster');
    expect(prompt).toContain('[em aberto] tem exatamente quatro carbonos');
  });

  it('sem missão, diz que a pessoa está desenhando livremente', async () => {
    const prompt = buildPrompt({
      molecule: await aspirina(),
      quest: null,
      goals: [],
      kind: 'proximo-passo',
    });

    expect(prompt).toContain('Não há missão em curso');
  });
});

describe('valores de referência', () => {
  it('vêm formatados em português, com vírgula decimal', async () => {
    const valores = referenceValues(await aspirina());

    expect(valores.molarMass).toBe('180,16 g/mol');
    expect(valores.tpsa).toBe('63,60 Å²');
    expect(valores.rotatableBonds).toBe('2');
    expect(valores.formula).toBe('C9H8O4');
  });
});
