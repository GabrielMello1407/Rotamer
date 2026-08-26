import type { ReactElement } from 'react';

/**
 * Telemetria — Umami, auto-hospedado, sem cookie.
 *
 * Existe por um motivo só: sessão de observação sem instrumento vira anedota.
 * Dá para ver uma pessoa travar na frente da tela; não dá para saber se ela é a
 * regra. O que se mede é onde as pessoas param, não quem elas são.
 *
 * O que **não** vai daqui para lugar nenhum: e-mail, nome, molécula desenhada,
 * SMILES, InChIKey. Umami não usa cookie, não guarda endereço de IP completo e
 * o servidor é nosso, no mesmo VPS. Sem as duas variáveis de ambiente, este
 * componente não renderiza nada e o produto funciona igual.
 */
export function Telemetry(): ReactElement | null {
  const script = process.env['UMAMI_SCRIPT_URL'] ?? '';
  const website = process.env['UMAMI_WEBSITE_ID'] ?? '';

  if (script === '' || website === '') return null;

  return (
    <script
      defer
      src={script}
      data-website-id={website}
      // Quem pediu para não ser rastreado não é rastreado — e isso é decidido
      // no navegador, antes de qualquer pedido sair.
      data-do-not-track="true"
    />
  );
}
