import { yearFromString } from '$lib/form/academic-year';
import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { StudentView } from '$lib/server/user';
import { type ActionFailure, type Actions, fail, isActionFailure } from '@sveltejs/kit';
import { and, eq, inArray, ne } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }): Promise<{ students: ReadonlyArray<StudentView> }> => {
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
      email: student.email!,
      ...student,
    }).where(eq(users.id, student.id));

    console.debug(`Edit student: ${student.id}`);
    return { edited: true };
  },

  delete: async ({ locals, request }) => {
    requireAdmin(locals);

    const data = await request.formData();
    const ids = data.getAll('id').map(Number);
    await db.delete(users).where(inArray(users.id, ids));
    console.debug(`Delete students: ${ids}`);
    return { count: ids.length };
  },

  studentsExist: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();
    const studentsField = form.get('students');
    if (!studentsField) return fail(400, 'Array of students to check is required');
    const data = JSON.parse(studentsField as string) as Pick<StudentView, 'email' | 'number'>[];

    const existsByEmail: Record<string, boolean> = {};
    const existsByNumber: Record<number, boolean> = {};

    for (const { email, number } of data) {
      if (number == null || isNaN(number) || number < 0 || number > 2147483647) {
        return fail(400, '`number` must be a valid number in range [0, 2147483647]');
      }
      if (!email) return fail(400, 'Student `email` is required');

      const [byNumber] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.number, number));
      existsByNumber[number] = byNumber != null;

      const [byEmail] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.email, email));
      existsByEmail[email] = byEmail != null;
    }

    return { existsByEmail, existsByNumber };
  },

  import: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();
    const rows = form.get('rows');
    if (!rows) return fail(400, 'An array of structures to import is required');
    const data = JSON.parse(rows as string) as StudentView[];

    await db.insert(users).values(data.map((student) => {
      return { role: 'student' as const, ...student };
    }));

    console.debug(`Import ${data.length} students`);
    return { inserted: data.length };
  },
};
