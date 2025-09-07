import { mainDb, User, UserSession } from "../models/authModels.js";
import bcrypt from "bcryptjs";
import sessionStore from "../configs/sessionStore.js";
import { Invitation } from "../models/invitationModels.js";
import { createLog } from "../services/logService.js";
import { getIO } from "../configs/socketServer.js";
import { Op } from "sequelize";

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const user = await User.findOne({
      where: { [Op.or]: [{ username }, { email: username }] },
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    // 🛡 Prevent logging in as a different user within the same session
    if (req.session.userId && req.session.userId !== user.id) {
      return res.status(400).json({ message: "A user is already logged in from this session." });
    }

    // --- single-session: force other browsers out (use x-browser-id to keep this one) ---
    const io = getIO();
    const currentBrowserId = req.headers["x-browser-id"] || null;

    // (Optional) If you keep a sessions table, you can still mark older ones offline:
    const existingSession = await UserSession.findOne({
      where: { userId: user.id, isOnline: true },
      order: [["loginAt", "DESC"]],
    });

    if (existingSession) {
      // Destroy the *old* express-session on the server (good hygiene)
      sessionStore.destroy(existingSession.sessionId, (err) => {
        if (err) {
          console.warn(`Failed to destroy old session [${existingSession.sessionId}]:`, err);
        }
      });

      // Downgrade all other sockets for this user to GUEST immediately
      // (keeps this browser via exceptBrowserId)
      io.forceLogoutUser?.(user.id, {
        exceptBrowserId: currentBrowserId,
        reason: "You signed in on another device.",
      });

      await UserSession.update(
        { isOnline: false, logoutAt: new Date() },
        { where: { id: existingSession.id }, individualHooks: true }
      );

      // Provide a friendly frontend message
      req.session.forceLogoutMessage = "Another session was logged out to allow this login.";
    }

    // Create a fresh session for this login
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      roleId: user.roleId,
      position: user.position,
    };

    await UserSession.create({
      userId: user.id,
      sessionId: req.session.id,
      loginAt: new Date(),
      isOnline: true,
    });

    // log audit
    const fullName = `${user.fname} ${user.lname}`;
    await createLog(
      "login",
      "User",
      `${fullName} (${user.username}) logged in`,
      user.id,
      { isOnline: false },
      { isOnline: true },
      `IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`
    );

    return res.json({
      message: req.session.forceLogoutMessage || "Login successful",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function logout(req, res) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ message: "No user session" });
    }

    const user = await User.findByPk(userId);
    await UserSession.update(
      { logoutAt: new Date(), isOnline: false },
      { where: { sessionId: req.session.id }, individualHooks: true }
    );

    await createLog(
      "logout",
      "User",
      `${(user?.fname ?? "Unknown")} ${(user?.lname ?? "")} (${user?.username ?? "Unknown"}) logged out`,
      userId,
      { isOnline: true },
      { isOnline: false },
      `IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`
    );

    // End ONLY this session; other devices stay logged in (typical logout behavior)
    // If you *want* to log out all devices too, you could call:
    // getIO().forceLogoutUser?.(userId, { reason: "You logged out" });

    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCurrentUser(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Please log in." });
  }
  try {
    const user = await User.findByPk(req.session.userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

export const validateToken = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({
      where: {
        token,
        isUsed: false,
        expiresAt: { [mainDb.Sequelize.Op.gt]: new Date() },
      },
    });

    if (!invitation) {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        role: invitation.role,
      },
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
