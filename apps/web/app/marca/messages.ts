import { dictionary } from '@rotamer/i18n';

/**
 * A página de marca, nos dois idiomas.
 *
 * O que **não** muda de idioma: nome de token (`--flame-cobre`, `--step-5`),
 * hex, nome de fonte, símbolo de elemento e a frase-amostra da escala
 * tipográfica. Token é chave de dado, e a amostra existe para mostrar a forma
 * das letras — trocá-la trocaria a amostra, não o idioma dela.
 *
 * O nome de cada cor de chama é nome de elemento, e esse muda: quem lê em
 * inglês procura "potassium", não "potássio".
 */
export const brandMessages = dictionary({
  'pt-BR': {
    metaTitle: 'Marca e tokens — Rotamer',
    metaDescription:
      'O sistema visual do Rotamer: a paleta que vem do teste de chama, a tipografia, os tokens de forma e movimento, e a regra de que cor CPK pertence ao átomo.',

    tagline: 'Desenhe uma molécula em 2D. Descubra o que ela é em 3D.',
    bilingual:
      'Esta página, e o resto do Rotamer, existem em português do Brasil e em inglês — português é o padrão.',

    rule: 'O núcleo determinístico decide. A IA explica.',
    ruleText:
      'Validade, valência, fórmula, massa, SMILES, InChIKey e descritores vêm sempre do RDKit. O modelo de linguagem lê esses números e explica — sem nunca recalcular e sem nunca contradizer. Todo bloco de análise na tela declara de onde veio.',

    engineHeading: 'Fase 0 · o motor de química',
    engineLabel: 'rdkit em web worker',
    aspirin: 'aspirina',
    engineBody:
      'A página pinta primeiro; os quase 7 MB de WebAssembly do RDKit sobem depois, dentro de um Web Worker. A thread principal só desenha — é isso que mantém o editor a 60 fps enquanto a química trabalha.',
    engineQuiet:
      'Os números ao lado saíram do worker agora, nesta visita. Nenhum deles está escrito no código da página.',

    markHeading: 'Símbolo',
    markLabel: 'projeção de newman',
    markBody:
      'Você olha ao longo do eixo de uma ligação simples. O círculo é o átomo de trás; as três hastes que saem do centro são as ligações do átomo da frente; as três que saem da borda são as de trás. Os 60° de separação são a conformação escalonada — a de menor energia, aquela para a qual a molécula tende.',
    markNotice:
      'A cor separa profundidade: frente em turquesa, trás na cor do texto. Inverter faz o átomo de trás parecer o da frente — e aí o desenho está quimicamente errado.',

    colorHeading: 'Cor',
    colorLabel: 'teste de chama',
    colorBody:
      'Cada cor é a que um elemento emite ao queimar. Nenhuma foi escolhida por gosto. Os neutros vêm do cone azul do bico de Bunsen: cinzas com viés azul-violeta, nunca cinza puro.',
    cpkLabel: 'cpk pertence ao átomo',
    cpkNotice:
      'Nenhum botão, link, borda ou estado semântico pode usar uma cor CPK. Se a interface pinta de vermelho, o vermelho deixa de significar oxigênio. É por isso que o acento da marca é turquesa: nenhum elemento comum é turquesa no CPK.',

    flameCopper: 'cobre · marca',
    flamePotassium: 'potássio',
    flameSodium: 'sódio',
    flameCaesium: 'césio',
    flameStrontium: 'estrôncio',
    flameBarium: 'bário',
    flameLithium: 'lítio',

    roleBrand: 'marca e ação',
    roleBrandUse: 'botão primário, link, seleção, foco',
    roleOk: 'sucesso',
    roleOkUse: 'missão cumprida, estrutura válida',
    roleWarn: 'atenção',
    roleWarnUse: 'hipótese da IA, valor aproximado',
    roleDanger: 'erro',
    roleDangerUse: 'valência excedida, violação de Lipinski',
    roleInfo: 'informação',
    roleInfoUse: 'nota de contexto, referência',

    neutralBg: 'fundo',
    neutralSurface: 'superfície',
    neutralSunk: 'rebaixado',
    neutralLine: 'linha',
    neutralInk500: 'texto secundário',
    neutralInk900: 'texto',

    typeHeading: 'Tipografia',
    typeLabel: 'archivo · ibm plex',
    /** A amostra existe para mostrar a forma das letras, e é a mesma nos dois. */
    typeSample: 'O etano gira livre; o eteno se recusa.',
    typeDisplay: 'display',
    typeTitle: 'título',
    typeSection: 'seção',
    typeBody: 'corpo',
    typeUi: 'interface',
    typeCaption: 'legenda',
    typeQuietBefore: 'Todo número usa ',
    typeQuietAfter:
      ' em IBM Plex Mono, e toda fórmula leva subscrito de verdade — nunca C6H6 em texto corrido.',

    shapeHeading: 'Forma e movimento',
    shapeLabel: 'raio · duração',
    radiusControl: 'controle',
    radiusCard: 'cartão',
    radiusPanel: 'painel flutuante',
    radiusScene: 'cartão 3D',
    durationFast: 'estado de controle — hover, foco, pressionado',
    durationBase: 'painel e gaveta',
    durationSlow: 'transição de contexto',
    durationFold: 'dobramento da molécula — isto é física, não enfeite',
    motionQuiet:
      'Quem pede menos movimento no sistema recebe a geometria final direto, sem dobramento e sem vibração.',

    footerLicense: 'Rotamer · código aberto, licença MIT.',
    footerCredits:
      'Química por RDKit (BSD-3-Clause). Tipografia Archivo e IBM Plex (SIL Open Font License 1.1).',
  },

  en: {
    metaTitle: 'Brand and tokens — Rotamer',
    metaDescription:
      'Rotamer’s visual system: the palette that comes from the flame test, the typography, the shape and motion tokens, and the rule that CPK color belongs to the atom.',

    tagline: 'Draw a molecule in 2D. Find out what it is in 3D.',
    bilingual:
      'This page, and the rest of Rotamer, exist in Brazilian Portuguese and English — Portuguese is the default.',

    rule: 'The deterministic core decides. The AI explains.',
    ruleText:
      'Validity, valence, formula, mass, SMILES, InChIKey and descriptors always come from RDKit. The language model reads those numbers and explains them — never recomputing and never contradicting. Every analysis block on screen declares where it came from.',

    engineHeading: 'Phase 0 · the chemistry engine',
    engineLabel: 'rdkit in a web worker',
    aspirin: 'aspirin',
    engineBody:
      'The page paints first; the almost 7 MB of RDKit WebAssembly come after, inside a Web Worker. The main thread only draws — that is what keeps the editor at 60 fps while the chemistry works.',
    engineQuiet:
      'The numbers beside this came out of the worker just now, on this visit. None of them is written into the page’s code.',

    markHeading: 'The mark',
    markLabel: 'newman projection',
    markBody:
      'You are looking along the axis of a single bond. The circle is the back atom; the three arms from the center are the front atom’s bonds; the three from the rim are the back one’s. The 60° between them is the staggered conformation — the lowest in energy, the one the molecule tends toward.',
    markNotice:
      'Color separates depth: front in turquoise, back in the text color. Swapping them makes the back atom look like the front one — and then the drawing is chemically wrong.',

    colorHeading: 'Color',
    colorLabel: 'flame test',
    colorBody:
      'Each color is the one an element emits as it burns. None was chosen by taste. The neutrals come from the blue cone of a Bunsen burner: grays with a blue-violet cast, never pure gray.',
    cpkLabel: 'cpk belongs to the atom',
    cpkNotice:
      'No button, link, border or semantic state may use a CPK color. If the interface paints something red, red stops meaning oxygen. That is why the brand accent is turquoise: no common element is turquoise in CPK.',

    flameCopper: 'copper · brand',
    flamePotassium: 'potassium',
    flameSodium: 'sodium',
    flameCaesium: 'caesium',
    flameStrontium: 'strontium',
    flameBarium: 'barium',
    flameLithium: 'lithium',

    roleBrand: 'brand and action',
    roleBrandUse: 'primary button, link, selection, focus',
    roleOk: 'success',
    roleOkUse: 'mission completed, valid structure',
    roleWarn: 'caution',
    roleWarnUse: 'AI hypothesis, approximate value',
    roleDanger: 'error',
    roleDangerUse: 'valence exceeded, Lipinski violation',
    roleInfo: 'information',
    roleInfoUse: 'context note, reference',

    neutralBg: 'background',
    neutralSurface: 'surface',
    neutralSunk: 'sunk',
    neutralLine: 'line',
    neutralInk500: 'secondary text',
    neutralInk900: 'text',

    typeHeading: 'Typography',
    typeLabel: 'archivo · ibm plex',
    typeSample: 'O etano gira livre; o eteno se recusa.',
    typeDisplay: 'display',
    typeTitle: 'title',
    typeSection: 'section',
    typeBody: 'body',
    typeUi: 'interface',
    typeCaption: 'caption',
    typeQuietBefore: 'Every number uses ',
    typeQuietAfter:
      ' in IBM Plex Mono, and every formula carries a real subscript — never C6H6 in running text.',

    shapeHeading: 'Shape and motion',
    shapeLabel: 'radius · duration',
    radiusControl: 'control',
    radiusCard: 'card',
    radiusPanel: 'floating panel',
    radiusScene: '3D card',
    durationFast: 'control state — hover, focus, pressed',
    durationBase: 'panel and drawer',
    durationSlow: 'context transition',
    durationFold: 'molecule folding — this is physics, not decoration',
    motionQuiet:
      'Anyone who asks the system for less motion gets the final geometry straight away, with no folding and no vibration.',

    footerLicense: 'Rotamer · open source, MIT license.',
    footerCredits:
      'Chemistry by RDKit (BSD-3-Clause). Archivo and IBM Plex typefaces (SIL Open Font License 1.1).',
  },
});
