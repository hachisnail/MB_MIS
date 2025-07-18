import express from "express";
import { requireAuth,requireRole } from "../middlewares/authMiddlewares.js";
import {login, logout, getCurrentUser, validateToken} from '../controllers/authController.js'
import { getFlags, setFlag, setMaintenanceMode } from '../controllers/routerFlagController.js';
import {displayUsers, displayUser} from "../controllers/userControllers.js"
import { sendInvitation, completeRegistration, resendInvitation, revokeInvitation, getPendingInvitations, forgotPassword ,validateResetToken, resetPassword } from "../controllers/invitiationController.js";
import { fetchLogs, fetchLog } from "../controllers/logController.js";

import { upload, multerErrorHandler } from '../middlewares/multerMiddleware.js';

import {
  createArticle,
  getAllArticles,
  getPublicArticles,
  getPublicArticle,
  uploadContentImages,
  updateArticle,
  getArticleById
} from '../controllers/articleController.js';
import multer from 'multer';

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);

router.post("/request-reset", forgotPassword);
router.get("/validate-reset-token/:token", validateResetToken);
router.post("/reset-password/:token", resetPassword);


router.get("/me", getCurrentUser);


router.get('/router-flags', getFlags);
router.post("/router-flags/maintenance",requireAuth,requireRole([1]), setMaintenanceMode);
router.post('/router-flags',requireAuth,requireRole([1]), setFlag);


router.post('/send-invitation', requireAuth, requireRole([1]), sendInvitation)
router.post('/invitations', requireRole([1]), sendInvitation);


router.get('/validate-token/:token', validateToken);
router.post('/complete-registration/:token', completeRegistration);
router.get('/invitations', requireAuth, requireRole([1]), getPendingInvitations);
router.post('/invitation/:id/resend', requireRole([1]), resendInvitation);
router.delete('/invitation/:id/revoke', requireRole([1]), revokeInvitation);



// user routes
router.get("/users",requireAuth, requireRole([1]),  displayUsers);
router.get("/user/:fullName", requireAuth, requireRole([1]), displayUser);

//log routes
router.get("/logs", requireAuth, requireRole([1]), fetchLogs);
router.get("/logs/:logId", requireAuth, requireRole([1]), fetchLog);



// Articles
router.get('/articles', requireAuth, getAllArticles);
router.post('/article', upload.single('thumbnail'), multerErrorHandler, createArticle);
router.post('/article/content-images', upload.array('contentImages', 10), multerErrorHandler, uploadContentImages);
router.get('/public-articles', getPublicArticles);
router.get('/public-article/:id', getPublicArticle);
router.get('/articles/:id', requireAuth, getArticleById);
router.put('/article/:id', upload.single('thumbnail'), multerErrorHandler, updateArticle);

export default router;
