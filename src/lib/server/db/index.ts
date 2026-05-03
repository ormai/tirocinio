import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { ensureDefaultAdminExists } from '$lib/server/user';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!building && !env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const db = drizzle(postgres(env.DATABASE_URL), { schema });

if (!building) {
  await ensureDefaultAdminExists();
}
