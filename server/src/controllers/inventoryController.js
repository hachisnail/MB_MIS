// server/src/controllers/inventoryController.js
import { mainDb } from "../configs/databases.js";
import ExcelJS from "exceljs";

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

/* -----------------------------------------------------------
 * GET /api/auth/inventory/export
 * Streams an .xlsx with totals at the top, then the table.
 * Mirrors UI filters: q, date=YYYY-MM-DD, tab, onlyDisplayed=1
 * ----------------------------------------------------------*/
export async function exportInventoryExcel(req, res) {
  try {
    // 1) Load same enriched rows as the list endpoint
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

        COALESCE(ca.metadata_updated_at, ca.updated_at, ca.created_at) AS acquisition_date,

        mr.last_maintenance_at,
        ld.duration_to AS contract_expires_at,

        CASE
          WHEN COALESCE(ms.open_sessions, 0) > 0 THEN 'In Maintenance'
          WHEN COALESCE(ca.current_location,'') = 'On Display' THEN 'On Display'
          WHEN COALESCE(ca.current_location,'') = 'In Storage' THEN 'In Storage'
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
        SELECT
          contribution_id,
          MAX(date_end) AS last_maintenance_at
        FROM maintenance_reports
        GROUP BY contribution_id
      ) mr
        ON mr.contribution_id = con.contribution_id
      LEFT JOIN (
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

    // 2) Apply same filters the UI uses
    const { q, date, tab, onlyDisplayed, exportStatus } = req.query;

    const sameDay = (a, b) => {
      try {
        const da = new Date(a);
        return (
          da.getFullYear() === b.getFullYear() &&
          da.getMonth() === b.getMonth() &&
          da.getDate() === b.getDate()
        );
      } catch {
        return false;
      }
    };

    let list = rows.slice();

    if (q && String(q).trim()) {
      const needle = String(q).trim().toLowerCase();
      list = list.filter((r) =>
        (r.title && r.title.toLowerCase().includes(needle)) ||
        (r.collection_number && String(r.collection_number).toLowerCase().includes(needle)) ||
        (r.provenance && r.provenance.toLowerCase().includes(needle)) ||
        (r.current_location && r.current_location.toLowerCase().includes(needle))
      );
    }

    if (date) {
      const d = new Date(date);
      list = list.filter((r) => {
        const dd = r.acquisition_date || r.metadata_updated_at || r.updated_at || r.created_at;
        return dd && sameDay(dd, d);
      });
    }

    if (onlyDisplayed === "1") {
      list = list.filter((r) => (r.display_status || "").toLowerCase().includes("display"));
    }

// NEW: Explicit exportStatus filter (overrides UI filters if set)
    if (exportStatus && String(exportStatus).trim()) {
        const exportNeedle = String(exportStatus).trim().toLowerCase();
        // Check if a specific filter is requested (not "All Items")
        if (exportNeedle !== "") {
            list = list.filter((r) => (r.display_status || "").toLowerCase().includes(exportNeedle));
            
            // If an explicit export status is selected, clear other tab filters
            if (exportNeedle === "in maintenance") {
                // 'In Maintenance' can be anything (acquired or borrowing)
                // Do not apply 'acquired' or 'borrowing' tab filters
            } else if (tab === "acquired" || tab === "borrowing") {
                // If the user selected a status AND a tab (which is unlikely but possible via URL)
                // prioritize the status filter, and then re-apply the tab filter
                if (tab === "acquired") {
                    list = list.filter((r) => r.contribution_type !== "lending");
                } else if (tab === "borrowing") {
                    list = list.filter((r) => r.contribution_type === "lending");
                }
            }
        }
    } else {
        // UI Tab filters (only apply if no explicit exportStatus is set)
        if (tab === "acquired") {
          list = list.filter((r) => r.contribution_type !== "lending");
        } else if (tab === "borrowing") {
          list = list.filter((r) => r.contribution_type === "lending");
        }
        // artifacts => no extra filtering
    }

    if (tab === "acquired") {
      list = list.filter((r) => r.contribution_type !== "lending");
    } else if (tab === "borrowing") {
      list = list.filter((r) => r.contribution_type === "lending");
    }
    // artifacts => no extra filtering

    list.sort(
      (a, b) =>
        new Date(b.metadata_updated_at || b.updated_at || 0) -
        new Date(a.metadata_updated_at || a.updated_at || 0)
    );

    // 3) Totals AFTER filters
    const totalCount = list.length;
    const acquiredCount = list.filter((r) => r.contribution_type !== "lending").length;
    const borrowingCount = list.filter((r) => r.contribution_type === "lending").length;

    // 4) Build workbook: totals first, then table
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Inventory");

    // Title (merged) + summary rows at the very top
    ws.mergeCells(1, 1, 1, 11); // A1:K1 covers 11 columns used below
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `Inventory Export — ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`;
    titleCell.font = { bold: true, size: 14 };

    ws.addRow(["Total Items", totalCount]);
    ws.addRow(["Acquired/Donated", acquiredCount]);
    ws.addRow(["Borrowed/Lending", borrowingCount]);

    // Optional: show applied filters
    const filters = [];
    if (q && String(q).trim()) filters.push(`q="${q}"`);
    if (date) filters.push(`date=${date}`);
    if (tab && tab !== "artifacts") filters.push(`tab=${tab}`);
    if (onlyDisplayed === "1") filters.push("onlyDisplayed=1");
    if (exportStatus) filters.push(`exportStatus=${exportStatus}`); // NEW: show exportStatus
    if (filters.length) ws.addRow(["Filters", filters.join(" | ")]);

    // Blank spacer BEFORE table
    ws.addRow([]);

    // Table columns
    ws.columns = [
      { header: "Title", key: "title", width: 40 },
      { header: "Donator Name", key: "donor_name", width: 28 },
      { header: "Origin", key: "provenance", width: 22 },
      { header: "Acquisition Date", key: "acquisition_date", width: 18 },
      { header: "Type", key: "contribution_type", width: 14 },
      { header: "Display Status", key: "display_status", width: 18 },
      { header: "Last Maintenance", key: "last_maintenance_at", width: 18 },
      { header: "Contract Expiration", key: "contract_expires_at", width: 20 },
      { header: "Collection #", key: "collection_number", width: 18 },
      { header: "Location", key: "current_location", width: 22 },
      { header: "Updated At", key: "metadata_updated_at", width: 20 },
    ];

    // Visible header row for the table
    const headerLabels = ws.columns.map((c) => c.header);
    ws.addRow(headerLabels).font = { bold: true };

    // Freeze panes at the header row
    ws.views = [{ state: "frozen", ySplit: ws.lastRow.number }];

    const fmtDate = (v) => {
      if (!v) return "";
      const d = new Date(v);
      return isNaN(d) ? String(v) : d.toISOString().split("T")[0];
    };

    // Data rows
    for (const r of list) {
      ws.addRow({
        title: r.title ?? "",
        donor_name: r.donor_name ?? "",
        provenance: r.provenance ?? "",
        acquisition_date: fmtDate(r.acquisition_date || r.metadata_updated_at || r.updated_at || r.created_at),
        contribution_type: r.contribution_type ?? "",
        display_status: r.display_status ?? "",
        last_maintenance_at: fmtDate(r.last_maintenance_at),
        contract_expires_at: fmtDate(r.contract_expires_at),
        collection_number: r.collection_number ?? "",
        current_location: r.current_location ?? "",
        metadata_updated_at: fmtDate(r.metadata_updated_at || r.updated_at),
      });
    }

    // 5) Stream file
    const filename = `inventory_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("[Inventory Export] error:", err);
    res.status(500).json({ message: "Failed to export inventory.", error: err.message });
  }
}
