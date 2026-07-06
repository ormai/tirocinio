import { requireAcceptedStudent, requireAdmin, requireAuth } from '$lib/server/api-security';
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
import { getMonths, rearrange } from '$lib/server/preference';
import { getYear } from '$lib/server/structure';
import { error, fail } from '@sveltejs/kit';
import { and, count, desc, eq, exists, gt, inArray, lt, sum } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAuth(locals);

  const now = new Date();
  const [activeCollection] = await db.select()
    .from(preferenceCollectionIntervals)
    .where(
      and(
        lt(preferenceCollectionIntervals.startTime, now),
        gt(preferenceCollectionIntervals.endTime, now),
      ),
    );

  if (locals.user.role === 'admin') {
    const year = await getYear();
    const [structs] = await db.select({ count: count(), totalCapacity: sum(capacities.capacity) })
      .from(structures)
      .leftJoin(capacities, and(eq(structures.id, capacities.structureId), eq(capacities.year, year)));

    const [latestStudent] = await db.select({ registeredAt: users.registeredAt })
      .from(users)
      .where(eq(users.role, 'student'))
      .orderBy(desc(users.registeredAt))
      .limit(1);

    const [totalPreferences] = activeCollection
      ? await db.select({ count: count() })
        .from(preferences)
        .where(eq(preferences.collectionId, activeCollection.id))
      : [{ count: 0 }];

    const [notAccepted] = await db.select({ count: count() }).from(users).where(
      and(eq(users.role, 'student'), eq(users.accepted, false)),
    );
    const [accepted] = await db.select({ count: count() }).from(users).where(
      and(eq(users.role, 'student'), eq(users.accepted, true)),
    );

    const popularSites = activeCollection
      ? await db.select({ name: sites.name })
        .from(preferences)
        .leftJoin(sites, and(eq(preferences.siteId, sites.id), eq(preferences.collectionId, activeCollection.id)))
        .groupBy(sites.id)
        .orderBy(desc(count(sites.id)))
        .limit(6)
      : [];

    return {
      yearCapacities: year,
      structsCount: structs.count,
      totalCapacity: structs.totalCapacity ?? 0,
      latestStudentRegistration: latestStudent?.registeredAt,
      totalStudents: (accepted?.count ?? 0) + (notAccepted?.count ?? 0),
      notAcceptedStudents: notAccepted?.count ?? 0,
      activeCollection,
      popularSites: popularSites.map((site) => site.name),
      totalPreferences: totalPreferences.count,
    };
  } else if (locals.user.role === 'student') {
    const prefs = activeCollection
      ? await db.select()
        .from(preferences)
        .where(and(eq(preferences.studentId, locals.user.id), eq(preferences.collectionId, activeCollection.id)))
      : [];

    const collections = await db.select({
      id: preferenceCollectionIntervals.id,
      year: preferenceCollectionIntervals.year,
    })
      .from(preferenceCollectionIntervals)
      .where(
        and(
          lt(preferenceCollectionIntervals.endTime, now),
          exists(
            db.select().from(preferences).where(
              and(
                eq(preferences.collectionId, preferenceCollectionIntervals.id),
                eq(preferences.studentId, locals.user.id),
              ),
            ),
          ),
        ),
      );

    const pastAssignments = new Map(collections.map(({ id, year }) => [id, { year, structures: [] as string[] }]));
    const assignmentsRow = await db.select({
      collectionId: assignments.collectionId,
      structure: structures.name,
      month: assignments.month,
    })
      .from(assignments)
      .leftJoin(structures, eq(assignments.structureId, structures.id))
      .where(
        and(
          eq(assignments.studentId, locals.user.id),
          inArray(assignments.collectionId, [...new Set(collections.map((c) => c.id))]),
        ),
      );

    for (const { collectionId, structure, month } of assignmentsRow) {
      if (collectionId) {
        const collection = pastAssignments.get(collectionId);
        if (collection != null && month != null && structure != null) {
          collection.structures[month] = structure;
        }
      }
    }

    return {
      activeCollection,
      existingPrefs: rearrange(prefs),
      sites: await db.select().from(sites).orderBy(sites.name),
      durationMonths: await getMonths(locals.user.enrollmentYear),
      pastAssignments: [...pastAssignments.entries().map(([id, rest]) => ({ id, ...rest }))],
    };
  }

  error(403);
};

export const actions: Actions = {
  /**
   * Saves or updates the preferences of a student, and allows the administrator to edit them.
   */
  savePreferences: async ({ locals, request }) => {
    requireAcceptedStudent(locals);

    const form = await request.formData();
    const prefs: (number | null)[][] | null = JSON.parse(String(form.get('preferences')));
    if (
      !Array.isArray(prefs) || prefs.length === 0
      || !prefs.every((month) => Array.isArray(month) && month.length > 0 && month.every(Number.isFinite))
    ) {
      return fail(
        400,
        'An array of months each containing an array of siteIds is required. At least one siteId per month must be provided.',
      );
    }

    const studentId = Number(form.get('studentId'));
    if (isNaN(studentId)) return fail(400, '`studentId` is required and must be a valid number');

    if (studentId !== locals.user.id && locals.user.role !== 'admin') {
      error(403, 'Students can only save preferences for themselves');
    }

    const [student] = await db.select({ year: users.enrollmentYear })
      .from(users)
      .where(eq(users.id, studentId));
    if (!student) return fail(404, 'Student not found');

    const months = await getMonths(student.year);
    if (prefs.length > months) {
      return fail(400, `Number of months cant exceed ${months}, but it was ${prefs.length}`);
    }

    const editing = String(form.get('editing')) === 'true';

    const collectionId = Number(form.get('collectionId'));
    if (isNaN(collectionId)) return fail(400, '`collectionId` is required and must be a valid number');

    const [collection] = await db.select({
      startTime: preferenceCollectionIntervals.startTime,
      endTime: preferenceCollectionIntervals.endTime,
    })
      .from(preferenceCollectionIntervals)
      .where(eq(preferenceCollectionIntervals.id, collectionId));
    if (!collection) return fail(404, 'Collection not found');

    if (locals.user.role !== 'admin') { // only for students saving their preferences
      const now = new Date();
      if (now < collection.startTime || collection.endTime < now) {
        return fail(403, { collectionNotActive: true });
      }
    }

    // Weights and months start from zero.
    const rows = prefs.flatMap((month, i) =>
      month.map((siteId, j) => {
        return {
          studentId: studentId,
          collectionId,
          siteId,
          month: i,
          weight: month.length - j - 1,
        };
      })
    );

    await db.transaction(async (tx) => {
      if (editing) {
        await tx.delete(preferences)
          .where(and(eq(preferences.studentId, studentId), eq(preferences.collectionId, collectionId)));
      }
      await tx.insert(preferences).values(rows);
    });
    console.debug('Create preferences', rows);
    return true;
  },

  /** Deletes all preferences for a certain student in a certain collection */
  deletePreferences: async ({ locals, request }) => {
    requireAdmin(locals);

    const form = await request.formData();
    const collectionId = Number(form.get('collectionId'));
    if (isNaN(collectionId)) return fail(400, '`collectionId` is required and must be a valid number');

    const studentId = Number(form.get('studentId'));
    if (isNaN(studentId)) return fail(400, '`studentId` is required and must be a valid number');

    await db.delete(preferences)
      .where(and(eq(preferences.collectionId, collectionId), eq(preferences.studentId, studentId)));

    return true;
  },
};
