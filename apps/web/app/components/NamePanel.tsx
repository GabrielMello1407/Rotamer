'use client';

import type { AnalysisResult } from '@rotamer/core';
import { Button, Label } from '@rotamer/ui';
import Link from 'next/link';
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import {
  nameMolecule,
  readNamingState,
  type NamedMolecule,
  type NamingState,
} from '../actions/naming';
import { NAME_MAX } from '../../lib/molecule-name';
import styles from './NamePanel.module.css';

export interface NamePanelProps {
  readonly analysis: AnalysisResult | null;
}

/**
 * O batismo.
 *
 * O produto não calcula nome de composto. O que ele oferece é autoria: estrutura
 * válida que ninguém batizou ainda pode receber apelido de quem a desenhou, e o
 * apelido nunca aparece sem o nome de quem deu.
 */
export function NamePanel({ analysis }: NamePanelProps): ReactElement | null {
  const [state, setState] = useState<NamingState | null>(null);
  const [named, setNamed] = useState<NamedMolecule | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  // Batizou agora, nesta visita: é o que autoriza dizer que a estrutura ficou
  // guardada. Quem só está lendo o apelido de outra pessoa não guardou nada.
  const [kept, setKept] = useState(false);

  const inchiKey = analysis !== null && analysis.ok ? analysis.molecule.inchiKey : null;

  // O apelido é da estrutura, não da sessão: quem monta este painel o remonta a
  // cada molécula nova (`key`), e é a remontagem que limpa o estado — zerar à
  // mão dentro do efeito faria a tela renderizar duas vezes à toa.
  useEffect(() => {
    if (inchiKey === null) return;

    let alive = true;
    const load = async (): Promise<void> => {
      const found = await readNamingState(inchiKey);
      if (!alive) return;

      setState(found);
      if (found.status === 'named') setNamed(found.named);
    };

    void load();
    return () => {
      alive = false;
    };
  }, [inchiKey]);

  if (analysis === null || !analysis.ok) return null;

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (text.trim() === '') return;

    setSaving(true);
    const run = async (): Promise<void> => {
      const outcome = await nameMolecule({
        molblock: analysis.molecule.molblock,
        name: text,
      });

      if (outcome.status === 'named' || outcome.status === 'taken') {
        setNamed(outcome.named);
        setKept(outcome.status === 'named');
        setText('');
        setError(outcome.status === 'taken' ? 'Alguém batizou primeiro.' : null);
      } else if (outcome.status === 'known') {
        setState(outcome);
      } else if (outcome.status === 'anonymous') {
        setAnonymous(true);
      } else {
        setError(outcome.reason);
      }

      setSaving(false);
    };

    void run();
  };

  // Composto que já existe lá fora não recebe apelido: ele já tem nome.
  if (named === null && state?.status === 'known') {
    return (
      <section className={styles.panel} aria-label="Composto conhecido">
        <Label>já existe lá fora</Label>
        <p className={styles.named} data-testid="composto-conhecido">
          {state.title !== null && <span className={styles.name}>{state.title}</span>}
          <span className={styles.by}>PubChem CID {state.cid}</span>
        </p>
        <p className={styles.quiet}>
          Esta estrutura já é um composto conhecido, então não há o que batizar. O nome acima é o
          que o PubChem registra — o Rotamer não calcula nomenclatura.
        </p>
      </section>
    );
  }

  if (named !== null) {
    return (
      <section className={styles.panel} aria-label="Apelido da molécula">
        <Label>apelido</Label>
        <p className={styles.named} data-testid="apelido">
          <span className={styles.name}>{named.name}</span>
          <span className={styles.by}>batizada por {named.by}</span>
        </p>
        <p className={styles.quiet}>
          Apelido é autoria, não nomenclatura. O Rotamer escolheu não nomear: quem nomeia escreve
          em inglês, e traduzir nome de composto é decidir estrutura.
        </p>
        {kept && (
          <p className={styles.quiet} data-testid="batismo-guardado">
            A estrutura ficou em <Link href="/minhas">minhas moléculas</Link>. O apelido é da
            estrutura e vale para todo mundo; a cópia guardada é sua.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label="Batizar a molécula">
      <Label>
        {state?.status === 'free' && state.verified
          ? 'estrutura inédita'
          : 'ninguém batizou esta estrutura'}
      </Label>

      <p className={styles.quiet}>
        Apelido é autoria, não nomenclatura. O Rotamer escolheu não nomear: quem nomeia escreve
        em inglês, e traduzir nome de composto é decidir estrutura.
      </p>

      <form className={styles.form} onSubmit={submit}>
        <input
          className={styles.field}
          value={text}
          maxLength={NAME_MAX}
          onChange={(event) => {
            setText(event.target.value);
          }}
          placeholder="Dar um apelido"
          aria-label="Apelido para esta estrutura"
          data-testid="entrada-apelido"
        />
        <Button type="submit" size="small" variant="secondary" disabled={saving}>
          {saving ? 'Batizando…' : 'Batizar'}
        </Button>
      </form>

      <p className={styles.quiet}>Batizar também guarda a estrutura nas suas moléculas.</p>

      {anonymous && (
        <p className={styles.quiet}>
          <Link href="/entrar">Entre na sua conta</Link> para batizar — o apelido leva o nome de
          quem deu.
        </p>
      )}

      {error !== null && (
        <p className={styles.error} data-testid="erro-apelido">
          {error}
        </p>
      )}

      <p className={styles.quiet}>{aboutTheStructure(state)}</p>
    </section>
  );
}

/**
 * O que a tela diz sobre a estrutura enquanto ninguém batizou.
 *
 * O apelido vale para a estrutura nos três casos; o que muda é o que se sabe
 * sobre o mundo lá fora. O terceiro estado não pode virar o padrão: enquanto a
 * consulta está em curso ninguém perguntou nada ao PubChem ainda, e dizer que
 * ele "não respondeu" seria a tela afirmando um fato que não aconteceu. Em 3G
 * de escola pública essa espera é a maior parte do tempo na tela.
 *
 * E o texto de indisponibilidade foi reescrito para uma falha que dura: em
 * 27/08/2026 o PubChem respondeu 503 o dia inteiro, e quem lesse "não consegui
 * confirmar" a manhã toda leria produto quebrado.
 */
function aboutTheStructure(state: NamingState | null): string {
  const base = 'Vale para a estrutura, não para o desenho.';

  if (state === null) {
    return `${base} Estou perguntando ao PubChem se este composto já existe lá fora.`;
  }

  if (state.status === 'free' && state.verified) {
    return `O PubChem não conhece esta estrutura. ${base} Quem chegar a ela por outro caminho encontra o mesmo apelido.`;
  }

  return `${base} O PubChem é serviço de fora e não respondeu — pode demorar a voltar. Isso não impede o batismo aqui dentro; só deixa em aberto se o composto já existe lá fora.`;
}
