import { LOCALES } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { CATALOG, localize } from '../src/catalog';
import { goalLabel } from '../src/messages';
import type { Condition } from '../src/types';

/**
 * O objetivo de missão de professor é **gerado** (D-25): ninguém escreve a
 * frase, ela é derivada da condição. Por isso ela precisa existir nos dois
 * idiomas a partir do mesmo dado — é o que faz a lista montada por um professor
 * brasileiro abrir legível para quem só lê inglês, sem ninguém traduzir nada.
 */
describe('a condição vira frase nos dois idiomas', () => {
  it('conta no singular e no plural, em cada idioma', () => {
    const um: Condition = { kind: 'atoms', element: 'O', min: 1, max: 1 };
    const dois: Condition = { kind: 'atoms', element: 'C', min: 2, max: 2 };

    expect(goalLabel('pt-BR', um)).toBe('tem exatamente 1 átomo de O');
    expect(goalLabel('pt-BR', dois)).toBe('tem exatamente 2 átomos de C');
    expect(goalLabel('en', um)).toBe('has exactly 1 O atom');
    expect(goalLabel('en', dois)).toBe('has exactly 2 C atoms');
  });

  it('o nome do grupo funcional vem do idioma, e o plural cai em "grupo"', () => {
    const condition: Condition = { kind: 'group', group: 'carboxylicAcid', min: 2 };

    expect(goalLabel('pt-BR', condition)).toBe('tem pelo menos 2 grupos ácido carboxílico');
    expect(goalLabel('en', condition)).toBe('has at least 2 carboxylic acid groups');
  });

  /** Massa é número de química: vírgula decimal em português, ponto em inglês. */
  it('o descritor contínuo leva unidade e a pontuação decimal do idioma', () => {
    const faixa: Condition = { kind: 'descriptor', descriptor: 'molarMass', min: 150, max: 350 };

    expect(goalLabel('pt-BR', faixa)).toBe('massa molar entre 150 g/mol e 350 g/mol');
    expect(goalLabel('en', faixa)).toBe('molar mass between 150 g/mol and 350 g/mol');
  });

  it('a área polar carrega o angstrom ao quadrado nos dois idiomas', () => {
    const condition: Condition = { kind: 'descriptor', descriptor: 'tpsa', max: 60 };

    expect(goalLabel('pt-BR', condition)).toBe('TPSA até 60 Å²');
    expect(goalLabel('en', condition)).toBe('TPSA up to 60 Å²');
  });

  it('nenhuma condição do catálogo fica sem frase em nenhum dos idiomas', () => {
    for (const locale of LOCALES) {
      for (const spec of CATALOG) {
        for (const goal of spec.goals) {
          const derived = goalLabel(locale, goal.condition);
          expect(derived.trim().length, `${spec.slug}/${goal.id} em ${locale}`).toBeGreaterThan(0);
          expect(derived).not.toContain('undefined');
        }
      }
    }
  });

  /**
   * O que impede o texto de um idioma vazar para o outro. Sem isto, uma chave
   * esquecida no inglês passaria despercebida: a frase apareceria em português
   * dentro de uma tela inteira em inglês, e só quem lê inglês notaria.
   */
  it('a missão do catálogo abre inteira em cada idioma, sem frase do outro', () => {
    const emIngles = localize(CATALOG[0]!, 'en');
    const emPortugues = localize(CATALOG[0]!, 'pt-BR');

    expect(emIngles.title).not.toBe(emPortugues.title);
    expect(emIngles.brief).not.toBe(emPortugues.brief);
    expect(emIngles.hints.length).toBe(emPortugues.hints.length);
    expect(emIngles.goals.map((goal) => goal.id)).toEqual(emPortugues.goals.map((goal) => goal.id));
  });
});
