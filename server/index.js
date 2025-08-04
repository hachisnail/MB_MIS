import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { mainDb } from "./models/authModels.js";
import sessionStore from "./configs/sessionStore.js";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { initializeSocket } from "./configs/socketServer.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_BASE_DIR = path.join(process.cwd(), "..", "uploads");

if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

const app = express();
app.set("trust proxy", 1); // Essential for Heroku, AWS, and other proxy setups

// ✅ Fix: Configure CORS with explicit options for security and credentials
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// This header configuration is now redundant because it's handled by the `cors` middleware
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL);
//   res.header("Access-Control-Allow-Credentials", "true");
//   next();
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Fix: Robust session cookie configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    // Explicitly set `secure: true` and `sameSite: 'none'` for production
    // This is the most likely cause of your issue.
    // Cookies with SameSite=None must be secure.
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
}));

// Serve uploaded files
app.use("/uploads", express.static(UPLOAD_BASE_DIR));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Catch-all for invalid paths
app.use((req, res, next) => {
  if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
    return res.status(404).json({ error: "Not Found" });
  }
  next();
});

const server = http.createServer(app);
const io = initializeSocket(server, process.env.CLIENT_URL);
const PORT = process.env.PORT || 5050;

(async () => {
  try {
    await mainDb.authenticate();
    await sessionStore.sync();
    await mainDb.sync();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`API Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Unable to connect to DB:", err);
  }
})();

export { io };