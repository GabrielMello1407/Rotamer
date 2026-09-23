import { formatNumber, pick } from '@rotamer/i18n';
import { Logo, SourceBadge } from '@rotamer/ui';
import { CATALOG } from '@rotamer/quests';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { analyzeOnServer, depictOnServer } from '../../lib/chemistry-server';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { currentLocale } from '../../lib/locale';
import { schoolsMessages } from './messages';
import styles from './page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const m = pick(schoolsMessages, await currentLocale());

  return {
    title: m.metaTitle,
    description: m.metaDescription,
    openGraph: { title: m.ogTitle, description: m.ogDescription, type: 'website' },
  };
}

/**
 * A página que se manda para a escola.
 *
 * O editor continua sendo a porta de entrada do produto — quem abre o endereço
 * desenha, sem cadastro. Esta página existe para a outra conversa: a de quem vai
 * decidir se aquilo entra na aula, e que precisa saber o que o produto faz, o
 * que ele **não** faz, e quem responde pelos números.
 *
 * A estrutura que aparece aqui é desenhada pelo RDKit no servidor, na hora. Não
 * é imagem de divulgação: é o mesmo motor que responde ao aluno.
 */
export default async function SchoolsPage(): Promise<ReactElement> {
  const locale = await currentLocale();
  const m = pick(schoolsMessages, locale);

  const [analysis, drawing] = await Promise.all([
    analyzeOnServer('CC(=O)Oc1ccccc1C(=O)O'),
    depictOnServer('CC(=O)Oc1ccccc1C(=O)O'),
  ]);

  const molecule = analysis.ok ? analysis.molecule : null;
  const tracks = {
    structure: CATALOG.filter((quest) => quest.track === 'structure').length,
    geometry: CATALOG.filter((quest) => quest.track === 'geometry').length,
    property: CATALOG.filter((quest) => quest.track === 'property').length,
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.identity} href="/">
          <Logo size={30} />
          <span className={styles.wordmark}>Rotamer</span>
        </Link>

        <span className={styles.end}>
          <LanguageSwitch />
          <Link className={styles.action} href="/">
            {m.openEditor}
          </Link>
        </span>
      </header>

      <section className={styles.hero}>
        <div>
          <h1 className={styles.title}>{m.title}</h1>
          <p className={styles.lead}>{m.lead}</p>

          <div className={styles.actions}>
            <Link className={styles.primary} href="/">
              {m.openEditorNoAccount}
            </Link>
            <Link className={styles.secondary} href="/m/CC(%3DO)Oc1ccccc1C(%3DO)O">
              {m.seeMolecule}
            </Link>
          </div>
        </div>

        {drawing !== null && (
          <figure className={styles.figure}>
            <div
              className={styles.drawing}
              // A estrutura é desenhada pelo RDKit no servidor, na hora: o SVG
              // sai do mesmo motor que valida o desenho do aluno.
              dangerouslySetInnerHTML={{ __html: drawing }}
            />
            <figcaption className={styles.caption}>
              {m.caption(
                molecule?.formula ?? 'C9H8O4',
                formatNumber(locale, molecule?.descriptors.molarMass ?? 180.16, 2),
              )}
            </figcaption>
          </figure>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{m.ruleHeading}</h2>
        <p className={styles.text}>
          <strong>{m.ruleStrong}</strong>
          {m.ruleText}
        </p>
        <div className={styles.badges}>
          <SourceBadge source="computed" locale={locale} />
          <SourceBadge source="generated" locale={locale} />
        </div>
        <p className={styles.note}>{m.ruleNote}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{m.studentHeading}</h2>
        <ul className={styles.list}>
          <li>{m.studentDraw}</li>
          <li>{m.studentFold}</li>
          <li>
            {m.studentModesBefore}
            <strong>3N − 6</strong>
            {m.studentModesAfter}
          </li>
          <li>{m.studentStereo}</li>
          <li>{m.studentError}</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{m.teacherHeading}</h2>
        <ul className={styles.list}>
          <li>
            <strong>{m.questCount(CATALOG.length)}</strong>
            {m.teacherTracks(tracks.structure, tracks.geometry, tracks.property)}
          </li>
          <li>
            <strong>{m.teacherCodeStrong}</strong>
            {m.teacherCode}
          </li>
          <li>
            <strong>{m.teacherBoardStrong}</strong>
            {m.teacherBoard}
          </li>
          <li>
            <strong>{m.teacherPasswordStrong}</strong>
            {m.teacherPassword}
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{m.stackHeading}</h2>
        <dl className={styles.specs}>
          <div className={styles.spec}>
            <dt className={styles.term}>{m.stackValidation}</dt>
            <dd className={styles.definition}>{m.stackValidationValue}</dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>{m.stackShape}</dt>
            <dd className={styles.definition}>{m.stackShapeValue}</dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>{m.stackVibration}</dt>
            <dd className={styles.definition}>{m.stackVibrationValue}</dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>{m.stackModes}</dt>
            <dd className={styles.definition}>{m.stackModesValue}</dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>{m.stackWhere}</dt>
            <dd className={styles.definition}>{m.stackWhereValue}</dd>
          </div>
          <div className={styles.spec}>
            <dt className={styles.term}>{m.stackData}</dt>
            <dd className={styles.definition}>{m.stackDataValue}</dd>
          </div>
        </dl>
      </section>

      <section className={[styles.section, styles.limits].join(' ')}>
        <h2 className={styles.heading}>{m.limitsHeading}</h2>
        <p className={styles.text}>{m.limitsText}</p>
        <ul className={styles.list}>
          <li>
            <strong>{m.limitReactionStrong}</strong>
            {m.limitReaction}
          </li>
          <li>
            <strong>{m.limitActivityStrong}</strong>
            {m.limitActivity}
          </li>
          <li>
            <strong>{m.limitNamingStrong}</strong>
            {m.limitNaming}
          </li>
          <li>
            <strong>{m.limitToolsStrong}</strong>
            {m.limitTools}
          </li>
          <li>
            <strong>{m.limitFrequenciesStrong}</strong>
            {m.limitFrequencies}
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{m.tryHeading}</h2>
        <p className={styles.text}>{m.tryText}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/">
            {m.openEditor}
          </Link>
          <Link className={styles.secondary} href="/marca">
            {m.brandLink}
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.note}>{m.footer}</p>
      </footer>
    </main>
  );
}
