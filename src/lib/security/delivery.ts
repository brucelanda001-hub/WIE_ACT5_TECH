
/**
 * Delivers the 6-digit sign-in code to the parent.
 *
 * Channel 1 (always on): the parent's signed-in EdNova dashboard. It polls every few seconds and
 *   shows the code in a "Sign-in requests" card. Possession of the parent's session is the second factor.
 * Channel 2 (optional): email, when SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM are configured.
 *   Uses nodemailer if it is installed; nothing else is sent anywhere.
 *
 * The code is never written to logs.
 */
export async function deliverCodeToParent(opts: {
  email: string;
  code: string;
  childNickname: string;
  deviceLabel: string;
  minutesValid: number;
}): Promise<{ channels: string[] }> {
  const channels = ["dashboard"];

  if (process.env.SMTP_HOST && process.env.SMTP_FROM) {
    try {
      // Optional dependency: `npm i nodemailer` to enable email delivery.
      const mod = (await import(/* webpackIgnore: true */ "nodemailer" as string).catch(() => null)) as
        | { createTransport: (o: unknown) => { sendMail: (m: unknown) => Promise<unknown> } }
        | null;
      if (!mod) {
        console.warn("[security] SMTP configured but nodemailer is not installed; using dashboard delivery only.");
      } else {
        const transport = mod.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        });
        await transport.sendMail({
          from: process.env.SMTP_FROM,
          to: opts.email,
          subject: `EdNova code for ${opts.childNickname}: ${opts.code}`,
          text:
            `${opts.childNickname} wants to sign in to EdNova on ${opts.deviceLabel}.\n\n` +
            `Code: ${opts.code}\n\nType it on your child's device. It expires in ${opts.minutesValid} minutes.\n` +
            `If this was not you, open your EdNova parent space and press "Deny".`,
        });
        channels.push("email");
      }
    } catch (e) {
      console.error("[security] email delivery failed:", e instanceof Error ? e.message : "unknown error");
    }
  }
  return { channels };
}
