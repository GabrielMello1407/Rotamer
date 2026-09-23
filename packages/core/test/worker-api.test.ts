import { describe, expect, it } from 'vitest';
import { chemistryApi } from '../src/chemistry/api';

/**
 * A mesma superfície que o worker expõe via Comlink, exercitada sem navegador.
 * É isto que garante que o núcleo roda em teste de linha de comando.
 */
describe('api do worker de química', () => {
  it('aquece e informa a versão do RDKit', async () => {
    const version = await chemistryApi.warmUp();
    expect(version).toMatch(/^\d{4}\.\d{2}/);
  });

  it('sanitiza aspirina', async () => {
    const result = await chemistryApi.analyze('CC(=O)Oc1ccccc1C(=O)O');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.molecule.formula).toBe('C9H8O4');
    expect(result.molecule.inchiKey).toBe('BSYNRYMUTXBXSQ-UHFFFAOYSA-N');
    expect(result.molecule.descriptors.molarMass).toBeCloseTo(180.16, 2);
    expect(result.molecule.descriptors.tpsa).toBeCloseTo(63.6, 2);
  });

  it('devolve o código da recusa quando a estrutura não existe', async () => {
    const result = await chemistryApi.analyze('C(C)(C)(C)(C)C');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('valence_exceeded');
  });
});
