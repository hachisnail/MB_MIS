import express, { Router } from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cookieParser from "cookie-parser";

import { mainDb, logsDb } from "./src/models/authModels.js";
import sessionStore from "./src/configs/sessionStore.js";
import authRoutes from "./src/routes/auth.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import { initializeSocket } from "./src/configs/socketServer.js";
import { requireAuth, requireRole } from "./src/middlewares/authMiddlewares.js";
import { startArticleScheduler } from "./src/services/scheduler.js";
import { postEvents, getArticleStats, getNextSuggestions } from "./src/controllers/EngagementController.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_UPLOADS = ["pictures", "files"];
const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_DIR || path.join(process.cwd(), "..", "uploads");

const engagementRoutes = Router();
engagementRoutes.post("/events", postEvents);
engagementRoutes.get("/article/:id", getArticleStats);
engagementRoutes.get("/suggest/next", getNextSuggestions);

if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

const app = express();

// ---- CORS FIRST (multi-origin, credentials, custom headers) ----
const parseOrigins = (raw) =>
  (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const ALLOWED_ORIGINS = [
  ...parseOrigins(process.env.CLIENT_URLS),   // preferred: comma-separated
  ...parseOrigins(process.env.CLIENT_URL),    // backward compat
];
console.log("CORS allowed origins:", ALLOWED_ORIGINS);

const corsMw = cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);            // same-origin / server-to-server
    cb(null, ALLOWED_ORIGINS.includes(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-browser-id", "x-requested-with"],
});
app.use(corsMw);
app.options(/.*/, corsMw); 

const PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS || 1);
app.set("trust proxy", process.env.NODE_ENV === "production" ? PROXY_HOPS : false);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",              
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

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
app.use("/api/engagement", engagementRoutes);

// Debug (optional)
app.use((req, res, next) => {
  console.log("req.secure:", req.secure);
  console.log("x-forwarded-proto:", req.headers["x-forwarded-proto"]);
  next();
});

app.use((req, res, next) => {
  if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
    return res.status(404).json({ error: "Not Found" });
  }
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);
const io = initializeSocket(server, ALLOWED_ORIGINS);
const PORT = process.env.PORT;

// Start HTTP server immediately so proxies can reach CORS + /socket.io
server.listen(PORT, "0.0.0.0", () => {
  console.log(`API Server running on port ${PORT}`);
  console.log(`Trust proxy: ${app.get("trust proxy")}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});

// Initialize DBs in the background (log problems but don’t crash the server)
(async () => {
  try { await mainDb.authenticate(); } catch (e) { console.error("DB auth (main) failed:", e); }
  try { await logsDb.authenticate(); } catch (e) { console.error("DB auth (logs) failed:", e); }
  try { await sessionStore.sync(); } catch (e) { console.error("Session store sync failed:", e); }
  try { await mainDb.sync(); } catch (e) { console.error("mainDb.sync failed:", e); }
  try { await logsDb.sync(); } catch (e) { console.error("logsDb.sync failed:", e); }
  try { startArticleScheduler(); } catch (e) { console.error("Scheduler start failed:", e); }
})();

export { io };
