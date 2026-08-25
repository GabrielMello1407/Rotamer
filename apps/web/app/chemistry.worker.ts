/**
 * Entrada do worker de química no app.
 *
 * O worker de verdade mora em `@rotamer/core` — aqui só existe o ponto que o
 * bundler entende como "isto vira um arquivo de worker". A thread principal
 * nunca importa este módulo diretamente: ela cria o worker e conversa por
 * Comlink.
 */
import '@rotamer/core/chemistry/worker';
