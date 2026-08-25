import { analyze } from './analysis';
import { scriptFactory } from './browser';
import { configureRDKit, loadRDKit, rdkitVersion } from './rdkit';
import type { AnalysisResult } from './types';

/**
 * Superfície que o worker expõe. Tudo aqui é assíncrono do ponto de vista de
 * quem chama, porque atravessa a fronteira do worker via Comlink.
 */
export interface ChemistryApi {
  /**
   * Diz onde o app serve o RDKit — a pasta que tem `RDKit_minimal.js` e
   * `RDKit_minimal.wasm`. Só tem efeito antes da primeira carga.
   */
  configure(baseUrl: string): void;
  /** Carrega o RDKit e devolve a versão. Chamado depois da primeira pintura. */
  warmUp(): Promise<string>;
  /** Sanitiza a estrutura e devolve descritores, ou o erro químico em português. */
  analyze(input: string): Promise<AnalysisResult>;
}

/**
 * Implementação viva da API. Roda no worker e também em teste de linha de
 * comando — é isso que mantém a química verificável sem navegador.
 */
export const chemistryApi: ChemistryApi = {
  configure(baseUrl: string): void {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    configureRDKit({
      locateWasm: () => `${base}RDKit_minimal.wasm`,
      loadFactory: scriptFactory(`${base}RDKit_minimal.js`),
    });
  },

  async warmUp(): Promise<string> {
    await loadRDKit();
    return rdkitVersion();
  },

  analyze(input: string): Promise<AnalysisResult> {
    return analyze(input);
  },
};
