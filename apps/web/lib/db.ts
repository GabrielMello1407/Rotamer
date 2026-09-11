import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * O cliente do banco.
 *
 * Postgres próprio — em desenvolvimento e na imagem Docker, sem serviço
 * gerenciado no meio. Em desenvolvimento o Next recarrega o módulo a cada mudança, então o
 * cliente fica pendurado no escopo global: sem isso, cada salvamento abriria um
 * novo pool e o banco ficaria sem conexões.
 *
 * O que **não** pode acontecer é a instância guardada sobreviver a uma migração.
 * Depois de `prisma generate`, a classe gerada é outro objeto; se o cliente
 * antigo continuasse pendurado, ele não teria as tabelas novas e o erro seria
 * um `undefined` obscuro na primeira consulta — "Cannot read properties of
 * undefined (reading 'findUnique')". Por isso guardamos a classe junto e
 * recriamos quando ela muda.
 */
const connectionString = process.env['DATABASE_URL'] ?? '';

function create(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

interface PrismaCache {
  client?: PrismaClient;
  /** A classe que gerou o cliente guardado. */
  generated?: unknown;
}

const globalForPrisma = globalThis as unknown as { rotamerPrisma?: PrismaCache };
const cache: PrismaCache = (globalForPrisma.rotamerPrisma ??= {});

if (cache.client === undefined || cache.generated !== PrismaClient) {
  cache.client = create();
  cache.generated = PrismaClient;
}

export const db: PrismaClient = cache.client;

/** Sem banco configurado, as partes de conta simplesmente não aparecem. */
export function hasDatabase(): boolean {
  return connectionString !== '';
}
