import { requireAcceptedStudent, requireAuth } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { preferenceCollectionIntervals, preferences, sites } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { and, eq, gt, lt } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAuth(locals);

  if (locals.user.role === 'admin') {
    console.log('TODO: retrieve ADMIN home data');
  } else {
    const now = new Date();
    const [activeCollection] = await db.select()
      .from(preferenceCollectionIntervals)
      .where(
        and(
          lt(preferenceCollectionIntervals.startTime, now),
          gt(preferenceCollectionIntervals.endTime, now),
        ),
      );

    const prefs = activeCollection
      ? await db.select()
        .from(preferences)
        .where(and(eq(preferences.studentId, locals.user.id), eq(preferences.collectionId, activeCollection.id)))
      : [];
    const existingPrefs: number[][] = [];
    for (const pref of prefs) {
      if (pref.siteId) {
        if (!existingPrefs[pref.month]) {
          existingPrefs[pref.month] = [];
        }
        existingPrefs[pref.month][pref.weight] = pref.siteId;
      }
    }
    for (const month of existingPrefs) {
      month.reverse();
    }
    return { activeCollection, existingPrefs, sites: await db.select().from(sites).orderBy(sites.name) };
  }
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

    // Weights and months start from zero.
    const rows = prefs.flatMap((month, i) =>
      month.map((siteId, j) => {
        return {
          studentId: locals.user.id,
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
          .where(and(eq(preferences.studentId, locals.user.id), eq(preferences.collectionId, collectionId)));
      }
      await tx.insert(preferences).values(rows);
    });
    console.debug('Create preferences', rows);
    return true;
  },
};
