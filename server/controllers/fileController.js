import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

const UPLOAD_BASE_DIR = path.join(process.cwd(), "..", "uploads");
const VALID_CATEGORIES = ["files", "pictures", "uncategorized"];

export const handleUpload = (req, res) => {
  const category = req.body.category || "uncategorized";
  
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  const filePath = `/uploads/${category}/${req.file.filename}`;
  res.json({
    filename: req.file.filename,
    path: filePath,
  });
};

export const handleDownload = (req, res) => {
  const { category, filename } = req.params;
  
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  const filePath = path.join(UPLOAD_BASE_DIR, category, filename);
  
  if (!fsSync.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath, filename, (err) => {
    if (err) console.error("Download error:", err);
  });
};

export const listFiles = async (req, res) => {
  try {
    const result = [];

    for (const category of VALID_CATEGORIES) {
      const categoryDir = path.join(UPLOAD_BASE_DIR, category);
      let files = [];
      
      if (fsSync.existsSync(categoryDir)) {
        files = await fs.readdir(categoryDir);
      }
      
      result.push({
        category,
        files: files.map(file => ({
          filename: file,
          path: `/uploads/${category}/${file}`,
        }))
      });
    }

    res.json({ categories: result });
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({
      message: "Error listing files",
      error: err.message,
    });
  }
};