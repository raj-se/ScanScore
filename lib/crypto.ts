import crypto from "crypto";

/**
 * The free tier only ever receives 2 suggestions + summary from the API route.
 * The FULL analysis is encrypted server-side with a secret the client never sees,
 * and shipped to the client as an opaque blob ("lockedPayload"). The client cannot
 * decrypt it — only /api/unlock (called after the demo payment form "succeeds")
 * decrypts it and returns the full result. This means no database is required for
 * the MVP, while still keeping the paid content genuinely hidden pre-unlock.
 *
 * NOTE: /api/unlock currently has no real payment check — see
 * components/PaymentModal.tsx for the placeholder checkout UI. Swap in a real
 * processor by verifying payment server-side in that route before decrypting.
 *
 * For a production app with a database: store the analysis row in Postgres keyed
 * by analysisId, and mark it `paid = true` in /api/unlock instead.
 */

function getKey(): Buffer {
  const secret = process.env.ANALYSIS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ANALYSIS_SECRET must be set to a random string of at least 32 characters. Generate one with: openssl rand -hex 32"
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptPayload(data: unknown): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const json = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(json, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decryptPayload<T>(payload: string): T {
  const key = getKey();
  const raw = Buffer.from(payload, "base64url");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf-8"));
}
