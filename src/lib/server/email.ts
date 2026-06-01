import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { m } from '$lib/paraglide/messages';
import * as nodemailer from 'nodemailer';

// TODO: SMTP configurable in UI? Only SMTP?
if (!building) {
  if (!env.SMTP_USER) throw new Error('SMTP_USER is not set');
  if (!env.SMTP_PASS) throw new Error('SMTP_PASS is not set');
  if (!env.SMTP_HOST) throw new Error('SMTP_HOST is not set');
  if (!env.SMTP_PORT) throw new Error('SMTP_PORT is not set');
}

// Nodemailer (https://nodemailer.com/) supports multiple different transports. Such as:
// - Local `sendmail`
// - SMTP
// - Amazon SES
// - custom with Mailgun plugin
// - OAuth
// This configuration might need to be changed.
export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const from = `"Tirocinio App" <${env.SMTP_USER}>`;

if (!building) {
  await transporter.verify(); // will throw
}

export async function sendOtpEmail(email: string, otp: number, otpDurationMs: number) {
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
  await transporter.sendMail(
    {
      from,
      to: email,
      subject: m.email_verification_subject(),
      text: m.email_verification_body({ url }),
    },
  );
}
