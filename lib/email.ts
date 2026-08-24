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

  // Inlined styles and a plain dark background: email clients strip <style>
  // blocks and none of them honour CSS variables.
  const html = `<!doctype html>
<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#0B111C;padding:32px;color:#E9EFFA">
  <div style="max-width:480px;margin:0 auto;background:#151D2B;border:1px solid #232E41;border-radius:24px;padding:32px">
    <div style="font-size:20px;font-weight:600;margin-bottom:12px;color:#E9EFFA">Chorella</div>
    <p style="font-size:15px;line-height:1.6;color:#A8B4C8;margin:0 0 12px">Hi ${escapeHtml(name)},</p>
    <p style="font-size:15px;line-height:1.6;color:#E9EFFA;margin:0">
      Someone asked to reset the password on your Chorella account.
      Choose a new one with the button below — it works once and expires in an hour.
    </p>
    <p style="margin:28px 0">
      <a href="${link}" style="display:inline-block;background:#4FC3E8;color:#08131C;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">Choose a new password</a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:#8595AC;margin:0">
      If this wasn't you, ignore this email and your password stays as it is.
    </p>
    <p style="font-size:12px;color:#6E7E96;word-break:break-all;margin-top:24px">${link}</p>
  </div>
</div>`;

  return { subject: "Reset your Chorella password", text, html };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
