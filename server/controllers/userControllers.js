import { Op } from "sequelize";
import { User, UserSession } from "../models/authModels.js";

export const displayUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { id: { [Op.ne]: 1 } },
      attributes: ["id", "fname", "lname", "email", "contact", "roleId", "username"],
    });

    const userIds = users.map(user => user.id);

    const sessions = await UserSession.findAll({
      where: {
        userId: {
          [Op.in]: userIds.map(id => Number(id)),
        },
      },
      attributes: ["id", "userId", "loginAt", "logoutAt", "isOnline"],
    });

    const sessionsByUser = {};
    for (const session of sessions) {
      const uid = session.userId;
      if (!sessionsByUser[uid]) sessionsByUser[uid] = [];
      sessionsByUser[uid].push(session.toJSON());
    }

    const enrichedUsers = users.map(user => ({
      ...user.toJSON(),
      sessions: sessionsByUser[user.id] || [], 
    }));

    res.json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching users with sessions:", error);
    res.status(500).json({ message: "Error fetching users with sessions" });
  }
};


export const displayUser = async (req, res) => {
  const fullName = decodeURIComponent(req.params.fullName);
  const [fname, ...rest] = fullName.trim().split(" ");
  const lname = rest.join(" ");

  try {
    const users = await User.findAll({
      where: {
        fname,
        lname,
        id: { [Op.ne]: 1 },
      },
      attributes: ["id", "username", "fname", "lname", "email", "contact", "position", "roleId"],
      raw: true,
    });

    if (!users.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const userIds = users.map(user => user.id);

    const sessions = await UserSession.findAll({
      where: { userId: userIds },
      attributes: ["id", "userId", "loginAt", "logoutAt", "isOnline"],
      raw: true,
    });

    const sessionsByUser = {};
    for (const session of sessions) {
      if (!sessionsByUser[session.userId]) sessionsByUser[session.userId] = [];
      sessionsByUser[session.userId].push(session);
    }

    const enrichedUsers = users.map(user => ({
      ...user,
      sessions: sessionsByUser[user.id] || [], // ✅ match frontend key
    }));

    res.json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching user with sessions:", error);
    res.status(500).json({ message: "Error fetching user with sessions" });
  }
};
