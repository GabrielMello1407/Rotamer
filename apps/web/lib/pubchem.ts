/**
 * Consulta ao PubChem.
 *
 * O PubChem é do NCBI e os dados são de domínio público; a atribuição está em
 * `docs/TERCEIROS.md`. Duas coisas se pedem a ele: **estrutura a partir de um
 * nome**, que tira o SMILES do caminho de quem sabe dizer "cafeína", e **se uma
 * estrutura já é conhecida**, que é o que o batismo precisa saber (D-15).
 *
 * Ele é um serviço de terceiro e se comporta como tal: limita o ritmo, às vezes
 * responde `ServerBusy`, e não pode derrubar nada aqui. Toda função devolve
 * `indisponivel` em vez de lançar, e quem chama segue sem ele.
 */

const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

/**
 * Cinco segundos. Quem está esperando na tela não vai esperar mais que isso por
 * um serviço que talvez nem responda.
 */
const TIMEOUT_MS = 5000;

/**
 * O disjuntor.
 *
 * Depois de algumas recusas seguidas, o PubChem para de ser chamado por um
 * tempo. Duas razões: insistir com quem já disse "estou ocupado" é o caminho
 * curto para tomar bloqueio de IP, e cada tentativa que vai morrer no tempo
 * limite é uma pessoa esperando à toa na tela.
 */
const FAILURES_BEFORE_OPEN = 3;
const COOLDOWN_MS = 60_000;

let consecutiveFailures = 0;
let openUntil = 0;

function circuitOpen(): boolean {
  return Date.now() < openUntil;
}

function noteFailure(): void {
  consecutiveFailures += 1;

  if (consecutiveFailures >= FAILURES_BEFORE_OPEN) {
    openUntil = Date.now() + COOLDOWN_MS;
    consecutiveFailures = 0;
  }
}

function noteSuccess(): void {
  consecutiveFailures = 0;
  openUntil = 0;
}

/** O PubChem pede que quem consulta se identifique. */
const HEADERS = {
  accept: 'application/json',
  'user-agent': 'Rotamer/0.1 (editor de moleculas para ensino; +https://github.com/rotamer)',
};

export type Lookup<T> =
  | { readonly status: 'ok'; readonly value: T }
  | { readonly status: 'nao-encontrado' }
  | { readonly status: 'indisponivel' };

export interface CompoundByName {
  readonly cid: number;
  readonly smiles: string;
  readonly formula: string | null;
  readonly title: string | null;
}

/**
 * As propriedades mudaram de nome ao longo das versões do PUG REST: já foi
 * `CanonicalSMILES`, já foi `IsomericSMILES`, hoje há `SMILES` e
 * `ConnectivitySMILES`. Em vez de apostar numa, pedimos e aceitamos o que vier.
 */
const SMILES_KEYS = ['SMILES', 'IsomericSMILES', 'CanonicalSMILES', 'ConnectivitySMILES'] as const;

const PROPERTY_SETS = [
  'SMILES,MolecularFormula,Title',
  'IsomericSMILES,MolecularFormula,Title',
  'CanonicalSMILES,MolecularFormula',
] as const;

interface PropertyRow {
  readonly CID?: number;
  readonly MolecularFormula?: string;
  readonly Title?: string;
  readonly [key: string]: unknown;
}

interface PropertyResponse {
  readonly PropertyTable?: { readonly Properties?: readonly PropertyRow[] };
}

interface CidResponse {
  readonly IdentifierList?: { readonly CID?: readonly number[] };
}

async function ask(path: string): Promise<Response | null> {
  if (circuitOpen()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE}${path}`, { headers: HEADERS, signal: controller.signal });

    // 404 é resposta boa: o serviço está de pé e disse que não conhece.
    if (response.ok || response.status === 404) noteSuccess();
    else noteFailure();

    return response;
  } catch {
    noteFailure();
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Só para o teste conseguir começar do zero. */
export function resetCircuit(): void {
  consecutiveFailures = 0;
  openUntil = 0;
}

function readSmiles(row: PropertyRow): string | null {
  for (const key of SMILES_KEYS) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
}

/** Estrutura a partir de um nome comum, sistemático ou comercial. */
export async function findCompoundByName(name: string): Promise<Lookup<CompoundByName>> {
  const query = encodeURIComponent(name.trim());
  if (query === '') return { status: 'nao-encontrado' };

  let sawNotFound = false;

  for (const properties of PROPERTY_SETS) {
    const response = await ask(`/compound/name/${query}/property/${properties}/JSON`);

    // Sem resposta quer dizer rede caída ou disjuntor aberto: tentar outro
    // formato de propriedade não vai mudar isso.
    if (response === null) break;

    // 404 é resposta: esse nome não existe no PubChem. Vale para todos os
    // conjuntos de propriedade, então não adianta tentar o próximo.
    if (response.status === 404) {
      sawNotFound = true;
      break;
    }

    // Servidor ocupado também não melhora com outro formato — e insistir é
    // exatamente o que faz um serviço público bloquear quem consulta.
    if (response.status >= 500 || response.status === 429) break;

    // Só vale tentar o próximo conjunto quando a resposta veio boa e o formato
    // é que não serviu: aí sim pode ser nome de propriedade de outra versão.
    if (!response.ok) continue;

    const body = (await response.json().catch(() => null)) as PropertyResponse | null;
    const row = body?.PropertyTable?.Properties?.[0];
    if (!row) continue;

    const smiles = readSmiles(row);
    if (smiles === null || row.CID === undefined) continue;

    return {
      status: 'ok',
      value: {
        cid: row.CID,
        smiles,
        formula: row.MolecularFormula ?? null,
        title: row.Title ?? null,
      },
    };
  }

  return sawNotFound ? { status: 'nao-encontrado' } : { status: 'indisponivel' };
}

export interface KnownCompound {
  readonly cid: number;
  readonly title: string | null;
}

/** A estrutura já existe lá fora? Responde pela InChIKey. */
export async function findCompoundByInchiKey(inchiKey: string): Promise<Lookup<KnownCompound>> {
  const response = await ask(`/compound/inchikey/${encodeURIComponent(inchiKey)}/cids/JSON`);
  if (response === null) return { status: 'indisponivel' };
  if (response.status === 404) return { status: 'nao-encontrado' };
  if (!response.ok) return { status: 'indisponivel' };

  const body = (await response.json().catch(() => null)) as CidResponse | null;
  const cid = body?.IdentifierList?.CID?.[0];
  if (cid === undefined) return { status: 'nao-encontrado' };

  return { status: 'ok', value: { cid, title: await titleOf(cid) } };
}

/** O nome que o PubChem dá ao composto. Falhou, segue sem nome. */
async function titleOf(cid: number): Promise<string | null> {
  const response = await ask(`/compound/cid/${String(cid)}/property/Title/JSON`);
  if (response === null || !response.ok) return null;

  const body = (await response.json().catch(() => null)) as PropertyResponse | null;
  return body?.PropertyTable?.Properties?.[0]?.Title ?? null;
}
