/**
 * Transactional email via Resend's REST API.
 *
 * Called through plain fetch rather than the SDK — one HTTP call does not
 * justify another dependency in the bundle.
 *
 * When RESEND_API_KEY is absent the message is logged instead of sent, and
 * the caller is told delivery did not happen. That keeps the whole reset flow
 * usable before a sending domain is verified: the link still appears in the
 * runtime logs and can be pasted into a browser.
 */
export type SendResult = { delivered: boolean; reason?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Chorella <onboarding@resend.dev>";

  if (!key) {
    console.warn(
      `[chorella] RESEND_API_KEY not set — email to ${opts.to} was not sent.\n` +
        `Subject: ${opts.subject}\n${opts.text}`
    );
    return { delivered: false, reason: "no-api-key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      // Log rather than throw: the caller must not reveal to an anonymous
      // visitor whether the address exists or why delivery failed.
      console.error(`[chorella] Resend rejected the email (${res.status}): ${detail}`);
      return { delivered: false, reason: `resend-${res.status}` };
    }
    return { delivered: true };
  } catch (err) {
    console.error("[chorella] Could not reach Resend:", err);
    return { delivered: false, reason: "network" };
  }
}

export function resetEmail(name: string, link: string) {
  const text = `Hi ${name},

Someone asked to reset the password on your Chorella account. Open the link
below to choose a new one. It works once and expires in an hour.

${link}

If this wasn't you, ignore this email — your password stays as it is.`;

  const html = `<!doctype html>
<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#FBF6EE;padding:32px;color:#1F1B16">
  <div style="max-width:480px;margin:0 auto;background:#FFFDF8;border:1px solid rgba(31,27,22,.08);border-radius:24px;padding:32px">
    <div style="font-size:20px;font-weight:600;margin-bottom:4px">Chorella</div>
    <p style="font-size:15px;line-height:1.6;color:#1F1B16b3">Hi ${escapeHtml(name)},</p>
    <p style="font-size:15px;line-height:1.6">
      Someone asked to reset the password on your Chorella account.
      Choose a new one with the button below — it works once and expires in an hour.
    </p>
    <p style="margin:28px 0">
      <a href="${link}" style="display:inline-block;background:#1F1B16;color:#FBF6EE;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">Choose a new password</a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:#1F1B1b80">
      If this wasn't you, ignore this email and your password stays as it is.
    </p>
    <p style="font-size:12px;color:#1F1B1b66;word-break:break-all;margin-top:24px">${link}</p>
  </div>
</div>`;

  return { subject: "Reset your Chorella password", text, html };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
