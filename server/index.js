import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { mainDb } from "./src/models/authModels.js";
import sessionStore from "./src/configs/sessionStore.js";
import authRoutes from "./src/routes/auth.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import { initializeSocket } from "./src/configs/socketServer.js";
import { requireAuth,requireRole } from "./src/middlewares/authMiddlewares.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const UPLOAD_BASE_DIR = 

const PUBLIC_UPLOADS = ["pictures", "files"];
const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_DIR || path.join(process.cwd(), "..", "uploads");

// const UPLOAD_BASE_DIR = "/uploads";


if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

const app = express();
app.set('trust proxy', true);
app.use(cors({
  origin: process.env.CLIENT_URL,  
  credentials: true,              
}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
  },
}));


PUBLIC_UPLOADS.forEach((cat) => {
  app.use(`/uploads/${cat}`, express.static(path.join(UPLOAD_BASE_DIR, cat)));
});


app.get(/^\/uploads\/private\/(.+)$/, requireAuth, requireRole([1, 2]), (req, res) => {
  const relativePath = req.params[0]; 
  const filePath = path.join(UPLOAD_BASE_DIR, "private", relativePath);

  const normalizedPath = path.normalize(filePath);
  const baseDir = path.join(UPLOAD_BASE_DIR, "private");

  if (!normalizedPath.startsWith(baseDir)) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.sendFile(normalizedPath);
});

app.use("/api", uploadRoutes);
app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  console.log("req.secure:", req.secure);
  console.log("x-forwarded-proto:", req.headers['x-forwarded-proto']);
  next();
});

app.use((req, res, next) => {
  if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
    return res.status(404).json({ error: "Not Found" });
  }
  next();
});

app.get('/', (req, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);
const io = initializeSocket(server, process.env.CLIENT_URL);
const PORT = process.env.PORT;

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  for (const item of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stat = fs.lstatSync(srcPath);

    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function seedUploadsFolder() {
  const seedDir = path.join(__dirname, '..', 'uploads');
  const seedFlag = path.join(UPLOAD_BASE_DIR, '.seeded');

  if (fs.existsSync(seedFlag)) {
    console.log('Uploads already seeded.');
    return;
  }

  if (!fs.existsSync(seedDir)) {
    console.warn('Seed source folder does not exist:', seedDir);
    return;
  }

  console.log('Seeding uploads volume from Git-tracked /uploads...');
  copyRecursive(seedDir, UPLOAD_BASE_DIR);
  fs.writeFileSync(seedFlag, 'seeded');
  console.log('Seeding complete.');
}

if (process.env.NODE_ENV === 'production') {
  seedUploadsFolder();
}

(async () => {
  try {
    await mainDb.authenticate();
    await sessionStore.sync();
    await mainDb.sync();


server.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running on port ${PORT}`);
});

  } catch (err) {
    console.error("Unable to connect to DB:", err);
  }
})();

export { io };