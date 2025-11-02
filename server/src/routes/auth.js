// server/src/routes/auth.js
import express from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

import { requireAuth, requireRole } from "../middlewares/authMiddlewares.js";
import { login, logout, getCurrentUser, validateToken } from "../controllers/authController.js";
import { getFlags, getFlagsForAdmin, setFlag, setMaintenanceMode } from "../controllers/routerFlagController.js";
import { displayUsers, displayUser } from "../controllers/userControllers.js";
import {
  sendInvitation,
  completeRegistration,
  resendInvitation,
  revokeInvitation,
  getPendingInvitations,
  forgotPassword,
  validateResetToken,
  resetPassword,
} from "../controllers/invitiationController.js";
import { fetchLogs, fetchLog } from "../controllers/logController.js";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAppointmentStats,
  getAttendanceData,
  getVisitorRecords,
  getAttendanceDetail,
  getVisitorRecordDetail,
  sendEmailNotification,
  uploadAppointmentFiles,
} from "../controllers/appointmentController.js";
import { createSchedule, getAllSchedules, updateScheduleStatus, deleteSchedule, getScheduleById } from "../controllers/scheduleController.js";
import { createArticle, getAllArticles, getPublicArticles, getPublicArticle, uploadContentImages, updateArticle, getArticleById } from "../controllers/articleController.js";
import { postEvents, getArticleStats, getNextSuggestions } from "../controllers/EngagementController.js";
import { trackPageView, getWebsiteTrafficStats, getAnalyticsSummary } from "../controllers/WebsiteAnalyticsController.js";

import {
  createContribution,
  getAllContributions,
  getContributionById,
  updateContributionStatus,
  getContributionStats,
  uploadContributionFiles,
  getDonorRecords,
  getContributionsSummary,
  getContract,
  setContract,
  updateTimelineStep,
  openContributionSessionByToken,
  sendContributionSessionOtp,
  verifyContributionSessionOtp,
  closeContributionSession,
  completeContributionSession,
} from "../controllers/contributionController.js";

import {
  getArtifactMetadataByContribution,
  upsertArtifactMetadataDraft,
  completeArtifactMetadata,
  previewCatalogRecord,
  listPublicCatalogArtifacts,
} from "../controllers/artifactMetadataController.js";



import { createMaintenanceReport, getLatestMaintenanceReportByContribution, getAllMaintenanceReportsByContribution } from "../controllers/maintenanceReportController.js";
import { startMaintenanceSession, getOpenMaintenanceSession, completeMaintenanceSession } from "../controllers/maintenanceSessionController.js";

import { forcePrivateCategory } from "../middlewares/forcePrivateCategory.js";
import ConversationController from "../controllers/conversationController.js";
import { upload, multerErrorHandler } from "../middlewares/multerMiddleware.js";
import { SummarizerManager } from "node-summarizer";

// ✅ inventory controller
import { getInventoryList, exportInventoryExcel } from "../controllers/inventoryController.js";
import { updateArtifactLocation } from "../controllers/artifactController.js";


const router = express.Router();

const clientIp = (req) => req.headers["cf-connecting-ip"] || req.headers["x-real-ip"] || req.ip;
const IPV6_SUBNET = Number(process.env.IPV6_SUBNET || 64);

const makeLimiter = (opts) =>
  rateLimit({
    windowMs: opts.windowMs,
    limit: opts.max,
    keyGenerator: (req) => ipKeyGenerator(clientIp(req), IPV6_SUBNET),
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });

const openLimiter = makeLimiter({ windowMs: 60 * 1000, max: 60 });
const otpSendLimiter = makeLimiter({ windowMs: 10 * 60 * 1000, max: 5 });
const otpVerifyLimiter = makeLimiter({ windowMs: 60 * 1000, max: 30 });

// ---- Auth ----
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getCurrentUser);

// ---- Flags ----
router.get("/router-flags", getFlags);
router.get("/admin-flags", requireAuth, requireRole([1]), getFlagsForAdmin);
router.post("/router-flags/maintenance", requireAuth, requireRole([1]), setMaintenanceMode);
router.post("/router-flags", requireAuth, requireRole([1]), setFlag);

// ---- Invitations ----
router.post("/send-invitation", requireAuth, sendInvitation);
router.post("/invitations", sendInvitation);
router.post("/request-reset", forgotPassword);
router.get("/validate-reset-token/:token", validateResetToken);
router.post("/reset-password/:token", resetPassword);

// ---- Tokens ----
router.get("/validate-token/:token", validateToken);
router.post("/complete-registration/:token", completeRegistration);
router.get("/invitations", requireAuth, getPendingInvitations);
router.post("/invitation/:id/resend", resendInvitation);
router.delete("/invitation/:id/revoke", revokeInvitation);

// ---- Users/Logs ----
router.get("/users", requireAuth, requireRole([1]), displayUsers);
router.get("/user/:fullName", requireAuth, requireRole([1]), displayUser);
router.get("/logs", requireAuth, requireRole([1]), fetchLogs);
router.get("/logs/:logId", requireAuth, requireRole([1]), fetchLog);

// ---- Appointments ----
router.post("/appointment", createAppointment);
router.post("/appointment/files", upload.array("files", 10), multerErrorHandler, uploadAppointmentFiles);
router.get("/appointment", getAllAppointments);
router.get("/appointment/stats", requireAuth, getAppointmentStats);
router.get("/appointment/:id", requireAuth, getAppointmentById);
router.patch("/appointment/:id/status", requireAuth, updateAppointmentStatus);
router.get("/attendance", requireAuth, getAttendanceData);
router.get("/visitor-records", requireAuth, getVisitorRecords);
router.get("/attendance/:id", requireAuth, getAttendanceDetail);
router.get("/visitor-record/:visitorId/:appointmentId", requireAuth, getVisitorRecordDetail);
router.post("/send-email-notification", requireAuth, sendEmailNotification);

// ---- Schedules ----
router.post("/schedules", requireAuth, createSchedule);
router.get("/schedules", requireAuth, getAllSchedules);
router.get("/schedules/public/availability", getAllSchedules);
router.get("/schedules/:id", requireAuth, getScheduleById);
router.patch("/schedules/:id/status", requireAuth, updateScheduleStatus);
router.delete("/schedules/:id", requireAuth, deleteSchedule);

// ---- Articles ----
router.get("/articles", requireAuth, getAllArticles);
router.post("/article", upload.single("thumbnail"), multerErrorHandler, createArticle);
router.post("/article/content-images", upload.array("contentImages", 10), multerErrorHandler, uploadContentImages);
router.get("/public-articles", getPublicArticles);
router.get("/public-article/:id", getPublicArticle);
router.get("/articles/:id", requireAuth, getArticleById);
router.put("/article/:id", upload.single("thumbnail"), multerErrorHandler, updateArticle);

// ---- Summarizer (sample) ----
router.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") return res.status(400).json({ error: "No text provided" });
    const summarizer = new SummarizerManager(text, 3);
    const summaryObject = await summarizer.getSummaryByRank();
    res.json({ summary: summaryObject.summary });
  } catch (err) {
    res.status(500).json({ error: "Summarization failed" });
  }
});

// ---- Engagement ----
router.post("/events", postEvents);
router.get("/article/:id", getArticleStats);
router.get("/suggest/next", getNextSuggestions);

// ---- Website Analytics ----
router.post("/analytics/track", trackPageView);
router.get("/analytics/website-traffic", requireAuth, getWebsiteTrafficStats);
router.get("/analytics/summary", requireAuth, getAnalyticsSummary);

// ---- Conversations ----
router.get("/conversations/by-contribution/:contributionId", ConversationController.getOrCreateConversation);
router.get("/conversations/:id/messages", ConversationController.getMessages);
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || typeof text !== "string") return res.status(400).json({ error: "Message text is required" });
    const saved = await ConversationController.createMessage({
      conversationId: id,
      senderUserId: req.user?.id || null,
      senderGuestId: req.session?.guest_identity?.guest_id || null,
      text,
    });
    res.json(saved);
  } catch (err) {
    console.error("[Route] /conversations/:id/messages error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ---- Contributions ----
router.put("/update-step", updateTimelineStep);
router.get("/contract/:contractId", getContract);
router.post("/set-contract", requireAuth, setContract);
router.post("/contributions/session/close", closeContributionSession);
router.post("/contributions/:id/complete-session", requireAuth, completeContributionSession);

router.get("/contributions/session/open/:token", openLimiter, openContributionSessionByToken);
router.get("/contributions/session/open", openLimiter, openContributionSessionByToken);
router.post("/contributions/session/:sessionId/otp", otpSendLimiter, sendContributionSessionOtp);
router.post("/contributions/session/:sessionId/otp/verify", otpVerifyLimiter, verifyContributionSessionOtp);

router.post("/contribution", createContribution);
router.get("/contributions/summary", requireAuth, requireRole([1, 2, 5]), getContributionsSummary);
router.get("/contributions/donors", requireAuth, requireRole([1, 2, 5]), getDonorRecords);
router.post("/contribution/files", upload.array("files", 20), multerErrorHandler, uploadContributionFiles);
router.get("/contributions", requireAuth, requireRole([1, 2, 5]), getAllContributions);
router.get("/contributions/stats", requireAuth, requireRole([1, 2, 5]), getContributionStats);
router.get("/contributions/:id", requireAuth, requireRole([1, 2, 5]), getContributionById);
router.patch("/contributions/:id/status", requireAuth, requireRole([1, 2, 5]), updateContributionStatus);

// ---- Artifact Metadata ----
router.get("/contributions/:id/metadata", requireAuth, requireRole([1, 2, 5]), getArtifactMetadataByContribution);
router.post("/contributions/:id/metadata", requireAuth, requireRole([1, 2, 5]), upsertArtifactMetadataDraft);
router.post("/contributions/:id/metadata/complete", requireAuth, requireRole([1]), completeArtifactMetadata);

// Public preview (completed only)
router.get("/catalog/preview/:id", openLimiter, previewCatalogRecord);
router.get("/public-artifacts", listPublicCatalogArtifacts);

// Inventory route
router.get("/inventory", async (req, res, next) => {
  const nowIso = new Date().toISOString();
  console.log(`[Route] HIT GET /api/auth/inventory @ ${nowIso}`);
  try {
    await getInventoryList(req, res);
  } catch (e) {
    console.error("[Route] /api/auth/inventory error:", e?.message);
    next(e);
  }
});
router.get("/auth/inventory", getInventoryList);

// ✅ NEW: Inventory Excel Export
// GET /api/auth/inventory/export?q=...&date=YYYY-MM-DD&tab=artifacts|acquired|borrowing&onlyDisplayed=1
// Add guards if you want this limited to admins:
// router.get("/inventory/export", requireAuth, requireRole([1,2,5]), exportInventoryExcel);
router.get("/inventory/export", exportInventoryExcel);

// ---- Maintenance ----
router.post("/contributions/:id/maintenance/start", requireAuth, requireRole([1, 2, 5]), startMaintenanceSession);
router.get("/contributions/:id/maintenance/open", requireAuth, requireRole([1, 2, 5]), getOpenMaintenanceSession);
router.post(
  "/contributions/:id/maintenance/complete",
  requireAuth,
  requireRole([1, 2, 5]),
  upload.fields([
    { name: "imgBefore", maxCount: 10 },
    { name: "imgAfter", maxCount: 10 },
  ]),
  multerErrorHandler,
  completeMaintenanceSession
);

// Back-compat if a client still calls /api/inventory directly
router.get("/../inventory", (req, res, next) => next());

router.post(
  "/contributions/:id/maintenance/report",
  requireAuth,
  requireRole([1, 2, 5]),
  forcePrivateCategory,
  upload.fields([
    { name: "imgBefore", maxCount: 10 },
    { name: "imgAfter", maxCount: 10 },
  ]),
  multerErrorHandler,
  createMaintenanceReport
);

router.get("/contributions/:id/maintenance/latest", requireAuth, requireRole([1, 2, 5]), getLatestMaintenanceReportByContribution);
router.get("/contributions/:id/maintenance/reports", requireAuth, requireRole([1, 2, 5]), getAllMaintenanceReportsByContribution);

// Update artifact location
router.patch("/contributions/:id/location", requireAuth, requireRole([1, 2, 5]), async (req, res) => {
  const { id } = req.params;
  const { location } = req.body;

  if (!location || !location.trim()) {
    return res.status(400).json({ message: "Location is required" });
  }

  try {
    const { CatalogArtifact } = await import("../models/CatalogArtifact.js");
    const [affectedRows] = await CatalogArtifact.update({ current_location: location.trim() }, { where: { contribution_id: parseInt(id) } });

    if (affectedRows === 0) {
      return res.status(404).json({ message: "Artifact not found" });
    }

    res.json({ message: "Location updated successfully", location: location.trim() });
  } catch (error) {
    console.error("[Update Location] error:", error);
    res.status(500).json({ message: "Failed to update location", error: error.message });
  }
});

router.put("/artifact/:contributionId/location", 
    // Assuming you have a middleware for authentication
    // authMiddleware, 
    updateArtifactLocation
);

export default router;
