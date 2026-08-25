/**
 * O worker de química. Sanitização, descritores e — a partir da Fase 1 —
 * conformação acontecem aqui dentro, nunca na thread principal: o desenho
 * precisa continuar a 60 fps enquanto o RDKit trabalha.
 *
 * O app cria este worker e conversa com ele pelo cliente em `client.ts`.
 */
import * as Comlink from 'comlink';
import { chemistryApi } from './api';
import { READY_MESSAGE } from './protocol';

Comlink.expose(chemistryApi);

// O bundler carrega este módulo de dentro de um bootstrap assíncrono, então há
// uma janela em que o worker existe mas ninguém está ouvindo. Mensagem enviada
// nessa janela se perde e a chamada fica pendurada para sempre — por isso o
// cliente espera este aviso antes de falar qualquer coisa.
postMessage(READY_MESSAGE);
