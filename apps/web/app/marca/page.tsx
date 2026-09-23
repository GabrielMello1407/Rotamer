import { pick, type Locale } from '@rotamer/i18n';
import { Card, Label, Logo, SourceBadge } from '@rotamer/ui';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import { currentLocale } from '../../lib/locale';
import { ChemistryPanel } from '../components/ChemistryPanel';
import { LanguageToggle } from '../components/LanguageToggle';
import { ThemeToggle } from '../components/ThemeToggle';
import { brandMessages } from './messages';
import styles from './page.module.css';

/** Aspirina. É a molécula que a Fase 0 precisa sanitizar. */
const ASPIRIN = 'CC(=O)Oc1ccccc1C(=O)O';

/** O lado do dicionário da página que está valendo agora. */
type BrandText = (typeof brandMessages)['pt-BR'];

/**
 * Lê um texto do dicionário pela chave que a vitrine guarda.
 *
 * As tabelas abaixo guardam a chave, não a frase — é o que permite a mesma
 * linha servir aos dois idiomas. O acesso por chave perde a prova de que ali
 * há texto, então a checagem acontece aqui, e falha alto: chave que deixou de
 * ser frase é defeito, não motivo para a tela ficar em branco.
 */
function textOf(m: BrandText, key: keyof BrandText): string {
  const value = m[key];
  if (typeof value !== 'string') throw new Error(`marca: ${String(key)} não é texto`);
  return value;
}

/**
 * A vitrine guarda só o token; o nome vem do dicionário.
 *
 * Token é chave de dado e não muda de idioma — `--flame-cobre` é `--flame-cobre`
 * em qualquer tela, porque é isso que se escreve no CSS. O que muda é a palavra
 * ao lado dele.
 */
interface Swatch {
  readonly token: string;
  readonly name: keyof BrandText;
}

const FLAME: readonly Swatch[] = [
  { token: '--flame-cobre', name: 'flameCopper' },
  { token: '--flame-potassio', name: 'flamePotassium' },
  { token: '--flame-sodio', name: 'flameSodium' },
  { token: '--flame-cesio', name: 'flameCaesium' },
  { token: '--flame-estroncio', name: 'flameStrontium' },
  { token: '--flame-bario', name: 'flameBarium' },
  { token: '--flame-litio', name: 'flameLithium' },
];

const ROLES: readonly (Swatch & { readonly usedFor: keyof BrandText })[] = [
  { token: '--brand', name: 'roleBrand', usedFor: 'roleBrandUse' },
  { token: '--ok', name: 'roleOk', usedFor: 'roleOkUse' },
  { token: '--warn', name: 'roleWarn', usedFor: 'roleWarnUse' },
  { token: '--danger', name: 'roleDanger', usedFor: 'roleDangerUse' },
  { token: '--info', name: 'roleInfo', usedFor: 'roleInfoUse' },
];

const NEUTRALS: readonly Swatch[] = [
  { token: '--bg', name: 'neutralBg' },
  { token: '--surface', name: 'neutralSurface' },
  { token: '--sunk', name: 'neutralSunk' },
  { token: '--line', name: 'neutralLine' },
  { token: '--ink-500', name: 'neutralInk500' },
  { token: '--ink-900', name: 'neutralInk900' },
];

const ATOMS: readonly { readonly token: string; readonly symbol: string }[] = [
  { token: '--cpk-h', symbol: 'H' },
  { token: '--cpk-c', symbol: 'C' },
  { token: '--cpk-n', symbol: 'N' },
  { token: '--cpk-o', symbol: 'O' },
  { token: '--cpk-f', symbol: 'F' },
  { token: '--cpk-p', symbol: 'P' },
  { token: '--cpk-s', symbol: 'S' },
  { token: '--cpk-cl', symbol: 'Cl' },
  { token: '--cpk-br', symbol: 'Br' },
  { token: '--cpk-i', symbol: 'I' },
];

const TYPE_SCALE: readonly {
  readonly token: string;
  readonly name: keyof BrandText;
  readonly display: boolean;
}[] = [
  { token: '--step-5', name: 'typeDisplay', display: true },
  { token: '--step-4', name: 'typeTitle', display: true },
  { token: '--step-3', name: 'typeSection', display: true },
  { token: '--step-1', name: 'typeBody', display: false },
  { token: '--step-0', name: 'typeUi', display: false },
  { token: '--step--1', name: 'typeCaption', display: false },
];

const RADII: readonly { readonly token: string; readonly usedFor: keyof BrandText }[] = [
  { token: '--r-sm', usedFor: 'radiusControl' },
  { token: '--r-md', usedFor: 'radiusCard' },
  { token: '--r-lg', usedFor: 'radiusPanel' },
  { token: '--r-xl', usedFor: 'radiusScene' },
];

const DURATIONS: readonly { readonly token: string; readonly usedFor: keyof BrandText }[] = [
  { token: '--t-fast', usedFor: 'durationFast' },
  { token: '--t-base', usedFor: 'durationBase' },
  { token: '--t-slow', usedFor: 'durationSlow' },
  { token: '--t-fold', usedFor: 'durationFold' },
];

export async function generateMetadata(): Promise<Metadata> {
  const m = pick(brandMessages, await currentLocale());
  return { title: m.metaTitle, description: m.metaDescription };
}

export default async function BrandPage(): Promise<ReactElement> {
  const locale: Locale = await currentLocale();
  const m = pick(brandMessages, locale);

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.identity}>
          <Logo size={72} />
          <div>
            <h1 className={styles.wordmark}>Rotamer</h1>
            <p className={styles.tagline}>{m.tagline}</p>
            <p className={styles.quiet}>{m.bilingual}</p>
          </div>
        </div>
        <div className={styles.toggles}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <section className={styles.section}>
        <Card>
          <p className={styles.rule}>{m.rule}</p>
          <p className={styles.ruleText}>{m.ruleText}</p>
          <div className={styles.badges}>
            <SourceBadge source="computed" locale={locale} />
            <SourceBadge source="generated" locale={locale} />
          </div>
        </Card>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>{m.engineHeading}</h2>
          <Label>{m.engineLabel}</Label>
        </div>
        <div className={styles.twoColumns}>
          <ChemistryPanel input={ASPIRIN} name={m.aspirin} />
          <div>
            <p>{m.engineBody}</p>
            <p className={`${styles.quiet} ${styles.spaced}`}>{m.engineQuiet}</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>{m.markHeading}</h2>
          <Label>{m.markLabel}</Label>
        </div>
        <div className={styles.twoColumns}>
          <div className={styles.marks}>
            <div className={styles.mark}>
              <Logo size={96} decorative />
              <span className={styles.tokenName}>96</span>
            </div>
            <div className={styles.mark}>
              <Logo size={48} decorative />
              <span className={styles.tokenName}>48</span>
            </div>
            <div className={styles.mark}>
              <Logo size={32} decorative />
              <span className={styles.tokenName}>32</span>
            </div>
          </div>
          <div>
            <p>{m.markBody}</p>
            <p className={styles.notice}>{m.markNotice}</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>{m.colorHeading}</h2>
          <Label>{m.colorLabel}</Label>
        </div>

        <p>{m.colorBody}</p>

        <div className={styles.palette}>
          {FLAME.map((swatch) => (
            <div key={swatch.token} className={styles.swatch}>
              <div className={styles.chip} style={{ background: `var(${swatch.token})` }} />
              <span className={styles.swatchCaption}>{textOf(m, swatch.name)}</span>
              <code className={styles.tokenName}>{swatch.token}</code>
            </div>
          ))}
        </div>

        <div className={styles.palette}>
          {ROLES.map((role) => (
            <div key={role.token} className={styles.swatch}>
              <div className={styles.chip} style={{ background: `var(${role.token})` }} />
              <span className={styles.swatchCaption}>{textOf(m, role.name)}</span>
              <span className={styles.tokenName}>{textOf(m, role.usedFor)}</span>
            </div>
          ))}
        </div>

        <div className={styles.palette}>
          {NEUTRALS.map((neutral) => (
            <div key={neutral.token} className={styles.swatch}>
              <div className={styles.chip} style={{ background: `var(${neutral.token})` }} />
              <span className={styles.swatchCaption}>{textOf(m, neutral.name)}</span>
              <code className={styles.tokenName}>{neutral.token}</code>
            </div>
          ))}
        </div>

        <div>
          <Label>{m.cpkLabel}</Label>
          <div className={styles.atoms}>
            {ATOMS.map((atom) => (
              <span
                key={atom.symbol}
                className={styles.atom}
                style={{ background: `var(${atom.token})` }}
              >
                {atom.symbol}
              </span>
            ))}
          </div>
          <p className={styles.notice}>{m.cpkNotice}</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>{m.typeHeading}</h2>
          <Label>{m.typeLabel}</Label>
        </div>
        <div className={styles.scale}>
          {TYPE_SCALE.map((row) => (
            <div key={row.token} className={styles.scaleRow}>
              <code className={styles.tokenName}>{textOf(m, row.name)}</code>
              <span
                className={row.display ? styles.displaySample : undefined}
                style={{ fontSize: `var(${row.token})` }}
              >
                {m.typeSample}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.quiet}>
          {m.typeQuietBefore}
          <code className={styles.tokenName}>tabular-nums</code>
          {m.typeQuietAfter}
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>{m.shapeHeading}</h2>
          <Label>{m.shapeLabel}</Label>
        </div>
        <div className={styles.twoColumns}>
          <ul className={styles.list}>
            {RADII.map((radius) => (
              <li key={radius.token} className={styles.listItem}>
                <span className={styles.radius} style={{ borderRadius: `var(${radius.token})` }} />
                <span>{textOf(m, radius.usedFor)}</span>
                <code className={styles.tokenName}>{radius.token}</code>
              </li>
            ))}
          </ul>
          <ul className={styles.list}>
            {DURATIONS.map((duration) => (
              <li key={duration.token} className={styles.listItem}>
                <span>{textOf(m, duration.usedFor)}</span>
                <code className={styles.tokenName}>{duration.token}</code>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.quiet}>{m.motionQuiet}</p>
      </section>

      <footer className={styles.footer}>
        <span>{m.footerLicense}</span>
        <span>{m.footerCredits}</span>
      </footer>
    </main>
  );
}
