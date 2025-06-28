import { Log } from "../models/logModel.js";
import { User } from "../models/authModels.js";

export const fetchLogs = async (req, res, next) => {
  try {
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      raw: true, 
    });

    const userIds = [...new Set(logs.map(log => log.userId))];

    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'fname', 'lname', 'email', 'roleId'],
      raw: true,
    });

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


export const fetchLog = async (req, res, next) => {
  try {
    const raw = decodeURIComponent(req.params.logId);
    const id = parseInt(raw); 

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid log ID" });
    }

    const log = await Log.findOne({
      where: { id },
      raw: true,
    });

    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    const user = await User.findOne({
      where: { id: log.userId },
      attributes: ['id', 'username', 'fname', 'lname', 'email', 'roleId'],
      raw: true,
    });

    const enrichedLog = {
      ...log,
      user: user || null,
    };

    res.json(enrichedLog);
  } catch (error) {
    console.error("Failed to fetch specific log:", error);
    res.status(500).json({ message: "Failed to fetch log" });
  }
};

