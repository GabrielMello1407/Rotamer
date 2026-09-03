import { analyze, type Molecule } from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import { findQuest } from '../src/catalog';
import { evaluateAnalysis, evaluateQuest } from '../src/evaluate';
import type { Assessable } from '../src/types';

/**
 * `evaluateQuest` não pode saber a diferença entre uma missão do catálogo e
 * uma missão de professor (`Assessable`): as duas são só `{ slug, goals }`
 * na hora de avaliar (§4.4). Este teste prova que o veredito é o mesmo para
 * as duas formas, com os mesmos objetivos.
 */
async function moleculeOf(smiles: string): Promise<Molecule> {
  const result = await analyze(smiles);
  if (!result.ok) throw new Error(`esperava molécula, veio erro: ${result.error.message}`);
  return result.molecule;
}

function quest(slug: string) {
  const found = findQuest(slug);
  if (!found) throw new Error(`missão ${slug} não existe no catálogo`);
  return found;
}

describe('evaluateQuest sobre Assessable', () => {
  it('devolve o mesmo veredito para a Quest do catálogo e para um Assessable com os mesmos goals', async () => {
    const missao = quest('alcool-de-dois-carbonos');
    const etanol = await moleculeOf('CCO');

    const comQuest = evaluateQuest(missao, etanol);

    const assessable: Assessable = { slug: missao.slug, goals: missao.goals };
    const comAssessable = evaluateQuest(assessable, etanol);

    expect(comAssessable).toEqual(comQuest);
  });

  it('o mesmo vale para uma missão que não cumpre — mesmo score e mesmos objetivos travados', async () => {
    const missao = quest('ester-de-quatro-carbonos');
    const acidoAcetico = await moleculeOf('CC(=O)O');

    const comQuest = evaluateQuest(missao, acidoAcetico);
    const comAssessable = evaluateQuest({ slug: missao.slug, goals: missao.goals }, acidoAcetico);

    expect(comAssessable).toEqual(comQuest);
    expect(comAssessable.passed).toBe(false);
  });
});

describe('evaluateAnalysis sobre Assessable puro', () => {
  it('avalia um Assessable só com slug e goals, sem track, difficulty nem title', async () => {
    // `assessable` não tem `track`, `difficulty` nem `title`. Se
    // `evaluateAnalysis` (evaluate.ts:47) exigisse `Quest` em vez de
    // `Assessable`, esta linha não passaria no `typecheck` — é o próprio
    // compilador quem protege a regra, não uma asserção em tempo de
    // execução. Uma missão `professor:` também não tem esses campos (§4.4 de
    // `docs/ROTEIROS.md`), e o painel local do aluno chama esta função para
    // reagir à digitação sem esperar o servidor.
    const etanol = await moleculeOf('CCO');
    const assessable: Assessable = {
      slug: 'professor:clxteste00000000000000000',
      goals: [
        {
          id: 'formula',
          label: 'a fórmula é C2H6O',
          condition: { kind: 'formula', value: 'C2H6O' },
        },
      ],
    };

    const resultado = evaluateAnalysis(assessable, { ok: true, molecule: etanol });

    expect(resultado.slug).toBe(assessable.slug);
    expect(resultado.passed).toBe(true);
    expect(resultado.score).toBe(100);
  });

  it('estrutura inválida não reprova nem dá nota, também para um Assessable puro', () => {
    const assessable: Assessable = {
      slug: 'professor:clxteste00000000000000000',
      goals: [{ id: 'formula', label: 'a fórmula é C2H6O', condition: { kind: 'formula', value: 'C2H6O' } }],
    };

    const resultado = evaluateAnalysis(assessable, null);

    expect(resultado.passed).toBe(false);
    expect(resultado.score).toBe(0);
  });
});
