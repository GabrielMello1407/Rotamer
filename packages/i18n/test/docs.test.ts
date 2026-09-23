import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * A documentação em inglês acompanha a em português (D-30).
 *
 * Todo documento para leitor tem gêmeo: `README.en.md` ao lado do `README.md`, e em `docs/en/` um
 * arquivo de nome em inglês para cada um de `docs/` — `GUIA.md` é `USER-GUIDE.md`, porque o nome é a
 * primeira coisa que o leitor lê. Quem liga os dois não é o nome: é a primeira linha do gêmeo, que
 * registra o caminho do original e o hash SHA-256 da versão traduzida. Quem muda o português e
 * esquece o inglês fica sabendo aqui, e não pelo leitor que seguiu um guia descrevendo uma tela que
 * já não existe.
 *
 * O teste lê arquivos fora do pacote. É por isso que `packages/i18n/turbo.json` põe `docs/` e os
 * `.md` da raiz entre as entradas da tarefa `test`: sem isso, o Turborepo devolveria do cache um
 * verde antigo depois de o documento mudar.
 */

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DOCS = join(ROOT, 'docs');
const ENGLISH_DOCS = join(DOCS, 'en');

/**
 * Rascunho de divulgação não tem gêmeo: é peça que o `marketing` escreve em pt-BR para um público
 * brasileiro. Peça muda de idioma quando muda de público, e aí é outra peça — não tradução.
 */
const OUTREACH = join(DOCS, 'divulgacao');

/** Os da raiz que são para leitor. `CLAUDE.md` e `AGENTS.md` são instrução para assistente. */
const ROOT_DOCUMENTS = ['README.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md'];

/** Nomes que já são inglês no original; o gêmeo pode repeti-los. */
const ALREADY_ENGLISH = new Set(['DEPLOY.md', 'DESIGN-SYSTEM.md', 'PITCH.md', 'README.md', 'ROADMAP.md']);

const HEADER = /^<!-- source: (\S+) · sha256:([0-9a-f]{64}) -->$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

function markdownUnder(dir: string, skip: readonly string[] = []): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return skip.includes(path) ? [] : markdownUnder(path, skip);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

function repoPath(path: string): string {
  return relative(ROOT, path).split(sep).join('/');
}

/** O texto como o git guarda: sem BOM e com `\n` — o hash não pode mudar com o sistema operacional. */
function normalized(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

interface Source {
  readonly original: string;
  readonly hash: string;
}

/** O que a primeira linha do gêmeo diz traduzir, ou `null` se ela não diz. */
function sourceOf(twin: string): Source | null {
  const match = HEADER.exec(normalized(twin).split('\n')[0] ?? '');
  if (match?.[1] === undefined || match[2] === undefined) return null;
  return { original: match[1], hash: match[2] };
}

interface Heading {
  readonly level: number;
  readonly title: string;
}

/** Os títulos do documento, fora de bloco de código — o esqueleto que os dois idiomas dividem. */
function outline(text: string): Heading[] {
  const headings: Heading[] = [];
  let fence: string | null = null;

  for (const line of text.split('\n')) {
    const marker = FENCE.exec(line)?.[1];
    if (marker !== undefined) {
      if (fence === null) fence = marker.charAt(0);
      else if (marker.charAt(0) === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;

    const match = HEADING.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      headings.push({ level: match[1].length, title: match[2] });
    }
  }
  return headings;
}

const ORIGINALS = [
  ...ROOT_DOCUMENTS.map((name) => join(ROOT, name)),
  ...markdownUnder(DOCS, [ENGLISH_DOCS, OUTREACH]),
]
  .map(repoPath)
  .sort();

const TWINS = [
  ...readdirSync(ROOT).filter((name) => name.endsWith('.en.md')),
  ...markdownUnder(ENGLISH_DOCS).map(repoPath),
].sort();

describe('a documentação em inglês acompanha a em português', () => {
  it('confere os documentos da raiz e de docs/, e não confunde o inglês com original', () => {
    expect(ORIGINALS).toContain('README.md');
    expect(ORIGINALS).toContain('docs/GUIA.md');
    expect(ORIGINALS).toContain('docs/pesquisa/nomenclatura.md');
    expect(ORIGINALS.filter((path) => path.startsWith('docs/en/'))).toEqual([]);
    expect(ORIGINALS.filter((path) => path.startsWith('docs/divulgacao/'))).toEqual([]);
    expect(TWINS).toContain('README.en.md');
    expect(TWINS).toContain('docs/en/USER-GUIDE.md');
  });

  it.each(TWINS)('%s diz na primeira linha qual original traduz', (twin) => {
    const source = sourceOf(twin);
    expect(source, `${twin} precisa começar com <!-- source: docs/… · sha256:… -->`).not.toBeNull();
    expect(ORIGINALS, `${twin} diz traduzir ${source?.original ?? '?'}, que não existe`).toContain(
      source?.original,
    );
  });

  it.each(ORIGINALS)('%s tem exatamente um gêmeo em inglês', (original) => {
    const twins = TWINS.filter((twin) => sourceOf(twin)?.original === original);
    expect(twins, `gêmeos de ${original}`).toHaveLength(1);
  });

  it.each(TWINS.filter((twin) => twin.startsWith('docs/en/')))(
    '%s tem nome em inglês, não o do original',
    (twin) => {
      const original = sourceOf(twin)?.original;
      if (original === undefined) return;

      const name = basename(original);
      if (ALREADY_ENGLISH.has(name)) return;
      expect(
        basename(twin),
        `${twin} repete o nome de ${original} — quem só lê inglês não sabe do que ele trata`,
      ).not.toBe(name);
    },
  );

  it.each(TWINS)('%s traduz a versão atual do original', (twin) => {
    const source = sourceOf(twin);
    if (source === null || !existsSync(join(ROOT, source.original))) return;

    const current = sha256(normalized(source.original));
    expect(
      source.hash,
      `${source.original} mudou depois da tradução. Leve a mudança para ${twin} e troque o hash da primeira linha por ${current}`,
    ).toBe(current);
  });

  it.each(TWINS)('%s tem os mesmos títulos do original, nos mesmos níveis', (twin) => {
    const source = sourceOf(twin);
    if (source === null || !existsSync(join(ROOT, source.original))) return;

    const portuguese = outline(normalized(source.original));
    const english = outline(normalized(twin));
    const size = Math.max(portuguese.length, english.length);

    for (let i = 0; i < size; i++) {
      const pt = portuguese[i];
      const en = english[i];
      expect(
        en?.level,
        `título ${String(i + 1)}: «${pt?.title ?? '(nenhum)'}» em ${source.original}, «${en?.title ?? '(nenhum)'}» em ${twin}`,
      ).toBe(pt?.level);
    }
  });
});
