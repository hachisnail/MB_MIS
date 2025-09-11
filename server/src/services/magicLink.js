import crypto from "crypto";

function b64url(buf) {
  return buf.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

export function newOpaqueToken(bytes = 32) {
  return b64url(crypto.randomBytes(bytes)); // send this to user
}

export function sha256hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex"); // store this
}

export function newOtpCode() {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHmac("sha256", salt).update(code).digest("hex");
  return { code, salt, hash };
}

export function verifyOtpCode(code, salt, hash) {
  const computed = crypto.createHmac("sha256", salt).update(code).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}
