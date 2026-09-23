import { dictionary } from '@rotamer/i18n';

/**
 * O texto de entrar e criar conta — a porta de conta do produto.
 *
 * A conta é opcional (o editor funciona sem ela); o texto desta tela é o que
 * explica isso antes de pedir e-mail e senha de qualquer pessoa.
 */
export const accountMessages = dictionary({
  'pt-BR': {
    metaTitle: 'Entrar · Rotamer',
    metaDescription: 'Conta para guardar o progresso nas missões. O editor funciona sem ela.',
    intro:
      'A conta guarda o progresso das missões e as moléculas que você salvar. Para desenhar, calcular descritores e ver a forma no espaço, ela não é necessária.',
    /** A frase atravessa o link para `/escolas`, por isso vem em três partes. */
    schoolNoteBefore: 'É professor e quer entender o que dá para fazer em aula?',
    schoolNoteLink: 'A página para escolas',
    schoolNoteAfter: 'conta o que o produto faz — e o que ele não faz.',

    signIn: {
      cardTitle: 'entrar',
      email: 'e-mail',
      password: 'senha',
      submitting: 'Entrando…',
      submit: 'Entrar',
      forgot: 'Esqueceu a senha?',
      forgotLink: 'Trocar com o código do professor',
    },

    signUp: {
      cardTitle: 'criar conta',
      displayName: 'como quer ser chamado',
      email: 'e-mail',
      password: 'senha',
      institution: 'escola ou instituição',
      institutionHint: 'Opcional. Serve para acompanhar a turma depois.',
      submitting: 'Criando…',
      submit: 'Criar conta',
    },
  },

  en: {
    metaTitle: 'Sign in · Rotamer',
    metaDescription: 'An account to keep your progress on missions. The editor works without one.',
    intro:
      'The account keeps your progress on missions and the molecules you save. Drawing, computing descriptors and seeing the shape in space do not need it.',
    schoolNoteBefore: 'Do you teach, and want to understand what you can do in class?',
    schoolNoteLink: 'The page for schools',
    schoolNoteAfter: 'covers what the product does — and what it does not.',

    signIn: {
      cardTitle: 'sign in',
      email: 'e-mail',
      password: 'password',
      submitting: 'Signing in…',
      submit: 'Sign in',
      forgot: 'Forgot your password?',
      forgotLink: 'Reset it with your teacher’s code',
    },

    signUp: {
      cardTitle: 'sign up',
      displayName: 'what should we call you',
      email: 'e-mail',
      password: 'password',
      institution: 'school or institution',
      institutionHint: 'Optional. Used to keep track of the class later.',
      submitting: 'Signing up…',
      submit: 'Sign up',
    },
  },
});
