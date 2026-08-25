import { describe, expect, it } from 'vitest';
import { analyze } from '../src/chemistry/analysis';
import type { ChemistryError } from '../src/chemistry/types';

/**
 * Erro explica a química, não o código. "O átomo de C tem 5 ligações, mas
 * suporta no máximo 4" — nunca "valence error".
 */
async function requireError(input: string): Promise<ChemistryError> {
  const result = await analyze(input);
  if (result.ok) {
    throw new Error(`esperava erro, veio molécula: ${result.molecule.smiles}`);
  }
  return result.error;
}

describe('valência excedida', () => {
  it('aponta o carbono com cinco ligações', async () => {
    const error = await requireError('C(C)(C)(C)(C)C');

    expect(error.code).toBe('valence_exceeded');
    expect(error.message).toBe('O átomo de C tem 5 ligações, mas suporta no máximo 4.');
    expect(error.atom).toEqual({ index: 0, symbol: 'C', bonds: 5, max: 4 });
  });

  it('aponta o nitrogênio com quatro ligações e sem carga', async () => {
    const error = await requireError('CN(C)(C)C');

    expect(error.code).toBe('valence_exceeded');
    expect(error.message).toBe('O átomo de N tem 4 ligações, mas suporta no máximo 3.');
    expect(error.atom?.symbol).toBe('N');
  });

  it('não reclama do nitrogênio quaternário com carga, que existe', async () => {
    const result = await analyze('C[N+](C)(C)C');
    expect(result.ok).toBe(true);
  });
});

describe('estrutura ilegível', () => {
  it('reclama de anel que não fecha', async () => {
    const error = await requireError('c1ccccc');
    expect(error.code).toBe('invalid_syntax');
    expect(error.message).toContain('anéis');
  });

  it('reclama de elemento que não existe', async () => {
    const error = await requireError('Xz');
    expect(error.code).toBe('invalid_syntax');
  });
});

describe('nada desenhado', () => {
  it('não trata tela vazia como erro de química', async () => {
    const error = await requireError('   ');
    expect(error.code).toBe('empty');
    expect(error.message).toBe('Não há nenhum átomo para analisar.');
  });
});

describe('mensagens', () => {
  it('nunca vazam jargão de biblioteca', async () => {
    const inputs = ['C(C)(C)(C)(C)C', 'c1ccccc', 'Xz', ''];

    for (const input of inputs) {
      const error = await requireError(input);
      expect(error.message).not.toMatch(/valence|sanitize|kekul|RDKit|error/i);
      expect(error.message.endsWith('.')).toBe(true);
    }
  });
});
