import { requireAdmin } from '$lib/server/api-security';
import type { structures } from '$lib/server/db/schema';
import type { InferSelectModel } from 'drizzle-orm';
import type { PageServerLoad } from '../sign-in/$types';

type Structure = InferSelectModel<typeof structures>;

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  return {
    structures: [{
      id: 42,
      name: 'Hello world',
      ward: 'Something',
      area: 'Some area',
      kind: 'ASP',
      siteId: 19,
    }, {
      id: 43,
      name: 'Bla bla',
      ward: 'Something',
      area: 'Some area',
      kind: 'ASP',
      siteId: 19,
    }] satisfies Array<Structure>,
  };
};
