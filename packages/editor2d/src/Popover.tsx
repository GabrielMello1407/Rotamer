'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Popover.module.css';

export interface PopoverProps {
  /** O botão que abriu — é dele que a caixa sai. */
  readonly anchor: HTMLElement | null;
  readonly label: string;
  readonly onClose: () => void;
  readonly className?: string | undefined;
  readonly testId?: string | undefined;
  readonly children: ReactNode;
}

/**
 * A caixa que sai de um botão.
 *
 * Antes disto, a tabela periódica e a folha de atalhos eram modais de tela
 * cheia: escureciam a bancada inteira para mostrar uma grade e uma lista. Modal
 * é para decisão que não pode esperar; escolher silício é escolha comum, feita
 * no meio do desenho, e a molécula tem que continuar visível enquanto se
 * escolhe.
 *
 * Ela sai por portal porque a barra de ferramentas é uma caixa pequena e
 * transformada — dentro dela, `position: fixed` passa a se medir pela barra em
 * vez da janela.
 */

/** Folga da borda da janela e distância do botão. */
const MARGIN = 8;
const GAP = 10;

export function Popover({
  anchor,
  label,
  onClose,
  className,
  testId,
  children,
}: PopoverProps): ReactElement {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Onde a caixa cabe.
   *
   * Ao lado do botão, do lado que tem espaço — a barra fica na borda esquerda,
   * então quase sempre é à direita. Sem espaço dos dois lados (celular
   * estreito), ela centraliza e o assunto passa a ser caber, não apontar.
   */
  const settle = useCallback((): void => {
    const box = boxRef.current;
    if (!box) return;

    const size = box.getBoundingClientRect();
    const room = { width: window.innerWidth, height: window.innerHeight };
    const from = anchor?.getBoundingClientRect() ?? null;

    if (from === null) {
      setPlace({
        left: Math.max(MARGIN, (room.width - size.width) / 2),
        top: Math.max(MARGIN, (room.height - size.height) / 2),
      });
      return;
    }

    const right = from.right + GAP;
    const left = from.left - GAP - size.width;

    const x =
      right + size.width + MARGIN <= room.width
        ? right
        : left >= MARGIN
          ? left
          : Math.max(MARGIN, (room.width - size.width) / 2);

    // Alinhada pelo meio do botão, e presa dentro da janela: a caixa é mais alta
    // que o botão e sairia pela borda de baixo em quase toda posição do trilho.
    const middle = from.top + from.height / 2 - size.height / 2;
    const y = Math.min(Math.max(MARGIN, middle), Math.max(MARGIN, room.height - size.height - MARGIN));

    setPlace({ left: x, top: y });
  }, [anchor]);

  useLayoutEffect(settle, [settle, mounted, children]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };

    // Clique fora fecha — inclusive no próprio botão, que já vai fechar por
    // conta própria; por isso o botão que abre não conta como fora.
    const onDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (boxRef.current?.contains(target) === true) return;
      if (anchor?.contains(target) === true) return;

      onClose();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('resize', settle);
    window.addEventListener('scroll', settle, true);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('resize', settle);
      window.removeEventListener('scroll', settle, true);
    };
  }, [anchor, onClose, settle]);

  if (!mounted) return <></>;

  return createPortal(
    <div
      ref={boxRef}
      className={[styles.popover, className].filter(Boolean).join(' ')}
      style={{
        left: `${String(place?.left ?? 0)}px`,
        top: `${String(place?.top ?? 0)}px`,
        // Antes da primeira medida a caixa existe mas não é mostrada: senão ela
        // pisca no canto superior esquerdo antes de achar o lugar.
        visibility: place === null ? 'hidden' : 'visible',
      }}
      role="dialog"
      aria-label={label}
      data-testid={testId}
    >
      {children}
    </div>,
    document.body,
  );
}
