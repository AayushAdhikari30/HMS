import { HTTP } from "../constants.js";

// Minimal fixed-window limiter for the endpoints that send mail or check
// passwords. State is per-process and in-memory: it resets on restart and does
// not coordinate across instances, so it throttles casual abuse rather than a
// distributed attack. Swap in a Redis-backed limiter before running more than
// one server process.

const buckets = new Map();

// Stale buckets would otherwise accumulate one entry per IP forever.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}, SWEEP_INTERVAL_MS);
sweep.unref();

export const rateLimit = ({ windowMs, max, keyPrefix = "" }) => (req, res, next) => {
  const key = `${keyPrefix}:${req.ip}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  entry.count += 1;

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(HTTP.TOO_MANY_REQUESTS).json({
      message: `Too many requests. Try again in ${retryAfter} seconds.`,
    });
  }

  return next();
};
