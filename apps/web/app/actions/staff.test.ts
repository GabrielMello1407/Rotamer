import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { startSession } from '../../lib/auth';
import { db } from '../../lib/db';
import { isDatabaseReachable } from '../../test/db-guard';
import { messages } from '../turmas/messages';

/** As recusas do servidor saem no idioma do pedido; sem cookie, o padrão. */
const staff = messages['pt-BR'].staff;
import { createClassroom, readClassroomBoard, readClassrooms } from './classroom';
import { issueResetCode } from './recovery';
import {
  demoteToStudent,
  findSchoolAccount,
  promoteToTeacher,
  readSchoolStaff,
} from './staff';

/**
 * As onze regras do D-29, uma a uma.
 *
 * Cada `it` daqui prova uma frase da decisão. A que mais importa é "a promoção
 * não vira escada": se um professor promovido pudesse promover, o degrau que o
 * D-29 delega teria virado uma escada até a instância inteira, e nenhuma das
 * outras regras seguraria isso.
 *
 * Rodam com sessão de verdade sobre o banco de desenvolvimento, como o
 * `assignment.test.ts` — `cookies()` de `next/headers` é a única borda
 * substituída, porque ela precisa de um pedido HTTP de verdade para existir.
 */
const databaseAvailable = await isDatabaseReachable();

if (!databaseAvailable) {
  console.warn(
    'staff.test.ts: banco indisponível (sem DATABASE_URL alcançável) — testes de papel pulados. ' +
      'Suba o Postgres (docker compose up) e rode de novo para executá-los.',
  );
}

const maybeDescribe = databaseAvailable ? describe : describe.skip;

vi.mock('next/headers', () => {
  const jar = new Map<string, string>();
  return {
    cookies: () =>
      Promise.resolve({
        get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
        set: (name: string, value: string) => {
          jar.set(name, value);
        },
        delete: (name: string) => {
          jar.delete(name);
        },
      }),
    headers: () => Promise.resolve({ get: () => null }),
  };
});

/** Uma escola por teste: "mesma escola" é o recorte de tudo aqui, e não pode vazar entre casos. */
function newSchool(): string {
  return `EE de teste ${randomUUID().slice(0, 8)}`;
}

interface Account {
  readonly id: string;
  readonly email: string;
}

async function makeAccount(
  role: 'aluno' | 'professor' | 'administrador',
  institution: string | null,
): Promise<Account> {
  const email = `papel-${randomUUID()}@rotamer.test`;
  const row = await db.profile.create({
    data: {
      email,
      passwordHash: 'hash-de-teste',
      displayName: `Conta ${role}`,
      role,
      institution,
    },
    select: { id: true },
  });

  return { id: row.id, email };
}

async function loginAs(profileId: string): Promise<void> {
  await startSession(profileId);
}

async function roleOf(profileId: string): Promise<string> {
  const row = await db.profile.findUniqueOrThrow({
    where: { id: profileId },
    select: { role: true },
  });
  return row.role;
}

async function institutionOf(profileId: string): Promise<string | null> {
  const row = await db.profile.findUniqueOrThrow({
    where: { id: profileId },
    select: { institution: true },
  });
  return row.institution;
}

maybeDescribe('D-29 — só administrador promove, e só até professor', () => {
  it('professor comum não promove ninguém', async () => {
    const school = newSchool();
    const teacher = await makeAccount('professor', school);
    const student = await makeAccount('aluno', school);

    await loginAs(teacher.id);
    const outcome = await promoteToTeacher({ email: student.email });

    expect(outcome.status).toBe('rejected');
    expect(await roleOf(student.id)).toBe('aluno');
  });

  it('aluno não promove ninguém, nem a si mesmo', async () => {
    const school = newSchool();
    const student = await makeAccount('aluno', school);
    const other = await makeAccount('aluno', school);

    await loginAs(student.id);

    expect((await promoteToTeacher({ email: other.email })).status).toBe('rejected');
    expect((await promoteToTeacher({ email: student.email })).status).toBe('rejected');
    expect(await roleOf(other.id)).toBe('aluno');
    expect(await roleOf(student.id)).toBe('aluno');
  });

  it('administrador promove a professor e o rastro diz quem promoveu', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const student = await makeAccount('aluno', school);

    await loginAs(administrator.id);
    const outcome = await promoteToTeacher({ email: student.email });

    expect(outcome.status).toBe('changed');
    expect(await roleOf(student.id)).toBe('professor');

    const trail = await db.roleChange.findMany({ where: { profileId: student.id } });
    expect(trail).toHaveLength(1);
    expect(trail[0]?.changedById).toBe(administrator.id);
    expect(trail[0]?.fromRole).toBe('aluno');
    expect(trail[0]?.toRole).toBe('professor');
  });

  /**
   * A regra que sustenta todas as outras: o degrau delegado não se multiplica.
   * Quem foi promovido pela tela vira professor, e professor não promove — então
   * uma conta invadida chega até aqui e para.
   */
  it('a promoção não vira escada: quem foi promovido não promove', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const promoted = await makeAccount('aluno', school);
    const third = await makeAccount('aluno', school);

    await loginAs(administrator.id);
    expect((await promoteToTeacher({ email: promoted.email })).status).toBe('changed');

    await loginAs(promoted.id);
    const outcome = await promoteToTeacher({ email: third.email });

    expect(outcome.status).toBe('rejected');
    expect(await roleOf(third.id)).toBe('aluno');
  });

  it('administrador não muda o próprio papel', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);

    await loginAs(administrator.id);

    const promotion = await promoteToTeacher({ email: administrator.email });
    const demotion = await demoteToStudent({ email: administrator.email });

    expect(promotion.status).toBe('rejected');
    expect(demotion.status).toBe('rejected');
    if (demotion.status === 'rejected') expect(demotion.reason).toBe(staff.notYourself);
    // A promoção recusa antes de tudo: `notYourself` vem antes de `alreadyTeaching`.
    if (promotion.status === 'rejected') expect(promotion.reason).toBe(staff.notYourself);
    expect(await roleOf(administrator.id)).toBe('administrador');
  });

  it('administrador não rebaixa outro administrador', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const peer = await makeAccount('administrador', school);

    await loginAs(administrator.id);
    const outcome = await demoteToStudent({ email: peer.email });

    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') {
      expect(outcome.reason).toBe(staff.notAnotherAdministrator);
    }
    expect(await roleOf(peer.id)).toBe('administrador');
  });

  it('rebaixar professor volta a conta para aluno e grava o rastro', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const teacher = await makeAccount('professor', school);

    await loginAs(administrator.id);
    const outcome = await demoteToStudent({ email: teacher.email });

    expect(outcome.status).toBe('changed');
    expect(await roleOf(teacher.id)).toBe('aluno');

    const trail = await db.roleChange.findMany({ where: { profileId: teacher.id } });
    expect(trail).toHaveLength(1);
    expect(trail[0]?.fromRole).toBe('professor');
    expect(trail[0]?.toRole).toBe('aluno');
  });
});

maybeDescribe('D-29 — a escola é o recorte', () => {
  it('conta de outra escola recebe a mesma recusa de conta que não existe', async () => {
    const administrator = await makeAccount('administrador', newSchool());
    const stranger = await makeAccount('aluno', newSchool());

    await loginAs(administrator.id);

    const found = await findSchoolAccount({ email: stranger.email });
    const missing = await findSchoolAccount({ email: `ninguem-${randomUUID()}@rotamer.test` });
    const promotion = await promoteToTeacher({ email: stranger.email });

    expect(found.status).toBe('rejected');
    expect(missing.status).toBe('rejected');
    if (found.status === 'rejected' && missing.status === 'rejected') {
      expect(found.reason).toBe(missing.reason);
    }
    expect(promotion.status).toBe('rejected');
    expect(await roleOf(stranger.id)).toBe('aluno');
  });

  it('escola já preenchida nunca muda de dono', async () => {
    const administrator = await makeAccount('administrador', newSchool());
    const otherSchool = newSchool();
    const stranger = await makeAccount('aluno', otherSchool);

    await loginAs(administrator.id);
    await promoteToTeacher({ email: stranger.email });

    expect(await institutionOf(stranger.id)).toBe(otherSchool);
    expect(await roleOf(stranger.id)).toBe('aluno');
  });

  /**
   * Conta sem escola não é alcançável, e nenhuma ação daqui escreve escola.
   *
   * A primeira versão alcançava a conta em branco e estampava nela a escola de
   * quem promoveu, para resolver o caso de quem passou o campo no cadastro. Isso
   * entregava ao administrador de qualquer escola toda conta em branco da
   * instância: promover marcava a escola, rebaixar deixava a marca, e a conta
   * virava alvo válido de código de senha. Quem criou a conta sem escola é
   * promovido pelo terminal.
   */
  it('conta sem escola não é alcançada, e nenhuma escola é escrita', async () => {
    const administrator = await makeAccount('administrador', newSchool());
    const blank = await makeAccount('aluno', null);

    await loginAs(administrator.id);

    expect((await findSchoolAccount({ email: blank.email })).status).toBe('rejected');
    expect((await promoteToTeacher({ email: blank.email })).status).toBe('rejected');
    expect(await roleOf(blank.id)).toBe('aluno');
    expect(await institutionOf(blank.id)).toBeNull();
  });

  it('administrador sem escola preenchida não alcança ninguém', async () => {
    const administrator = await makeAccount('administrador', null);
    const student = await makeAccount('aluno', newSchool());

    await loginAs(administrator.id);

    expect((await readSchoolStaff()).status).toBe('rejected');
    expect((await promoteToTeacher({ email: student.email })).status).toBe('rejected');
    expect(await roleOf(student.id)).toBe('aluno');
  });

  it('a lista traz quem dá aula na escola, e quem veio do terminal aparece sem autor', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const teacher = await makeAccount('professor', school);
    await makeAccount('aluno', school);
    await makeAccount('professor', newSchool());

    await loginAs(administrator.id);
    const outcome = await readSchoolStaff();

    expect(outcome.status).toBe('ok');
    if (outcome.status !== 'ok') return;

    const ids = outcome.staff.map((member) => member.id);
    expect(ids).toHaveLength(2);
    expect(ids).toContain(administrator.id);
    expect(ids).toContain(teacher.id);

    const mine = outcome.staff.find((member) => member.id === administrator.id);
    expect(mine?.administrator).toBe(true);
    expect(mine?.grantedBy).toBeNull();
  });
});

maybeDescribe('D-29 — o teto de consultas', () => {
  it('consulta demais em pouco tempo é recusada', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const student = await makeAccount('aluno', school);

    await loginAs(administrator.id);

    // Trinta passam; a trigésima primeira é a varredura que o teto existe para parar.
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const outcome = await findSchoolAccount({ email: student.email });
      expect(outcome.status).toBe('found');
    }

    const blocked = await findSchoolAccount({ email: student.email });
    expect(blocked.status).toBe('rejected');
    if (blocked.status === 'rejected') expect(blocked.reason).toBe(staff.tooManyLookups);
  });
});

maybeDescribe('D-29 — administrador é professor também', () => {
  it('administrador abre turma', async () => {
    const administrator = await makeAccount('administrador', newSchool());

    await loginAs(administrator.id);
    const outcome = await createClassroom({ name: 'Turma do administrador' });

    expect(outcome.status).toBe('created');
  });

  it('administrador emite código de senha para aluno da escola, e nunca para quem dá aula', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const student = await makeAccount('aluno', school);
    const teacher = await makeAccount('professor', school);
    const peer = await makeAccount('administrador', school);

    await loginAs(administrator.id);

    expect((await issueResetCode({ email: student.email })).status).toBe('issued');
    expect((await issueResetCode({ email: teacher.email })).status).toBe('rejected');
    expect((await issueResetCode({ email: peer.email })).status).toBe('rejected');
  });
});

maybeDescribe('D-29 — o teto vale nas três ações', () => {
  /**
   * Com o teto só na consulta, `demoteToStudent` respondia a mesma pergunta —
   * "esta conta existe na minha escola" — sem limite nenhum, e ainda devolvia o
   * nome: trocar o nome da ação era toda a evasão que a varredura precisava.
   */
  it('rebaixar também conta no teto, e a recusa não entrega nome', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const student = await makeAccount('aluno', school);

    await loginAs(administrator.id);

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const outcome = await demoteToStudent({ email: student.email });
      expect(outcome.status).toBe('rejected');
      if (outcome.status === 'rejected') {
        expect(outcome.reason).toBe(staff.notTeaching);
        expect(outcome.reason).not.toContain('Conta aluno');
      }
    }

    const blocked = await demoteToStudent({ email: student.email });
    expect(blocked.status).toBe('rejected');
    if (blocked.status === 'rejected') expect(blocked.reason).toBe(staff.tooManyLookups);
  });

  it('promover também conta no teto, e a recusa não entrega nome', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const teacher = await makeAccount('professor', school);

    await loginAs(administrator.id);

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const outcome = await promoteToTeacher({ email: teacher.email });
      expect(outcome.status).toBe('rejected');
      if (outcome.status === 'rejected') {
        expect(outcome.reason).toBe(staff.alreadyTeaching);
        expect(outcome.reason).not.toContain('Conta professor');
      }
    }

    const blocked = await promoteToTeacher({ email: teacher.email });
    expect(blocked.status).toBe('rejected');
    if (blocked.status === 'rejected') expect(blocked.reason).toBe(staff.tooManyLookups);
  });
});

maybeDescribe('D-29 — o que o rebaixamento encerra', () => {
  /**
   * Rebaixar era o primeiro passo de uma tomada de conta.
   *
   * O D-19 nunca emite código de senha para quem dá aula, justamente para o
   * caminho não virar escada. Com o rebaixamento na tela, bastava tirar o papel do
   * professor para ele deixar de ser "quem dá aula" e virar alvo válido — dois
   * cliques da coordenação, e a conta dele estava aberta.
   */
  it('professor rebaixado não recebe código de senha pela tela', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const teacher = await makeAccount('professor', school);

    await loginAs(administrator.id);
    expect((await issueResetCode({ email: teacher.email })).status).toBe('rejected');
    expect((await demoteToStudent({ email: teacher.email })).status).toBe('changed');

    const afterDemotion = await issueResetCode({ email: teacher.email });
    expect(afterDemotion.status).toBe('rejected');
  });

  /**
   * Revogar o papel é a mitigação que o D-19 promete para conteúdo lido por menor
   * de idade. Ela não valia nada enquanto a missão publicada continuava no
   * catálogo de toda a instância — e sem o papel a própria autora já não
   * conseguia retirá-la, porque `withdrawFromCatalog` exige ser professor.
   */
  it('rebaixar retira do catálogo o que aquela conta publicou', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const teacher = await makeAccount('professor', school);

    const quest = await db.teacherQuest.create({
      data: {
        teacherId: teacher.id,
        title: 'Missão de teste',
        brief: 'Enunciado de teste.',
        hints: [],
        goals: [],
        answerMolblock: 'molblock de teste',
        answerInchiKey: `TESTE-${randomUUID().slice(0, 8)}`,
        catalogedAt: new Date(),
      },
      select: { id: true },
    });

    await loginAs(administrator.id);
    expect((await demoteToStudent({ email: teacher.email })).status).toBe('changed');

    const after = await db.teacherQuest.findUniqueOrThrow({
      where: { id: quest.id },
      select: { catalogedAt: true },
    });
    expect(after.catalogedAt).toBeNull();
  });

  /**
   * Papel também, não só dono. `readClassrooms` e `readClassroomBoard`
   * autorizavam por dono sozinho — o que bastava enquanto rebaixar era operação de
   * terminal. Com um clique fazendo isso, a turma continuava voltando inteira por
   * `/turmas/<id>` guardado nos favoritos, com nome e progresso de aluno do outro
   * lado (D-22).
   */
  it('professor rebaixado não lê mais o quadro da turma que era dele', async () => {
    const school = newSchool();
    const administrator = await makeAccount('administrador', school);
    const teacher = await makeAccount('professor', school);

    await loginAs(teacher.id);
    const opened = await createClassroom({ name: 'Turma que vai ser cortada' });
    if (opened.status !== 'created') throw new Error('a turma deveria ser criada');

    expect(await readClassroomBoard(opened.classroom.id)).not.toBeNull();

    await loginAs(administrator.id);
    expect((await demoteToStudent({ email: teacher.email })).status).toBe('changed');

    await loginAs(teacher.id);
    expect(await readClassroomBoard(opened.classroom.id)).toBeNull();
    expect((await readClassrooms()).teaching).toHaveLength(0);
  });
});
