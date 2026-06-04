import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import { eq, type InferSelectModel } from 'drizzle-orm';
import { getSetting, setSetting } from './settings';

export type User = InferSelectModel<typeof users>;

/** The currently authenticated user. A view without some server-specific fields. */
export type AuthUser = Pick<
  User,
  'id' | 'number' | 'email' | 'name' | 'surname' | 'enrollmentYear' | 'role' | 'encodedPassword' | 'accepted'
>;

export type StudentView = Pick<User, 'id' | 'number' | 'name' | 'surname' | 'email' | 'enrollmentYear' | 'accepted'>;

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
  } else {
    console.debug('Default admin user exists. Nothing to do.');
  }
}

export async function getAutoAcceptEmailSuffix(): Promise<string> {
  return await getSetting('autoAcceptEmailSuffix') ?? '@example.com';
}

export async function setAutoAcceptEmailSuffix(value: string) {
  await setSetting('autoAcceptEmailSuffix', value);
}

export async function getAutoAcceptAllStudents(): Promise<boolean> {
  return await getSetting('autoAcceptAllStudents') === 'true';
}

export async function setAutoAcceptAllStudents(value: boolean) {
  await setSetting('autoAcceptAllStudents', String(value));
}

export async function shouldBeAccepted(email: string): Promise<boolean> {
  if (await getAutoAcceptAllStudents()) {
    return true;
  }
  const suffix = await getAutoAcceptEmailSuffix();
  if (suffix === '') {
    return false;
  }
  return email.endsWith(suffix);
}
