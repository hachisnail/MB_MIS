import axios from "axios";

const SECRET_KEY = process.env.RECAPTCHA_SECRET;

/**
 * Verifies a Google reCAPTCHA token.
 * Throws an error if verification fails.
 */
export const verifyCaptcha = async (token) => {
  if (!token) throw new Error("Captcha token is required");

  const params = new URLSearchParams();
  params.append("secret", SECRET_KEY);
  params.append("response", token);

  const res = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    params
  );

  if (!res.data.success) {
    const errCode = res.data["error-codes"]?.join(", ") || "Unknown error";
    throw new Error(`Captcha verification failed: ${errCode}`);
  }

  return true;
};

/**
 * Ensures that either the session has a verified CAPTCHA
 * or verifies the provided token and sets the session flag.
 */
export const requireCaptchaVerification = async (req, token) => {
  if (req.session?.captchaVerified) return true; // already verified

  await verifyCaptcha(token);
  req.session.captchaVerified = true; // mark session as verified
  return true;
};
