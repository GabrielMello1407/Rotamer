/**
 * O combinado entre a thread principal e o worker, fora do Comlink.
 *
 * É só um aviso de "já estou ouvindo": o Comlink cuida do resto da conversa.
 */
export const READY_MESSAGE = 'rotamer:chemistry-ready';

/** Quanto tempo esperar o worker dar sinal antes de desistir. */
export const READY_TIMEOUT_MS = 30_000;
