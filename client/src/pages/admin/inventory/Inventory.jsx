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

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL?.replace(/\/api$/, "");

const Inventory = () => {
  const location = useLocation();
  const initialFilter = location.state?.filter || "artifacts";

  const [activeTab, setActiveTab] = useState("artifacts");
  const [artifactFilter, setArtifactFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [artifacts, setArtifacts] = useState([]);

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

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await axios.get(`${SERVER_ORIGIN}/api/auth/public-artifacts`, {
          withCredentials: true,
        });
        if (!abort) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!abort) {
          console.error("Failed to load catalog artifacts:", e);
          setErr("Failed to load inventory.");
          setRows([]);
        }
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  useEffect(() => {
    axios.get("/api/inventory")
      .then(res => {
        // Map API data to expected fields
        const mapped = res.data.map(item => ({
          ...item,
          donor_name: `${item.first_name} ${item.last_name}`,
          contract_expires_at: item.contract_expiration, // match expected key
        }));
        setArtifacts(mapped);
      })
      .catch(err => {
        setArtifacts([]);
        // handle error
      });
  }, []);

  const { toastConfig, showToast, hideToast } = useToast();

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    showToast(date ? `Filtering data for ${date.toLocaleDateString()}` : "Showing all dates", "info");
  }, [showToast]);

  // headers (Articles-style widths)
  const artifactsHeaders = [
    { label: "Title", width: "1fr" },
    { label: "Donator Name", width: "1fr" },
    { label: "Origin", width: 20 },                // 20rem
    { label: "Acquisition Date", width: 15 },      // 12rem
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = rows.filter((r) => {
      const matchQ =
        !q ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.collection_number && String(r.collection_number).toLowerCase().includes(q)) ||
        (r.provenance && r.provenance.toLowerCase().includes(q)) ||
        (r.current_location && r.current_location.toLowerCase().includes(q)) ||
        (r.display_description && r.display_description.toLowerCase().includes(q)) ||
        (r.curatorial_description && r.curatorial_description.toLowerCase().includes(q)) ||
        (r.donor_description && r.donor_description.toLowerCase().includes(q));
      if (!matchQ) return false;

      if (selectedDate) {
        const dd =
          r.acquisition_date || r.metadata_updated_at || r.updated_at || r.created_at || r.date_of_creation;
        if (!dd || !sameDay(dd, selectedDate)) return false;
      }

      if (artifactFilter === "displayed") {
        const status = (r.display_status || "").toLowerCase();
        const onDisp = r.on_display || status.includes("display");
        if (!onDisp) return false;
      }
      return true;
    });

    let tabbed = list;
    if (activeTab === "acquired") {
      tabbed = list.filter((r) => r.contribution_type !== "lending");
    } else if (activeTab === "borrowing") {
      tabbed = list.filter((r) => r.contribution_type === "lending");
    }

    tabbed.sort(
      (a, b) => new Date(b.metadata_updated_at || b.updated_at || 0) - new Date(a.metadata_updated_at || a.updated_at || 0)
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
    const onDisplay = rows.filter((r) => r.on_display || (r.display_status || "").toLowerCase().includes("display")).length;
    const inStorage = rows.filter((r) => (r.current_location || "").toLowerCase().includes("storage")).length;
    const underMaint = rows.filter((r) => (r.maintenance_status || "").toLowerCase().includes("maintenance")).length;

    return [
      { label: "Total Artifacts", Value: String(total) },
      { label: "Acquired", Value: String(acquired) },
      { label: "Borrowing", Value: String(borrowing) },
      { label: "Under Maintenance", Value: String(underMaint) },
      { label: "On Display", Value: String(onDisplay) },
      { label: "In Storage", Value: String(inStorage) },
    ];
  }, [rows]);

  return (
    <>
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
