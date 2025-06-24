import { Log } from "../models/logModel.js";
import { User } from "../models/authModels.js";

export const fetchLogs = async (req, res, next) => {
  try {
    // Step 1: Fetch logs
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      raw: true, // Flatten output
    });

    // Step 2: Extract unique userIds from logs
    const userIds = [...new Set(logs.map(log => log.userId))];

    // Step 3: Fetch users from mainDb
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'fname', 'lname', 'email', 'position'],
      raw: true,
    });

    // Step 4: Map user info into logs
    const userMap = Object.fromEntries(users.map(user => [user.id, user]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      user: userMap[log.userId] || null,
    }));

    res.json(enrichedLogs);
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};
