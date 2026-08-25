import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from './db';

/**
 * Contas e sessão.
 *
 * O cookie carrega um token aleatório; no banco fica só o resumo dele. Se o
 * banco vazar, os cookies em circulação continuam inúteis — o mesmo cuidado que
 * se toma com senha, tomado com sessão.
 */

const COOKIE = 'rotamer_sessao';
const DAYS = 30;
const ROUNDS = 12;

export interface CurrentProfile {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly institution: string | null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function digest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Cria a sessão e devolve o token que vai para o cookie. */
export async function startSession(profileId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { id: digest(token), profileId, expiresAt },
  });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;

  if (token !== undefined) {
    await db.session.deleteMany({ where: { id: digest(token) } });
  }

  jar.delete(COOKIE);
}

/** Quem está usando o produto agora, ou `null` se ninguém entrou. */
export async function currentProfile(): Promise<CurrentProfile | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token === undefined) return null;

  const session = await db.session.findUnique({
    where: { id: digest(token) },
    include: { profile: true },
  });

  if (!session) return null;

  // Sessão vencida some do banco na primeira vez que alguém tenta usá-la.
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return {
    id: session.profile.id,
    email: session.profile.email,
    displayName: session.profile.displayName,
    institution: session.profile.institution,
  };
}
