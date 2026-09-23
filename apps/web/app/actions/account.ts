'use server';

import { pick, type Locale } from '@rotamer/i18n';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { endSession, hashPassword, startSession, verifyPassword } from '../../lib/auth';
import { db } from '../../lib/db';
import { currentLocale } from '../../lib/locale';
import { accountMessages, sharedMessages } from './messages';

/**
 * Entrar, criar conta, sair.
 *
 * Mensagem de erro sem entregar informação demais: "e-mail ou senha não
 * conferem" vale para os dois casos, senão a tela vira um jeito de descobrir
 * quais e-mails existem. E ela sai no idioma de quem está tentando entrar — o
 * schema é montado por pedido, porque é a mensagem dele que a tela mostra.
 */

export interface AccountState {
  readonly error: string | null;
}

/**
 * Os schemas, montados no idioma do pedido.
 *
 * A mensagem de um `z.string().email(...)` é o texto que a tela mostra, então
 * ela não pode ser fixada na carga do módulo — ali ainda não existe pedido, e
 * sem pedido não há cookie de idioma.
 */
function schemasFor(locale: Locale) {
  const m = pick(accountMessages, locale);
  const shared = pick(sharedMessages, locale);

  const email = z.string().trim().toLowerCase().email(shared.invalidEmail);
  const password = z.string().min(8, shared.passwordMinLength);

  return {
    m,
    signUp: z.object({
      displayName: z.string().trim().min(2, m.nameRequired),
      email,
      password,
      institution: z
        .string()
        .trim()
        .max(120, m.institutionTooLong)
        .optional()
        .transform((value) => (value === undefined || value === '' ? null : value)),
    }),
    signIn: z.object({ email, password: z.string().min(1, m.passwordRequired) }),
  };
}

function firstError(issues: readonly z.core.$ZodIssue[], fallback: string): string {
  return issues[0]?.message ?? fallback;
}

export async function signUp(_state: AccountState, form: FormData): Promise<AccountState> {
  const { m, signUp: signUpSchema } = schemasFor(await currentLocale());

  const parsed = signUpSchema.safeParse({
    displayName: form.get('displayName'),
    email: form.get('email'),
    password: form.get('password'),
    institution: form.get('institution'),
  });

  if (!parsed.success) return { error: firstError(parsed.error.issues, m.genericInvalid) };

  const taken = await db.profile.findUnique({ where: { email: parsed.data.email } });
  if (taken) return { error: m.emailTaken };

  const profile = await db.profile.create({
    data: {
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      institution: parsed.data.institution,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  await startSession(profile.id);
  redirect('/');
}

export async function signIn(_state: AccountState, form: FormData): Promise<AccountState> {
  const { m, signIn: signInSchema } = schemasFor(await currentLocale());

  const parsed = signInSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  });

  if (!parsed.success) return { error: firstError(parsed.error.issues, m.genericInvalid) };

  const profile = await db.profile.findUnique({ where: { email: parsed.data.email } });
  if (!profile || !(await verifyPassword(parsed.data.password, profile.passwordHash))) {
    return { error: m.wrongCredentials };
  }

  await startSession(profile.id);
  redirect('/');
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect('/');
}
