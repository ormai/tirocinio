// TODO: email bodies are editable in UI by the ADMIN?
// TODO: email bodies are translated?

export async function sendOtpEmail(email: string, otp: number, otpDurationMs: number) {
  console.warn(`NOT IMPLEMENTED ${email}, ${otp}, ${otpDurationMs}`);
}

// TODO: GET endpoint required for this, new email doesn't travel with the request.
// TODO: A crypto secret is sent to the new email with a link that hits the endpoint.
// TODO: Two new columns must be added to `users` to support this.
export async function sendVerificationEmail(email: string, secret: string) {
  console.warn(`NOT IMPLEMENTED ${email}, ${secret}`);
}
