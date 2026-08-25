import type { Quest } from './types';

/**
 * O catálogo de missões do MVP.
 *
 * Cada missão é conteúdo de aula: o enunciado fala de química, os objetivos são
 * verificáveis por número calculado, e as dicas são escritas à mão — nenhuma
 * delas passa por modelo de linguagem.
 *
 * A trilha Otimização **não tem missão**: para o usuário avançado ela é
 * ferramenta livre, sem pontuação nem conquista (ver `DECISOES.md` D-09).
 */
export const CATALOG: readonly Quest[] = [
  // ---------------------------------------------------------------- estrutura
  {
    slug: 'primeiro-carbono',
    track: 'structure',
    difficulty: 1,
    title: 'O primeiro traço',
    brief:
      'Desenhe metano: um único átomo de carbono. Os quatro hidrogênios você não precisa desenhar — o carbono já sabe que eles estão lá, e o RDKit completa.',
    goals: [
      {
        id: 'formula',
        label: 'a fórmula é CH4',
        condition: { kind: 'formula', value: 'CH4' },
      },
    ],
    hints: [
      'Clique uma vez na tela em branco. Um clique, um átomo.',
      'O elemento ativo é o C na barra de ferramentas — é o padrão.',
    ],
  },
  {
    slug: 'alcool-de-dois-carbonos',
    track: 'structure',
    difficulty: 1,
    title: 'O álcool do dia a dia',
    brief:
      'Monte um álcool com dois carbonos. É o etanol: a hidroxila presa a um carbono saturado é o que define a função.',
    goals: [
      {
        id: 'alcool',
        label: 'tem uma hidroxila de álcool',
        condition: { kind: 'group', group: 'alcohol', min: 1 },
      },
      {
        id: 'carbonos',
        label: 'tem exatamente dois carbonos',
        condition: { kind: 'atoms', element: 'C', min: 2, max: 2 },
      },
    ],
    hints: [
      'Comece com dois carbonos ligados: clique e depois arraste do átomo.',
      'Tecle O para trocar o elemento ativo e clique no átomo da ponta.',
    ],
  },
  {
    slug: 'acido-do-vinagre',
    track: 'structure',
    difficulty: 1,
    title: 'O ácido do vinagre',
    brief:
      'Monte o ácido acético. São dois carbonos: um deles carrega a carbonila e a hidroxila juntas — é isso que faz um ácido carboxílico, e não um álcool.',
    goals: [
      {
        id: 'acido',
        label: 'tem um ácido carboxílico',
        condition: { kind: 'group', group: 'carboxylicAcid', min: 1 },
      },
      {
        id: 'formula',
        label: 'a fórmula é C2H4O2',
        condition: { kind: 'formula', value: 'C2H4O2' },
      },
    ],
    hints: [
      'A carbonila é uma ligação dupla com o oxigênio: clique na ligação para girar de simples para dupla.',
      'O mesmo carbono precisa de dois oxigênios: um com dupla, outro com simples.',
    ],
  },
  {
    slug: 'ester-de-quatro-carbonos',
    track: 'structure',
    difficulty: 2,
    title: 'Cheiro de fruta',
    brief:
      'Monte um éster com quatro carbonos. O éster é a carbonila com um oxigênio que leva a outro carbono — a diferença para o ácido é justamente esse carbono do outro lado.',
    goals: [
      {
        id: 'ester',
        label: 'tem um éster',
        condition: { kind: 'group', group: 'ester', min: 1 },
      },
      {
        id: 'carbonos',
        label: 'tem exatamente quatro carbonos',
        condition: { kind: 'atoms', element: 'C', min: 4, max: 4 },
      },
      {
        id: 'sem-acido',
        label: 'e nenhum ácido carboxílico sobrando',
        condition: { kind: 'not', of: { kind: 'group', group: 'carboxylicAcid', min: 1 } },
      },
    ],
    hints: [
      'Acetato de etila serve: dois carbonos de um lado da ligação com o oxigênio, dois do outro.',
      'Se ficar um OH livre na carbonila, você fez um ácido, não um éster.',
    ],
  },
  {
    slug: 'anel-de-benzeno',
    track: 'structure',
    difficulty: 2,
    title: 'O hexágono que não alterna',
    brief:
      'Feche um anel de seis carbonos com duplas alternadas. O RDKit vai perceber a aromaticidade — e as seis ligações passam a ter o mesmo comprimento no espaço, nem simples nem dupla.',
    goals: [
      {
        id: 'formula',
        label: 'a fórmula é C6H6',
        condition: { kind: 'formula', value: 'C6H6' },
      },
      {
        id: 'aromatico',
        label: 'o anel é aromático',
        condition: { kind: 'descriptor', descriptor: 'aromaticRings', min: 1 },
      },
    ],
    hints: [
      'Para fechar o anel, arraste do último átomo até o primeiro: a ponta gruda nele.',
      'Alterne as duplas: uma sim, uma não, ao redor do anel inteiro.',
    ],
  },
  {
    slug: 'amida-simples',
    track: 'structure',
    difficulty: 2,
    title: 'A ligação das proteínas',
    brief:
      'Monte uma amida com até quatro carbonos. É a carbonila ligada direto ao nitrogênio — a mesma ligação que costura os aminoácidos numa proteína.',
    goals: [
      {
        id: 'amida',
        label: 'tem uma amida',
        condition: { kind: 'group', group: 'amide', min: 1 },
      },
      {
        id: 'carbonos',
        label: 'tem no máximo quatro carbonos',
        condition: { kind: 'atoms', element: 'C', min: 1, max: 4 },
      },
    ],
    hints: [
      'Acetamida serve: dois carbonos, um oxigênio com dupla e um nitrogênio.',
      'O nitrogênio precisa estar ligado direto ao carbono da carbonila.',
    ],
  },
  {
    slug: 'cetona-de-tres-carbonos',
    track: 'structure',
    difficulty: 2,
    title: 'Carbonila no meio',
    brief:
      'Monte uma cetona de três carbonos — a propanona. A carbonila precisa estar entre dois carbonos: na ponta da cadeia ela viraria aldeído.',
    goals: [
      {
        id: 'cetona',
        label: 'tem uma cetona',
        condition: { kind: 'group', group: 'ketone', min: 1 },
      },
      {
        id: 'carbonos',
        label: 'tem exatamente três carbonos',
        condition: { kind: 'atoms', element: 'C', min: 3, max: 3 },
      },
      {
        id: 'sem-aldeido',
        label: 'e não é aldeído',
        condition: { kind: 'not', of: { kind: 'group', group: 'aldehyde', min: 1 } },
      },
    ],
    hints: [
      'Três carbonos em linha; a dupla com o oxigênio sai do carbono do meio.',
      'Se o oxigênio for parar num carbono da ponta, o grupo vira aldeído.',
    ],
  },
  {
    slug: 'amina-primaria',
    track: 'structure',
    difficulty: 2,
    title: 'Nitrogênio na ponta',
    brief:
      'Monte uma amina primária com três carbonos. Primária quer dizer que o nitrogênio segura um carbono só — os outros dois lugares dele ficam com hidrogênio.',
    goals: [
      {
        id: 'amina',
        label: 'tem uma amina primária',
        condition: { kind: 'group', group: 'primaryAmine', min: 1 },
      },
      {
        id: 'carbonos',
        label: 'tem exatamente três carbonos',
        condition: { kind: 'atoms', element: 'C', min: 3, max: 3 },
      },
    ],
    hints: [
      'Uma cadeia de três carbonos com o nitrogênio na ponta.',
      'Se o nitrogênio ficar no meio da cadeia, ele passa a ser secundário.',
    ],
  },

  // ---------------------------------------------------------------- geometria
  {
    slug: 'ligacao-que-nao-gira',
    track: 'geometry',
    difficulty: 2,
    title: 'A ligação que não gira',
    brief:
      'Monte o eteno e olhe a cena 3D. A dupla trava a rotação: os dois carbonos e os quatro hidrogênios ficam no mesmo plano, e nenhuma ligação rotacionável aparece na contagem.',
    goals: [
      {
        id: 'alceno',
        label: 'tem uma ligação dupla entre carbonos',
        condition: { kind: 'group', group: 'alkene', min: 1 },
      },
      {
        id: 'formula',
        label: 'a fórmula é C2H4',
        condition: { kind: 'formula', value: 'C2H4' },
      },
      {
        id: 'sem-rotacao',
        label: 'nenhuma ligação rotacionável',
        condition: { kind: 'descriptor', descriptor: 'rotatableBonds', min: 0, max: 0 },
      },
    ],
    hints: [
      'Dois carbonos ligados; clique na ligação para virar dupla.',
      'Compare com o etano: lá a ligação simples gira livre.',
    ],
  },
  {
    slug: 'cadeia-flexivel',
    track: 'geometry',
    difficulty: 2,
    title: 'Cadeia que se dobra',
    brief:
      'Monte uma molécula com pelo menos quatro ligações rotacionáveis. Quanto mais delas, mais formas diferentes a molécula pode assumir — e é isso que a contagem mede.',
    goals: [
      {
        id: 'rotacionaveis',
        label: 'pelo menos quatro ligações rotacionáveis',
        condition: { kind: 'descriptor', descriptor: 'rotatableBonds', min: 4 },
      },
    ],
    hints: [
      'Uma cadeia comprida de carbonos resolve: cada ligação simples do meio conta.',
      'Ligação dentro de anel não conta como rotacionável — ela não gira.',
    ],
  },
  {
    slug: 'dois-aneis',
    track: 'geometry',
    difficulty: 3,
    title: 'Dois anéis',
    brief:
      'Monte uma molécula com dois anéis. Pode ser dois anéis separados ou dois fundidos, compartilhando uma ligação — como na cafeína.',
    goals: [
      {
        id: 'aneis',
        label: 'tem dois anéis ou mais',
        condition: { kind: 'descriptor', descriptor: 'rings', min: 2 },
      },
    ],
    hints: [
      'Naftaleno é o caminho curto: dois hexágonos colados por uma ligação.',
      'Para fundir, feche o segundo anel usando dois átomos que já existem.',
    ],
  },

  // -------------------------------------------------------------- propriedade
  {
    slug: 'regra-de-lipinski',
    track: 'property',
    difficulty: 3,
    title: 'Dentro da regra dos cinco',
    brief:
      'Monte uma molécula de tamanho de fármaco que caiba nos quatro limites de Lipinski: massa até 500, logP até 5, no máximo 5 doadores e 10 aceitadores de ligação de hidrogênio. É uma regra de bolso da química medicinal, não uma promessa sobre o composto.',
    goals: [
      {
        id: 'tamanho',
        label: 'pelo menos 12 átomos pesados',
        condition: { kind: 'descriptor', descriptor: 'heavyAtoms', min: 12 },
      },
      {
        id: 'massa',
        label: 'massa molar até 500 g/mol',
        condition: { kind: 'descriptor', descriptor: 'molarMass', max: 500 },
      },
      {
        id: 'logp',
        label: 'logP até 5',
        condition: { kind: 'descriptor', descriptor: 'logP', max: 5 },
      },
      {
        id: 'doadores',
        label: 'no máximo 5 doadores de ligação de hidrogênio',
        condition: { kind: 'descriptor', descriptor: 'hbDonors', max: 5 },
      },
      {
        id: 'aceitadores',
        label: 'no máximo 10 aceitadores',
        condition: { kind: 'descriptor', descriptor: 'hbAcceptors', max: 10 },
      },
    ],
    hints: [
      'A aspirina passa folgado nos quatro limites — comece por ela e cresça.',
      'Cada oxigênio e cada nitrogênio empurram os contadores de ligação de hidrogênio para cima.',
    ],
  },
  {
    slug: 'area-polar-pequena',
    track: 'property',
    difficulty: 3,
    title: 'Pouca área polar',
    brief:
      'Monte uma molécula de massa entre 150 e 350 com TPSA até 60 Å². A área de superfície polar é a soma das contribuições dos átomos de oxigênio e nitrogênio — a literatura a usa como referência de absorção, e aqui o que vale é o número calculado.',
    goals: [
      {
        id: 'massa',
        label: 'massa molar entre 150 e 350 g/mol',
        condition: { kind: 'descriptor', descriptor: 'molarMass', min: 150, max: 350 },
      },
      {
        id: 'tpsa',
        label: 'TPSA até 60 Å²',
        condition: { kind: 'descriptor', descriptor: 'tpsa', max: 60 },
      },
    ],
    hints: [
      'Anel aromático com uma cadeia carbônica pesa bastante e quase não soma TPSA.',
      'Cada OH acrescenta cerca de 20 Å²; cada nitrogênio, algo entre 3 e 12.',
    ],
  },
  {
    slug: 'polar-e-leve',
    track: 'property',
    difficulty: 3,
    title: 'Polar e pequena',
    brief:
      'Agora o contrário: massa até 250 e TPSA de pelo menos 80 Å². Poucos átomos, muita superfície polar — é a assinatura dos açúcares e dos aminoácidos.',
    goals: [
      {
        id: 'massa',
        label: 'massa molar até 250 g/mol',
        condition: { kind: 'descriptor', descriptor: 'molarMass', max: 250 },
      },
      {
        id: 'tpsa',
        label: 'TPSA de pelo menos 80 Å²',
        condition: { kind: 'descriptor', descriptor: 'tpsa', min: 80 },
      },
    ],
    hints: [
      'Junte hidroxilas: cada uma soma cerca de 20 Å² e pesa só 17.',
      'A glicina chega a 63 Å² — perto, mas ainda não basta. Faltam mais oxigênios.',
    ],
  },
];

/** A missão de um slug, se existir. */
export function findQuest(slug: string): Quest | undefined {
  return CATALOG.find((quest) => quest.slug === slug);
}

/** As missões de uma trilha, da mais fácil para a mais difícil. */
export function questsOfTrack(track: Quest['track']): Quest[] {
  return CATALOG.filter((quest) => quest.track === track).sort(
    (first, second) => first.difficulty - second.difficulty,
  );
}
