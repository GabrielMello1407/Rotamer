'use server';

import { z } from 'zod';
import { currentProfile, hashPassword } from '../../lib/auth';
import { db, hasDatabase } from '../../lib/db';
import { TEACHING_ROLES, teaches } from '../../lib/roles';
import {
  CODE_HOURS,
  formatCode,
  generateCode,
  hashCode,
  normalizeCode,
  sameHash,
} from '../../lib/reset-code';

/**
 * Recuperar a senha sem e-mail.
 *
 * O professor emite um código, entrega em mãos, e o aluno troca a senha com ele.
 * Não há caixa de entrada no caminho: em escola pública muito aluno não tem
 * e-mail próprio, e quem tem não abre na aula (D-19).
 *
 * Três regras seguram o poder de emitir:
 *
 * 1. só quem dá aula emite — e ninguém se autodeclara: quem promove é
 *    `apps/web/scripts/promote-teacher.mjs`, rodado por quem tem acesso ao
 *    servidor, ou um administrador da mesma escola (D-29);
 * 2. só para conta da **mesma instituição**, que precisa estar preenchida nos
 *    dois lados;
 * 3. nunca para quem dá aula — **nem para quem já deu**. Senão o caminho vira
 *    escada para tomar a conta de quem emite: com o D-29 um administrador
 *    rebaixa um professor da escola dele, e sem essa terceira regra o passo
 *    seguinte seria emitir o código de senha da conta que ele acabou de
 *    rebaixar. Conta que já deu aula recupera a senha pelo terminal.
 *
 * O código vale uma vez e por um dia, e emitir de novo mata o anterior.
 */

const issueSchema = z.object({
  email: z.string().trim().toLowerCase().email('Esse e-mail não parece válido.'),
});

const resetSchema = z.object({
  email: z.string().trim().toLowerCase().email('Esse e-mail não parece válido.'),
  code: z.string().trim().min(1, 'Digite o código que o professor entregou.'),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.'),
});

export type IssueOutcome =
  | {
      readonly status: 'issued';
      readonly code: string;
      readonly forName: string;
      readonly expiresAt: string;
    }
  | { readonly status: 'rejected'; readonly reason: string };

export async function issueResetCode(input: { email: string }): Promise<IssueOutcome> {
  if (!hasDatabase()) return { status: 'rejected', reason: 'Indisponível neste ambiente.' };

  const parsed = issueSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? 'Pedido mal formado.' };
  }

  const issuer = await currentProfile();
  if (issuer === null) return { status: 'rejected', reason: 'Entre na sua conta primeiro.' };

  const issuerRow = await db.profile.findUnique({
    where: { id: issuer.id },
    select: { role: true, institution: true },
  });

  if (issuerRow === null || !teaches(issuerRow.role)) {
    return {
      status: 'rejected',
      reason: 'Só conta de professor emite código. Fale com quem administra o Rotamer da escola.',
    };
  }

  const institution = issuerRow.institution?.trim() ?? '';
  if (institution === '') {
    return {
      status: 'rejected',
      reason: 'Sua conta está sem escola preenchida, e o código só vale para alguém da mesma escola.',
    };
  }

  const target = await db.profile.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, displayName: true, role: true, institution: true },
  });

  /*
   * Conta que já deu aula não recebe código pela tela, mesmo depois de rebaixada.
   * Sem isto, rebaixar (D-29) seria o primeiro passo de uma tomada de conta:
   * tirar o papel de um professor e, com ele fora de "quem dá aula", emitir o
   * código de senha dele. Uma linha de `RoleChange` saindo de um papel de aula é
   * a marca disso, e ela nunca é apagada.
   */
  const taught =
    target !== null &&
    (await db.roleChange.count({
      where: { profileId: target.id, fromRole: { in: [...TEACHING_ROLES] } },
    })) > 0;

  // A mesma resposta para "não existe", "é de outra escola" e "já deu aula": a
  // tela de emissão não pode virar um jeito de descobrir quem tem conta no
  // produto, nem quem já foi professor nela.
  const eligible =
    target !== null &&
    !teaches(target.role) &&
    !taught &&
    (target.institution?.trim() ?? '') === institution;

  if (!eligible) {
    return {
      status: 'rejected',
      reason: 'Não encontrei essa conta na sua escola. Confira o e-mail com quem vai usar o código.',
    };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_HOURS * 60 * 60 * 1000);

  // Emitir de novo mata o anterior: dois códigos vivos para a mesma conta é uma
  // porta a mais aberta, e ninguém lembra qual papel é o válido.
  await db.resetCode.deleteMany({ where: { profileId: target.id, usedAt: null } });
  await db.resetCode.create({
    data: {
      codeHash: hashCode(code),
      profileId: target.id,
      issuedById: issuer.id,
      expiresAt,
    },
  });

  return {
    status: 'issued',
    code: formatCode(code),
    forName: target.displayName,
    expiresAt: expiresAt.toISOString(),
  };
}

export type ResetOutcome =
  | { readonly status: 'changed' }
  | { readonly status: 'rejected'; readonly reason: string };

/** Trocar a senha com o código na mão. */
export async function resetPassword(input: {
  email: string;
  code: string;
  password: string;
}): Promise<ResetOutcome> {
  if (!hasDatabase()) return { status: 'rejected', reason: 'Indisponível neste ambiente.' };

  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? 'Pedido mal formado.' };
  }

  const profile = await db.profile.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  const digest = hashCode(normalizeCode(parsed.data.code));

  const candidate =
    profile === null
      ? null
      : await db.resetCode.findFirst({
          where: { profileId: profile.id, usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        });

  // Mensagem única para código errado, código vencido, código já usado e e-mail
  // que não existe: separar os casos entregaria quais contas existem.
  if (profile === null || candidate === null || !sameHash(candidate.codeHash, digest)) {
    return {
      status: 'rejected',
      reason: 'Código não confere, ou já foi usado. Peça outro ao professor.',
    };
  }

  await db.$transaction([
    db.profile.update({
      where: { id: profile.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    db.resetCode.update({ where: { id: candidate.id }, data: { usedAt: new Date() } }),
    // Senha trocada derruba o que estava aberto: se alguém entrou com a senha
    // antiga, a sessão dele morre aqui.
    db.session.deleteMany({ where: { profileId: profile.id } }),
  ]);

  return { status: 'changed' };
}
