import type { Geometry } from '@rotamer/core';

/**
 * As varetas da cena.
 *
 * Uma ligação dupla não é uma vareta mais grossa: são **duas varetas
 * paralelas**, e a tripla são três. É assim em modelo molecular de plástico, em
 * livro e em todo visualizador de química — e é a única forma de a cena mostrar
 * o que o desenho 2D já mostrava.
 *
 * O deslocamento sai perpendicular à ligação, no plano em que ela está: para
 * isso serve o átomo de referência, um vizinho de uma das pontas. Sem ele, duas
 * varetas paralelas cairiam num plano arbitrário e o anel aromático apareceria
 * com as duplas apontando para fora da folha.
 */

export interface Stick {
  /** Índice da ligação na geometria. */
  readonly bond: number;
  /**
   * Onde esta vareta fica, em relação ao eixo da ligação.
   *
   * `0` é em cima do eixo; `±1` são os lados. A distância em ångström entra na
   * hora de desenhar.
   */
  readonly offset: number;
  /**
   * Átomo vizinho que define o plano da ligação múltipla, ou `null` quando não
   * há vizinho nenhum — aí qualquer plano serve, porque não há nada em volta
   * para o desenho contradizer.
   */
  readonly reference: number | null;
}

/**
 * Quantas varetas cada ordem de ligação usa, e em que posições.
 *
 * A simples fica no eixo. A dupla abre para os dois lados, sem nada no meio. A
 * tripla mantém a do meio e abre as outras duas.
 */
const LAYOUT: Readonly<Record<number, readonly number[]>> = {
  1: [0],
  2: [-1, 1],
  3: [-1, 0, 1],
};

export function sticksOf(geometry: Geometry): readonly Stick[] {
  const sticks: Stick[] = [];

  geometry.bonds.forEach((bond, index) => {
    const offsets = LAYOUT[bond.order] ?? LAYOUT[1] ?? [0];
    const reference = offsets.length > 1 ? referenceFor(geometry, bond.from, bond.to) : null;

    for (const offset of offsets) {
      sticks.push({ bond: index, offset, reference });
    }
  });

  return sticks;
}

/**
 * Um vizinho de qualquer uma das pontas, que não seja a outra ponta.
 *
 * É ele que define de que lado a ligação múltipla abre. Numa dupla de cadeia, o
 * carbono seguinte serve; num anel, qualquer vizinho põe as duas varetas no
 * plano do anel, que é onde elas têm que estar.
 */
function referenceFor(geometry: Geometry, from: number, to: number): number | null {
  for (const bond of geometry.bonds) {
    if (bond.from === from && bond.to !== to) return bond.to;
    if (bond.to === from && bond.from !== to) return bond.from;
    if (bond.from === to && bond.to !== from) return bond.to;
    if (bond.to === to && bond.from !== from) return bond.from;
  }

  return null;
}
