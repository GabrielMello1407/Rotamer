import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import type { ReactElement, ReactNode } from 'react';
import { Telemetry } from './components/Telemetry';
import '@rotamer/ui/tokens.css';
import '@rotamer/ui/base.css';

/** Display — tem o peso industrial de sinalização de laboratório. */
const displayFont = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

/** Interface — herança de engenharia, usada em software científico. */
const uiFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

/** Todo número e toda fórmula. */
const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Rotamer — desenhe uma molécula em 2D, descubra o que ela é em 3D',
  description:
    'Química orgânica e medicinal no mesmo motor: validação determinística pelo RDKit, geometria calculada e IA como tutora, nunca como juíza.',
  icons: { icon: '/rotamer-favicon.svg' },
};

/**
 * Aplica o tema escolhido antes da primeira pintura. Sem isto a página pisca no
 * tema do sistema antes de trocar para o que a pessoa escolheu.
 *
 * Três estados: claro, escuro e o padrão "sistema", que não marca nada e deixa
 * o `prefers-color-scheme` decidir.
 */
const THEME_BEFORE_PAINT = `
try {
  var choice = localStorage.getItem('rotamer-theme');
  if (choice === 'light' || choice === 'dark') {
    document.documentElement.setAttribute('data-theme', choice);
  }
} catch (error) {}
`;

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const fontVariables = [
    displayFont.variable,
    uiFont.variable,
    monoFont.variable,
  ].join(' ');

  return (
    <html lang="pt-BR" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BEFORE_PAINT }} />
        <Telemetry />
      </head>
      <body cz-shortcut-listen="true">{children}</body>
    </html>
  );
}
