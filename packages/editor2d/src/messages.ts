import { dictionary } from '@rotamer/i18n';

/**
 * O texto do editor de desenho.
 *
 * A barra, a tabela periódica, o menu do botão direito e a folha de atalhos —
 * tudo o que a bancada diz enquanto se desenha.
 *
 * O que **não** está aqui é notação: símbolo de elemento, ordem de ligação e
 * cunha são desenho, não palavra, e não mudam de idioma. A tecla do atalho
 * também não — `keys.ts` continua sendo a fonte única dela, e o que este
 * arquivo acrescenta é só como a tecla se explica.
 */

export const toolbarMessages = dictionary({
  'pt-BR': {
    tools: 'Ferramentas',
    draw: 'Desenhar',
    drawHint: 'Desenhar (D)',
    move: 'Mover',
    moveHint: 'Mover átomo ou a vista (M)',
    select: 'Selecionar',
    selectHint: 'Selecionar um pedaço (V)',
    stereo: 'Estereoquímica',
    stereoHint: 'Cunha e traço: estereoquímica (W)',
    erase: 'Apagar',
    eraseHint: 'Apagar átomo ou ligação (E)',
    periodicTable: 'Tabela periódica inteira',
    periodicTableHint: 'Abrir a tabela periódica',
    tidy: 'Organizar o desenho',
    tidyHint: 'Organizar o desenho — o RDKit refaz as posições',
    fit: 'Enquadrar',
    fitHint: 'Enquadrar a molécula (0)',
    undo: 'Desfazer',
    undoHint: 'Desfazer (Ctrl+Z)',
    redo: 'Refazer',
    redoHint: 'Refazer (Ctrl+Shift+Z)',
    clear: 'Nova molécula',
    clearHint: 'Nova molécula — limpa a tela, e Ctrl+Z traz de volta',
    shortcuts: 'Atalhos do teclado',
    shortcutsHint: 'Atalhos do teclado (?)',
    /** O elemento ativo, dito por extenso para quem usa leitor de tela. */
    element: (name: string, symbol: string) => `${name}, símbolo ${symbol}`,
    /** O botão de cada elemento da barra: o símbolo, e a tecla que o escolhe. */
    drawElement: (symbol: string, key: string) => `Desenhar ${symbol} (${key})`,
    insertRing: (ring: string) => `Inserir ${ring}`,
    rings: 'Anéis prontos',
  },

  en: {
    tools: 'Tools',
    draw: 'Draw',
    drawHint: 'Draw (D)',
    move: 'Move',
    moveHint: 'Move an atom or the view (M)',
    select: 'Select',
    selectHint: 'Select a fragment (V)',
    stereo: 'Stereochemistry',
    stereoHint: 'Wedge and dash: stereochemistry (W)',
    erase: 'Erase',
    eraseHint: 'Erase an atom or a bond (E)',
    periodicTable: 'The whole periodic table',
    periodicTableHint: 'Open the periodic table',
    tidy: 'Tidy the drawing',
    tidyHint: 'Tidy the drawing — RDKit redoes the positions',
    fit: 'Fit',
    fitHint: 'Fit the molecule (0)',
    undo: 'Undo',
    undoHint: 'Undo (Ctrl+Z)',
    redo: 'Redo',
    redoHint: 'Redo (Ctrl+Shift+Z)',
    clear: 'New molecule',
    clearHint: 'New molecule — clears the canvas, and Ctrl+Z brings it back',
    shortcuts: 'Keyboard shortcuts',
    shortcutsHint: 'Keyboard shortcuts (?)',
    element: (name: string, symbol: string) => `${name}, symbol ${symbol}`,
    drawElement: (symbol: string, key: string) => `Draw ${symbol} (${key})`,
    insertRing: (ring: string) => `Insert ${ring}`,
    rings: 'Ready-made rings',
  },
});

/** Os anéis prontos da barra. Nome de composto, e ele muda de idioma. */
export const ringMessages = dictionary({
  'pt-BR': {
    benzene: 'Benzeno',
    cyclohexane: 'Cicloexano',
    cyclopentane: 'Ciclopentano',
    pyridine: 'Piridina',
  },

  en: {
    benzene: 'Benzene',
    cyclohexane: 'Cyclohexane',
    cyclopentane: 'Cyclopentane',
    pyridine: 'Pyridine',
  },
});

export const periodicTableMessages = dictionary({
  'pt-BR': {
    title: 'Tabela periódica',
    searchLabel: 'Buscar elemento',
    searchPlaceholder: 'Buscar por nome, símbolo ou número',
    /** Lido em voz alta pela célula: quem não vê a grade precisa dos três dados. */
    cell: (name: string, symbol: string, z: number) =>
      `${name}, símbolo ${symbol}, número atômico ${String(z)}`,
  },

  en: {
    title: 'Periodic table',
    searchLabel: 'Search for an element',
    searchPlaceholder: 'Search by name, symbol or number',
    cell: (name: string, symbol: string, z: number) =>
      `${name}, symbol ${symbol}, atomic number ${String(z)}`,
  },
});

/**
 * A tela de desenho: o que ela anuncia e o que ela sugere.
 *
 * A contagem da seleção é uma função, e não um modelo com marcador, por causa
 * do português: "2 átomos **selecionados**" e "1 ligação **selecionada**"
 * concordam em gênero e número com o que se contou. O inglês não concorda com
 * nada — e é justamente por serem diferentes que cada idioma escreve a sua.
 */
export const canvasMessages = dictionary({
  'pt-BR': {
    label: 'Tela de desenho da molécula',
    dismissNotice: 'Fechar o aviso',
    nothingSelected: 'Nada selecionado.',
    selected: (atoms: number, bonds: number) => {
      const a = `${String(atoms)} ${atoms === 1 ? 'átomo' : 'átomos'}`;
      const b = `${String(bonds)} ${bonds === 1 ? 'ligação' : 'ligações'}`;

      if (atoms > 0 && bonds > 0) return `${a} e ${b} selecionados`;
      if (bonds > 0) return `${b} ${bonds === 1 ? 'selecionada' : 'selecionadas'}`;
      return `${a} ${atoms === 1 ? 'selecionado' : 'selecionados'}`;
    },
    selectionHint: 'Arraste de dentro para mover · Delete apaga · clique no vazio solta.',
    selectionHintElsewhere: 'Tecle V para mover ou apagar em bloco · Esc solta.',
    selectHint:
      'Arraste no fundo para cercar um pedaço · dois toques pegam o fragmento inteiro · dois dedos movem a vista.',
    bondHint: 'Clique na ligação para trocar a ordem: simples → dupla → tripla.',
    moveHint: 'Arraste um átomo para movê-lo. Arraste o fundo para mover a vista.',
    eraseHint: 'Clique num átomo ou numa ligação para apagar.',
    stereoHint:
      'Clique numa ligação simples: plano, cunha cheia, cunha tracejada. Com Shift, a cunha vira de lado.',
    emptyHint:
      'Clique para começar um átomo. Arraste de um átomo para puxar uma ligação, e clique na ligação para fazer dupla.',
    smallHint:
      'Clique numa ligação para trocar a ordem: simples → dupla → tripla. Para mover um átomo, use a ferramenta de mover — ou segure Shift.',
    growingHint:
      'Para pegar um pedaço inteiro, use Selecionar (V) — ou segure Shift e arraste no fundo.',
  },

  en: {
    label: 'Molecule drawing canvas',
    dismissNotice: 'Dismiss the notice',
    nothingSelected: 'Nothing selected.',
    selected: (atoms: number, bonds: number) => {
      const a = `${String(atoms)} ${atoms === 1 ? 'atom' : 'atoms'}`;
      const b = `${String(bonds)} ${bonds === 1 ? 'bond' : 'bonds'}`;

      if (atoms > 0 && bonds > 0) return `${a} and ${b} selected`;
      if (bonds > 0) return `${b} selected`;
      return `${a} selected`;
    },
    selectionHint: 'Drag from inside to move · Delete erases · click empty space to drop.',
    selectionHintElsewhere: 'Press V to move or erase as a block · Esc drops.',
    selectHint:
      'Drag on the background to fence off a fragment · a double tap grabs the whole fragment · two fingers move the view.',
    bondHint: 'Click the bond to change its order: single → double → triple.',
    moveHint: 'Drag an atom to move it. Drag the background to move the view.',
    eraseHint: 'Click an atom or a bond to erase it.',
    stereoHint:
      'Click a single bond: in the plane, bold wedge, dashed wedge. With Shift, the wedge turns around.',
    emptyHint:
      'Click to start an atom. Drag from an atom to pull a bond, and click the bond to make it double.',
    smallHint:
      'Click a bond to change its order: single → double → triple. To move an atom, use the move tool — or hold Shift.',
    growingHint: 'To grab a whole fragment, use Select (V) — or hold Shift and drag on the background.',
  },
});

/**
 * O menu do botão direito.
 *
 * Os títulos dizem sobre o que o menu é — átomo, ligação, seleção — e o resto
 * são as ações possíveis ali. "Sem carga", "Positiva (+1)" e "Negativa (−1)"
 * são estado de carga formal, e o sinal é notação: o `−` é o menos de verdade,
 * não o hífen.
 */
export const contextMenuMessages = dictionary({
  'pt-BR': {
    label: 'Opções do que está sob o cursor',
    /** O menu de um átomo abre dizendo de qual átomo ele fala. */
    atomOf: (element: string) => `Átomo de ${element}`,
    bond: 'Ligação',
    selection: 'Seleção',
    nothing: 'Nada selecionado.',
    formalCharge: 'carga formal',
    stereochemistry: 'estereoquímica',
    changeElement: 'trocar o elemento',
    bondOrders: 'ordem das ligações',
    /**
     * Quanto o "Apagar" da seleção vai levar, dito antes de levar. A
     * concordância cai em "átomo" e "ligação", que é o que se conta.
     */
    selectionCount: (atoms: number, bonds: number) => {
      const a = `${String(atoms)} ${atoms === 1 ? 'átomo' : 'átomos'}`;
      const b = `${String(bonds)} ${bonds === 1 ? 'ligação' : 'ligações'}`;
      if (atoms === 0) return b;
      if (bonds === 0) return a;
      return `${a} e ${b}`;
    },
    eraseSelection: (what: string) => `Apagar ${what}`,
    eraseAtom: 'Apagar o átomo',
    eraseBond: 'Apagar a ligação',
    flipWedge: 'Inverter a ponta fina',
    clearSelection: 'Soltar a seleção',
    tidy: 'Organizar o desenho',
    fit: 'Enquadrar a molécula',
    undo: 'Desfazer',
    redo: 'Refazer',
    clear: 'Limpar a tela',
    chargeNone: 'Sem carga',
    chargePositive: 'Positiva (+1)',
    chargeNegative: 'Negativa (−1)',
    single: 'Simples',
    double: 'Dupla',
    triple: 'Tripla',
    inPlane: 'No plano',
    wedge: 'Cunha cheia — vem para frente',
    dash: 'Traço — vai para trás',
  },

  en: {
    label: 'Options for what is under the cursor',
    atomOf: (element: string) => `${element} atom`,
    bond: 'Bond',
    selection: 'Selection',
    nothing: 'Nothing selected.',
    formalCharge: 'formal charge',
    stereochemistry: 'stereochemistry',
    changeElement: 'change the element',
    bondOrders: 'bond order',
    selectionCount: (atoms: number, bonds: number) => {
      const a = `${String(atoms)} ${atoms === 1 ? 'atom' : 'atoms'}`;
      const b = `${String(bonds)} ${bonds === 1 ? 'bond' : 'bonds'}`;
      if (atoms === 0) return b;
      if (bonds === 0) return a;
      return `${a} and ${b}`;
    },
    eraseSelection: (what: string) => `Erase ${what}`,
    eraseAtom: 'Erase the atom',
    eraseBond: 'Erase the bond',
    flipWedge: 'Flip the narrow end',
    clearSelection: 'Drop the selection',
    tidy: 'Tidy the drawing',
    fit: 'Fit the molecule',
    undo: 'Undo',
    redo: 'Redo',
    clear: 'Clear the canvas',
    chargeNone: 'No charge',
    chargePositive: 'Positive (+1)',
    chargeNegative: 'Negative (−1)',
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    inPlane: 'In the plane',
    wedge: 'Bold wedge — comes forward',
    dash: 'Dash — goes back',
  },
});

/**
 * A folha de atalhos.
 *
 * As teclas não estão aqui: elas vêm de `keys.ts`, que é a fonte única, e é o
 * que impede a folha de prometer uma tecla que o teclado não faz. O que este
 * dicionário traz é o que cada uma faz, dito em cada idioma.
 */
export const shortcutsMessages = dictionary({
  'pt-BR': {
    title: 'Atalhos',
    elements: 'elementos',
    tools: 'ferramentas',
    onScreen: 'na tela',
    draw: 'desenhar',
    move: 'mover átomo ou a vista',
    select: 'selecionar um pedaço',
    stereo: 'cunha e traço',
    erase: 'apagar',
    fit: 'enquadrar a molécula',
    selectAll: 'selecionar tudo',
    deleteSelection: 'apagar a seleção, ou o que está sob o cursor',
    undo: 'desfazer',
    redo: 'refazer',
    redoToo: 'refazer também',
    close: 'fechar',
    footnote:
      'As letras valem em qualquer lugar da página, menos enquanto você escreve num campo de texto.',
  },

  en: {
    title: 'Shortcuts',
    elements: 'elements',
    tools: 'tools',
    onScreen: 'on screen',
    draw: 'draw',
    move: 'move an atom or the view',
    select: 'select a fragment',
    stereo: 'wedge and dash',
    erase: 'erase',
    fit: 'fit the molecule',
    selectAll: 'select everything',
    deleteSelection: 'erase the selection, or whatever is under the cursor',
    undo: 'undo',
    redo: 'redo',
    redoToo: 'redo as well',
    close: 'close',
    footnote:
      'The letters work anywhere on the page, except while you are typing in a text field.',
  },
});
