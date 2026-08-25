import type { OpenChemLib } from './openchemlib';

/**
 * O acesso rápido ao campo de força.
 *
 * O `ForceFieldMMFF94` guarda as coordenadas num vetor interno e recalcula a
 * energia a partir dele. A API pública não expõe esse vetor, mas escrever nele
 * é a diferença entre uma dinâmica de 0,2 ms por passo e uma de 20 ms: sem ele,
 * cada avaliação de energia exigiria construir o campo de força inteiro de novo.
 *
 * Como isso depende de detalhe interno de uma biblioteca de terceiro, nada aqui
 * é assumido: o vetor é **descoberto pelo formato e confirmado pelo
 * comportamento** — precisa ter 3N posições e precisa mudar a energia quando
 * mexido. Se a próxima versão do OpenChemLib renomear tudo, a descoberta falha,
 * a função devolve `null` e a vibração simplesmente não aparece. O teste
 * `dynamics.test.ts` quebra alto nesse dia, que é o comportamento certo.
 */

type ForceField = InstanceType<OpenChemLib['ForceFieldMMFF94']>;

export interface FastField {
  /** Coordenadas achatadas, em ångström. Escrever aqui muda a energia. */
  readonly positions: number[];
  /** Energia MMFF94 do estado atual, em kcal/mol. */
  readonly energy: () => number;
}

/** Quanto a energia precisa mudar para o vetor ser considerado o certo. */
const SENSITIVITY = 1e-6;

/** Deslocamento de teste, em ångström. */
const PROBE = 0.05;

export function openFastField(field: ForceField, atomCount: number): FastField | null {
  const wanted = atomCount * 3;
  const energy = (): number => field.getTotalEnergy();

  for (const candidate of arraysOf(field, wanted)) {
    const before = energy();
    const saved = candidate[0] ?? 0;

    candidate[0] = saved + PROBE;
    const after = energy();
    candidate[0] = saved;

    if (Math.abs(after - before) > SENSITIVITY) {
      // Confere que desfazer também volta a energia: vetor certo, sem efeito
      // colateral pendurado.
      if (Math.abs(energy() - before) > SENSITIVITY) continue;
      return { positions: candidate, energy };
    }
  }

  return null;
}

/** Vetores numéricos do tamanho procurado, no objeto e um nível abaixo. */
function* arraysOf(root: object, length: number): Generator<number[]> {
  const seen = new Set<object>();

  const scan = function* (node: object, depth: number): Generator<number[]> {
    if (depth > 2 || seen.has(node)) return;
    seen.add(node);

    for (const key of Object.getOwnPropertyNames(node)) {
      const value = (node as Record<string, unknown>)[key];

      if (Array.isArray(value) && value.length === length && typeof value[0] === 'number') {
        yield value as number[];
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        yield* scan(value, depth + 1);
      }
    }
  };

  yield* scan(root, 0);
}
