import crypto from "crypto";

const NAME = process.env.GUEST_COOKIE_NAME || "gstk";
const SECRET = process.env.COOKIE_SECRET || process.env.SESSION_SECRET || "dev-secret";

function b64urlEncode(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");
}
function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

export function mintGuestCookie(sessionId, contributionId, ttlMin = 120) {
  const exp = Math.floor(Date.now() / 1000) + ttlMin * 60;
  const payload = { sid: Number(sessionId), cid: Number(contributionId), exp };
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const sig = b64urlEncode(crypto.createHmac("sha256", SECRET).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyGuestCookie(token) {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expectSig = b64urlEncode(crypto.createHmac("sha256", SECRET).update(body).digest());
  // Timing-safe equality
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectSig))) return null;

  let payload;
  try { payload = JSON.parse(b64urlDecode(body).toString("utf8")); } catch { return null; }
  if (!payload || typeof payload.sid !== "number" || typeof payload.cid !== "number" || typeof payload.exp !== "number") return null;

  // Expired?
  if (Math.floor(Date.now() / 1000) > payload.exp) return null;

  return payload; // { sid, cid, exp }
}

export function cookieOptions(ttlMin = 120) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: ttlMin * 60 * 1000,
    path: "/api", // only sent to API routes
  };
}

export const GUEST_COOKIE_NAME = NAME;
