/**
 * O combinado entre a thread principal e o worker, fora do Comlink.
 *
 * É só um aviso de "já estou ouvindo": o Comlink cuida do resto da conversa.
 */
export const READY_MESSAGE = 'rotamer:chemistry-ready';

/**
 * Quanto tempo esperar o worker dar sinal antes de desistir.
 *
 * Um minuto porque a primeira carga em desenvolvimento compila o worker na hora,
 * e um celular fraco numa rede ruim também demora. Desistir cedo demais mostra
 * "não foi possível carregar" para quem só precisava de mais alguns segundos.
 */
export const READY_TIMEOUT_MS = 60_000;
