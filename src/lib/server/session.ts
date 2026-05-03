import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { eq, type InferSelectModel } from 'drizzle-orm';

type Session = InferSelectModel<typeof sessions>;

export const SESSION_COOKIE = 'session_id';
const DURATIONS = {
  'admin': 1000 * 60 * 60 * 24 * 30, // 30 days
  'student': 1000 * 60 * 60 * 2, // 2 hours
};

export async function createSession(
  userId: number,
  role: 'admin' | 'student',
): Promise<Pick<Session, 'id' | 'expiresAt'>> {
  const expiresAt = new Date(Date.now() + DURATIONS[role]);
  const [session] = await db.insert(sessions).values({ userId, expiresAt }).returning({
    id: sessions.id,
    expiresAt: sessions.expiresAt,
  });
  return session;
}

export async function getSession(token: string): Promise<Session | null> {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, token)).limit(1);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await deleteSession(token);
    return null;
  }
  return session;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.id, token));
}
