import { m } from '$lib/paraglide/messages';
import { requireAdmin } from '$lib/server/api-security';
import { generateAssignment } from '$lib/server/assignment.server';
import { db } from '$lib/server/db';
import {
  assignments,
  capacities,
  preferenceCollectionIntervals,
  preferences,
  sites,
  structures,
  users,
} from '$lib/server/db/schema';
import { sendAssignmentReceipt } from '$lib/server/email';
import { getDurationFirstYear, getDurationSecondYear, getDurationThirdYear } from '$lib/server/settings';
import { getYear } from '$lib/server/structure';
import { fail } from '@sveltejs/kit';
import { and, count, countDistinct, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  const collections = await db.select({
    id: preferenceCollectionIntervals.id,
    startTime: preferenceCollectionIntervals.startTime,
    endTime: preferenceCollectionIntervals.endTime,
    year: preferenceCollectionIntervals.year,
    numberOfPreferences: preferenceCollectionIntervals.numberOfPreferences,
    studentCount: countDistinct(preferences.studentId),
  })
    .from(preferenceCollectionIntervals)
    .leftJoin(preferences, eq(preferenceCollectionIntervals.id, preferences.collectionId))
    .groupBy(preferenceCollectionIntervals.id)
    .orderBy(desc(preferenceCollectionIntervals.endTime))
    .limit(100);

  const previousAssignments = await db.select({
    id: preferenceCollectionIntervals.id,
    year: preferenceCollectionIntervals.year,
    startTime: preferenceCollectionIntervals.startTime,
    endTime: preferenceCollectionIntervals.endTime,
    assignmentCount: count(assignments.collectionId),
  })
    .from(preferenceCollectionIntervals)
    .leftJoin(assignments, eq(preferenceCollectionIntervals.id, assignments.collectionId))
    .groupBy(preferenceCollectionIntervals.id)
    .having(gt(count(assignments.collectionId), 0));

  return { collections, previousAssignments };
};

function getDurationInMonths(yearOfCourse: number, durationMonths: number[]): number {
  if (yearOfCourse >= 0 && yearOfCourse <= 3) return durationMonths[yearOfCourse - 1];
  return durationMonths[2];
}

export const actions: Actions = {
  generateAssignments: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();
    const collectionId = Number(form.get('collectionId'));
    if (isNaN(collectionId)) return fail(400, '`collectionId` is required and must be a valid number');

    const timeout = form.has('timeout') ? Number(form.get('timeout')) : null;

    const prefs = await db.select({
      studentId: preferences.studentId,
      siteId: preferences.siteId,
      month: preferences.month,
      weight: preferences.weight,
      createdAt: preferences.createdAt,
      yearOfCourse:
        sql`EXTRACT(YEAR FROM CURRENT_DATE) - COALESCE(${users.enrollmentYear}, EXTRACT(YEAR FROM CURRENT_DATE))`
          .mapWith((v) => Math.min(Number(v), 3)),
    })
      .from(preferences)
      .leftJoin(users, eq(users.id, preferences.studentId))
      .where(eq(preferences.collectionId, collectionId));

    const durationMonths = [await getDurationFirstYear(), await getDurationSecondYear(), await getDurationThirdYear()];

    const studentsInfo = [...new Set(prefs.filter((pref) => pref.studentId != null))].map((
      { studentId, yearOfCourse },
    ) => ({
      id: studentId!,
      yearOfCourse,
      months: getDurationInMonths(yearOfCourse, durationMonths),
    }));

    const year = await getYear();
    const structs = await db.select({
      id: structures.id,
      name: structures.name,
      area: structures.area,
      siteId: structures.siteId,
      capacity: capacities.capacity,
      yearOfCourse: structures.yearOfCourse,
    })
      .from(structures)
      .leftJoin(capacities, and(eq(structures.id, capacities.structureId), eq(capacities.year, year)))
      .orderBy(structures.name);

    const pastAssignments = await db.select({ studentId: assignments.studentId, area: structures.area })
      .from(assignments)
      .leftJoin(structures, eq(assignments.structureId, structures.id))
      .where(inArray(assignments.studentId, studentsInfo.map((student) => student.id)));

    const generated = await generateAssignment(studentsInfo, prefs, structs, pastAssignments, timeout);
    if (generated == null) {
      return fail(404, { modelNotFound: true });
    }
    if (generated === 'timeout') {
      return fail(408, { timeout: true, seconds: timeout });
    }

    // FIXME: calculating the "year of course" by subtracting the enrollment year from the current one assumes that the academic year starts in January and ends in December, which is incorrect.
    const studentsArr = await db.select({
      id: users.id,
      number: users.number,
      name: users.name,
      surname: users.surname,
      email: users.email,
      year: users.enrollmentYear,
      yearOfCourse:
        sql`EXTRACT(YEAR FROM CURRENT_DATE) - COALESCE(${users.enrollmentYear}, EXTRACT(YEAR FROM CURRENT_DATE))`
          .mapWith((v) => Math.min(Number(v), 3)),
    })
      .from(users)
      .where(inArray(users.id, studentsInfo.map((student) => student.id)));

    const students = new Map(
      studentsArr.map((
        { id, number, name, surname, email, year, yearOfCourse },
      ) => [id, {
        number,
        name,
        surname,
        email,
        year,
        months: getDurationInMonths(yearOfCourse, durationMonths),
        structureIds: [] as number[],
      }]),
    );

    for (const assignment of generated) {
      const student = students.get(assignment.studentId);
      if (student) {
        student.structureIds[assignment.month - 1] = assignment.structureId;
      }
    }

    return {
      assignments: [...students.entries()].map(([id, value]) => ({ id, ...value })),
      structures: structs.map(({ id, name }) => ({ id, name })),
    };
  },

  confirmAssignments: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();

    const year = Number(form.get('year'));
    if (isNaN(year)) return fail(400, '`year` must be a valid number');

    const collectionId = Number(form.get('collectionId'));
    if (isNaN(collectionId)) return fail(400, '`collectionId` must be a valid number');
    const [collection] = await db.select()
      .from(preferenceCollectionIntervals)
      .where(eq(preferenceCollectionIntervals.id, collectionId));
    if (!collection) return fail(404, 'There exists no collection with the provided `collectionId`');

    const students = JSON.parse(String(form.get('students'))) as {
      id: number;
      structureIds: number[];
      email?: string;
    }[];

    if (
      await db.$count(
        assignments,
        and(eq(assignments.collectionId, collectionId), inArray(assignments.studentId, students.map((s) => s.id))),
      ) > 0
    ) return fail(409, { assignmentsExists: true });

    const assignmentRows = students.flatMap(({ id: studentId, structureIds }) =>
      structureIds.filter((id) => id != null).map((structureId, month) => ({
        studentId,
        structureId,
        collectionId,
        month,
        year: collection.year,
      }))
    );

    await db.insert(assignments).values(assignmentRows);
    console.debug('Insert', assignmentRows.length, 'new assignments');

    // This might cause the sender to be blacklisted by providers like Gmail, resulting in the emails ending up in spam.
    if (false && String(form.get('sendEmails')) === 'true') {
      const structs = [...new Set(students.flatMap(({ structureIds }) => structureIds))].filter((s) => s != null);
      const assignedStructs = new Map(
        (await db.select({ id: structures.id, name: structures.name, area: structures.area, site: sites.name })
          .from(structures)
          .where(inArray(structures.id, structs))
          .leftJoin(sites, eq(structures.siteId, sites.id)))
          .map(({ id, name, area, site }) => [id, { name, area, site }]),
      );

      for (const { email, structureIds } of students) {
        if (email) {
          await sendAssignmentReceipt(
            email!,
            structureIds.filter((id) => id != null).map((id, i) => {
              const struct = assignedStructs.get(id)!;
              return `${m.preferences_month_head({ n: i + 1 })}: ${struct.name}, ${struct.area}, ${struct.site}`;
            }).join('\n'),
          );
        }
      }
    }

    return true;
  },

  deleteByCollection: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const idRaw = form.get('id');
    const id = Number(idRaw);
    if (!idRaw || isNaN(id)) return fail(400, '`id` must is required and must be a valid number');

    const deleted = await db.delete(assignments)
      .where(eq(assignments.collectionId, id))
      .returning({ id: assignments.collectionId });
    console.debug('Delete', deleted.length, 'assignments in collection', id);
    return { deleted: deleted.length };
  },
};
