import { randomUUID } from 'node:crypto';
import { analyze, configureRDKit, type Molecule } from '@rotamer/core';
import { packageFactory } from '@rotamer/core/chemistry/node';
import { evaluateQuest, extractGoals } from '@rotamer/quests';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { endSession, startSession } from '../../lib/auth';
import { db } from '../../lib/db';
import { resolveQuest } from '../../lib/quest-resolve';
import { buildPrompt } from '../../lib/tutor/prompt';
import { isDatabaseReachable } from '../../test/db-guard';
import { openQuest, saveAttempt } from './attempt';
import {
  addItem,
  archiveTeacherQuest,
  createAssignment,
  createTeacherQuest,
  publishAssignment,
  publishToCatalog,
  readCatalog,
  readQuestDetail,
  readStudentAssignments,
  reportQuest,
  unarchiveTeacherQuest,
  updateTeacherQuestText,
  withdrawFromCatalog,
} from './assignment';
import { joinClassroom, readClassroomBoard } from './classroom';

/**
 * As dezesseis regras da §5.1 do `docs/ROTEIROS.md` (D-25) e as do D-27, uma a uma.
 *
 * Estas ações rodam com sessão de verdade (`startSession`/`endSession`) sobre
 * o banco de desenvolvimento — o mesmo caminho que o `turmas.spec.ts` (e2e)
 * exercita pela tela. `cookies()` de `next/headers` precisa de um pedido HTTP
 * de verdade para existir; fora do Next, o único jeito de testar a ação
 * exatamente como ela roda em produção é substituir só essa borda por um
 * pote de cookie em memória — o resto (sessão, papel, dono, RDKit, banco)
 * roda sem simulação nenhuma.
 *
 * **Achado 1 do `reviewer`.** Este arquivo fala com o banco de verdade, e o
 * CI tem um trabalho sem Postgres ("lint · tipos · testes"). `databaseAvailable`
 * é checado uma vez, antes de qualquer `describe`, com um `await` de nível de
 * módulo — e todo `describe` daqui para baixo usa `maybeDescribe`, que vira
 * `describe.skip` sem banco. Sem isso, `pnpm test` falharia ali; com isso, os
 * testes aparecem **pulados**, nunca falhos e nunca silenciosos — o aviso no
 * console diz por quê. O trabalho "navegador" do CI, que tem Postgres de pé,
 * roda este arquivo à parte (`vitest run app/actions/assignment.test.ts`),
 * então lá os testes executam de verdade.
 */
const databaseAvailable = await isDatabaseReachable();

/**
 * Achado 2 do `reviewer`: com a interceptação de console ligada (o padrão do
 * Vitest), o reporter "default" engolia este aviso — medido em 28/08/2026,
 * `DATABASE_URL` apontando para a porta 1: "33 skipped" no resumo e nenhuma
 * linha de aviso, mesmo com o `console.warn` de nível de módulo aqui embaixo.
 * Só aparecia com `--reporter=verbose`, que não é o comando que ninguém roda
 * por padrão. A correção fica em `vitest.config.ts`
 * (`disableConsoleIntercept: true`): sem ela, este `console.warn` continua
 * mudo aqui, por mais correto que o texto esteja.
 */
if (!databaseAvailable) {
  console.warn(
    'assignment.test.ts: banco indisponível (sem DATABASE_URL alcançável) — testes de ação pulados. ' +
      'Suba o Postgres (docker compose up) e rode de novo para executá-los.',
  );
}

const maybeDescribe = databaseAvailable ? describe : describe.skip;

/** O mesmo prefixo de `apps/web/app/actions/assignment.ts` — repetido aqui só como literal de teste. */
const TEACHER_PREFIX = 'professor:';

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
  };
});

beforeAll(() => {
  configureRDKit({ loadFactory: packageFactory });
});

async function loginAs(profileId: string): Promise<void> {
  await startSession(profileId);
}

async function logout(): Promise<void> {
  await endSession();
}

async function makeProfile(role: 'aluno' | 'professor'): Promise<{ readonly id: string }> {
  return db.profile.create({
    data: {
      email: `teste-${randomUUID()}@rotamer.test`,
      passwordHash: 'hash-de-teste',
      displayName: 'Perfil de teste',
      role,
    },
    select: { id: true },
  });
}

async function makeTeacher(): Promise<{ readonly id: string }> {
  return makeProfile('professor');
}

async function makeStudent(): Promise<{ readonly id: string }> {
  return makeProfile('aluno');
}

async function makeClassroom(teacherId: string): Promise<{ readonly id: string }> {
  return db.classroom.create({
    data: { name: 'Turma de teste', teacherId, code: randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase() },
    select: { id: true },
  });
}

async function enroll(classroomId: string, profileId: string): Promise<void> {
  await db.enrollment.create({ data: { classroomId, profileId } });
}

/** O etanol, com o RDKit configurado — a mesma referência do `CLAUDE.md`. */
async function ethanol(): Promise<Molecule> {
  const result = await analyze('CCO');
  if (!result.ok) throw new Error('o etanol deveria ser válido');
  return result.molecule;
}

/** Cria uma lista publicada com uma missão de professor, pronta para o aluno tentar. */
async function publishedTeacherQuest(): Promise<{
  readonly teacherId: string;
  readonly classroomId: string;
  readonly assignmentId: string;
  readonly questSlug: string;
}> {
  const teacher = await makeTeacher();
  await loginAs(teacher.id);

  const classroom = await makeClassroom(teacher.id);
  const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista de teste' });
  if (assignment.status !== 'created') throw new Error('a lista deveria ser criada');

  const molecule = await ethanol();
  const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
  if (!formula) throw new Error('o etanol deveria ter um candidato de fórmula');

  const quest = await createTeacherQuest({
    assignmentId: assignment.id,
    title: 'Missão de teste',
    brief: 'Enunciado de teste, sem link nenhum.',
    hints: [],
    molblock: 'CCO',
    goalIds: [formula.id],
  });
  if (quest.status !== 'created') throw new Error(`a missão deveria ser criada: ${JSON.stringify(quest)}`);

  await publishAssignment({ assignmentId: assignment.id });

  return { teacherId: teacher.id, classroomId: classroom.id, assignmentId: assignment.id, questSlug: quest.questSlug };
}

maybeDescribe('R-5 — papel é pré-requisito, dono é a autorização', () => {
  it('conta de aluno não cria missão nem lista', async () => {
    const professor = await makeTeacher();
    const classroom = await makeClassroom(professor.id);

    const aluno = await makeStudent();
    await loginAs(aluno.id);

    const outcome = await createAssignment({ classroomId: classroom.id, title: 'Lista de aluno' });

    expect(outcome.status).toBe('rejected');
    const count = await db.assignment.count({ where: { classroomId: classroom.id } });
    expect(count).toBe(0);
  });

  it('professor não adiciona item em lista de outro professor', async () => {
    const dono = await makeTeacher();
    await loginAs(dono.id);
    const classroom = await makeClassroom(dono.id);
    const lista = await createAssignment({ classroomId: classroom.id, title: 'Lista do dono' });
    if (lista.status !== 'created') throw new Error('deveria criar a lista');

    const outro = await makeTeacher();
    await loginAs(outro.id);
    const outcome = await addItem({ assignmentId: lista.id, questSlug: 'primeiro-carbono' });

    expect(outcome.status).toBe('rejected');
    const count = await db.assignmentItem.count({ where: { assignmentId: lista.id } });
    expect(count).toBe(0);
  });

  it('aluno promovido a professor não publica na turma em que ele é aluno', async () => {
    const dono = await makeTeacher();
    await loginAs(dono.id);
    const classroom = await makeClassroom(dono.id);
    const lista = await createAssignment({ classroomId: classroom.id, title: 'Lista da turma' });
    if (lista.status !== 'created') throw new Error('deveria criar a lista');
    await addItem({ assignmentId: lista.id, questSlug: 'primeiro-carbono' });

    // Papel de professor no banco, mas matriculado como aluno nesta turma —
    // R-5 não deixa o papel sozinho decidir: quem não é dono não publica.
    const promovido = await makeTeacher();
    await enroll(classroom.id, promovido.id);

    await loginAs(promovido.id);
    const outcome = await publishAssignment({ assignmentId: lista.id });

    expect(outcome.status).toBe('rejected');
    const row = await db.assignment.findUnique({ where: { id: lista.id }, select: { publishedAt: true } });
    expect(row?.publishedAt).toBeNull();
  });
});

maybeDescribe('R-6 — addItem confere dois donos', () => {
  it('professor não adiciona à própria lista uma missão de outro professor', async () => {
    const autor = await makeTeacher();
    await loginAs(autor.id);
    const classroomAutor = await makeClassroom(autor.id);
    const listaAutor = await createAssignment({ classroomId: classroomAutor.id, title: 'Lista do autor' });
    if (listaAutor.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const missao = await createTeacherQuest({
      assignmentId: listaAutor.id,
      title: 'Missão do autor',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (missao.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(missao)}`);

    const outro = await makeTeacher();
    await loginAs(outro.id);
    const classroomOutro = await makeClassroom(outro.id);
    const listaOutro = await createAssignment({ classroomId: classroomOutro.id, title: 'Lista de outro' });
    if (listaOutro.status !== 'created') throw new Error('deveria criar a lista');

    const outcome = await addItem({ assignmentId: listaOutro.id, questSlug: missao.questSlug });

    expect(outcome.status).toBe('rejected');
    const count = await db.assignmentItem.count({ where: { assignmentId: listaOutro.id } });
    expect(count).toBe(0);
  });
});

maybeDescribe('R-7 — as quatro portas do aluno', () => {
  it('aluno da turma B tem a tentativa recusada no slug da turma A', async () => {
    const cenario = await publishedTeacherQuest();

    const professorB = await makeTeacher();
    await loginAs(professorB.id);
    const classroomB = await makeClassroom(professorB.id);

    const aluno = await makeStudent();
    await enroll(classroomB.id, aluno.id); // só a turma B, nunca a turma A

    await loginAs(aluno.id);
    const outcome = await saveAttempt({ questSlug: cenario.questSlug, molblock: 'CCO', elapsedMs: 500 });

    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') expect(outcome.reason).toBe('Essa missão não existe.');

    const attempts = await db.attempt.count({ where: { profileId: aluno.id, questSlug: cenario.questSlug } });
    expect(attempts).toBe(0);
  });

  it('rascunho não publicado não é aberto por aluno matriculado', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    const classroom = await makeClassroom(teacher.id);

    const aluno = await makeStudent();
    await enroll(classroom.id, aluno.id);

    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Rascunho' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão em rascunho',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);
    // Não publica — a lista fica em rascunho de propósito.

    await loginAs(aluno.id);
    const outcome = await saveAttempt({ questSlug: quest.questSlug, molblock: 'CCO', elapsedMs: 500 });

    expect(outcome.status).toBe('rejected');
  });

  it('turma arquivada deixa de dar acesso à lista', async () => {
    const cenario = await publishedTeacherQuest();

    const aluno = await makeStudent();
    await enroll(cenario.classroomId, aluno.id);

    await db.classroom.update({ where: { id: cenario.classroomId }, data: { archivedAt: new Date() } });

    await loginAs(aluno.id);
    const outcome = await saveAttempt({ questSlug: cenario.questSlug, molblock: 'CCO', elapsedMs: 500 });

    expect(outcome.status).toBe('rejected');
  });
});

maybeDescribe('R-3 — a resposta nunca entra em caminho de aluno', () => {
  it('resposta ao aluno não contém answerMolblock nem answerInchiKey', async () => {
    const cenario = await publishedTeacherQuest();

    const aluno = await makeStudent();
    await enroll(cenario.classroomId, aluno.id);

    const teacherQuestId = cenario.questSlug.slice('professor:'.length);
    const row = await db.teacherQuest.findUniqueOrThrow({
      where: { id: teacherQuestId },
      select: { answerMolblock: true, answerInchiKey: true },
    });

    await loginAs(aluno.id);
    const payload = await readStudentAssignments();
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain(row.answerMolblock);
    expect(serialized).not.toContain(row.answerInchiKey);
    expect(serialized).not.toContain('V2000');
  });
});

maybeDescribe('R-4 — objetivo de InChIKey não manda condição ao cliente', () => {
  it('missão com objetivo de InChIKey não manda condição ao cliente', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista exata' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const identidade = extractGoals(molecule).find((candidate) => candidate.kind === 'identity');
    if (!identidade) throw new Error('candidato de identidade deveria existir');

    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'A molécula exata',
      brief: 'Desenhe exatamente o etanol.',
      hints: [],
      molblock: 'CCO',
      goalIds: [identidade.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);

    await publishAssignment({ assignmentId: assignment.id });

    const aluno = await makeStudent();
    await enroll(classroom.id, aluno.id);

    await loginAs(aluno.id);
    const payload = await readStudentAssignments();

    const item = payload[0]?.items[0];
    expect(item).toBeDefined();
    expect(item?.goals).toHaveLength(1);
    expect(item?.goals[0]?.condition).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain('inchiKey');
    expect(JSON.stringify(payload)).not.toContain(molecule.inchiKey);
  });
});

maybeDescribe('R-1 — nada digitado vira Condition', () => {
  it('objetivo forjado que não está na lista regerada é recusado', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const outcome = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão forjada',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      // Nenhum candidato do etanol tem 999 anéis: este id não sai de `extractGoals`.
      goalIds: ['descriptor:rings:999'],
    });

    expect(outcome.status).toBe('rejected');
    const count = await db.teacherQuest.count({ where: { teacherId: teacher.id } });
    expect(count).toBe(0);
  });
});

maybeDescribe('R-2 — a própria resposta precisa cumprir a missão', () => {
  it('missão que a própria resposta não cumpre é recusada, nomeando o objetivo', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    // Butan-2-ol: o carbono 2 é estereogênico, e sem cunha no desenho a
    // configuração fica sem definir — exatamente o candidato cujo alvo (zero
    // centros sem configuração) a própria molécula que o gerou não cumpre.
    const result = await analyze('CCC(O)C');
    if (!result.ok) throw new Error('o butan-2-ol deveria ser válido');
    const semConfiguracao = extractGoals(result.molecule).find(
      (candidate) => candidate.id === 'descriptor:unspecifiedStereocenters:0',
    );
    if (!semConfiguracao) {
      throw new Error('o butan-2-ol sem cunha deveria oferecer o candidato de configuração pendente');
    }

    const outcome = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão impossível',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCC(O)C',
      goalIds: [semConfiguracao.id],
    });

    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') {
      expect(outcome.reason).toContain('nenhum centro estereogênico fica sem configuração');
    }
    const count = await db.teacherQuest.count({ where: { teacherId: teacher.id } });
    expect(count).toBe(0);
  });
});

maybeDescribe('R-14 — sem link no enunciado', () => {
  it('enunciado com HTML sai como texto na tela (e2e) e enunciado com link é recusado', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const outcome = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão com link',
      brief: 'Veja mais em https://exemplo.com para detalhes.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });

    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') expect(outcome.reason).toContain('link');
    // "sai como texto na tela" é o desenho do professor não virar HTML/markdown
    // — comportamento de renderização, provado no e2e (`frontend`), fora do
    // alcance desta suíte de ação de servidor.
  });
});

maybeDescribe('R-13 — teto de texto', () => {
  it('enunciado acima de 500 caracteres é recusado', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const outcome = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão com enunciado longo',
      brief: 'a'.repeat(501),
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });

    expect(outcome.status).toBe('rejected');
  });
});

maybeDescribe('R-12 — tetos, conferidos dentro de transação', () => {
  it(
    'lista recusa o trigésimo primeiro item',
    async () => {
      const teacher = await makeTeacher();
      await loginAs(teacher.id);
      const classroom = await makeClassroom(teacher.id);
      const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista cheia' });
      if (assignment.status !== 'created') throw new Error('deveria criar a lista');

      const molecule = await ethanol();
      const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
      if (!formula) throw new Error('candidato de fórmula deveria existir');

      let last: Awaited<ReturnType<typeof createTeacherQuest>> | undefined;
      for (let index = 1; index <= 31; index += 1) {
        last = await createTeacherQuest({
          assignmentId: assignment.id,
          title: `Missão ${String(index)}`,
          brief: 'Enunciado de teste.',
          hints: [],
          molblock: 'CCO',
          goalIds: [formula.id],
        });
        if (index <= 30) expect(last.status, `item ${String(index)} deveria entrar`).toBe('created');
      }

      expect(last?.status).toBe('rejected');

      const count = await db.assignmentItem.count({ where: { assignmentId: assignment.id } });
      expect(count).toBe(30);
    },
    60_000,
  );

  it('resposta com mais de 100 átomos pesados é recusada, com mensagem de química', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    // Cadeia linear de 105 carbonos: 105 átomos pesados, acima do teto de 100.
    const cadeiaGigante = 'C'.repeat(105);

    const outcome = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão gigante',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: cadeiaGigante,
      goalIds: [formula.id],
    });

    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') {
      expect(outcome.reason).toContain('átomos');
      expect(outcome.reason).toMatch(/\d/);
    }
  });
});

maybeDescribe('R-8 — slug inexistente e slug sem matrícula são a mesma recusa', () => {
  it('slug inexistente e slug sem matrícula devolvem a mesma recusa', async () => {
    const cenario = await publishedTeacherQuest();

    const aluno = await makeStudent();
    // O aluno nunca é matriculado na turma do cenário.

    await loginAs(aluno.id);
    const semSlug = await saveAttempt({ questSlug: 'esta-missao-nao-existe-nunca', molblock: 'CCO', elapsedMs: 100 });
    const semMatricula = await saveAttempt({ questSlug: cenario.questSlug, molblock: 'CCO', elapsedMs: 100 });

    expect(semSlug.status).toBe('rejected');
    expect(semMatricula.status).toBe('rejected');
    if (semSlug.status === 'rejected' && semMatricula.status === 'rejected') {
      expect(semSlug.reason).toBe(semMatricula.reason);
      expect(semSlug.reason).toBe('Essa missão não existe.');
    }
  });
});

maybeDescribe('R-11 — o quadro de uma turma não lê missão de outra', () => {
  it('quadro da turma A não mostra missão da turma I', async () => {
    // O aluno tentou uma missão na turma I antes de entrar na turma A.
    const cenarioI = await publishedTeacherQuest();
    const aluno = await makeStudent();
    await enroll(cenarioI.classroomId, aluno.id);

    await loginAs(aluno.id);
    await saveAttempt({ questSlug: cenarioI.questSlug, molblock: 'CCO', elapsedMs: 100 });

    const professorA = await makeTeacher();
    await loginAs(professorA.id);
    const classroomA = await makeClassroom(professorA.id);
    await enroll(classroomA.id, aluno.id);

    const board = await readClassroomBoard(classroomA.id);
    expect(board).not.toBeNull();
    const serialized = JSON.stringify(board);

    expect(serialized).not.toContain(cenarioI.questSlug);
    expect(serialized).not.toContain('Missão de teste');
  });
});

maybeDescribe('R-9 — o prompt do tutor não recebe texto de missão de professor', () => {
  it('prompt do tutor não contém o enunciado do professor', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const enunciadoSecreto = 'Não escreva o nome de nenhum aluno — marca-para-o-teste-nao-vazar-8f2c.';
    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão sigilosa, nome do professor',
      brief: enunciadoSecreto,
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);

    const resolved = await resolveQuest(quest.questSlug);
    if (resolved === null) throw new Error('a missão deveria resolver');
    const goals = evaluateQuest(resolved, molecule).goals;

    const prompt = buildPrompt({ molecule, quest: resolved, goals, kind: 'proximo-passo' });

    expect(prompt).not.toContain(enunciadoSecreto);
    expect(prompt).not.toContain('Missão sigilosa');
    expect(prompt).toContain(formula.label);
  });
});

maybeDescribe('R-10 — editar o texto invalida o cache do tutor', () => {
  it('atualizar título, enunciado ou dicas apaga o TutorHint desta missão', async () => {
    const cenario = await publishedTeacherQuest();
    const teacherQuestId = cenario.questSlug.slice(TEACHER_PREFIX.length);

    // Um cache de tutor para esta missão, sem precisar do Gemini de verdade.
    await db.tutorHint.create({
      data: {
        inchiKey: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N',
        questSlug: cenario.questSlug,
        kind: 'proximo-passo',
        payload: { message: 'dica em cache, de mentira' },
        model: 'teste',
      },
    });
    expect(await db.tutorHint.count({ where: { questSlug: cenario.questSlug } })).toBe(1);

    await loginAs(cenario.teacherId);
    const outcome = await updateTeacherQuestText({
      teacherQuestId,
      title: 'Título atualizado',
      brief: 'Enunciado atualizado, sem link nenhum.',
      hints: [],
    });

    expect(outcome.status).toBe('ok');
    expect(await db.tutorHint.count({ where: { questSlug: cenario.questSlug } })).toBe(0);
  });
});

maybeDescribe('R-15 — teto de códigos errados por hora', () => {
  it('a décima primeira tentativa de código errado é bloqueada', async () => {
    const aluno = await makeStudent();
    await loginAs(aluno.id);

    let last: Awaited<ReturnType<typeof joinClassroom>> | undefined;
    for (let index = 0; index < 11; index += 1) {
      last = await joinClassroom({ code: `ERRADO${String(index)}` });
    }

    expect(last?.status).toBe('rejected');
    if (last?.status === 'rejected') {
      expect(last.reason).toContain('Muitos códigos errados');
    }
  });
});

maybeDescribe('R-16 — questSlug tem teto de tamanho', () => {
  it('slug maior que 80 caracteres é recusado por schema, antes de tocar o banco', async () => {
    const aluno = await makeStudent();
    await loginAs(aluno.id);

    const slugGigante = `${TEACHER_PREFIX}${'x'.repeat(80)}`;
    const outcome = await saveAttempt({ questSlug: slugGigante, molblock: 'CCO', elapsedMs: 100 });

    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') expect(outcome.reason).toBe('Tentativa mal formada.');
  });
});

maybeDescribe('Achado 6 do reviewer — o teto diário conta toda escrita de autoria', () => {
  it(
    'editar a mesma missão repetidas vezes soma no mesmo teto de criar, não fica de fora',
    async () => {
      const teacher = await makeTeacher();
      await loginAs(teacher.id);
      const classroom = await makeClassroom(teacher.id);
      const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
      if (assignment.status !== 'created') throw new Error('deveria criar a lista');

      const molecule = await ethanol();
      const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
      if (!formula) throw new Error('candidato de fórmula deveria existir');

      const quest = await createTeacherQuest({
        assignmentId: assignment.id,
        title: 'Missão editada muitas vezes',
        brief: 'Enunciado de teste.',
        hints: [],
        molblock: 'CCO',
        goalIds: [formula.id],
      });
      if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);

      const teacherQuestId = quest.questSlug.slice(TEACHER_PREFIX.length);

      // A criação já contou 1 salvamento; faltam 199 para o teto de 200.
      let last: Awaited<ReturnType<typeof updateTeacherQuestText>> | undefined;
      for (let index = 0; index < 199; index += 1) {
        last = await updateTeacherQuestText({
          teacherQuestId,
          title: `Título ${String(index)}`,
          brief: 'Enunciado de teste, sem link.',
          hints: [],
        });
        expect(last.status, `edição ${String(index)} deveria passar`).toBe('ok');
      }

      // A 201ª escrita de autoria (1 criação + 200 edições) estoura o teto.
      const outcome = await updateTeacherQuestText({
        teacherQuestId,
        title: 'Título final',
        brief: 'Enunciado de teste, sem link.',
        hints: [],
      });

      expect(outcome.status).toBe('rejected');
    },
    60_000,
  );
});

maybeDescribe('Achado 6 do reviewer — unarchiveTeacherQuest existe', () => {
  it('arquiva, tenta publicar (recusa nomeando o caminho), desarquiva, publica (ok)', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    await db.profile.update({ where: { id: teacher.id }, data: { institution: 'Escola de Teste' } });

    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão a arquivar',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);
    const teacherQuestId = quest.questSlug.slice(TEACHER_PREFIX.length);

    const archived = await archiveTeacherQuest({ teacherQuestId });
    expect(archived.status).toBe('ok');

    const rejectedPublish = await publishToCatalog({ teacherQuestId });
    expect(rejectedPublish.status).toBe('rejected');
    if (rejectedPublish.status === 'rejected') expect(rejectedPublish.reason).toContain('Desarquive');

    const unarchived = await unarchiveTeacherQuest({ teacherQuestId });
    expect(unarchived.status).toBe('ok');

    const publish = await publishToCatalog({ teacherQuestId });
    expect(publish.status).toBe('ok');
  });
});

maybeDescribe('Achado 7 do reviewer — institution nunca é string vazia', () => {
  it('professor sem instituição preenchida: byTeacher.institution sai null em readStudentAssignments e readQuestDetail', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    // Nenhuma instituição preenchida — o teacher nasce com `institution: null`.

    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão sem instituição',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);

    const published = await publishAssignment({ assignmentId: assignment.id });
    expect(published.status).toBe('published');

    const aluno = await makeStudent();
    await enroll(classroom.id, aluno.id);
    await loginAs(aluno.id);

    const assignments = await readStudentAssignments();
    const item = assignments[0]?.items[0];
    expect(item?.byTeacher).not.toBeNull();
    expect(item?.byTeacher?.institution).toBeNull();

    const detail = await readQuestDetail({ questSlug: quest.questSlug });
    expect(detail.status).toBe('ok');
    if (detail.status === 'ok') {
      expect(detail.quest.byTeacher).not.toBeNull();
      expect(detail.quest.byTeacher?.institution).toBeNull();
    }
  });

  it('readCatalog sempre traz institution preenchida — publicar já exige (D-27)', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    await db.profile.update({ where: { id: teacher.id }, data: { institution: 'Escola de Teste' } });

    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão catalogada, com instituição',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);

    const published = await publishToCatalog({ teacherQuestId: quest.questSlug.slice(TEACHER_PREFIX.length) });
    expect(published.status).toBe('ok');

    const aluno = await makeStudent();
    await loginAs(aluno.id);
    const catalog = await readCatalog({});
    const entry = catalog.find((item) => item.slug === quest.questSlug);

    expect(entry?.byTeacher?.institution).toBe('Escola de Teste');
    expect(entry?.byTeacher?.institution).not.toBe('');
  });
});

maybeDescribe('Achado 2 do reviewer — a leitura da missão pelo aluno', () => {
  it('aluno matriculado lê título, enunciado, dicas e objetivos, sem a resposta', async () => {
    const cenario = await publishedTeacherQuest();
    const aluno = await makeStudent();
    await enroll(cenario.classroomId, aluno.id);

    await loginAs(aluno.id);
    const outcome = await readQuestDetail({ questSlug: cenario.questSlug });

    expect(outcome.status).toBe('ok');
    if (outcome.status === 'ok') {
      expect(outcome.quest.title).toBe('Missão de teste');
      expect(outcome.quest.goals.length).toBeGreaterThan(0);
      expect(outcome.quest.goals[0]).not.toHaveProperty('condition');
    }
    expect(JSON.stringify(outcome)).not.toContain('V2000');
  });

  it('conta anônima recebe a mesma recusa para um slug real e para um forjado', async () => {
    const cenario = await publishedTeacherQuest();
    await logout();

    const real = await readQuestDetail({ questSlug: cenario.questSlug });
    const forjado = await readQuestDetail({ questSlug: `${TEACHER_PREFIX}esteidnuncaexistiu00000000` });

    expect(real.status).toBe('rejected');
    expect(forjado.status).toBe('rejected');
    if (real.status === 'rejected' && forjado.status === 'rejected') {
      expect(real.reason).toBe(forjado.reason);
      expect(real.reason).toBe('Missão de turma precisa de conta.');
    }
  });
});

maybeDescribe('D-27 — opt-in por missão, nunca por padrão', () => {
  it('missão nasce fora do catálogo: catalogedAt nulo', async () => {
    const cenario = await publishedTeacherQuest();
    const teacherQuestId = cenario.questSlug.slice(TEACHER_PREFIX.length);

    const row = await db.teacherQuest.findUniqueOrThrow({
      where: { id: teacherQuestId },
      select: { catalogedAt: true },
    });

    expect(row.catalogedAt).toBeNull();
  });
});

maybeDescribe('D-27 — publicar no catálogo exige instituição preenchida', () => {
  it('publicar sem instituição é recusado, e catalogedAt continua nulo', async () => {
    const cenario = await publishedTeacherQuest();
    const teacherQuestId = cenario.questSlug.slice(TEACHER_PREFIX.length);

    await loginAs(cenario.teacherId);
    const outcome = await publishToCatalog({ teacherQuestId });

    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') expect(outcome.reason).toContain('instituição');

    const row = await db.teacherQuest.findUniqueOrThrow({
      where: { id: teacherQuestId },
      select: { catalogedAt: true },
    });
    expect(row.catalogedAt).toBeNull();
  });
});

maybeDescribe('D-27 corrigido — retirar do catálogo encerra o acesso pelo catálogo', () => {
  it('quem já abriu e está fora de qualquer lista perde o acesso: "Essa missão não existe."', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    await db.profile.update({ where: { id: teacher.id }, data: { institution: 'Escola de Teste' } });

    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Missão pública',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);
    const teacherQuestId = quest.questSlug.slice(TEACHER_PREFIX.length);

    // A missão nunca entrou em nenhuma lista — o único caminho até ela é o catálogo.
    const published = await publishToCatalog({ teacherQuestId });
    expect(published.status).toBe('ok');

    // Um aluno sem matrícula em turma nenhuma descobre pelo catálogo e abre.
    const jaAbriu = await makeStudent();
    await loginAs(jaAbriu.id);
    await openQuest({ questSlug: quest.questSlug });

    await loginAs(teacher.id);
    const withdrawn = await withdrawFromCatalog({ teacherQuestId });
    expect(withdrawn.status).toBe('ok');

    // "Já abriu" não é chave de acesso (D-27 corrigido): retirado do catálogo
    // e fora de lista nenhuma, o histórico em `QuestOpen` não salva ninguém.
    await loginAs(jaAbriu.id);
    const outcome = await saveAttempt({ questSlug: quest.questSlug, molblock: 'CCO', elapsedMs: 100 });
    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') expect(outcome.reason).toBe('Essa missão não existe.');
  });

  it('retirado do catálogo mas presente numa lista publicada da turma do aluno: continua', async () => {
    const cenario = await publishedTeacherQuest(); // já publica uma lista com esta missão
    const teacherQuestId = cenario.questSlug.slice(TEACHER_PREFIX.length);

    await loginAs(cenario.teacherId);
    await db.profile.update({ where: { id: cenario.teacherId }, data: { institution: 'Escola de Teste' } });
    const published = await publishToCatalog({ teacherQuestId });
    expect(published.status).toBe('ok');
    const withdrawn = await withdrawFromCatalog({ teacherQuestId });
    expect(withdrawn.status).toBe('ok');

    const aluno = await makeStudent();
    await enroll(cenario.classroomId, aluno.id);

    // O item continua na lista publicada da turma — o caminho 1 (matrícula)
    // nunca dependeu do catálogo, e retirar do catálogo não mexeu nele.
    await loginAs(aluno.id);
    const outcome = await saveAttempt({ questSlug: cenario.questSlug, molblock: 'CCO', elapsedMs: 100 });
    expect(outcome.status).toBe('saved');
  });
});

maybeDescribe('D-27 — aluno sem matrícula alcança só o que está no catálogo', () => {
  it('missão catalogada é alcançada; a mesma turma, sem catalogar, não é', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    await db.profile.update({ where: { id: teacher.id }, data: { institution: 'Escola de Teste' } });

    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const catalogada = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Catalogada',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (catalogada.status !== 'created') throw new Error(`deveria criar: ${JSON.stringify(catalogada)}`);

    const naoCatalogada = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Não catalogada',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (naoCatalogada.status !== 'created') throw new Error(`deveria criar: ${JSON.stringify(naoCatalogada)}`);

    const published = await publishToCatalog({ teacherQuestId: catalogada.questSlug.slice(TEACHER_PREFIX.length) });
    expect(published.status).toBe('ok');

    const aluno = await makeStudent(); // nunca matriculado em turma nenhuma
    await loginAs(aluno.id);

    const alcancaCatalogada = await saveAttempt({ questSlug: catalogada.questSlug, molblock: 'CCO', elapsedMs: 100 });
    const naoAlcancaOutra = await saveAttempt({
      questSlug: naoCatalogada.questSlug,
      molblock: 'CCO',
      elapsedMs: 100,
    });

    expect(alcancaCatalogada.status).toBe('saved');
    expect(naoAlcancaOutra.status).toBe('rejected');
  });
});

maybeDescribe('D-27 — readCatalog nunca expõe a resposta', () => {
  it('readCatalog serializado não contém answerInchiKey, molblock nem condition', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    await db.profile.update({ where: { id: teacher.id }, data: { institution: 'Escola de Teste' } });

    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    const molecule = await ethanol();
    const formula = extractGoals(molecule).find((candidate) => candidate.id === 'formula');
    if (!formula) throw new Error('candidato de fórmula deveria existir');

    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'Catalogada de verdade',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCO',
      goalIds: [formula.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);
    const teacherQuestId = quest.questSlug.slice(TEACHER_PREFIX.length);

    const row = await db.teacherQuest.findUniqueOrThrow({
      where: { id: teacherQuestId },
      select: { answerMolblock: true, answerInchiKey: true },
    });

    const published = await publishToCatalog({ teacherQuestId });
    expect(published.status).toBe('ok');

    const aluno = await makeStudent();
    await loginAs(aluno.id);
    const catalog = await readCatalog({});
    const serialized = JSON.stringify(catalog);

    expect(serialized).toContain('Catalogada de verdade');
    expect(serialized).not.toContain(row.answerMolblock);
    expect(serialized).not.toContain(row.answerInchiKey);
    expect(serialized).not.toContain('V2000');
    expect(serialized).not.toContain('condition');
  });
});

maybeDescribe('D-27 — busca do catálogo, sem acento e sem caixa', () => {
  it('a busca por "ester" acha a missão cujo rótulo é "tem pelo menos 1 grupo éster"', async () => {
    const teacher = await makeTeacher();
    await loginAs(teacher.id);
    await db.profile.update({ where: { id: teacher.id }, data: { institution: 'Escola de Teste' } });

    const classroom = await makeClassroom(teacher.id);
    const assignment = await createAssignment({ classroomId: classroom.id, title: 'Lista' });
    if (assignment.status !== 'created') throw new Error('deveria criar a lista');

    // Acetato de etila: um único grupo éster, sem ambiguidade com anidrido.
    const result = await analyze('CCOC(C)=O');
    if (!result.ok) throw new Error('o acetato de etila deveria ser válido');
    const ester = extractGoals(result.molecule).find((candidate) => candidate.id.startsWith('group:ester:'));
    if (!ester) throw new Error('candidato de éster deveria existir');
    expect(ester.label).toBe('tem pelo menos 1 grupo éster');

    const quest = await createTeacherQuest({
      assignmentId: assignment.id,
      title: 'O cheiro de fruta',
      brief: 'Enunciado de teste.',
      hints: [],
      molblock: 'CCOC(C)=O',
      goalIds: [ester.id],
    });
    if (quest.status !== 'created') throw new Error(`deveria criar a missão: ${JSON.stringify(quest)}`);

    const published = await publishToCatalog({ teacherQuestId: quest.questSlug.slice(TEACHER_PREFIX.length) });
    expect(published.status).toBe('ok');

    const aluno = await makeStudent();
    await loginAs(aluno.id);
    const encontrada = await readCatalog({ query: 'ester' });

    expect(encontrada.some((entry) => entry.slug === quest.questSlug)).toBe(true);
  });
});

maybeDescribe('D-27 — denúncia grava e respeita o teto', () => {
  it('reportQuest grava a denúncia e recusa a décima primeira do dia', async () => {
    const cenario = await publishedTeacherQuest();
    const aluno = await makeStudent();
    await enroll(cenario.classroomId, aluno.id);

    await loginAs(aluno.id);

    let last: Awaited<ReturnType<typeof reportQuest>> | undefined;
    for (let index = 0; index < 11; index += 1) {
      last = await reportQuest({ questSlug: cenario.questSlug, reason: `Motivo número ${String(index)}.` });
      if (index < 10) expect(last.status, `denúncia ${String(index)} deveria gravar`).toBe('ok');
    }

    expect(last?.status).toBe('rejected');

    const count = await db.questReport.count({ where: { questSlug: cenario.questSlug, reporterId: aluno.id } });
    expect(count).toBe(10);
  });

  it('conta sem acesso à missão recebe a recusa uniforme, sem gravar denúncia', async () => {
    const cenario = await publishedTeacherQuest();
    const alunoDeFora = await makeStudent(); // nunca matriculado, nunca abriu

    await loginAs(alunoDeFora.id);
    const outcome = await reportQuest({ questSlug: cenario.questSlug, reason: 'Motivo qualquer.' });

    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') expect(outcome.reason).toBe('Essa missão não existe.');

    const count = await db.questReport.count({ where: { questSlug: cenario.questSlug } });
    expect(count).toBe(0);
  });
});

// Encerra a sessão mockada no fim, para não deixar cookie pendurado entre suítes.
afterAll(async () => {
  await logout();
});
