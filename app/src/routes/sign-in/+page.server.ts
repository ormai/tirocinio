import { passwordRegExp } from '$lib/form/field.svelte';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createSession, deleteSession, SESSION_COOKIE } from '$lib/server/session';
import { type Actions, fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Page server load function for the login route.
 *
 * Redirects already-authenticated users to the homepage so they don't see
 * the login form unnecessarily.
 */
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    redirect(307, '/');
  }
};

export const actions = {
  /** Admin sign-in with email and password. */
  admin: async ({ cookies, request, url }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().toLowerCase().trim();
    if (!email) return fail(400, { emailMissing: true });
    const password = data.get('password')?.toString();
    if (!password) return fail(400, { passwordMissing: true });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (
      !user || !passwordRegExp.test(password)
      || !(await bcrypt.compare(password, user.encodedPassword ?? ''))
    ) {
      // In case of wrong email or password we return an opaque response, so
      // that it is not possible to determine if an account exists or not.
      return fail(401, { incorrectCredentials: true });
    }
    if (user.role !== 'admin') return fail(403, { incorrectRole: true });

    const { id, expiresAt } = await createSession(user.id, user.role);
    cookies.set(SESSION_COOKIE, id, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expiresAt,
    });
    redirect(303, url.searchParams.get('redirectTo') ?? '/');
  },

  /** Student sign in with only the email. An OTP is sent to their email address. */
  student: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().toLowerCase().trim();
    if (!email) return fail(400, 'email is required');

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      await db.insert(users).values({ email, role: 'student' });
      console.log('new user of type student created');
    }
    if (user.role !== 'student') return fail(403, { incorrectRole: true });
  },

  /** Terminates a session */
  signout: async ({ cookies, locals }) => {
    if (locals.session) {
      await deleteSession(locals.session.id);
    }
    locals.user = null;
    locals.session = null;
    cookies.delete(SESSION_COOKIE, { path: '/' });
    redirect(303, '/sign-in');
  },
} satisfies Actions;
