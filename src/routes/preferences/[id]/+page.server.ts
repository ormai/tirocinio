import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { preferenceCollectionIntervals, preferences, sites, users } from '$lib/server/db/schema';
import { rearrange } from '$lib/server/preference';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  requireAdmin(locals);

  const [collection] = await db.select()
    .from(preferenceCollectionIntervals)
    .where(eq(preferenceCollectionIntervals.id, Number(params.id)));

  const students = await db.query.users.findMany({
    // https://orm.drizzle.team/docs/rqb#partial-fields-select
    columns: {
      id: true,
      number: true,
      name: true,
      surname: true,
      email: true,
    },
    // https://orm.drizzle.team/docs/rqb#relations-filters
    where: (users, { exists, eq, and }) =>
      exists(
        db.select()
          .from(preferences)
          .where(and(eq(preferences.studentId, users.id), eq(preferences.collectionId, collection.id))),
      ),
    with: {
      preferences: {
        // https://orm.drizzle.team/docs/rqb#nested-partial-fields-select
        columns: {
          month: true,
          weight: true,
          siteId: true,
        },
      },
    },
    orderBy: [desc(users.id)],
  });

  return {
    id: params.id,
    collection,
    students: students.map((student) => {
      return { ...student, preferences: rearrange(student.preferences) };
    }),
    sites: students.length > 0 ? await db.select().from(sites) : [],
  };
};
