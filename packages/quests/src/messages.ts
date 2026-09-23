import { dictionary, formatNumber, functionalGroupName, pick, type Locale } from '@rotamer/i18n';
import type { Condition, Range } from './types';

/**
 * O texto das missões, nos dois idiomas.
 *
 * O catálogo em `catalog.ts` guarda só o que decide — slug, trilha, dificuldade
 * e as condições. O enunciado, as dicas e o rótulo de cada objetivo vivem aqui,
 * porque são conteúdo de aula e mudam de idioma; a condição, não.
 *
 * Objetivo de missão de professor não aparece nesta lista: ele é **gerado** a
 * partir da molécula que o professor desenhou (D-25), e quem o escreve nos dois
 * idiomas é `goalLabel`, lendo a mesma condição que o servidor avalia. É por
 * isso que uma lista montada por um professor brasileiro abre legível para um
 * aluno que só lê inglês, sem ninguém traduzir nada à mão.
 */

/** O nome de cada trilha. A Otimização não tem missão — e por isso não está aqui. */
export const trackNames = dictionary({
  'pt-BR': {
    structure: 'Estrutura',
    geometry: 'Geometria',
    property: 'Propriedade',
  },
  en: {
    structure: 'Structure',
    geometry: 'Geometry',
    property: 'Property',
  },
});

/**
 * Como cada condição é lida em voz alta.
 *
 * Nenhuma frase aqui decide nada: quem compara número é `meets`, e o que se faz
 * neste arquivo é dizer, em cada idioma, o que aquela comparação cobra.
 */
const phrases = dictionary({
  'pt-BR': {
    count: {
      exact: (n: string, noun: string) => `tem exatamente ${n} ${noun}`,
      atLeast: (n: string, noun: string) => `tem pelo menos ${n} ${noun}`,
      atMost: (n: string, noun: string) => `tem no máximo ${n} ${noun}`,
      between: (min: string, max: string, noun: string) => `tem entre ${min} e ${max} ${noun}`,
      any: (noun: string) => `tem ${noun}`,
    },
    measure: {
      exact: (n: string, name: string) => `${name} igual a ${n}`,
      atLeast: (n: string, name: string) => `${name} de pelo menos ${n}`,
      atMost: (n: string, name: string) => `${name} até ${n}`,
      between: (min: string, max: string, name: string) => `${name} entre ${min} e ${max}`,
      any: (name: string) => `${name} em qualquer valor`,
    },
    formula: (value: string) => `a fórmula é ${value}`,
    identity: 'é exatamente esta molécula',
    /**
     * O objetivo mais comum da estereoquímica, dito do jeito que se fala.
     * "Tem no máximo 0 centros estereogênicos sem configuração" é a mesma
     * condição e ninguém leria até o fim.
     */
    allStereoSpecified: 'nenhum centro estereogênico fica sem configuração',
    not: (inner: string) => `não é o caso de: ${inner}`,
    every: ' e ',
    some: ' ou ',
    /** `1 grupo éster`, `2 grupos éster` — o plural cai em "grupo", nunca no nome do grupo. */
    group: (n: number, name: string) => `${n === 1 ? 'grupo' : 'grupos'} ${name}`,
    atoms: (n: number, element: string) => `${n === 1 ? 'átomo' : 'átomos'} de ${element}`,
    noun: {
      rings: (n: number) => (n === 1 ? 'anel' : 'anéis'),
      aromaticRings: (n: number) => (n === 1 ? 'anel aromático' : 'anéis aromáticos'),
      rotatableBonds: (n: number) => (n === 1 ? 'ligação rotacionável' : 'ligações rotacionáveis'),
      hbDonors: (n: number) =>
        n === 1 ? 'doador de ligação de hidrogênio' : 'doadores de ligação de hidrogênio',
      hbAcceptors: (n: number) =>
        n === 1 ? 'aceitador de ligação de hidrogênio' : 'aceitadores de ligação de hidrogênio',
      heavyAtoms: (n: number) => (n === 1 ? 'átomo pesado' : 'átomos pesados'),
      heteroatoms: (n: number) => (n === 1 ? 'heteroátomo' : 'heteroátomos'),
      stereocenters: (n: number) => (n === 1 ? 'centro estereogênico' : 'centros estereogênicos'),
      unspecifiedStereocenters: (n: number) =>
        n === 1
          ? 'centro estereogênico sem configuração'
          : 'centros estereogênicos sem configuração',
    },
    measured: {
      molarMass: 'massa molar',
      exactMass: 'massa exata',
      tpsa: 'TPSA',
      logP: 'logP',
    },
  },

  en: {
    count: {
      exact: (n: string, noun: string) => `has exactly ${n} ${noun}`,
      atLeast: (n: string, noun: string) => `has at least ${n} ${noun}`,
      atMost: (n: string, noun: string) => `has at most ${n} ${noun}`,
      between: (min: string, max: string, noun: string) => `has between ${min} and ${max} ${noun}`,
      any: (noun: string) => `has ${noun}`,
    },
    measure: {
      exact: (n: string, name: string) => `${name} equal to ${n}`,
      atLeast: (n: string, name: string) => `${name} of at least ${n}`,
      atMost: (n: string, name: string) => `${name} up to ${n}`,
      between: (min: string, max: string, name: string) => `${name} between ${min} and ${max}`,
      any: (name: string) => `${name} at any value`,
    },
    formula: (value: string) => `the formula is ${value}`,
    identity: 'is exactly this molecule',
    allStereoSpecified: 'no stereocenter is left unspecified',
    not: (inner: string) => `it is not the case that it ${inner}`,
    every: ' and ',
    some: ' or ',
    group: (n: number, name: string) => `${name} ${n === 1 ? 'group' : 'groups'}`,
    atoms: (n: number, element: string) => `${element} ${n === 1 ? 'atom' : 'atoms'}`,
    noun: {
      rings: (n: number) => (n === 1 ? 'ring' : 'rings'),
      aromaticRings: (n: number) => (n === 1 ? 'aromatic ring' : 'aromatic rings'),
      rotatableBonds: (n: number) => (n === 1 ? 'rotatable bond' : 'rotatable bonds'),
      hbDonors: (n: number) => (n === 1 ? 'hydrogen bond donor' : 'hydrogen bond donors'),
      hbAcceptors: (n: number) => (n === 1 ? 'hydrogen bond acceptor' : 'hydrogen bond acceptors'),
      heavyAtoms: (n: number) => (n === 1 ? 'heavy atom' : 'heavy atoms'),
      heteroatoms: (n: number) => (n === 1 ? 'heteroatom' : 'heteroatoms'),
      stereocenters: (n: number) => (n === 1 ? 'stereocenter' : 'stereocenters'),
      unspecifiedStereocenters: (n: number) =>
        n === 1 ? 'unspecified stereocenter' : 'unspecified stereocenters',
    },
    measured: {
      molarMass: 'molar mass',
      exactMass: 'exact mass',
      tpsa: 'TPSA',
      logP: 'logP',
    },
  },
});

/** Unidade do descritor contínuo. Não muda de idioma — é do SI, não da língua. */
const UNITS: Readonly<Record<string, string>> = {
  molarMass: ' g/mol',
  exactMass: ' g/mol',
  tpsa: ' Å²',
  logP: '',
};

type Phrases = (typeof phrases)['pt-BR'];

/** A faixa dita em palavras, com o substantivo já concordado com o número. */
function sayCount(p: Phrases, range: Range, noun: (n: number) => string): string {
  const { min, max } = range;

  if (min !== undefined && max !== undefined) {
    return min === max
      ? p.count.exact(String(min), noun(min))
      : p.count.between(String(min), String(max), noun(max));
  }
  if (min !== undefined) return p.count.atLeast(String(min), noun(min));
  if (max !== undefined) return p.count.atMost(String(max), noun(max));
  return p.count.any(noun(2));
}

/** O mesmo para descritor contínuo, onde o número leva unidade e vírgula decimal. */
function sayMeasure(p: Phrases, locale: Locale, range: Range, name: string, unit: string): string {
  const text = (n: number): string => `${formatNumber(locale, n, 0)}${unit}`;
  const { min, max } = range;

  if (min !== undefined && max !== undefined) {
    return min === max
      ? p.measure.exact(text(min), name)
      : p.measure.between(text(min), text(max), name);
  }
  if (min !== undefined) return p.measure.atLeast(text(min), name);
  if (max !== undefined) return p.measure.atMost(text(max), name);
  return p.measure.any(name);
}

/**
 * A condição dita no idioma de quem lê.
 *
 * É o que permite ao objetivo gerado (D-25) existir nos dois idiomas sem nenhum
 * texto gravado no banco: a condição é o dado, a frase é derivada dela.
 */
export function goalLabel(locale: Locale, condition: Condition): string {
  const p = pick(phrases, locale);

  switch (condition.kind) {
    case 'formula':
      return p.formula(condition.value);

    case 'inchiKey':
      return p.identity;

    case 'group': {
      const name = functionalGroupName(locale, condition.group);
      return sayCount(p, condition, (n) => p.group(n, name));
    }

    case 'atoms':
      return sayCount(p, condition, (n) => p.atoms(n, condition.element));

    case 'descriptor': {
      if (condition.descriptor === 'unspecifiedStereocenters' && condition.max === 0) {
        return p.allStereoSpecified;
      }

      const measured = p.measured[condition.descriptor as keyof Phrases['measured']] as
        | string
        | undefined;
      if (measured !== undefined) {
        return sayMeasure(p, locale, condition, measured, UNITS[condition.descriptor] ?? '');
      }

      return sayCount(p, condition, p.noun[condition.descriptor as keyof Phrases['noun']]);
    }

    case 'not':
      return p.not(goalLabel(locale, condition.of));

    case 'every':
      return condition.of.map((inner) => goalLabel(locale, inner)).join(p.every);

    case 'some':
      return condition.of.map((inner) => goalLabel(locale, inner)).join(p.some);
  }
}
