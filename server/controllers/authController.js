import { User, UserSession } from "../models/authModels.js";
import bcrypt from "bcryptjs";
import sessionStore from "../configs/sessionStore.js";

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

    // Step 1: Destroy any existing online session
    const existingSession = await UserSession.findOne({
      where: {
        userId: user.id,
        isOnline: true,
      },
      order: [['loginAt', 'DESC']],
    });

    if (existingSession) {
      await sessionStore.destroy(existingSession.sessionId);
      await existingSession.update({
        isOnline: false,
        logoutAt: new Date(),
      });
    }

    // Step 2: Regenerate the session to prevent session fixation
    req.session.regenerate(async (err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Session error" });
      }

      // Step 3: Assign session data
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

      // Step 4: Save session tracking
      await UserSession.create({
        userId: user.id,
        sessionId: req.session.id,
        loginAt: new Date(),
        isOnline: true,
      });

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
    if (!req.session.userId) {
      return res.status(400).json({ message: "No user session" });
    }

    await UserSession.update(
      { logoutAt: new Date(), isOnline: false },
      { where: { sessionId: req.session.id } }
    );

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
