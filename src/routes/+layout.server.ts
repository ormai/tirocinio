import { boolFromCookie, COLOR_SCHEME, SIDEBAR_COLLAPSED } from '$lib/cookies';
import { getAppName } from '$lib/server/settings';
import type { AuthUser } from '$lib/server/user';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  // This data is available to all sibling and children routes of this layout
  const cleanedUser = { ...locals.user };
  delete cleanedUser.encodedPassword;
  return {
    user: cleanedUser as AuthUser,
    sidebarCollapsed: boolFromCookie(cookies.get(SIDEBAR_COLLAPSED)),
    colorScheme: cookies.get(COLOR_SCHEME),
    appName: await getAppName(),
  };
};
