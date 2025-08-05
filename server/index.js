// server.js or index.js
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

// Load .env config
dotenv.config();

// Path utilities
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_BASE_DIR = path.join(process.cwd(), "..", "uploads");

// Create uploads directory if not exists
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

// Init Express app
const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Trust proxy is important if behind a reverse proxy (Coolify, NGINX, etc.)
app.set("trust proxy", 1);

// Ensure CORS allows credentials
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // Essential for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,      // 1 day
    httpOnly: true,
    secure: isProduction,             // only HTTPS in production
    sameSite: isProduction ? "none" : "lax",
  },
}));

// Static route for uploaded files
app.use("/uploads", express.static(UPLOAD_BASE_DIR));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Fallback for invalid routes (except /api and /uploads)
app.use((req, res, next) => {
  if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
    return res.status(404).json({ error: "Not Found" });
  }
  next();
});

// Create and run HTTP server
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
      console.log("NODE_ENV =", process.env.NODE_ENV);
      console.log("Cookies use:", isProduction ? "Secure & SameSite=None" : "Lax & Insecure");
    });
  } catch (err) {
    console.error("Unable to connect to DB:", err);
  }
})();

// Export for socket use
export { io };
