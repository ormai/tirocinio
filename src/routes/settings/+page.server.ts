import { emailRegExp } from '$lib/email';
import { requireAdmin } from '$lib/server/api-security';
import { db } from '$lib/server/db';
import { updateTransporter, verifyTransporter } from '$lib/server/email';
import { encrypt } from '$lib/server/encryption.server';
import { getAppName, getSetting, setSetting } from '$lib/server/settings';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  return {
    appName: await getAppName(),
    submitterEmail: await getSetting('submitterEmail'),
    smtpHost: await getSetting('smtpHost'),
    smtpPort: await getSetting('smtpPort'),
    smtpUsername: await getSetting('smtpUsername'),
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
        await setSetting('smtpPassword', encrypt(smtpPassword));
      }
    });
    await updateTransporter();
  },

  verifyEmailConfiguration: async ({ locals }) => {
    requireAdmin(locals);
    return { validity: await verifyTransporter() };
  },
};
