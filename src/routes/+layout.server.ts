import { boolFromCookie, COLOR_SCHEME, SIDEBAR_COLLAPSED } from '$lib/cookies';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  return {
    user: locals.user, // available to all sibling and children routes of this layout
    sidebarCollapsed: boolFromCookie(cookies.get(SIDEBAR_COLLAPSED)),
    colorScheme: cookies.get(COLOR_SCHEME),
  };
};
