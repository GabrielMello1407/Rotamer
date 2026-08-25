import * as Comlink from 'comlink';
import type { ChemistryApi } from './api';
import { READY_MESSAGE, READY_TIMEOUT_MS } from './protocol';

/** A API do worker vista da thread principal: tudo vira promessa. */
export type ChemistryClient = Comlink.Remote<ChemistryApi>;

/**
 * Embrulha um worker já criado pelo app.
 *
 * Quem constrói o `Worker` é o app, não o núcleo — assim o `core` continua sem
 * conhecer bundler, caminho público nem DOM.
 */
export function connectChemistry(endpoint: Comlink.Endpoint): ChemistryClient {
  return Comlink.wrap<ChemistryApi>(endpoint);
}

/**
 * Espera o worker avisar que já está ouvindo.
 *
 * O bundler carrega o módulo do worker por um bootstrap assíncrono: existe uma
 * janela em que o `Worker` já foi criado mas ainda não há ninguém escutando, e
 * mensagem enviada nessa janela some sem erro nenhum. Sem esta espera, a
 * primeira chamada fica pendurada e a tela nunca sai de "carregando".
 *
 * Precisa ser chamada **antes** da primeira mensagem, para não perder o aviso.
 */
export function whenChemistryReady(
  endpoint: Comlink.Endpoint,
  timeoutMs: number = READY_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = (): void => {
      clearTimeout(timer);
      endpoint.removeEventListener('message', onMessage);
    };

    const onMessage = (event: unknown): void => {
      const data = (event as { data?: unknown }).data;
      if (data === READY_MESSAGE) {
        finish();
        resolve();
      }
    };

    const timer = setTimeout(() => {
      finish();
      reject(new Error('o worker de química não respondeu a tempo'));
    }, timeoutMs);

    endpoint.addEventListener('message', onMessage);
    endpoint.start?.();
  });
}
