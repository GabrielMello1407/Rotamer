/**
 * Autovalores e autovetores de uma matriz simétrica, pelo método de Jacobi.
 *
 * Escrito à mão de propósito: a única coisa que o produto precisa diagonalizar é
 * a Hessiana ponderada por massa, que é simétrica e real por construção. Jacobi
 * é o algoritmo clássico para esse caso — sem pivotamento, sem fatoração, sem
 * biblioteca de álgebra linear inteira só para uma rotina de setenta linhas — e
 * devolve autovetores ortogonais com precisão de máquina.
 *
 * O custo é O(n³) por varredura, com uma dúzia de varreduras. Para uma molécula
 * de trinta átomos isso é n = 90, e roda em dezenas de milissegundos no worker.
 */

export interface Eigen {
  /** Autovalores, na ordem em que saíram. */
  readonly values: readonly number[];
  /** Autovetores em coluna: `vectors[linha][coluna]`. */
  readonly vectors: readonly (readonly number[])[];
}

/** Quantas varreduras completas antes de desistir. Jacobi converge bem antes. */
const MAX_SWEEPS = 100;

/** Soma dos quadrados fora da diagonal abaixo da qual a matriz já é diagonal. */
const TOLERANCE = 1e-18;

export function jacobiEigen(input: readonly (readonly number[])[]): Eigen {
  const size = input.length;
  const matrix = input.map((row) => [...row]);

  // Começa na identidade: cada rotação aplicada à matriz é aplicada aqui também,
  // e no fim as colunas são os autovetores.
  const vectors: number[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0)),
  );

  for (let sweep = 0; sweep < MAX_SWEEPS; sweep += 1) {
    let offDiagonal = 0;
    for (let row = 0; row < size - 1; row += 1) {
      for (let column = row + 1; column < size; column += 1) {
        offDiagonal += (matrix[row]?.[column] ?? 0) ** 2;
      }
    }

    if (offDiagonal < TOLERANCE) break;

    for (let row = 0; row < size - 1; row += 1) {
      for (let column = row + 1; column < size; column += 1) {
        const element = matrix[row]?.[column] ?? 0;
        if (Math.abs(element) < 1e-300) continue;

        // O ângulo que zera exatamente este elemento. A forma com `theta` e a
        // raiz evita perder precisão quando a diferença dos termos da diagonal é
        // muito maior que o elemento de fora.
        const diagonal = (matrix[column]?.[column] ?? 0) - (matrix[row]?.[row] ?? 0);
        const theta = diagonal / (2 * element);
        const sign = theta >= 0 ? 1 : -1;
        const tangent = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const cosine = 1 / Math.sqrt(tangent * tangent + 1);
        const sine = tangent * cosine;

        for (let index = 0; index < size; index += 1) {
          const atRow = matrix[index]?.[row] ?? 0;
          const atColumn = matrix[index]?.[column] ?? 0;

          const line = matrix[index];
          if (!line) continue;

          line[row] = cosine * atRow - sine * atColumn;
          line[column] = sine * atRow + cosine * atColumn;
        }

        for (let index = 0; index < size; index += 1) {
          const atRow = matrix[row]?.[index] ?? 0;
          const atColumn = matrix[column]?.[index] ?? 0;

          const lineRow = matrix[row];
          const lineColumn = matrix[column];
          if (!lineRow || !lineColumn) continue;

          lineRow[index] = cosine * atRow - sine * atColumn;
          lineColumn[index] = sine * atRow + cosine * atColumn;
        }

        for (let index = 0; index < size; index += 1) {
          const line = vectors[index];
          if (!line) continue;

          const atRow = line[row] ?? 0;
          const atColumn = line[column] ?? 0;

          line[row] = cosine * atRow - sine * atColumn;
          line[column] = sine * atRow + cosine * atColumn;
        }
      }
    }
  }

  return {
    values: matrix.map((row, index) => row[index] ?? 0),
    vectors,
  };
}
