'use client';

import { fromMolblock, type ChemistryError, type ChemistryErrorCode } from '@rotamer/core';
import type { EditorStore } from '@rotamer/editor2d';
import { chemistryErrorText, pick, type Locale } from '@rotamer/i18n';
import { useLocale, useMessages } from '@rotamer/i18n/react';
import { Button } from '@rotamer/ui';
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { findByName } from '../actions/search';
import { smilesInputMessages } from './messages';
import styles from './SmilesInput.module.css';
import type { ChemistryConnection } from './use-chemistry-client';

export interface SmilesInputProps {
  readonly store: EditorStore;
  readonly connection: ChemistryConnection;
}

/**
 * Trazer molécula de fora: por SMILES ou por nome.
 *
 * Um campo só, porque para quem usa é a mesma intenção — "quero esta molécula
 * na tela". O que decide o caminho é o RDKit: se ele lê o texto como estrutura,
 * carrega direto; se não lê, o texto vira consulta de nome no PubChem.
 *
 * A ordem importa. `CCO` é etanol para o RDKit e também é um nome plausível de
 * catálogo em algum lugar — perguntar primeiro ao motor determinístico evita
 * ida à rede e evita ambiguidade.
 *
 * E "não consegui ler" não é tudo igual: `C(C)(C)(C)(C)C` **é** uma estrutura,
 * só que impossível, e a explicação certa para ela é a química. Só texto que
 * nem parece estrutura vira consulta de nome.
 */

/**
 * Erros que dizem "isto é uma estrutura, e ela não existe".
 *
 * Nesses casos a mensagem do motor determinístico é melhor do que qualquer
 * coisa que a busca por nome pudesse dizer.
 */
const STRUCTURE_ERRORS: readonly ChemistryErrorCode[] = [
  'valence_exceeded',
  'impossible_aromaticity',
  'invalid_structure',
];

export function SmilesInput({ store, connection }: SmilesInputProps): ReactElement {
  const locale = useLocale();
  const messages = useMessages(smilesInputMessages);
  const [text, setText] = useState('');
  const [queued, setQueued] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const client = connection.status === 'ready' ? connection.client : null;

  // Colar antes de o motor subir não é erro: o pedido fica na fila e entra
  // assim que o worker responde. Num celular fraco essa espera é a regra.
  useEffect(() => {
    if (queued === null || !client) return;

    let alive = true;

    const load = async (): Promise<void> => {
      const asStructure = await client.analyze(queued);
      if (!alive) return;

      if (asStructure.ok) {
        store.getState().commit(fromMolblock(asStructure.molecule.molblock));
        store.getState().frame();
        setError(null);
        setNote(null);
        setText('');
        setQueued(null);
        return;
      }

      // Estrutura impossível não vira busca por nome: quem explica é a química.
      if (STRUCTURE_ERRORS.includes(asStructure.error.code)) {
        setNote(null);
        setError(chemistryErrorText(locale, asStructure.error));
        setQueued(null);
        return;
      }

      // Não parece estrutura: então é nome.
      const found = await findByName(queued);
      if (!alive) return;

      if (found.status === 'found') {
        const structure = await client.analyze(found.compound.smiles);
        if (!alive) return;

        if (structure.ok) {
          store.getState().commit(fromMolblock(structure.molecule.molblock));
          store.getState().frame();
          setError(null);
          setNote(
            found.compound.title === null
              ? messages.foundUntitled(found.compound.cid)
              : messages.found(found.compound.title, found.compound.cid),
          );
          setText('');
          setQueued(null);
          return;
        }
      }

      setNote(null);
      setError(
        messageFor(locale, found.status, queued, asStructure.ok ? null : asStructure.error),
      );
      setQueued(null);
    };

    void load();
    return () => {
      alive = false;
    };
  }, [queued, client, store, locale, messages]);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const entry = text.trim();
    if (entry === '') return;

    setError(null);
    setNote(null);
    setQueued(entry);
  };

  const waiting = queued !== null;

  return (
    <form className={styles.form} onSubmit={submit}>
      <input
        className={styles.field}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        placeholder={messages.placeholder}
        aria-label={messages.label}
        data-testid="entrada-smiles"
        spellCheck={false}
        autoComplete="off"
      />
      <Button type="submit" size="small" variant="secondary" disabled={waiting}>
        {waiting ? messages.searching : messages.load}
      </Button>

      {note !== null && (
        <p className={styles.note} data-testid="origem-molecula">
          {note}
        </p>
      )}

      {error !== null && (
        <p className={styles.error} data-testid="erro-smiles">
          {error}
        </p>
      )}
    </form>
  );
}

/**
 * A mensagem certa para cada desfecho.
 *
 * Quando o texto parece estrutura e o RDKit recusou, quem explica é ele — a
 * recusa do núcleo vira frase em `chemistryErrorText`, e ela já fala de
 * química. Quando é nome, a explicação é sobre a busca.
 */
function messageFor(
  locale: Locale,
  status: 'not-found' | 'unavailable' | 'rejected' | 'found',
  entry: string,
  chemistryError: ChemistryError | null,
): string {
  const messages = pick(smilesInputMessages, locale);

  if (status === 'unavailable') return messages.pubchemQuiet;
  if (status === 'not-found') return messages.notFound(entry);

  return chemistryError === null
    ? messages.cantLoad
    : chemistryErrorText(locale, chemistryError);
}
