import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  const students = await db.select().from(users).where(eq(users.role, 'student'));
  return { students };
};
