import express from "express";
import { requireAuth,requireRole } from "../middlewares/authMiddlewares.js";
import {login, logout, getCurrentUser, validateToken} from '../controllers/authController.js'
import { getFlags, getFlagsForAdmin, setFlag, setMaintenanceMode } from '../controllers/routerFlagController.js';
import {displayUsers, displayUser} from "../controllers/userControllers.js"
import { sendInvitation, completeRegistration, resendInvitation, revokeInvitation, getPendingInvitations, forgotPassword, validateResetToken, resetPassword } from "../controllers/invitiationController.js";
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
  uploadAppointmentFiles
} from '../controllers/appointmentController.js';
import {
  createSchedule,
  getAllSchedules,
  updateScheduleStatus,
  deleteSchedule,
  getScheduleById
} from '../controllers/scheduleController.js';

import {
  createArticle,
  getAllArticles,
  getPublicArticles,
  getPublicArticle,
  uploadContentImages,
  updateArticle,
  getArticleById
} from '../controllers/articleController.js';

import { postEvents, getArticleStats, getNextSuggestions } from "../controllers/EngagementController.js";


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
  getContributionSession
} from '../controllers/contributionController.js';

import { upload, multerErrorHandler } from '../middlewares/multerMiddleware.js';
import { SummarizerManager } from "node-summarizer";


const router = express.Router();




router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getCurrentUser);

router.get('/router-flags', getFlags);
router.get('/admin-flags',requireAuth,requireRole([1]),getFlagsForAdmin);
router.post("/router-flags/maintenance",requireAuth,requireRole([1]), setMaintenanceMode);
router.post('/router-flags',requireAuth,requireRole([1]), setFlag);

router.post('/send-invitation', requireAuth, sendInvitation);
router.post('/invitations', sendInvitation);
router.post("/request-reset", forgotPassword);
router.get("/validate-reset-token/:token", validateResetToken);
router.post("/reset-password/:token", resetPassword);



router.get('/validate-token/:token', validateToken);
router.post('/complete-registration/:token', completeRegistration);
router.get('/invitations', requireAuth, getPendingInvitations);
router.post('/invitation/:id/resend', resendInvitation);
router.delete('/invitation/:id/revoke', revokeInvitation);



// user routes
router.get("/users",requireAuth, requireRole([1]),  displayUsers);
router.get("/user/:fullName", requireAuth, requireRole([1]), displayUser);

//log routes
router.get("/logs", requireAuth, requireRole([1]), fetchLogs);
router.get("/logs/:logId", requireAuth, requireRole([1]), fetchLog);

// Appointment routes
router.post('/appointment', createAppointment);
router.post('/appointment/files', upload.array('files', 10), multerErrorHandler, uploadAppointmentFiles); // File upload endpoint
router.get('/appointment', getAllAppointments);
router.get('/appointment/stats', requireAuth, getAppointmentStats);  // Move this BEFORE :id route
router.get('/appointment/:id', requireAuth, getAppointmentById);
router.patch('/appointment/:id/status', requireAuth, updateAppointmentStatus);
router.get('/attendance', requireAuth, getAttendanceData);
router.get('/visitor-records', requireAuth, getVisitorRecords);
router.get('/attendance/:id', requireAuth, getAttendanceDetail);
router.get('/visitor-record/:visitorId/:appointmentId', requireAuth, getVisitorRecordDetail);
router.post('/send-email-notification', requireAuth, sendEmailNotification);

// Schedule routes
router.post('/schedules', requireAuth, createSchedule);
router.get('/schedules', requireAuth, getAllSchedules);
router.get('/schedules/public/availability', getAllSchedules); // Public endpoint for appointment form
router.get('/schedules/:id', requireAuth, getScheduleById);
router.patch('/schedules/:id/status', requireAuth, updateScheduleStatus);
router.delete('/schedules/:id', requireAuth, deleteSchedule);

// Articles
router.get('/articles', requireAuth, getAllArticles);
router.post('/article', upload.single('thumbnail'), multerErrorHandler, createArticle);
router.post('/article/content-images', upload.array('contentImages', 10), multerErrorHandler, uploadContentImages);
router.get('/public-articles', getPublicArticles);
router.get('/public-article/:id', getPublicArticle);
router.get('/articles/:id', requireAuth, getArticleById);
router.put('/article/:id', upload.single('thumbnail'), multerErrorHandler, updateArticle);
router.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "No text provided" });
    }
    const summarizer = new SummarizerManager(text, 3); // 3 sentences
    const summaryObject = await summarizer.getSummaryByRank();
    res.json({ summary: summaryObject.summary });
  } catch (err) {
    res.status(500).json({ error: "Summarization failed" });
  }
});
//Article Engagement
router.post("/events", postEvents);
router.get("/article/:id", getArticleStats);
router.get("/suggest/next", getNextSuggestions);

// Contributions
router.put("/update-step",requireAuth, updateTimelineStep);
router.get("/contract/:contractId", getContract);
router.post("/set-contract", requireAuth, setContract);

router.get("/contributions/session/:uuid", getContributionSession);

router.post('/contribution', createContribution); 
router.get("/contributions/summary", requireAuth, requireRole([1, 2, 5]), getContributionsSummary);
router.get("/contributions/donors", requireAuth, requireRole([1, 2, 5]), getDonorRecords);
router.post('/contribution/files', upload.array('files', 20), multerErrorHandler, uploadContributionFiles); // File upload endpoint
router.get('/contributions', requireAuth, requireRole([1, 2, 5]), getAllContributions); // Admin only
router.get('/contributions/stats', requireAuth, requireRole([1, 2, 5]), getContributionStats); // Admin only
router.get('/contributions/:id', requireAuth, requireRole([1, 2, 5]), getContributionById); // Admin only
router.patch('/contributions/:id/status', requireAuth, requireRole([1, 2, 5]), updateContributionStatus); // Admin only

export default router;
