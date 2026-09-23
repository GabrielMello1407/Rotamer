/**
 * Todo texto de tela das listas da turma (D-25), do catálogo compartilhado
 * (D-26, D-27) e dos papéis da escola (D-29) vive aqui — chaves em inglês,
 * textos nos dois idiomas (§2 de `docs/ROTEIROS.md`, D-30). É o que impede a
 * mesma frase divergir entre a server action e o componente, e o único arquivo a
 * editar se a resposta do Idelcio mudar a palavra "lista".
 *
 * Quem lê: `useMessages(messages)` no cliente, `await serverMessages(messages)`
 * na página de servidor, `pick(messages, await currentLocale())` na ação.
 *
 * O glossário que o inglês segue, e do qual ele não se afasta em nenhuma chave —
 * o mesmo da documentação em inglês (`docs/IDIOMAS.md`): turma = class · lista
 * = assignment · missão = mission · tentativa = attempt · estante = shelf ·
 * catálogo = catalog · professor = teacher · aluno = student · código de senha
 * = password reset code · cumpriu / travou / não abriu = completed / stuck /
 * not opened. Inglês americano, como o resto da documentação.
 */
import { dictionary, plural } from '@rotamer/i18n';

export const messages = dictionary({
  'pt-BR': {
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

      // A página em si (`page.tsx`): título da aba, resumo e o texto fixo acima dos painéis.
      pageMetaTitle: 'Turmas · Rotamer',
      pageMetaDescription: 'Abrir turma, entrar numa turma e ver onde a turma parou.',
      heading: 'Turmas',
      intro:
        'O professor abre a turma e escreve o código no quadro; quem estuda entra digitando esse código. Não há convite por e-mail, pelo mesmo motivo da troca de senha: em muita escola o aluno não tem caixa de entrada, e a que tem não abre na aula.',

      // O painel de quem dá aula (`Classrooms.tsx`).
      teachingHeading: 'Turmas que você dá',
      teachingEmpty: 'Nenhuma turma aberta ainda.',
      nameLabel: 'nome da turma',
      namePlaceholder: '3º A — manhã',
      openButton: 'Abrir turma',
      opening: 'Abrindo…',
      codeNote:
        'O código aparece na lista. Escreva no quadro: é com ele que o aluno entra, sem e-mail no caminho.',
      /** `1 aluno`, `2 alunos` — usado nas duas listas do painel, a de quem dá aula e a de quem estuda. */
      studentCount: (n: number): string => `${String(n)} ${plural(n, 'aluno', 'alunos')}`,
      created: (name: string, code: string): string => `Turma "${name}" aberta. O código é ${code}.`,

      // O painel de quem estuda, no mesmo componente.
      attendingHeading: 'Turmas em que você está',
      attendingEmpty: 'Você ainda não entrou em nenhuma turma.',
      codeLabel: 'código da turma',
      codePlaceholder: 'XXXXXX',
      joinButton: 'Entrar na turma',
      joining: 'Entrando…',
      joined: (name: string): string => `Você entrou em "${name}".`,
      alreadyJoined: (name: string): string => `Você já estava em "${name}".`,
      attendingNote:
        'O professor vê quais missões você cumpriu e onde parou. O que você desenha fora das missões é seu, e não aparece para ninguém.',
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
      itemCount: (n: number): string => `${String(n)} ${plural(n, 'missão', 'missões')}`,
      namePlaceholder: 'Funções oxigenadas — 3ª série',
      /** O campo não tem rótulo visível — só o placeholder — e por isso precisa de um para leitor de tela. */
      newNameAriaLabel: 'Nome da nova lista',
      /**
       * `unarchiveAssignment` existia sem caminho de tela: a
       * única leitura desta seção vinha sem `archivedAt`, e uma lista
       * arquivada simplesmente sumia, sem jeito de voltar.
       */
      archivedHeading: (n: number): string => `Listas arquivadas (${String(n)})`,
      unarchive: 'Desarquivar',
    },

    // ---------------------------------------------------------- /turmas/[id], o resumo da turma
    classroomSummary: {
      metaTitle: 'Turma · Rotamer',
      metaDescription: 'Onde a turma parou.',
      /** A frase do topo — só aparece quando a turma já tem gente. */
      summary: (students: number, quests: number): string =>
        `${String(students)} ${plural(students, 'aluno', 'alunos')}, de ${String(quests)} ${plural(quests, 'missão', 'missões')} no catálogo.`,
      stuckHeading: 'Onde a turma travou',
      stuckCount: (n: number): string => `${String(n)} ${plural(n, 'aluno', 'alunos')}`,
      stuckNote:
        'Travar é ter tentado e não ter cumprido — quem nem abriu a missão não conta aqui. É desta lista que sai o assunto da próxima aula.',
      studentByStudentHeading: 'Aluno a aluno',
      tableWho: 'quem',
      tableMet: 'cumpridas',
      tableStuckAt: 'travado em',
      tableLastSeen: 'última vez',
      never: 'nunca',
      footer:
        'O que aparece aqui é progresso de missão, avaliado no servidor a cada tentativa. As moléculas que a pessoa desenha fora das missões são trabalho dela e não entram nesta tela.',
    },

    // ---------------------------------------------------------- §6.2 — professor, a lista
    assignment: {
      metaTitle: 'Lista · Rotamer',
      metaDescription: 'Monte a sequência de missões da aula.',
      nameLabel: 'Nome da lista',
      namePlaceholder: 'Funções oxigenadas — 3ª série',
      draftStatus: (items: number): string =>
        `Rascunho · ${String(items)} ${plural(items, 'missão', 'missões')} · só você vê`,
      publishedStatus: (when: string, items: number, students: number): string =>
        `Publicado em ${when} · ${String(items)} ${plural(items, 'missão', 'missões')} · ${String(students)} ${plural(students, 'aluno na turma', 'alunos na turma')}`,
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
        `${String(items)} ${plural(items, 'missão', 'missões')}, nesta ordem. A partir daqui a turma vê a lista e os objetivos das suas missões ficam travados — mudar objetivo mudaria a nota de quem já tentou.`,
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
      /** Rótulo do grupo de abas de trilha — não há texto visível acima delas. */
      filterByTrackLabel: 'Filtrar por trilha',
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
      metaTitle: 'Criar missão · Rotamer',
      metaDescription: 'Desenhe a resposta — os objetivos saem dela.',
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
        `${String(goals)} ${plural(goals, 'objetivo', 'objetivos')} · ${String(hints)} ${plural(hints, 'dica', 'dicas')}`,
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
      metaTitle: 'Catálogo · Rotamer',
      metaDescription: 'Todas as missões que dá para resolver, com busca.',
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
      /** `3 alunos` ao lado de cada missão em que a turma travou. */
      stuckCount: (n: number): string => `${String(n)} ${plural(n, 'aluno', 'alunos')}`,
      /** Cabeçalho da primeira coluna da matriz — sem tradução própria, é só "quem". */
      tableWho: 'quem',
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
  },
  en: {
    classrooms: {
      codesLink: 'Password reset codes',
      codesHint:
        'A student who forgot their password swaps it for a code you issue and hand over in person.',

      notTeacherTitle: 'Do you teach, and want to open a class?',
      notTeacherBody:
        'Opening a class, building assignments and issuing password reset codes belong to a teacher account, and that role is given by whoever administers Rotamer at your school — never by declaring it yourself, because anyone who can issue a password reset code can get into a student account.',
      notTeacherHow:
        'Ask whoever administers Rotamer at your school, or whoever installed it, for the role, using the e-mail address of this account. It takes effect on the next page you open.',

      pageMetaTitle: 'Classes · Rotamer',
      pageMetaDescription: 'Open a class, join a class, and see where the class left off.',
      heading: 'Classes',
      intro:
        'The teacher opens the class and writes the code on the board; whoever is studying joins by typing that code. There is no e-mail invitation, for the same reason as the password reset: at many schools students have no inbox, and the ones who do do not open it in class.',

      teachingHeading: 'Classes you teach',
      teachingEmpty: 'No class open yet.',
      nameLabel: 'class name',
      namePlaceholder: 'Year 12A — morning',
      openButton: 'Open class',
      opening: 'Opening…',
      codeNote:
        'The code appears in the list. Write it on the board: it is what the student uses to join, no e-mail involved.',
      studentCount: (n: number): string => `${String(n)} ${plural(n, 'student', 'students')}`,
      created: (name: string, code: string): string => `Class "${name}" is open. The code is ${code}.`,

      attendingHeading: 'Classes you are in',
      attendingEmpty: 'You have not joined a class yet.',
      codeLabel: 'class code',
      codePlaceholder: 'XXXXXX',
      joinButton: 'Join the class',
      joining: 'Joining…',
      joined: (name: string): string => `You joined "${name}".`,
      alreadyJoined: (name: string): string => `You were already in "${name}".`,
      attendingNote:
        'Your teacher sees which missions you have completed and where you left off. What you draw outside the missions is yours, and nobody else sees it.',
    },

    staff: {
      heading: 'Teachers at this school',
      warning:
        'A teacher opens classes, builds assignments and issues password reset codes. Issuing a password reset code means being able to get into a student account. Only promote people you know.',
      ceiling:
        'Another administrator comes from the terminal only, from whoever looks after the installation. It is what keeps a single compromised account from taking this instance away from everyone.',
      emailLabel: 'e-mail address of the person who will teach',
      check: 'Check',
      checking: 'Checking…',
      confirm: (name: string): string => `Promote ${name} to teacher?`,
      promote: 'Promote to teacher',
      promoting: 'Promoting…',
      cancel: 'Cancel',
      promoted: (name: string): string =>
        `${name} is a teacher now. It takes effect on the next page they open.`,
      demote: 'Demote',
      demoteConfirm: (name: string, email: string): string =>
        `Take the teacher role away from ${name} (${email})?`,
      demoteBody:
        'They stop opening classes, building assignments, seeing the board and issuing password reset codes, and the missions they published leave the catalog. The classes and assignments stay stored, and come back if they are promoted again.',
      demoted: (name: string): string => `${name} is a student account again.`,
      administratorChip: 'administers',
      grantedByTerminal: 'role given from the terminal',
      grantedBy: (name: string, when: string): string => `promoted by ${name} on ${when}`,

      unavailable: 'Not available in this environment.',
      malformed: 'Malformed request.',
      notAdministrator: 'Only an administrator account changes anyone else’s role.',
      notFound:
        'I could not find that account at your school. Check the e-mail address with the person who will teach.',
      notYourself:
        'Your own role is not changed here. Whoever looks after the installation changes it from the terminal.',
      alreadyTeaching: 'That account already teaches at this school.',
      notTeaching: 'That account does not teach at this school.',
      notAnotherAdministrator:
        'An administrator does not demote an administrator. Whoever looks after the installation does that from the terminal.',
      tooManyLookups: 'Too many lookups in too little time. Wait a moment and try again.',
      changedMeanwhile: 'That account’s role changed while you were confirming. Check again.',
    },

    classroomSection: {
      heading: 'Assignments for this class',
      newButton: 'New assignment',
      emptyTitle: 'No assignments yet.',
      emptyBody:
        'An assignment is the sequence of missions for one lesson. You pick from the catalog, create your own by drawing the answer, or mix the two.',
      footer: 'Students only see an assignment once it is published. A draft is yours.',
      draftChip: 'draft · only you see it',
      publishedChip: 'published',
      itemCount: (n: number): string => `${String(n)} ${plural(n, 'mission', 'missions')}`,
      namePlaceholder: 'Oxygen-containing groups — year 12',
      newNameAriaLabel: 'New assignment name',
      archivedHeading: (n: number): string => `Archived assignments (${String(n)})`,
      unarchive: 'Unarchive',
    },

    classroomSummary: {
      metaTitle: 'Class · Rotamer',
      metaDescription: 'Where the class left off.',
      summary: (students: number, quests: number): string =>
        `${String(students)} ${plural(students, 'student', 'students')}, out of ${String(quests)} ${plural(quests, 'mission', 'missions')} in the catalog.`,
      stuckHeading: 'Where the class got stuck',
      stuckCount: (n: number): string => `${String(n)} ${plural(n, 'student', 'students')}`,
      stuckNote:
        'Getting stuck means having tried and not completed the mission — anyone who never opened it is not counted here. This is where the next lesson starts.',
      studentByStudentHeading: 'Student by student',
      tableWho: 'who',
      tableMet: 'completed',
      tableStuckAt: 'stuck on',
      tableLastSeen: 'last seen',
      never: 'never',
      footer:
        'What appears here is mission progress, assessed on the server at every attempt. The molecules the person draws outside missions are their own work and do not enter this screen.',
    },

    assignment: {
      metaTitle: 'Assignment · Rotamer',
      metaDescription: 'Build the sequence of missions for the lesson.',
      nameLabel: 'Assignment name',
      namePlaceholder: 'Oxygen-containing groups — year 12',
      draftStatus: (items: number): string =>
        `Draft · ${String(items)} ${plural(items, 'mission', 'missions')} · only you see it`,
      publishedStatus: (when: string, items: number, students: number): string =>
        `Published on ${when} · ${String(items)} ${plural(items, 'mission', 'missions')} · ${String(students)} ${plural(students, 'student in the class', 'students in the class')}`,
      originCatalog: 'catalog',
      originTeacher: 'your mission',
      up: 'Move up',
      upWithKey: (title: string, position: number): string =>
        `Move «${title}» up to position ${String(position)}`,
      down: 'Move down',
      downWithKey: (title: string, position: number): string =>
        `Move «${title}» down to position ${String(position)}`,
      remove: 'Remove',
      removed: (title: string): string => `«${title}» left the assignment.`,
      undo: 'Undo',
      undoMoveFailed: (title: string): string =>
        `«${title}» is back in the assignment, but I could not return it to its earlier position. Move it up with ↑.`,
      pickFromCatalog: 'Pick from the catalog',
      createByDrawing: 'Create a mission by drawing',
      publish: 'Publish to the class',
      archive: 'Archive assignment',
      unarchive: 'Unarchive assignment',
      emptyTitle: 'This assignment has no missions yet.',
      emptyBody: 'Pick from the catalog, or draw the answer and create your own.',
      entered: (title: string, position: number): string =>
        `«${title}» joined the assignment, at position ${String(position)}.`,
      publishToCatalog: 'Publish to the catalog',
      withdrawFromCatalog: 'Withdraw from the catalog',
      onCatalog: 'in the catalog',
      archivedNotice:
        'This assignment has been archived. It disappears from both screens until you unarchive it.',
      editQuest: 'Edit the text',
      archiveQuest: 'Archive mission',
      unarchiveQuest: 'Unarchive mission',
    },

    editQuestPopover: {
      title: 'Edit «{titulo}»',
      body: 'Title, brief and hints. The goals do not change — they came out of the molecule you drew, and changing them would change the score of anyone who has already tried.',
      save: 'Save',
      cancel: 'Cancel',
      saved: 'Text updated.',
      archived: (title: string): string =>
        `«${title}» has been archived. It leaves the mission picker and the catalog; assignments already using it keep working.`,
      unarchived: (title: string): string => `«${title}» is back in the mission picker.`,
    },

    publishPopover: {
      title: (classroomName: string): string => `Publish to ${classroomName}?`,
      body: (items: number): string =>
        `${String(items)} ${plural(items, 'mission', 'missions')}, in this order. From here on the class sees the assignment and the goals of your missions are locked — changing a goal would change the score of anyone who has already tried.`,
      confirm: 'Publish',
      cancel: 'Cancel',
      afterPublish:
        'Published. Title, brief and hints stay editable; goals do not. To ask for something else, duplicate the mission.',
    },

    cancelAuthoringPopover: {
      title: 'Leave without creating the mission?',
      body: 'The drawing will not be kept.',
      confirm: 'Leave',
      cancel: 'Keep drawing',
    },

    catalogPicker: {
      label: 'Pick from the catalog',
      filterByTrackLabel: 'Filter by track',
      trackAll: 'All',
      trackStructure: 'Structure',
      trackGeometry: 'Geometry',
      trackProperty: 'Property',
      alreadyInList: 'already in the assignment',
      addButton: (n: number): string => `Add (${String(n)})`,
      cancel: 'Cancel',
      emptyFiltered: 'No mission on this track is outside the assignment.',
    },

    authoring: {
      metaTitle: 'Create a mission · Rotamer',
      metaDescription: 'Draw the answer — the goals come out of it.',
      topBarLabel: (assignmentTitle: string): string => `Creating a mission · ${assignmentTitle}`,
      save: 'Save mission',
      cancel: 'Cancel',
      tab: 'Authoring',
      structureHeading: 'The answer you drew',
      keptInside:
        'The answer molecule is kept inside the mission, not on your shelf. Students never receive it.',
      goalsHeading: 'Goals you can ask for',
      goalsCount: (marked: number, total: number): string =>
        `${String(marked)} of ${String(total)} goals ticked`,
      blockIdentity: 'the molecule',
      blockFormula: 'formula',
      blockGroups: 'functional groups',
      blockCounts: 'atoms and counts',
      inchiWarningHeadline: 'Ticked, this is the only goal of the mission.',
      inchiWarningBody:
        'The score becomes 0 or 100 and a close isomer is worth nothing. To accept more than one right answer, ask for groups and counts instead of this one.',
      disabledByExclusive: 'switched off while you ask for the exact molecule',
      rotatableNote:
        'Rotatable bonds in RDKit’s strict definition. PubChem counts them another way, and each is right within its own definition.',
      closing:
        'This list came out of the molecule you drew. There is no way to add a goal by writing one — what the student has to meet is always what RDKit measured here.',
      titleLabel: 'Mission title',
      briefLabel: 'Brief',
      briefHelp: 'Talk chemistry, not interface: the student reads this before drawing.',
      briefStudentsWarning:
        'The brief is read by the whole class. Do not write any student’s name in it.',
      hintsLabel: 'Hints (up to 3)',
      hintsHelp:
        'One at a time, in order. The student only sees a hint on asking — a hint given before the attempt does not teach.',
      addHint: 'Add a hint',
      removeHint: 'Remove hint',
      footerCount: (goals: number, hints: number): string =>
        `${String(goals)} ${plural(goals, 'goal', 'goals')} · ${String(hints)} ${plural(hints, 'hint', 'hints')}`,
      nothingDrawn: 'Draw the answer. The goals you can ask for come out of it.',
      noGoalMarked: 'Tick at least one goal.',
      emptyTitleOrBrief:
        'The mission needs a title and a brief. The student reads this before drawing.',
    },

    studentAssignments: {
      heading: 'FROM YOUR CLASS',
      progress: (met: number, total: number): string => `${String(met)} of ${String(total)} completed`,
      byTeacherLabel: 'mission from your teacher',
      metJustNow: (remaining: number): string =>
        `Completed. ${remaining === 0 ? '' : `${String(remaining)} left in the assignment.`}`,
      nextItem: (title: string): string => `Next: ${title} →`,
      listClosed: (assignmentTitle: string): string =>
        `Completed. You finished the assignment «${assignmentTitle}».`,
      catalogFreedom:
        'The catalog is open: you can explore on your own, even outside the assignment.',
      inProgressOption: (title: string): string => `From your class · ${title}`,
      checkingWithServer: 'checking…',
    },

    catalog: {
      metaTitle: 'Catalog · Rotamer',
      metaDescription: 'Every mission there is to solve, with search.',
      pageTitle: 'Catalog',
      searchLabel: 'Search for a mission',
      searchPlaceholder: 'Search by name, track or functional group — «ester», «ring»…',
      empty: 'No mission found.',
      linkFromMenu: 'Catalog',
      byTeacher: (name: string, institution: string | null): string =>
        institution === null ? `mission by ${name}` : `mission by ${name} · ${institution}`,
      report: 'Report',
      reportPlaceholder: 'In one line: what is wrong with this mission?',
      reportSend: 'Send report',
      reportCancel: 'Cancel',
      reportReceived: 'Received.',
    },

    board: {
      stuckHeading: 'WHERE THE CLASS GOT STUCK ON THIS ASSIGNMENT',
      stuckNote:
        'Getting stuck means having tried and not completed it — anyone who never opened it is not counted here.',
      stuckCount: (n: number): string => `${String(n)} ${plural(n, 'student', 'students')}`,
      tableWho: 'who',
      legend: '✓ completed · • stuck (opened, not completed) · – not opened',
      metLabel: (name: string, position: number): string =>
        `${name}, item ${String(position)}: completed`,
      stuckLabel: (name: string, position: number): string =>
        `${name}, item ${String(position)}: stuck`,
      untouchedLabel: (name: string, position: number): string =>
        `${name}, item ${String(position)}: not opened`,
      metCountHeading: 'completed',
      footer:
        'What appears here is mission progress, assessed on the server at every attempt. The molecules the student drew do not enter this screen.',
      emptyOpened: 'Nobody has opened a mission from this assignment yet.',
    },

    empty: {
      noStudents: 'Nobody has joined yet. Write the code on the board.',
      studentNoPublished:
        'Your teacher has not published an assignment yet. In the meantime, the catalog below is all yours.',
      studentNoClassroom:
        'You are not in a class yet. With the code your teacher gives out, the lesson’s assignment appears here.',
      studentJoinLink: 'Join a class',
    },

    errors: {
      structureCantClose:
        'Until the structure is valid, there is no goal to extract. Fix the drawing and the list comes back on its own.',
      nothingDrawn: 'Draw the answer. The goals you can ask for come out of it.',
      noGoalMarked:
        'Tick at least one goal. With no goal, the mission could not be completed — nor gotten wrong.',
      emptyTitleOrBrief:
        'The mission needs a title and a brief. The student reads this before drawing.',
      slugRepeated: (title: string): string =>
        `«${title}» is already in this assignment. The same mission twice would count the progress twice.`,
      publishEmpty: 'An empty assignment cannot be published. Add at least one mission.',
      editAfterPublish:
        'This assignment has already been published: title, brief and hints stay editable, the goals do not. Changing a goal would change the score of anyone who has already tried. To ask for something else, duplicate the mission.',
      questNotFound: 'That mission does not exist.',
      anonymousTeacherQuest: 'A class mission needs an account.',
      enterAccount: 'Sign in to your account',
      linkRejected:
        'The brief does not take links — write the address on the board or in the school material.',
    },

    a11y: {
      goalsList: 'Goals you can ask for',
    },
  },
});
