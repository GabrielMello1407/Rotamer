import { dictionary } from '@rotamer/i18n';

/**
 * O texto de trocar a senha sem e-mail (D-19).
 *
 * Quem esqueceu a senha pede um código ao professor e troca aqui — não existe
 * link de recuperação por e-mail, e o texto desta tela é o que explica isso em
 * vez de deixar a pessoa esperando uma mensagem que nunca chega.
 */
export const passwordMessages = dictionary({
  'pt-BR': {
    metaTitle: 'Trocar a senha · Rotamer',
    metaDescription: 'Troque a senha com o código que o professor entregou.',
    heading: 'Trocar a senha',
    intro:
      'Peça um código ao professor da turma. Ele vale por um dia e serve uma vez só — não há e-mail no caminho, então nada precisa chegar na sua caixa de entrada.',
    /** A frase atravessa o link para `/entrar`, por isso vem em duas partes. */
    rememberedBefore: 'Lembrou a senha?',
    rememberedLink: 'Entrar',

    done: 'Senha trocada. As sessões antigas foram encerradas.',
    signInWithNew: 'Entrar com a senha nova',
    email: 'e-mail da conta',
    code: 'código do professor',
    newPassword: 'senha nova',
    submitting: 'Trocando…',
    submit: 'Trocar a senha',
  },

  en: {
    metaTitle: 'Reset your password · Rotamer',
    metaDescription: 'Reset your password with the code your teacher handed out.',
    heading: 'Reset your password',
    intro:
      'Ask your teacher for a code. It is valid for one day and works once — there is no e-mail in the path, so nothing needs to reach your inbox.',
    rememberedBefore: 'Remembered your password?',
    rememberedLink: 'Sign in',

    done: 'Password changed. The old sessions were ended.',
    signInWithNew: 'Sign in with the new password',
    email: 'account e-mail',
    code: 'teacher’s code',
    newPassword: 'new password',
    submitting: 'Changing…',
    submit: 'Reset the password',
  },
});
