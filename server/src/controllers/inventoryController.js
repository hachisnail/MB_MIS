// server/src/controllers/inventoryController.js
import { mainDb } from "../configs/databases.js";

/**
 * GET /api/auth/inventory
 * Returns enriched inventory rows joined across:
 *  - catalog_artifacts (ca)
 *  - contributions (con)
 *  - contributors (contrib)
 *  - lendingdetails (ld)                → contract_expires_at
 *  - maintenance_reports (aggregated)   → last_maintenance_at, open_maint
 *
 * NOTE: No dependency on a non-existent `ca.published` column.
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
          WHEN COALESCE(mr.open_maint, 0) = 1 THEN 'In Maintenance'
          WHEN LOWER(COALESCE(ca.current_location,'')) LIKE '%display%'
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%gallery%'
            OR LOWER(COALESCE(ca.current_location,'')) LIKE '%exhibit%'
            THEN 'On Display'
          WHEN LOWER(COALESCE(ca.current_location,'')) LIKE '%storage%'
            THEN 'In Storage'
          ELSE '—'
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
        /* Per-contribution maintenance summary:
           - last_maintenance_at: most recent date_end
           - open_maint: 1 if any report currently open/ongoing
        */
        SELECT
          contribution_id,
          MAX(date_end) AS last_maintenance_at,
          MAX(
            CASE
              WHEN date_end IS NULL OR date_end >= CURRENT_DATE THEN 1
              ELSE 0
            END
          ) AS open_maint
        FROM maintenance_reports
        GROUP BY contribution_id
      ) mr
        ON mr.contribution_id = con.contribution_id
      ORDER BY ca.updated_at DESC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("[Inventory] error:", err);
    res.status(500).json({ message: "Error loading inventory", error: err.message });
  }
}

/* Back-compat alias: if elsewhere you imported { listInventory } */
export { getInventoryList as listInventory };
