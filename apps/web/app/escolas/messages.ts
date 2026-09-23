import { dictionary, plural } from '@rotamer/i18n';

/**
 * A página que se manda para a escola.
 *
 * É a página em que o produto mais promete — e por isso é a que mais precisa da
 * seção "o que ele não faz". As duas listas atravessam inteiras nos dois
 * idiomas: encurtar a segunda na tradução seria prometer, em inglês, o que o
 * produto se recusa a fazer em português.
 *
 * Nome de motor (RDKit, MMFF94, OpenChemLib), notação (`3N − 6`, TPSA, logP) e
 * unidade não mudam de idioma.
 */
export const schoolsMessages = dictionary({
  'pt-BR': {
    metaTitle: 'Rotamer para escolas — química orgânica que o aluno desenha e vê no espaço',
    metaDescription:
      'Editor de moléculas no navegador: o aluno desenha em 2D e a forma tridimensional aparece calculada, não ilustrada. Validação pelo RDKit, campo de força MMFF94, missões e painel do professor.',
    ogTitle: 'Rotamer para escolas',
    ogDescription:
      'O aluno desenha a estrutura e vê a molécula se dobrar e vibrar. Tudo calculado pelo RDKit e pelo MMFF94 — a IA só explica, e sempre marcada.',

    openEditor: 'Abrir o editor',
    title: 'O aluno desenha a estrutura. A molécula aparece no espaço, calculada.',
    lead: 'Não é ilustração nem animação pronta: a geometria é encontrada por um campo de força rodando no navegador, e a vibração é dinâmica molecular a 300 K. O que o aluno vê se mexendo na tela é a mesma física que está no livro dele.',
    openEditorNoAccount: 'Abrir o editor — sem cadastro',
    seeMolecule: 'Ver uma molécula pronta',
    /** A legenda da estrutura, desenhada pelo RDKit no servidor, na hora. */
    caption: (formula: string, mass: string) =>
      `Aspirina, desenhada pelo RDKit agora — ${formula} · ${mass} g/mol`,

    ruleHeading: 'A regra que não se quebra',
    ruleStrong: 'O núcleo determinístico decide. A IA explica.',
    ruleText:
      ' Validade, valência, fórmula, massa, TPSA, logP, aromaticidade, frequência de vibração e nota de missão saem sempre do RDKit, do campo de força ou do motor de missões — nunca de um modelo de linguagem. O tutor de IA lê os números já calculados e escreve por que algo falhou, sempre marcado como hipótese na tela.',
    ruleNote:
      'Um modelo de linguagem acerta 90% das perguntas de valência e nos outros 10% produz uma explicação confiante e errada. Com aluno passa; com professor de química, encerra o produto.',

    studentHeading: 'O que o aluno faz',
    studentDraw:
      'Desenha clicando e arrastando, com os ângulos travados em 30° — a cadeia sai em zigue-zague, como se desenha no quadro.',
    studentFold:
      'Vê a estrutura se dobrar até encontrar a forma de menor energia e depois vibrar, quadro a quadro, com a energia na tela.',
    studentModesBefore: 'Escolhe um modo normal de vibração e vê só ele: são ',
    studentModesAfter: ' modos, e a conta bate com a que o professor faz no quadro.',
    studentStereo:
      'Marca cunha e traço, e o RDKit responde se aquele centro é R ou S — e a forma no espaço muda junto.',
    studentError:
      'Erra e entende: “O átomo de C tem 5 ligações, mas suporta no máximo 4” — o erro explica a química, nunca o programa.',

    teacherHeading: 'O que o professor ganha',
    questCount: (n: number) => `${String(n)} ${plural(n, 'missão', 'missões')}`,
    teacherTracks: (structure: number, geometry: number, property: number) =>
      ` em três trilhas — ${String(structure)} de estrutura, ${String(geometry)} de geometria e ${String(property)} de propriedade —, cada uma com objetivos verificáveis por número calculado.`,
    teacherCodeStrong: 'Turma com código.',
    teacherCode:
      ' Ele escreve seis caracteres no quadro; quem estuda entra digitando. Sem convite por e-mail, porque muito aluno não tem caixa de entrada e a que tem não abre na aula.',
    teacherBoardStrong: 'Onde a turma parou.',
    teacherBoard:
      ' O painel mostra em quais missões mais gente travou. É a lista de onde a próxima aula começa — não é ranking de aluno.',
    teacherPasswordStrong: 'Recuperação de senha na sala.',
    teacherPassword:
      ' O professor emite um código de uso único e entrega em mãos. Nenhum aluno fica de fora da aula esperando um e-mail.',

    stackHeading: 'O que roda por baixo',
    stackValidation: 'Validação e descritores',
    stackValidationValue: 'RDKit compilado para WebAssembly, no navegador',
    stackShape: 'Forma no espaço',
    stackShapeValue: 'conformação do OpenChemLib, minimizada com MMFF94',
    stackVibration: 'Vibração',
    stackVibrationValue:
      'dinâmica molecular por velocity-Verlet sobre o gradiente do MMFF94, a 300 K',
    stackModes: 'Modos normais',
    stackModesValue: 'Hessiana por diferenças finitas, ponderação por massa e diagonalização',
    stackWhere: 'Onde roda',
    stackWhereValue: 'navegador, sem instalar nada; a química acontece na máquina do aluno',
    stackData: 'Dado do aluno',
    stackDataValue: 'no servidor da escola ou no nosso, à escolha; telemetria sem cookie',

    limitsHeading: 'O que o Rotamer não faz',
    limitsText:
      'Esta lista é tão importante quanto a de cima, e está aqui porque um produto de química que promete demais quebra na primeira aula com um professor atento.',
    limitReactionStrong: 'Não prevê reação nem retrossíntese.',
    limitReaction: ' Ele não diz o que sai de uma mistura.',
    limitActivityStrong: 'Não afirma atividade biológica.',
    limitActivity:
      ' Descritores são descritores: TPSA e logP descrevem a molécula, não dizem que ela funciona.',
    limitNamingStrong: 'Não calcula nome IUPAC.',
    limitNaming:
      ' Quem desenha uma estrutura inédita pode dar um apelido, e o apelido nunca aparece sem o nome de quem deu.',
    limitToolsStrong: 'Não substitui PyMOL, ChemDraw ou Maestro.',
    limitTools: ' É ferramenta de ensino, com um motor de verdade dentro.',
    limitFrequenciesStrong: 'As frequências são do campo de força',
    limitFrequencies:
      ', não medidas de espectro — campo de força clássico costuma superestimar estiramento em 5% a 10%, e a tela diz isso.',

    tryHeading: 'Para experimentar',
    tryText:
      'O editor abre sem cadastro e funciona inteiro sem conta: dá para levar para a aula hoje e decidir depois. Conta só é necessária para guardar progresso, montar turma e batizar estrutura.',
    brandLink: 'Marca e tokens',

    footer:
      'Rotamer · química orgânica e medicinal no navegador. Os números desta página foram calculados na hora pelo mesmo motor que responde ao aluno.',
  },

  en: {
    metaTitle: 'Rotamer for schools — organic chemistry students draw and see in space',
    metaDescription:
      'A molecule editor in the browser: students draw in 2D and the three-dimensional shape appears computed, not illustrated. Validation by RDKit, the MMFF94 force field, missions and a teacher’s board.',
    ogTitle: 'Rotamer for schools',
    ogDescription:
      'Students draw the structure and watch the molecule fold and vibrate. All of it computed by RDKit and MMFF94 — the AI only explains, and is always marked.',

    openEditor: 'Open the editor',
    title: 'The student draws the structure. The molecule appears in space, computed.',
    lead: 'It is not an illustration or a canned animation: the geometry is found by a force field running in the browser, and the vibration is molecular dynamics at 300 K. What the student sees moving on screen is the same physics that is in their textbook.',
    openEditorNoAccount: 'Open the editor — no sign-up',
    seeMolecule: 'See a finished molecule',
    caption: (formula: string, mass: string) =>
      `Aspirin, drawn by RDKit just now — ${formula} · ${mass} g/mol`,

    ruleHeading: 'The rule that does not bend',
    ruleStrong: 'The deterministic core decides. The AI explains.',
    ruleText:
      ' Validity, valence, formula, mass, TPSA, logP, aromaticity, vibration frequency and mission score always come from RDKit, from the force field or from the mission engine — never from a language model. The AI tutor reads the already-computed numbers and writes why something failed, always marked on screen as a hypothesis.',
    ruleNote:
      'A language model gets 90% of valence questions right and in the other 10% produces a confident, wrong explanation. With a student that passes; with a chemistry teacher, it ends the product.',

    studentHeading: 'What the student does',
    studentDraw:
      'Draws by clicking and dragging, with the angles locked to 30° — the chain comes out zig-zag, the way it is drawn on the board.',
    studentFold:
      'Watches the structure fold until it finds the lowest-energy shape and then vibrate, frame by frame, with the energy on screen.',
    studentModesBefore: 'Picks one normal mode of vibration and sees only it: there are ',
    studentModesAfter: ' modes, and the count matches the one the teacher does on the board.',
    studentStereo:
      'Marks wedge and dash, and RDKit answers whether that center is R or S — and the shape in space changes with it.',
    studentError:
      'Gets it wrong and understands: “The C atom has 5 bonds, but it supports at most 4” — the error explains the chemistry, never the program.',

    teacherHeading: 'What the teacher gets',
    questCount: (n: number) => `${String(n)} ${plural(n, 'mission', 'missions')}`,
    teacherTracks: (structure: number, geometry: number, property: number) =>
      ` across three tracks — ${String(structure)} on structure, ${String(geometry)} on geometry and ${String(property)} on property — each with goals checkable against a computed number.`,
    teacherCodeStrong: 'A class with a code.',
    teacherCode:
      ' They write six characters on the board; students join by typing them. No e-mail invitations, because many students have no inbox and the ones who do will not open it in class.',
    teacherBoardStrong: 'Where the class got stuck.',
    teacherBoard:
      ' The board shows which missions most people got stuck on. It is the list of where the next lesson starts — it is not a ranking of students.',
    teacherPasswordStrong: 'Password recovery in the classroom.',
    teacherPassword:
      ' The teacher issues a single-use code and hands it over in person. No student sits out the lesson waiting for an e-mail.',

    stackHeading: 'What runs underneath',
    stackValidation: 'Validation and descriptors',
    stackValidationValue: 'RDKit compiled to WebAssembly, in the browser',
    stackShape: 'Shape in space',
    stackShapeValue: 'an OpenChemLib conformation, minimized with MMFF94',
    stackVibration: 'Vibration',
    stackVibrationValue:
      'molecular dynamics by velocity-Verlet over the MMFF94 gradient, at 300 K',
    stackModes: 'Normal modes',
    stackModesValue: 'a finite-difference Hessian, mass weighting and diagonalization',
    stackWhere: 'Where it runs',
    stackWhereValue: 'the browser, with nothing to install; the chemistry happens on the student’s machine',
    stackData: 'Student data',
    stackDataValue: 'on the school’s server or on ours, your choice; telemetry with no cookie',

    limitsHeading: 'What Rotamer does not do',
    limitsText:
      'This list matters as much as the one above, and it is here because a chemistry product that promises too much breaks in the first lesson with an attentive teacher.',
    limitReactionStrong: 'It does not predict reactions or retrosynthesis.',
    limitReaction: ' It does not say what comes out of a mixture.',
    limitActivityStrong: 'It does not claim biological activity.',
    limitActivity:
      ' Descriptors are descriptors: TPSA and logP describe the molecule, they do not say it works.',
    limitNamingStrong: 'It does not compute IUPAC names.',
    limitNaming:
      ' Whoever draws a structure not seen before can give it a nickname, and the nickname never appears without the name of whoever gave it.',
    limitToolsStrong: 'It does not replace PyMOL, ChemDraw or Maestro.',
    limitTools: ' It is a teaching tool, with a real engine inside.',
    limitFrequenciesStrong: 'The frequencies come from the force field',
    limitFrequencies:
      ', not from spectral measurements — a classical force field tends to overestimate stretching by 5% to 10%, and the screen says so.',

    tryHeading: 'To try it out',
    tryText:
      'The editor opens with no sign-up and works in full without an account: you can take it into a lesson today and decide afterwards. An account is only needed to keep progress, build a class and name a structure.',
    brandLink: 'Brand and tokens',

    footer:
      'Rotamer · organic and medicinal chemistry in the browser. The numbers on this page were computed on the spot by the same engine that answers the student.',
  },
});
