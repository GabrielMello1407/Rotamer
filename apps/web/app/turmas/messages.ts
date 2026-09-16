/**
 * Todo texto de tela das listas da turma (D-25), do catálogo compartilhado
 * (D-26, D-27) e dos papéis da escola (D-29) vive aqui — chaves em inglês,
 * textos em pt-BR (§2 de `docs/ROTEIROS.md`). É o que impede a mesma frase
 * divergir entre a server action e o componente, e o único arquivo a editar se a
 * resposta do Idelcio mudar a palavra "lista".
 */

/** Concorda plural em pt-BR sem inventar exceção fora daqui. */
function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

export const messages = {
  // ---------------------------------------------------------- /turmas, a porta de entrada
  classrooms: {
    /**
     * A página de emitir código de senha não tinha link em lugar nenhum do
     * produto: só chegava lá quem digitasse `/codigos` na barra de endereço.
     * Ela é a ferramenta do professor no D-19, e mora onde ele já está.
     */
    codesLink: 'Códigos de senha',
    codesHint: 'Aluno que esqueceu a senha troca com um código que você emite e entrega em mãos.',

    /**
     * Quem dá aula e ainda não foi promovido via a tela do aluno e nada mais.
     * Sem esta explicação, a conclusão é que o produto está quebrado — e a
     * resposta certa não é um botão, porque professor não se autodeclara
     * (D-19); é dizer a quem pedir.
     */
    notTeacherTitle: 'Dá aula e quer abrir uma turma?',
    notTeacherBody:
      'Abrir turma, montar listas e emitir código de senha são de conta de professor, e esse papel é dado por quem administra o Rotamer da sua escola — nunca por autodeclaração, porque quem emite código de senha pode entrar na conta de um aluno.',
    notTeacherHow:
      'Peça a promoção a quem administra o Rotamer da sua escola, ou a quem instalou, com o e-mail desta conta. Vale na próxima página que você abrir.',
  },

  // ------------------------------------ professores da escola, em /turmas (D-29)
  staff: {
    heading: 'Professores da escola',
    /**
     * O poder que a promoção dá, dito inteiro. Quem lê tem de saber que está
     * entregando a chave da conta de um aluno — é isso que faz pensar antes de
     * confirmar, e é a única proteção real contra promover a pessoa errada.
     */
    warning:
      'Professor abre turma, monta listas e emite código de troca de senha. Emitir código de senha é poder entrar na conta de um aluno. Promova só quem você conhece.',
    /** O limite do próprio administrador, dito na tela em que ele iria procurá-lo. */
    ceiling:
      'Outro administrador só pelo terminal, por quem cuida da instalação. É o que garante que ninguém perca o controle desta instância por uma conta invadida.',
    emailLabel: 'e-mail de quem vai dar aula',
    check: 'Conferir',
    checking: 'Conferindo…',
    /**
     * A confirmação mostra o **nome** de quem tem aquele e-mail. O risco desta
     * tela não é invasão, é dedo: `ana.silva@` no lugar de `ana.silvia@` entrega
     * o papel para a conta errada, e o e-mail relido não denuncia o erro. O nome
     * pega o dedo; ele não pega má-fé, porque também é escolhido pela própria
     * pessoa no cadastro.
     */
    confirm: (name: string): string => `Promover ${name} a professor?`,
    promote: 'Promover a professor',
    promoting: 'Promovendo…',
    cancel: 'Cancelar',
    promoted: (name: string): string =>
      `${name} agora é professor. Vale na próxima página que ela abrir.`,
    demote: 'Rebaixar',
    demoteConfirm: (name: string, email: string): string =>
      `Tirar de ${name} (${email}) o papel de professor?`,
    /**
     * O efeito inteiro, inclusive o que sai do ar. Dizer só "deixa de abrir
     * turma" deixava de fora a parte que faz alguém rebaixar às pressas: a missão
     * que essa conta publicou no catálogo, lida por aluno de qualquer escola.
     */
    demoteBody:
      'Ela deixa de abrir turma, montar lista, ver o quadro e emitir código de senha, e as missões que publicou saem do catálogo. As turmas e as listas ficam guardadas, e voltam se ela for promovida de novo.',
    demoted: (name: string): string => `${name} voltou a ser conta de aluno.`,
    administratorChip: 'administra',
    /** Quem veio do terminal não tem nome de quem promoveu, e a tela diz isso em vez de mentir. */
    grantedByTerminal: 'papel dado pelo terminal',
    grantedBy: (name: string, when: string): string => `promovido por ${name} em ${when}`,

    // As recusas. Todas as quatro regras do servidor têm uma frase própria aqui.
    unavailable: 'Indisponível neste ambiente.',
    malformed: 'Pedido mal formado.',
    notAdministrator: 'Só conta de administrador muda o papel de alguém.',
    /** A mesma frase para "não existe" e "é de outra escola" (a regra do D-19). */
    notFound: 'Não encontrei essa conta na sua escola. Confira o e-mail com quem vai dar aula.',
    notYourself:
      'O seu próprio papel não se muda por aqui. Quem cuida da instalação muda pelo terminal.',
    /**
     * As recusas de escrita não repetem nome nenhum. O nome quem mostra é o passo
     * de conferência, que é contado no teto; uma recusa com nome seria a mesma
     * varredura de e-mails por uma porta sem contador.
     */
    alreadyTeaching: 'Essa conta já dá aula nesta escola.',
    notTeaching: 'Essa conta não é professora nesta escola.',
    notAnotherAdministrator:
      'Administrador não rebaixa administrador. Quem cuida da instalação faz isso pelo terminal.',
    tooManyLookups: 'Muitas consultas em pouco tempo. Espere um pouco e tente de novo.',
    /** O papel mudou entre a conferência e a confirmação — refazer é mais honesto que insistir. */
    changedMeanwhile: 'O papel dessa conta mudou enquanto você confirmava. Confira de novo.',
  },

  // ---------------------------------------------------------- §6.1 — professor, /turmas/[id]
  classroomSection: {
    heading: 'Listas da turma',
    newButton: 'Nova lista',
    emptyTitle: 'Nenhuma lista ainda.',
    emptyBody:
      'Uma lista é a sequência de missões de uma aula. Você escolhe do catálogo, cria as suas desenhando a resposta, ou mistura os dois.',
    footer: 'O aluno só vê a lista depois de publicada. Rascunho é seu.',
    draftChip: 'rascunho · só você vê',
    publishedChip: 'publicado',
    itemCount: (n: number): string => `${String(n)} ${pluralize(n, 'missão', 'missões')}`,
    namePlaceholder: 'Funções oxigenadas — 3ª série',
    /**
     * `unarchiveAssignment` existia sem caminho de tela: a
     * única leitura desta seção vinha sem `archivedAt`, e uma lista
     * arquivada simplesmente sumia, sem jeito de voltar.
     */
    archivedHeading: (n: number): string => `Listas arquivadas (${String(n)})`,
    unarchive: 'Desarquivar',
  },

  // ---------------------------------------------------------- §6.2 — professor, a lista
  assignment: {
    nameLabel: 'Nome da lista',
    namePlaceholder: 'Funções oxigenadas — 3ª série',
    draftStatus: (items: number): string =>
      `Rascunho · ${String(items)} ${pluralize(items, 'missão', 'missões')} · só você vê`,
    publishedStatus: (when: string, items: number, students: number): string =>
      `Publicado em ${when} · ${String(items)} ${pluralize(items, 'missão', 'missões')} · ${String(students)} ${pluralize(students, 'aluno na turma', 'alunos na turma')}`,
    originCatalog: 'catálogo',
    originTeacher: 'sua missão',
    up: 'Subir',
    upWithKey: (title: string, position: number): string =>
      `Subir «${title}» para a posição ${String(position)}`,
    down: 'Descer',
    downWithKey: (title: string, position: number): string =>
      `Descer «${title}» para a posição ${String(position)}`,
    remove: 'Remover',
    removed: (title: string): string => `«${title}» saiu da lista.`,
    undo: 'Desfazer',
    /** Desfazer devolve para a posição de origem; se a subida falhar no meio, a tela diz. */
    undoMoveFailed: (title: string): string =>
      `«${title}» voltou para a lista, mas não consegui trazê-la de volta para a posição de antes. Suba com ↑.`,
    pickFromCatalog: 'Escolher do catálogo',
    createByDrawing: 'Criar missão desenhando',
    publish: 'Publicar para a turma',
    archive: 'Arquivar lista',
    unarchive: 'Desarquivar lista',
    emptyTitle: 'Esta lista ainda não tem missão nenhuma.',
    emptyBody: 'Escolha do catálogo, ou desenhe a resposta e crie a sua.',
    entered: (title: string, position: number): string =>
      `«${title}» entrou na lista, na posição ${String(position)}.`,
    publishToCatalog: 'Publicar no catálogo',
    withdrawFromCatalog: 'Retirar do catálogo',
    onCatalog: 'no catálogo',
    archivedNotice: 'Esta lista foi arquivada. Ela some das duas telas até você desarquivar.',
    editQuest: 'Editar texto',
    archiveQuest: 'Arquivar missão',
    unarchiveQuest: 'Desarquivar missão',
  },

  // ------------------------------------------ editar a missão própria, na lista
  editQuestPopover: {
    title: 'Editar «{titulo}»',
    /**
     * O que muda e o que não muda. Objetivo não entra aqui de propósito: em
     * lista publicada ele está travado (§3.5), porque mudá-lo mudaria a nota
     * de quem já tentou.
     */
    body: 'Título, enunciado e dicas. Os objetivos não mudam — eles saíram da molécula que você desenhou, e mudá-los mudaria a nota de quem já tentou.',
    save: 'Salvar',
    cancel: 'Cancelar',
    saved: 'Texto atualizado.',
    archived: (title: string): string =>
      `«${title}» foi arquivada. Ela sai do seletor de missões e do catálogo; as listas que já a usam continuam funcionando.`,
    unarchived: (title: string): string => `«${title}» voltou para o seletor de missões.`,
  },

  publishPopover: {
    title: (classroomName: string): string => `Publicar para ${classroomName}?`,
    body: (items: number): string =>
      `${String(items)} ${pluralize(items, 'missão', 'missões')}, nesta ordem. A partir daqui a turma vê a lista e os objetivos das suas missões ficam travados — mudar objetivo mudaria a nota de quem já tentou.`,
    confirm: 'Publicar',
    cancel: 'Cancelar',
    afterPublish:
      'Publicado. Título, enunciado e dicas continuam editáveis; objetivo, não. Para cobrar outra coisa, duplique a missão.',
  },

  cancelAuthoringPopover: {
    title: 'Sair sem criar a missão?',
    body: 'O desenho não fica guardado.',
    confirm: 'Sair',
    cancel: 'Continuar desenhando',
  },

  // ---------------------------------------------------------- catálogo do professor (§6.2)
  catalogPicker: {
    label: 'Escolher do catálogo',
    trackAll: 'Todas',
    trackStructure: 'Estrutura',
    trackGeometry: 'Geometria',
    trackProperty: 'Propriedade',
    alreadyInList: 'já está na lista',
    addButton: (n: number): string => `Acrescentar (${String(n)})`,
    cancel: 'Cancelar',
    emptyFiltered: 'Nenhuma missão desta trilha fora da lista.',
  },

  // ---------------------------------------------------------- §6.3 — criar missão desenhando
  authoring: {
    topBarLabel: (assignmentTitle: string): string => `Criando missão · ${assignmentTitle}`,
    save: 'Salvar missão',
    cancel: 'Cancelar',
    tab: 'Autoria',
    structureHeading: 'A resposta que você desenhou',
    keptInside:
      'A molécula-resposta fica guardada dentro da missão, não na sua estante. O aluno nunca a recebe.',
    goalsHeading: 'Objetivos que dá para cobrar',
    goalsCount: (marked: number, total: number): string =>
      `${String(marked)} de ${String(total)} objetivos marcados`,
    blockIdentity: 'a molécula',
    blockFormula: 'fórmula',
    blockGroups: 'grupos funcionais',
    blockCounts: 'átomos e contagens',
    inchiWarningHeadline: 'Marcado, este é o único objetivo da missão.',
    inchiWarningBody:
      'A nota vira 0 ou 100 e um isômero parecido não vale nada. Para aceitar mais de uma resposta certa, cobre grupos e contagens em vez desta.',
    disabledByExclusive: 'desligado enquanto você cobra a molécula exata',
    rotatableNote:
      'Rotacionáveis na definição estrita do RDKit. O PubChem conta de outro jeito, e cada um está certo dentro da própria definição.',
    closing:
      'Esta lista saiu da molécula que você desenhou. Não dá para acrescentar objetivo escrevendo — o que o aluno vai ter de cumprir é sempre o que o RDKit mediu aqui.',
    titleLabel: 'Título da missão',
    briefLabel: 'Enunciado',
    briefHelp: 'Fale de química, não de interface: o aluno lê isto antes de desenhar.',
    briefStudentsWarning: 'O enunciado é lido pela turma inteira. Não escreva o nome de nenhum aluno.',
    hintsLabel: 'Dicas (até 3)',
    hintsHelp: 'Uma de cada vez, na ordem. O aluno só vê a dica quando pede — dica dada antes da tentativa não ensina.',
    addHint: 'Acrescentar dica',
    removeHint: 'Remover dica',
    footerCount: (goals: number, hints: number): string =>
      `${String(goals)} ${pluralize(goals, 'objetivo', 'objetivos')} · ${String(hints)} ${pluralize(hints, 'dica', 'dicas')}`,
    nothingDrawn: 'Desenhe a resposta. Os objetivos que dá para cobrar saem dela.',
    noGoalMarked: 'Marque pelo menos um objetivo.',
    emptyTitleOrBrief:
      'A missão precisa de um título e de um enunciado. O aluno lê isto antes de desenhar.',
  },

  // ---------------------------------------------------------- §6.4 — aluno, QuestPanel
  studentAssignments: {
    heading: 'DA SUA TURMA',
    progress: (met: number, total: number): string => `${String(met)} de ${String(total)} cumpridas`,
    byTeacherLabel: 'missão do seu professor',
    metJustNow: (remaining: number): string =>
      `Cumprida. ${remaining === 0 ? '' : `Faltam ${String(remaining)} na lista.`}`,
    nextItem: (title: string): string => `Próxima: ${title} →`,
    listClosed: (assignmentTitle: string): string =>
      `Cumprida. Você fechou a lista «${assignmentTitle}».`,
    catalogFreedom: 'O catálogo é livre: dá para explorar por conta, mesmo fora da lista.',
    inProgressOption: (title: string): string => `Da sua turma · ${title}`,
    /**
     * O objetivo de InChIKey (ou uma missão de professor alcançada
     * só pelo catálogo, sem a condição que "Da sua turma" traria) não tem
     * como ser avaliado no cliente (R-4). Nunca "por cumprir": o servidor
     * ainda não respondeu, e dizer "não cumprido" seria mentir enquanto se
     * espera a resposta.
     */
    checkingWithServer: 'conferindo…',
  },

  // ---------------------------------------------------------- catálogo buscável (D-26, D-27)
  catalog: {
    pageTitle: 'Catálogo',
    searchLabel: 'Buscar missão',
    searchPlaceholder: 'Busque por nome, trilha ou grupo funcional — «éster», «anel»…',
    empty: 'Nenhuma missão encontrada.',
    linkFromMenu: 'Catálogo',
    byTeacher: (name: string, institution: string | null): string =>
      institution === null ? `missão de ${name}` : `missão de ${name} · ${institution}`,
    report: 'Denunciar',
    reportPlaceholder: 'Em uma linha: o que está errado nesta missão?',
    reportSend: 'Enviar denúncia',
    reportCancel: 'Cancelar',
    reportReceived: 'Recebido.',
  },

  // ---------------------------------------------------------- §6.5 — quadro por lista
  board: {
    stuckHeading: 'ONDE A TURMA TRAVOU NESTA LISTA',
    stuckNote: 'Travar é ter tentado e não ter cumprido — quem nem abriu não conta aqui.',
    legend: '✓ cumpriu · • travou (abriu e não cumpriu) · – não abriu',
    metLabel: (name: string, position: number): string => `${name}, item ${String(position)}: cumpriu`,
    stuckLabel: (name: string, position: number): string => `${name}, item ${String(position)}: travou`,
    untouchedLabel: (name: string, position: number): string =>
      `${name}, item ${String(position)}: não abriu`,
    metCountHeading: 'cumpridas',
    footer:
      'O que aparece aqui é progresso de missão, avaliado no servidor a cada tentativa. As moléculas que o aluno desenhou não entram nesta tela.',
    emptyOpened: 'Ninguém abriu nenhuma missão desta lista ainda.',
  },

  // ---------------------------------------------------------- §6.6 — vazios
  empty: {
    /**
     * A mesma frase para "turma sem aluno" nas duas seções da
     * página da turma: o resumo do topo (`page.tsx`) e o quadro por lista
     * publicada (`AssignmentBoardSection`). Duas frases diferentes para o
     * mesmo estado liam como dois bugs, não como um.
     */
    noStudents: 'Ninguém entrou ainda. Escreva o código no quadro.',
    studentNoPublished:
      'Seu professor ainda não publicou nenhuma lista. Enquanto isso, o catálogo aqui embaixo é todo seu.',
    studentNoClassroom:
      'Você ainda não está em nenhuma turma. Com o código que o professor passa, a lista da aula aparece aqui.',
    /** O caminho, não só o estado: a tela diz onde se digita o código. */
    studentJoinLink: 'Entrar numa turma',
  },

  // ---------------------------------------------------------- §6.6 — erros
  errors: {
    structureCantClose:
      'Enquanto a estrutura não fechar, não há objetivo nenhum para extrair. Corrija o desenho e a lista volta sozinha.',
    nothingDrawn: 'Desenhe a resposta. Os objetivos que dá para cobrar saem dela.',
    noGoalMarked: 'Marque pelo menos um objetivo. Sem objetivo, a missão não teria como ser cumprida — nem errada.',
    emptyTitleOrBrief: 'A missão precisa de um título e de um enunciado. O aluno lê isto antes de desenhar.',
    slugRepeated: (title: string): string =>
      `«${title}» já está nesta lista. A mesma missão duas vezes contaria o progresso duas vezes.`,
    publishEmpty: 'Não dá para publicar uma lista vazia. Acrescente pelo menos uma missão.',
    editAfterPublish:
      'Esta lista já foi publicada: título, enunciado e dicas continuam editáveis, os objetivos não. Mudar objetivo mudaria a nota de quem já tentou. Para cobrar outra coisa, duplique a missão.',
    questNotFound: 'Essa missão não existe.',
    anonymousTeacherQuest: 'Missão de turma precisa de conta.',
    enterAccount: 'Entre na sua conta',
    linkRejected: 'O enunciado não aceita link — cole o endereço no quadro ou no material da escola.',
  },

  // ---------------------------------------------------------- toque (§6.8)
  a11y: {
    goalsList: 'Objetivos que dá para cobrar',
  },
};
