import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { chemistryErrorText, chemistryMessages, functionalGroupName, LOCALES } from '../src/index';

/**
 * O núcleo decide e devolve código; a frase é daqui. O risco é a deriva: um
 * código novo em `core` sem frase nos dois idiomas apareceria na tela como
 * `undefined`, e num painel de erro de química ninguém ia entender o que houve.
 *
 * A lista é lida do arquivo de tipos do próprio núcleo porque este pacote não
 * pode importá-lo — `core` não depende de ninguém, e uma dependência de volta
 * seria a mesma coisa por outro caminho.
 */
function codesDeclaredByCore(): string[] {
  const source = readFileSync(
    fileURLToPath(new URL('../../core/src/chemistry/types.ts', import.meta.url)),
    'utf8',
  );

  const declaration = /export type ChemistryErrorCode =([\s\S]*?);/.exec(source);
  expect(declaration).not.toBeNull();

  const body = (declaration?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...body.matchAll(/'([a-z_]+)'/g)].map((match) => match[1] ?? '');
}

describe('a recusa do núcleo vira frase', () => {
  it('todo código de erro do núcleo tem frase nos dois idiomas', () => {
    const codes = codesDeclaredByCore();
    expect(codes.length).toBeGreaterThan(0);

    for (const locale of LOCALES) {
      for (const code of codes) {
        const text = chemistryMessages[locale].error[code as keyof typeof chemistryMessages['pt-BR']['error']];
        expect(text, `${code} em ${locale}`).toBeDefined();
      }
    }
  });

  /** O erro explica a química, com os números que o RDKit calculou. */
  it('a valência estourada diz o elemento, quantas ligações tem e quantas cabem', () => {
    const error = { code: 'valence_exceeded', atom: { symbol: 'C', bonds: 5, max: 4 } } as const;

    expect(chemistryErrorText('pt-BR', error)).toBe(
      'O átomo de C tem 5 ligações, mas suporta no máximo 4.',
    );
    expect(chemistryErrorText('en', error)).toBe(
      'The C atom has 5 bonds, but it supports at most 4.',
    );
  });

  it('sem átomo culpado, a frase fica genérica em vez de mentir um número', () => {
    const generic = chemistryErrorText('en', { code: 'valence_exceeded' });
    expect(generic).not.toMatch(/\d/);
  });
});

describe('nome de grupo funcional', () => {
  it('o identificador do núcleo vira nome nos dois idiomas', () => {
    expect(functionalGroupName('pt-BR', 'carboxylicAcid')).toBe('ácido carboxílico');
    expect(functionalGroupName('en', 'carboxylicAcid')).toBe('carboxylic acid');
  });

  it('identificador desconhecido aparece cru, nunca como vazio na tela', () => {
    expect(functionalGroupName('en', 'oxirane')).toBe('oxirane');
  });
});
