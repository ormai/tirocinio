import { requireAuth } from '$lib/server/api-security';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  requireAuth(locals);
};
