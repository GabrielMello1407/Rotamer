import { BOND_LENGTH, fromMolblock, toMolblock } from '@rotamer/core';
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

describe('seleção', () => {
  it('commit(fromMolblock(...)) deixa a seleção vazia — o identificador renumerado não pode sobreviver', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });
    state().setSelection({ atoms: new Set([first]), bonds: new Set() });

    // O mesmo caminho de "organizar o desenho" (`tidy` → `fromMolblock`) e de
    // carregar um exemplo pronto: o molblock renumera os átomos a partir de
    // 1, e um número velho passaria a apontar para um átomo diferente — errado
    // e silencioso, pior que vazio.
    state().commit(fromMolblock(toMolblock(state().graph)));

    expect(state().selection.atoms.size).toBe(0);
    expect(state().selection.bonds.size).toBe(0);
  });

  it('desfazer, refazer e limpar zeram a seleção', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    state().addAtomAt({ x: BOND_LENGTH, y: 0 });

    state().setSelection({ atoms: new Set([first]), bonds: new Set() });
    expect(state().selection.atoms.size).toBe(1);
    state().undo();
    expect(state().selection.atoms.size).toBe(0);

    state().setSelection({ atoms: new Set([first]), bonds: new Set() });
    state().redo();
    expect(state().selection.atoms.size).toBe(0);

    state().setSelection({ atoms: new Set([first]), bonds: new Set() });
    state().clear();
    expect(state().selection.atoms.size).toBe(0);
  });

  it('apagar um átomo tira da seleção a ligação que ele tinha', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });
    const bond = state().graph.bonds[0];
    if (!bond) throw new Error('faltou a ligação');

    state().setSelection({ atoms: new Set([first]), bonds: new Set([bond.id]) });
    state().eraseAtom(first);

    // A ligação some junto com o átomo; não pode sobrar na seleção apontando
    // para um identificador que o grafo não tem mais.
    expect(state().selection.bonds.has(bond.id)).toBe(false);
    expect(state().selection.atoms.has(first)).toBe(false);
  });

  it('amend poda a seleção quadro a quadro: quem sumiu sai, quem sobrou continua pego', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    const second = state().addAtomAt({ x: BOND_LENGTH, y: 0 });
    state().setSelection({ atoms: new Set([first, second]), bonds: new Set() });

    // O mesmo formato de um quadro de arrasto — o grafo muda por baixo, sem
    // passar por `eraseAtom`.
    const semOPrimeiro = {
      ...state().graph,
      atoms: state().graph.atoms.filter((atom) => atom.id !== first),
    };
    state().amend(semOPrimeiro);

    expect(state().selection.atoms.has(first)).toBe(false);
    expect(state().selection.atoms.has(second)).toBe(true);
  });

  it('shift+clique soma, tira e alterna o átomo na seleção', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });

    state().toggleAtomSelection(first);
    expect(state().selection.atoms.has(first)).toBe(true);

    state().toggleAtomSelection(first);
    expect(state().selection.atoms.has(first)).toBe(false);

    state().addAtomToSelection(first);
    expect(state().selection.atoms.has(first)).toBe(true);

    state().removeAtomFromSelection(first);
    expect(state().selection.atoms.has(first)).toBe(false);
  });

  it('selecionar as duas pontas de uma ligação, uma de cada vez, não marca a ligação sozinha', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    const second = state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });

    state().toggleAtomSelection(first);
    state().toggleAtomSelection(second);

    // Decisão: os dois conjuntos são independentes. A ligação só entra na
    // seleção quando é pega diretamente — clique nela, o retângulo cercando
    // as duas pontas, ou a travessia do fragmento — nunca por inferência a
    // partir dos átomos das pontas.
    expect(state().selection.atoms.size).toBe(2);
    expect(state().selection.bonds.size).toBe(0);
  });

  it('selecionar tudo pega todo átomo e toda ligação do grafo', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });

    state().selectAll();

    expect(state().selection.atoms.size).toBe(2);
    expect(state().selection.bonds.size).toBe(1);
  });

  it('selecionar o fragmento pega tudo o que está ligado, e nada de um segundo fragmento', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });
    const solto = state().addAtomAt({ x: 10, y: 10 });

    state().selectFragmentFromAtom(first);

    expect(state().selection.atoms.size).toBe(2);
    expect(state().selection.atoms.has(solto)).toBe(false);
    expect(state().selection.bonds.size).toBe(1);
  });

  it('mover em bloco desloca todos os átomos selecionados pela mesma quantia, e mais ninguém', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    const second = state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });
    const fora = state().addAtomAt({ x: 5, y: 5 });

    const base = state().graph;
    state().setSelection({ atoms: new Set([first, second]), bonds: new Set() });
    state().moveSelectionBy(base, { x: 1, y: 2 });

    const atomFirst = state().graph.atoms.find((atom) => atom.id === first);
    const atomSecond = state().graph.atoms.find((atom) => atom.id === second);
    const atomFora = state().graph.atoms.find((atom) => atom.id === fora);

    expect(atomFirst?.x).toBe(1);
    expect(atomFirst?.y).toBe(2);
    expect(atomSecond?.x).toBeCloseTo(BOND_LENGTH + 1, 6);
    expect(atomFora?.x).toBe(5);
  });

  it('apagar a seleção volta inteira com um desfazer só', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    const second = state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });
    state().bondToNewAtom(second, { x: BOND_LENGTH * 2, y: 0 });

    const stepsAntes = state().past.length;
    state().setSelection({ atoms: new Set([first, second]), bonds: new Set() });
    state().eraseSelection();

    expect(state().graph.atoms).toHaveLength(1);
    expect(state().past.length).toBe(stepsAntes + 1);

    state().undo();
    expect(state().graph.atoms).toHaveLength(3);
  });

  it('trocar elemento em bloco não toca em átomo fora da seleção', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    const second = state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });

    state().setSelection({ atoms: new Set([first]), bonds: new Set() });
    state().changeSelectionElement('N');

    expect(state().graph.atoms.find((atom) => atom.id === first)?.element).toBe('N');
    expect(state().graph.atoms.find((atom) => atom.id === second)?.element).toBe('C');
    // Quem pediu para preservar a seleção continua vendo o que mudou.
    expect(state().selection.atoms.has(first)).toBe(true);
  });

  it('trocar a ordem em bloco muda só as ligações selecionadas', () => {
    const store = createEditorStore();
    const state = () => store.getState();

    const first = state().addAtomAt({ x: 0, y: 0 });
    const second = state().bondToNewAtom(first, { x: BOND_LENGTH, y: 0 });
    state().bondToNewAtom(second, { x: BOND_LENGTH * 2, y: 0 });

    const primeiraLigacao = state().graph.bonds[0];
    if (!primeiraLigacao) throw new Error('faltou a ligação');

    state().setSelection({ atoms: new Set(), bonds: new Set([primeiraLigacao.id]) });
    state().setSelectionOrder(2);

    expect(state().graph.bonds.find((bond) => bond.id === primeiraLigacao.id)?.order).toBe(2);
    expect(state().graph.bonds[1]?.order).toBe(1);
  });
});
