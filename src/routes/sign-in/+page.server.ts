import { SESSION_COOKIE } from '$lib/cookies';
import { emailRegExp } from '$lib/email';
import { passwordRegExp } from '$lib/form/field.svelte';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { sendOtpEmail } from '$lib/server/email';
import { createSession, deleteSession } from '$lib/server/session';
import { shouldBeAccepted } from '$lib/server/user';
import { type Actions, fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import type { PageServerLoad } from './$types';

/** Otp valid for 10 minutes. */
const OTP_DURATION_MS = 1000 * 60 * 10;

/**
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
    console.debug(`Administrator sign-in, id: ${user.id}`);
    redirect(303, url.searchParams.get('redirectTo') ?? '/');
  },

  /** Student sign-in with only the email. An OTP is sent to their email address. */
  student: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().toLowerCase().trim();
    if (!email) return fail(400, { emailMissing: true });
    if (!emailRegExp.test(email)) return fail(400, '`email` must be a well-formed email');

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user && user.role !== 'student') {
      return fail(403, { incorrectRole: true });
    }

    const otp = {
      outstandingOtp: randomInt(100_000, 1_000_000),
      outstandingOtpExpiresAt: new Date(Date.now() + OTP_DURATION_MS),
    };
    if (user) {
      await db.update(users).set(otp).where(eq(users.id, user.id));
      console.debug(`Issue new sign-in OTP to existing student ${user.id}`);
    } else {
      await db.insert(users).values({ email, role: 'student', ...otp, accepted: await shouldBeAccepted(email) });
      console.debug(`New student registration`);
    }
    await sendOtpEmail(email, otp.outstandingOtp, OTP_DURATION_MS);
    return { verifyOtp: true, email };
  },

  verifyOtp: async ({ url, cookies, request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString();
    if (!email) return fail(400, { emailMissing: true });
    if (!emailRegExp.test(email)) return fail(400, '`email` must be a well-formed email');

    const otpRaw = data.get('otp');
    if (!otpRaw) return fail(400, { email, otpMissing: true });
    const otp = Number.parseInt(otpRaw.toString());

    const [user] = await db.select({
      id: users.id,
      role: users.role,
      storedOtp: users.outstandingOtp,
      expires: users.outstandingOtpExpiresAt,
    }).from(users).where(eq(users.email, email)).limit(1);

    if (!user || user.role !== 'student' || !user.expires || new Date() > user.expires || user.storedOtp !== otp) {
      console.debug(`Rejecting OTP verification request for student ${user?.id}`);
      return fail(401, { email, otpInvalid: true });
    }
    await db.update(users).set({ outstandingOtp: null, outstandingOtpExpiresAt: null }).where(eq(users.id, user.id));

    const { id, expiresAt } = await createSession(user.id, user.role);
    cookies.set(SESSION_COOKIE, id, { path: '/', httpOnly: true, secure: true, sameSite: 'lax', expires: expiresAt });
    console.debug(`Create new session for student ${user.id}`);
    redirect(303, url.searchParams.get('redirectTo') ?? '/');
  },

  /** Terminates a session */
  signOut: async ({ cookies, locals }) => {
    if (locals.session) {
      await deleteSession(locals.session.id);
    }
    console.debug(`Delete session ${locals.session.id} for user ${locals.user?.id}`);
    locals.user = null;
    locals.session = null;
    cookies.delete(SESSION_COOKIE, { path: '/' });
    redirect(303, '/sign-in');
  },
} satisfies Actions;
