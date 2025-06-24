import { Log } from "../models/logModel.js";
import { User } from "../models/authModels.js";

export const fetchLogs = async (req, res, next) => {
  try {
    const logs = await Log.findAll({
      include: {
        model: User,
        attributes: ['id', 'username', 'fname', 'lname', 'email', 'position'],
      },
      order: [['createdAt', 'DESC']],
    });

    res.json(logs);
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};
