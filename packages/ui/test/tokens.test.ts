import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * O tema escuro é declarado duas vezes, e precisa continuar dizendo a mesma
 * coisa nas duas.
 *
 * Não é descuido: CSS não deixa um bloco de declarações servir a dois
 * seletores quando um deles mora dentro de `@media`. São dois estados
 * diferentes do produto — quem não escolheu tema e está no escuro do sistema
 * (`@media` + `:root:not([data-theme="light"])`) e quem escolheu escuro na
 * tela (`:root[data-theme="dark"]`) — e os dois têm de pintar igual.
 *
 * O que este teste protege é a deriva: trocar um cinza num bloco e esquecer o
 * outro deixa metade das pessoas com a cor antiga, e ninguém percebe, porque
 * cada uma vê só um dos caminhos.
 */
function ler(arquivo: string): string {
  const css = readFileSync(fileURLToPath(new URL(`../src/${arquivo}`, import.meta.url)), 'utf8');

  // Comentário sai antes de qualquer leitura: `/* texto sobre --brand: 5,7:1 */`
  // tem dentro o que parece uma declaração, e seria contado como uma.
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** O conteúdo de `{ … }` que começa na primeira chave depois de `a partir de`. */
function corpoDoBloco(css: string, aPartirDe: number): string {
  const abre = css.indexOf('{', aPartirDe);
  expect(abre).toBeGreaterThan(-1);

  let profundidade = 0;

  for (let i = abre; i < css.length; i += 1) {
    if (css[i] === '{') profundidade += 1;
    else if (css[i] === '}') {
      profundidade -= 1;
      if (profundidade === 0) return css.slice(abre + 1, i);
    }
  }

  throw new Error('bloco sem fecho');
}

/** As declarações `--nome: valor` de um trecho, com o espaço normalizado. */
function tokensDe(trecho: string): Map<string, string> {
  const encontrados = new Map<string, string>();

  for (const [, nome, valor] of trecho.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    // `rgba(53, 216, 188, 0.22)` e `rgba(53,216,188,.22)` são a mesma cor: o
    // que este teste persegue é valor diferente, não espaço diferente.
    if (nome !== undefined && valor !== undefined) {
      encontrados.set(nome, valor.replace(/\s+/g, '').replace(/(^|[(,])0\./g, '$1.'));
    }
  }

  return encontrados;
}

/** Os dois caminhos do tema escuro: o do sistema e o da escolha na tela. */
function escuros(arquivo: string): {
  readonly porSistema: Map<string, string>;
  readonly porEscolha: Map<string, string>;
  readonly claro: Map<string, string>;
} {
  const css = ler(arquivo);

  const media = css.indexOf('@media (prefers-color-scheme: dark)');
  const escolha = css.search(/:root\[data-theme=['"]dark['"]\]/);
  expect(media).toBeGreaterThan(-1);
  expect(escolha).toBeGreaterThan(-1);

  return {
    // Dentro do `@media` há um `:root:not(...)` aninhado; o corpo externo o
    // contém, e a leitura de declarações atravessa os dois.
    porSistema: tokensDe(corpoDoBloco(css, media)),
    porEscolha: tokensDe(corpoDoBloco(css, escolha)),
    claro: tokensDe(css.slice(0, media)),
  };
}

describe.each(['tokens.css', 'cpk.css'])('%s — os dois caminhos do tema escuro', (arquivo) => {
  it('declaram exatamente os mesmos tokens', () => {
    const { porSistema, porEscolha } = escuros(arquivo);
    expect([...porEscolha.keys()].sort()).toEqual([...porSistema.keys()].sort());
  });

  it('dão o mesmo valor a cada token', () => {
    const { porSistema, porEscolha } = escuros(arquivo);

    for (const [nome, valor] of porSistema) {
      expect(`${nome}: ${porEscolha.get(nome) ?? '(ausente)'}`).toBe(`${nome}: ${valor}`);
    }
  });
});

describe('tokens.css — nenhuma cor mora só no escuro', () => {
  /**
   * A regra da casa: nenhuma cor pode ser definida apenas dentro de um bloco
   * `@media (prefers-color-scheme)` ou `[data-theme]`. O `:root` puro define a
   * paleta clara inteira; os blocos condicionais só redefinem. Cor que nasce
   * atrás de condicional não se aplica no estado não marcado, e a página
   * renderiza texto de um tema sobre o fundo do outro.
   */
  it('todo token do escuro já existe na paleta clara', () => {
    const { porSistema, claro } = escuros('tokens.css');
    expect([...porSistema.keys()].filter((nome) => !claro.has(nome))).toEqual([]);
  });
});
