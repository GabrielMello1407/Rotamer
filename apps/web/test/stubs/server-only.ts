/**
 * Substituto do pacote `server-only` nos testes.
 *
 * O pacote de verdade existe para quebrar o build quando um módulo de servidor
 * é importado no cliente — é uma guarda de empacotamento, não código. Fora do
 * Next ele não resolve, então o teste usa este vazio e a guarda continua valendo
 * onde importa.
 */
export {};
