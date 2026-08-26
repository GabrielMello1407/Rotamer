import { describe, expect, it } from 'vitest';
import { chemistryApi } from '../src/chemistry/api';
import { generateGeometry } from '../src/geometry/conformer';
import { normalModes, type NormalModes } from '../src/geometry/modes';
import { analyze } from '../src/chemistry/analysis';

/**
 * Modos normais de vibração.
 *
 * A conta é a de sempre em química computacional: Hessiana, ponderação por
 * massa, projeção do corpo rígido, diagonalização. O que estes testes checam é
 * o que um professor conferiria no quadro — a contagem `3N − 6` (ou `3N − 5`), a
 * ordem de grandeza das frequências e qual movimento é estiramento.
 *
 * As frequências são do campo de força MMFF94, e campo de força clássico
 * superestima estiramento. As faixas abaixo são largas de propósito: elas
 * separam "está certo" de "está errado", não perseguem o valor experimental.
 */

async function modesOf(smiles: string): Promise<NormalModes> {
  const analysis = await analyze(smiles);
  if (!analysis.ok) throw new Error(`estrutura inválida: ${analysis.error.message}`);

  const geometry = await generateGeometry(analysis.molecule.molblock);
  const modes = await normalModes(analysis.molecule.molblock, geometry);
  if (modes === null) throw new Error('não foi possível calcular os modos');

  return modes;
}

describe('contagem de modos', () => {
  it('a água tem três modos: 3N − 6 com N = 3', async () => {
    const modes = await modesOf('O');

    expect(modes.atomCount).toBe(3);
    expect(modes.linear).toBe(false);
    expect(modes.expected).toBe(3);
    expect(modes.modes).toHaveLength(3);
  });

  it('o gás carbônico é linear e tem quatro: 3N − 5', async () => {
    const modes = await modesOf('O=C=O');

    expect(modes.atomCount).toBe(3);
    expect(modes.linear).toBe(true);
    expect(modes.expected).toBe(4);
    expect(modes.modes).toHaveLength(4);
  });

  it('o metano tem nove', async () => {
    const modes = await modesOf('C');

    expect(modes.atomCount).toBe(5);
    expect(modes.expected).toBe(9);
    expect(modes.modes).toHaveLength(9);
  });

  it('o benzeno tem trinta', async () => {
    const modes = await modesOf('c1ccccc1');

    expect(modes.atomCount).toBe(12);
    expect(modes.expected).toBe(30);
    expect(modes.modes).toHaveLength(30);
  }, 60_000);
});

describe('frequências', () => {
  it('a água tem uma deformação angular e duas elongações O–H', async () => {
    const modes = await modesOf('O');
    const ondas = modes.modes.map((mode) => mode.wavenumber);

    // O modo mais lento é o de dobrar o ângulo H–O–H; os dois rápidos esticam as
    // ligações. A separação entre eles é o fato químico que interessa.
    expect(ondas[0]).toBeGreaterThan(1200);
    expect(ondas[0]).toBeLessThan(2200);

    expect(ondas[1]).toBeGreaterThan(3000);
    expect(ondas[2]).toBeGreaterThan(3000);
    expect(ondas[2]).toBeLessThan(4400);

    // E o mais lento é dobramento, os rápidos são estiramento.
    expect(modes.modes[0]?.bend ?? 0).toBeGreaterThan(0.5);
    expect(modes.modes[2]?.stretch ?? 0).toBeGreaterThan(0.8);
  });

  it('num mínimo de energia, nada vibra com frequência imaginária', async () => {
    const modes = await modesOf('CCO');

    for (const mode of modes.modes) {
      // Um modo levemente negativo é resíduo de minimização, não sela de verdade;
      // acima de −50 cm⁻¹ ainda é ruído numérico.
      expect(mode.wavenumber).toBeGreaterThan(-50);
    }
  }, 60_000);

  it('C–H estica mais rápido que C–C, porque o hidrogênio é leve', async () => {
    const modes = await modesOf('CC');
    const maisRapido = modes.modes[modes.modes.length - 1];

    expect(maisRapido?.wavenumber ?? 0).toBeGreaterThan(2800);
    expect(maisRapido?.stretch ?? 0).toBeGreaterThan(0.7);
  }, 60_000);

  it('no estiramento O–H, quem anda é o hidrogênio', async () => {
    const modes = await modesOf('O');
    const rapido = modes.modes[2];
    if (!rapido) throw new Error('faltou o modo');

    const anda = (atom: number): number =>
      Math.hypot(
        rapido.displacement[atom * 3] ?? 0,
        rapido.displacement[atom * 3 + 1] ?? 0,
        rapido.displacement[atom * 3 + 2] ?? 0,
      );

    // O átomo 0 é o oxigênio; 1 e 2 são os hidrogênios.
    expect(anda(0)).toBeLessThan(0.3);
    expect(Math.max(anda(1), anda(2))).toBeCloseTo(1, 5);
  });
});

describe('o modo não arrasta a molécula', () => {
  it('a soma dos deslocamentos ponderados por massa é zero', async () => {
    const modes = await modesOf('O');

    // Translação foi projetada fora: o centro de massa fica parado em todo modo.
    // Se isto falhar, a molécula "vibrando" na tela sai de viagem.
    const massas = [15.999, 1.008, 1.008];

    for (const mode of modes.modes) {
      for (let axis = 0; axis < 3; axis += 1) {
        let soma = 0;
        for (let atom = 0; atom < 3; atom += 1) {
          soma += (massas[atom] ?? 0) * (mode.displacement[atom * 3 + axis] ?? 0);
        }
        expect(Math.abs(soma)).toBeLessThan(0.05);
      }
    }
  });
});

describe('pela API de química', () => {
  it('a mesma molécula pedida duas vezes devolve os mesmos modos', async () => {
    const first = await chemistryApi.modes('O');
    const second = await chemistryApi.modes('O');

    if (!first.ok || !second.ok) throw new Error('esperava modos');

    expect(second.modes.modes[0]?.wavenumber).toBe(first.modes.modes[0]?.wavenumber);
    expect(second.inchiKey).toBe(first.inchiKey);
  });

  it('estrutura impossível não chega a virar modo nenhum', async () => {
    const result = await chemistryApi.modes('C(C)(C)(C)(C)C');

    expect(result.ok).toBe(false);
  });
});
