'use client';

import { fromMolblock, type ChemistryErrorCode } from '@rotamer/core';
import type { EditorStore } from '@rotamer/editor2d';
import { Button } from '@rotamer/ui';
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { findByName } from '../actions/search';
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
        setError(asStructure.error.message);
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
              ? `Encontrado no PubChem (CID ${String(found.compound.cid)}).`
              : `${found.compound.title} — PubChem CID ${String(found.compound.cid)}.`,
          );
          setText('');
          setQueued(null);
          return;
        }
      }

      setNote(null);
      setError(messageFor(found.status, queued, asStructure.ok ? null : asStructure.error.message));
      setQueued(null);
    };

    void load();
    return () => {
      alive = false;
    };
  }, [queued, client, store]);

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
        placeholder="SMILES ou nome"
        aria-label="Carregar molécula por SMILES ou por nome"
        data-testid="entrada-smiles"
        spellCheck={false}
        autoComplete="off"
      />
      <Button type="submit" size="small" variant="secondary" disabled={waiting}>
        {waiting ? 'Buscando…' : 'Carregar'}
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
 * mensagem já fala de química. Quando é nome, a explicação é sobre a busca.
 */
function messageFor(
  status: 'not-found' | 'unavailable' | 'rejected' | 'found',
  entry: string,
  chemistryError: string | null,
): string {
  if (status === 'unavailable') {
    return 'O PubChem não respondeu agora. Colar o SMILES continua funcionando.';
  }

  if (status === 'not-found') {
    return `Não encontrei "${entry}" no PubChem. Confira a grafia ou cole o SMILES.`;
  }

  return chemistryError ?? 'Não consegui carregar essa molécula.';
}
