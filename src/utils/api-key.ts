import { randomBytes, createHash } from "node:crypto";

const API_KEY_PREFIX = "um_live_";

export function generateApiKey(): {
  rawKey: string;
  keyHash: string;
} {
  const secret = randomBytes(32).toString("hex");

  const rawKey = `${API_KEY_PREFIX}${secret}`;

  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  return {
    rawKey,
    keyHash,
  };
}
