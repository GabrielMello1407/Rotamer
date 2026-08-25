import type { RDKitLoader } from '@rdkit/rdkit';

/**
 * Carrega o RDKit direto do pacote npm. **Só no Node** — nos testes do núcleo e
 * em qualquer uso de linha de comando.
 *
 * Este módulo fica separado de propósito: o bundle do pacote fala com o sistema
 * de arquivos, e se ele fosse alcançável a partir do worker, o empacotador do
 * navegador tentaria arrastar `node:fs` para dentro do chunk.
 */
export async function packageFactory(): Promise<RDKitLoader> {
  const imported = (await import('@rdkit/rdkit')) as unknown as { default: RDKitLoader };
  return imported.default;
}
