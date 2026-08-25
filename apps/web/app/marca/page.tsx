import { Card, Label, Logo, SourceBadge } from '@rotamer/ui';
import type { ReactElement } from 'react';
import { ChemistryPanel } from '../components/ChemistryPanel';
import { ThemeToggle } from '../components/ThemeToggle';
import styles from './page.module.css';

/** Aspirina. É a molécula que a Fase 0 precisa sanitizar. */
const ASPIRIN = 'CC(=O)Oc1ccccc1C(=O)O';

interface Swatch {
  readonly token: string;
  readonly name: string;
}

const FLAME: readonly Swatch[] = [
  { token: '--flame-cobre', name: 'cobre · marca' },
  { token: '--flame-potassio', name: 'potássio' },
  { token: '--flame-sodio', name: 'sódio' },
  { token: '--flame-cesio', name: 'césio' },
  { token: '--flame-estroncio', name: 'estrôncio' },
  { token: '--flame-bario', name: 'bário' },
  { token: '--flame-litio', name: 'lítio' },
];

const ROLES: readonly (Swatch & { readonly usedFor: string })[] = [
  { token: '--brand', name: 'marca e ação', usedFor: 'botão primário, link, seleção, foco' },
  { token: '--ok', name: 'sucesso', usedFor: 'missão cumprida, estrutura válida' },
  { token: '--warn', name: 'atenção', usedFor: 'hipótese da IA, valor aproximado' },
  { token: '--danger', name: 'erro', usedFor: 'valência excedida, violação de Lipinski' },
  { token: '--info', name: 'informação', usedFor: 'nota de contexto, referência' },
];

const NEUTRALS: readonly Swatch[] = [
  { token: '--bg', name: 'fundo' },
  { token: '--surface', name: 'superfície' },
  { token: '--sunk', name: 'rebaixado' },
  { token: '--line', name: 'linha' },
  { token: '--ink-500', name: 'texto secundário' },
  { token: '--ink-900', name: 'texto' },
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
  readonly name: string;
  readonly display: boolean;
}[] = [
  { token: '--step-5', name: 'display', display: true },
  { token: '--step-4', name: 'título', display: true },
  { token: '--step-3', name: 'seção', display: true },
  { token: '--step-1', name: 'corpo', display: false },
  { token: '--step-0', name: 'interface', display: false },
  { token: '--step--1', name: 'legenda', display: false },
];

const RADII: readonly { readonly token: string; readonly usedFor: string }[] = [
  { token: '--r-sm', usedFor: 'controle' },
  { token: '--r-md', usedFor: 'cartão' },
  { token: '--r-lg', usedFor: 'painel flutuante' },
  { token: '--r-xl', usedFor: 'cartão 3D' },
];

const DURATIONS: readonly { readonly token: string; readonly usedFor: string }[] = [
  { token: '--t-fast', usedFor: 'estado de controle — hover, foco, pressionado' },
  { token: '--t-base', usedFor: 'painel e gaveta' },
  { token: '--t-slow', usedFor: 'transição de contexto' },
  { token: '--t-fold', usedFor: 'dobramento da molécula — isto é física, não enfeite' },
];

export default function BrandPage(): ReactElement {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.identity}>
          <Logo size={72} />
          <div>
            <h1 className={styles.wordmark}>Rotamer</h1>
            <p className={styles.tagline}>
              Desenhe uma molécula em 2D. Descubra o que ela é em 3D.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <section className={styles.section}>
        <Card>
          <p className={styles.rule}>O núcleo determinístico decide. A IA explica.</p>
          <p className={styles.ruleText}>
            Validade, valência, fórmula, massa, SMILES, InChIKey e descritores vêm sempre do
            RDKit. O modelo de linguagem lê esses números e explica — sem nunca recalcular e sem
            nunca contradizer. Todo bloco de análise na tela declara de onde veio.
          </p>
          <div className={styles.badges}>
            <SourceBadge source="computed" />
            <SourceBadge source="generated" />
          </div>
        </Card>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Fase 0 · o motor de química</h2>
          <Label>rdkit em web worker</Label>
        </div>
        <div className={styles.twoColumns}>
          <ChemistryPanel input={ASPIRIN} name="aspirina" />
          <div>
            <p>
              A página pinta primeiro; os quase 7 MB de WebAssembly do RDKit sobem depois, dentro
              de um Web Worker. A thread principal só desenha — é isso que mantém o editor a
              60 fps enquanto a química trabalha.
            </p>
            <p className={`${styles.quiet} ${styles.spaced}`}>
              Os números ao lado saíram do worker agora, nesta visita. Nenhum deles está escrito
              no código da página.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Símbolo</h2>
          <Label>projeção de newman</Label>
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
            <p>
              Você olha ao longo do eixo de uma ligação simples. O círculo é o átomo de trás; as
              três hastes que saem do centro são as ligações do átomo da frente; as três que saem
              da borda são as de trás. Os 60° de separação são a conformação escalonada — a de
              menor energia, aquela para a qual a molécula tende.
            </p>
            <p className={styles.notice}>
              A cor separa profundidade: frente em turquesa, trás na cor do texto. Inverter faz o
              átomo de trás parecer o da frente — e aí o desenho está quimicamente errado.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Cor</h2>
          <Label>teste de chama</Label>
        </div>

        <p>
          Cada cor é a que um elemento emite ao queimar. Nenhuma foi escolhida por gosto. Os
          neutros vêm do cone azul do bico de Bunsen: cinzas com viés azul-violeta, nunca cinza
          puro.
        </p>

        <div className={styles.palette}>
          {FLAME.map((swatch) => (
            <div key={swatch.token} className={styles.swatch}>
              <div className={styles.chip} style={{ background: `var(${swatch.token})` }} />
              <span className={styles.swatchCaption}>{swatch.name}</span>
              <code className={styles.tokenName}>{swatch.token}</code>
            </div>
          ))}
        </div>

        <div className={styles.palette}>
          {ROLES.map((role) => (
            <div key={role.token} className={styles.swatch}>
              <div className={styles.chip} style={{ background: `var(${role.token})` }} />
              <span className={styles.swatchCaption}>{role.name}</span>
              <span className={styles.tokenName}>{role.usedFor}</span>
            </div>
          ))}
        </div>

        <div className={styles.palette}>
          {NEUTRALS.map((neutral) => (
            <div key={neutral.token} className={styles.swatch}>
              <div className={styles.chip} style={{ background: `var(${neutral.token})` }} />
              <span className={styles.swatchCaption}>{neutral.name}</span>
              <code className={styles.tokenName}>{neutral.token}</code>
            </div>
          ))}
        </div>

        <div>
          <Label>cpk pertence ao átomo</Label>
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
          <p className={styles.notice}>
            Nenhum botão, link, borda ou estado semântico pode usar uma cor CPK. Se a interface
            pinta de vermelho, o vermelho deixa de significar oxigênio. É por isso que o acento da
            marca é turquesa: nenhum elemento comum é turquesa no CPK.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Tipografia</h2>
          <Label>archivo · ibm plex</Label>
        </div>
        <div className={styles.scale}>
          {TYPE_SCALE.map((row) => (
            <div key={row.token} className={styles.scaleRow}>
              <code className={styles.tokenName}>{row.name}</code>
              <span
                className={row.display ? styles.displaySample : undefined}
                style={{ fontSize: `var(${row.token})` }}
              >
                O etano gira livre; o eteno se recusa.
              </span>
            </div>
          ))}
        </div>
        <p className={styles.quiet}>
          Todo número usa <code className={styles.tokenName}>tabular-nums</code> em IBM Plex Mono,
          e toda fórmula leva subscrito de verdade — nunca C6H6 em texto corrido.
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Forma e movimento</h2>
          <Label>raio · duração</Label>
        </div>
        <div className={styles.twoColumns}>
          <ul className={styles.list}>
            {RADII.map((radius) => (
              <li key={radius.token} className={styles.listItem}>
                <span className={styles.radius} style={{ borderRadius: `var(${radius.token})` }} />
                <span>{radius.usedFor}</span>
                <code className={styles.tokenName}>{radius.token}</code>
              </li>
            ))}
          </ul>
          <ul className={styles.list}>
            {DURATIONS.map((duration) => (
              <li key={duration.token} className={styles.listItem}>
                <span>{duration.usedFor}</span>
                <code className={styles.tokenName}>{duration.token}</code>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.quiet}>
          Quem pede menos movimento no sistema recebe a geometria final direto, sem dobramento e
          sem vibração.
        </p>
      </section>

      <footer className={styles.footer}>
        <span>Rotamer · produto proprietário. Todos os direitos reservados.</span>
        <span>
          Química por RDKit (BSD-3-Clause). Tipografia Archivo e IBM Plex (SIL Open Font License
          1.1).
        </span>
      </footer>
    </main>
  );
}
