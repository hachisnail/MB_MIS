// server/src/controllers/inventoryController.js
import { mainDb } from "../configs/databases.js";

/**
 * GET /api/auth/inventory
 * Returns enriched inventory rows joined across:
 *  - catalog_artifacts (ca)
 *  - contributions (con)
 *  - contributors (contrib)
 *  - lendingdetails (ld)                → contract_expires_at
 *  - maintenance_reports (aggregated)   → last_maintenance_at
 *  - maintenance_sessions (open)        → overrides display_status to "In Maintenance"
 */
export async function getInventoryList(req, res) {
  try {
    const [rows] = await mainDb.query(
      `
      SELECT
        ca.catalog_id,
        ca.artifact_id,
        ca.contribution_id,
        ca.title,
        CONCAT(COALESCE(contrib.first_name,''), ' ', COALESCE(contrib.last_name,'')) AS donor_name,
        con.contribution_type,
        ca.provenance,
        ca.current_location,

        -- best-effort date you already use for filtering/sorting
        COALESCE(ca.metadata_updated_at, ca.updated_at, ca.created_at) AS acquisition_date,

        mr.last_maintenance_at,
        ld.duration_to AS contract_expires_at,

        CASE
          WHEN COALESCE(ms.open_sessions, 0) > 0 THEN 'In Maintenance'
          WHEN COALESCE(ca.current_location,'') = 'On Display' THEN 'On Display'
          WHEN COALESCE(ca.current_location,'') = 'In Storage' THEN 'In Storage'
          -- Fallback for legacy data with text descriptions
          WHEN LOWER(TRIM(COALESCE(ca.current_location,''))) IN ('on display', 'display', 'gallery', 'exhibit', 'exhibition')
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%display%'
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%gallery%'
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%exhibit%'
            THEN 'On Display'
          WHEN LOWER(TRIM(COALESCE(ca.current_location,''))) IN ('in storage', 'storage', 'warehouse', 'archive')
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%storage%'
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%warehouse%'
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%archive%'
            THEN 'In Storage'
          ELSE 'In Storage'
        END AS display_status,

        ca.collection_number,
        ca.metadata_updated_at,
        ca.updated_at,
        ca.created_at
      FROM catalog_artifacts ca
      JOIN contributions con
        ON ca.contribution_id = con.contribution_id
      JOIN contributors contrib
        ON con.contributor_id = contrib.contributor_id
      LEFT JOIN lendingdetails ld
        ON ld.contribution_id = con.contribution_id
      LEFT JOIN (
        /* Most recent maintenance date from reports */
        SELECT
          contribution_id,
          MAX(date_end) AS last_maintenance_at
        FROM maintenance_reports
        GROUP BY contribution_id
      ) mr
        ON mr.contribution_id = con.contribution_id
      LEFT JOIN (
        /* Open maintenance sessions (completed_at IS NULL) */
        SELECT
          contribution_id,
          COUNT(*) AS open_sessions
        FROM maintenance_sessions
        WHERE completed_at IS NULL
        GROUP BY contribution_id
      ) ms
        ON ms.contribution_id = con.contribution_id
      ORDER BY ca.updated_at DESC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("[Inventory] error:", err);
    res.status(500).json({ message: "Error loading inventory", error: err.message });
  }
}

/* Back-compat alias */
export { getInventoryList as listInventory };
