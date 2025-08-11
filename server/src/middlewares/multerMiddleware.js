import multer from "multer";
import fs from "fs";
import path from "path";

const VALID_CATEGORIES = ["files", "pictures", "uncategorized", "private"];
const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_DIR || path.join(process.cwd(), "..", "uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getFileCategory = (mimetype) => {
  if (mimetype.startsWith("image/")) return "pictures";
  return "files";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let category = req.body.category || "uncategorized";

    if (category === "uncategorized") {
      category = getFileCategory(file.mimetype);
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return cb(new Error("Invalid category"), null);
    }

    // Lock down private category at upload time
    if (category === "private") {
      const user = req.session?.user;
      if (!user) {
        return cb(new Error("Unauthorized: Login required for private uploads"), null);
      }
    }

    const dir = path.join(UPLOAD_BASE_DIR, category);
    ensureDir(dir);

    req.finalCategory = category;
    cb(null, dir);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

export const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large. Max size is 5MB." });
    }
    return res.status(500).json({ message: "Multer error.", error: err.message });
  }
  next(err);
};