'use client';

import type { AnalysisResult, ChemistryError, Descriptors } from '@rotamer/core';
import type { EditorStore } from '@rotamer/editor2d';
import { SourceBadge } from '@rotamer/ui';
import type { ReactElement } from 'react';
import styles from './AnalysisDrawer.module.css';
import { ExportMenu } from './ExportMenu';
import { NamePanel } from './NamePanel';
import { QuestPanel } from './QuestPanel';
import { ShareLink } from './ShareLink';
import { SmilesInput } from './SmilesInput';
import { ThemeToggle } from './ThemeToggle';
import { TutorPanel } from './TutorPanel';
import type { ChemistryConnection } from './use-chemistry-client';

export type DrawerTab = 'analysis' | 'quests';

export interface AnalysisDrawerProps {
  readonly analysis: AnalysisResult | null;
  readonly connection: ChemistryConnection;
  readonly store: EditorStore;
  readonly tab: DrawerTab;
  readonly onTab: (tab: DrawerTab) => void;
  readonly onClose: () => void;
  readonly questSlug: string;
  readonly onQuestSlug: (slug: string) => void;
}

const NUMBER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
  connection,
  store,
  tab,
  onTab,
  onClose,
  questSlug,
  onQuestSlug,
}: AnalysisDrawerProps): ReactElement {
  return (
    <aside className={styles.drawer} aria-label="Análise da molécula" data-testid="painel-analise">
      <div className={styles.tabs} role="tablist" aria-label="Seções do painel">
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={tab === 'analysis'}
          onClick={() => {
            onTab('analysis');
          }}
        >
          Análise
        </button>
        <button
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={tab === 'quests'}
          onClick={() => {
            onTab('quests');
          }}
        >
          Missões
        </button>

        <span className={styles.spacer} />

        <button
          type="button"
          className={styles.close}
          aria-label="Fechar o painel"
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
              <p className={styles.quiet}>
                Desenhe uma estrutura — ou cole um SMILES — para ver a análise inteira.
              </p>
            )}

            {analysis?.ok === false && <ErrorCard error={analysis.error} />}

            {analysis?.ok === true && (
              <>
                <NamePanel key={analysis.molecule.inchiKey} analysis={analysis} />

                {analysis.molecule.groups.length > 0 && (
                  <section className={styles.section} data-testid="grupos-funcionais">
                    <h3 className={styles.heading}>Grupos funcionais</h3>
                    <div className={styles.chips}>
                      {analysis.molecule.groups.map((group) => (
                        <span key={group.id} className={styles.chip}>
                          {group.name}
                          {group.count > 1 && <span className={styles.count}>{group.count}</span>}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <Identity molecule={analysis.molecule} />
                <Lipinski descriptors={analysis.molecule.descriptors} />

                <section className={styles.section}>
                  <h3 className={styles.heading}>Levar embora</h3>
                  <div className={styles.row}>
                    <ExportMenu analysis={analysis} connection={connection} />
                    <ShareLink analysis={analysis} />
                  </div>
                </section>

                <p className={styles.footnote}>
                  <strong>Calculado pelo RDKit:</strong> valência, fórmula, massa, anéis,
                  aromaticidade, grupos funcionais, TPSA, logP e os descritores. A geometria e a
                  vibração saem do campo de força MMFF94, no mesmo motor. Nenhum número desta tela
                  passa por modelo de linguagem.
                </p>
              </>
            )}
            <div className={styles.tail}>
              <ThemeToggle />
              <a className={styles.link} href="/marca">
                Marca e tokens
              </a>
            </div>
          </>
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

/** O erro, com o nome do problema e o que fazer a respeito. */
function ErrorCard({ error }: { readonly error: ChemistryError }): ReactElement {
  return (
    <section className={styles.errorCard} data-testid="cartao-erro">
      <h3 className={styles.errorTitle}>{titleFor(error)}</h3>
      <p className={styles.errorMessage}>{error.message}</p>
      <p className={styles.errorFix}>{fixFor(error)}</p>
      <SourceBadge source="computed" />
    </section>
  );
}

function titleFor(error: ChemistryError): string {
  switch (error.code) {
    case 'valence_exceeded':
      return 'Valência excedida';
    case 'impossible_aromaticity':
      return 'Aromaticidade impossível';
    case 'invalid_syntax':
      return 'Não consegui ler a estrutura';
    case 'empty':
      return 'Nada desenhado ainda';
    default:
      return 'Estrutura impossível';
  }
}

function fixFor(error: ChemistryError): string {
  if (error.code === 'valence_exceeded') {
    return error.atom
      ? 'Reduza a ordem de uma ligação clicando na linha, ou apague uma delas. O átomo está marcado com um círculo tracejado no desenho.'
      : 'Reduza a ordem de uma ligação clicando na linha, ou apague uma delas.';
  }

  if (error.code === 'impossible_aromaticity') {
    return 'Confira as duplas do anel: um anel só é aromático quando o número de elétrons π fecha a conta.';
  }

  return 'Confira as ligações do desenho — apagar a última e refazer costuma resolver.';
}

/** A ficha de identidade: tudo o que o RDKit devolveu sobre esta molécula. */
function Identity({
  molecule,
}: {
  readonly molecule: Extract<AnalysisResult, { ok: true }>['molecule'];
}): ReactElement {
  const { descriptors } = molecule;

  return (
    <section className={styles.section} data-testid="identidade">
      <h3 className={styles.heading}>Identidade</h3>

      <dl className={styles.list}>
        <Row label="Átomos pesados" value={String(descriptors.heavyAtoms)} />
        <Row label="Heteroátomos" value={String(descriptors.heteroatoms)} />
        <Row
          label="Anéis"
          value={
            descriptors.aromaticRings > 0
              ? `${String(descriptors.rings)} (${String(descriptors.aromaticRings)} aromáticos)`
              : String(descriptors.rings)
          }
        />
        <Row label="Ligações rotacionáveis" value={String(descriptors.rotatableBonds)} />
        <Row
          label="Doadores / aceitadores"
          value={`${String(descriptors.hbDonors)} / ${String(descriptors.hbAcceptors)}`}
        />
        <Row label="TPSA" value={`${NUMBER.format(descriptors.tpsa)} Å²`} />
        <Row label="logP" value={NUMBER.format(descriptors.logP)} />
        <Row label="Refratividade molar" value={NUMBER.format(descriptors.molarRefractivity)} />
        <Row label="Fração sp³" value={NUMBER.format(descriptors.fractionCsp3)} />
        <Row
          label="Estereocentros"
          value={
            descriptors.unspecifiedStereocenters > 0
              ? `${String(descriptors.stereocenters)} — ${String(
                  descriptors.unspecifiedStereocenters,
                )} sem configuração`
              : String(descriptors.stereocenters)
          }
          testId="estereocentros"
          note={
            descriptors.unspecifiedStereocenters > 0
              ? 'O editor ainda não representa cunhas e traços: a configuração não está definida no desenho.'
              : undefined
          }
        />
        <Row label="Massa exata" value={`${NUMBER.format(descriptors.exactMass)} g/mol`} />
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
  const limits = [
    { label: 'Massa', value: descriptors.molarMass, limit: 500 },
    { label: 'logP', value: descriptors.logP, limit: 5 },
    { label: 'Doadores', value: descriptors.hbDonors, limit: 5 },
    { label: 'Aceitadores', value: descriptors.hbAcceptors, limit: 10 },
  ];

  return (
    <section className={styles.section} data-testid="regra-dos-cinco">
      <h3 className={styles.heading}>Regra dos cinco</h3>

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
              {entry.value < 10 ? NUMBER.format(entry.value) : Math.round(entry.value)}
              <span className={styles.limit}>/{entry.limit}</span>
            </span>
          </div>
        );
      })}
    </section>
  );
}
