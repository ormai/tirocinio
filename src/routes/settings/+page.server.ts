import { emailRegExp } from '$lib/email';
import { passwordRegExp } from '$lib/form/field.svelte';
import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { updateTransporter, verifyTransporter } from '$lib/server/email';
import { encrypt } from '$lib/server/encryption.server';
import {
  getAppName,
  getDurationFirstYear,
  getDurationSecondYear,
  getDurationThirdYear,
  getSetting,
  setSetting,
} from '$lib/server/settings';
import { BCRYPT_ROUNDS } from '$lib/server/user';
import { type ActionFailure, fail, isActionFailure } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

// should have used helper like this one across the server actions. too late
function getRequiredNum(form: FormData, name: string): number | ActionFailure<string> {
  const raw = form.get(name);
  const num = Number(raw);
  if (!raw || isNaN(num)) return fail(400, `${name} is required and must be a valid number`);
  return num;
}

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  return {
    appName: await getAppName(),
    submitterEmail: await getSetting('submitterEmail'),
    smtpHost: await getSetting('smtpHost'),
    smtpPort: await getSetting('smtpPort'),
    smtpUsername: await getSetting('smtpUsername'),
    firstYear: await getDurationFirstYear(),
    secondYear: await getDurationSecondYear(),
    thirdYear: await getDurationThirdYear(),
  };
};

export const actions: Actions = {
  updateGeneralSettings: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();

    const appName = String(form.get('app-name'));
    if (!appName || appName.length > 30) return fail(400, '`app-name` must be a non-empty string with length < 30');

    await setSetting('appName', appName);
  },

  updateEmailSettings: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const submitterEmail = String(form.get('submitter-email'));
    if (!emailRegExp.test(submitterEmail)) return fail(400, '`submitter-email` must be a valid email address');
    const smtpHost = String(form.get('smtp-host'));
    if (!smtpHost) return fail(400, '`smtp-host` must be a non-empty string');
    const smtpPort = Number(form.get('smtp-port'));
    if (isNaN(smtpPort) || smtpPort < 0 || smtpPort > 65535) {
      return fail(400, '`smtp-port` must be a valid number in [0, 65535]');
    }
    const smtpUsername = String(form.get('smtp-username'));
    if (!smtpUsername) return fail(400, '`smtp-username` must be a non-empty string');
    const smtpPassword = String(form.get('smtp-password'));

    await db.transaction(async (tx) => {
      await setSetting('submitterEmail', submitterEmail, tx);
      await setSetting('smtpHost', smtpHost, tx);
      await setSetting('smtpPort', String(smtpPort), tx);
      await setSetting('smtpUsername', smtpUsername, tx);
      if (smtpPassword) {
        await setSetting('smtpPassword', encrypt(smtpPassword), tx);
      }
    });
    await updateTransporter();
  },

  verifyEmailConfiguration: async ({ locals }) => {
    requireAdmin(locals);
    return { validity: await verifyTransporter() };
  },

  addAdminAccount: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const adminEmail = String(form.get('admin-email'));
    if (!emailRegExp.test(adminEmail)) return fail(400, '`admin-email` must be a valid email address');
    const adminPassword = String(form.get('admin-password'));
    if (!passwordRegExp.test(adminPassword)) {
      return fail(
        400,
        '`admin-password` must contain at least 1 lowercase letter, 1 uppercase letter, 1 symbol, 1 digit, and be at least 10 characters long',
      );
    }
    const adminName = String(form.get('admin-name'));
    if (!adminName) return fail(400, '`admin-name` is required');
    const adminSurname = String(form.get('admin-surname'));
    if (!adminSurname) return fail(400, '`admin-surname` is required');

    return await db.transaction(async (tx) => {
      if ((await tx.$count(users, eq(users.email, adminEmail))) > 0) {
        return fail(400, { emailTaken: true });
      }
      await tx.insert(users).values({
        name: adminName,
        surname: adminSurname,
        email: adminEmail,
        encodedPassword: await bcrypt.hash(adminPassword, BCRYPT_ROUNDS),
        role: 'admin',
      });
    });
  },

  updateDurationSettings: async ({ locals, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const firstYear = getRequiredNum(form, 'first-year');
    if (isActionFailure(firstYear)) return firstYear;
    const secondYear = getRequiredNum(form, 'second-year');
    if (isActionFailure(secondYear)) return secondYear;
    const thirdYear = getRequiredNum(form, 'third-year');
    if (isActionFailure(thirdYear)) return thirdYear;

    await setSetting('firstYear', String(firstYear));
    await setSetting('secondYear', String(secondYear));
    await setSetting('thirdYear', String(thirdYear));
  },
};
