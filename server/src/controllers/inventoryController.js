// controllers/inventoryController.js
import { mainDb } from "../configs/databases.js";

export async function listInventory(req, res) {
  try {
    // (debug logs removed)
    const [rows] = await mainDb.query(`
      SELECT
        ca.catalog_id,
        ca.artifact_id,
        ca.contribution_id,
        ca.title,
        CONCAT(ct.first_name,' ',ct.last_name) AS donor_name,
        con.contribution_type,
        ca.provenance,
        ca.current_location,
        con.updated_at AS acquisition_date,
        m.last_end AS last_maintenance_at,
        CASE WHEN con.contribution_type = 'lending'
             THEN ld.duration_to
             ELSE NULL
        END AS contract_expires_at,
        CASE
          WHEN m.last_end IS NOT NULL AND m.last_end >= CURRENT_DATE THEN 'Under Maintenance'
          WHEN LOWER(COALESCE(ca.current_location,'')) LIKE '%display%'
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%gallery%'
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%exhibit%'
            THEN 'On Display'
          WHEN LOWER(COALESCE(ca.current_location,'')) LIKE '%storage%' THEN 'In Storage'
          ELSE '—'
        END AS display_status,
        ca.collection_number,
        ca.metadata_updated_at,
        ca.updated_at,
        ca.created_at
      FROM catalog_artifacts ca
      JOIN contributions con ON ca.contribution_id = con.contribution_id
      JOIN contributors ct ON con.contributor_id = ct.contributor_id
      LEFT JOIN lendingdetails ld ON con.contribution_id = ld.contribution_id
      LEFT JOIN (
        SELECT contribution_id, MAX(date_end) AS last_end
        FROM maintenance_reports
        GROUP BY contribution_id
      ) m ON m.contribution_id = con.contribution_id
      ORDER BY ca.updated_at DESC
    `);

    return res.json(rows);
  } catch (err) {
    // keep error logs
    console.error("[Inventory] error:", err);
    return res.status(500).json({ message: "Server error loading inventory" });
  }
}
