import express from "express";
import { requireAuth,requireRole } from "../middlewares/authMiddlewares.js";
import {login, logout, getCurrentUser} from '../controllers/authController.js'
import { getFlags, setFlag } from '../controllers/routerFlagController.js';
import {displayUsers} from "../controllers/userControllers.js"

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getCurrentUser);

router.get('/router-flags', getFlags);
router.post('/router-flags',requireAuth, setFlag);


// user routes
router.get("/user", displayUsers);


export default router;
