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
import feedbackRoutes from "./src/routes/feedbackRoutes.js";
import { initializeSocket } from "./src/configs/socketServer.js";
import { requireAuth, requireRole } from "./src/middlewares/authMiddlewares.js";
import { startArticleScheduler, startAppointmentNoShowScheduler } from "./src/services/scheduler.js";
import { postEvents, getArticleStats, getNextSuggestions } from "./src/controllers/EngagementController.js";


import { verifyGuestCookie, GUEST_COOKIE_NAME } from "./src/services/guestCookie.js";
import { ContributionSessions } from "./src/models/contributionModels.js";
import { Contracts } from "./src/models/Contracts.js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

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
    allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-browser-id",
    "x-requested-with",
    "Cache-Control",   // 👈 add this
    "Pragma",          // optional, some browsers use it
    "Expires"          // optional
  ],
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


// --- Guard: require OTP-verified guest session (cookie + DB) ---
async function requireOtpVerifiedSession(req, res, next) {
  try {
    const { sessionId } = req.params;

    // Cookie must exist
    const raw = req.cookies?.[GUEST_COOKIE_NAME];
    if (!raw) {
      return res.status(401).json({ code: "NO_COOKIE", message: "Guest cookie missing" });
    }

    // Cookie must be valid and unexpired
    const guest = verifyGuestCookie(raw); // -> { sid, cid, exp } or null
    if (!guest) {
      return res.status(401).json({ code: "BAD_COOKIE", message: "Guest cookie invalid/expired" });
    }

    // Cookie session must match URL session
    if (String(guest.sid) !== String(sessionId)) {
      return res.status(401).json({
        code: "COOKIE_SESSION_MISMATCH",
        message: "Cookie sid does not match URL param",
        cookie_sid: guest.sid,
        url_sid: sessionId,
      });
    }

    // Session must exist, be active, not expired, and OTP-verified
    const sess = await ContributionSessions.findOne({ where: { session_id: sessionId, is_active: true } });
    if (!sess) return res.status(404).json({ code: "SESSION_NOT_FOUND" });

    const now = new Date();
    if (sess.link_expires_at && now > sess.link_expires_at) {
      return res.status(401).json({ code: "LINK_EXPIRED" });
    }

    // Make sure the cookie also matches the contribution we expect
    if (String(sess.contribution_id) !== String(guest.cid)) {
      return res.status(401).json({ code: "COOKIE_CONTRIBUTION_MISMATCH" });
    }

    // You mark success via otp_verified_at (not write_enabled)
    if (!sess.otp_verified_at) {
      return res.status(403).json({ code: "OTP_REQUIRED", message: "OTP not verified yet" });
    }

    req.contributionSession = sess;
    next();
  } catch (err) {
    console.error("requireOtpVerifiedSession error:", err);
    return res.status(401).json({ code: "UNAUTHORIZED" });
  }
}

// --- Health Check ---
app.get("/health", async (req, res) => {
  try {
    await mainDb.authenticate();
    await logsDb.authenticate();

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db: "connected",
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      db: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});


PUBLIC_UPLOADS.forEach((cat) => {
  app.use(`/uploads/${cat}`, express.static(path.join(UPLOAD_BASE_DIR, cat)));
});

app.get(
  "/api/auth/contributions/session/:sessionId/contract-preview",
  requireOtpVerifiedSession,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const sess = req.contributionSession; 

      const contract = await Contracts.findOne({
        where: { contribution_id: sess.contribution_id },
        raw: true,
      });
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      const payload =
        typeof contract.payload === "string"
          ? JSON.parse(contract.payload)
          : contract.payload;

      const kind = payload.type?.toLowerCase();
      const fileMap = {
        donation: "DONATION-FORM.docx",
        lending: "LEND-FORM.docx",
      };
      const templateFile = fileMap[kind];
      if (!templateFile) {
        return res.status(400).json({ message: "Unknown contract type" });
      }

      const filePath = path.join(
        UPLOAD_BASE_DIR,
        "private",
        "templates",
        templateFile
      );
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Template not found" });
      }

      const content = fs.readFileSync(filePath, "binary");
      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: "[[",
          end: "]]",
        },
      });

      doc.render(payload.mergedData || {});
      const buf = doc.getZip().generate({ type: "nodebuffer" });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${payload.fileName || "contract"}.docx"`
      );
      res.setHeader("Cache-Control", "private, no-store, max-age=0");

      res.send(buf);
    } catch (err) {
      console.error("contract-preview error:", err);
      res.status(500).json({ message: "Failed to render contract" });
    }
  }
);


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
app.use("/api/feedback", feedbackRoutes);
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


const server = http.createServer(app);
const io = initializeSocket(server, ALLOWED_ORIGINS);
const PORT = process.env.PORT;

// Start the HTTP server immediately
server.listen(PORT, "0.0.0.0", () => {
  console.log(`API Server running on port ${PORT}`);
  console.log(`Trust proxy: ${app.get("trust proxy")}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});

// --- Initialize DBs and session store in the background ---
(async () => {
  // Session store sync (non-blocking)
  sessionStore.sync().then(() => {
    console.log("Session store synced");
  }).catch((e) => console.error("Session store sync failed:", e));

  // Main DB
  mainDb.authenticate()
    .then(() => mainDb.sync())
    .then(() => console.log("mainDb synced"))
    .catch((e) => console.error("mainDb sync failed:", e));

  // Logs DB
  logsDb.authenticate()
    .then(() => logsDb.sync())
    .then(() => console.log("logsDb synced"))
    .catch((e) => console.error("logsDb sync failed:", e));

  // Start schedulers (safe to start after server is up)
  try { startArticleScheduler(); } catch (e) { console.error("Article scheduler start failed:", e); }
  try { startAppointmentNoShowScheduler(); } catch (e) { console.error("Appointment no-show scheduler start failed:", e); }
})();


export { io };
