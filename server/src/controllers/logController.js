import { Log } from "../models/logModel.js";
import { User } from "../models/authModels.js";
import { Op } from "sequelize";

export const fetchLogs = async (req, res, next) => {
  try {
    // Supported query params
    // q: search string (across log fields + user fields)
    // action: exact match
    // model: exact match
    // role: user.roleId exact match (number)
    // userId: exact match (number)
    // date: single-day filter (ISO or yyyy-mm-dd)
    // start, end: ISO timestamps for range filter

    const { q, action, model, role, userId, date, start, end } = req.query;

    const where = {};
    if (action) where.action = action;
    if (model) where.model = model;
    if (userId) where.userId = Number(userId);

    // Determine date range
    if (start && end) {
      const startDt = new Date(start);
      const endDt = new Date(end);
      if (!isNaN(startDt) && !isNaN(endDt)) {
        where.createdAt = { [Op.between]: [startDt, endDt] };
      }
    } else if (date) {
      const day = new Date(date);
      if (!isNaN(day)) {
        const from = new Date(day);
        from.setHours(0, 0, 0, 0);
        const to = new Date(day);
        to.setHours(23, 59, 59, 999);
        where.createdAt = { [Op.between]: [from, to] };
      }
    }

    // Fetch logs by DB-filterable fields first
    const logs = await Log.findAll({
      where,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // Short-circuit if none
    if (!logs.length) return res.json([]);

    // Fetch related users and build map
    const userIds = [...new Set(logs.map((l) => l.userId))].filter(Boolean);
    const users = userIds.length
      ? await User.findAll({
          where: { id: userIds },
          attributes: ["id", "username", "fname", "lname", "email", "roleId"],
          raw: true,
        })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Apply role filter and text search in-memory (no cross-DB join)
    const roleNum = role ? Number(role) : null;
    const qNorm = (q || "").toString().trim().toLowerCase();

    const filtered = logs.filter((log) => {
      const user = userMap[log.userId] || null;

      // Role filter
      if (roleNum && (!user || user.roleId !== roleNum)) return false;

      // Text search across relevant fields
      if (qNorm) {
        const parts = [
          user?.fname || "",
          user?.lname || "",
          user?.username || "",
          log.model || "",
          log.action || "",
          log.description || "",
        ];
        const hay = parts.join(" ").toLowerCase();
        if (!hay.includes(qNorm)) return false;
      }

      return true;
    });

    const enriched = filtered.map((log) => ({ ...log, user: userMap[log.userId] || null }));
    res.json(enriched);
  } catch (error) {
    console.error("Failed to fetch logs:", error.stack || error);
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

