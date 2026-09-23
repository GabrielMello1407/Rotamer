import { dictionary } from '@rotamer/i18n';

/**
 * A página pública de uma molécula, e a imagem que ela gera para o link.
 *
 * É a página que sai do produto: vai para o grupo da turma, para o buscador e
 * para o cartão de link de quem compartilhou. Por isso o texto dela também
 * atravessa — quem recebe o link em inglês recebe a página em inglês, e o
 * cartão junto.
 *
 * Nome de descritor é notação e fica: TPSA, logP, SMILES, InChIKey, `g/mol`,
 * `Å²`. O apelido de quem batizou é conteúdo de quem usa e nunca se traduz.
 */
export const moleculeMessages = dictionary({
  'pt-BR': {
    invalidTitle: 'Estrutura inválida · Rotamer',
    title: (formula: string) => `${formula} · Rotamer`,
    ogTitle: (formula: string, mass: string) => `${formula} — ${mass} g/mol`,
    /** A descrição do buscador: fórmula, massa e os grupos que o RDKit achou. */
    description: (formula: string, mass: string, groups: string) =>
      `${formula} · ${mass} g/mol${groups === '' ? '' : ` · ${groups}`}. Descritores calculados pelo RDKit.`,

    namedBy: (who: string) => `apelido dado por ${who} dentro do Rotamer — não é nomenclatura`,

    tpsa: 'TPSA',
    logP: 'logP',
    rotatable: 'rotacionáveis',
    aromaticRings: 'anéis aromáticos',
    stereocenters: 'estereocentros',
    unspecified: 'sem configuração',
    hbDonors: 'doadores de H',
    hbAcceptors: 'aceitadores de H',
    groups: 'grupos funcionais',
    smiles: 'SMILES',
    inchiKey: 'InChIKey',

    openInEditor: 'Abrir esta molécula no editor →',
    footerComputed:
      'Todos os números desta página foram calculados pelo RDKit a partir da estrutura. Nada aqui passou por modelo de linguagem.',
    footerLicense: 'Rotamer · código aberto, licença MIT. Química por RDKit (BSD-3-Clause).',

    /**
     * A imagem de link, desenhada no servidor.
     *
     * Os rótulos vão em caixa alta na figura, e por isso ficam escritos assim
     * aqui: em inglês, `logP` é símbolo e não passa por caixa alta — o que já
     * era verdade em português.
     */
    cardAlt: 'Fórmula e descritores da molécula, calculados pelo RDKit',
    cardMolarMass: 'MASSA MOLAR',
    cardAromaticRings: 'ANÉIS AROMÁTICOS',
    cardFooter: 'Calculado pelo RDKit. Nada aqui passou por modelo de linguagem.',
  },

  en: {
    invalidTitle: 'Invalid structure · Rotamer',
    title: (formula: string) => `${formula} · Rotamer`,
    ogTitle: (formula: string, mass: string) => `${formula} — ${mass} g/mol`,
    description: (formula: string, mass: string, groups: string) =>
      `${formula} · ${mass} g/mol${groups === '' ? '' : ` · ${groups}`}. Descriptors computed by RDKit.`,

    namedBy: (who: string) => `nickname given by ${who} inside Rotamer — it is not nomenclature`,

    tpsa: 'TPSA',
    logP: 'logP',
    rotatable: 'rotatable',
    aromaticRings: 'aromatic rings',
    stereocenters: 'stereocenters',
    unspecified: 'unspecified',
    hbDonors: 'H donors',
    hbAcceptors: 'H acceptors',
    groups: 'functional groups',
    smiles: 'SMILES',
    inchiKey: 'InChIKey',

    openInEditor: 'Open this molecule in the editor →',
    footerComputed:
      'Every number on this page was computed by RDKit from the structure. Nothing here went through a language model.',
    footerLicense: 'Rotamer · open source, MIT license. Chemistry by RDKit (BSD-3-Clause).',

    cardAlt: 'Formula and descriptors of the molecule, computed by RDKit',
    cardMolarMass: 'MOLAR MASS',
    cardAromaticRings: 'AROMATIC RINGS',
    cardFooter: 'Computed by RDKit. Nothing here went through a language model.',
  },
});
