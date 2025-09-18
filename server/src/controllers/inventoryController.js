// server/src/controllers/inventoryController.js
import { mainDb } from "../configs/databases.js";

export async function getInventoryList(req, res) {
  try {
    const [results] = await mainDb.query(`
      SELECT
        ca.title,
        c.first_name,
        c.last_name,
        con.contribution_type,
        ca.display_status,
        ca.last_maintenance_at,
        ld.contract_expiration
      FROM catalog_artifacts ca
      JOIN contributions con ON ca.contribution_id = con.contribution_id
      JOIN contributors c ON con.contributor_id = c.contributor_id
      LEFT JOIN lendingdetails ld ON con.contribution_id = ld.contribution_id
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error loading inventory", error: err.message });
  }
}