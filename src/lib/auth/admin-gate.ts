import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_KEY_LENGTH = 64;

export const ADMIN_GATE_COOKIE_NAME = "admin_gate";
export const ADMIN_GATE_MAX_AGE_SECONDS = 60 * 60 * 8;

/** Hashes a plaintext password into a `salt:hash` string for ADMIN_PANEL_PASSWORD_HASH. Run once, offline, to produce the env value. */
export function hashAdminPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyAdminPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const derived = scryptSync(password, salt, expected.length || SCRYPT_KEY_LENGTH);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function gateSecret(): string {
  const secret = process.env.ADMIN_GATE_SECRET;
  if (!secret) throw new Error("ADMIN_GATE_SECRET is not configured");
  return secret;
}

/**
 * Self-signed, stateless gate token (HMAC over uid + expiry) rather than an
 * in-memory session store — Vercel Fluid Compute can route consecutive
 * requests to different function instances, so anything not verifiable
 * from the token itself would re-prompt for the password unpredictably.
 */
export function signAdminGateToken(uid: string): string {
  const expiresAt = Date.now() + ADMIN_GATE_MAX_AGE_SECONDS * 1000;
  const payload = `${uid}.${expiresAt}`;
  const signature = createHmac("sha256", gateSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAdminGateToken(token: string | undefined, uid: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenUid, expiresAtRaw, signature] = parts;
  if (tokenUid !== uid) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = createHmac("sha256", gateSecret()).update(`${tokenUid}.${expiresAtRaw}`).digest("hex");
  const actual = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (actual.length !== expectedBuf.length) return false;
  return timingSafeEqual(actual, expectedBuf);
}
