import { yearFromString } from '$lib/form/academic-year';
import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { StudentView } from '$lib/server/user';
import { type ActionFailure, type Actions, fail, isActionFailure } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
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

function isValidationFailure(e: unknown): e is ActionFailure<string> {
  return isActionFailure(e);
}

async function validateStudent(
  data: FormData,
): Promise<Partial<StudentView> | ActionFailure<string>> {
  const idRaw = data.get('id')?.toString();
  const id = idRaw ? Number.parseInt(idRaw) : undefined;
  if (id && !Number.isFinite(id)) return fail(400, 'Student ID is not valid');

  const email = data.get('email')?.toString().trim().toLowerCase();
  if (!email) return fail(400, 'Student email is required');

  const name = data.get('name')?.toString();
  const surname = data.get('surname')?.toString();

  const year = yearFromString(data.get('enrollment-year')?.toString());
  if (year && (year < 0 || year > 32767)) {
    return fail(400, 'Enrollment year must be in range [0, 32767]');
  }

  const number = yearFromString(data.get('student-number')?.toString());
  if (number && (number < 0 || number > 2147483647)) {
    return fail(400, 'Number must be in range [0, 2147483647]');
  }
  return { id, number, name, surname, email, enrollmentYear: year };
}

export const actions: Actions = {
  add: async ({ locals, request }) => {
    requireAdmin(locals);

    const student = await validateStudent(await request.formData());
    if (isValidationFailure(student)) return student;
    if (student.number && await db.$count(users, eq(users.number, student.number)) > 0) {
      return fail(409, { numberTaken: true });
    }
    if (student.email && await db.$count(users, eq(users.email, student.email)) > 0) {
      return fail(409, { emailTaken: true });
    }

    await db.insert(users).values({
      number: student.number ?? null,
      name: student.name ?? null,
      surname: student.surname ?? null,
      email: student.email!,
      enrollmentYear: student.enrollmentYear ?? null,
    });

    return { added: true };
  },

  edit: async ({ locals, request }) => {
    requireAdmin(locals);

    const student = await validateStudent(await request.formData());
    if (isValidationFailure(student)) return student;
    if (!student.id) return fail(400, 'Student ID is required');
    if (student.number && await db.$count(users, and(eq(users.number, student.number), ne(users.id, student.id))) > 0) {
      console.debug(`Students with duplicate number during edit, id: ${student.id}, number: ${student.number}`);
      return fail(409, { numberTaken: true });
    }
    if (student.email && await db.$count(users, and(eq(users.email, student.email), ne(users.id, student.id))) > 0) {
      return fail(409, { emailTaken: true });
    }

    await db.update(users).set({
      number: student.number,
      name: student.name,
      surname: student.surname,
      email: student.email!,
      enrollmentYear: student.enrollmentYear,
    }).where(eq(users.id, student.id));

    return { edited: true };
  },
};
