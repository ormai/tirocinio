import { m } from '$lib/paraglide/messages';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { decrypt } from './encryption.server';
import { getAppName, getSetting } from './settings';

// Nodemailer (https://nodemailer.com/) supports multiple different transports. Such as:
// - Local `sendmail`
// - SMTP
// - Amazon SES
// - custom with Mailgun plugin
// - OAuth
// This configuration might need to be changed.
// Gmail: https://nodemailer.com/guides/using-gmail
let transporter: Transporter | null = await getTransport();

async function getTransport(): Promise<Transporter | null> {
  const host = await getSetting('smtpHost');
  if (!host) return null;
  const port = Number(await getSetting('smtpPort'));
  if (isNaN(port) || port < 0 || port > 65535) {
    console.trace(`SMTP port is invalid: ${port}`);
    return null;
  }
  const user = await getSetting('smtpUsername');
  if (!user) return null;
  const pass = await getSetting('smtpPassword');
  if (!pass) return null;

  return nodemailer.createTransport({ host, port, secure: false, auth: { user, pass: decrypt(pass) } });
}

export async function updateTransporter() {
  transporter = await getTransport();
}

export async function verifyTransporter(): Promise<string | true> {
  if (!transporter) return 'configNull';
  try {
    return await transporter.verify(); // will throw
  } catch (err) {
    return (err as { code: string }).code;
  }
}

const from = `"${await getAppName()}" <${await getSetting('submitterEmail')}>`;

export async function sendOtpEmail(email: string, otp: number, otpDurationMs: number) {
  if (!transporter) {
    console.trace('Transporter is null');
    return;
  }
  await transporter.sendMail(
    {
      from,
      to: email,
      subject: m.email_otp_subject(),
      text: m.email_otp_body({ code: otp, exp: m.minutes({ count: Math.floor(otpDurationMs / 60_000) }) }),
    },
  );
}

export async function sendVerificationEmail(email: string, url: string) {
  if (!transporter) {
    console.trace('Transporter is null');
    return;
  }
  await transporter.sendMail(
    {
      from,
      to: email,
      subject: m.email_verification_subject(),
      text: m.email_verification_body({ url }),
    },
  );
}
