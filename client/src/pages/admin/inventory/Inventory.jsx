// client/src/pages/admin/inventory/Inventory.jsx
import { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import { SearchBar } from "@/features/Utilities";
import Toast from "@/features/Toast";
import useToast from "../../../components/commons";
import { useLocation } from "react-router-dom";

import { TableHeaderContainer } from "@/features/Utilities";
import ListRenderer from "@/components/tables/ListRenderer";
import InventortyList from "./components/Inventorylist";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;         // e.g. http://localhost:5000/api
const SERVER_ORIGIN = BASE_URL?.replace(/\/api$/, "");       // e.g. http://localhost:5000

const EXPORT_FILTERS = [
  { value: "", label: "All Items (Current Filters)" },
  { value: "on display", label: "Only On Display" },
  { value: "in storage", label: "Only In Storage" },
  { value: "in maintenance", label: "Only In Maintenance" },
  // NOTE: You can add more status values if needed
];

const Inventory = () => {
  const location = useLocation();
  const initialFilter = location.state?.filter || "artifacts";

  const [activeTab, setActiveTab] = useState("artifacts");
  const [artifactFilter, setArtifactFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // NEW: Export Date Range State
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

  const [exportStatusFilter, setExportStatusFilter] = useState(EXPORT_FILTERS[0].value);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    switch (initialFilter) {
      case "displayed":
        setActiveTab("artifacts");
        setArtifactFilter("displayed");
        break;
      case "acquired":
      case "borrowing":
      case "artifacts":
      default:
        setActiveTab(initialFilter);
        setArtifactFilter(null);
    }
  }, [initialFilter]);

  //  Fetch enriched inventory (absolute URL to avoid Vite returning index.html)
  useEffect(() => {
    let abort = false;

    async function fetchInventory() {
      try {
        setLoading(true);
        setErr("");
        console.log("[Inventory.jsx] fetching (A) GET", `${SERVER_ORIGIN}/api/auth/inventory`, Date.now());
        const respA = await axios.get(`${SERVER_ORIGIN}/api/auth/inventory`, {
          withCredentials: true,
          // Explicitly expect JSON
          headers: { Accept: "application/json" },
          validateStatus: () => true,
        });

        const ctA = respA.headers?.["content-type"] || "";
        console.log("[Inventory.jsx] (A) status:", respA.status, respA.statusText, "ct:", ctA);

        if (respA.status === 200 && Array.isArray(respA.data)) {
          console.log("[Inventory.jsx] (A) rows:", respA.data.length);
          if (!abort) setRows(respA.data);
          return;
        }

        // Fallback: try older path if your server used /api/inventory
        console.log("[Inventory.jsx] (A) not array or wrong status, trying (B) GET", `${SERVER_ORIGIN}/api/inventory`);
        const respB = await axios.get(`${SERVER_ORIGIN}/api/inventory`, {
          withCredentials: true,
          headers: { Accept: "application/json" },
          validateStatus: () => true,
        });
        const ctB = respB.headers?.["content-type"] || "";
        console.log("[Inventory.jsx] (B) status:", respB.status, respB.statusText, "ct:", ctB);

        if (respB.status === 200 && Array.isArray(respB.data)) {
          console.log("[Inventory.jsx] (B) rows:", respB.data.length);
          if (!abort) setRows(respB.data);
          return;
        }

        // If still not JSON array, surface a useful error
        const sample = typeof respA.data === "string" ? respA.data.slice(0, 200) : JSON.stringify(respA.data)?.slice(0, 200);
        console.warn("[Inventory.jsx] Neither A nor B returned JSON array. Sample:", sample);
        if (!abort) {
          setErr("Inventory API did not return JSON. Check server route and Vite proxy.");
          setRows([]);
        }
      } catch (e) {
        console.error("[Inventory.jsx] fetch error:", e);
        if (!abort) {
          setErr("Failed to load inventory.");
          setRows([]);
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }

    fetchInventory();
    return () => { abort = true; };
  }, []);

  const { toastConfig, showToast, hideToast } = useToast();

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    showToast(date ? `Filtering data for ${date.toLocaleDateString()}` : "Showing all dates", "info");
  }, [showToast]);

  // --- Export to Excel handler ---
  const exportExcel = useCallback(async () => {
    try {
      setLoading(true);

const params = new URLSearchParams();
            
            // 1. Determine if we are keeping the current UI filters
            const isDefaultExport = exportStatusFilter === EXPORT_FILTERS[0].value;
            const hasDateRange = exportStartDate || exportEndDate;

            if (isDefaultExport && !hasDateRange) {
                // Scenario 1: Default export (mirrors the table content)
                if (searchQuery.trim()) params.set("q", searchQuery.trim());
                if (selectedDate) params.set("date", selectedDate.toISOString().split("T")[0]);
                if (activeTab) params.set("tab", activeTab);
                if (artifactFilter === "displayed") params.set("onlyDisplayed", "1");
            } else if (!isDefaultExport) {
                // Scenario 2: Status-specific export (overrides table content tabs/onlyDisplayed)
                params.set("exportStatus", exportStatusFilter);
            }
            // Note: If (isDefaultExport && hasDateRange) is true, we use *only* the date range.

            // 2. Add NEW Date Range Filters (always included if present)
            if (exportStartDate.trim()) params.set("exportStartDate", exportStartDate.trim());
            if (exportEndDate.trim()) params.set("exportEndDate", exportEndDate.trim());

      const url = `${SERVER_ORIGIN}/api/auth/inventory/export?${params.toString()}`;

      const resp = await axios.get(url, {
        withCredentials: true,
        responseType: "blob",
        headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        validateStatus: () => true,
      });

      if (resp.status !== 200) {
        try {
          const text = await resp.data.text();
          throw new Error(text || `Export failed (${resp.status})`);
        } catch {
          throw new Error(`Export failed (${resp.status})`);
        }
      }

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = `inventory_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);

      showToast("Excel exported successfully.", "success");
    } catch (e) {
      console.error("[Inventory.jsx] export error:", e);
      showToast("Export failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
}, [searchQuery, selectedDate, activeTab, artifactFilter, exportStatusFilter, exportStartDate, exportEndDate, showToast]);
  // headers
  const artifactsHeaders = [
    { label: "Title", width: "1fr" },
    { label: "Donator Name", width: "1fr" },
    { label: "Origin", width: 20 },
    { label: "Acquisition Date", width: 15 },
    { label: "Type", width: 10 },
    { label: "Display Status", width: 14 },
    { label: "Last Maintenance", width: 14 },
    { label: "Contract Expiration", width: 16 },
  ];
  const acquiredHeaders = [
    { label: "Title", width: "1fr" },
    { label: "Donator Name", width: "1fr" },
    { label: "Origin", width: 20 },
    { label: "Acquisition Date", width: 15 },
    { label: "Display Status", width: 14 },
    { label: "Last Maintenance", width: 14 },
  ];
  const borrowingHeaders = [
    { label: "Title", width: "1fr" },
    { label: "Donator Name", width: "1fr" },
    { label: "Origin", width: 20 },
    { label: "Acquisition Date", width: 15 },
    { label: "Display Status", width: 14 },
    { label: "Last Maintenance", width: 14 },
    { label: "Contract Information", width: 16 },
  ];
  const headersMap = {
    artifacts: artifactsHeaders,
    acquired: acquiredHeaders,
    borrowing: borrowingHeaders,
  };

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

  // Date comparison utility function for the preview logic
    const isInRange = (dateString, start, end) => {
        if (!dateString) return true;
        const itemDate = new Date(dateString).getTime();
        const startDate = start ? new Date(start).setHours(0, 0, 0, 0) : null;
        const endDate = end ? new Date(end).setHours(23, 59, 59, 999) : null;
        
        const isAfterStart = !startDate || itemDate >= startDate;
        const isBeforeEnd = !endDate || itemDate <= endDate;
        
        return isAfterStart && isBeforeEnd;
    };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = rows.filter((r) => {
      const matchQ =
        !q ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.collection_number && String(r.collection_number).toLowerCase().includes(q)) ||
        (r.provenance && r.provenance.toLowerCase().includes(q)) ||
        (r.current_location && r.current_location.toLowerCase().includes(q));
      if (!matchQ) return false;

      if (selectedDate) {
        const dd = r.acquisition_date || r.metadata_updated_at || r.updated_at || r.created_at;
        if (!dd || !sameDay(dd, selectedDate)) return false;
      }

      if (artifactFilter === "displayed") {
        const onDisp = (r.display_status || "").toLowerCase().includes("display");
        if (!onDisp) return false;
      }
      return true;
    });

    let tabbed = list;
    if (activeTab === "acquired") tabbed = list.filter((r) => r.contribution_type !== "lending");
    else if (activeTab === "borrowing") tabbed = list.filter((r) => r.contribution_type === "lending");

    tabbed.sort(
      (a, b) =>
        new Date(b.metadata_updated_at || b.updated_at || 0) -
        new Date(a.metadata_updated_at || a.updated_at || 0)
    );

    return tabbed;
  }, [rows, searchQuery, selectedDate, activeTab, artifactFilter]);

  const tabs = [
    { key: "artifacts", label: "Artifacts" },
    { key: "acquired", label: "Acquired" },
    { key: "borrowing", label: "Borrowing" },
  ];

  const summary = useMemo(() => {
    const total = rows.length;
    const acquired = rows.filter((r) => r.contribution_type !== "lending").length;
    const borrowing = rows.filter((r) => r.contribution_type === "lending").length;
    const onDisplay = rows.filter((r) => (r.display_status || "").toLowerCase().includes("display")).length;
    const inStorage = rows.filter((r) => (r.current_location || "").toLowerCase().includes("storage")).length;
    const underMaint = rows.filter((r) => (r.display_status || "").toLowerCase().includes("maintenance")).length;
    const s = { total, acquired, borrowing, onDisplay, inStorage, underMaint };
    console.log("[Inventory.jsx] summary:", s);
    return [
      { label: "Total Artifacts", Value: String(total) },
      { label: "Acquired", Value: String(acquired) },
      { label: "Borrowing", Value: String(borrowing) },
      { label: "Under Maintenance", Value: String(underMaint) },
      { label: "On Display", Value: String(onDisplay) },
      { label: "In Storage", Value: String(inStorage) },
    ];
  }, [rows]);

// --- NEW: Export Modal Component ---
    const ExportModal = ({ isOpen, onClose, allRows, activeTab, artifactFilter, searchQuery, selectedDate }) => {
        if (!isOpen) return null;

        // 1. Calculate the list that will be exported (for preview)
        const exportListPreview = useMemo(() => {
            let list = allRows.slice();
            const q = searchQuery.trim().toLowerCase();
            
            // Flags for current filter settings
            const isDefaultExport = exportStatusFilter === EXPORT_FILTERS[0].value;
            const hasDateRange = exportStartDate || exportEndDate;

            // Apply all UI filters IF it is a default export AND no date range is set.
            // This ensures the preview matches the table if the user hasn't touched the modal filters.
            if (isDefaultExport && !hasDateRange) {
                
                // Match Search Query
                list = list.filter((r) => 
                    !q || (r.title && r.title.toLowerCase().includes(q)) || 
                    (r.collection_number && String(r.collection_number).toLowerCase().includes(q)) || 
                    (r.provenance && r.provenance.toLowerCase().includes(q)) || 
                    (r.current_location && r.current_location.toLowerCase().includes(q))
                );

                // Match Single Date Filter
                if (selectedDate) {
                    list = list.filter((r) => {
                        const dd = r.acquisition_date || r.metadata_updated_at || r.updated_at || r.created_at;
                        return dd && sameDay(dd, selectedDate);
                    });
                }
                
                // Match 'Only Displayed' UI Filter
                if (artifactFilter === "displayed") {
                    list = list.filter((r) => (r.display_status || "").toLowerCase().includes("display"));
                }
                
                // Apply the UI Tab filter
                if (activeTab === "acquired") list = list.filter((r) => r.contribution_type !== "lending");
                else if (activeTab === "borrowing") list = list.filter((r) => r.contribution_type === "lending");
            }
            
            // 2. Apply the Export Status filter (Overrides tab/onlyDisplayed if set)
            if (!isDefaultExport) {
                const needle = exportStatusFilter.toLowerCase();
                list = list.filter((r) => (r.display_status || "").toLowerCase().includes(needle));
            }
            
            // 3. Apply NEW Date Range Filter (Always applied if set, regardless of other context)
            if (exportStartDate || exportEndDate) {
                list = list.filter((r) => {
                    // Use the best acquisition date column for filtering
                    const dateToCheck = r.acquisition_date || r.metadata_updated_at || r.updated_at || r.created_at;
                    return isInRange(dateToCheck, exportStartDate, exportEndDate);
                });
            }

            return list;
        }, [allRows, activeTab, artifactFilter, searchQuery, selectedDate, exportStatusFilter, exportStartDate, exportEndDate]);

        // 4. Calculate Final Totals
        const totalCount = exportListPreview.length;
        const acquiredCount = exportListPreview.filter((r) => r.contribution_type !== "lending").length;
        const borrowingCount = exportListPreview.filter((r) => r.contribution_type === "lending").length;


        // Basic full-screen overlay for the modal
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl shadow-2xl min-w-[35rem] max-w-lg">
                    
                    {/* Modal Header */}
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h3 className="text-2xl font-bold">Export Inventory to Excel</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">
                            &times;
                        </button>
                    </div>

                    <p className="mb-4 text-sm text-gray-600">
                        Choose filters below to scope your export. By default, "All Items (Current Filters)" mirrors the visible table data.
                    </p>
                    
                    {/* Status Filter */}
                    <div className="mb-5">
                        <label className="text-lg font-semibold text-gray-800 block mb-2">1. Filter by Status</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-400 text-base font-medium cursor-pointer"
                            value={exportStatusFilter}
                            onChange={(e) => setExportStatusFilter(e.target.value)}
                            disabled={loading}
                        >
                            {EXPORT_FILTERS.map((f) => (
                                <option key={f.value} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="mb-6">
                        <label className="text-lg font-semibold text-gray-800 block mb-2">2. Filter by Acquisition/Update Date Range</label>
                        <div className="flex space-x-4">
                            <input
                                type="date"
                                className="w-1/2 h-10 px-3 rounded-lg border border-gray-400 text-base"
                                placeholder="Start Date"
                                value={exportStartDate}
                                onChange={(e) => setExportStartDate(e.target.value)}
                                disabled={loading}
                            />
                            <input
                                type="date"
                                className="w-1/2 h-10 px-3 rounded-lg border border-gray-400 text-base"
                                placeholder="End Date"
                                value={exportEndDate}
                                onChange={(e) => setExportEndDate(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Export Preview / Totals Section */}
                    <div className="p-4 bg-black text-white rounded-lg mb-6">
                        <h4 className="text-xl font-bold mb-3 border-b border-gray-600 pb-2">Export Report Preview</h4>
                        <div className="grid grid-cols-2 gap-y-2 font-medium">
                            <span className="text-gray-300">Total Items in Export:</span>
                            <span className="text-right text-3xl font-extrabold">{totalCount}</span>
                            
                            <span className="text-gray-400 mt-2">Acquired/Donated:</span>
                            <span className="text-right mt-2">{acquiredCount}</span>

                            <span className="text-gray-400">Borrowed/Lending:</span>
                            <span className="text-right">{borrowingCount}</span>
                        </div>
                    </div>

                    {/* Modal Footer: Buttons (lower right) */}
                    <div className="flex justify-end pt-3">
                        <button
                            onClick={onClose}
                            className="h-10 px-4 rounded-lg text-lg font-semibold mr-3 border border-gray-400 text-gray-800 hover:bg-gray-100"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={exportExcel}
                            disabled={loading || totalCount === 0}
                            className={`h-10 px-4 rounded-lg text-lg font-semibold 
                                ${loading || totalCount === 0 ? "opacity-60 cursor-not-allowed bg-gray-600" : "cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"}`}
                        >
                            {loading ? "Exporting..." : "⬇️ Export to Excel"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

  return (
    <>
 {/* Render the Modal */}
            <ExportModal 
                isOpen={isExportModalOpen} 
                onClose={() => setIsExportModalOpen(false)} 
                allRows={rows} // Pass the full fetched data
                activeTab={activeTab}
                artifactFilter={artifactFilter}
                searchQuery={searchQuery}
                selectedDate={selectedDate}
            />

      <div className="w-full h-full items-center flex flex-col overflow-scroll gap-y-10">
        {/* summary */}
        <div className="w-fit flex-wrap flex gap-7 items-center justify-center">
          {summary.map(({ label, Value }) => (
            <div
              key={label}
              className="w-70 rounded-xl h-25 text-white bg-black font-semibold flex flex-col items-center justify-center"
            >
              <span className="text-sm">{label}</span>
              <span className="text-5xl">{Value}</span>
            </div>
          ))}
        </div>

        <div className="w-full h-full flex flex-col gap-y-7 overflow-auto">
          {/* utilities */}
          <div className="min-w-[100rem] min-h-[3.2rem] gap-x-5 flex ">
            <div className="min-w-[34rem] max-w-[34rem] min-h-[3.2rem] flex items-start gap-x-2">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  className={`w-fit cursor-pointer h-full px-4 rounded-lg border-1 text-2xl font-semibold  ${
                    activeTab === key ? "bg-black text-white border-black" : "border-gray-500"
                  }`}
                  onClick={() => {
                    setActiveTab(key);
                    if (key === "artifacts") setArtifactFilter(null);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <TimelineDatePicker
              defaultValue={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
              onDateChange={(ds) => handleDateChange(ds ? new Date(ds) : null)}
              theme="light"
            />

            <div className="[&_input]:text-black [&_input]:placeholder-gray-500">
              <SearchBar
                theme="light"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artifacts"
              />
            </div>



{/* Export button (now opens the modal) */}
                        <div className="ml-auto">
                            <button
                                onClick={() => setIsExportModalOpen(true)} // Open modal instead of exporting
                                disabled={loading}
                                className={`h-full px-4 rounded-lg border-1 text-xl font-semibold 
                                    ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                                    bg-black text-white border-black`}
                                title="Open export options"
                            >
                                Export
                            </button>
                        </div>
          </div>

          {/* table */}
          <div className="w-full h-full flex flex-col">
            <TableHeaderContainer headers={headersMap[activeTab]} />
            <div className="w-full h-[43.7rem] 3xl:h-[67rem] overflow-y-auto border-y border-gray-400">
              <ListRenderer
                isLoading={loading}
                error={err}
                items={filtered}
                emptyMessage="No artifacts found"
                renderItem={(item) => (
                  <InventortyList
                    key={item.catalog_id ?? `${item.contribution_id}-${item.artifact_id}`}
                    item={item}
                    headers={headersMap[activeTab]}
                    variant={activeTab}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <Toast message={toastConfig.message} type={toastConfig.type} onClose={hideToast} />
    </>
  );
};

export default Inventory;
