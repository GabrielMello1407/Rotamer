import { describe, expect, it } from 'vitest';
import {
  fillReferences,
  hasLooseDigits,
  tutorHintSchema,
  unknownReferences,
} from './schema';

/**
 * A fronteira do tutor.
 *
 * Um modelo de linguagem acerta noventa por cento das perguntas de valência e
 * nos outros dez por cento produz uma explicação linda, confiante e errada. O
 * schema fechado é o que impede a parte errada de virar número na tela: o texto
 * gerado não pode conter nenhum, e as referências que ele cita são trocadas pelo
 * que o RDKit calculou.
 */

describe('nenhum número escrito pelo modelo', () => {
  it('recusa texto com dígito solto', () => {
    const resultado = tutorHintSchema.safeParse({
      diagnosis: 'A massa molar é 180,16 g/mol.',
      suggestions: ['Troque o metil por etil.'],
    });

    expect(resultado.success).toBe(false);
  });

  it('aceita o mesmo texto quando o número vira referência', () => {
    const resultado = tutorHintSchema.safeParse({
      diagnosis: 'A massa molar é {{molarMass}}, já dentro do limite pedido.',
      suggestions: ['Troque o metil por etil.'],
    });

    expect(resultado.success).toBe(true);
  });

  it('aceita quantidade escrita por extenso', () => {
    const resultado = tutorHintSchema.safeParse({
      diagnosis: 'Faltam dois carbonos na cadeia principal.',
      suggestions: ['Acrescente um carbono de cada lado.'],
    });

    expect(resultado.success).toBe(true);
  });

  it('reconhece dígito escondido no meio da frase', () => {
    expect(hasLooseDigits('TPSA de 63,60 Å²')).toBe(true);
    expect(hasLooseDigits('TPSA de {{tpsa}}')).toBe(false);
    expect(hasLooseDigits('nenhum número aqui')).toBe(false);
  });
});

describe('referências', () => {
  it('recusa chave que não existe na lista fechada', () => {
    const resultado = tutorHintSchema.safeParse({
      diagnosis: 'O ponto de fusão é {{meltingPoint}}.',
      suggestions: ['Tente outra coisa.'],
    });

    expect(resultado.success).toBe(false);
    expect(unknownReferences('{{meltingPoint}} e {{tpsa}}')).toEqual(['meltingPoint']);
  });

  it('troca a referência pelo valor calculado', () => {
    const texto = fillReferences('A TPSA é {{tpsa}} e a massa é {{molarMass}}.', {
      tpsa: '63,60 Å²',
      molarMass: '180,16 g/mol',
    });

    expect(texto).toBe('A TPSA é 63,60 Å² e a massa é 180,16 g/mol.');
  });

  it('referência sem valor some em vez de aparecer crua', () => {
    expect(fillReferences('logP {{logP}}', {})).toBe('logP ');
  });
});

describe('forma da resposta', () => {
  it('exige diagnóstico e pelo menos uma sugestão', () => {
    expect(tutorHintSchema.safeParse({ diagnosis: 'Está quase.' }).success).toBe(false);
    expect(
      tutorHintSchema.safeParse({ diagnosis: 'Está quase.', suggestions: [] }).success,
    ).toBe(false);
  });

  it('não aceita mais de três sugestões', () => {
    const resultado = tutorHintSchema.safeParse({
      diagnosis: 'Está quase.',
      suggestions: ['uma', 'duas', 'três', 'quatro'],
    });

    expect(resultado.success).toBe(false);
  });

  it('ignora campo que o modelo inventar', () => {
    const resultado = tutorHintSchema.safeParse({
      diagnosis: 'Está quase.',
      suggestions: ['Feche o anel.'],
      score: 87,
      isValid: false,
    });

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;

    // Schema fechado: o veredito continua sendo do motor determinístico, e nada
    // que o modelo escreva sobre nota ou validade atravessa esta linha.
    expect(Object.keys(resultado.data).sort()).toEqual(['diagnosis', 'suggestions']);
  });
});
