import { describe, expect, it } from 'vitest';
import { analyze } from '../src/chemistry/analysis';
import { atomicMass } from '../src/chemistry/elements';
import { PARAMETRIZED, generateGeometry } from '../src/geometry/conformer';
import { normalModes } from '../src/geometry/modes';
import { simulateDynamics } from '../src/geometry/dynamics';

/**
 * A massa entra na conta da frequência.
 *
 * Ela pondera a Hessiana dos modos normais e sorteia as velocidades da
 * dinâmica. Uma massa errada não deixa o número aproximado: deixa errado, com
 * o selo de calculado ao lado. E frequência errada não parece errada para
 * ninguém — é o mesmo motivo pelo qual o produto não deixa o LLM responder
 * química.
 */
describe('tabela de massas', () => {
  it('cobre todo elemento que o campo de força alcança', () => {
    const semMassa = [...PARAMETRIZED].filter((symbol) => atomicMass(symbol) === null);

    // Sem esta trava, um elemento parametrizado e sem massa passa reto: o
    // MMFF94 aceita a molécula, a tela mostra frequência, e o número saiu de
    // uma massa que ninguém escolheu.
    expect(semMassa).toEqual([]);
  });

  it('não inventa massa para o que não conhece', () => {
    expect(atomicMass('Na')).toBeCloseTo(22.99, 2);
    expect(atomicMass('Xe')).toBeNull();
  });
});

describe('sódio pesa como sódio', () => {
  /**
   * O cloreto de sódio tem um modo só, e ele é a prova mais curta possível.
   *
   * Numa molécula de dois átomos a frequência sai de `√(k/μ)`, com μ a massa
   * reduzida. Com o sódio pesando 22,99 u, μ = 13,95 u; com o sódio pesando o
   * que um valor de reserva de carbono lhe dava — 12,011 u —, μ = 8,97 u, e a
   * mesma constante de força devolveria uma frequência 25% mais alta.
   *
   * Medido antes desta correção: 400 cm⁻¹. Depois: em torno de 320.
   */
  it('o único modo do NaCl cai onde a massa certa o põe', async () => {
    const analysis = await analyze('[Na+].[Cl-]');
    expect(analysis.ok).toBe(true);
    if (!analysis.ok) return;

    const geometry = await generateGeometry(analysis.molecule.molblock);
    expect(geometry.relaxed).toBe(true);

    const modes = await normalModes(analysis.molecule.molblock, geometry);
    expect(modes).not.toBeNull();
    if (modes === null) return;

    expect(modes.modes).toHaveLength(1);
    // A faixa é larga de propósito: o que o teste trava é a massa usada, não a
    // constante de força do MMFF94, que pode mudar com a versão da biblioteca.
    expect(modes.modes[0]?.wavenumber).toBeGreaterThan(280);
    expect(modes.modes[0]?.wavenumber).toBeLessThan(360);
  }, 60_000);

  it('o etanol continua onde sempre esteve — a correção não mexeu no orgânico', async () => {
    const analysis = await analyze('CCO');
    expect(analysis.ok).toBe(true);
    if (!analysis.ok) return;

    const geometry = await generateGeometry(analysis.molecule.molblock);
    const modes = await normalModes(analysis.molecule.molblock, geometry);
    expect(modes).not.toBeNull();
    if (modes === null) return;

    // 3N − 6 com N = 9, e o estiramento O–H no alto da lista.
    expect(modes.modes).toHaveLength(21);
    const maior = Math.max(...modes.modes.map((mode) => mode.wavenumber));
    expect(maior).toBeGreaterThan(3500);
  }, 60_000);
});

describe('elemento sem massa não vibra', () => {
  /**
   * O xenônio não está na tabela de massas. Se um dia o campo de força passar
   * a aceitá-lo, a resposta certa é não vibrar — nunca vibrar com a massa de
   * outro elemento.
   */
  it('a geometria pode existir, a vibração não', async () => {
    const analysis = await analyze('[Xe]');
    if (!analysis.ok) return;

    const geometry = await generateGeometry(analysis.molecule.molblock).catch(() => null);
    if (geometry === null || !geometry.relaxed) return;

    expect(await normalModes(analysis.molecule.molblock, geometry)).toBeNull();
    expect(await simulateDynamics(analysis.molecule.molblock, geometry)).toBeNull();
  }, 60_000);
});
