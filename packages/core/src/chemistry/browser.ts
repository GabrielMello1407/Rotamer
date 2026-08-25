import type { RDKitLoader } from '@rdkit/rdkit';

/** `importScripts` só existe dentro de um worker clássico — que é onde isto roda. */
declare function importScripts(...urls: string[]): void;

interface RDKitScope {
  initRDKitModule?: RDKitLoader;
}

/**
 * Busca o RDKit já compilado, servido pelo app como arquivo estático.
 *
 * O bundle do pacote npm fala com o sistema de arquivos do Node e não sobrevive
 * a nenhum empacotador de navegador. Carregar o script pronto é o caminho que a
 * própria RDKit.js documenta para a web — e mantém o `.js` e o `.wasm` sempre da
 * mesma versão, porque os dois são copiados de `node_modules` no build.
 */
export function scriptFactory(scriptUrl: string): () => Promise<RDKitLoader> {
  return () => {
    importScripts(scriptUrl);

    const scope = globalThis as RDKitScope;
    const factory = scope.initRDKitModule;

    if (typeof factory !== 'function') {
      return Promise.reject(new Error(`o script ${scriptUrl} não expôs initRDKitModule`));
    }

    return Promise.resolve(factory);
  };
}
