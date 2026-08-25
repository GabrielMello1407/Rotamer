'use client';

import type { AnalysisResult } from '@rotamer/core';
import { Button, Label } from '@rotamer/ui';
import Link from 'next/link';
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { nameMolecule, readName, type NamedMolecule } from '../actions/naming';
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
  const [named, setNamed] = useState<NamedMolecule | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);

  const inchiKey = analysis !== null && analysis.ok ? analysis.molecule.inchiKey : null;

  // O apelido é da estrutura, não da sessão: quem monta este painel o remonta a
  // cada molécula nova (`key`), e é a remontagem que limpa o estado — zerar à
  // mão dentro do efeito faria a tela renderizar duas vezes à toa.
  useEffect(() => {
    if (inchiKey === null) return;

    let alive = true;
    const load = async (): Promise<void> => {
      const found = await readName(inchiKey);
      if (alive) setNamed(found);
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
        setText('');
        setError(outcome.status === 'taken' ? 'Alguém batizou primeiro.' : null);
      } else if (outcome.status === 'anonymous') {
        setAnonymous(true);
      } else {
        setError(outcome.reason);
      }

      setSaving(false);
    };

    void run();
  };

  if (named !== null) {
    return (
      <section className={styles.panel} aria-label="Apelido da molécula">
        <Label>apelido</Label>
        <p className={styles.named} data-testid="apelido">
          <span className={styles.name}>{named.name}</span>
          <span className={styles.by}>batizada por {named.by}</span>
        </p>
        <p className={styles.quiet}>
          Apelido dentro do Rotamer, não nomenclatura: o produto não calcula nome de composto.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label="Batizar a molécula">
      <Label>ninguém batizou esta estrutura</Label>

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

      <p className={styles.quiet}>
        Vale para a estrutura, não para o desenho: quem chegar a ela por outro caminho encontra o
        mesmo apelido. E ainda não sabemos se este composto já existe fora do Rotamer — a
        verificação entra junto com a busca por nome.
      </p>
    </section>
  );
}
