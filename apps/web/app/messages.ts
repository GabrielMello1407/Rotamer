import { dictionary } from '@rotamer/i18n';

/**
 * O texto que o produto mostra antes de qualquer tela: título e descrição da
 * aba, do buscador e do cartão de link.
 *
 * Fica no servidor, em `generateMetadata`, e por isso sai já no idioma que o
 * cookie ou o `Accept-Language` pediu — quem chega pelo buscador lê isto antes
 * de ver um átomo.
 */
export const siteMessages = dictionary({
  'pt-BR': {
    title: 'Rotamer — desenhe uma molécula em 2D, descubra o que ela é em 3D',
    description:
      'Química orgânica e medicinal no mesmo motor: validação determinística pelo RDKit, geometria calculada e IA como tutora, nunca como juíza.',
  },

  en: {
    title: 'Rotamer — draw a molecule in 2D, find out what it is in 3D',
    description:
      'Organic and medicinal chemistry on one engine: deterministic validation by RDKit, computed geometry, and AI as a tutor, never as a judge.',
  },
});
