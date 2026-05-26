import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { ensureDefaultAdminExists } from '$lib/server/user';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { drizzle, type PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type TransactionOrDatabase =
  | PgTransaction<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>
  | typeof db;

if (!building && !env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const db = drizzle(postgres(env.DATABASE_URL), { schema });

if (!building) {
  await migrate(db, { migrationsFolder: './drizzle' });
  await ensureDefaultAdminExists();
}
