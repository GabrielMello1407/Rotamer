import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findCompoundByInchiKey, findCompoundByName, resetCircuit } from './pubchem';

/**
 * O PubChem é serviço de terceiro: limita ritmo, muda nome de propriedade entre
 * versões e às vezes responde que está ocupado. Estes testes usam respostas
 * gravadas justamente para fixar o que fazemos em cada caso — sem depender de a
 * rede estar boa no dia.
 */

function respond(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function propriedades(row: Record<string, unknown>): unknown {
  return { PropertyTable: { Properties: [row] } };
}

beforeEach(() => {
  resetCircuit();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('estrutura a partir do nome', () => {
  it('lê a propriedade `SMILES`, que é como o PUG REST responde hoje', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        respond(200, propriedades({ CID: 2519, SMILES: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C', MolecularFormula: 'C8H10N4O2', Title: 'Caffeine' })),
      ),
    );

    const achado = await findCompoundByName('cafeina');

    expect(achado.status).toBe('ok');
    if (achado.status !== 'ok') return;
    expect(achado.value.smiles).toBe('Cn1cnc2c1c(=O)n(C)c(=O)n2C');
    expect(achado.value.cid).toBe(2519);
    expect(achado.value.title).toBe('Caffeine');
  });

  it('também aceita `IsomericSMILES` e `CanonicalSMILES`, de versões anteriores', async () => {
    for (const chave of ['IsomericSMILES', 'CanonicalSMILES', 'ConnectivitySMILES']) {
      vi.stubGlobal('fetch', () =>
        Promise.resolve(respond(200, propriedades({ CID: 702, [chave]: 'CCO' }))),
      );

      const achado = await findCompoundByName('etanol');
      expect(achado.status).toBe('ok');
      if (achado.status !== 'ok') continue;
      expect(achado.value.smiles).toBe('CCO');
    }
  });

  it('404 é resposta: esse nome não existe', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(respond(404, { Fault: { Code: 'PUGREST.NotFound' } })),
    );

    expect((await findCompoundByName('xyzabcnaoexiste')).status).toBe('nao-encontrado');
  });

  it('servidor ocupado não é "não existe" — é "não sei agora"', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(respond(503, { Fault: { Code: 'PUGREST.ServerBusy' } })),
    );

    expect((await findCompoundByName('cafeina')).status).toBe('indisponivel');
  });

  it('rede caída também é "não sei agora"', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('sem rede')));

    expect((await findCompoundByName('cafeina')).status).toBe('indisponivel');
  });

  it('resposta sem SMILES nenhum não vira molécula', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(respond(200, propriedades({ CID: 1, MolecularFormula: 'C2H6O' }))),
    );

    expect((await findCompoundByName('etanol')).status).toBe('indisponivel');
  });
});

describe('estrutura já conhecida', () => {
  it('acha o composto pela InChIKey', async () => {
    vi.stubGlobal('fetch', (url: string) =>
      Promise.resolve(
        url.includes('/cids/')
          ? respond(200, { IdentifierList: { CID: [2244] } })
          : respond(200, propriedades({ CID: 2244, Title: 'Aspirin' })),
      ),
    );

    const conhecido = await findCompoundByInchiKey('BSYNRYMUTXBXSQ-UHFFFAOYSA-N');

    expect(conhecido.status).toBe('ok');
    if (conhecido.status !== 'ok') return;
    expect(conhecido.value.cid).toBe(2244);
    expect(conhecido.value.title).toBe('Aspirin');
  });

  it('404 quer dizer inédito lá fora', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(respond(404, {})));

    expect((await findCompoundByInchiKey('AAAAAAAAAAAAAA-UHFFFAOYSA-N')).status).toBe(
      'nao-encontrado',
    );
  });

  it('sem título, o composto ainda é conhecido', async () => {
    vi.stubGlobal('fetch', (url: string) =>
      Promise.resolve(
        url.includes('/cids/') ? respond(200, { IdentifierList: { CID: [999] } }) : respond(503, {}),
      ),
    );

    const conhecido = await findCompoundByInchiKey('BBBBBBBBBBBBBB-UHFFFAOYSA-N');

    expect(conhecido.status).toBe('ok');
    if (conhecido.status !== 'ok') return;
    expect(conhecido.value.title).toBeNull();
  });
});

describe('disjuntor', () => {
  it('depois de três recusas seguidas, para de chamar', async () => {
    let chamadas = 0;
    vi.stubGlobal('fetch', () => {
      chamadas += 1;
      return Promise.resolve(respond(503, { Fault: { Code: 'PUGREST.ServerBusy' } }));
    });

    // Servidor ocupado gasta uma chamada por busca: insistir com outro formato
    // de propriedade não melhora nada e só irrita quem está do outro lado.
    await findCompoundByName('a');
    await findCompoundByName('b');
    await findCompoundByName('c');
    expect(chamadas).toBe(3);

    // Aberto o disjuntor, as buscas seguintes nem saem.
    await findCompoundByName('d');
    await findCompoundByName('e');

    expect(chamadas).toBe(3);
    expect((await findCompoundByName('f')).status).toBe('indisponivel');
  });

  it('uma recusa isolada não cega a busca', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(respond(503, {})));
    await findCompoundByName('a');

    vi.stubGlobal('fetch', () =>
      Promise.resolve(respond(200, propriedades({ CID: 702, SMILES: 'CCO' }))),
    );

    expect((await findCompoundByName('etanol')).status).toBe('ok');
  });
});
