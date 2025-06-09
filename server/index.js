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

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

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

// Static file serving
app.use("/uploads", express.static(UPLOAD_BASE_DIR));
app.use("/assets", express.static(path.join(UPLOAD_BASE_DIR, "assets")));

// API routes
app.use("/api", uploadRoutes);
app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const io = initializeSocket(server, process.env.CLIENT_URL);

const PORT = process.env.PORT;

(async () => {
  try {
    await mainDb.authenticate();
    await sessionStore.sync();
    await mainDb.sync({force: true});
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Unable to connect to DB:", err);
  }
})();

export { io };
