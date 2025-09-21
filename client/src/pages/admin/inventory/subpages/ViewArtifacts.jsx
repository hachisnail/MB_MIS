

// src/pages/admin/inventory/pages/ViewArtifacts.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// ✅ same components your Acquisition page uses
import Breadcrumb from "../../../../components/Breadcrumb";
import {
  RenderRelatedDocs,
  RenderArtifactImageAndDonatorInfo,
} from "../../acquisition/components/ViewPageRenderer";
import ArtifactDetailsShell from "../../acquisition/layouts/ArtifactDetailsShell";

// ✅ maintenance form (read-only view of status + carousel)
import ArtifactMaintenanceForm from "../components/ArtifactMaintenanceForm";

// local inventory piece
import MaintenanceReportCard from "../components/MaintenanceReportCard";

// ✅ network + helpers
import axiosClient from "@/lib/axiosClient";
import { decodeBase64 } from "@/utils/base64";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/* ---------------- helpers for mapping/formatting ---------------- */
function extractContributionIdFromPath(pathname) {
  const segments = pathname.split("/");
  const last = segments[segments.length - 1] || "";
  try {
    const decoded = decodeBase64(last);
    if (decoded && typeof decoded === "string") {
      const [id] = decoded.split(" ");
      if (id) return id;
    }
  } catch {}
  return last;
}

const toDateOnly = (v) => {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseMaybeJSON = (raw, fallback) => {
  if (!raw) return fallback;
  if (Array.isArray(raw) || typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return fallback; }
};

// maps API (snake_case) → editor (camelCase) shape for the MaintenanceReportCard
const mapLatestToEditor = (r, serverUrl) => {
  const dims = parseMaybeJSON(r?.dimensions, []);
  const before = parseMaybeJSON(r?.img_before, []);
  const after  = parseMaybeJSON(r?.img_after,  []);
  const imgUrl = (f) => `${serverUrl}/uploads/private/pictures/${f}`;

  return {
    personResponsible:    r?.person_responsible || "",
    actionTaken:          r?.action_taken || "",
    dateStart:            toDateOnly(r?.date_start),
    dateEnd:              toDateOnly(r?.date_end),
    dimensions:           Array.isArray(dims) ? dims : [],
    storage:              r?.storage || "",
    responsiblePersonnel: r?.responsible_personnel || "",
    initialCondition:     r?.initial_condition || "",
    damages:              r?.damages || "",
    environment:          r?.environment || "",
    imgBefore:            (before || []).map(imgUrl),
    imgAfter:             (after  || []).map(imgUrl),
    preventive:           r?.preventive || "",
    remarks:              r?.remarks || "",
  };
};
/* ---------------------------------------------------------------- */

export default function ViewArtifacts() {
  const location = useLocation();

  // data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contributionData, setContributionData] = useState(null);

  // tabs
  const [activeTab, setActiveTab] = useState("Artifact Information");
  const TABS = ["Artifact Information", "Maintenance Report"];

  // report editor state (uses dimensions array)
  const [maintReport1, setMaintReport1] = useState({
    personResponsible: "",
    actionTaken: "",
    dateStart: "",
    dateEnd: "",
    dimensions: [{ L: "", W: "", H: "" }], // array rows
    storage: "",
    responsiblePersonnel: "",
    initialCondition: "",
    damages: "",
    environment: "",
    imgBefore: [], // File[] or string[]
    imgAfter: [],  // File[] or string[]
    preventive: "",
    remarks: "",
  });

  // errors for report form
  const [reportErrors, setReportErrors] = useState({});

  // maintenance viewer (status + description + carousel)
  const [maintenance, setMaintenance] = useState({
    status: "",
    maintenanceDescription: "",
    damageImages: [],
  });

  // sliding panel open/close
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // --------------------- Fetch ---------------------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const id = extractContributionIdFromPath(location.pathname);
        if (!id) throw new Error("Invalid contribution id in URL");

        const { data } = await axiosClient.get(`/auth/contributions/${id}`);
        setContributionData(data);

        // Hydrate read-only maintenance viewer + prefill editor from latest
        const latest = await axiosClient.get(
          `/auth/contributions/${data?.contribution_id}/maintenance/latest`
        );
        const r = latest.data;

        if (r) {
          // read-only block
          setMaintenance({
            status: "Completed", // or any status you want to display
            maintenanceDescription: r.action_taken || "",
            damageImages: (parseMaybeJSON(r.img_before, []) || []).map(
              (f) => `${SERVER_URL}/uploads/private/pictures/${f}`
            ),
          });

          // prefill editor — only if user hasn't typed yet
          setMaintReport1((prev) => {
            const untouched =
              !prev.personResponsible &&
              !prev.actionTaken &&
              !prev.dateStart &&
              !prev.dateEnd &&
              (!prev.dimensions || prev.dimensions.every(d => !d.L && !d.W && !d.H)) &&
              !prev.storage &&
              !prev.responsiblePersonnel &&
              !prev.initialCondition &&
              !prev.damages &&
              !prev.environment &&
              (!prev.imgBefore?.length) &&
              (!prev.imgAfter?.length) &&
              !prev.preventive &&
              !prev.remarks;

            if (!untouched) return prev; // keep user's in-progress edits
            return { ...prev, ...mapLatestToEditor(r, SERVER_URL) };
          });
        }
      } catch (e) {
        console.error("Error fetching contribution:", e);
        setError(e?.response?.data?.message || e?.message || "Failed to load contribution");
        setContributionData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [location.pathname]);

  // --------------------- Derived, null-safe accessors ---------------------
  const artifact =
    contributionData?.ContributionArtifact ?? contributionData?.contributionartifact ?? null;

  const contributor =
    contributionData?.Contributor ?? contributionData?.contributor ?? null;

  // adapt images/files for the shared renderers
  const artifactImg =
    (artifact?.images ?? []).map((img, idx) => ({
      src: `${SERVER_URL}/uploads/private/pictures/${img}`,
      label: `Image ${idx + 1}`,
    }));

  const relatedImages =
    (artifact?.related_images ?? []).map((img, idx) => ({
      key: String(idx),
      src: `${SERVER_URL}/uploads/private/pictures/${img}`,
      label: img || `Image ${idx + 1}`,
    }));

  const attachedFiles =
    (artifact?.documents ?? []).map((doc, idx) => ({
      key: String(idx),
      filename: doc || `File ${idx + 1}`,
      category: "file",
      url: `${SERVER_URL}/uploads/private/files/${doc}`,
    }));

  // donor info
  const donatorInformation = contributor
    ? [
        {
          label: "From",
          value:
            `${contributor?.first_name ?? ""} ${contributor?.last_name ?? ""}`.trim() ||
            "Not provided",
        },
        { label: "Email", value: contributor?.email || "Not provided" },
        { label: "Phone Number", value: contributor?.phone_number || "Not provided" },
        {
          label: "Address",
          value:
            [contributor?.street, contributor?.barangay, contributor?.city, contributor?.province]
              .filter(Boolean)
              .join(", ") || "Not provided",
        },
        { label: "Organization", value: contributor?.organization || "Not provided" },
      ]
    : [];

  // --------------------- Validation (report) ---------------------
  const validateForm = (d) => {
    const errors = {};

    if (!d.personResponsible?.trim()) errors.personResponsible = "Person responsible is required";
    if (!d.actionTaken?.trim()) errors.actionTaken = "Action taken is required";
    if (!d.dateStart) errors.dateStart = "Start date is required";
    if (!d.dateEnd) errors.dateEnd = "End date is required";

    if (d.dateStart && d.dateEnd) {
      try {
        const start = new Date(`${d.dateStart}T00:00:00`);
        const end = new Date(`${d.dateEnd}T23:59:00`);
        if (!(start instanceof Date) || isNaN(start)) errors.dateStart = "Invalid start date";
        if (!(end instanceof Date) || isNaN(end)) errors.dateEnd = "Invalid end date";
        if (!errors.dateStart && !errors.dateEnd && end <= start) {
          errors.dateEnd = "End must be after Start";
        }
      } catch {}
    }

    const dims = Array.isArray(d.dimensions) ? d.dimensions : [];
    const anyDimProvided = dims.some((r) => (r?.L || r?.W || r?.H));
    if (anyDimProvided) {
      const incomplete = dims.some((r) => !(r?.L && r?.W && r?.H));
      if (incomplete) errors.dimensions = "Please complete L/W/H for each dimension row you added.";
    }
    return errors;
  };

  // --------------------- Submit to API (Report) ---------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Report Submit] start");

    const newErrors = validateForm(maintReport1);
    if (Object.keys(newErrors).length > 0) {
      console.log("[Report Submit] validation failed", newErrors);
      setReportErrors(newErrors);
      alert(
        "Please fix errors:\n" + Object.values(newErrors).map((m) => `• ${m}`).join("\n")
      );
      return;
    }

    const formData = new FormData();

    // ensure multer writes into /uploads/private/pictures if your route honors `category`
    formData.append("category", "private");

    formData.append("person_responsible", maintReport1.personResponsible);
    formData.append("action_taken", maintReport1.actionTaken);
    formData.append("date_start", maintReport1.dateStart);
    formData.append("date_end", maintReport1.dateEnd);

    formData.append("dimensions", JSON.stringify(maintReport1.dimensions || []));

    formData.append("storage", maintReport1.storage || "");
    formData.append("responsible_personnel", maintReport1.responsiblePersonnel || "");
    formData.append("initial_condition", maintReport1.initialCondition || "");
    formData.append("damages", maintReport1.damages || "");
    formData.append("environment", maintReport1.environment || "");
    formData.append("preventive", maintReport1.preventive || "");
    formData.append("remarks", maintReport1.remarks || "");

    const appendFiles = (filesOrUrls, field) => {
      const arr = Array.isArray(filesOrUrls) ? filesOrUrls : (filesOrUrls ? [filesOrUrls] : []);
      const urls = [];
      arr.forEach((item) => {
        if (item instanceof File) {
          formData.append(field, item);
        } else if (typeof item === "string") {
          urls.push(item);
        }
      });
      if (urls.length) formData.append(`${field}_urls`, JSON.stringify(urls));
    };

    appendFiles(maintReport1.imgBefore, "imgBefore");
    appendFiles(maintReport1.imgAfter, "imgAfter");

    try {
      const id = contributionData?.contribution_id;
      const { data } = await axiosClient.post(
        `/auth/contributions/${id}/maintenance/report`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("[Report Submit] created", data);
      setReportErrors({});
      alert("Maintenance report saved.");

      // after save, refetch latest & refresh viewer + editor
      try {
        const latest = await axiosClient.get(
          `/auth/contributions/${id}/maintenance/latest`
        );
        const r = latest.data;
        if (r) {
          setMaintenance({
            status: "Completed",
            maintenanceDescription: r.action_taken || "",
            damageImages: (parseMaybeJSON(r.img_before, []) || []).map(
              (f) => `${SERVER_URL}/uploads/private/pictures/${f}`
            ),
          });
          setMaintReport1((prev) => ({ ...prev, ...mapLatestToEditor(r, SERVER_URL) }));
        }
      } catch {}
    } catch (err) {
      console.error("[Report Submit] submit failed", err?.response?.data || err?.message);
      alert("Failed to save maintenance report.");
    } finally {
      console.log("[Report Submit] finished");
    }
  };

  // --------------------- UI guards ---------------------
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span>Loading…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-600">
        <span>{error}</span>
      </div>
    );
  }
  if (!contributionData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
        <span>No contribution data found or invalid ID.</span>
      </div>
    );
  }

  // --------------------- Render ---------------------
  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* --- Tabs --- */}
      <div className="w-full flex items-end justify-end gap-3 mb-4">
        {TABS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(label)}
            className={`w-[12rem] h-[3rem] flex items-center justify-center rounded-md border-[3px] text-2xl font-bold transition-colors ${
              activeTab === label
                ? "bg-black border-black text-[#CDC469]"
                : "border-black text-black hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ====================== ARTIFACT INFORMATION ====================== */}
      {activeTab === "Artifact Information" && (
        <ArtifactDetailsShell
          left={
            <>
              <div className="absolute left-0 -top-[12rem] w-full h-[12rem] bg-black flex items-start justify-end pl-10 pb-5 pt-4 overflow-hidden flex-col">
                <span className="text-white text-3xl font-bold text-left break-words line-clamp-3 max-w-[38rem]">
                  {artifact?.title || "Artifact Title"}
                </span>
                <Breadcrumb hideTitle={true} overrideTheme="text-white" />
              </div>

              <RenderArtifactImageAndDonatorInfo
                donatorInformation={donatorInformation}
                artifactImg={artifactImg}
              />

              <div className="absolute left-0 -bottom-[1.2rem] w-full h-[1.2rem] bg-black" />
            </>
          }
          // ✅ read-only maintenance viewer (no buttons here)
          middle={<ArtifactMaintenanceForm value={maintenance} onChange={setMaintenance} />}
          right={
            <div className="w-full h-full flex flex-col gap-4 pr-6 relative">
              <div className="flex-1 min-h-0 rounded-lg border border-gray-300 p-6 flex flex-col">
                <span className="text-4xl font-bold">Artifact Description</span>
                <div className="mt-3 flex-1 min-h-0">
                  <div className="w-full h-full rounded-md border border-gray-300 p-3 overflow-auto bg-white">
                    {artifact?.description && artifact.description.trim() ? (
                      <p className="whitespace-pre-wrap text-lg text-[#1D1911]">
                        {artifact.description}
                      </p>
                    ) : (
                      <span className="text-gray-500 italic">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex gap-4">
                <div className="flex-1 min-h-0 min-w-0">
                  <RenderRelatedDocs
                    relatedImages={relatedImages}
                    attachedFiles={attachedFiles}
                    containerHeight="h-full"
                    imageBoxWidth="w-[29rem]"
                    fileBoxWidth="w-[17rem]"
                    imgHeight="h-52"
                  />
                </div>
              </div>

              {/* Sliding panel (unchanged) */}
              <div
                className={`absolute top-0 right-0 w-full h-[60rem] bg-white border-2 border-[#1D1911] rounded-l-3xl z-20 transform transition-transform duration-500 ${
                  isPanelOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <button
                  onClick={() => setIsPanelOpen((prev) => !prev)}
                  className={`absolute -bottom-[9.5rem] -translate-y-1/2 ${
                    isPanelOpen ? "-left-[5rem] w-[5rem]" : "-left-[8rem] w-[8rem]"
                  } h-[32rem] bg-[#1D1911] rounded-tl-2xl rounded-bl-2xl text-white font-bold shadow-lg z-30 flex items-center justify-center transition-all duration-500`}
                >
                  <div className="flex flex-col items-center justify-center gap-4 transform -rotate-90">
                    {isPanelOpen ? (
                      <span className="flex items-center gap-12 text-3xl font-bold tracking-wide w-[24rem] ">
                        Artifact Information
                        <span
                          className={`inline-block transform transition-transform duration-500 ${
                            isPanelOpen ? "-rotate-90" : "rotate-90"
                          }`}
                        >
                          ⟨
                        </span>
                      </span>
                    ) : (
                      <div className="flex flex-col items-center text-3xl font-hind font-bold leading-tight w-[24rem]">
                        <span className="mb-2">Click to Show</span>
                        <span className="flex items-center gap-12">
                          Artifact Information
                          <span
                            className={`inline-block transform transition-transform duration-500 ${
                              isPanelOpen ? "-rotate-90" : "rotate-90"
                            }`}
                          >
                            ⟨
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                <div className="w-full h-full flex flex-col p-4 overflow-auto">
                  <div className="w-full h-[24rem] bg-amber-200"></div>
                  <div className="w-full h-[20rem] bg-blue-200"></div>
                  <div className="w-full h-[22rem] bg-red-200"></div>
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* ====================== MAINTENANCE REPORT TAB ====================== */}
      {activeTab === "Maintenance Report" && (
        <div className="w-full h-full grid grid-cols-[43rem_1fr] items-start relative">
          {/* LEFT: black rail */}
          <div className="col-span-1 relative overflow-visible self-start h-full">
            <div className="absolute inset-x-0 -top-full -bottom-[1.2rem] bg-black" aria-hidden />
          </div>

          <div className="relative">
            <div className="w-full h-20 rounded-r-2xl bg-[#1D1911] flex items-center justify-start pl-12">
              <span className="text-3xl font-bold font-hind text-white tracking-wide">
                Maintenance record
              </span>
            </div>

            {/* RIGHT: card content — your form stays exactly as requested */}
            <form className="h-full col-span-1 flex-1 px-1 sm:px-2 pt-4" onSubmit={handleSubmit}>
              <MaintenanceReportCard
                title="Report 1"
                report={maintReport1}
                onChange={setMaintReport1}
                defaultOpen
                errors={reportErrors}
              />

              {/* Footer actions */}
              <div className="w-full flex items-center justify-between px-0 py-4">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-[#CDC469] text-[#1D1911] text-lg font-bold hover:brightness-95 border border-[#1D1911]"
                >
                  Submit Report
                </button>

                <button
                  type="button"
                  onClick={() => {
                    console.log("Start Maintenance clicked", maintReport1);
                    alert("Starting maintenance… (stub)");
                  }}
                  className="px-6 py-3 rounded-lg bg-[#1D1911] text-white text-lg font-bold hover:bg-black"
                >
                  Start Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


