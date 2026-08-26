import { Fragment, type ReactElement } from 'react';
import styles from './Formula.module.css';

export interface FormulaProps {
  /** Fórmula em notação de Hill vinda do núcleo, ex.: `C9H8O4`. */
  readonly value: string;
  readonly className?: string | undefined;
}

/**
 * Fórmula molecular com subscrito real. Nunca `C6H6` em texto corrido — o
 * número é índice, não parte do nome do elemento.
 */
export function Formula({ value, className }: FormulaProps): ReactElement {
  // A carga sai antes da contagem: nela o número é expoente, não índice, e
  // escrever NH₄₊ seria dizer outra coisa.
  const ion = /^(.*?)(\d*[+−-])$/.exec(value);
  const body = ion?.[1] ?? value;
  const charge = ion?.[2] ?? null;

  const parts = body.match(/\d+|\D+/g) ?? [];

  return (
    <span
      className={[styles.formula, className].filter(Boolean).join(' ')}
      aria-label={spoken(value)}
    >
      {parts.map((part, index) => (
        <Fragment key={`${String(index)}-${part}`}>
          {/^\d+$/.test(part) ? <sub>{part}</sub> : part}
        </Fragment>
      ))}

      {charge !== null && <sup>{charge.replace('-', '−')}</sup>}
    </span>
  );
}

/**
 * Leitura em voz alta: `C9H8O4` vira "C 9 H 8 O 4", e `H4N+` termina em
 * "positivo" — o sinal sozinho não é lido por leitor de tela nenhum.
 */
function spoken(value: string): string {
  const ion = /^(.*?)(\d*)([+−-])$/.exec(value);
  if (ion === null) return (value.match(/\d+|\D+/g) ?? []).join(' ');

  const [, body = '', size = '', sign = ''] = ion;
  const name = sign === '+' ? 'positivo' : 'negativo';

  return [(body.match(/\d+|\D+/g) ?? []).join(' '), size, name].filter(Boolean).join(' ');
}
