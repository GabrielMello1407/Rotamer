import { ImageResponse } from 'next/og';
import { analyzeOnServer } from '../../../lib/chemistry-server';
import { decodeSmiles } from '../../../lib/molecule-url';
import { OG } from '../../../lib/og-palette';

/**
 * A imagem que aparece quando o link é colado no grupo da turma.
 *
 * Sem ela, o professor manda o endereço e o WhatsApp mostra um retângulo cinza.
 * O que vai na figura são os mesmos números da página — calculados pelo RDKit,
 * nenhum deles escrito à mão.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Fórmula e descritores da molécula, calculados pelo RDKit';

interface ImageProps {
  readonly params: Promise<{ readonly smiles: string }>;
}

/** Separa `C9H8O4` em letras e números, para o índice sair menor. */
function formulaParts(formula: string): { text: string; sub: boolean }[] {
  return (formula.match(/\d+|\D+/g) ?? []).map((piece) => ({
    text: piece,
    sub: /^\d+$/.test(piece),
  }));
}

export default async function OpenGraphImage({ params }: ImageProps): Promise<ImageResponse> {
  const { smiles } = await params;
  const analysis = await analyzeOnServer(decodeSmiles(smiles));

  const number = (value: number, decimals: number): string =>
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  const facts = analysis.ok
    ? [
        {
          label: 'MASSA MOLAR',
          value: `${number(analysis.molecule.descriptors.molarMass, 2)} g/mol`,
        },
        { label: 'TPSA', value: `${number(analysis.molecule.descriptors.tpsa, 2)} Å²` },
        // `logP` é símbolo, não sigla: passar por caixa alta viraria outra coisa.
        { label: 'logP', value: number(analysis.molecule.descriptors.logP, 2) },
        {
          label: 'ANÉIS AROMÁTICOS',
          value: number(analysis.molecule.descriptors.aromaticRings, 0),
        },
      ]
    : [];

  const groups = analysis.ok ? analysis.molecule.groups.slice(0, 4) : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: OG.background,
          color: OG.ink,
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* A marca: a projeção de Newman, com a frente em turquesa. */}
          <svg width="52" height="52" viewBox="0 0 96 96">
            <g stroke={OG.ink} strokeWidth="5" strokeLinecap="round">
              <line x1="70.52" y1="35" x2="83.51" y2="27.5" />
              <line x1="48" y1="74" x2="48" y2="89" />
              <line x1="25.48" y1="35" x2="12.49" y2="27.5" />
            </g>
            <circle cx="48" cy="48" r="26" fill="none" stroke={OG.ink} strokeWidth="5" />
            <g stroke={OG.brand} strokeWidth="5" strokeLinecap="round">
              <line x1="48" y1="48" x2="48" y2="22" />
              <line x1="48" y1="48" x2="70.52" y2="61" />
              <line x1="48" y1="48" x2="25.48" y2="61" />
            </g>
          </svg>
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em' }}>Rotamer</span>
        </div>

        {analysis.ok ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {formulaParts(analysis.molecule.formula).map((part, index) => (
                <span
                  key={`${String(index)}-${part.text}`}
                  style={{
                    fontSize: part.sub ? 78 : 116,
                    lineHeight: 1,
                    paddingBottom: part.sub ? 12 : 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {part.text}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 44 }}>
              {facts.map((fact) => (
                <div key={fact.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 20,
                      color: OG.inkSoft,
                      letterSpacing: '0.11em',
                    }}
                  >
                    {fact.label}
                  </span>
                  <span style={{ fontSize: 36 }}>{fact.value}</span>
                </div>
              ))}
            </div>

            {groups.length > 0 && (
              <div style={{ display: 'flex', gap: 12 }}>
                {groups.map((group) => (
                  <span
                    key={group.id}
                    style={{
                      fontSize: 24,
                      color: OG.brandInk,
                      background: OG.surface,
                      border: `1px solid ${OG.line}`,
                      borderRadius: 999,
                      padding: '8px 20px',
                    }}
                  >
                    {group.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
            <span style={{ fontSize: 44, lineHeight: 1.2 }}>{analysis.error.message}</span>
          </div>
        )}

        <span style={{ fontSize: 22, color: OG.inkSoft }}>
          Calculado pelo RDKit. Nada aqui passou por modelo de linguagem.
        </span>
      </div>
    ),
    size,
  );
}
