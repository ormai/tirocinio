import { requireAdmin } from '$lib/server/api-security';
import { getDurationInMonths } from '$lib/server/assignment.server';
import { db } from '$lib/server/db';
import { assignments, structures, users } from '$lib/server/db/schema';
import { getDurationFirstYear, getDurationSecondYear, getDurationThirdYear } from '$lib/server/settings';
import { eq, inArray, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

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
