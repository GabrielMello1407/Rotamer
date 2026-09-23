import { dictionary } from '@rotamer/i18n';

/**
 * O texto da página de emitir código de senha — a ferramenta do professor
 * (D-19). Fica ao lado da tela porque as duas mudam juntas: `page.tsx` decide
 * quem vê o quê, `IssueCode.tsx` decide o formulário, e as frases de ambos
 * vivem aqui para não haver duas versões da mesma explicação.
 */
export const codesMessages = dictionary({
  'pt-BR': {
    metaTitle: 'Códigos de senha · Rotamer',
    metaDescription: 'Emitir código de troca de senha para alguém da turma.',
    heading: 'Códigos de senha',
    /**
     * A frase atravessa um `<code>/senha</code>` no meio — por isso vem em
     * duas partes, e não como modelo com marcador: o endereço de rota nunca
     * se traduz (D-30), só o texto ao redor dele.
     */
    introBefore: 'Quem esqueceu a senha troca em',
    introAfter:
      'com um código entregue em mãos. Não há e-mail no caminho — em muita escola o aluno não tem caixa de entrada própria, e a que tem não abre na aula.',
    noSchool:
      'Sua conta está sem escola preenchida, e o código só vale para alguém da mesma escola. Peça a quem administra o Rotamer da sua escola para preencher esse campo na sua conta.',
    noPermission:
      'Só conta de professor emite código. Se você dá aula e precisa disso, fale com quem administra o Rotamer da sua escola — a promoção é feita no servidor, de propósito.',
    note: 'O código vale por um dia, serve uma vez só e aparece uma vez só. Emitir um novo para a mesma pessoa invalida o anterior, e trocar a senha encerra as sessões abertas dela.',

    emailLabel: 'e-mail de quem perdeu a senha',
    issuing: 'Emitindo…',
    issue: 'Emitir código',
    codeOf: (name: string): string => `código de ${name}`,
    validUntil: (when: string): string =>
      `Vale até ${when} e serve uma vez só. Anote agora: esta é a única vez que ele aparece — no banco fica só o resumo dele.`,
  },

  en: {
    metaTitle: 'Password reset codes · Rotamer',
    metaDescription: 'Issue a password reset code for someone in the class.',
    heading: 'Password reset codes',
    introBefore: 'Anyone who forgot their password resets it at',
    introAfter:
      'with a code handed over in person. There is no e-mail in the path — at many schools the student has no inbox of their own, and the one they do have does not open in class.',
    noSchool:
      'Your account has no school on file, and the code only works for someone at the same school. Ask whoever administers Rotamer at your school to fill in that field on your account.',
    noPermission:
      'Only a teacher account issues a code. If you teach and need this, talk to whoever administers Rotamer at your school — the promotion happens on the server, on purpose.',
    note: 'The code is valid for one day, works once, and is shown once. Issuing a new one for the same person invalidates the previous one, and resetting the password ends that person’s open sessions.',

    emailLabel: 'e-mail address of the person who lost their password',
    issuing: 'Issuing…',
    issue: 'Issue code',
    codeOf: (name: string): string => `code for ${name}`,
    validUntil: (when: string): string =>
      `Valid until ${when}, and works once. Write it down now: this is the only time it appears — the database keeps only its digest.`,
  },
});
