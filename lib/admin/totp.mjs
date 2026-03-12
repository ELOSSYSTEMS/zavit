import { createHmac } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function normalizeTotpToken(value) {
  return String(value ?? "").replace(/[\s-]+/g, "");
}

export function decodeBase32(secret) {
  const normalized = String(secret ?? "")
    .toUpperCase()
    .replace(/=+$/g, "")
    .replace(/\s+/g, "");

  if (!normalized) {
    return Buffer.alloc(0);
  }

  let bits = 0;
  let accumulator = 0;
  const output = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);

    if (index === -1) {
      throw new Error(`Invalid base32 character: ${character}`);
    }

    accumulator = (accumulator << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((accumulator >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateTotpToken({
  secret,
  timestamp = Date.now(),
  stepSeconds = 30,
  digits = 6,
}) {
  const key = decodeBase32(secret);

  if (key.length === 0) {
    return null;
  }

  const counter = BigInt(Math.floor(timestamp / 1000 / stepSeconds));
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(counter);

  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binaryCode % 10 ** digits).padStart(digits, "0");
}

export function verifyTotpToken({
  secret,
  token,
  timestamp = Date.now(),
  window = 1,
}) {
  const normalizedToken = normalizeTotpToken(token);

  if (!normalizedToken || normalizedToken.length !== 6) {
    return false;
  }

  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = generateTotpToken({
      secret,
      timestamp: timestamp + offset * 30_000,
    });

    if (candidate === normalizedToken) {
      return true;
    }
  }

  return false;
}
