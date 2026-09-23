import { dictionary, pick, type Locale } from '@rotamer/i18n';

/**
 * O que se lê de cada missão do catálogo, nos dois idiomas.
 *
 * O par deste arquivo é `catalog.ts`, que guarda só o que decide: slug, trilha,
 * dificuldade e condição. Aqui fica o conteúdo de aula — o enunciado fala de
 * química, as dicas foram escritas à mão e **nenhuma delas passa por modelo de
 * linguagem**, em nenhum dos dois idiomas.
 *
 * O rótulo de objetivo é escrito à mão de propósito: "tem uma hidroxila de
 * álcool" ensina mais do que o "tem pelo menos 1 grupo álcool" que `goalLabel`
 * derivaria da condição. A missão de professor, que é gerada, usa a frase
 * derivada — ali não há ninguém para escrever.
 */
export const catalogText = dictionary({
  'pt-BR': {
    'primeiro-carbono': {
      title: 'O primeiro traço',
      brief:
        'Desenhe metano: um único átomo de carbono. Os quatro hidrogênios você não precisa desenhar — o carbono já sabe que eles estão lá, e o RDKit completa.',
      goals: { formula: 'a fórmula é CH4' },
      hints: [
        'Clique uma vez na tela em branco. Um clique, um átomo.',
        'O elemento ativo é o C na barra de ferramentas — é o padrão.',
      ],
    },
    'alcool-de-dois-carbonos': {
      title: 'O álcool do dia a dia',
      brief:
        'Monte um álcool com dois carbonos. É o etanol: a hidroxila presa a um carbono saturado é o que define a função.',
      goals: {
        alcool: 'tem uma hidroxila de álcool',
        carbonos: 'tem exatamente dois carbonos',
      },
      hints: [
        'Comece com dois carbonos ligados: clique e depois arraste do átomo.',
        'Tecle O para trocar o elemento ativo e clique no átomo da ponta.',
      ],
    },
    'acido-do-vinagre': {
      title: 'O ácido do vinagre',
      brief:
        'Monte o ácido acético. São dois carbonos: um deles carrega a carbonila e a hidroxila juntas — é isso que faz um ácido carboxílico, e não um álcool.',
      goals: {
        acido: 'tem um ácido carboxílico',
        formula: 'a fórmula é C2H4O2',
      },
      hints: [
        'A carbonila é uma ligação dupla com o oxigênio: clique na ligação para girar de simples para dupla.',
        'O mesmo carbono precisa de dois oxigênios: um com dupla, outro com simples.',
      ],
    },
    'ester-de-quatro-carbonos': {
      title: 'Cheiro de fruta',
      brief:
        'Monte um éster com quatro carbonos. O éster é a carbonila com um oxigênio que leva a outro carbono — a diferença para o ácido é justamente esse carbono do outro lado.',
      goals: {
        ester: 'tem um éster',
        carbonos: 'tem exatamente quatro carbonos',
        'sem-acido': 'e nenhum ácido carboxílico sobrando',
      },
      hints: [
        'Acetato de etila serve: dois carbonos de um lado da ligação com o oxigênio, dois do outro.',
        'Se ficar um OH livre na carbonila, você fez um ácido, não um éster.',
      ],
    },
    'anel-de-benzeno': {
      title: 'O hexágono que não alterna',
      brief:
        'Feche um anel de seis carbonos com duplas alternadas. O RDKit vai perceber a aromaticidade — e as seis ligações passam a ter o mesmo comprimento no espaço, nem simples nem dupla.',
      goals: {
        formula: 'a fórmula é C6H6',
        aromatico: 'o anel é aromático',
      },
      hints: [
        'Para fechar o anel, arraste do último átomo até o primeiro: a ponta gruda nele.',
        'Alterne as duplas: uma sim, uma não, ao redor do anel inteiro.',
      ],
    },
    'amida-simples': {
      title: 'A ligação das proteínas',
      brief:
        'Monte uma amida com até quatro carbonos. É a carbonila ligada direto ao nitrogênio — a mesma ligação que costura os aminoácidos numa proteína.',
      goals: {
        amida: 'tem uma amida',
        carbonos: 'tem no máximo quatro carbonos',
      },
      hints: [
        'Acetamida serve: dois carbonos, um oxigênio com dupla e um nitrogênio.',
        'O nitrogênio precisa estar ligado direto ao carbono da carbonila.',
      ],
    },
    'cetona-de-tres-carbonos': {
      title: 'Carbonila no meio',
      brief:
        'Monte uma cetona de três carbonos — a propanona. A carbonila precisa estar entre dois carbonos: na ponta da cadeia ela viraria aldeído.',
      goals: {
        cetona: 'tem uma cetona',
        carbonos: 'tem exatamente três carbonos',
        'sem-aldeido': 'e não é aldeído',
      },
      hints: [
        'Três carbonos em linha; a dupla com o oxigênio sai do carbono do meio.',
        'Se o oxigênio for parar num carbono da ponta, o grupo vira aldeído.',
      ],
    },
    'amina-primaria': {
      title: 'Nitrogênio na ponta',
      brief:
        'Monte uma amina primária com três carbonos. Primária quer dizer que o nitrogênio segura um carbono só — os outros dois lugares dele ficam com hidrogênio.',
      goals: {
        amina: 'tem uma amina primária',
        carbonos: 'tem exatamente três carbonos',
      },
      hints: [
        'Uma cadeia de três carbonos com o nitrogênio na ponta.',
        'Se o nitrogênio ficar no meio da cadeia, ele passa a ser secundário.',
      ],
    },
    'centro-com-lado': {
      title: 'Um carbono com lado',
      brief:
        'Desenhe um carbono ligado a quatro coisas diferentes e diga de que lado ele é. Sem a cunha, o desenho mostra que existe um centro e não diz qual dos dois espelhos é — e são moléculas diferentes, com cheiro, sabor e efeito diferentes.',
      goals: {
        centro: 'existe um centro estereogênico',
        definido: 'nenhum centro ficou sem configuração',
      },
      hints: [
        'Quatro grupos diferentes no mesmo carbono: bromo, cloro, flúor e o hidrogênio que o RDKit completa já servem.',
        'Na barra de ferramentas, a cunha. Clicando na ligação ela vira cunha cheia (vem para frente), depois tracejada (vai para trás).',
        'A ponta fina da cunha fica no carbono do centro. Segurando Shift, a cunha vira de lado — e o centro troca de configuração.',
      ],
    },
    'ligacao-que-nao-gira': {
      title: 'A ligação que não gira',
      brief:
        'Monte o eteno e olhe a cena 3D. A dupla trava a rotação: os dois carbonos e os quatro hidrogênios ficam no mesmo plano, e nenhuma ligação rotacionável aparece na contagem.',
      goals: {
        alceno: 'tem uma ligação dupla entre carbonos',
        formula: 'a fórmula é C2H4',
        'sem-rotacao': 'nenhuma ligação rotacionável',
      },
      hints: [
        'Dois carbonos ligados; clique na ligação para virar dupla.',
        'Compare com o etano: lá a ligação simples gira livre.',
      ],
    },
    'cadeia-flexivel': {
      title: 'Cadeia que se dobra',
      brief:
        'Monte uma molécula com pelo menos quatro ligações rotacionáveis. Quanto mais delas, mais formas diferentes a molécula pode assumir — e é isso que a contagem mede.',
      goals: { rotacionaveis: 'pelo menos quatro ligações rotacionáveis' },
      hints: [
        'Uma cadeia comprida de carbonos resolve: cada ligação simples do meio conta.',
        'Ligação dentro de anel não conta como rotacionável — ela não gira.',
      ],
    },
    'dois-aneis': {
      title: 'Dois anéis',
      brief:
        'Monte uma molécula com dois anéis. Pode ser dois anéis separados ou dois fundidos, compartilhando uma ligação — como na cafeína.',
      goals: { aneis: 'tem dois anéis ou mais' },
      hints: [
        'Naftaleno é o caminho curto: dois hexágonos colados por uma ligação.',
        'Para fundir, feche o segundo anel usando dois átomos que já existem.',
      ],
    },
    'regra-de-lipinski': {
      title: 'Dentro da regra dos cinco',
      brief:
        'Monte uma molécula de tamanho de fármaco que caiba nos quatro limites de Lipinski: massa até 500, logP até 5, no máximo 5 doadores e 10 aceitadores de ligação de hidrogênio. É uma regra de bolso da química medicinal, não uma promessa sobre o composto.',
      goals: {
        tamanho: 'pelo menos 12 átomos pesados',
        massa: 'massa molar até 500 g/mol',
        logp: 'logP até 5',
        doadores: 'no máximo 5 doadores de ligação de hidrogênio',
        aceitadores: 'no máximo 10 aceitadores',
      },
      hints: [
        'A aspirina passa folgado nos quatro limites — comece por ela e cresça.',
        'Cada oxigênio e cada nitrogênio empurram os contadores de ligação de hidrogênio para cima.',
      ],
    },
    'area-polar-pequena': {
      title: 'Pouca área polar',
      brief:
        'Monte uma molécula de massa entre 150 e 350 com TPSA até 60 Å². A área de superfície polar é a soma das contribuições dos átomos de oxigênio e nitrogênio — a literatura a usa como referência de absorção, e aqui o que vale é o número calculado.',
      goals: {
        massa: 'massa molar entre 150 e 350 g/mol',
        tpsa: 'TPSA até 60 Å²',
      },
      hints: [
        'Anel aromático com uma cadeia carbônica pesa bastante e quase não soma TPSA.',
        'Cada OH acrescenta cerca de 20 Å²; cada nitrogênio, algo entre 3 e 12.',
      ],
    },
    'polar-e-leve': {
      title: 'Polar e pequena',
      brief:
        'Agora o contrário: massa até 250 e TPSA de pelo menos 80 Å². Poucos átomos, muita superfície polar — é a assinatura dos açúcares e dos aminoácidos.',
      goals: {
        massa: 'massa molar até 250 g/mol',
        tpsa: 'TPSA de pelo menos 80 Å²',
      },
      hints: [
        'Junte hidroxilas: cada uma soma cerca de 20 Å² e pesa só 17.',
        'A glicina chega a 63 Å² — perto, mas ainda não basta. Faltam mais oxigênios.',
      ],
    },
  },

  en: {
    'primeiro-carbono': {
      title: 'The first stroke',
      brief:
        'Draw methane: a single carbon atom. You do not have to draw the four hydrogens — carbon already knows they are there, and RDKit fills them in.',
      goals: { formula: 'the formula is CH4' },
      hints: [
        'Click once on the blank canvas. One click, one atom.',
        'The active element is C in the toolbar — it is the default.',
      ],
    },
    'alcool-de-dois-carbonos': {
      title: 'The everyday alcohol',
      brief:
        'Build an alcohol with two carbons. This is ethanol: a hydroxyl attached to a saturated carbon is what defines the group.',
      goals: {
        alcool: 'has an alcohol hydroxyl',
        carbonos: 'has exactly two carbons',
      },
      hints: [
        'Start with two bonded carbons: click, then drag from the atom.',
        'Press O to change the active element and click the end atom.',
      ],
    },
    'acido-do-vinagre': {
      title: 'The acid in vinegar',
      brief:
        'Build acetic acid. It is two carbons: one of them carries the carbonyl and the hydroxyl together — that is what makes a carboxylic acid rather than an alcohol.',
      goals: {
        acido: 'has a carboxylic acid',
        formula: 'the formula is C2H4O2',
      },
      hints: [
        'The carbonyl is a double bond to oxygen: click the bond to cycle it from single to double.',
        'The same carbon needs two oxygens: one double bonded, one single bonded.',
      ],
    },
    'ester-de-quatro-carbonos': {
      title: 'Smells of fruit',
      brief:
        'Build an ester with four carbons. An ester is the carbonyl with an oxygen that leads to another carbon — that carbon on the far side is exactly what tells it apart from an acid.',
      goals: {
        ester: 'has an ester',
        carbonos: 'has exactly four carbons',
        'sem-acido': 'and no carboxylic acid left over',
      },
      hints: [
        'Ethyl acetate works: two carbons on one side of the bond to oxygen, two on the other.',
        'If a free OH is left on the carbonyl, you have made an acid, not an ester.',
      ],
    },
    'anel-de-benzeno': {
      title: 'The hexagon that does not alternate',
      brief:
        'Close a ring of six carbons with alternating double bonds. RDKit will see the aromaticity — and all six bonds end up the same length in space, neither single nor double.',
      goals: {
        formula: 'the formula is C6H6',
        aromatico: 'the ring is aromatic',
      },
      hints: [
        'To close the ring, drag from the last atom to the first: the end snaps onto it.',
        'Alternate the double bonds: one yes, one no, all the way round the ring.',
      ],
    },
    'amida-simples': {
      title: 'The bond that makes proteins',
      brief:
        'Build an amide with at most four carbons. It is the carbonyl bonded straight to nitrogen — the same bond that stitches amino acids into a protein.',
      goals: {
        amida: 'has an amide',
        carbonos: 'has at most four carbons',
      },
      hints: [
        'Acetamide works: two carbons, one double bonded oxygen and one nitrogen.',
        'The nitrogen has to be bonded straight to the carbonyl carbon.',
      ],
    },
    'cetona-de-tres-carbonos': {
      title: 'Carbonyl in the middle',
      brief:
        'Build a three-carbon ketone — propanone. The carbonyl has to sit between two carbons: at the end of the chain it would become an aldehyde.',
      goals: {
        cetona: 'has a ketone',
        carbonos: 'has exactly three carbons',
        'sem-aldeido': 'and is not an aldehyde',
      },
      hints: [
        'Three carbons in a row; the double bond to oxygen leaves the middle carbon.',
        'If the oxygen lands on an end carbon, the group becomes an aldehyde.',
      ],
    },
    'amina-primaria': {
      title: 'Nitrogen at the end',
      brief:
        'Build a primary amine with three carbons. Primary means the nitrogen holds a single carbon — its other two places are taken by hydrogen.',
      goals: {
        amina: 'has a primary amine',
        carbonos: 'has exactly three carbons',
      },
      hints: [
        'A chain of three carbons with the nitrogen at the end.',
        'If the nitrogen ends up in the middle of the chain, it becomes secondary.',
      ],
    },
    'centro-com-lado': {
      title: 'A carbon with a handedness',
      brief:
        'Draw a carbon bonded to four different things and say which way round it is. Without the wedge, the drawing shows that a center exists but not which of the two mirror images it is — and those are different molecules, with different smell, taste and effect.',
      goals: {
        centro: 'a stereocenter exists',
        definido: 'no center was left unspecified',
      },
      hints: [
        'Four different groups on the same carbon: bromine, chlorine, fluorine and the hydrogen RDKit fills in are enough.',
        'The wedge is in the toolbar. Clicking the bond turns it into a solid wedge (coming forward), then a hashed one (going back).',
        'The narrow end of the wedge stays on the center carbon. Holding Shift flips the wedge — and the center changes configuration.',
      ],
    },
    'ligacao-que-nao-gira': {
      title: 'The bond that does not turn',
      brief:
        'Build ethene and look at the 3D scene. The double bond locks rotation: both carbons and all four hydrogens stay in the same plane, and no rotatable bond shows up in the count.',
      goals: {
        alceno: 'has a double bond between carbons',
        formula: 'the formula is C2H4',
        'sem-rotacao': 'no rotatable bond',
      },
      hints: [
        'Two bonded carbons; click the bond to make it double.',
        'Compare it with ethane: there the single bond turns freely.',
      ],
    },
    'cadeia-flexivel': {
      title: 'A chain that folds',
      brief:
        'Build a molecule with at least four rotatable bonds. The more of them there are, the more shapes the molecule can take — and that is what the count measures.',
      goals: { rotacionaveis: 'at least four rotatable bonds' },
      hints: [
        'A long carbon chain does it: every single bond in the middle counts.',
        'A bond inside a ring does not count as rotatable — it does not turn.',
      ],
    },
    'dois-aneis': {
      title: 'Two rings',
      brief:
        'Build a molecule with two rings. They can be two separate rings or two fused ones sharing a bond — as in caffeine.',
      goals: { aneis: 'has two rings or more' },
      hints: [
        'Naphthalene is the short way: two hexagons glued along one bond.',
        'To fuse them, close the second ring using two atoms that already exist.',
      ],
    },
    'regra-de-lipinski': {
      title: 'Inside the rule of five',
      brief:
        'Build a drug-sized molecule that fits Lipinski’s four limits: mass up to 500, logP up to 5, at most 5 hydrogen bond donors and 10 acceptors. It is a rule of thumb from medicinal chemistry, not a promise about the compound.',
      goals: {
        tamanho: 'at least 12 heavy atoms',
        massa: 'molar mass up to 500 g/mol',
        logp: 'logP up to 5',
        doadores: 'at most 5 hydrogen bond donors',
        aceitadores: 'at most 10 acceptors',
      },
      hints: [
        'Aspirin clears all four limits comfortably — start there and grow.',
        'Every oxygen and every nitrogen pushes the hydrogen bond counters up.',
      ],
    },
    'area-polar-pequena': {
      title: 'Little polar area',
      brief:
        'Build a molecule with mass between 150 and 350 and TPSA up to 60 Å². Topological polar surface area is the sum of the contributions of the oxygen and nitrogen atoms — the literature uses it as a reference for absorption, and what counts here is the calculated number.',
      goals: {
        massa: 'molar mass between 150 and 350 g/mol',
        tpsa: 'TPSA up to 60 Å²',
      },
      hints: [
        'An aromatic ring with a carbon chain weighs a fair amount and adds almost no TPSA.',
        'Every OH adds about 20 Å²; every nitrogen, somewhere between 3 and 12.',
      ],
    },
    'polar-e-leve': {
      title: 'Polar and small',
      brief:
        'Now the opposite: mass up to 250 and TPSA of at least 80 Å². Few atoms, plenty of polar surface — it is the signature of sugars and amino acids.',
      goals: {
        massa: 'molar mass up to 250 g/mol',
        tpsa: 'TPSA of at least 80 Å²',
      },
      hints: [
        'Stack up hydroxyls: each adds about 20 Å² and weighs only 17.',
        'Glycine reaches 63 Å² — close, but not enough yet. More oxygens are missing.',
      ],
    },
  },
});

/** O que se lê de uma missão, depois de escolhido o idioma. */
export interface QuestText {
  readonly title: string;
  readonly brief: string;
  readonly hints: readonly string[];
  /** Rótulo escrito à mão por objetivo, indexado pelo `id` do objetivo. */
  readonly goals: Readonly<Record<string, string>>;
}

/**
 * O texto de uma missão do catálogo, se houver.
 *
 * A conversão é o preço de o dicionário ser conferido chave a chave: o tipo
 * inferido tem os objetivos de cada missão nominalmente, e é justamente isso
 * que faz o inglês precisar de todos eles. Aqui a busca é por slug vindo do
 * banco, que o tipo não conhece — daí `undefined` ser resposta possível.
 */
export function questText(locale: Locale, slug: string): QuestText | undefined {
  const texts = pick(catalogText, locale) as unknown as Readonly<
    Record<string, QuestText | undefined>
  >;
  return texts[slug];
}
