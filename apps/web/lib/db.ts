import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * O cliente do banco.
 *
 * Postgres local — o mesmo em desenvolvimento e no VPS, sem serviço gerenciado
 * no meio. Em desenvolvimento o Next recarrega o módulo a cada mudança, então o
 * cliente fica pendurado no escopo global: sem isso, cada salvamento abriria um
 * novo pool e o banco ficaria sem conexões.
 */
const connectionString = process.env['DATABASE_URL'] ?? '';

function create(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as { rotamerPrisma?: PrismaClient };

export const db: PrismaClient = globalForPrisma.rotamerPrisma ?? create();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.rotamerPrisma = db;
}

/** Sem banco configurado, as partes de conta simplesmente não aparecem. */
export function hasDatabase(): boolean {
  return connectionString !== '';
}
