// TODO: email bodies are editable in UI by the ADMIN?
// TODO: email bodies are translated?
export async function sendOtpEmail(email: string, otp: number, otpDurationMs: number) {
  console.warn(`NOT IMPLEMENTED ${email}, ${otp}, ${otpDurationMs}`);
}

export async function sendVerificationEmail(email: string, url: string) {
  console.warn(`NOT IMPLEMENTED ${email}, ${url}`);
}
