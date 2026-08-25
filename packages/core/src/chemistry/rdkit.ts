import type { RDKitLoader, RDKitModule } from '@rdkit/rdkit';

/** Opções de carga do RDKit. */
export interface RDKitOptions {
  /** Caminho do arquivo `.wasm`. No Node ele fica ao lado do módulo. */
  readonly locateWasm?: () => string;
  /**
   * Como obter a fábrica do RDKit.
   *
   * Quem carrega o RDKit é sempre o ambiente, nunca o núcleo: no navegador o
   * worker busca o script servido pelo app; no Node os testes usam o pacote
   * npm. Assim o `core` não precisa saber em qual dos dois está rodando — e o
   * bundle Node do pacote, que fala com o sistema de arquivos, nunca aparece no
   * caminho do navegador.
   */
  readonly loadFactory?: () => Promise<RDKitLoader>;
}

let loading: Promise<RDKitModule> | null = null;
let defaultOptions: RDKitOptions = {};

/**
 * Define como e de onde carregar o RDKit. Precisa ser chamado antes da primeira
 * carga — no navegador, pelo worker; no Node, pelo teste.
 */
export function configureRDKit(options: RDKitOptions): void {
  defaultOptions = options;
}

/**
 * Carrega o RDKit uma única vez por contexto de execução.
 *
 * O módulo pesa alguns megabytes de WebAssembly: quem chama é sempre o worker,
 * depois da primeira pintura. A thread principal nunca espera por isto.
 */
export async function loadRDKit(options?: RDKitOptions): Promise<RDKitModule> {
  const effective: RDKitOptions = { ...defaultOptions, ...options };
  const { loadFactory } = effective;

  if (!loadFactory) {
    throw new Error(
      'O RDKit não foi configurado: chame configureRDKit dizendo como carregar a biblioteca.',
    );
  }

  loading ??= (async () => {
    const factory = await loadFactory();
    return effective.locateWasm ? factory({ locateFile: effective.locateWasm }) : factory();
  })();

  return loading;
}

/** Versão do RDKit em uso, ex.: `2025.03.4`. Aparece nos créditos. */
export async function rdkitVersion(): Promise<string> {
  const rdkit = await loadRDKit();
  return rdkit.version();
}
