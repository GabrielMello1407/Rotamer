import type { Dictionary, MessageNode, MessageTree } from './dictionary';
import { LOCALES } from './locale';

/**
 * Onde os dois idiomas de um dicionário discordam de **forma** — não de texto.
 *
 * O tipo já recusa chave que falta: `dictionary()` infere o formato do
 * português e obriga o inglês a caber nele. O que o tipo não vê é o que só
 * existe em tempo de execução — uma lista de dicas com três itens em português
 * e duas em inglês, uma função de um lado e uma frase do outro. É isso que esta
 * função pega, e é por isso que cada pacote com dicionário tem um teste de uma
 * linha chamando-a.
 */
export function dictionaryDivergences<T extends MessageTree>(entries: Dictionary<T>): string[] {
  const found: string[] = [];
  walk(entries[LOCALES[0]], entries[LOCALES[1]], '', found);
  return found;
}

function shapeOf(node: MessageNode): string {
  if (typeof node === 'string') return 'texto';
  if (typeof node === 'function') return `função/${String(node.length)}`;
  if (Array.isArray(node)) return `lista/${String(node.length)}`;
  return 'grupo';
}

function walk(left: MessageNode, right: MessageNode, path: string, found: string[]): void {
  const here = path === '' ? '(raiz)' : path;

  if (shapeOf(left) !== shapeOf(right)) {
    found.push(`${here}: ${shapeOf(left)} em pt-BR, ${shapeOf(right)} em en`);
    return;
  }

  if (typeof left === 'string' || typeof left === 'function') {
    if (typeof left === 'string' && left.trim() === '') found.push(`${here}: texto vazio`);
    return;
  }

  if (Array.isArray(left)) return;

  const leftTree = left as MessageTree;
  const rightTree = right as MessageTree;
  const keys = new Set([...Object.keys(leftTree), ...Object.keys(rightTree)]);

  for (const key of [...keys].sort()) {
    const child = path === '' ? key : `${path}.${key}`;
    const a = leftTree[key];
    const b = rightTree[key];

    if (a === undefined || b === undefined) {
      found.push(`${child}: existe só em ${a === undefined ? 'en' : 'pt-BR'}`);
      continue;
    }

    walk(a, b, child, found);
  }
}
