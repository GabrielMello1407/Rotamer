import { dictionary } from '@rotamer/i18n';

/**
 * As frases de recusa das server actions — chaves em inglês, texto nos dois
 * idiomas (`docs/IDIOMAS.md`, D-30). Cada action lê o seu dicionário com
 * `pick(dicionario, await currentLocale())` e devolve a frase pronta: quem
 * recebe `{ status: 'rejected', reason }` recebe texto, nunca código.
 *
 * `sharedMessages` é para a frase que se repete ao pé da letra em mais de uma
 * action (o "Pedido mal formado." de um schema que falhou, o "Indisponível
 * neste ambiente." de uma ação sem banco). Onde o texto original já era
 * específico de uma action — "Guardar não está disponível aqui.", "Tentativa
 * mal formada." — ele continua específico aqui, um dicionário por action.
 *
 * O que já vinha de `../turmas/messages` (as recusas de `staff.ts` e boa parte
 * das de `assignment.ts`) não é repetido aqui: aquele arquivo já está pronto
 * nos dois idiomas, e é lido com `pick(messages, await currentLocale())`
 * direto na action.
 */

export const sharedMessages = dictionary({
  'pt-BR': {
    malformed: 'Pedido mal formado.',
    unavailable: 'Indisponível neste ambiente.',
    invalidEmail: 'Esse e-mail não parece válido.',
    passwordMinLength: 'A senha precisa de pelo menos 8 caracteres.',
    signInFirst: 'Entre na sua conta primeiro.',
  },
  en: {
    malformed: 'Malformed request.',
    unavailable: 'Not available in this environment.',
    invalidEmail: 'That e-mail doesn’t look valid.',
    passwordMinLength: 'The password needs at least 8 characters.',
    signInFirst: 'Sign in to your account first.',
  },
});

export const accountMessages = dictionary({
  'pt-BR': {
    nameRequired: 'Diga como você quer ser chamado.',
    institutionTooLong: 'Nome de instituição muito longo.',
    passwordRequired: 'Digite a senha.',
    genericInvalid: 'Confira os dados e tente de novo.',
    emailTaken: 'Já existe uma conta com esse e-mail.',
    wrongCredentials: 'E-mail ou senha não conferem.',
  },
  en: {
    nameRequired: 'Say what you want to be called.',
    institutionTooLong: 'Institution name is too long.',
    passwordRequired: 'Type the password.',
    genericInvalid: 'Check the details and try again.',
    emailTaken: 'There is already an account with that e-mail.',
    wrongCredentials: 'E-mail or password doesn’t match.',
  },
});

export const attemptMessages = dictionary({
  'pt-BR': {
    malformed: 'Tentativa mal formada.',
  },
  en: {
    malformed: 'Malformed attempt.',
  },
});

export const classroomMessages = dictionary({
  'pt-BR': {
    nameRequired: 'Dê um nome à turma.',
    nameTooLong: 'Nome de turma muito longo.',
    codeRequired: 'Digite o código da turma.',
    onlyTeacherOpensClass: 'Só conta de professor abre turma. Fale com quem administra o Rotamer da escola.',
    codeGenerationFailed: 'Não consegui gerar um código agora. Tente de novo.',
    tooManyWrongCodes: 'Muitos códigos errados em pouco tempo. Espere um pouco e tente de novo.',
    codeNotFound: 'Esse código não abre nenhuma turma. Confira com o professor.',
    ownClassroom: 'Esta turma é sua — você já a vê na lista.',
  },
  en: {
    nameRequired: 'Give the class a name.',
    nameTooLong: 'Class name is too long.',
    codeRequired: 'Type the class code.',
    onlyTeacherOpensClass: 'Only a teacher account opens a class. Talk to whoever administers Rotamer at your school.',
    codeGenerationFailed: 'I could not generate a code right now. Try again.',
    tooManyWrongCodes: 'Too many wrong codes in too little time. Wait a moment and try again.',
    codeNotFound: 'That code doesn’t open any class. Check it with your teacher.',
    ownClassroom: 'This class is yours — you already see it in the list.',
  },
});

export const libraryMessages = dictionary({
  'pt-BR': {
    unavailable: 'Guardar não está disponível aqui.',
  },
  en: {
    unavailable: 'Saving isn’t available here.',
  },
});

export const namingMessages = dictionary({
  'pt-BR': {
    unavailable: 'Batismo indisponível neste ambiente.',
    invalidNickname: 'Apelido inválido.',
    saveFailed: 'Não foi possível registrar o apelido.',
  },
  en: {
    unavailable: 'Naming isn’t available in this environment.',
    invalidNickname: 'Invalid nickname.',
    saveFailed: 'It wasn’t possible to register the nickname.',
  },
});

export const recoveryMessages = dictionary({
  'pt-BR': {
    codeRequired: 'Digite o código que o professor entregou.',
    onlyTeacherIssuesCode: 'Só conta de professor emite código. Fale com quem administra o Rotamer da escola.',
    noInstitution: 'Sua conta está sem escola preenchida, e o código só vale para alguém da mesma escola.',
    accountNotFound: 'Não encontrei essa conta na sua escola. Confira o e-mail com quem vai usar o código.',
    codeMismatch: 'Código não confere, ou já foi usado. Peça outro ao professor.',
  },
  en: {
    codeRequired: 'Type the code your teacher gave you.',
    onlyTeacherIssuesCode: 'Only a teacher account issues a code. Talk to whoever administers Rotamer at your school.',
    noInstitution: 'Your account has no school on file, and the code only works for someone at the same school.',
    accountNotFound: 'I could not find that account at your school. Check the e-mail with whoever will use the code.',
    codeMismatch: 'That code doesn’t match, or was already used. Ask your teacher for another one.',
  },
});

export const searchMessages = dictionary({
  'pt-BR': {
    tooShort: 'Digite ao menos duas letras.',
    unreadableStructure: 'O PubChem devolveu uma estrutura que não sei ler.',
  },
  en: {
    tooShort: 'Type at least two letters.',
    unreadableStructure: 'PubChem returned a structure I can’t read.',
  },
});

export const assignmentMessages = dictionary({
  'pt-BR': {
    onlyTeacherBuildsAssignment: 'Só conta de professor monta lista.',
    notYourClassroom: 'Essa turma não é sua.',
    assignmentLimitPerClassroom: (max: number): string =>
      `Você chegou ao limite de ${String(max)} listas nesta turma.`,
    onlyTeacherEditsAssignment: 'Só conta de professor edita lista.',
    notYourAssignment: 'Essa lista não é sua.',
    onlyTeacherCreatesQuest: 'Só conta de professor cria missão.',
    titleTooLong: (max: number): string => `O título passa de ${String(max)} caracteres.`,
    briefTooLong: (max: number): string => `O enunciado passa de ${String(max)} caracteres.`,
    hintEmpty: 'A dica não pode ficar vazia.',
    hintTooLong: (max: number): string => `A dica passa de ${String(max)} caracteres.`,
    controlCharacter:
      'O texto tem um caractere de controle que a tela não escreve. Tente de novo sem ele.',
    answerTooLarge: 'A resposta é grande demais para uma missão de aula.',
    answerTooManyAtoms: (count: number, max: number): string =>
      `A resposta tem ${String(count)} átomos. Uma missão de aula cabe em até ${String(max)} — a geometria acima disso não roda no celular do aluno.`,
    authoringDailyLimit: 'Você chegou ao limite de salvamentos de hoje. Volte amanhã.',
    activeQuestLimit: (max: number): string =>
      `Você chegou ao limite de ${String(max)} missões próprias. Arquive as que não usa mais — arquivar não apaga, e as listas que já as usam continuam funcionando.`,
    itemsPerAssignmentLimit: (max: number): string =>
      `Esta lista já tem ${String(max)} missões — o máximo para uma lista.`,
    onlyTeacherEditsQuest: 'Só conta de professor edita missão.',
    notYourQuest: 'Essa missão não é sua.',
    onlyTeacherArchivesQuest: 'Só conta de professor arquiva missão.',
    onlyTeacherUnarchivesQuest: 'Só conta de professor desarquiva missão.',
    activeQuestLimitToUnarchive: (max: number): string =>
      `Você chegou ao limite de ${String(max)} missões próprias. Arquive alguma antes de desarquivar esta.`,
    itemNotFound: 'Esse item não existe mais nesta lista.',
    onlyTeacherPublishesAssignment: 'Só conta de professor publica lista.',
    onlyTeacherArchivesAssignment: 'Só conta de professor arquiva lista.',
    onlyTeacherUnarchivesAssignment: 'Só conta de professor desarquiva lista.',
    assignmentLimitToUnarchive: (max: number): string =>
      `Você chegou ao limite de ${String(max)} listas nesta turma. Arquive alguma antes de desarquivar esta.`,
    tooManyQuestChecks: 'Muitas conferências em pouco tempo. Espere um pouco e tente de novo.',
    onlyTeacherPublishesToCatalog: 'Só conta de professor publica no catálogo.',
    archivedQuestCannotPublish: 'Missão arquivada não entra no catálogo. Desarquive antes de publicar.',
    institutionRequiredToPublish:
      'Preencha a instituição no seu perfil antes de publicar no catálogo — a autoria viaja sempre junto (D-27).',
    onlyTeacherWithdrawsFromCatalog: 'Só conta de professor retira do catálogo.',
    signInToReport: 'Entre na sua conta para denunciar uma missão.',
    reportReasonEmpty: 'Escreva o motivo da denúncia.',
    reportReasonTooLong: (max: number): string => `O motivo passa de ${String(max)} caracteres.`,
    reportLimitPerDay: (max: number): string => `Você chegou ao limite de ${String(max)} denúncias hoje.`,
  },
  en: {
    onlyTeacherBuildsAssignment: 'Only a teacher account builds an assignment.',
    notYourClassroom: 'That class isn’t yours.',
    assignmentLimitPerClassroom: (max: number): string =>
      `You’ve reached the limit of ${String(max)} assignments in this class.`,
    onlyTeacherEditsAssignment: 'Only a teacher account edits an assignment.',
    notYourAssignment: 'That assignment isn’t yours.',
    onlyTeacherCreatesQuest: 'Only a teacher account creates a mission.',
    titleTooLong: (max: number): string => `The title is over ${String(max)} characters.`,
    briefTooLong: (max: number): string => `The brief is over ${String(max)} characters.`,
    hintEmpty: 'A hint can’t be empty.',
    hintTooLong: (max: number): string => `The hint is over ${String(max)} characters.`,
    controlCharacter: 'The text has a control character the screen can’t write. Try again without it.',
    answerTooLarge: 'The answer is too big for a class mission.',
    answerTooManyAtoms: (count: number, max: number): string =>
      `The answer has ${String(count)} atoms. A class mission fits up to ${String(max)} — geometry above that doesn’t run on a student’s phone.`,
    authoringDailyLimit: 'You’ve reached today’s save limit. Come back tomorrow.',
    activeQuestLimit: (max: number): string =>
      `You’ve reached the limit of ${String(max)} missions of your own. Archive the ones you no longer use — archiving doesn’t delete, and assignments already using them keep working.`,
    itemsPerAssignmentLimit: (max: number): string =>
      `This assignment already has ${String(max)} missions — the maximum for an assignment.`,
    onlyTeacherEditsQuest: 'Only a teacher account edits a mission.',
    notYourQuest: 'That mission isn’t yours.',
    onlyTeacherArchivesQuest: 'Only a teacher account archives a mission.',
    onlyTeacherUnarchivesQuest: 'Only a teacher account unarchives a mission.',
    activeQuestLimitToUnarchive: (max: number): string =>
      `You’ve reached the limit of ${String(max)} missions of your own. Archive one before unarchiving this one.`,
    itemNotFound: 'That item no longer exists in this assignment.',
    onlyTeacherPublishesAssignment: 'Only a teacher account publishes an assignment.',
    onlyTeacherArchivesAssignment: 'Only a teacher account archives an assignment.',
    onlyTeacherUnarchivesAssignment: 'Only a teacher account unarchives an assignment.',
    assignmentLimitToUnarchive: (max: number): string =>
      `You’ve reached the limit of ${String(max)} assignments in this class. Archive one before unarchiving this one.`,
    tooManyQuestChecks: 'Too many checks in too little time. Wait a moment and try again.',
    onlyTeacherPublishesToCatalog: 'Only a teacher account publishes to the catalog.',
    archivedQuestCannotPublish: 'An archived mission doesn’t enter the catalog. Unarchive it before publishing.',
    institutionRequiredToPublish:
      'Fill in the institution on your profile before publishing to the catalog — authorship always travels along (D-27).',
    onlyTeacherWithdrawsFromCatalog: 'Only a teacher account withdraws from the catalog.',
    signInToReport: 'Sign in to your account to report a mission.',
    reportReasonEmpty: 'Write the reason for the report.',
    reportReasonTooLong: (max: number): string => `The reason is over ${String(max)} characters.`,
    reportLimitPerDay: (max: number): string => `You’ve reached the limit of ${String(max)} reports today.`,
  },
});
