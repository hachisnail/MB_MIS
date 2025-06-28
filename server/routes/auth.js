import express from "express";
import { requireAuth,requireRole } from "../middlewares/authMiddlewares.js";
import {login, logout, getCurrentUser, validateToken} from '../controllers/authController.js'
import { getFlags, setFlag } from '../controllers/routerFlagController.js';
import {displayUsers, displayUser} from "../controllers/userControllers.js"
import { sendInvitation, completeRegistration, resendInvitation, revokeInvitation, getPendingInvitations } from "../controllers/invitiationController.js";
import { fetchLogs, fetchLog } from "../controllers/logController.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getCurrentUser);

router.get('/router-flags', getFlags);
router.post('/router-flags',requireAuth, setFlag);

router.post('/send-invitation', requireAuth, sendInvitation)
router.post('/invitations', sendInvitation);


router.get('/validate-token/:token', validateToken);
router.post('/complete-registration/:token', completeRegistration);
router.get('/invitations', requireAuth, getPendingInvitations);
router.post('/invitation/:id/resend', resendInvitation);
router.delete('/invitation/:id/revoke', revokeInvitation);



// user routes
router.get("/users",requireAuth, displayUsers);
router.get("/user/:fullName", requireAuth , displayUser);

router.get("/logs",requireAuth, fetchLogs);
router.get("/logs/:logId", requireAuth , fetchLog);



export default router;
