import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { StudentView } from '$lib/server/user';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }): Promise<{ students: Array<StudentView> }> => {
  requireAdmin(locals);
  return {
    students: await db.select({
      id: users.id,
      number: users.number,
      name: users.name,
      surname: users.surname,
      email: users.email,
      enrollmentYear: users.enrollmentYear,
    }).from(users).where(eq(users.role, 'student')),
  };
};
