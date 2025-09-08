import multer from "multer";
import fs from "fs";
import path from "path";
import { requireCaptchaVerification } from "../services/captchaService.js";

const VALID_CATEGORIES = ["files", "pictures", "uncategorized", "private"];
const UPLOAD_BASE_DIR =
  process.env.UPLOAD_BASE_DIR || path.join(process.cwd(), "..", "uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const getFileCategory = (mimetype) =>
  mimetype.startsWith("image/") ? "pictures" : "files";

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      let category = req.body.category || "uncategorized";

      // Auto-assign category if uncategorized
      if (category === "uncategorized") category = getFileCategory(file.mimetype);

      if (!VALID_CATEGORIES.includes(category))
        return cb(new Error("Invalid category"), null);

      let subDir = "";

      if (category === "private") {
        // Private uploads: allow logged-in users without CAPTCHA
        if (!req.session?.user) {
          const token = req.body.captchaToken;
          if (!token)
            return cb(
              new Error("Captcha token required for private uploads"),
              null
            );

          try {
            await requireCaptchaVerification(req, token);
          } catch (err) {
            return cb(new Error("Captcha verification failed"), null);
          }
        }
        
        // Check if this is an appointment request letter upload - prioritize this over file type
        if (req.path.includes('/appointment/files') || req.originalUrl.includes('/appointment/files')) {
          subDir = "request-letter";
        } else {
          subDir = getFileCategory(file.mimetype); // separate folder by file type
        }
      }

      const dir = path.join(UPLOAD_BASE_DIR, category, subDir);
      ensureDir(dir);

      req.finalCategory = `${category}/${subDir}`;
      cb(null, dir);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    const uniqueSuffix =
      new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      "-" +
      Math.round(Math.random() * 1e9);
    cb(null, `${originalName}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(413).json({
        message: "File too large. Max size is 5MB.",
      });
    return res.status(500).json({ message: "Multer error.", error: err.message });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
};
