import { describe, expect, it } from 'vitest';
import { checkName, normalizeName } from './molecule-name';

/**
 * O apelido não pode se passar por nomenclatura.
 *
 * O produto não calcula nome de composto, e deixar alguém escrever "butanol"
 * como apelido seria construir exatamente a confusão que o D-01 evita — só que
 * com o usuário no lugar do modelo de linguagem.
 */

describe('apelido aceito', () => {
  it('aceita nome de gente, de piada e de turma', () => {
    for (const nome of [
      'Molécula do Pedro',
      'Bicho de sete cabeças',
      'Turma 3B',
      "Coisa d'água",
      'Zé',
    ]) {
      expect(checkName(nome).ok).toBe(true);
    }
  });

  it('colapsa espaço sobrando', () => {
    expect(normalizeName('  Molécula   do   Pedro ')).toBe('Molécula do Pedro');
  });
});

describe('apelido recusado', () => {
  it('recusa fórmula', () => {
    expect(checkName('C9H8O4').problem).toBe('parece-formula');
    expect(checkName('CH4').problem).toBe('parece-formula');
    expect(checkName('C 9 H 8 O 4').problem).toBe('parece-formula');
  });

  it('recusa nome sistemático de uma palavra', () => {
    for (const nome of ['butanol', 'etanal', 'propanona', 'metilamina', 'benzoato']) {
      expect(checkName(nome).problem).toBe('parece-sistematico');
    }
  });

  it('mas deixa passar frase que só termina parecida', () => {
    // "do Pedro" não é nomenclatura; a regra vale para palavra solta.
    expect(checkName('A cetona do Pedro').ok).toBe(true);
  });

  it('recusa curto demais, longo demais e caractere estranho', () => {
    expect(checkName('a').problem).toBe('curto');
    expect(checkName('x'.repeat(41)).problem).toBe('longo');
    expect(checkName('CC(=O)O <script>').problem).toBe('caracteres');
  });

  it('explica em português o que houve', () => {
    const recusa = checkName('C6H6');
    expect(recusa.message).toContain('fórmula');
    expect(recusa.message).not.toMatch(/regex|invalid|error/i);
  });
});
