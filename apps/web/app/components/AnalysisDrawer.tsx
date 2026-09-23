'use client';

import type { AnalysisResult, ChemistryError, Descriptors, NormalModes } from '@rotamer/core';
import type { EditorStore } from '@rotamer/editor2d';
import { chemistryErrorText, functionalGroupName, type Locale } from '@rotamer/i18n';
import { useFormatters, useLocale, useMessages } from '@rotamer/i18n/react';
import { SourceBadge } from '@rotamer/ui';
import type { ReactElement } from 'react';
import { messages as classroomMessages } from '../turmas/messages';
import { LanguageToggle } from './LanguageToggle';
import { analysisDrawerMessages } from './messages';
import styles from './AnalysisDrawer.module.css';
import { AuthoringPanel, type AuthoringPanelProps } from './AuthoringPanel';
import { ExportMenu } from './ExportMenu';
import { NamePanel } from './NamePanel';
import { NormalModesPanel } from './NormalModesPanel';
import { QuestPanel } from './QuestPanel';
import { ShareLink } from './ShareLink';
import { SmilesInput } from './SmilesInput';
import { ThemeToggle } from './ThemeToggle';
import { TutorPanel } from './TutorPanel';
import type { ChemistryConnection } from './use-chemistry-client';

export type DrawerTab = 'analysis' | 'quests' | 'authoring';

export interface AnalysisDrawerProps {
  readonly analysis: AnalysisResult | null;
  /** Os modos normais da molécula atual, quando o worker já respondeu. */
  readonly modes: NormalModes | null;
  readonly modesPending: boolean;
  /** Elementos que o campo de força não parametriza, quando existirem. */
  readonly unsupported: readonly string[];
  /** Qual modo está em exibição na cena. */
  readonly selectedMode: number | null;
  readonly onSelectMode: (index: number | null) => void;
  readonly connection: ChemistryConnection;
  readonly store: EditorStore;
  readonly tab: DrawerTab;
  readonly onTab: (tab: DrawerTab) => void;
  readonly onClose: () => void;
  readonly questSlug: string;
  readonly onQuestSlug: (slug: string) => void;
  /**
   * Presente só quando o professor está desenhando a resposta de uma missão
   * (§6.3): a aba "Missões" vira "Autoria", e ela substitui — nunca some ao
   * lado — porque aqui não se resolve missão, se escreve uma.
   */
  readonly authoring?: AuthoringPanelProps | undefined;
}

/**
 * O painel de análise.
 *
 * Fica fechado por padrão em tela estreita porque o objeto principal é a
 * molécula, não a tabela de números. O que ele mostra é sempre derivado do
 * grafo: nada aqui é estado próprio, e fechar o painel não perde nada.
 *
 * A separação de origem é visível linha a linha: o que veio do RDKit leva selo
 * verde, o que veio do tutor leva selo âmbar. Um número nunca sai do tutor.
 */
export function AnalysisDrawer({
  analysis,
  modes,
  modesPending,
  unsupported,
  selectedMode,
  onSelectMode,
  connection,
  store,
  tab,
  onTab,
  onClose,
  questSlug,
  onQuestSlug,
  authoring,
}: AnalysisDrawerProps): ReactElement {
  const locale = useLocale();
  const text = useMessages(analysisDrawerMessages);
  const classroom = useMessages(classroomMessages);

  return (
    <aside className={styles.drawer} aria-label={text.label} data-testid="painel-analise">
      <div className={styles.tabs} role="tablist" aria-label={text.tabs}>
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={tab === 'analysis'}
          onClick={() => {
            onTab('analysis');
          }}
        >
          {text.analysisTab}
        </button>
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={tab === (authoring !== undefined ? 'authoring' : 'quests')}
          data-testid="aba-autoria-ou-missoes"
          onClick={() => {
            onTab(authoring !== undefined ? 'authoring' : 'quests');
          }}
        >
          {authoring !== undefined ? classroom.authoring.tab : text.questsTab}
        </button>

        <span className={styles.spacer} />

        <button
          type="button"
          className={styles.close}
          aria-label={text.close}
          data-testid="fechar-analise"
          onClick={onClose}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className={styles.body}>
        {tab === 'analysis' ? (
          <>
            <SmilesInput store={store} connection={connection} />

            {analysis === null && (
              <p className={styles.quiet}>{text.empty}</p>
            )}

            {analysis?.ok === false && <ErrorCard error={analysis.error} locale={locale} />}

            {analysis?.ok === true && (
              <>
                <NamePanel key={analysis.molecule.inchiKey} analysis={analysis} />

                {analysis.molecule.groups.length > 0 && (
                  <section className={styles.section} data-testid="grupos-funcionais">
                    <h3 className={styles.heading}>{text.groups}</h3>
                    <div className={styles.chips}>
                      {analysis.molecule.groups.map((group) => (
                        <span key={group.id} className={styles.chip}>
                          {functionalGroupName(locale, group.id)}
                          {group.count > 1 && <span className={styles.count}>{group.count}</span>}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <Identity molecule={analysis.molecule} />

                <NormalModesPanel
                  modes={modes}
                  unsupported={unsupported}
                  selected={selectedMode}
                  onSelect={onSelectMode}
                  pending={modesPending}
                />

                <Lipinski descriptors={analysis.molecule.descriptors} />

                <section className={styles.section}>
                  <h3 className={styles.heading}>{text.takeAway}</h3>
                  <div className={styles.row}>
                    <ExportMenu analysis={analysis} connection={connection} />
                    <ShareLink analysis={analysis} />
                  </div>
                  <p className={styles.note}>{text.saveNote}</p>
                </section>

                <p className={styles.footnote}>
                  <strong>{text.computedBy}</strong>
                  {text.computedList}
                </p>
              </>
            )}
            <div className={styles.tail}>
              {/* Idioma e tema são a mesma espécie de coisa — preferência de
                  quem está lendo — e por isso moram juntos, no pé do painel. */}
              <LanguageToggle />
              <ThemeToggle />
              <span className={styles.row}>
                <a className={styles.link} href="/escolas">
                  {text.forSchools}
                </a>
                <a className={styles.link} href="/marca">
                  {text.brand}
                </a>
              </span>
            </div>
          </>
        ) : authoring !== undefined ? (
          <AuthoringPanel {...authoring} />
        ) : (
          <>
            <QuestPanel analysis={analysis} slug={questSlug} onSlug={onQuestSlug} />
            <TutorPanel analysis={analysis} questSlug={questSlug === '' ? null : questSlug} />
          </>
        )}
      </div>
    </aside>
  );
}

/**
 * O erro, com o nome do problema e o que fazer a respeito.
 *
 * A frase do meio é a do núcleo, montada a partir do código da recusa e dos
 * números que a justificam. O título e o conserto são desta tela — eles falam
 * do desenho, que é o que o aluno tem em mãos.
 */
function ErrorCard({
  error,
  locale,
}: {
  readonly error: ChemistryError;
  readonly locale: Locale;
}): ReactElement {
  const text = useMessages(analysisDrawerMessages);

  return (
    <section className={styles.errorCard} data-testid="cartao-erro">
      <h3 className={styles.errorTitle}>{titleFor(error, text)}</h3>
      <p className={styles.errorMessage}>{chemistryErrorText(locale, error)}</p>
      <p className={styles.errorFix}>{fixFor(error, text)}</p>
      <SourceBadge source="computed" locale={locale} />
    </section>
  );
}

/** O lado do dicionário do painel que está valendo agora. */
type DrawerText = (typeof analysisDrawerMessages)['pt-BR'];

function titleFor(error: ChemistryError, text: DrawerText): string {
  switch (error.code) {
    case 'valence_exceeded':
      return text.errorValence;
    case 'impossible_aromaticity':
      return text.errorAromaticity;
    case 'invalid_syntax':
      return text.errorUnreadable;
    case 'empty':
      return text.errorEmpty;
    default:
      return text.errorOther;
  }
}

function fixFor(error: ChemistryError, text: DrawerText): string {
  if (error.code === 'valence_exceeded') {
    return error.atom ? text.fixValenceWithAtom : text.fixValence;
  }

  if (error.code === 'impossible_aromaticity') return text.fixAromaticity;

  return text.fixOther;
}

/** A ficha de identidade: tudo o que o RDKit devolveu sobre esta molécula. */
function Identity({
  molecule,
}: {
  readonly molecule: Extract<AnalysisResult, { ok: true }>['molecule'];
}): ReactElement {
  const text = useMessages(analysisDrawerMessages);
  const { number } = useFormatters();
  const { descriptors } = molecule;

  return (
    <section className={styles.section} data-testid="identidade">
      <h3 className={styles.heading}>{text.identity}</h3>

      <dl className={styles.list}>
        <Row label={text.heavyAtoms} value={String(descriptors.heavyAtoms)} />
        <Row label={text.heteroatoms} value={String(descriptors.heteroatoms)} />
        <Row
          label={text.rings}
          value={
            descriptors.aromaticRings > 0
              ? text.ringsWithAromatic(descriptors.rings, descriptors.aromaticRings)
              : String(descriptors.rings)
          }
        />
        <Row label={text.rotatableBonds} value={String(descriptors.rotatableBonds)} />
        <Row
          label={text.donorsAcceptors}
          value={`${String(descriptors.hbDonors)} / ${String(descriptors.hbAcceptors)}`}
        />
        <Row label="TPSA" value={`${number(descriptors.tpsa, 2)} Å²`} />
        <Row label="logP" value={number(descriptors.logP, 2)} />
        <Row label={text.molarRefractivity} value={number(descriptors.molarRefractivity, 2)} />
        <Row label={text.fractionCsp3} value={number(descriptors.fractionCsp3, 2)} />
        <Row
          label={text.stereocenters}
          value={
            descriptors.unspecifiedStereocenters > 0
              ? text.stereocentersUnspecified(
                  descriptors.stereocenters,
                  descriptors.unspecifiedStereocenters,
                )
              : String(descriptors.stereocenters)
          }
          testId="estereocentros"
          note={
            descriptors.unspecifiedStereocenters > 0 ? text.stereocentersNote : undefined
          }
        />
        <Row label={text.exactMass} value={`${number(descriptors.exactMass, 2)} g/mol`} />
        <Row label="InChIKey" value={molecule.inchiKey} mono />
        <Row label="SMILES" value={molecule.smiles} mono />
      </dl>
    </section>
  );
}

interface RowProps {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
  readonly testId?: string;
  readonly note?: string | undefined;
}

function Row({ label, value, mono = false, testId, note }: RowProps): ReactElement {
  return (
    <div className={styles.rowItem} data-testid={testId} title={note}>
      <dt className={styles.term}>{label}</dt>
      <dd className={[styles.definition, mono ? styles.wrap : null].filter(Boolean).join(' ')}>
        {value}
      </dd>
    </div>
  );
}

/**
 * A regra dos cinco, como quatro barras.
 *
 * Ela descreve o que costuma ser absorvido por via oral. Não é previsão de
 * atividade, e a tela não diz que a molécula funciona — diz onde ela está em
 * relação a quatro limites publicados.
 */
function Lipinski({ descriptors }: { readonly descriptors: Descriptors }): ReactElement {
  const text = useMessages(analysisDrawerMessages);
  const { number } = useFormatters();

  const limits = [
    { label: text.lipinskiMass, value: descriptors.molarMass, limit: 500 },
    { label: 'logP', value: descriptors.logP, limit: 5 },
    { label: text.lipinskiDonors, value: descriptors.hbDonors, limit: 5 },
    { label: text.lipinskiAcceptors, value: descriptors.hbAcceptors, limit: 10 },
  ];

  return (
    <section className={styles.section} data-testid="regra-dos-cinco">
      <h3 className={styles.heading}>{text.lipinski}</h3>

      {limits.map((entry) => {
        const ratio = Math.min(1, Math.max(0, entry.value / entry.limit));
        const over = entry.value > entry.limit;

        return (
          <div key={entry.label} className={styles.gauge}>
            <span className={styles.gaugeLabel}>{entry.label}</span>
            <span className={styles.track}>
              <span
                className={[styles.fill, over ? styles.over : null].filter(Boolean).join(' ')}
                style={{ width: `${String(ratio * 100)}%` }}
              />
            </span>
            <span className={styles.gaugeValue}>
              {entry.value < 10 ? number(entry.value, 2) : Math.round(entry.value)}
              <span className={styles.limit}>/{entry.limit}</span>
            </span>
          </div>
        );
      })}
    </section>
  );
}
