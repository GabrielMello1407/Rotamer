import { generateGeometry } from '../geometry/conformer';
import { configureGeometry } from '../geometry/openchemlib';
import type { Geometry } from '../geometry/types';
import { analyze } from './analysis';
import { scriptFactory } from './browser';
import { configureRDKit, loadRDKit, rdkitVersion } from './rdkit';
import type { AnalysisResult, ChemistryError } from './types';

/** Geometria pronta, ou o motivo químico de a molécula não existir. */
export type GeometryResult =
  | { readonly ok: true; readonly inchiKey: string; readonly geometry: Geometry }
  | { readonly ok: false; readonly error: ChemistryError };

/**
 * Superfície que o worker expõe. Tudo aqui é assíncrono do ponto de vista de
 * quem chama, porque atravessa a fronteira do worker via Comlink.
 */
export interface ChemistryApi {
  /**
   * Diz onde o app serve os arquivos do motor: `RDKit_minimal.js`,
   * `RDKit_minimal.wasm` e `ocl-resources.json`. Só tem efeito antes da
   * primeira carga.
   */
  configure(baseUrl: string): void;
  /** Carrega o RDKit e devolve a versão. Chamado depois da primeira pintura. */
  warmUp(): Promise<string>;
  /** Sanitiza a estrutura e devolve descritores, ou o erro em português. */
  analyze(input: string): Promise<AnalysisResult>;
  /** Conformação 3D e quadros do dobramento. Só para estrutura válida. */
  geometry(input: string): Promise<GeometryResult>;
}

/**
 * Cache por InChIKey.
 *
 * Descritores e conformação são função pura do grafo: a mesma molécula não pode
 * ser calculada duas vezes. A InChIKey é a chave certa porque duas estruturas
 * desenhadas de jeitos diferentes que sejam a mesma molécula caem no mesmo lugar.
 */
const MAX_CACHED = 64;
const geometryCache = new Map<string, Geometry>();
const analysisCache = new Map<string, AnalysisResult>();

function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, value);
  return value;
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

    configureGeometry({
      registerResources: (ocl) => ocl.Resources.registerFromUrl(`${base}ocl-resources.json`),
    });
  },

  async warmUp(): Promise<string> {
    await loadRDKit();
    return rdkitVersion();
  },

  async analyze(input: string): Promise<AnalysisResult> {
    const cached = analysisCache.get(input);
    if (cached) return cached;

    return remember(analysisCache, input, await analyze(input));
  },

  async geometry(input: string): Promise<GeometryResult> {
    // A geometria só existe para molécula que o RDKit aceitou. É a ordem que
    // garante que nada tridimensional aparece na tela sem ter passado pelo
    // motor determinístico.
    const analysis = await chemistryApi.analyze(input);
    if (!analysis.ok) return { ok: false, error: analysis.error };

    const { inchiKey, molblock } = analysis.molecule;

    const cached = geometryCache.get(inchiKey);
    if (cached) return { ok: true, inchiKey, geometry: cached };

    const geometry = await generateGeometry(molblock);
    return { ok: true, inchiKey, geometry: remember(geometryCache, inchiKey, geometry) };
  },
};
