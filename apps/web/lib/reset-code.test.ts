import { describe, expect, it } from 'vitest';
import {
  CODE_HOURS,
  formatCode,
  generateCode,
  hashCode,
  normalizeCode,
  sameHash,
} from './reset-code';

/**
 * O código que o professor entrega em mãos.
 *
 * Ele é lido de um papel, digitado por alguém apressado e conferido por um
 * servidor que não pode entregar pista nenhuma quando erra. Estas três coisas
 * são o que os testes abaixo protegem.
 */

describe('código gerado', () => {
  it('tem oito caracteres, e nenhum deles se confunde com outro', () => {
    const code = generateCode();

    expect(code).toHaveLength(8);
    // Sem 0, O, 1, I e L: zero e letra O trocados fazem o aluno errar três
    // vezes e culpar o produto.
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  });

  it('não repete', () => {
    const gerados = new Set(Array.from({ length: 200 }, () => generateCode()));

    expect(gerados.size).toBe(200);
  });

  it('vale por um dia — o bastante para a aula de hoje e a de amanhã', () => {
    expect(CODE_HOURS).toBe(24);
  });
});

describe('leitura do que foi digitado', () => {
  it('maiúscula, sem espaço e sem hífen', () => {
    expect(normalizeCode(' a2c4-d6f8 ')).toBe('A2C4D6F8');
  });

  it('não inventa correção', () => {
    // Nem 0 nem O existem no alfabeto. Trocar um pelo outro seria adivinhar —
    // e adivinhar errado devolve "não confere" do mesmo jeito, depois de uma
    // substituição que o produto fez sozinho.
    expect(normalizeCode('0O1IL')).toBe('0O1IL');
  });

  it('escrito em dois blocos de quatro, que é como se dita em voz alta', () => {
    expect(formatCode('A2C4D6F8')).toBe('A2C4-D6F8');
  });
});

describe('conferência', () => {
  it('o mesmo código dá o mesmo resumo', () => {
    expect(hashCode('A2C4D6F8')).toBe(hashCode('A2C4D6F8'));
  });

  it('códigos diferentes dão resumos diferentes', () => {
    expect(hashCode('A2C4D6F8')).not.toBe(hashCode('A2C4D6F9'));
  });

  it('o resumo não guarda o código', () => {
    expect(hashCode('A2C4D6F8')).not.toContain('A2C4');
    expect(hashCode('A2C4D6F8')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('comparar resumo igual dá certo, e diferente dá errado', () => {
    const resumo = hashCode('A2C4D6F8');

    expect(sameHash(resumo, hashCode('A2C4D6F8'))).toBe(true);
    expect(sameHash(resumo, hashCode('A2C4D6F9'))).toBe(false);
  });

  it('resumo de tamanho diferente não quebra a comparação', () => {
    expect(sameHash(hashCode('A2C4D6F8'), 'curto')).toBe(false);
  });
});
