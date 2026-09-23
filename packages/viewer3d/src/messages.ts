import { dictionary } from '@rotamer/i18n';

/**
 * O texto da cena.
 *
 * Quase tudo aqui é rótulo de botão que na tela aparece como ícone — e é
 * justamente por isso que ele existe: é o que o leitor de tela lê, e o que a
 * dica de foco mostra. Traduzir só o que está escrito na tela deixaria a cena
 * acessível em um idioma só.
 */
export const viewerMessages = dictionary({
  'pt-BR': {
    placeholder: 'Desenhe uma estrutura válida para ver a forma dela no espaço.',
    vibrate: 'Vibrar',
    spaceFilling: 'Preenchimento de espaço',
    spaceFillingShort: 'Volume',
    showHydrogens: 'Mostrar hidrogênios',
    recenter: 'Recentrar a cena',
    expand: 'Ampliar a cena',
    shrink: 'Reduzir a cena',
    sceneControls: 'Controles da cena',
    /** Elemento fora do MMFF94: a cena mostra a forma, mas não tem o que vibrar. */
    noVibration: (elements: string) =>
      `Sem vibração: o campo de força não conhece ${elements}`,
    someElement: 'este elemento',
    mode: (number: number) => `modo ${String(number)}`,
    leaveMode: 'Voltar para a vibração térmica',
    /** A forma saiu do gerador de conformações, sem o campo de força relaxar. */
    unrelaxed: (elements: string) =>
      `forma aproximada — sem parâmetro de MMFF94 para ${elements}`,
    dynamics: 'dinâmica',
    energy: 'energia',
    atoms: (n: number) => `${String(n)} ${n === 1 ? 'átomo' : 'átomos'}`,
    atom: (index: number) => `átomo ${String(index)}`,
  },

  en: {
    placeholder: 'Draw a valid structure to see its shape in space.',
    vibrate: 'Vibrate',
    spaceFilling: 'Space-filling',
    spaceFillingShort: 'Volume',
    showHydrogens: 'Show hydrogens',
    recenter: 'Recenter the scene',
    expand: 'Expand the scene',
    shrink: 'Shrink the scene',
    sceneControls: 'Scene controls',
    noVibration: (elements: string) => `No vibration: the force field does not know ${elements}`,
    someElement: 'this element',
    mode: (number: number) => `mode ${String(number)}`,
    leaveMode: 'Back to thermal vibration',
    unrelaxed: (elements: string) => `approximate shape — no MMFF94 parameter for ${elements}`,
    dynamics: 'dynamics',
    energy: 'energy',
    atoms: (n: number) => `${String(n)} ${n === 1 ? 'atom' : 'atoms'}`,
    atom: (index: number) => `atom ${String(index)}`,
  },
});
