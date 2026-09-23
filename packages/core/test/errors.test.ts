import { describe, expect, it } from 'vitest';
import { analyze } from '../src/chemistry/analysis';
import type { ChemistryError } from '../src/chemistry/types';

/**
 * O núcleo aponta a química que falhou, e aponta **com número**: o código da
 * recusa e o átomo culpado. A frase que o aluno lê é montada em `@rotamer/i18n`,
 * e é `packages/i18n/test/chemistry.test.ts` que guarda o texto — aqui se
 * protege o que o RDKit conclui, que não muda de idioma.
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
    expect(error.atom).toEqual({ index: 0, symbol: 'C', bonds: 5, max: 4 });
  });

  it('aponta o nitrogênio com quatro ligações e sem carga', async () => {
    const error = await requireError('CN(C)(C)C');

    expect(error.code).toBe('valence_exceeded');
    expect(error.atom).toEqual({ index: 1, symbol: 'N', bonds: 4, max: 3 });
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
    expect(error.atom).toBeUndefined();
  });
});

describe('a recusa não fala idioma nenhum', () => {
  /**
   * O que impede o pt-BR de voltar para dentro do núcleo. Sem este teste, a
   * primeira pressa reescreve uma frase aqui e o inglês fica para trás sem
   * ninguém perceber — porque em português continuaria funcionando.
   */
  it('devolve só código e números, nunca frase', async () => {
    const inputs = ['C(C)(C)(C)(C)C', 'c1ccccc', 'Xz', ''];

    for (const input of inputs) {
      const error = await requireError(input);
      expect(Object.keys(error).sort()).toEqual(
        error.atom === undefined ? ['code'] : ['atom', 'code'],
      );
    }
  });
});
