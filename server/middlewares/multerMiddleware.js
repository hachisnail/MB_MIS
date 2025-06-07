import multer from "multer";
import fs from "fs";
import path from "path";

const VALID_CATEGORIES = ["files", "pictures", "uncategorized"];

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const UPLOAD_BASE_DIR = path.join(process.cwd(), "..", "uploads");

// File type categorization logic
const getFileCategory = (mimetype) => {
  if (mimetype.startsWith("image/")) return "pictures";
  return "files";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let category = req.body.category || "uncategorized";
    
    // Auto-categorize if set to uncategorized
    if (category === "uncategorized") {
      category = getFileCategory(file.mimetype);
    }
    
    if (!VALID_CATEGORIES.includes(category)) {
      return cb(new Error("Invalid category"), null);
    }

    const dir = path.join(UPLOAD_BASE_DIR, category);
    ensureDir(dir);
    
    // Store final category for controller access
    req.finalCategory = category;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
  const originalName = path.parse(file.originalname).name; // "report"
  const ext = path.extname(file.originalname);             // ".pdf"
  const uniqueSuffix = new Date().toISOString().slice(0,10).replace(/-/g, '') 
                      + '-' + Math.round(Math.random() * 1e9); // "20250605-912837462"
  
  const finalName = `${originalName}-${uniqueSuffix}${ext}`;  // "report-20250605-912837462.pdf"
  cb(null, finalName);
},

});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});