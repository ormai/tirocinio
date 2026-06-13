import { requireAdmin } from '$lib/server/api-security';
import { generateAssignment } from '$lib/server/assignment.server';
import { db } from '$lib/server/db';
import {
  assignments,
  capacities,
  preferenceCollectionIntervals,
  preferences,
  structures,
  users,
} from '$lib/server/db/schema';
import { getDurationFirstYear, getDurationSecondYear, getDurationThirdYear } from '$lib/server/settings';
import { getYear } from '$lib/server/structure';
import { fail } from '@sveltejs/kit';
import { and, countDistinct, desc, eq, inArray, sql } from 'drizzle-orm';
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

  return { collections };
};

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

    const studentsInfo = await Promise.all([...new Set(prefs.filter((pref) => pref.studentId != null))].map(async (
      { studentId, yearOfCourse },
    ) => ({
      id: studentId!,
      yearOfCourse,
      months: await (yearOfCourse === 1
        ? getDurationFirstYear()
        : yearOfCourse === 2
        ? getDurationSecondYear()
        : getDurationThirdYear()),
    })));

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

    // TODO: handle timeout separately in the UI
    const generated = await generateAssignment(studentsInfo, prefs, structs, pastAssignments, timeout);
    if (generated == null) {
      return fail(404, { modelNotFound: true });
    }
    if (generated === 'timeout') {
      return fail(408, { timeout: true });
    }
    console.log(generated);
    // TODO: return dummy empty assignment when failure to generate

    const studentsArr = await db.select({
      id: users.id,
      number: users.number,
      name: users.name,
      surname: users.surname,
      email: users.email,
      year: users.enrollmentYear,
    }).from(users).where(inArray(users.id, studentsInfo.map((student) => student.id)));

    const students = new Map(
      studentsArr.map((
        { id, number, name, surname, email, year },
      ) => [id, { number, name, surname, email, year, structureIds: [] as number[] }]),
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

    const students = JSON.parse(String(form.get('students'))) as { id: number; structureIds: number[] }[];
    console.log(students);

    const assignmentRows = students.flatMap(({ id: studentId, structureIds }) =>
      structureIds.map((structureId, month) => ({
        studentId,
        structureId,
        collectionId,
        month,
        year: collection.year,
      }))
    );
    console.log(assignmentRows);

    const sendEmails = String(form.get('sendEmails')) === 'true';
    console.log('send emails', sendEmails);

    // await db.insert(assignments).values(assignmentRows)

    return true;
  },
};
