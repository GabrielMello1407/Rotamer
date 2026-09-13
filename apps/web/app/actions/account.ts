'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { endSession, hashPassword, startSession, verifyPassword } from '../../lib/auth';
import { db } from '../../lib/db';

/**
 * Entrar, criar conta, sair.
 *
 * Mensagem de erro em português e sem entregar informação demais: "e-mail ou
 * senha não conferem" vale para os dois casos, senão a tela vira um jeito de
 * descobrir quais e-mails existem.
 */

export interface AccountState {
  readonly error: string | null;
}

const email = z.string().trim().toLowerCase().email('Esse e-mail não parece válido.');
const password = z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.');

const signUpSchema = z.object({
  displayName: z.string().trim().min(2, 'Diga como você quer ser chamado.'),
  email,
  password,
  institution: z
    .string()
    .trim()
    .max(120, 'Nome de instituição muito longo.')
    .optional()
    .transform((value) => (value === undefined || value === '' ? null : value)),
});

const signInSchema = z.object({ email, password: z.string().min(1, 'Digite a senha.') });

function firstError(issues: readonly z.core.$ZodIssue[]): string {
  return issues[0]?.message ?? 'Confira os dados e tente de novo.';
}

export async function signUp(_state: AccountState, form: FormData): Promise<AccountState> {
  const parsed = signUpSchema.safeParse({
    displayName: form.get('displayName'),
    email: form.get('email'),
    password: form.get('password'),
    institution: form.get('institution'),
  });

  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const taken = await db.profile.findUnique({ where: { email: parsed.data.email } });
  if (taken) return { error: 'Já existe uma conta com esse e-mail.' };

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
  const parsed = signInSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  });

  if (!parsed.success) return { error: firstError(parsed.error.issues) };

  const profile = await db.profile.findUnique({ where: { email: parsed.data.email } });
  if (!profile || !(await verifyPassword(parsed.data.password, profile.passwordHash))) {
    return { error: 'E-mail ou senha não conferem.' };
  }

  await startSession(profile.id);
  redirect('/');
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect('/');
}
