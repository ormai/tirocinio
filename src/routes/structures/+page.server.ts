import type { structures } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import type { InferSelectModel } from 'drizzle-orm';
import type { PageServerLoad } from '../sign-in/$types';

type Structure = InferSelectModel<typeof structures>;

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/sign-in');
  }
  if (locals.user.role !== 'admin') {
    error(403, 'Sorry, admins only');
  }

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
