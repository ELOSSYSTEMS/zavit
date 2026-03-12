import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function signSessionPayload(encodedPayload, secret) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createSessionToken(
  session,
  secret,
  nowMs = Date.now(),
  maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS,
) {
  if (!secret) {
    throw new Error("Admin session secret is required.");
  }

  const issuedAt = Math.floor(nowMs / 1000);
  const payload = {
    v: 1,
    email: session.email,
    role: session.role,
    iat: issuedAt,
    exp: issuedAt + maxAgeSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signSessionPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token, secret, nowMs = Date.now()) {
  if (!token || !secret) {
    return null;
  }

  const [encodedPayload, signature] = String(token).split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(encodedPayload, secret);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    if (
      payload?.v !== 1 ||
      typeof payload?.email !== "string" ||
      typeof payload?.role !== "string" ||
      typeof payload?.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(nowMs / 1000)) {
      return null;
    }

    return {
      email: payload.email,
      role: payload.role,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}
