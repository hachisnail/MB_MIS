import { mainDb, User, UserSession } from "../models/authModels.js";
import bcrypt from "bcryptjs";
import sessionStore from "../configs/sessionStore.js";
import { Invitation } from "../models/invitationModels.js";
import { createLog } from "../services/logService.js";

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    const beforeState = { isOnline: false };

    const existingSession = await UserSession.findOne({
      where: { userId: user.id, isOnline: true },
      order: [['loginAt', 'DESC']],
    });

    if (existingSession) {
      await sessionStore.destroy(existingSession.sessionId);
      await existingSession.update({ isOnline: false, logoutAt: new Date() });
    }

    req.session.regenerate(async (err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Session error" });
      }

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

      // Descriptive log
      const fullName = `${user.fname} ${user.lname}`;
      const description = `${fullName} (${user.username}) logged in`;
      const details = `IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`;
      const afterState = { isOnline: true };

      await createLog("login", "User", description, user.id, beforeState, afterState, details);

      return res.json({
        message: "Login successful",
        user: req.session.user,
      });
    });
  } catch (error) {
    console.error(error);
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
    const beforeState = { isOnline: true };
    const afterState = { isOnline: false };

    await UserSession.update(
      { logoutAt: new Date(), isOnline: false },
      {
        where: { sessionId: req.session.id },
        individualHooks: true,
      }
    );

    const fullName = `${user?.fname ?? "Unknown"} ${user?.lname ?? ""}`.trim();
    const username = user?.username ?? "Unknown";
    const description = `${fullName} (${username}) logged out`;
    const details = `IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`;

    await createLog("logout", "User", description, userId, beforeState, afterState, details);

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
