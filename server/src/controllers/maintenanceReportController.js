// src/controllers/maintenanceReportController.js
import { MaintenanceReports } from "../models/MaintenanceReports.js";

export const createMaintenanceReport = async (req, res) => {
  try {
    const contributionId = Number(req.params.id);
    if (!contributionId) return res.status(400).json({ message: "Invalid contribution id." });

    const toNames = (arr = []) => arr.map((f) => f.filename);
    const img_before = toNames(req.files?.imgBefore || []);
    const img_after  = toNames(req.files?.imgAfter  || []);

    const {
      person_responsible = "",
      action_taken = "",
      date_start = "",
      date_end = "",
      storage = "",
      responsible_personnel = "",
      initial_condition = "",
      damages = "",
      environment = "",
      preventive = "",
      remarks = "",
      dimensions = "[]",
    } = req.body || {};

    // basic validation (same as before)...

    const dims = Array.isArray(JSON.parse(dimensions || "[]")) ? JSON.parse(dimensions) : [];

    const saved = await MaintenanceReports.create({
      contribution_id: contributionId,
      person_responsible,
      action_taken,
      // DB columns are DATE -> model uses DATEONLY, so send YYYY-MM-DD
      date_start,
      date_end,
      dimensions: dims,
      storage,
      responsible_personnel,
      initial_condition,
      damages,
      environment,
      preventive,
      remarks,
      img_before,
      img_after,
    });

    return res.json({
      id: saved.id,
      message: "Maintenance report created.",
      imgBefore: img_before,
      imgAfter: img_after,
    });
  } catch (err) {
    console.error("[createMaintenanceReport] error:", err);
    return res.status(500).json({ message: "Failed to create maintenance report." });
  }
};

export const getLatestMaintenanceReportByContribution = async (req, res) => {
  try {
    const contributionId = Number(req.params.id);
    if (!contributionId) return res.status(400).json({ message: "Invalid contribution id." });

    const latest = await MaintenanceReports.findOne({
      where: { contribution_id: contributionId },
      order: [["date_start", "DESC"], ["id", "DESC"]], // <- use id, not maintenance_id
    });

    return res.json(latest || null);
  } catch (err) {
    console.error("[getLatestMaintenanceReportByContribution] error:", err);
    return res.status(500).json({ message: "Failed to fetch report." });
  }
};

// NEW: Get all maintenance reports for a contribution
export const getAllMaintenanceReportsByContribution = async (req, res) => {
  try {
    const contributionId = Number(req.params.id);
    if (!contributionId) return res.status(400).json({ message: "Invalid contribution id." });

    const reports = await MaintenanceReports.findAll({
      where: { contribution_id: contributionId },
      order: [["date_start", "DESC"], ["id", "DESC"]],
    });

    return res.json(reports || []);
  } catch (err) {
    console.error("[getAllMaintenanceReportsByContribution] error:", err);
    return res.status(500).json({ message: "Failed to fetch maintenance reports." });
  }
};
