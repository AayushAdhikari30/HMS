// Outbound SMS via Twilio's REST API, called over plain fetch so the project
// does not need the Twilio SDK as a dependency. Mirrors mailer.js: when the
// TWILIO_* env vars are absent the message is logged instead of sent, and
// failures resolve rather than throw.

export const isSmsConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);

const logToConsole = ({ to, body }) => {
  console.log("\n──────── SMS (not sent — TWILIO_* unset) ────────");
  console.log(`To:   ${to}`);
  console.log(`Body: ${body}`);
  console.log("────────────────────────────────────────────────\n");
};

/**
 * SMS bodies are billed per 160-character segment, so callers should keep them
 * short; this is a hard backstop rather than a formatting tool.
 */
const truncate = (text, max = 320) =>
  text.length <= max ? text : `${text.slice(0, max - 1)}…`;

export const sendSms = async ({ to, body }) => {
  if (!to || !body) return { delivered: false, reason: "missing to/body" };

  const message = truncate(body);

  if (!isSmsConfigured()) {
    logToConsole({ to, body: message });
    return { delivered: false, reason: "not configured" };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: process.env.TWILIO_FROM_NUMBER,
        Body: message,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[sms] send failed", res.status, detail);
      return { delivered: false, reason: `twilio ${res.status}` };
    }

    const data = await res.json();
    return { delivered: true, messageId: data.sid };
  } catch (err) {
    console.error("[sms] send failed", err);
    return { delivered: false, reason: err.message };
  }
};
