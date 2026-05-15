import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import bcrypt from 'bcrypt';
import { eq, type InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type StudentView = Pick<User, 'id' | 'number' | 'name' | 'surname' | 'email' | 'enrollmentYear'>;

export const BCRYPT_ROUNDS = 12;

export async function ensureDefaultAdminExists() {
  if (!env.ADMIN_EMAIL) throw new Error('ADMIN_EMAIL is not set');
  if (!env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is not set');
  const [admin] = await db.select().from(users).where(eq(users.email, env.ADMIN_EMAIL));
  if (!admin) {
    await db.insert(users).values({
      email: env.ADMIN_EMAIL,
      encodedPassword: await bcrypt.hash(env.ADMIN_PASSWORD, BCRYPT_ROUNDS),
      role: 'admin',
    });
    console.info('Default admin user not found, so it was created.');
  }
}
