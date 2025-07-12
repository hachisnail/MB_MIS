import express from "express";
import { requireAuth,requireRole } from "../middlewares/authMiddlewares.js";
import {login, logout, getCurrentUser, validateToken} from '../controllers/authController.js'
import { getFlags, setFlag, setMaintenanceMode } from '../controllers/routerFlagController.js';
import {displayUsers, displayUser} from "../controllers/userControllers.js"
import { sendInvitation, completeRegistration, resendInvitation, revokeInvitation, getPendingInvitations, forgotPassword ,validateResetToken, resetPassword } from "../controllers/invitiationController.js";
import { fetchLogs, fetchLog } from "../controllers/logController.js";

import { upload } from '../middlewares/multerMiddleware.js';

import {
  createArticle,
  getAllArticles,
  getPublicArticles,
  getPublicArticle,
  uploadContentImages,
  updateArticle
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
router.post('/article', (req, res, next) => {
  if (!req.body) req.body = {}; // <-- Add this line
  req.body.category = "pictures";
  upload.single('thumbnail')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Max size is 5MB.' });
      }
      return res.status(500).json({ message: 'Multer error.', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'Unexpected error.', error: err.message });
    }
    next();
  });
}, createArticle);
router.post('/article/content-images', (req, res, next) => {
  if (!req.body) req.body = {}; // <-- Add this line
  req.body.category = "pictures";
  upload.array('contentImages', 10)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Max size is 5MB.' });
      }
      return res.status(500).json({ message: 'Multer error.', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'Unexpected error.', error: err.message });
    }
    next();
  });
}, uploadContentImages);
router.get('/public-articles', getPublicArticles);
router.get('/public-article/:id', getPublicArticle);

// PUT route for updating an article
router.put('/article/:id', (req, res, next) => {
  upload.single('thumbnail')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Max size is 5MB.' });
      }
      return res.status(500).json({ message: 'Multer error.', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: 'Unexpected error.', error: err.message });
    }
    next();
  });
}, updateArticle);

export default router;
