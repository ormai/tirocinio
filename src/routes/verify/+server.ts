import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { isRedirect, redirect, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

/**
 * Verifies a new email address for a user.
 */
export const GET: RequestHandler = async ({ url }) => {
  const token = url.searchParams.get('t');
  try {
    if (token) {
      const [user] = await db.select().from(users).where(eq(users.mfaSecret, token));
      if (user && user.newEmail) {
        await db.update(users)
          .set({ email: user.newEmail, newEmail: null, mfaSecret: null })
          .where(eq(users.id, user.id));
        console.debug(`Multi-factor email verification successful for user ${user.id}`);
        redirect(307, `/profile?verification=success`);
      }
    }
  } catch (e) {
    if (e instanceof Response || isRedirect(e)) throw e;
    console.error(e);
  }
  redirect(307, `/profile?verification=fail`);
};
