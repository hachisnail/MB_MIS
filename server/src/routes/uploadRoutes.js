import express from "express";
import { requireAuth, requireRole } from "../middlewares/authMiddlewares.js";
import { upload } from "../middlewares/multerMiddleware.js";
import { handleUpload, handleDownload, listFiles } from "../controllers/fileController.js";

const router = express.Router();

router.post("/upload", requireAuth, upload.single("file"), handleUpload);
router.get("/download/:category/:filename", requireAuth, handleDownload);
router.get("/list", requireAuth, listFiles); 

export default router;