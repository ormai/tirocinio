import { requireAdmin } from '$lib/server/api-security';
import { type Assignment, getDurationInMonths } from '$lib/server/assignment.server';
import { db } from '$lib/server/db';
import { assignments, preferenceCollectionIntervals, structures, users } from '$lib/server/db/schema';
import { getDurationFirstYear, getDurationSecondYear, getDurationThirdYear } from '$lib/server/settings';
import { fail } from '@sveltejs/kit';
import { eq, inArray, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  requireAdmin(locals);

  const assignmentRows = await db.select({
    studentId: assignments.studentId,
    structureId: assignments.structureId,
    month: assignments.month,
  })
    .from(assignments)
    .where(eq(assignments.collectionId, Number(params.id)));

  const studentsArr = await db.select({
    id: users.id,
    name: users.name,
    surname: users.surname,
    number: users.number,
    email: users.email,
    year: users.enrollmentYear,
    yearOfCourse:
      sql`EXTRACT(YEAR FROM CURRENT_DATE) - COALESCE(${users.enrollmentYear}, EXTRACT(YEAR FROM CURRENT_DATE))`
        .mapWith((v) => Math.min(Number(v), 3)),
  })
    .from(users)
    .where(
      inArray(users.id, [
        ...new Set(
          assignmentRows.filter((a) => a.studentId != null).map((a) => a.studentId),
        ),
      ] as number[]),
    );

  const durationMonths = [await getDurationFirstYear(), await getDurationSecondYear(), await getDurationThirdYear()];

  const students = new Map(
    studentsArr.map((
      { id, number, name, surname, email, year, yearOfCourse },
    ) => {
      const months = getDurationInMonths(yearOfCourse, durationMonths);
      return [id, {
        number,
        name,
        surname,
        email,
        year,
        months,
        structureIds: Array(months).fill(null) as (number | null)[],
      }];
    }),
  );

  for (const assignment of assignmentRows) {
    if (assignment.studentId != null && assignment.structureId != null) {
      const student = students.get(assignment.studentId);
      if (student) {
        student.structureIds[assignment.month] = assignment.structureId;
      }
    }
  }

  const structs = await db.select({ id: structures.id, name: structures.name })
    .from(structures)
    .where(
      inArray(structures.id, [...new Set(students.values().flatMap((s) => s.structureIds))].filter((id) => id != null)),
    );

  return {
    assignments: [...students.entries()].map(([id, value]) => ({ id, ...value })),
    structures: structs,
  };
};

export const actions: Actions = {
  /** Editing a plan by changing the structures assigned to students. */
  edit: async ({ locals, request }) => {
    requireAdmin(locals);
    const data = await request.formData();
    const assignmentRows = JSON.parse(String(data.get('assignments') ?? '[]')) as Pick<
      Assignment,
      'id' | 'structureIds'
    >[];

    const collectionId = Number(data.get('collectionId'));
    if (!data.has('collectionId') || Number.isNaN(collectionId)) {
      return fail(400, 'collectionId must be a valid number');
    }

    const [collection] = await db.select({
      id: preferenceCollectionIntervals.id,
      year: preferenceCollectionIntervals.year,
    })
      .from(preferenceCollectionIntervals)
      .where(eq(preferenceCollectionIntervals.id, collectionId));
    if (!collection) return fail(404, 'Collection not found');

    const ids = assignmentRows.flatMap((a) => a.structureIds.filter((id) => id != null));
    const updated = assignmentRows.flatMap(({ id, structureIds }) =>
      structureIds.map((structures, month) => ({
        studentId: id,
        structureId: structures,
        month,
        collectionId: collection.id,
        year: collection.year,
      })).filter(({ structureId }) => structureId != null) // filter after map is important for `month`
    );

    await db.transaction(async (tx) => {
      await tx.delete(assignments).where(inArray(assignments.structureId, ids));
      await tx.insert(assignments).values(updated);
    });
    console.info('Delete and re-insert', ids.length, 'assignments');
    return true;
  },
};
