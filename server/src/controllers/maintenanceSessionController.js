// server/src/controllers/maintenanceSessionController.js
import { mainDb } from "../configs/databases.js";
import { MaintenanceSessions } from "../models/MaintenanceSessions.js";
import { MaintenanceReports } from "../models/MaintenanceReports.js";
import { Contributions } from "../models/contributionModels.js";
import CatalogArtifact from "../models/CatalogArtifact.js";

/* ---------- helpers ---------- */
const parseArray = (raw, fallback = []) => {
  if (raw == null) return fallback;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};
const fileNames = (arr) => (arr || []).map((f) => f.filename);

/* ---------- Start a maintenance session ---------- */
export async function startMaintenanceSession(req, res) {
  const { id } = req.params; // contribution id
  const userId = req.user?.id || null;

  try {
    // Optional: validate contribution exists
    const exists = await Contributions.findByPk(id, { attributes: ["contribution_id"] });
    if (!exists) return res.status(404).json({ message: "Contribution not found." });

    // Check if already open
    const open = await MaintenanceSessions.findOne({
      where: { contribution_id: id, completed_at: null },
    });
    if (open) {
      return res.status(409).json({ message: "Session already open for this contribution." });
    }

    const session = await MaintenanceSessions.create({
      contribution_id: id,
      started_by: userId,
    });

    return res.status(201).json(session);
  } catch (err) {
    console.error("[startMaintenanceSession] error:", err);
    res.status(500).json({ message: "Failed to start maintenance session." });
  }
}

/* ---------- Get open maintenance session ---------- */
export async function getOpenMaintenanceSession(req, res) {
  const { id } = req.params;

  try {
    const session = await MaintenanceSessions.findOne({
      where: { contribution_id: id, completed_at: null },
    });

    if (!session) return res.status(204).send();
    return res.json(session);
  } catch (err) {
    console.error("[getOpenMaintenanceSession] error:", err);
    res.status(500).json({ message: "Failed to fetch maintenance session." });
  }
}

/* ---------- Complete session (and create report) ---------- */
export async function completeMaintenanceSession(req, res) {
  const { id } = req.params; // contribution id
  const files = req.files || {};
  const body = req.body;

  const t = await mainDb.transaction();
  try {
    // Lock open session so only one completion proceeds
    const session = await MaintenanceSessions.findOne({
      where: { contribution_id: id, completed_at: null },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!session) {
      await t.rollback();
      return res.status(400).json({ message: "No open maintenance session." });
    }

    // Collect uploaded filenames + any existing URLs provided by client
    const imgBeforeUploaded = fileNames(files["imgBefore"]);
    const imgAfterUploaded = fileNames(files["imgAfter"]);
    const imgBeforeUrls = parseArray(body.imgBefore_urls, []); // strings
    const imgAfterUrls = parseArray(body.imgAfter_urls, []);   // strings

    const img_before = [...imgBeforeUrls, ...imgBeforeUploaded];
    const img_after = [...imgAfterUrls, ...imgAfterUploaded];

    // Dimensions: ensure array
    const dimensions = parseArray(body.dimensions, []);

    // Basic required fields including finalLocation
    if (!body.person_responsible || !body.action_taken || !body.date_start || !body.date_end || !body.finalLocation) {
      await t.rollback();
      return res.status(422).json({ message: "Missing required report fields. Final Location is required." });
    }

    // Create report (model will JSON-stringify array fields)
    const report = await MaintenanceReports.create(
      {
        contribution_id: id,
        person_responsible: body.person_responsible,
        action_taken: body.action_taken,
        date_start: body.date_start,
        date_end: body.date_end,
        dimensions, // array
        storage: body.storage || null,
        responsible_personnel: body.responsible_personnel || null,
        initial_condition: body.initial_condition || null,
        damages: body.damages || null,
        environment: body.environment || null,
        img_before, // array
        img_after,  // array
        preventive: body.preventive || null,
        remarks: body.remarks || null,
      },
      { transaction: t }
    );

    // Update artifact location if finalLocation is provided
    if (body.finalLocation && body.finalLocation.trim()) {
      const finalLocation = body.finalLocation.trim();
      
      // Update the catalog_artifacts table with the new location using Sequelize
      await CatalogArtifact.update(
        { current_location: finalLocation },
        { 
          where: { contribution_id: id },
          transaction: t 
        }
      );
      
      console.log(`[completeMaintenanceSession] Updated artifact location to: ${finalLocation}`);
    }

    // Close the session
    session.completed_at = new Date();
    await session.save({ transaction: t });

    await t.commit();
    return res.status(201).json({ session, report });
  } catch (err) {
    if (!t.finished) {
      try { await t.rollback(); } catch {}
    }
    console.error("[completeMaintenanceSession] error:", err);
    res.status(500).json({ message: "Failed to complete maintenance session." });
  }
}
