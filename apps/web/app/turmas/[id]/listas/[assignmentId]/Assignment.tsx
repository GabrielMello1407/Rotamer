'use client';

import { Button } from '@rotamer/ui';
import { Popover } from '@rotamer/editor2d';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  addItem,
  archiveAssignment,
  moveItem,
  publishAssignment,
  publishToCatalog,
  readCatalog,
  removeItem,
  renameAssignment,
  unarchiveAssignment,
  withdrawFromCatalog,
  type AssignmentItemView,
} from '../../../../actions/assignment';
import { messages } from '../../../messages';
import { CatalogPicker } from './CatalogPicker';
import styles from './Assignment.module.css';

const TEACHER_PREFIX = 'professor:';

const WHEN = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

/** O tempo que o desfazer de "Remover" fica disponível — §6.2. */
const UNDO_MS = 8_000;

export interface AssignmentProps {
  readonly assignmentId: string;
  readonly classroomId: string;
  readonly classroomName: string;
  readonly studentCount: number;
  readonly initialTitle: string;
  readonly initialItems: readonly AssignmentItemView[];
  readonly initialPublishedAt: string | null;
  readonly archived: boolean;
  /** A faixa vinda de `.../criar` depois de salvar uma missão — §6.3(d). */
  readonly enteredNotice?: string | undefined;
}

/**
 * A lista, com o professor montando (§6.2 de `docs/ROTEIROS.md`).
 *
 * `items` e `publishedAt` não têm estado local próprio: eles são o que a
 * página do servidor mandou. Cada escrita (`moveItem`, `removeItem`,
 * `publishAssignment`…) termina em `router.refresh()`, que busca a lista de
 * novo e entrega props novas aqui — replicar isso num `useState` só criaria
 * uma segunda fonte de verdade que pode ficar velha.
 *
 * O estado de "está no catálogo" de cada missão própria também não vem de
 * `readAssignments` — essa leitura nunca devolveu `catalogedAt` (R-3 mantém o
 * `select` de `TeacherQuest` enxuto). Em vez de inventar o estado aqui, esta
 * tela pergunta a `readCatalog()` — a mesma leitura que a página `/catalogo`
 * usa — e cruza pelo slug: se a missão aparece lá, ela está publicada.
 */
export function Assignment({
  assignmentId,
  classroomId,
  classroomName,
  studentCount,
  initialTitle,
  initialItems,
  initialPublishedAt,
  archived,
  enteredNotice,
}: AssignmentProps): ReactElement {
  const router = useRouter();

  const items = initialItems;
  const publishedAt = initialPublishedAt;

  const [title, setTitle] = useState(initialTitle);
  /*
   * `readAssignments` só devolve lista com `archivedAt: null` (§5.2) — não
   * existe leitura que ache esta página depois de arquivada. Por isso o
   * estado vive aqui, local: arquivar não recarrega (recarregar bateria num
   * 404, porque o servidor deixou de achar a linha), e só desarquivar volta
   * a pedir dado novo ao servidor, quando a leitura volta a encontrá-la.
   */
  const [isArchived, setIsArchived] = useState(archived);
  const [catalogSlugs, setCatalogSlugs] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [removedNotice, setRemovedNotice] = useState<{ readonly title: string; readonly slug: string } | null>(
    null,
  );
  const removedTimer = useRef<number | undefined>(undefined);

  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogAnchor, setCatalogAnchor] = useState<HTMLElement | null>(null);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishAnchor, setPublishAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const teacherSlugs = items.map((item) => item.questSlug).filter((slug) => slug.startsWith(TEACHER_PREFIX));
    if (teacherSlugs.length === 0) return;

    let alive = true;
    void readCatalog().then((entries) => {
      if (!alive) return;
      setCatalogSlugs(new Set(entries.map((entry) => entry.slug)));
    });
    return () => {
      alive = false;
    };
  }, [items]);

  useEffect(() => () => window.clearTimeout(removedTimer.current), []);

  const saveTitle = (): void => {
    const trimmed = title.trim();
    if (trimmed.length < 2 || trimmed === initialTitle) return;
    void renameAssignment({ assignmentId, title: trimmed });
  };

  const move = (itemId: string, direction: 'up' | 'down'): void => {
    setError(null);
    void moveItem({ assignmentId, itemId, direction }).then((outcome) => {
      if (outcome.status === 'rejected') {
        setError(outcome.reason);
        return;
      }
      router.refresh();
    });
  };

  const remove = (item: AssignmentItemView): void => {
    setError(null);
    void removeItem({ assignmentId, itemId: item.id }).then((outcome) => {
      if (outcome.status === 'rejected') {
        setError(outcome.reason);
        return;
      }

      setRemovedNotice({ title: item.title, slug: item.questSlug });
      window.clearTimeout(removedTimer.current);
      removedTimer.current = window.setTimeout(() => {
        setRemovedNotice(null);
      }, UNDO_MS);
      router.refresh();
    });
  };

  const undoRemoval = (): void => {
    if (removedNotice === null) return;
    const { slug } = removedNotice;
    setRemovedNotice(null);

    void addItem({ assignmentId, questSlug: slug }).then(() => {
      router.refresh();
    });
  };

  const publish = (): void => {
    setError(null);
    void publishAssignment({ assignmentId }).then((outcome) => {
      setPublishOpen(false);
      if (outcome.status === 'rejected') {
        setError(outcome.reason);
        return;
      }
      router.refresh();
    });
  };

  const toggleArchive = (): void => {
    const wasArchived = isArchived;
    const action = wasArchived ? unarchiveAssignment : archiveAssignment;

    void action({ assignmentId }).then((outcome) => {
      if (outcome.status === 'rejected') {
        setError(outcome.reason);
        return;
      }
      setIsArchived(!wasArchived);
      // Só desarquivar pode pedir dado novo: arquivar tira esta lista do
      // alcance de `readAssignments`, e recarregar a página bateria num 404.
      if (wasArchived) router.refresh();
    });
  };

  const toggleCatalog = (slug: string): void => {
    const id = slug.slice(TEACHER_PREFIX.length);
    const onCatalog = catalogSlugs.has(slug);
    const action = onCatalog ? withdrawFromCatalog : publishToCatalog;

    void action({ teacherQuestId: id }).then((outcome) => {
      if (outcome.status === 'rejected') {
        setError(outcome.reason);
        return;
      }
      setCatalogSlugs((current) => {
        const next = new Set(current);
        if (onCatalog) next.delete(slug);
        else next.add(slug);
        return next;
      });
    });
  };

  const existingSlugs = useMemo(() => new Set(items.map((item) => item.questSlug)), [items]);

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.back} href={`/turmas/${classroomId}`}>
          ← {classroomName}
        </Link>
      </header>

      {enteredNotice !== undefined && (
        <p className={styles.enteredNotice} data-testid="missao-entrou-na-lista">
          {enteredNotice}
        </p>
      )}

      <label className={styles.nameField}>
        <input
          className={styles.nameInput}
          aria-label={messages.assignment.nameLabel}
          placeholder={messages.assignment.namePlaceholder}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          onBlur={saveTitle}
          data-testid="nome-da-lista"
        />
      </label>

      <p className={styles.status} data-testid="status-da-lista">
        {publishedAt === null
          ? messages.assignment.draftStatus(items.length)
          : messages.assignment.publishedStatus(WHEN.format(new Date(publishedAt)), items.length, studentCount)}
      </p>

      {isArchived && (
        <p className={styles.archivedNotice} data-testid="lista-arquivada">
          Esta lista foi arquivada. Ela some das duas telas até você desarquivar.
        </p>
      )}

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{messages.assignment.emptyTitle}</p>
          <p className={styles.emptyBody}>{messages.assignment.emptyBody}</p>
        </div>
      ) : (
        <ul className={styles.list} data-testid="itens-da-lista">
          {items.map((item, index) => (
            <li
              key={item.questSlug}
              className={styles.row}
              tabIndex={0}
              data-testid={`item-${item.questSlug}`}
              onKeyDown={(event) => {
                if (event.altKey && event.key === 'ArrowUp' && index > 0) {
                  event.preventDefault();
                  move(item.id, 'up');
                }
                if (event.altKey && event.key === 'ArrowDown' && index < items.length - 1) {
                  event.preventDefault();
                  move(item.id, 'down');
                }
              }}
            >
              <span className={styles.position}>{item.position}</span>

              <span className={styles.itemBody}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span
                  className={[styles.origin, item.origin === 'teacher' ? styles.originTeacher : null]
                    .filter(Boolean)
                    .join(' ')}
                  data-testid={`origem-${item.questSlug}`}
                >
                  {item.origin === 'teacher' ? messages.assignment.originTeacher : messages.assignment.originCatalog}
                </span>

                {item.origin === 'teacher' && (
                  <button
                    type="button"
                    className={styles.catalogToggle}
                    onClick={() => {
                      toggleCatalog(item.questSlug);
                    }}
                    data-testid={`alternar-catalogo-${item.questSlug}`}
                  >
                    {catalogSlugs.has(item.questSlug)
                      ? messages.assignment.withdrawFromCatalog
                      : messages.assignment.publishToCatalog}
                  </button>
                )}
              </span>

              <span className={styles.actions}>
                {index > 0 && (
                  <button
                    type="button"
                    className={styles.action}
                    title={`${messages.assignment.up} (Alt+↑)`}
                    aria-label={messages.assignment.upWithKey(item.title, item.position - 1)}
                    onClick={() => {
                      move(item.id, 'up');
                    }}
                  >
                    ↑
                  </button>
                )}
                {index < items.length - 1 && (
                  <button
                    type="button"
                    className={styles.action}
                    title={`${messages.assignment.down} (Alt+↓)`}
                    aria-label={messages.assignment.downWithKey(item.title, item.position + 1)}
                    onClick={() => {
                      move(item.id, 'down');
                    }}
                  >
                    ↓
                  </button>
                )}
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    remove(item);
                  }}
                  data-testid={`remover-${item.questSlug}`}
                >
                  {messages.assignment.remove}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {removedNotice !== null && (
        <p className={styles.undo} data-testid="desfazer-remocao">
          {messages.assignment.removed(removedNotice.title)}{' '}
          <button type="button" className={styles.undoButton} onClick={undoRemoval}>
            {messages.assignment.undo}
          </button>
        </p>
      )}

      {!isArchived && (
        <div className={styles.picks}>
          <span ref={setCatalogAnchor} className={styles.anchor}>
            <Button
              variant="secondary"
              onClick={() => {
                setCatalogOpen(true);
              }}
              data-testid="escolher-do-catalogo"
            >
              {messages.assignment.pickFromCatalog}
            </Button>
          </span>

          <Link href={`/turmas/${classroomId}/listas/${assignmentId}/criar`} data-testid="criar-missao-desenhando">
            <Button variant="secondary">{messages.assignment.createByDrawing}</Button>
          </Link>
        </div>
      )}

      {catalogOpen && (
        <CatalogPicker
          assignmentId={assignmentId}
          existingSlugs={existingSlugs}
          anchor={catalogAnchor}
          onClose={() => {
            setCatalogOpen(false);
          }}
          onAdded={() => {
            router.refresh();
          }}
        />
      )}

      {error !== null && (
        <p className={styles.error} data-testid="erro-lista">
          {error}
        </p>
      )}

      <div className={styles.footerRow}>
        <button
          type="button"
          className={styles.archiveLink}
          onClick={toggleArchive}
          data-testid="alternar-arquivo-lista"
        >
          {isArchived ? messages.assignment.unarchive : messages.assignment.archive}
        </button>

        {!isArchived && (
          <span ref={setPublishAnchor} className={styles.anchor}>
            <Button
              onClick={() => {
                setPublishOpen(true);
              }}
              disabled={items.length === 0}
              data-testid="publicar-para-turma"
            >
              {messages.assignment.publish}
            </Button>
          </span>
        )}
      </div>

      {publishedAt !== null && (
        <p className={styles.afterPublish} data-testid="aviso-pos-publicacao">
          {messages.publishPopover.afterPublish}
        </p>
      )}

      {publishOpen && (
        <Popover
          anchor={publishAnchor}
          label={messages.publishPopover.title(classroomName)}
          onClose={() => {
            setPublishOpen(false);
          }}
          testId="confirmar-publicacao"
        >
          <div className={styles.confirmBox}>
            <p className={styles.confirmTitle}>{messages.publishPopover.title(classroomName)}</p>
            <p className={styles.confirmBody}>{messages.publishPopover.body(items.length)}</p>
            <div className={styles.confirmActions}>
              <Button onClick={publish} data-testid="confirmar-publicar">
                {messages.publishPopover.confirm}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPublishOpen(false);
                }}
              >
                {messages.publishPopover.cancel}
              </Button>
            </div>
          </div>
        </Popover>
      )}
    </main>
  );
}
