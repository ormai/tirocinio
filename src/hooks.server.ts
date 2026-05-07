import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { getSession, SESSION_COOKIE } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { eq } from 'drizzle-orm';

const authentication: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(SESSION_COOKIE);
  if (token) {
    const session = await getSession(token);
    if (session) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));
      console.assert(user, 'Request belongs to an orphaned Session. User deletion should cascade to Session.');
      event.locals.user = user;
      event.locals.session = session;
    }
  }
  return resolve(event);
};

const paraglide: Handle = ({ event, resolve }) => {
  return paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;
    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html
          .replace('%paraglide.lang%', locale)
          .replace('%paraglide.dir%', getTextDirection(locale)),
    });
  });
};

export const handle = sequence(paraglide, authentication);
