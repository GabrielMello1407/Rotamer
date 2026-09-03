import 'server-only';
import type { Assessable, Goal } from '@rotamer/quests';
import { findQuest } from '@rotamer/quests';
import { db } from './db';

/**
 * Resolução de missão pelo `slug` — catálogo ou professor (D-25, §3.4).
 *
 * `Attempt.questSlug`, `QuestOpen.questSlug` e `AssignmentItem.questSlug`
 * continuam sendo uma `String` só, com espaço de nomes:
 *
 * ```
 * missão do catálogo   →  primeiro-traco          (nunca contém `:`)
 * missão do professor  →  professor:clx8k2m0000...
 * ```
 *
 * Despacha **pelo prefixo**, nunca "tenta catálogo, depois banco": um
 * `fallback` deixaria uma missão de professor sombrear um slug de catálogo
 * (ou o contrário). Os dois espaços nunca se cruzam — é o pacote `quests` que
 * trava `:` fora de um slug de catálogo.
 */

const TEACHER_QUEST_PREFIX = 'professor:';

/** O formato de `cuid` que o Prisma gera — minúsculo, sem traço, sem prefixo. */
const TEACHER_QUEST_ID = /^[a-z0-9]{20,32}$/;

export async function resolveQuest(slug: string): Promise<Assessable | null> {
  if (slug.startsWith(TEACHER_QUEST_PREFIX)) {
    const id = slug.slice(TEACHER_QUEST_PREFIX.length);

    // Formato errado nunca toca o banco: uma consulta a mais por tentativa de
    // slug forjado é uma consulta que não precisava existir.
    if (!TEACHER_QUEST_ID.test(id)) return null;

    const row = await db.teacherQuest.findUnique({
      where: { id },
      // R-3: `answerMolblock` e `answerInchiKey` não entram aqui. `goals` é a
      // única coisa de química que este `select` carrega, e ela já nasceu da
      // regeneração de `extractGoals` no momento de salvar (R-1) — nunca do
      // que alguém digitou depois.
      select: { id: true, goals: true },
    });

    if (row === null) return null;

    // `goals` é escrito só por `createTeacherQuest`, nunca por entrada de
    // cliente (R-1): confiar na forma aqui não reabre a trava, ela já foi
    // imposta na escrita. `Json` do Prisma não overlapa com `Goal[]` o
    // bastante para uma conversão direta — daí o `unknown` no meio.
    return { slug, goals: row.goals as unknown as readonly Goal[] };
  }

  return findQuest(slug) ?? null;
}

/**
 * Se uma conta tem acesso a este `slug` — a cadeia do R-7, com o segundo
 * caminho do D-27 (corrigido em 28/08/2026, no mesmo dia).
 *
 * O catálogo de missões do **produto** continua livre (§9.3): qualquer conta
 * logada ou não abre missão de catálogo. Uma missão `professor:` é visível
 * por **três** caminhos, qualquer um basta:
 *
 * 1. **Matrícula.** Matrícula viva → turma não arquivada → lista publicada e
 *    não arquivada → item com este slug.
 * 2. **Catálogo (D-27).** `TeacherQuest.catalogedAt` não nulo e `archivedAt`
 *    nulo — o professor decidiu compartilhar esta missão com qualquer conta,
 *    de qualquer turma.
 * 3. **Autoria.** `teacherId === profileId` — quem escreveu a missão sempre
 *    alcança o que escreveu, publicada ou não, arquivada ou não. Achado 5 da
 *    terceira revisão: sem este caminho, o autor não conseguia ver nem testar
 *    a própria missão pelos caminhos de aluno (`readQuestDetail`, `openQuest`,
 *    `saveAttempt`, `askTutor`) antes de publicá-la em alguma lista.
 *
 * **"Já abriu" não é caminho de acesso.** A primeira implementação tratava
 * `QuestOpen` como concessão vitalícia — bastava abrir uma vez para nunca
 * mais perder o acesso, mesmo com o professor retirando do catálogo ou
 * arquivando a lista. Isso anulava a R-7 por completo: histórico de
 * tentativa (`Attempt`, `QuestOpen`) registra o que aconteceu, nunca é
 * chave de autorização. **Retirar do catálogo encerra o acesso pelo
 * catálogo**: quem só chegava por ali deixa de alcançar a missão; quem
 * chega por uma lista publicada da própria turma continua, porque o
 * caminho 1 continua valendo.
 *
 * **Cinco portas chamam esta função** — nunca reimplementam a cadeia:
 * `saveAttempt`, `openQuest` (`attempt.ts`), a leitura da missão pelo aluno e
 * `reportQuest` (`assignment.ts`), e `askTutor` (`tutor.ts`).
 */
export async function studentQuestAccess(profileId: string, slug: string): Promise<boolean> {
  if (!slug.startsWith(TEACHER_QUEST_PREFIX)) return true;

  const id = slug.slice(TEACHER_QUEST_PREFIX.length);

  // Formato errado nunca toca o banco — mesma defesa de `resolveQuest`.
  if (!TEACHER_QUEST_ID.test(id)) return false;

  const [viaEnrollment, viaCatalog, viaAuthorship] = await Promise.all([
    db.assignmentItem.findFirst({
      where: {
        questSlug: slug,
        assignment: {
          publishedAt: { not: null },
          archivedAt: null,
          classroom: {
            archivedAt: null,
            enrollments: { some: { profileId } },
          },
        },
      },
      select: { id: true },
    }),
    db.teacherQuest.findFirst({
      where: { id, catalogedAt: { not: null }, archivedAt: null },
      select: { id: true },
    }),
    db.teacherQuest.findFirst({
      where: { id, teacherId: profileId },
      select: { id: true },
    }),
  ]);

  return viaEnrollment !== null || viaCatalog !== null || viaAuthorship !== null;
}
