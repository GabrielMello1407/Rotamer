import { dictionary, plural } from '@rotamer/i18n';

/**
 * O texto da estante — as moléculas que a conta guardou.
 *
 * `count` cita o rótulo real do botão "Guardar" (`SaveMolecule`, em
 * `apps/web/app/components/messages.ts`): a mesma palavra que aparece lá é a
 * que aparece aqui, nos dois idiomas.
 */
export const libraryMessages = dictionary({
  'pt-BR': {
    metaTitle: 'Minhas moléculas · Rotamer',
    metaDescription: 'As estruturas que você guardou.',
    heading: 'Minhas moléculas',
    empty: 'Nada guardado ainda. No editor, abra a análise e use "Guardar" para deixar uma estrutura aqui.',
    count: (n: number): string =>
      `${String(n)} ${plural(n, 'estrutura guardada', 'estruturas guardadas')}. Abrir traz o desenho de volta para o editor.`,
    note: 'O que fica guardado é o grafo. Fórmula, massa e descritores são derivados dele pelo RDKit e recalculados sempre que a molécula abre — nada aqui é um número guardado que possa envelhecer sozinho.',

    namedBy: (name: string): string => `batizada por ${name}`,
    publicPage: 'Página pública',
    removeConfirm: 'Tirar mesmo',
    cancel: 'Cancelar',
    removeFromShelf: 'Tirar da estante',
  },

  en: {
    metaTitle: 'My molecules · Rotamer',
    metaDescription: 'The structures you saved.',
    heading: 'My molecules',
    empty: 'Nothing saved yet. In the editor, open the analysis and use "Save" to keep a structure here.',
    count: (n: number): string =>
      `${String(n)} ${plural(n, 'saved structure', 'saved structures')}. Opening it brings the drawing back to the editor.`,
    note: 'What is saved is the graph. Formula, mass and descriptors are derived from it by RDKit and recalculated every time the molecule opens — nothing here is a saved number that can grow stale on its own.',

    namedBy: (name: string): string => `named by ${name}`,
    publicPage: 'Public page',
    removeConfirm: 'Remove it',
    cancel: 'Cancel',
    removeFromShelf: 'Remove from the shelf',
  },
});
