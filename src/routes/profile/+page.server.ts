import { emailRegExp } from '$lib/email';
import { passwordRegExp } from '$lib/form/field.svelte';
import { requireAuth } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { sendVerificationEmail } from '$lib/server/email';
import { BCRYPT_ROUNDS } from '$lib/server/user';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { and, eq, ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  requireAuth(locals);
};

export const actions = {
  /**
   * Updates the currently authenticate user's account data. Every field is optional.
   */
  update: async ({ locals, request, url }) => {
    requireAuth(locals);

    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();
    const name = data.get('name')?.toString();
    const surname = data.get('surname')?.toString();

    const yearStr = data.get('enrollment-year');
    const enrollmentYear = yearStr ? Number(yearStr) : null;
    if (enrollmentYear != null && (enrollmentYear < 0 || enrollmentYear > 32767)) {
      return fail(400, 'Enrollment year must be in range [0, 32767]');
    }

    const numberStr = data.get('student-number');
    const number = numberStr ? Number(numberStr) : null;
    if (number != null && (number < 0 || number > 2147483647)) {
      return fail(400, 'Number must be in range [0, 2147483647]');
    }
    if (number != null && await db.$count(users, and(eq(users.number, number), ne(users.id, locals.user.id))) > 0) {
      return fail(409, { numberTaken: true });
    }

    const currentPassword = data.get('current-password')?.toString();
    const newPassword = data.get('new-password')?.toString();

    if (currentPassword && newPassword) {
      if (!passwordRegExp.test(newPassword)) {
        return fail(400, 'New password is not secure enough');
      }
      if (
        !passwordRegExp.test(currentPassword)
        || !(await bcrypt.compare(currentPassword, locals.user?.encodedPassword ?? ''))
      ) {
        return fail(403, { incorrectPassword: true });
      }
    }

    const newEmail = email !== locals.user.email ? email : undefined;
    if (newEmail && !emailRegExp.test(newEmail)) return fail(400, '`newEmail` must be a well-formed email');

    if (newEmail && await db.$count(users, eq(users.email, newEmail)) > 0) {
      return fail(409, { emailTaken: true });
    }

    const mfaSecret = newEmail ? randomUUID() : undefined;

    // NOTE: `undefined` is ignored by drizzle, `null` is the same as in SQL.
    // See: https://orm.drizzle.team/docs/update
    if (
      newPassword || name !== locals.user.name || surname !== locals.user.surname || number !== locals.user.number
      || newEmail || mfaSecret || enrollmentYear !== locals.user.enrollmentYear
    ) {
      await db.transaction(async (tx) => {
        await tx.update(users).set({
          encodedPassword: newPassword ? await bcrypt.hash(newPassword, BCRYPT_ROUNDS) : undefined,
          name: name !== locals.user.name ? name : undefined,
          surname: surname !== locals.user.surname ? surname : undefined,
          number,
          newEmail,
          mfaSecret,
          enrollmentYear,
        }).where(eq(users.id, locals.user.id));
        if (newPassword) {
          await tx.delete(sessions).where(and(eq(sessions.userId, locals.user.id), ne(sessions.id, locals.session.id)));
        }
      });
      console.debug(`Update user details for ${locals.user.id}`);
    }

    let emailVerificationSent = false;
    if (newEmail && mfaSecret) {
      // NOTE: If the default admin user changes their email the default account gets recreated.
      await sendVerificationEmail(newEmail, `${url.origin}/verify?t=${mfaSecret}`);
      emailVerificationSent = true;
    }
    return { success: true, emailVerificationSent };
  },
} satisfies Actions;
