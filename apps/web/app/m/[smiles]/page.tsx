import { Formula, Label, Logo, NumberValue, SourceBadge } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { readName } from '../../actions/naming';
import { analyzeOnServer, depictOnServer } from '../../../lib/chemistry-server';
import { decodeSmiles } from '../../../lib/molecule-url';
import styles from './page.module.css';

interface PageProps {
  readonly params: Promise<{ readonly smiles: string }>;
}

/**
 * A página pública de uma molécula.
 *
 * Renderizada no servidor, com o SMILES na própria URL: não existe banco por
 * trás e não precisa existir — a molécula é função pura da cadeia que está no
 * endereço. É o link que o professor manda no grupo da turma, e é o que traz
 * busca orgânica.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { smiles } = await params;
  const analysis = await analyzeOnServer(decodeSmiles(smiles));

  if (!analysis.ok) {
    return {
      title: 'Estrutura inválida · Rotamer',
      description: analysis.error.message,
    };
  }

  const { molecule } = analysis;
  const grupos = molecule.groups.map((group) => group.name).join(', ');
  const massa = molecule.descriptors.molarMass.toFixed(2).replace('.', ',');

  const description = `${molecule.formula} · ${massa} g/mol${grupos === '' ? '' : ` · ${grupos}`}. Descritores calculados pelo RDKit.`;

  return {
    title: `${molecule.formula} · Rotamer`,
    description,
    openGraph: {
      title: `${molecule.formula} — ${massa} g/mol`,
      description,
      type: 'article',
    },
  };
}

export default async function MoleculePage({ params }: PageProps): Promise<ReactElement> {
  const { smiles } = await params;
  const input = decodeSmiles(smiles);

  const [analysis, depiction] = await Promise.all([
    analyzeOnServer(input),
    depictOnServer(input),
  ]);

  // O apelido é autoria dentro do Rotamer, e aparece sempre com quem deu.
  const named = analysis.ok ? await readName(analysis.molecule.inchiKey) : null;

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.identity} href="/">
          <Logo size={32} decorative />
          <span className={styles.wordmark}>Rotamer</span>
        </Link>
        <SourceBadge source="computed" />
      </header>

      {!analysis.ok ? (
        <p className={styles.error} data-testid="erro-quimico">
          {analysis.error.message}
        </p>
      ) : (
        <>
          <div className={styles.headline}>
            <span data-testid="formula">
              <Formula value={analysis.molecule.formula} className={styles.formula} />
            </span>
            <NumberValue value={analysis.molecule.descriptors.molarMass} unit="g/mol" />
          </div>

          {named !== null && (
            <p className={styles.named} data-testid="apelido">
              <span className={styles.namedName}>{named.name}</span>
              <span className={styles.namedBy}>
                apelido dado por {named.by} dentro do Rotamer — não é nomenclatura
              </span>
            </p>
          )}

          <div className={styles.stage}>
            {depiction !== null && (
              <div
                className={styles.depiction}
                data-testid="desenho"
                // O SVG vem do próprio RDKit, gerado aqui no servidor a partir
                // da estrutura já sanitizada — não é conteúdo de terceiro.
                dangerouslySetInnerHTML={{ __html: depiction }}
              />
            )}

            <div>
              <div className={styles.facts}>
                <div className={styles.fact}>
                  <Label>TPSA</Label>
                  <NumberValue value={analysis.molecule.descriptors.tpsa} unit="Å²" />
                </div>
                <div className={styles.fact}>
                  <Label>logP</Label>
                  <NumberValue value={analysis.molecule.descriptors.logP} />
                </div>
                <div className={styles.fact}>
                  <Label>rotacionáveis</Label>
                  <NumberValue
                    value={analysis.molecule.descriptors.rotatableBonds}
                    decimals={0}
                  />
                </div>
                <div className={styles.fact}>
                  <Label>anéis aromáticos</Label>
                  <NumberValue
                    value={analysis.molecule.descriptors.aromaticRings}
                    decimals={0}
                  />
                </div>
                <div className={styles.fact}>
                  <Label>estereocentros</Label>
                  <span className={styles.stereo} data-testid="estereocentros">
                    <NumberValue
                      value={analysis.molecule.descriptors.stereocenters}
                      decimals={0}
                    />
                    {analysis.molecule.descriptors.unspecifiedStereocenters > 0 && (
                      <span className={styles.stereoNote}>sem configuração</span>
                    )}
                  </span>
                </div>

                <div className={styles.fact}>
                  <Label>doadores de H</Label>
                  <NumberValue value={analysis.molecule.descriptors.hbDonors} decimals={0} />
                </div>
                <div className={styles.fact}>
                  <Label>aceitadores de H</Label>
                  <NumberValue value={analysis.molecule.descriptors.hbAcceptors} decimals={0} />
                </div>
              </div>

              {analysis.molecule.groups.length > 0 && (
                <div className={styles.codes}>
                  <div>
                    <Label>grupos funcionais</Label>
                    <div className={styles.groups} data-testid="grupos">
                      {analysis.molecule.groups.map((group) => (
                        <span key={group.id} className={styles.group}>
                          {group.name}
                          {group.count > 1 ? ` ×${String(group.count)}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.codes}>
                <div>
                  <Label>SMILES</Label>
                  <p className={styles.code}>{analysis.molecule.smiles}</p>
                </div>
                <div>
                  <Label>InChIKey</Label>
                  <p className={styles.code}>{analysis.molecule.inchiKey}</p>
                </div>
              </div>

              <p className={styles.actions} style={{ marginTop: 'var(--sp-5)' }}>
                <Link
                  className={styles.link}
                  href={`/?smiles=${encodeURIComponent(analysis.molecule.smiles)}`}
                >
                  Abrir esta molécula no editor →
                </Link>
              </p>
            </div>
          </div>
        </>
      )}

      <footer className={styles.footer}>
        <span>
          Todos os números desta página foram calculados pelo RDKit a partir da estrutura. Nada
          aqui passou por modelo de linguagem.
        </span>
        <span>Rotamer · código aberto, licença MIT. Química por RDKit (BSD-3-Clause).</span>
      </footer>
    </main>
  );
}
