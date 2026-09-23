import {
  chemistryErrorText,
  formatNumber,
  functionalGroupName,
  list,
  pick,
} from '@rotamer/i18n';
import { Formula, Label, Logo, NumberValue, SourceBadge } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { readName } from '../../actions/naming';
import { analyzeOnServer, depictOnServer } from '../../../lib/chemistry-server';
import { currentLocale } from '../../../lib/locale';
import { decodeSmiles } from '../../../lib/molecule-url';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { moleculeMessages } from './messages';
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
  const locale = await currentLocale();
  const m = pick(moleculeMessages, locale);
  const analysis = await analyzeOnServer(decodeSmiles(smiles));

  if (!analysis.ok) {
    return {
      title: m.invalidTitle,
      description: chemistryErrorText(locale, analysis.error),
    };
  }

  const { molecule } = analysis;
  const groups = list(
    locale,
    molecule.groups.map((group) => functionalGroupName(locale, group.id)),
  );
  const mass = formatNumber(locale, molecule.descriptors.molarMass, 2);
  const description = m.description(molecule.formula, mass, groups);

  return {
    title: m.title(molecule.formula),
    description,
    openGraph: {
      title: m.ogTitle(molecule.formula, mass),
      description,
      type: 'article',
    },
  };
}

export default async function MoleculePage({ params }: PageProps): Promise<ReactElement> {
  const { smiles } = await params;
  const locale = await currentLocale();
  const m = pick(moleculeMessages, locale);
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
        <span className={styles.end}>
          <LanguageSwitch />
          <SourceBadge source="computed" locale={locale} />
        </span>
      </header>

      {!analysis.ok ? (
        <p className={styles.error} data-testid="erro-quimico">
          {chemistryErrorText(locale, analysis.error)}
        </p>
      ) : (
        <>
          <div className={styles.headline}>
            <span data-testid="formula">
              <Formula value={analysis.molecule.formula} className={styles.formula} />
            </span>
            <NumberValue
              value={analysis.molecule.descriptors.molarMass}
              unit="g/mol"
              locale={locale}
            />
          </div>

          {named !== null && (
            <p className={styles.named} data-testid="apelido">
              <span className={styles.namedName}>{named.name}</span>
              <span className={styles.namedBy}>{m.namedBy(named.by)}</span>
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
                  <Label>{m.tpsa}</Label>
                  <NumberValue
                    value={analysis.molecule.descriptors.tpsa}
                    unit="Å²"
                    locale={locale}
                  />
                </div>
                <div className={styles.fact}>
                  <Label>{m.logP}</Label>
                  <NumberValue value={analysis.molecule.descriptors.logP} locale={locale} />
                </div>
                <div className={styles.fact}>
                  <Label>{m.rotatable}</Label>
                  <NumberValue
                    value={analysis.molecule.descriptors.rotatableBonds}
                    decimals={0}
                    locale={locale}
                  />
                </div>
                <div className={styles.fact}>
                  <Label>{m.aromaticRings}</Label>
                  <NumberValue
                    value={analysis.molecule.descriptors.aromaticRings}
                    decimals={0}
                    locale={locale}
                  />
                </div>
                <div className={styles.fact}>
                  <Label>{m.stereocenters}</Label>
                  <span className={styles.stereo} data-testid="estereocentros">
                    <NumberValue
                      value={analysis.molecule.descriptors.stereocenters}
                      decimals={0}
                      locale={locale}
                    />
                    {analysis.molecule.descriptors.unspecifiedStereocenters > 0 && (
                      <span className={styles.stereoNote}>{m.unspecified}</span>
                    )}
                  </span>
                </div>

                <div className={styles.fact}>
                  <Label>{m.hbDonors}</Label>
                  <NumberValue
                    value={analysis.molecule.descriptors.hbDonors}
                    decimals={0}
                    locale={locale}
                  />
                </div>
                <div className={styles.fact}>
                  <Label>{m.hbAcceptors}</Label>
                  <NumberValue
                    value={analysis.molecule.descriptors.hbAcceptors}
                    decimals={0}
                    locale={locale}
                  />
                </div>
              </div>

              {analysis.molecule.groups.length > 0 && (
                <div className={styles.codes}>
                  <div>
                    <Label>{m.groups}</Label>
                    <div className={styles.groups} data-testid="grupos">
                      {analysis.molecule.groups.map((group) => (
                        <span key={group.id} className={styles.group}>
                          {functionalGroupName(locale, group.id)}
                          {group.count > 1 ? ` ×${String(group.count)}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.codes}>
                <div>
                  <Label>{m.smiles}</Label>
                  <p className={styles.code}>{analysis.molecule.smiles}</p>
                </div>
                <div>
                  <Label>{m.inchiKey}</Label>
                  <p className={styles.code}>{analysis.molecule.inchiKey}</p>
                </div>
              </div>

              <p className={styles.actions} style={{ marginTop: 'var(--sp-5)' }}>
                <Link
                  className={styles.link}
                  href={`/?smiles=${encodeURIComponent(analysis.molecule.smiles)}`}
                >
                  {m.openInEditor}
                </Link>
              </p>
            </div>
          </div>
        </>
      )}

      <footer className={styles.footer}>
        <span>{m.footerComputed}</span>
        <span>{m.footerLicense}</span>
      </footer>
    </main>
  );
}
