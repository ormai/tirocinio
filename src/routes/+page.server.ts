import { requireAcceptedStudent, requireAdmin, requireAuth } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import {
  capacities,
  preferenceCollectionIntervals,
  preferences,
  sites,
  structures,
  users,
} from '$lib/server/db/schema';
import { rearrange } from '$lib/server/preference';
import { getYear } from '$lib/server/structure';
import { error, fail } from '@sveltejs/kit';
import { and, count, desc, eq, gt, lt, sum } from 'drizzle-orm';
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
    const [notAccepted, accepted] = await db.select({ count: count() })
      .from(users)
      .where(eq(users.role, 'student'))
      .groupBy(users.accepted)
      .orderBy(users.accepted); // false -> 0 first, true -> 1 last

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
    return {
      activeCollection,
      existingPrefs: rearrange(prefs),
      sites: await db.select().from(sites).orderBy(sites.name),
    };
  }

  error(403);
};

export const actions: Actions = {
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
    const collectionId = Number(form.get('collectionId'));
    if (isNaN(collectionId)) return fail(400, '`collectionId` is required and must be a valid number');

    const studentId = Number(form.get('studentId'));
    if (isNaN(studentId)) return fail(400, '`studentId` is required and must be a valid number');

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

    const editing = String(form.get('editing')) === 'true';

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
