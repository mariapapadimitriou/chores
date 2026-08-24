import { createHash } from "crypto";

/**
 * Reset tokens are stored as a SHA-256 hash, never in the clear, so a dump of
 * the token table cannot be replayed to take over an account. A plain hash is
 * the right tool here (unlike for passwords): the token is 32 random bytes, so
 * there is no dictionary to attack and nothing for a slow KDF to protect.
 */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
