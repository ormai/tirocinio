import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  return { user: locals.user, sidebarCollapsed: boolCookie(cookies.get('sidebar_collapsed')) };
};

function boolCookie(value?: string): boolean | null {
  if (value) return value === 'true';
  return null;
}
