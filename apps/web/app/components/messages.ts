import { dictionary } from '@rotamer/i18n';

/**
 * O texto das peças da bancada.
 *
 * Um dicionário por componente, no arquivo ao lado de quem o usa: a tela e as
 * palavras dela mudam juntas, e quem mexe numa lembra da outra. O inglês não é
 * opcional — `dictionary()` infere o formato do português e recusa a compilar
 * se faltar chave do outro lado.
 */

export const languageToggleMessages = dictionary({
  'pt-BR': { label: 'Idioma' },
  en: { label: 'Language' },
});

/** A dica do botão de idioma. O nome do idioma de destino vem no próprio idioma. */
export const languageSwitchMessages = dictionary({
  'pt-BR': { switchTo: (target: string) => `Mudar o idioma para ${target}` },
  en: { switchTo: (target: string) => `Switch the language to ${target}` },
});

/**
 * A faixa de baixo.
 *
 * Os rótulos são curtos porque a faixa é estreita: "rotáveis" e "doa/ace" são
 * abreviações que um químico lê de relance. Em inglês cabem as mesmas
 * abreviações de uso corrente.
 */
export const metricsBarMessages = dictionary({
  'pt-BR': {
    waiting: 'Carregando o motor de química…',
    empty: 'Desenhe uma estrutura para ver fórmula, massa e descritores.',
    whatToDo: 'Ver o que fazer',
    openAnalysis: 'Abrir a análise completa',
    mass: 'massa',
    tpsa: 'TPSA',
    rotatable: 'rotáveis',
    rings: 'anéis',
    /** `3 · 2 arom.` — quantos anéis, e quantos deles são aromáticos. */
    aromaticShare: (rings: number, aromatic: number) =>
      `${String(rings)} · ${String(aromatic)} arom.`,
    donorsAcceptors: 'doa/ace',
    lipinski: 'Lipinski',
    lipinskiOk: 'ok',
    lipinskiBroken: (n: number) => `${String(n)} fora`,
  },

  en: {
    waiting: 'Loading the chemistry engine…',
    empty: 'Draw a structure to see formula, mass and descriptors.',
    whatToDo: 'See what to do',
    openAnalysis: 'Open the full analysis',
    mass: 'mass',
    tpsa: 'TPSA',
    rotatable: 'rotatable',
    rings: 'rings',
    aromaticShare: (rings: number, aromatic: number) =>
      `${String(rings)} · ${String(aromatic)} arom.`,
    donorsAcceptors: 'don/acc',
    lipinski: 'Lipinski',
    lipinskiOk: 'ok',
    lipinskiBroken: (n: number) => `${String(n)} broken`,
  },
});

/** A faixa de conta, na ponta direita da barra de cima. */
export const accountMenuMessages = dictionary({
  'pt-BR': {
    signIn: 'Entrar',
    classrooms: 'Turmas',
    catalog: 'Catálogo',
    library: 'Minhas moléculas',
    signOut: 'Sair',
  },

  en: {
    signIn: 'Sign in',
    classrooms: 'Classes',
    catalog: 'Catalog',
    library: 'My molecules',
    signOut: 'Sign out',
  },
});

export const shareLinkMessages = dictionary({
  'pt-BR': { share: 'Compartilhar', copied: 'Link copiado' },
  en: { share: 'Share', copied: 'Link copied' },
});

/**
 * Levar a molécula embora. `SVG` e `PNG` são nome de formato e ficam de fora do
 * dicionário — não se traduzem em idioma nenhum.
 */
export const exportMenuMessages = dictionary({
  'pt-BR': { working: 'Gerando…' },
  en: { working: 'Generating…' },
});

/** As três escolhas de tema. "Sistema" é quem manda quando ninguém escolheu. */
export const themeToggleMessages = dictionary({
  'pt-BR': {
    label: 'Tema',
    system: 'Sistema',
    light: 'Claro',
    dark: 'Escuro',
  },

  en: {
    label: 'Theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },
});

/**
 * Guardar a estrutura na estante.
 *
 * "Estante" é a palavra do produto para a coleção de quem entrou — em inglês,
 * "shelf". Não vira "library" em lugar nenhum: biblioteca é o que o PubChem
 * tem, e a estante é de quem desenhou.
 */
export const saveMoleculeMessages = dictionary({
  'pt-BR': {
    save: 'Guardar',
    saving: 'Guardando…',
    saved: 'guardada',
    startAnother: 'começar outra',
    needsAccount: 'precisa de conta —',
    signIn: 'entre',
  },

  en: {
    save: 'Save',
    saving: 'Saving…',
    saved: 'saved',
    startAnother: 'start another',
    needsAccount: 'needs an account —',
    signIn: 'sign in',
  },
});

/**
 * Trazer molécula de fora, por SMILES ou por nome.
 *
 * `SMILES` não se traduz: é notação. O que muda de idioma é a frase em volta, e
 * a recusa — que, quando o texto **é** uma estrutura impossível, vem do núcleo
 * pela `chemistryErrorText`, não daqui.
 */
export const smilesInputMessages = dictionary({
  'pt-BR': {
    placeholder: 'SMILES ou nome',
    label: 'Carregar molécula por SMILES ou por nome',
    load: 'Carregar',
    searching: 'Buscando…',
    /** O composto veio do PubChem sem título próprio: sobra o número. */
    foundUntitled: (cid: number) => `Encontrado no PubChem (CID ${String(cid)}).`,
    found: (title: string, cid: number) => `${title} — PubChem CID ${String(cid)}.`,
    pubchemQuiet: 'O PubChem não respondeu agora. Colar o SMILES continua funcionando.',
    notFound: (entry: string) =>
      `Não encontrei "${entry}" no PubChem. Confira a grafia ou cole o SMILES.`,
    cantLoad: 'Não consegui carregar essa molécula.',
  },

  en: {
    placeholder: 'SMILES or name',
    label: 'Load a molecule by SMILES or by name',
    load: 'Load',
    searching: 'Searching…',
    foundUntitled: (cid: number) => `Found on PubChem (CID ${String(cid)}).`,
    found: (title: string, cid: number) => `${title} — PubChem CID ${String(cid)}.`,
    pubchemQuiet: 'PubChem did not answer just now. Pasting the SMILES still works.',
    notFound: (entry: string) =>
      `I could not find "${entry}" on PubChem. Check the spelling or paste the SMILES.`,
    cantLoad: 'I could not load that molecule.',
  },
});

/**
 * Os modos normais.
 *
 * `3N − 6`, `cm⁻¹` e `MMFF94` são notação e nome de campo de força: ficam fora
 * do dicionário. O que muda de idioma é o que explica o número — inclusive a
 * ressalva de que frequência de campo de força não é medida de espectro, que é
 * a frase que impede a tela de afirmar mais do que ela sabe.
 */
export const normalModesMessages = dictionary({
  'pt-BR': {
    heading: 'Modos normais',
    unsupported: (elements: string) =>
      `O campo de força MMFF94 não tem parâmetros para ${elements}. A forma no espaço aparece assim mesmo, montada com comprimentos e ângulos de ligação — o que não existe é a energia, e sem energia não há frequência de vibração.`,
    computing: 'Calculando a Hessiana do campo de força…',
    empty:
      'Os modos aparecem quando a estrutura fecha. Molécula muito grande fica de fora: a conta trava a máquina antes de terminar.',
    /** O que vem depois da contagem, que a tela desenha em negrito à parte. */
    countTail: (formula: string, atoms: number, linear: boolean) =>
      ` modos = ${formula}, com N = ${String(atoms)}${linear ? ' — a molécula é linear' : ''}.`,
    stretch: 'estiramento',
    bend: 'dobramento',
    imaginary: (n: number) =>
      `${n === 1 ? 'Um modo tem' : `${String(n)} modos têm`} frequência imaginária (número negativo): nesta geometria o campo de força não vê um mínimo, e a molécula desceria de energia se se deformasse nesse sentido. Acontece com estruturas em que o MMFF94 é mal parametrizado — o CO₂ é o exemplo clássico.`,
    forceFieldNote:
      'Frequências do campo de força MMFF94, calculadas aqui — não são medidas de espectro. Campo de força clássico costuma superestimar estiramento em torno de 5% a 10%: o número serve para comparar modos entre si e ver a forma do movimento.',
    sceneNote:
      'Na cena, amplitude e velocidade são exageradas para caber no olho: um estiramento C–H completa um ciclo a cada 11 femtossegundos, e a amplitude real é uma fração de ångström. O que está certo é a forma do movimento — quem anda, para onde e em que proporção.',
  },

  en: {
    heading: 'Normal modes',
    unsupported: (elements: string) =>
      `The MMFF94 force field has no parameters for ${elements}. The shape in space still appears, built from bond lengths and angles — what does not exist is the energy, and without energy there is no vibration frequency.`,
    computing: 'Computing the Hessian of the force field…',
    empty:
      'The modes appear once the structure closes. A very large molecule is left out: the computation locks the machine up before it finishes.',
    countTail: (formula: string, atoms: number, linear: boolean) =>
      ` modes = ${formula}, with N = ${String(atoms)}${linear ? ' — the molecule is linear' : ''}.`,
    stretch: 'stretching',
    bend: 'bending',
    imaginary: (n: number) =>
      `${n === 1 ? 'One mode has' : `${String(n)} modes have`} an imaginary frequency (a negative number): at this geometry the force field does not see a minimum, and the molecule would drop in energy by deforming that way. It happens with structures where MMFF94 is poorly parameterized — CO₂ is the classic example.`,
    forceFieldNote:
      'Frequencies from the MMFF94 force field, computed here — they are not spectral measurements. A classical force field tends to overestimate stretching by around 5% to 10%: the number is for comparing modes with each other and seeing the shape of the motion.',
    sceneNote:
      'In the scene, amplitude and speed are exaggerated so the eye can follow them: a C–H stretch completes a cycle every 11 femtoseconds, and the real amplitude is a fraction of an ångström. What is right is the shape of the motion — what moves, where to, and in what proportion.',
  },
});

/**
 * O tutor.
 *
 * Todo texto daqui acompanha o selo âmbar. As três perguntas são atalhos para
 * o que o aluno já ia perguntar; `HintKind` é chave de dado e continua igual nos
 * dois idiomas, porque é ela que o servidor recebe.
 */
export const tutorPanelMessages = dictionary({
  'pt-BR': {
    label: 'Tutor',
    heading: 'tutor',
    nextStep: 'E agora?',
    whyNotClosed: 'Por que não fechou?',
    whatIsThis: 'O que é isto?',
    needsStructure: 'Desenhe uma estrutura válida e o tutor pode comentar o que você já tem.',
    asking: 'Perguntando…',
    unavailable:
      'O tutor está desligado neste ambiente. As dicas da missão continuam valendo — elas são escritas à mão e revisadas como conteúdo.',
    limit:
      'Você chegou ao limite de perguntas de hoje. As dicas escritas à mão continuam disponíveis na missão.',
    watchOut: 'Cuidado: ',
    generatedNote:
      'Texto gerado por modelo de linguagem a partir dos números calculados. É hipótese, não medida.',
  },

  en: {
    label: 'Tutor',
    heading: 'tutor',
    nextStep: 'What next?',
    whyNotClosed: 'Why didn’t it work?',
    whatIsThis: 'What is this?',
    needsStructure: 'Draw a valid structure and the tutor can comment on what you already have.',
    asking: 'Asking…',
    unavailable:
      'The tutor is switched off in this environment. The mission hints still hold — they are written by hand and reviewed as content.',
    limit:
      'You have reached today’s limit of questions. The hand-written hints are still available in the mission.',
    watchOut: 'Watch out: ',
    generatedNote:
      'Text generated by a language model from the computed numbers. It is a hypothesis, not a measurement.',
  },
});

/**
 * O painel de análise.
 *
 * O cartão de erro tem três partes, e as três mudam de idioma: o nome do
 * problema, a frase do núcleo (que vem de `chemistryErrorText`) e o que fazer a
 * respeito. Nome de descritor — TPSA, logP, InChIKey, SMILES — é notação e não
 * se traduz.
 */
export const analysisDrawerMessages = dictionary({
  'pt-BR': {
    label: 'Análise da molécula',
    tabs: 'Seções do painel',
    analysisTab: 'Análise',
    questsTab: 'Missões',
    close: 'Fechar o painel',
    empty: 'Desenhe uma estrutura — ou cole um SMILES — para ver a análise inteira.',
    groups: 'Grupos funcionais',
    identity: 'Identidade',
    takeAway: 'Levar embora',
    saveNote: 'Guardar na sua estante fica na faixa de cima, ao lado da fórmula.',
    computedBy: 'Calculado pelo RDKit:',
    computedList:
      ' valência, fórmula, massa, anéis, aromaticidade, grupos funcionais, TPSA, logP e os descritores. A geometria e a vibração saem do campo de força MMFF94, no mesmo motor. Nenhum número desta tela passa por modelo de linguagem.',
    forSchools: 'Para escolas',
    brand: 'Marca e tokens',

    errorValence: 'Valência excedida',
    errorAromaticity: 'Aromaticidade impossível',
    errorUnreadable: 'Não consegui ler a estrutura',
    errorEmpty: 'Nada desenhado ainda',
    errorOther: 'Estrutura impossível',
    fixValenceWithAtom:
      'Reduza a ordem de uma ligação clicando na linha, ou apague uma delas. O átomo está marcado com um círculo tracejado no desenho.',
    fixValence: 'Reduza a ordem de uma ligação clicando na linha, ou apague uma delas.',
    fixAromaticity:
      'Confira as duplas do anel: um anel só é aromático quando o número de elétrons π fecha a conta.',
    fixOther: 'Confira as ligações do desenho — apagar a última e refazer costuma resolver.',

    heavyAtoms: 'Átomos pesados',
    heteroatoms: 'Heteroátomos',
    rings: 'Anéis',
    ringsWithAromatic: (rings: number, aromatic: number) =>
      `${String(rings)} (${String(aromatic)} aromáticos)`,
    rotatableBonds: 'Ligações rotacionáveis',
    donorsAcceptors: 'Doadores / aceitadores',
    molarRefractivity: 'Refratividade molar',
    fractionCsp3: 'Fração sp³',
    stereocenters: 'Estereocentros',
    stereocentersUnspecified: (total: number, unspecified: number) =>
      `${String(total)} — ${String(unspecified)} sem configuração`,
    stereocentersNote:
      'Centro sem cunha nem traço fica sem configuração no desenho. A ferramenta Estereoquímica (W) define o lado.',
    exactMass: 'Massa exata',

    lipinski: 'Regra dos cinco',
    lipinskiMass: 'Massa',
    lipinskiDonors: 'Doadores',
    lipinskiAcceptors: 'Aceitadores',
  },

  en: {
    label: 'Molecule analysis',
    tabs: 'Panel sections',
    analysisTab: 'Analysis',
    questsTab: 'Missions',
    close: 'Close the panel',
    empty: 'Draw a structure — or paste a SMILES — to see the full analysis.',
    groups: 'Functional groups',
    identity: 'Identity',
    takeAway: 'Take it away',
    saveNote: 'Saving to your shelf is in the top bar, next to the formula.',
    computedBy: 'Computed by RDKit:',
    computedList:
      ' valence, formula, mass, rings, aromaticity, functional groups, TPSA, logP and the descriptors. The geometry and the vibration come from the MMFF94 force field, on the same engine. No number on this screen goes through a language model.',
    forSchools: 'For schools',
    brand: 'Brand and tokens',

    errorValence: 'Valence exceeded',
    errorAromaticity: 'Impossible aromaticity',
    errorUnreadable: 'I could not read the structure',
    errorEmpty: 'Nothing drawn yet',
    errorOther: 'Impossible structure',
    fixValenceWithAtom:
      'Lower the order of a bond by clicking the line, or erase one of them. The atom is marked with a dashed circle in the drawing.',
    fixValence: 'Lower the order of a bond by clicking the line, or erase one of them.',
    fixAromaticity:
      'Check the double bonds of the ring: a ring is only aromatic when the number of π electrons adds up.',
    fixOther: 'Check the bonds in the drawing — erasing the last one and redoing it usually sorts it out.',

    heavyAtoms: 'Heavy atoms',
    heteroatoms: 'Heteroatoms',
    rings: 'Rings',
    ringsWithAromatic: (rings: number, aromatic: number) =>
      `${String(rings)} (${String(aromatic)} aromatic)`,
    rotatableBonds: 'Rotatable bonds',
    donorsAcceptors: 'Donors / acceptors',
    molarRefractivity: 'Molar refractivity',
    fractionCsp3: 'Fraction sp³',
    stereocenters: 'Stereocenters',
    stereocentersUnspecified: (total: number, unspecified: number) =>
      `${String(total)} — ${String(unspecified)} unspecified`,
    stereocentersNote:
      'A center with no wedge and no dash is left unspecified in the drawing. The Stereochemistry tool (W) sets the side.',
    exactMass: 'Exact mass',

    lipinski: 'Rule of five',
    lipinskiMass: 'Mass',
    lipinskiDonors: 'Donors',
    lipinskiAcceptors: 'Acceptors',
  },
});

/** A prova de que o motor está de pé, na página de marca. */
export const chemistryPanelMessages = dictionary({
  'pt-BR': {
    loading:
      'Carregando o RDKit no worker — a página aparece primeiro, o WebAssembly sobe depois.',
    engineFailed: 'Não foi possível carregar o motor de química neste navegador.',
    molarMass: 'massa molar',
    tpsa: 'TPSA',
    logP: 'logP',
    rotatable: 'rotacionáveis',
    aromaticRings: 'anéis aromáticos',
    inchiKey: 'InChIKey',
    footer: (version: string) => `RDKit ${version} · WebAssembly em Web Worker`,
  },

  en: {
    loading: 'Loading RDKit in the worker — the page appears first, the WebAssembly comes after.',
    engineFailed: 'The chemistry engine could not be loaded in this browser.',
    molarMass: 'molar mass',
    tpsa: 'TPSA',
    logP: 'logP',
    rotatable: 'rotatable',
    aromaticRings: 'aromatic rings',
    inchiKey: 'InChIKey',
    footer: (version: string) => `RDKit ${version} · WebAssembly in a Web Worker`,
  },
});

/**
 * O batismo.
 *
 * A frase que explica por que o produto **não** nomeia (D-15) precisa
 * atravessar inteira: "apelido é autoria, não nomenclatura". Encurtá-la na
 * tradução faria a tela em inglês parecer prometer nomenclatura IUPAC, que é
 * exatamente o que o produto se recusa a fazer.
 */
export const namePanelMessages = dictionary({
  'pt-BR': {
    knownLabel: 'Composto conhecido',
    knownChip: 'já existe lá fora',
    knownCid: (cid: number) => `PubChem CID ${String(cid)}`,
    knownBody:
      'Esta estrutura já é um composto conhecido, então não há o que batizar. O nome acima é o que o PubChem registra — o Rotamer não calcula nomenclatura.',

    namedLabel: 'Apelido da molécula',
    namedChip: 'apelido',
    namedBy: (who: string) => `batizada por ${who}`,
    notNomenclature:
      'Apelido é autoria, não nomenclatura. O Rotamer escolheu não nomear: quem nomeia escreve em inglês, e traduzir nome de composto é decidir estrutura.',
    keptBefore: 'A estrutura ficou em ',
    keptLink: 'minhas moléculas',
    keptAfter:
      '. O apelido é da estrutura e vale para todo mundo; a cópia guardada é sua.',

    formLabel: 'Batizar a molécula',
    chipUnseen: 'estrutura inédita',
    chipUnnamed: 'ninguém batizou esta estrutura',
    placeholder: 'Dar um apelido',
    inputLabel: 'Apelido para esta estrutura',
    submit: 'Batizar',
    submitting: 'Batizando…',
    alsoSaves: 'Batizar também guarda a estrutura nas suas moléculas.',
    signInLink: 'Entre na sua conta',
    signInAfter: ' para batizar — o apelido leva o nome de quem deu.',
    taken: 'Alguém batizou primeiro.',

    forStructure: 'Vale para a estrutura, não para o desenho.',
    asking: ' Estou perguntando ao PubChem se este composto já existe lá fora.',
    unknownOutside: (base: string) =>
      `O PubChem não conhece esta estrutura. ${base} Quem chegar a ela por outro caminho encontra o mesmo apelido.`,
    pubchemQuiet:
      ' O PubChem é serviço de fora e não respondeu — pode demorar a voltar. Isso não impede o batismo aqui dentro; só deixa em aberto se o composto já existe lá fora.',
  },

  en: {
    knownLabel: 'Known compound',
    knownChip: 'already exists out there',
    knownCid: (cid: number) => `PubChem CID ${String(cid)}`,
    knownBody:
      'This structure is already a known compound, so there is nothing to name. The name above is what PubChem records — Rotamer does not compute nomenclature.',

    namedLabel: 'Molecule nickname',
    namedChip: 'nickname',
    namedBy: (who: string) => `named by ${who}`,
    notNomenclature:
      'A nickname is authorship, not nomenclature. Rotamer chose not to name compounds: naming them is a decision about structure, and this product does not make it.',
    keptBefore: 'The structure is now in ',
    keptLink: 'my molecules',
    keptAfter: '. The nickname belongs to the structure and holds for everyone; the saved copy is yours.',

    formLabel: 'Name the molecule',
    chipUnseen: 'structure not seen before',
    chipUnnamed: 'nobody has named this structure',
    placeholder: 'Give it a nickname',
    inputLabel: 'Nickname for this structure',
    submit: 'Name it',
    submitting: 'Naming…',
    alsoSaves: 'Naming it also saves the structure to your molecules.',
    signInLink: 'Sign in to your account',
    signInAfter: ' to name it — the nickname carries the name of whoever gave it.',
    taken: 'Someone named it first.',

    forStructure: 'It holds for the structure, not for the drawing.',
    asking: ' I am asking PubChem whether this compound already exists out there.',
    unknownOutside: (base: string) =>
      `PubChem does not know this structure. ${base} Anyone who reaches it by another route finds the same nickname.`,
    pubchemQuiet:
      ' PubChem is an outside service and did not answer — it may take a while to come back. That does not stop the naming in here; it only leaves open whether the compound already exists out there.',
  },
});

/**
 * A faixa de cima.
 *
 * Os nomes das moléculas de exemplo mudam de idioma — são nomes de composto, não
 * conteúdo de usuário. O SMILES de cada uma, não: é notação, e é ele que
 * identifica o exemplo no `data-testid`.
 */
export const topBarMessages = dictionary({
  'pt-BR': {
    examples: 'Exemplos',
    examplesMenu: 'Moléculas de exemplo',
    quests: 'Missões',
    analysis: 'Análise',
    loadingEngine: 'carregando o motor',
    invalid: 'estrutura impossível',
    valid: 'válida',
    ethanol: 'Etanol',
    aceticAcid: 'Ácido acético',
    benzene: 'Benzeno',
    paracetamol: 'Paracetamol',
    aspirin: 'Aspirina',
    caffeine: 'Cafeína',
  },

  en: {
    examples: 'Examples',
    examplesMenu: 'Example molecules',
    quests: 'Missions',
    analysis: 'Analysis',
    loadingEngine: 'loading the engine',
    invalid: 'impossible structure',
    valid: 'valid',
    ethanol: 'Ethanol',
    aceticAcid: 'Acetic acid',
    benzene: 'Benzene',
    paracetamol: 'Paracetamol',
    aspirin: 'Aspirin',
    caffeine: 'Caffeine',
  },
});

/**
 * O painel de missões.
 *
 * Na trilha Otimização não há missão nenhuma, e por isso não há aqui nenhuma
 * palavra de pontuação para ela: "sem missão — ferramenta livre" é a única
 * frase que essa trilha recebe, nos dois idiomas (D-09).
 */
export const questPanelMessages = dictionary({
  'pt-BR': {
    label: 'Missão',
    quest: 'missão',
    questProgress: (done: number, total: number) =>
      `missão · ${String(done)} de ${String(total)} cumpridas`,
    met: 'cumprida',
    pick: 'Escolher missão',
    free: 'Sem missão — ferramenta livre',
    freeBody: 'Desenhe o que quiser. Os descritores continuam saindo do RDKit a cada traço.',
    /** A nota vem do servidor, sempre — nunca do que o navegador calculou. */
    progressSaved: (score: number) =>
      `Progresso salvo. Nota conferida no servidor: ${String(score)} de 100.`,
    signInToKeep: ' para guardar o que já cumpriu.',
    outOf: 'de 100',
    seeHint: 'Ver dica',
    anotherHint: 'Outra dica',
  },

  en: {
    label: 'Mission',
    quest: 'mission',
    questProgress: (done: number, total: number) =>
      `mission · ${String(done)} of ${String(total)} completed`,
    met: 'completed',
    pick: 'Choose a mission',
    free: 'No mission — free tool',
    freeBody: 'Draw whatever you like. The descriptors still come from RDKit at every stroke.',
    progressSaved: (score: number) =>
      `Progress saved. Score checked on the server: ${String(score)} out of 100.`,
    signInToKeep: ' to keep what you have completed.',
    outOf: 'out of 100',
    seeHint: 'See a hint',
    anotherHint: 'Another hint',
  },
});

/** O resumo da molécula-resposta, no topo da aba de autoria. */
export const authoringPanelMessages = dictionary({
  'pt-BR': {
    groupCount: (n: number) => `${String(n)} ${n === 1 ? 'grupo funcional' : 'grupos funcionais'}`,
  },

  en: {
    groupCount: (n: number) => `${String(n)} functional ${n === 1 ? 'group' : 'groups'}`,
  },
});

/**
 * A bancada: o que ela diz depois de organizar o desenho, e o que a cena diz
 * enquanto não há forma para mostrar.
 *
 * Os avisos de estereoquímica são três frases diferentes de propósito. "A
 * cunha saiu", "a cunha mudou de ligação" e "a cunha virou traço" ensinam
 * químicas diferentes, e dizer "saiu" nas três seria mentir em duas — para
 * uma sala inteira, nos dois idiomas (D-01, D-24).
 */
export const workspaceMessages = dictionary({
  'pt-BR': {
    removedWedges: (n: number) =>
      n === 1
        ? 'A cunha saiu do desenho: naquele átomo ela não definia configuração.'
        : `${String(n)} cunhas saíram do desenho: naqueles átomos elas não definiam configuração.`,
    removedWedgesDetail:
      'Cunha só vale em centro estereogênico — átomo com quatro grupos diferentes. Ctrl+Z traz o desenho de antes.',

    redrawnWedges: 'As cunhas foram redesenhadas: mesma configuração, outro traço.',
    redrawnWedgesDetail:
      'Com as posições novas, o RDKit escolhe de qual ligação a cunha sai e para que lado ela aponta. As letras R e S ao lado dos átomos continuam as mesmas.',

    movedWedges: (n: number) =>
      n === 1
        ? 'A cunha mudou de ligação: o centro continua ali.'
        : `${String(n)} cunhas mudaram de ligação: os centros continuam ali.`,
    movedWedgesDetail:
      'Com as posições novas, o RDKit escolhe de qual ligação do centro a cunha sai. As letras R e S continuam as mesmas.',

    flippedWedges: (n: number) =>
      n === 1
        ? 'A cunha virou traço: a mesma configuração, vista do outro lado.'
        : `${String(n)} cunhas trocaram de tipo: a mesma configuração, vista do outro lado.`,
    flippedWedgesDetail: 'As letras R e S ao lado dos átomos continuam as mesmas.',

    tidyRefused:
      'Não organizei o desenho: nas posições novas, a configuração de um centro sairia diferente — e isso seria outra molécula.',
    tidyRefusedDetail:
      'O seu desenho está intacto na tela, nada foi trocado. Isto é um defeito do Rotamer, não do seu desenho.',

    scenePlaceholder: 'A forma no espaço aparece assim que a estrutura fechar.',
  },

  en: {
    removedWedges: (n: number) =>
      n === 1
        ? 'The wedge left the drawing: at that atom it was not defining a configuration.'
        : `${String(n)} wedges left the drawing: at those atoms they were not defining a configuration.`,
    removedWedgesDetail:
      'A wedge only counts at a stereocenter — an atom with four different groups. Ctrl+Z brings back the earlier drawing.',

    redrawnWedges: 'The wedges were redrawn: same configuration, different strokes.',
    redrawnWedgesDetail:
      'With the new positions, RDKit picks which bond the wedge comes from and which way it points. The R and S letters beside the atoms stay the same.',

    movedWedges: (n: number) =>
      n === 1
        ? 'The wedge moved to another bond: the center is still there.'
        : `${String(n)} wedges moved to other bonds: the centers are still there.`,
    movedWedgesDetail:
      'With the new positions, RDKit picks which bond of the center the wedge comes from. The R and S letters stay the same.',

    flippedWedges: (n: number) =>
      n === 1
        ? 'The wedge became a dash: the same configuration, seen from the other side.'
        : `${String(n)} wedges changed type: the same configuration, seen from the other side.`,
    flippedWedgesDetail: 'The R and S letters beside the atoms stay the same.',

    tidyRefused:
      'I did not tidy the drawing: at the new positions, the configuration of a center would come out different — and that would be another molecule.',
    tidyRefusedDetail:
      'Your drawing is untouched on screen, nothing was swapped. This is a defect in Rotamer, not in your drawing.',

    scenePlaceholder: 'The shape in space appears as soon as the structure closes.',
  },
});
