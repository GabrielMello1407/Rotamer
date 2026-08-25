import { BOND_LENGTH } from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import { createEditorStore } from '../src/store';

/** O editor mexe no grafo. Se a molécula existe, quem responde é o RDKit. */

describe('histórico', () => {
  it('desfaz e refaz passo a passo', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });

    expect(state().graph.atoms).toHaveLength(2);

    state().undo();
    expect(state().graph.atoms).toHaveLength(1);

    state().undo();
    expect(state().graph.atoms).toHaveLength(0);

    state().redo();
    state().redo();
    expect(state().graph.atoms).toHaveLength(2);
    expect(state().graph.bonds).toHaveLength(1);
  });

  it('desfazer no começo não quebra nada', () => {
    const store = createEditorStore();

    store.getState().undo();
    store.getState().redo();

    expect(store.getState().graph.atoms).toHaveLength(0);
  });

  it('um passo novo apaga o que havia para refazer', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    state().addAtomAt({ x: 0, y: 0 });
    state().undo();
    expect(state().future).toHaveLength(1);

    state().addAtomAt({ x: 2, y: 2 });
    expect(state().future).toHaveLength(0);
  });

  it('um arrasto inteiro vira um passo só', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const atom = state().addAtomAt({ x: 0, y: 0 });
    const before = state().graph;

    // Cada quadro do arrasto mexe no grafo sem marcar histórico.
    state().dragAtomTo(atom, { x: 1, y: 0 });
    state().dragAtomTo(atom, { x: 2, y: 0 });
    state().dragAtomTo(atom, { x: 3, y: 0 });
    expect(state().past).toHaveLength(1);

    state().closeUndoStep(before);
    expect(state().past).toHaveLength(2);

    state().undo();
    expect(state().graph.atoms[0]?.x).toBe(0);
  });
});

describe('desenho', () => {
  it('o elemento ativo é o que entra no átomo novo', () => {
    const store = createEditorStore();

    store.getState().setElement('N');
    store.getState().addAtomAt({ x: 0, y: 0 });

    expect(store.getState().graph.atoms[0]?.element).toBe('N');
  });

  it('não repete ligação entre os mesmos dois átomos', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    const second = state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });

    state().bondTo(first, second);
    state().bondTo(second, first);

    expect(state().graph.bonds).toHaveLength(1);
  });

  it('a ordem da ligação gira com o clique', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });
    const bond = state().graph.bonds[0];
    if (!bond) throw new Error('faltou a ligação');

    state().cycleBond(bond.id);
    expect(state().graph.bonds[0]?.order).toBe(2);

    state().cycleBond(bond.id);
    expect(state().graph.bonds[0]?.order).toBe(3);

    state().cycleBond(bond.id);
    expect(state().graph.bonds[0]?.order).toBe(1);
  });

  it('apagar átomo leva junto as ligações dele', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });

    state().eraseAtom(first);

    expect(state().graph.atoms).toHaveLength(1);
    expect(state().graph.bonds).toHaveLength(0);
  });
});
