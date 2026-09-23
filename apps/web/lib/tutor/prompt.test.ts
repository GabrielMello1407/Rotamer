import { analyze, configureRDKit, type Molecule } from '@rotamer/core';
import { packageFactory } from '@rotamer/core/chemistry/node';
import { goalLabel, evaluateQuest, findQuest } from '@rotamer/quests';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildPrompt, referenceValues, systemRules } from './prompt';

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

/** Os objetivos com veredito e frase, do jeito que a ação do tutor os monta. */
async function objetivosDaAspirina(
  slug: string,
  locale: 'pt-BR' | 'en',
): Promise<{ molecula: Molecule; quest: ReturnType<typeof findQuest>; goals: { met: boolean; label: string }[] }> {
  const quest = findQuest(slug, locale);
  if (!quest) throw new Error('missão sumiu do catálogo');

  const molecula = await aspirina();
  const veredito = evaluateQuest(quest, molecula);

  const goals = quest.goals.map((goal) => ({
    met: veredito.goals.find((entry) => entry.id === goal.id)?.met === true,
    label: goalLabel(locale, goal.condition),
  }));

  return { molecula, quest, goals };
}

describe('regras do sistema', () => {
  it('proíbem recalcular, contradizer e escrever número', () => {
    expect(systemRules('pt-BR')).toContain('NUNCA recalcule');
    expect(systemRules('pt-BR')).toContain('NUNCA escreva um número');
    expect(systemRules('pt-BR')).toContain('atividade biológica');
  });

  /**
   * A regra que não se quebra atravessa o idioma. Um tutor em inglês sem a
   * proibição de recalcular seria o mesmo produto sem a sua única garantia.
   */
  it('proíbem o mesmo em inglês', () => {
    expect(systemRules('en')).toContain('NEVER recompute');
    expect(systemRules('en')).toContain('NEVER write a number');
    expect(systemRules('en')).toContain('biological activity');
  });

  it('listam as referências disponíveis, nos dois idiomas', () => {
    for (const locale of ['pt-BR', 'en'] as const) {
      expect(systemRules(locale)).toContain('{{tpsa}}');
      expect(systemRules(locale)).toContain('{{formula}}');
    }
  });

  /** Instruir o idioma da resposta é o que faz a tela inteira falar um só. */
  it('mandam responder no idioma de quem perguntou', () => {
    expect(systemRules('pt-BR')).toContain('português do Brasil');
    expect(systemRules('en')).toContain('Write in English');
  });
});

describe('contexto', () => {
  it('leva os descritores prontos, com unidade', async () => {
    const molecula = await aspirina();
    const prompt = buildPrompt({
      molecule: molecula,
      quest: null,
      goals: [],
      kind: 'proximo-passo',
      locale: 'pt-BR',
    });

    expect(prompt).toContain('C9H8O4');
    expect(prompt).toContain('180.16 g/mol');
    expect(prompt).toContain('63.60 Å²');
    expect(prompt).toContain('não recalcule');
  });

  /**
   * **O número no prompt vai sempre com ponto decimal**, qualquer que seja o
   * idioma da resposta. `180,16` pode ser lido como dois números ou como
   * cento e oitenta mil e dezesseis, e o modelo é instruído a nunca recalcular
   * justamente porque não se pode confiar nele para desfazer essa ambiguidade.
   */
  it('nunca manda vírgula decimal para o modelo, nem em português', async () => {
    const prompt = buildPrompt({
      molecule: await aspirina(),
      quest: null,
      goals: [],
      kind: 'proximo-passo',
      locale: 'pt-BR',
    });

    expect(prompt).not.toContain('180,16');
    expect(prompt).not.toContain('63,60');
  });

  it('nomeia os grupos funcionais reconhecidos pelo RDKit', async () => {
    const prompt = buildPrompt({
      molecule: await aspirina(),
      quest: null,
      goals: [],
      kind: 'entender-a-molecula',
      locale: 'pt-BR',
    });

    expect(prompt).toContain('éster');
    expect(prompt).toContain('ácido carboxílico');
  });

  it('nomeia os mesmos grupos em inglês quando a resposta é em inglês', async () => {
    const prompt = buildPrompt({
      molecule: await aspirina(),
      quest: null,
      goals: [],
      kind: 'entender-a-molecula',
      locale: 'en',
    });

    expect(prompt).toContain('ester');
    expect(prompt).toContain('carboxylic acid');
  });

  it('leva o veredito da missão já decidido, objetivo por objetivo', async () => {
    const { molecula, quest, goals } = await objetivosDaAspirina(
      'ester-de-quatro-carbonos',
      'pt-BR',
    );

    const prompt = buildPrompt({
      molecule: molecula,
      quest: quest ?? null,
      goals,
      kind: 'por-que-nao-fechou',
      locale: 'pt-BR',
    });

    // A aspirina tem éster, mas nove carbonos: um objetivo cumprido, outro não.
    expect(prompt).toContain('[cumprido]');
    expect(prompt).toContain('[em aberto]');
  });

  it('sem missão, diz que a pessoa está desenhando livremente', async () => {
    const prompt = buildPrompt({
      molecule: await aspirina(),
      quest: null,
      goals: [],
      kind: 'proximo-passo',
      locale: 'pt-BR',
    });

    expect(prompt).toContain('Não há missão em curso');
  });
});

describe('valores de referência', () => {
  /**
   * Estes são os que a interface escreve na tela no lugar de `{{tpsa}}` — e
   * na tela o separador decimal é o do idioma de quem lê. É o caminho oposto
   * ao do prompt, de propósito.
   */
  it('saem com vírgula decimal em português', async () => {
    const valores = referenceValues('pt-BR', await aspirina());

    expect(valores.molarMass).toBe('180,16 g/mol');
    expect(valores.tpsa).toBe('63,60 Å²');
    expect(valores.rotatableBonds).toBe('2');
    expect(valores.formula).toBe('C9H8O4');
  });

  it('e com ponto decimal em inglês', async () => {
    const valores = referenceValues('en', await aspirina());

    expect(valores.molarMass).toBe('180.16 g/mol');
    expect(valores.tpsa).toBe('63.60 Å²');
    expect(valores.formula).toBe('C9H8O4');
  });
});
