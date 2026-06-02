import { eq } from 'drizzle-orm';
import { db, type TransactionOrDatabase } from './db';
import { settings } from './db/schema';

export async function getSetting(key: string, tx: TransactionOrDatabase = db): Promise<string | null> {
  const row = await tx.select().from(settings).where(eq(settings.key, key)).limit(1);
  return row[0]?.value ?? null;
}

export async function setSetting(key: string, value: string | null, tx: TransactionOrDatabase = db) {
  await tx.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export async function getAppName(): Promise<string> {
  return await getSetting('appName') ?? 'Tirocinio';
}
