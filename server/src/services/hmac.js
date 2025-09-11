import crypto from "crypto";

const SECRET = process.env.SIGN_SECRET || "supersecret";

export const signUUID = (uuid) => {
  return crypto.createHmac("sha256", SECRET).update(uuid).digest("hex");
};

export const verifyUUIDSignature = (uuid, sig) => {
  const expected = signUUID(uuid);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};
