import { dictionaryDivergences } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { messages } from './messages';

describe('as telas de turma falam os dois idiomas', () => {
  it('nenhuma chave sem par, nenhum texto vazio', () => {
    expect(dictionaryDivergences(messages)).toEqual([]);
  });

  /**
   * A contagem aparece em lista, em missão, em dica e em aluno. "1 missões" na
   * tela de um professor é o tipo de descuido que tira a confiança do resto.
   */
  it('a contagem concorda em número nos dois idiomas', () => {
    const pt = messages['pt-BR'].classroomSection;
    const en = messages.en.classroomSection;

    expect(pt.itemCount(1)).toBe('1 missão');
    expect(pt.itemCount(0)).toBe('0 missões');
    expect(pt.itemCount(4)).toBe('4 missões');
    expect(en.itemCount(1)).toBe('1 mission');
    expect(en.itemCount(0)).toBe('0 missions');
    expect(en.itemCount(4)).toBe('4 missions');
  });

  it('a lista publicada conta missão e aluno nos dois idiomas', () => {
    expect(messages['pt-BR'].assignment.publishedStatus('21/09/2026', 1, 1)).toContain(
      '1 missão · 1 aluno na turma',
    );
    expect(messages.en.assignment.publishedStatus('Sep 21, 2026', 1, 1)).toContain(
      '1 mission · 1 student in the class',
    );
  });

  /**
   * O glossário do D-30: uma palavra por coisa, e a mesma palavra em todas as
   * telas e na documentação em inglês — "mission", "assignment", "catalog",
   * "shelf". Se "assignment" virar "list" numa chave, o professor lê duas
   * coisas diferentes para a mesma coisa — que é exatamente o que a §2 de
   * `docs/ROTEIROS.md` impede em português.
   */
  it('o inglês não troca de palavra no meio do caminho', () => {
    const en = messages.en;

    expect(en.classroomSection.heading).toContain('Assignments');
    expect(en.assignment.nameLabel).toContain('Assignment');
    expect(en.catalogPicker.label).toContain('catalog');
    expect(en.catalog.pageTitle).toBe('Catalog');
    expect(en.authoring.keptInside).toContain('shelf');
    expect(en.studentAssignments.byTeacherLabel).toContain('mission');
  });

  /**
   * A tela de promoção precisa dizer o poder inteiro que entrega. Encurtar essa
   * frase na tradução tiraria a única proteção real contra promover a pessoa
   * errada (D-29).
   */
  it('o aviso da promoção diz, nos dois idiomas, que o código abre a conta do aluno', () => {
    expect(messages['pt-BR'].staff.warning).toContain('entrar na conta de um aluno');
    expect(messages.en.staff.warning).toContain('get into a student account');
  });
});
