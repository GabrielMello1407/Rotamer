import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dictionaryDivergences, type Dictionary, type MessageTree } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';

import { siteMessages } from './messages';
import * as actions from './actions/messages';
import * as components from './components/messages';
import { codesMessages } from './codigos/messages';
import { accountMessages as signInMessages } from './entrar/messages';
import { schoolsMessages } from './escolas/messages';
import { moleculeMessages } from './m/[smiles]/messages';
import { brandMessages } from './marca/messages';
import { libraryMessages as shelfMessages } from './minhas/messages';
import { passwordMessages } from './senha/messages';
import { messages as classroomMessages } from './turmas/messages';
import { nicknameMessages, questResolveMessages } from '../lib/messages';
import { tutorPromptMessages } from '../lib/tutor/messages';

/**
 * Nenhum dicionário do app fica com um idioma só.
 *
 * O tipo já recusa a chave que falta — `dictionary()` infere o formato do
 * português e obriga o inglês a caber nele. O que este arquivo cobre é o que o
 * tipo não vê: lista com tamanhos diferentes, função de um lado e frase do
 * outro, texto vazio. E, principalmente, **dicionário novo que ninguém
 * lembrou de conferir**: a última asserção lê a pasta e falha se aparecer um
 * `messages.ts` que esta lista não conhece.
 */

const DICIONARIOS: Readonly<Record<string, Dictionary<MessageTree>>> = {
  site: siteMessages,
  turmas: classroomMessages,
  códigos: codesMessages,
  entrar: signInMessages,
  escolas: schoolsMessages,
  molécula: moleculeMessages,
  marca: brandMessages,
  estante: shelfMessages,
  senha: passwordMessages,
  apelido: nicknameMessages,
  'resolução de missão': questResolveMessages,
  'prompt do tutor': tutorPromptMessages,
  ...dicionariosDe('ações', actions),
  ...dicionariosDe('componentes', components),
};

/** Os dicionários exportados por um módulo que reúne vários. */
function dicionariosDe(
  prefixo: string,
  modulo: Readonly<Record<string, unknown>>,
): Record<string, Dictionary<MessageTree>> {
  const encontrados: Record<string, Dictionary<MessageTree>> = {};

  for (const [nome, valor] of Object.entries(modulo)) {
    if (ehDicionario(valor)) encontrados[`${prefixo}: ${nome}`] = valor;
  }

  return encontrados;
}

function ehDicionario(valor: unknown): valor is Dictionary<MessageTree> {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'pt-BR' in valor &&
    'en' in valor &&
    typeof (valor as Record<string, unknown>)['pt-BR'] === 'object'
  );
}

describe('o app fala os dois idiomas', () => {
  for (const [nome, entries] of Object.entries(DICIONARIOS)) {
    it(`${nome}: nenhuma chave sem par, nenhum texto vazio`, () => {
      expect(dictionaryDivergences(entries)).toEqual([]);
    });
  }

  it('cobre todos os dicionários que existem no app', () => {
    const raiz = fileURLToPath(new URL('..', import.meta.url));
    const esperados = arquivosDeMensagens(raiz).sort();

    // Um `messages.ts` novo precisa entrar na lista acima — senão ele nasce
    // sem ninguém conferindo se o inglês acompanhou.
    expect(esperados).toEqual([
      'app/actions/messages.ts',
      'app/codigos/messages.ts',
      'app/components/messages.ts',
      'app/entrar/messages.ts',
      'app/escolas/messages.ts',
      'app/m/[smiles]/messages.ts',
      'app/marca/messages.ts',
      'app/messages.ts',
      'app/minhas/messages.ts',
      'app/senha/messages.ts',
      'app/turmas/messages.ts',
      'lib/messages.ts',
      'lib/tutor/messages.ts',
    ]);
  });
});

/** Todo `messages.ts` sob `app/` e `lib/`, em caminho relativo à raiz do app. */
function arquivosDeMensagens(raiz: string): string[] {
  const encontrados: string[] = [];

  const andar = (pasta: string, prefixo: string): void => {
    for (const entrada of readdirSync(`${raiz}/${pasta}`, { withFileTypes: true })) {
      if (entrada.isDirectory()) {
        andar(`${pasta}/${entrada.name}`, `${prefixo}${entrada.name}/`);
      } else if (entrada.name === 'messages.ts') {
        encontrados.push(`${prefixo}messages.ts`);
      }
    }
  };

  andar('app', 'app/');
  andar('lib', 'lib/');
  return encontrados;
}
