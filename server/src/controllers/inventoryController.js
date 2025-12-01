// server/src/controllers/inventoryController.js
import { mainDb } from "../configs/databases.js";
import ExcelJS from "exceljs";

// Utility functions (assuming they are defined or imported within this file or scope)
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

/**
 * GET /api/auth/inventory
 * Returns enriched inventory rows joined across:
 * - catalog_artifacts (ca)
 * - contributions (con)
 * - contributors (contrib)
 * - lendingdetails (ld)
 * - maintenance_reports (aggregated)
 * - maintenance_sessions (open)
 */
export async function getInventoryList(req, res) {
    try {
        const [rows] = await mainDb.query(
            `
            SELECT
                ca.catalog_id, ca.artifact_id, ca.contribution_id, ca.title,
                CONCAT(COALESCE(contrib.first_name,''), ' ', COALESCE(contrib.last_name,'')) AS donor_name,
                con.contribution_type, ca.provenance, ca.current_location,

                COALESCE(ca.metadata_updated_at, ca.updated_at, ca.created_at) AS acquisition_date,

                mr.last_maintenance_at, ld.duration_to AS contract_expires_at,

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

                ca.collection_number, ca.metadata_updated_at, ca.updated_at, ca.created_at
            FROM catalog_artifacts ca
            JOIN contributions con ON ca.contribution_id = con.contribution_id
            JOIN contributors contrib ON con.contributor_id = contrib.contributor_id
            LEFT JOIN lendingdetails ld ON ld.contribution_id = con.contribution_id
            LEFT JOIN (
                /* Most recent maintenance date from reports */
                SELECT contribution_id, MAX(date_end) AS last_maintenance_at FROM maintenance_reports GROUP BY contribution_id
            ) mr ON mr.contribution_id = con.contribution_id
            LEFT JOIN (
                /* Open maintenance sessions (completed_at IS NULL) */
                SELECT contribution_id, COUNT(*) AS open_sessions FROM maintenance_sessions WHERE completed_at IS NULL GROUP BY contribution_id
            ) ms ON ms.contribution_id = con.contribution_id
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
 * Applies all filters from the frontend modal/UI.
 * ----------------------------------------------------------*/
export async function exportInventoryExcel(req, res) {
    try {
        // 1) Load same enriched rows as the list endpoint
        const [rows] = await mainDb.query(
            // NOTE: This large query is kept identical to getInventoryList to ensure consistency
            `
            SELECT
                ca.catalog_id, ca.artifact_id, ca.contribution_id, ca.title,
                CONCAT(COALESCE(contrib.first_name,''), ' ', COALESCE(contrib.last_name,'')) AS donor_name,
                con.contribution_type, ca.provenance, ca.current_location,

                COALESCE(ca.metadata_updated_at, ca.updated_at, ca.created_at) AS acquisition_date,

                mr.last_maintenance_at, ld.duration_to AS contract_expires_at,

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

                ca.collection_number, ca.metadata_updated_at, ca.updated_at, ca.created_at
            FROM catalog_artifacts ca
            JOIN contributions con ON ca.contribution_id = con.contribution_id
            JOIN contributors contrib ON con.contributor_id = contrib.contributor_id
            LEFT JOIN lendingdetails ld ON ld.contribution_id = con.contribution_id
            LEFT JOIN (
                SELECT contribution_id, MAX(date_end) AS last_maintenance_at FROM maintenance_reports GROUP BY contribution_id
            ) mr ON mr.contribution_id = con.contribution_id
            LEFT JOIN (
                SELECT contribution_id, COUNT(*) AS open_sessions FROM maintenance_sessions WHERE completed_at IS NULL GROUP BY contribution_id
            ) ms ON ms.contribution_id = con.contribution_id
            ORDER BY ca.updated_at DESC
            `
        );

        // 2) Destructure ALL relevant query parameters, including new ones
        const {
            q,
            date,
            tab,
            onlyDisplayed,
            exportStatus,       // New status filter
            exportStartDate,    // New date range start
            exportEndDate       // New date range end
        } = req.query;

        let list = rows.slice();

        // Determine filtering mode
        const exportNeedle = String(exportStatus || "").trim().toLowerCase();
        const isDefaultUIExport = exportNeedle === "";
        const hasDateRange = exportStartDate || exportEndDate;

        // --- FILTERING LOGIC ---

        // A. Apply UI Filters (q, date, tab, onlyDisplayed) ONLY if we are doing a "UI Mirror" export.
        if (isDefaultUIExport && !hasDateRange) {
            
            // 1. Search Query (q)
            if (q && String(q).trim()) {
                const needle = String(q).trim().toLowerCase();
                list = list.filter((r) =>
                    (r.title && r.title.toLowerCase().includes(needle)) ||
                    (r.collection_number && String(r.collection_number).toLowerCase().includes(needle)) ||
                    (r.provenance && r.provenance.toLowerCase().includes(needle)) ||
                    (r.current_location && r.current_location.toLowerCase().includes(needle))
                );
            }

            // 2. Single Date Filter (date)
            if (date) {
                const d = new Date(date);
                list = list.filter((r) => {
                    const dd = r.acquisition_date || r.metadata_updated_at || r.updated_at || r.created_at;
                    return dd && sameDay(dd, d);
                });
            }

            // 3. Only Displayed (onlyDisplayed)
            if (onlyDisplayed === "1") {
                list = list.filter((r) => (r.display_status || "").toLowerCase().includes("display"));
            }
            
            // 4. UI Tab Filter (tab)
            if (tab === "acquired") {
                list = list.filter((r) => r.contribution_type !== "lending");
            } else if (tab === "borrowing") {
                list = list.filter((r) => r.contribution_type === "lending");
            }
        }
        
        // B. Apply EXPLICIT Status Filter (Overrides UI display filters if set)
        if (!isDefaultUIExport) {
            list = list.filter((r) => (r.display_status || "").toLowerCase().includes(exportNeedle));
        }

        // C. Apply Date Range Filters (Always applies if present)
        if (hasDateRange) {
            const startTimestamp = exportStartDate ? new Date(exportStartDate).setHours(0, 0, 0, 0) : null;
            const endTimestamp = exportEndDate ? new Date(exportEndDate).setHours(23, 59, 59, 999) : null;

            list = list.filter((r) => {
                const dateToCheck = r.acquisition_date || r.metadata_updated_at || r.updated_at || r.created_at;
                if (!dateToCheck) return false;

                const itemTimestamp = new Date(dateToCheck).getTime();

                const isAfterStart = !startTimestamp || itemTimestamp >= startTimestamp;
                const isBeforeEnd = !endTimestamp || itemTimestamp <= endTimestamp;

                return isAfterStart && isBeforeEnd;
            });
        }


        // 3) Sorting the List
        list.sort(
            (a, b) =>
                new Date(b.metadata_updated_at || b.updated_at || 0) -
                new Date(a.metadata_updated_at || a.updated_at || 0)
        );

        // 4) Totals AFTER filters (Used for the summary rows)
        const totalCount = list.length;
        const acquiredCount = list.filter((r) => r.contribution_type !== "lending").length;
        const borrowingCount = list.filter((r) => r.contribution_type === "lending").length;

        // 5) Build workbook: totals first, then table
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Inventory");

        // Title + Summary Rows
        ws.mergeCells(1, 1, 1, 11);
        const titleCell = ws.getCell(1, 1);
        titleCell.value = `Inventory Export — ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`;
        titleCell.font = { bold: true, size: 14 };

        ws.addRow(["Total Items", totalCount]);
        ws.addRow(["Acquired/Donated", acquiredCount]);
        ws.addRow(["Borrowed/Lending", borrowingCount]);

        // Optional: show applied filters
        const filters = [];
        // Only show UI filters if they were used
        if (isDefaultUIExport && !hasDateRange) {
            if (q && String(q).trim()) filters.push(`q="${q}"`);
            if (date) filters.push(`date=${date}`);
            if (tab && tab !== "artifacts") filters.push(`tab=${tab}`);
            if (onlyDisplayed === "1") filters.push("onlyDisplayed=1");
        }
        // Always show modal filters if present
        if (exportStatus && exportStatus !== "") filters.push(`Status=${exportStatus}`);
        if (exportStartDate) filters.push(`Start Date=${exportStartDate}`);
        if (exportEndDate) filters.push(`End Date=${exportEndDate}`);
        
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

        const headerLabels = ws.columns.map((c) => c.header);
        ws.addRow(headerLabels).font = { bold: true };
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

        // 6) Stream file
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