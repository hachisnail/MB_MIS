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

    // Step 1: Find the latest active session
    const existingSession = await UserSession.findOne({
      where: {
        userId: user.id,
        isOnline: true,
      },
      order: [['loginAt', 'DESC']],
    });

    // Step 2: If found, destroy that session and update it as logged out
    if (existingSession) {
      await sessionStore.destroy(existingSession.sessionId); // removes from DB
      await existingSession.update({
        isOnline: false,
        logoutAt: new Date(),
      });
    }

    // Step 3: Create new session
    req.session.userId = user.id;

    await UserSession.create({
      userId: user.id,
      sessionId: req.session.id,
      loginAt: new Date(),
      isOnline: true,
    });

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        roleId: user.roleId,
        position: user.position,
      },
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
