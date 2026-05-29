import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { preferenceCollectionIntervals } from '$lib/server/db/schema';
import type { Collection } from '$lib/server/preference';
import { type ActionFailure, fail, isActionFailure } from '@sveltejs/kit';
import { and, desc, eq, gt, lt, ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  const collections = await db.select()
    .from(preferenceCollectionIntervals)
    .orderBy(desc(preferenceCollectionIntervals.startTime));

  return { collections };
};

function isValidationFailure(e: unknown): e is ActionFailure<string> {
  return isActionFailure(e);
}

function getUtcDate(date: string, offset: number) {
  return new Date(new Date(date).getTime() + offset * 60_000);
}

function validateCollection(form: FormData): Partial<Collection> | ActionFailure<string> {
  const start = form.get('start-time');
  if (!start) return fail(400, '`start-time` is required');
  const end = form.get('end-time');
  if (!end) return fail(400, '`end-time` is required');

  const year = Number(form.get('year'));
  if (isNaN(year) || year < 0 || year > 32767) {
    return fail(400, '`year` is required, and must be a valid number in [0, 32767]');
  }
  const durationMonths = Number(form.get('months'));
  if (isNaN(durationMonths) || durationMonths < 0 || durationMonths > 32767) {
    return fail(400, '`months` is required, and must be a valid number in [0, 32767]');
  }
  const numberOfPreferences = Number(form.get('number-of-prefs'));
  if (isNaN(numberOfPreferences) || numberOfPreferences < 0 || numberOfPreferences > 32767) {
    return fail(400, '`number-of-prefs` is required, and must be a valid number in [0, 32767]');
  }
  const timezoneOffset = Number(form.get('timezone-offset'));
  if (isNaN(timezoneOffset)) return fail(400, '`timezone-offset` is required');
  return {
    id: Number(form.get('id')),
    year,
    durationMonths,
    numberOfPreferences,
    startTime: getUtcDate(String(start), timezoneOffset),
    endTime: getUtcDate(String(end), timezoneOffset),
  };
}

export const actions: Actions = {
  createCollection: async ({ locals, request }) => {
    requireAdmin(locals);

    const collection = validateCollection(await request.formData());
    if (isValidationFailure(collection)) return collection;

    // Overlapping intervals:
    //
    //       +--------------------+
    //       s                    e
    //  +--------+
    //  s'       e'
    //                         +---------+
    //                         s'     e'
    //             +------+
    //             s'     e'
    //
    // e' > s AND s' < e

    return await db.transaction(async (tx) => {
      const [exists] = await tx.select().from(preferenceCollectionIntervals).where(
        and(
          gt(preferenceCollectionIntervals.endTime, collection.startTime!),
          lt(preferenceCollectionIntervals.startTime, collection.endTime!),
        ),
      );
      if (exists) return fail(409, { intervalOverlap: true });
      await tx.insert(preferenceCollectionIntervals).values({
        startTime: collection.startTime!,
        endTime: collection.endTime!,
        year: collection.year!,
        durationMonths: collection.durationMonths!,
        numberOfPreferences: collection.numberOfPreferences!,
      });
      return true;
    });
  },

  deleteCollection: async ({ locals, request }) => {
    requireAdmin(locals);
    const id = Number((await request.formData()).get('id'));
    if (isNaN(id)) return fail(400, '`id` is required, and must be a valid number');
    await db.delete(preferenceCollectionIntervals).where(eq(preferenceCollectionIntervals.id, id));
    return true;
  },

  editCollection: async ({ locals, request }) => {
    requireAdmin(locals);

    const collection = validateCollection(await request.formData());
    if (isValidationFailure(collection)) return collection;
    if (collection.id == null || isNaN(collection.id)) return fail(400, 'ID of the collection is required');
    const coll = collection as Collection;

    return await db.transaction(async (tx) => {
      const [exists] = await tx.select().from(preferenceCollectionIntervals).where(
        and(
          ne(preferenceCollectionIntervals.id, coll.id),
          gt(preferenceCollectionIntervals.endTime, coll.startTime),
          lt(preferenceCollectionIntervals.startTime, coll.endTime),
        ),
      );
      if (exists) return fail(409, { intervalOverlap: true });
      await tx.update(preferenceCollectionIntervals).set(coll).where(eq(preferenceCollectionIntervals.id, coll.id));
      return true;
    });
  },
};
