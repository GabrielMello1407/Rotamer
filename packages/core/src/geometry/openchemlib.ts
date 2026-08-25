import type * as OCLNamespace from 'openchemlib';

/** O módulo do OpenChemLib, com as tabelas do MMFF94 já registradas. */
export type OpenChemLib = typeof OCLNamespace;

export interface OpenChemLibOptions {
  /**
   * Como registrar os recursos estáticos do OpenChemLib — as tabelas de
   * parâmetros do MMFF94, que vêm num JSON separado do código.
   *
   * No Node dá para ler do disco; no navegador o worker busca o arquivo que o
   * app serve. Quem sabe disso é o ambiente, não o núcleo.
   */
  readonly registerResources?: (ocl: OpenChemLib) => Promise<void> | void;
}

let loading: Promise<OpenChemLib> | null = null;
let defaultOptions: OpenChemLibOptions = {};

/** Diz como carregar as tabelas. Precisa vir antes da primeira geometria. */
export function configureGeometry(options: OpenChemLibOptions): void {
  defaultOptions = options;
}

/**
 * Carrega o OpenChemLib uma única vez por contexto.
 *
 * O RDKit continua respondendo toda pergunta química — validade, valência,
 * aromaticidade, descritores. O OpenChemLib entra só depois disso, para
 * transformar uma estrutura **já sanitizada** em coordenadas. Ver `DECISOES.md`
 * D-10.
 */
export async function loadOpenChemLib(options?: OpenChemLibOptions): Promise<OpenChemLib> {
  const effective: OpenChemLibOptions = { ...defaultOptions, ...options };

  loading ??= (async () => {
    const ocl = await import('openchemlib');

    if (effective.registerResources) {
      await effective.registerResources(ocl);
    }

    return ocl;
  })();

  return loading;
}
