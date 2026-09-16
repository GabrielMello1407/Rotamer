'use server';

import { z } from 'zod';
import { db, hasDatabase } from '../../lib/db';
import { requireAdministrator, teaches } from '../../lib/roles';
import { messages } from '../turmas/messages';

/**
 * Quem dá aula na escola — e quem dá esse papel.
 *
 * Até aqui o papel de professor só vinha do terminal (D-19). Mas quem instala o
 * Rotamer não é quem decide quem dá aula: a TI sobe a instância e sai, e a
 * coordenação fica sem como promover os professores. O D-29 delega **um** degrau
 * dessa decisão, e só um.
 *
 * As regras, todas conferidas aqui no servidor:
 *
 * 1. só conta `administrador` promove ou rebaixa;
 * 2. **só até `professor`**. Criar outro administrador continua sendo só do
 *    terminal — é o que impede uma conta invadida de se multiplicar e mantém a
 *    instância recuperável por quem tem a máquina;
 * 3. só conta da **mesma escola**, preenchida nos dois lados. Esta ação **nunca
 *    escreve a escola de ninguém**: se pudesse, um administrador puxaria uma
 *    conta qualquer para a escola dele e, daí, emitiria código de senha para ela;
 * 4. nunca rebaixa outro administrador;
 * 5. nunca muda o próprio papel, para a instância não perder o último
 *    administrador por um clique;
 * 6. toda mudança grava um `RoleChange`: quem, em quem, de qual papel para qual,
 *    quando. "Quem promoveu essa conta?" é a primeira pergunta da escola quando
 *    um código de senha vai para a pessoa errada;
 * 7. teto de consultas por hora nas **três** ações, porque perguntar por e-mail é
 *    o jeito de varrer quem tem conta — e a recusa de escrita não repete o nome
 *    de ninguém, para não virar a mesma varredura por outra porta;
 * 8. rebaixar **retira do catálogo** as missões daquela conta. Revogar o papel é a
 *    mitigação que o D-19 promete para conteúdo lido por menor de idade, e ela
 *    não valia nada enquanto o texto continuava público — e sem o papel a própria
 *    autora não conseguia mais retirá-lo.
 *
 * **O que este arquivo não resolve, e não finge resolver.** A escola é um texto
 * que a própria pessoa digita no cadastro; ninguém verifica. Numa instância com
 * mais de uma escola, um administrador alcança quem digitou o mesmo texto que
 * ele. O que segura isso é uma pessoa conferindo o nome e o e-mail antes de
 * confirmar, e o rastro dizendo quem confirmou.
 */

const STUDENT_ROLE = 'aluno';
const TEACHER_ROLE = 'professor';
const ADMINISTRATOR_ROLE = 'administrador';

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Esse e-mail não parece válido.'),
});

/**
 * Teto de consultas por administrador, em memória — o mesmo desenho do teto de
 * códigos errados (R-15). Perguntar por e-mail devolve se a conta existe naquela
 * escola; sem teto, a tela de promover é uma varredura de e-mails com resposta
 * confirmada. Vale nas três ações: a primeira versão contava só as consultas, e a
 * recusa de `demoteToStudent` respondia a mesma pergunta sem limite nenhum.
 *
 * Um `Map` no processo basta enquanto a instância roda um container só do app
 * (D-11) — se o app ganhar mais de um, isto precisa virar tabela.
 */
const LOOKUP_LIMIT = 30;
const LOOKUP_WINDOW_MS = 60 * 60 * 1000;
const lookups = new Map<string, number[]>();

function tooManyLookups(administratorId: string): boolean {
  const now = Date.now();
  const recent = (lookups.get(administratorId) ?? []).filter((at) => now - at < LOOKUP_WINDOW_MS);
  recent.push(now);
  lookups.set(administratorId, recent);

  return recent.length > LOOKUP_LIMIT;
}

export interface StaffMember {
  readonly id: string;
  readonly name: string;
  /**
   * Mostrado na tela, não escondido num atributo: duas pessoas de mesmo nome
   * deixariam duas linhas idênticas, e `Rebaixar` viraria um chute.
   */
  readonly email: string;
  /** Administrador aparece marcado: é quem promove, e a escola precisa saber quem são. */
  readonly administrator: boolean;
  /** Quem deu o papel, ou `null` quando foi pelo terminal. */
  readonly grantedBy: string | null;
  readonly grantedAt: string | null;
}

export type StaffOutcome =
  | {
      readonly status: 'ok';
      readonly institution: string;
      readonly staff: readonly StaffMember[];
    }
  | { readonly status: 'rejected'; readonly reason: string };

/** Quem dá aula na escola do administrador, com o rastro de quem deu o papel. */
export async function readSchoolStaff(): Promise<StaffOutcome> {
  if (!hasDatabase()) return { status: 'rejected', reason: messages.staff.unavailable };

  const administrator = await requireAdministrator();
  if (administrator === null) {
    return { status: 'rejected', reason: messages.staff.notAdministrator };
  }

  const rows = await db.profile.findMany({
    where: {
      institution: administrator.institution,
      role: { in: [TEACHER_ROLE, ADMINISTRATOR_ROLE] },
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
      roleChanges: {
        where: { toRole: { in: [TEACHER_ROLE, ADMINISTRATOR_ROLE] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, changedBy: { select: { displayName: true } } },
      },
    },
    orderBy: { displayName: 'asc' },
  });

  return {
    status: 'ok',
    institution: administrator.institution,
    staff: rows.map((row) => {
      const last = row.roleChanges[0];
      return {
        id: row.id,
        name: row.displayName,
        email: row.email,
        administrator: row.role === ADMINISTRATOR_ROLE,
        grantedBy: last?.changedBy?.displayName ?? null,
        grantedAt: last?.createdAt.toISOString() ?? null,
      };
    }),
  };
}

export type FoundOutcome =
  | {
      readonly status: 'found';
      readonly name: string;
      /** Já dá aula: a tela diz isso em vez de oferecer a promoção de novo. */
      readonly teaching: boolean;
    }
  | { readonly status: 'rejected'; readonly reason: string };

/**
 * O passo de conferência: quem é o dono deste e-mail.
 *
 * Existe porque o risco desta tela não é invasão, é dedo: promover `ana.silva@`
 * no lugar de `ana.silvia@` dá a alguém o poder de emitir código de senha.
 * Confirmar por nome transforma um erro de digitação em uma pergunta
 * respondível — e não faz mais do que isso: o nome também é digitado pela
 * própria pessoa no cadastro, então ele pega o dedo, não a má-fé.
 *
 * Só alcança conta da mesma escola, e é a mesma recusa de "não existe" para tudo
 * que não alcança.
 */
export async function findSchoolAccount(input: { email: string }): Promise<FoundOutcome> {
  if (!hasDatabase()) return { status: 'rejected', reason: messages.staff.unavailable };

  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'rejected',
      reason: parsed.error.issues[0]?.message ?? messages.staff.malformed,
    };
  }

  const administrator = await requireAdministrator();
  if (administrator === null) {
    return { status: 'rejected', reason: messages.staff.notAdministrator };
  }

  if (tooManyLookups(administrator.id)) {
    return { status: 'rejected', reason: messages.staff.tooManyLookups };
  }

  const target = await findInSchool(parsed.data.email, administrator.institution);
  if (target === null) return { status: 'rejected', reason: messages.staff.notFound };

  return { status: 'found', name: target.displayName, teaching: teaches(target.role) };
}

export type RoleOutcome =
  | { readonly status: 'changed'; readonly name: string }
  | { readonly status: 'rejected'; readonly reason: string };

/** Dar o papel de professor a uma conta da mesma escola. */
export async function promoteToTeacher(input: { email: string }): Promise<RoleOutcome> {
  if (!hasDatabase()) return { status: 'rejected', reason: messages.staff.unavailable };

  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'rejected',
      reason: parsed.error.issues[0]?.message ?? messages.staff.malformed,
    };
  }

  const administrator = await requireAdministrator();
  if (administrator === null) {
    return { status: 'rejected', reason: messages.staff.notAdministrator };
  }

  if (tooManyLookups(administrator.id)) {
    return { status: 'rejected', reason: messages.staff.tooManyLookups };
  }

  const target = await findInSchool(parsed.data.email, administrator.institution);
  if (target === null) return { status: 'rejected', reason: messages.staff.notFound };
  if (target.id === administrator.id) {
    return { status: 'rejected', reason: messages.staff.notYourself };
  }
  // Recusa sem nome: quem chegou aqui pela tela já viu o nome no passo de
  // conferência, que é contado no teto. Repeti-lo aqui abriria a mesma varredura
  // por uma porta sem contador.
  if (teaches(target.role)) {
    return { status: 'rejected', reason: messages.staff.alreadyTeaching };
  }

  const changed = await changeRole({
    profileId: target.id,
    changedById: administrator.id,
    fromRole: target.role,
    toRole: TEACHER_ROLE,
  });

  if (!changed) return { status: 'rejected', reason: messages.staff.changedMeanwhile };

  return { status: 'changed', name: target.displayName };
}

/**
 * Tirar o papel de professor de uma conta da mesma escola.
 *
 * Só professor: administrador não rebaixa administrador. Dois administradores
 * podendo se derrubar transformam uma discussão de escola em corrida de cliques,
 * e a instância pode acabar sem nenhum. Quem tem a máquina desfaz.
 */
export async function demoteToStudent(input: { email: string }): Promise<RoleOutcome> {
  if (!hasDatabase()) return { status: 'rejected', reason: messages.staff.unavailable };

  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'rejected',
      reason: parsed.error.issues[0]?.message ?? messages.staff.malformed,
    };
  }

  const administrator = await requireAdministrator();
  if (administrator === null) {
    return { status: 'rejected', reason: messages.staff.notAdministrator };
  }

  if (tooManyLookups(administrator.id)) {
    return { status: 'rejected', reason: messages.staff.tooManyLookups };
  }

  const target = await findInSchool(parsed.data.email, administrator.institution);
  if (target === null) return { status: 'rejected', reason: messages.staff.notFound };
  if (target.id === administrator.id) {
    return { status: 'rejected', reason: messages.staff.notYourself };
  }
  if (target.role === ADMINISTRATOR_ROLE) {
    return { status: 'rejected', reason: messages.staff.notAnotherAdministrator };
  }
  if (target.role !== TEACHER_ROLE) {
    return { status: 'rejected', reason: messages.staff.notTeaching };
  }

  const changed = await changeRole({
    profileId: target.id,
    changedById: administrator.id,
    fromRole: target.role,
    toRole: STUDENT_ROLE,
  });

  if (!changed) return { status: 'rejected', reason: messages.staff.changedMeanwhile };

  return { status: 'changed', name: target.displayName };
}

interface TargetProfile {
  readonly id: string;
  readonly displayName: string;
  readonly role: string;
}

/**
 * A conta, se ela for da escola deste administrador.
 *
 * Escola igual, e nada mais. A primeira versão também alcançava conta **sem**
 * escola, para poder promover quem passou o campo no cadastro — e isso entregava
 * ao administrador de qualquer escola toda conta em branco da instância: promover
 * estampava a escola dele na conta, rebaixar deixava a escola lá, e a partir daí
 * a conta era alvo válido de código de senha. Quem criou a conta sem escola é
 * promovido pelo terminal, com `--escola`.
 *
 * Conta de outra escola recebe a mesma recusa de "não existe": a tela não pode
 * virar um jeito de descobrir quem tem conta no produto.
 */
async function findInSchool(email: string, institution: string): Promise<TargetProfile | null> {
  const row = await db.profile.findUnique({
    where: { email },
    select: { id: true, displayName: true, role: true, institution: true },
  });

  if (row === null) return null;

  // Uma definição só de "mesma escola", igual à da consulta em `readSchoolStaff`:
  // comparação exata contra o valor guardado. Cadastro e script gravam sempre com
  // as pontas aparadas, então não há dois jeitos de responder a mesma pergunta.
  return row.institution === institution ? row : null;
}

/**
 * A troca de papel e o seu rastro, na mesma transação.
 *
 * Juntas de propósito: papel mudado sem linha de rastro é exatamente o estado
 * que a escola não consegue auditar depois. Devolve `false` quando o papel de
 * quem foi lido já não é o papel de quem vai ser escrito — a escrita é um
 * compara-e-troca, não um "escreve por cima": entre a leitura e a escrita o
 * terminal pode ter promovido essa conta a administrador, e a regra 4 não pode
 * cair numa janela de milissegundos.
 *
 * Rebaixar também tira do catálogo o que aquela conta publicou. Sem isso,
 * revogar o papel deixava o texto no ar para a instância inteira e tirava da
 * própria autora a única ação que o retiraria (`withdrawFromCatalog` exige o
 * papel que acabou de ser tirado).
 *
 * A sessão de quem teve o papel mudado **não** é encerrada, e não precisa ser: o
 * papel é lido do banco a cada pedido (`lib/roles.ts`), nunca do cookie. Um
 * professor rebaixado no meio da aula perde o poder na próxima página, sem perder
 * o que estava fazendo.
 */
async function changeRole(change: {
  profileId: string;
  changedById: string;
  fromRole: string;
  toRole: string;
}): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const updated = await tx.profile.updateMany({
      where: { id: change.profileId, role: change.fromRole },
      data: { role: change.toRole },
    });

    if (updated.count !== 1) return false;

    await tx.roleChange.create({
      data: {
        profileId: change.profileId,
        changedById: change.changedById,
        fromRole: change.fromRole,
        toRole: change.toRole,
      },
    });

    if (!teaches(change.toRole)) {
      await tx.teacherQuest.updateMany({
        where: { teacherId: change.profileId, catalogedAt: { not: null } },
        data: { catalogedAt: null },
      });
    }

    return true;
  });
}
