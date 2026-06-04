import { error, redirect } from '@sveltejs/kit';
import type { User } from './user';

/**
 * Asserts that the user making the request is **authenticated**, i.e. there exists a valid session
 * that references the user.
 *
 * @throws {import('@sveltejs/kit').Redirect} If proper **authentication** is not present, redirects to sign-in route.
 */
export function requireAuth(locals: App.Locals): asserts locals is App.Locals & { user: User } {
  if (!locals.user) {
    redirect(303, '/sign-in');
  }
}

/**
 * Asserts that the currently authenticated user is an administrator. Implies {@link requireAuth}.
 *
 * @throws {import('@sveltejs/kit').HttpError} with status code 403 if the user doesn't have proper **authorization**.
 * @throws {import('@sveltejs/kit').Redirect} If the user is not authenticated.
 */
export function requireAdmin(locals: App.Locals): asserts locals is App.Locals & { user: User & { role: 'admin' } } {
  requireAuth(locals);
  if (locals.user?.role !== 'admin') {
    error(403, 'Only administrators can access this resource');
  }
}

/**
 * Asserts that the currently authenticated user is a student whose account has been accepted by an administrator. Implies {@link requireAuth}.
 *
 * @throws {import('@sveltejs/kit').HttpError} with status code 403 if the user doesn't have proper **authorization**.
 * @throws {import('@sveltejs/kit').Redirect} If the user is not authenticated.
 */
export function requireAcceptedStudent(
  locals: App.Locals,
): asserts locals is App.Locals & { user: User & { accepted: true } } {
  requireAuth(locals);
  if (locals.user.role !== 'admin' && !locals.user.accepted) {
    error(403, 'Only accepted students can access this resource');
  }
}
