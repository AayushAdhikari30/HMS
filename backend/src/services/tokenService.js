import crypto from "crypto";
import { Op } from "sequelize";
import { VerificationToken } from "../models/index.js";
import { TOKEN_TTL_MS } from "../constants.js";

const hash = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

/**
 * Mint a single-use token of the given type for a user and return the raw value
 * (the only place it ever exists in plaintext — it goes straight into an email).
 * Any earlier unused token of the same type is expired first, so requesting a
 * second reset link immediately invalidates the first.
 */
export const issueToken = async ({ userId, type }) => {
  await VerificationToken.update(
    { used_at: new Date() },
    { where: { user_id: userId, type, used_at: null } },
  );

  const raw = crypto.randomBytes(32).toString("hex");

  await VerificationToken.create({
    user_id: userId,
    type,
    token_hash: hash(raw),
    expires_at: new Date(Date.now() + TOKEN_TTL_MS[type]),
  });

  return raw;
};

/**
 * Validate and burn a token. Returns the token row (with user_id) or null if it
 * is unknown, of the wrong type, already used, or expired.
 */
export const consumeToken = async ({ token, type }) => {
  if (!token || typeof token !== "string") return null;

  const row = await VerificationToken.findOne({
    where: {
      token_hash: hash(token),
      type,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });

  if (!row) return null;

  await row.update({ used_at: new Date() });
  return row;
};
