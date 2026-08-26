/**
 * Marcar um momento do produto.
 *
 * São os pontos em que vale saber se a pessoa chegou: cumpriu missão, guardou
 * molécula, pediu ajuda ao tutor. Nada além do nome do momento viaja — nem a
 * molécula, nem quem estava na frente da tela.
 *
 * Sem telemetria configurada, a função não faz nada. É a mesma regra do tutor:
 * o produto funciona inteiro sem os serviços de fora.
 */

/** Os momentos que valem medir. A lista fechada evita evento inventado no meio do código. */
export type Moment =
  | 'primeira-molecula'
  | 'missao-cumprida'
  | 'molecula-guardada'
  | 'tutor-pedido'
  | 'exemplo-carregado';

interface UmamiWindow {
  umami?: { track: (event: string) => void };
}

export function track(moment: Moment): void {
  if (typeof window === 'undefined') return;

  const umami = (window as unknown as UmamiWindow).umami;
  if (!umami) return;

  try {
    umami.track(moment);
  } catch {
    // Medir não pode quebrar o que está sendo medido.
  }
}
