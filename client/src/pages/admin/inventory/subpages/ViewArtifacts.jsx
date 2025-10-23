// src/pages/admin/inventory/subpages/ViewArtifacts.jsx
import { useState, useEffect, Fragment } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import Breadcrumb from "../../../../components/Breadcrumb";
import {
  RenderRelatedDocs,
  RenderArtifactImageAndDonatorInfo,
} from "../../acquisition/components/ViewPageRenderer";
import ArtifactDetailsShell from "../../acquisition/layouts/ArtifactDetailsShell";
import ArtifactMaintenanceForm from "../components/ArtifactMaintenanceForm";
import MaintenanceReportCard from "../components/MaintenanceReportCard";
import axiosClient from "@/lib/axiosClient";
import { decodeBase64 } from "@/utils/base64";
import PopupModal from "@/components/modals/PopupModal";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

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
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const mapLatestToEditor = (r, serverUrl) => {
  const dims = parseMaybeJSON(r?.dimensions, []);
  const before = parseMaybeJSON(r?.img_before, []);
  const after = parseMaybeJSON(r?.img_after, []);
  const imgUrl = (f) => `${serverUrl}/uploads/private/pictures/${f}`;
  return {
    id: r?.id || null,
    personResponsible: r?.person_responsible || "",
    actionTaken: r?.action_taken || "",
    dateStart: toDateOnly(r?.date_start),
    dateEnd: toDateOnly(r?.date_end),
    dimensions: Array.isArray(dims) ? dims : [],
    storage: r?.storage || "",
    responsiblePersonnel: r?.responsible_personnel || "",
    initialCondition: r?.initial_condition || "",
    damages: r?.damages || "",
    environment: r?.environment || "",
    imgBefore: (before || []).map(imgUrl),
    imgAfter: (after || []).map(imgUrl),
    preventive: r?.preventive || "",
    remarks: r?.remarks || "",
    finalLocation: r?.final_location || "",
    isSubmitted: true,
  };
};

function maintenanceFromReport(r) {
  if (!r) return { status: "", maintenanceDescription: "", damageImages: [] };
  const before = parseMaybeJSON(r.img_before, []);
  const after = parseMaybeJSON(r.img_after, []);
  const mkSlides = (files = [], labelPrefix) =>
    (files || []).map((f, i) => ({
      src: `${SERVER_URL}/uploads/private/pictures/${f}`,
      label: `${labelPrefix} ${i + 1}`,
    }));
  return {
    status: "Completed",
    maintenanceDescription: r.action_taken || "",
    damageImages: [...mkSlides(before, "Before"), ...mkSlides(after, "After")],
  };
}

const TABS = ["Artifact Information", "Maintenance Report"];

// localStorage draft helpers
function draftKey(artifactId, sessionId) {
  return `maintenanceForm-${artifactId}-${sessionId}`;
}
function loadDraft(artifactId, sessionId) {
  if (!artifactId || !sessionId) return null;
  const raw = localStorage.getItem(draftKey(artifactId, sessionId));
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function removeDraft(artifactId, sessionId) {
  if (!artifactId || !sessionId) return;
  localStorage.removeItem(draftKey(artifactId, sessionId));
}

function InventoryTabs({ labels = TABS, active, onChange }) {
  return (
    <div className="w-full h-full flex items-end justify-end gap-3 mb-4">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange?.(label)}
          className={`w-[12rem] h-[3rem] flex items-center justify-center rounded-md border-[3px] text-2xl font-bold transition-colors ${
            active === label
              ? "bg-black border-black text-[#CDC469]"
              : "border-black text-black hover:bg-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ViewArtifacts() {
  const location = useLocation();
  const { setExtraBlockContent } = useOutletContext();

  // states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contributionData, setContributionData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [activeTab, setActiveTab] = useState("Artifact Information");

  // completed reports from server
  const [maintenanceReports, setMaintenanceReports] = useState([]);
  const [reportErrors, setReportErrors] = useState({});

  // active maintenance session (object returned by server) and draft
  const [openMaintenanceSession, setOpenMaintenanceSession] = useState(null);
  const [draftReport, setDraftReport] = useState(null);

  // maintenance viewer (read-only)
  const [maintenance, setMaintenance] = useState({
    status: "",
    maintenanceDescription: "",
    damageImages: [],
  });

  // sliding panel open/close
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // maintenance session state (whether a session is currently active)
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
    buttonText: "Okay",
  });

  const createEmptyReport = () => ({
    id: null,
    personResponsible: "",
    actionTaken: "",
    dateStart: "",
    dateEnd: "",
    dimensions: [{ L: "", W: "", H: "" }],
    storage: "",
    responsiblePersonnel: "",
    initialCondition: "",
    damages: "",
    environment: "",
    imgBefore: [],
    imgAfter: [],
    preventive: "",
    remarks: "",
    finalLocation: "",
    isSubmitted: false,
  });

  useEffect(() => {
    if (typeof setExtraBlockContent === "function") {
      if (contributionData) {
        setExtraBlockContent(
          <InventoryTabs labels={TABS} active={activeTab} onChange={setActiveTab} />
        );
      } else {
        setExtraBlockContent(null);
      }
      return () => setExtraBlockContent(null);
    }
  }, [setExtraBlockContent, contributionData, activeTab]);

  // fetch function: load contribution, reports, latest, metadata and open session
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const id = extractContributionIdFromPath(location.pathname);
        if (!id) throw new Error("Invalid contribution id in URL");

        const { data } = await axiosClient.get(`/auth/contributions/${id}`);
        setContributionData(data);

        // fetch reports
        try {
          const reportsRes = await axiosClient.get(
            `/auth/contributions/${data?.contribution_id}/maintenance/reports`
          );
          const existingReports = (reportsRes.data || []).map((r) =>
            mapLatestToEditor(r, SERVER_URL)
          );
          setMaintenanceReports(existingReports);
        } catch {
          setMaintenanceReports([]);
        }

        // latest maintenance viewer
        try {
          const latest = await axiosClient.get(
            `/auth/contributions/${data?.contribution_id}/maintenance/latest`
          );
          setMaintenance(maintenanceFromReport(latest.data));
        } catch {
          setMaintenance(maintenanceFromReport(null));
        }

        // metadata
        try {
          const metaRes = await axiosClient.get(
            `/auth/contributions/${data?.contribution_id}/metadata`
          );
          const joined = metaRes?.data || {};
          const m =
            joined?.ArtifactMetadata ||
            joined?.artifactMetadata ||
            joined?.metadata ||
            joined ||
            null;
          setMetadata(m);
        } catch {
          setMetadata(null);
        }

        // check open session and initialize draft (separate from completed reports)
        try {
          const sessionRes = await axiosClient.get(
            `/auth/contributions/${data?.contribution_id}/maintenance/open`
          );
          if (sessionRes.data) {
            setOpenMaintenanceSession(sessionRes.data);
            // restore draft from localStorage if present
            const artifactId = data?.ContributionArtifact?.artifact_id || data?.contributionartifact?.id || data?.contribution_id;
            const saved = loadDraft(artifactId, sessionRes.data.session_id);
            setDraftReport(saved || createEmptyReport());
          } else {
            setOpenMaintenanceSession(null);
            setDraftReport(null);
          }
        } catch {
          setOpenMaintenanceSession(null);
          setDraftReport(null);
        }
      } catch (e) {
        console.error("Error fetching contribution:", e);
        setError(e?.response?.data?.message || e?.message || "Failed to load contribution");
        setContributionData(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // derived artifact/contributor
  const artifact =
    contributionData?.ContributionArtifact ?? contributionData?.contributionartifact ?? null;
  const contributor =
    contributionData?.Contributor ?? contributionData?.contributor ?? null;

  // images/files helpers unchanged...
  const artifactImg = (artifact?.images ?? []).map((img, idx) => ({
    src: `${SERVER_URL}/uploads/private/pictures/${img}`,
    label: `Image ${idx + 1}`,
  }));

  const relatedImages = (artifact?.related_images ?? []).map((img, idx) => ({
    key: String(idx),
    src: `${SERVER_URL}/uploads/private/pictures/${img}`,
    label: img || `Image ${idx + 1}`,
  }));

  const attachedFiles = (artifact?.documents ?? []).map((doc, idx) => {
    const lower = (doc || "").toLowerCase();
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(lower);
    return {
      key: String(idx),
      filename: doc || `File ${idx + 1}`,
      category: "file",
      url: isImage
        ? `${SERVER_URL}/uploads/private/pictures/${doc}`
        : `${SERVER_URL}/uploads/private/files/${doc}`,
    };
  });

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

  // start maintenance: call start endpoint then refresh open session + draft
  const handleStartMaintenance = async () => {
    if (!contributionData?.contribution_id) {
      setModalConfig({
        title: "Error",
        message: "No contribution ID available",
        type: "danger",
      });
      setIsModalOpen(true);
      return;
    }
    try {
      await axiosClient.post(
        `/auth/contributions/${contributionData.contribution_id}/maintenance/start`
      );
      // after starting, request open session to get session id
      const sessionRes = await axiosClient.get(
        `/auth/contributions/${contributionData.contribution_id}/maintenance/open`
      );
      if (sessionRes.data) {
        setOpenMaintenanceSession(sessionRes.data);
        const artifactId = artifact?.artifact_id || artifact?.id || contributionData?.contribution_id;
        const saved = loadDraft(artifactId, sessionRes.data.session_id);
        setDraftReport(saved || createEmptyReport());
        setIsMaintenanceActive(true);
        setModalConfig({
          title: "Success",
          message: "Maintenance session started successfully.",
          type: "info",
        });
        setIsModalOpen(true);
      } else {
        setOpenMaintenanceSession(null);
        setDraftReport(null);
        setIsMaintenanceActive(false);
      }
      setMaintenance((prev) => ({ ...prev, status: "In Maintenance" }));
    } catch (error) {
      console.error("Failed to start maintenance:", error);
      setModalConfig({
        title: "Error",
        message: error?.response?.data?.message || "Failed to start maintenance session",
        type: "danger",
      });
      setIsModalOpen(true);
    }
  };

  const handleLocationUpdate = async (contributionId, newLocation) => {
    try {
      await axiosClient.patch(`/auth/contributions/${contributionId}/location`, {
        location: newLocation,
      });
      setContributionData((prev) => {
        if (!prev) return prev;
        const art = prev.ContributionArtifact || prev.contributionartifact;
        if (art) {
          return {
            ...prev,
            ContributionArtifact: {
              ...art,
              current_location: newLocation,
            },
            contributionartifact: {
              ...art,
              current_location: newLocation,
            },
          };
        }
        return prev;
      });
    } catch (error) {
      console.error("Failed to update location:", error);
      throw error;
    }
  };

  // update existing completed report at index
  const updateReport = (index, updatedReport) => {
    setMaintenanceReports((prev) => {
      const newReports = [...prev];
      newReports[index] = updatedReport;
      return newReports;
    });
  };

  // update draft (session) - separate from maintenanceReports
  const updateDraft = (updatedDraft) => {
    setDraftReport(updatedDraft);
    // persist into localStorage using artifactId and sessionId
    const artifactId = artifact?.artifact_id || artifact?.id || contributionData?.contribution_id;
    if (openMaintenanceSession?.session_id) {
      try {
        localStorage.setItem(draftKey(artifactId, openMaintenanceSession.session_id), JSON.stringify(updatedDraft));
      } catch {}
    }
  };

  // edit action for completed reports (keeps them editable)
  const handleReportEdit = (index) => {
    setMaintenanceReports((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isSubmitted: false } : r))
    );
  };

  // submit report: if draft (sessionId present) treat specially
  const handleReportSubmit = async (reportData, options = {}) => {
    const targetSessionId = options.sessionId || openMaintenanceSession?.session_id;
    const newErrors = validateForm(reportData);
    if (Object.keys(newErrors).length > 0) {
      setReportErrors(newErrors);
      setModalConfig({
        title: "Validation Error",
        message:
          "Please fix the following errors:\n" +
          Object.values(newErrors).map((m) => `• ${m}`).join("\n"),
        type: "warning",
      });
      setIsModalOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("category", "private");
    formData.append("person_responsible", reportData.personResponsible);
    formData.append("action_taken", reportData.actionTaken);
    formData.append("date_start", reportData.dateStart);
    formData.append("date_end", reportData.dateEnd);
    formData.append("dimensions", JSON.stringify(reportData.dimensions || []));
    formData.append("storage", reportData.storage || "");
    formData.append("responsible_personnel", reportData.responsiblePersonnel || "");
    formData.append("initial_condition", reportData.initialCondition || "");
    formData.append("damages", reportData.damages || "");
    formData.append("environment", reportData.environment || "");
    formData.append("preventive", reportData.preventive || "");
    formData.append("remarks", reportData.remarks || "");
    formData.append("finalLocation", reportData.finalLocation || "");

    const appendFiles = (filesOrUrls, field) => {
      const arr = Array.isArray(filesOrUrls) ? filesOrUrls : filesOrUrls ? [filesOrUrls] : [];
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
    appendFiles(reportData.imgBefore, "imgBefore");
    appendFiles(reportData.imgAfter, "imgAfter");

    try {
      const id = contributionData?.contribution_id;
      await axiosClient.post(`/auth/contributions/${id}/maintenance/complete`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // If this was a draft for an open session, clear draft and session
      if (targetSessionId) {
        const artifactId = artifact?.artifact_id || artifact?.id || contributionData?.contribution_id;
        removeDraft(artifactId, targetSessionId);
        setDraftReport(null);
        setOpenMaintenanceSession(null);
      }

      // refresh reports from server
      try {
        const reportsRes = await axiosClient.get(`/auth/contributions/${id}/maintenance/reports`);
        if (reportsRes.data) {
          setMaintenanceReports(reportsRes.data.map((r) => mapLatestToEditor(r, SERVER_URL)));
        }
      } catch (err) {
        console.error("Failed to refresh reports:", err);
      }

      setIsMaintenanceActive(false);
      setReportErrors({});
      setModalConfig({
        title: "Success",
        message: "Maintenance completed successfully! Artifact location updated.",
        type: "info",
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error("[Report Submit] submit failed", err?.response?.data || err?.message);
      setModalConfig({
        title: "Error",
        message: "Failed to save maintenance report.",
        type: "danger",
      });
      setIsModalOpen(true);
    }
  };

  // simple validation used above
  const validateForm = (d) => {
    const errors = {};
    if (!d.personResponsible?.trim())
      errors.personResponsible = "Person responsible is required";
    if (!d.actionTaken?.trim()) errors.actionTaken = "Action taken is required";
    if (!d.dateStart) errors.dateStart = "Start date is required";
    if (!d.dateEnd) errors.dateEnd = "End date is required";
    if (!d.finalLocation?.trim()) errors.finalLocation = "Final location is required";

    if (d.dateStart && d.dateEnd) {
      try {
        const start = new Date(`${d.dateStart}T00:00:00+08:00`);
        const end = new Date(`${d.dateEnd}T23:59:00+08:00`);
        if (!(start instanceof Date) || isNaN(start)) errors.dateStart = "Invalid start date";
        if (!(end instanceof Date) || isNaN(end)) errors.dateEnd = "Invalid end date";
        if (!errors.dateStart && !errors.dateEnd && end <= start) {
          errors.dateEnd = "End must be after Start";
        }
      } catch {}
    }

    const dims = Array.isArray(d.dimensions) ? d.dimensions : [];
    const anyDimProvided = dims.some((r) => r?.L || r?.W || r?.H);
    if (anyDimProvided) {
      const incomplete = dims.some((r) => !(r?.L && r?.W && r?.H));
      if (incomplete)
        errors.dimensions = "Please complete L/W/H for each dimension row you added.";
    }
    return errors;
  };

  // UI guards
  if (loading) return <div className="w-full h-full flex items-center justify-center"><span>Loading…</span></div>;
  if (error) return <div className="w-full h-full flex items-center justify-center text-red-600"><span>{error}</span></div>;
  if (!contributionData) return <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500"><span>No contribution data found or invalid ID.</span></div>;

  return (
    <div className="w-full h-full flex flex-col gap-6">
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
              <RenderArtifactImageAndDonatorInfo donatorInformation={donatorInformation} artifactImg={artifactImg} />
              <div className="absolute left-0 -bottom-[1.2rem] w-full h-[1.2rem] bg-black" />
            </>
          }
          middle={
            <ArtifactMaintenanceForm
              value={{ ...maintenance, currentLocation: artifact?.current_location || "" }}
              onChange={setMaintenance}
              contributionId={contributionData?.contribution_id}
              onLocationUpdate={handleLocationUpdate}
            />
          }
          right={
            <div className="w-full h-full flex flex-col gap-4 relative pl-20 pr-15 overflow-hidden">
              {/* description / docs / sliding panel unchanged */}
              <div className="flex-1 min-h-0 rounded-lg border border-gray-300 p-6 flex flex-col">
                <span className="text-4xl font-bold">Artifact Description</span>
                <div className="mt-3 flex-1 min-h-0">
                  <div className="w-full h-full rounded-md border border-gray-300 p-3 overflow-auto bg-white">
                    {artifact?.description && artifact.description.trim() ? (
                      <p className="whitespace-pre-wrap text-lg text-[#1D1911]">{artifact.description}</p>
                    ) : (<span className="text-gray-500 italic">Not provided</span>)}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 flex gap-4">
                <div className="flex-1 min-h-0 min-w-0">
                  <RenderRelatedDocs relatedImages={relatedImages} attachedFiles={attachedFiles} containerHeight="h-full" imageBoxWidth="w-[29rem]" fileBoxWidth="w-[17rem]" imgHeight="h-52" />
                </div>
              </div>
              <div className={`absolute top-0 right-0 w-[calc(100%-5rem)] h-full  bg-white border-2 border-[#1D1911] rounded-l-3xl z-20 transform transition-transform duration-500 ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
                <button onClick={() => setIsPanelOpen((prev) => !prev)} className={`absolute -bottom-[9.5rem] -translate-y-1/2 ${isPanelOpen ? "-left-[5rem] w-[5rem]" : "-left-[8rem] w-[8rem]"} h-[32rem] bg-[#1D1911] rounded-tl-2xl rounded-bl-2xl text-white font-bold shadow-lg z-30 flex items-center justify-center transition-all duration-500`}>
                  <div className="flex flex-col items-center justify-center gap-4 transform -rotate-90">
                    {isPanelOpen ? (
                      <span className="flex items-center gap-12 text-3xl font-bold tracking-wide w-[24rem] ">
                        Artifact Information
                        <span className={`inline-block transform transition-transform duration-500 ${isPanelOpen ? "-rotate-90" : "rotate-90"}`}>⟨</span>
                      </span>
                    ) : (
                      <div className="flex flex-col items-center text-3xl font-hind font-bold leading-tight w-[24rem]">
                        <span className="mb-2">Click to Show</span>
                        <span className="flex items-center gap-12">
                          Artifact Information
                          <span className={`inline-block transform transition-transform duration-500 ${isPanelOpen ? "-rotate-90" : "rotate-90"}`}>⟨</span>
                        </span>
                      </div>
                    )}
                  </div>
                </button>
                <div className="w-full h-full flex flex-col p-4 overflow-auto">
                  <ArtifactMetadataTable metadata={metadata} />
                </div>
              </div>
            </div>
          }
        />
      )}

      {activeTab === "Maintenance Report" && (
        <div className="w-full h-full grid grid-cols-[43rem_1fr] items-start relative pr-15">
          <div className="absolute left-0  -top-[12rem] w-[43rem] h-[12rem] bg-black flex items-start justify-end pl-10 pb-5 pt-4 overflow-hidden flex-col">
            <span className="text-white text-3xl font-bold text-left break-words line-clamp-3 max-w-[38rem]">
              {artifact?.title || "Artifact Title"}
            </span>
            <Breadcrumb hideTitle={true} overrideTheme="text-white" />
          </div>
          <div className="bg-black h-full">
            <RenderArtifactImageAndDonatorInfo donatorInformation={donatorInformation} artifactImg={artifactImg} />
          </div>
          <div className="absolute left-0 -bottom-[1.2rem] w-[43rem] h-[1.2rem] bg-black" />
          <div className="relative col-span-1">
            <div className="w-full h-20 rounded-r-2xl bg-[#1D1911] flex items-center justify-between pr-5 pl-12">
              <span className="text-3xl font-bold font-hind text-white tracking-wide">Maintenance record</span>
              <button type="button" onClick={handleStartMaintenance} disabled={isMaintenanceActive} className={`px-6 py-3 rounded-lg text-lg font-bold ${isMaintenanceActive ? "bg-gray-400 text-gray-600 cursor-not-allowed" : "bg-white text-black hover:bg-gray-400"}`}>
                {isMaintenanceActive ? "Maintenance Active" : "Start Maintenance"}
              </button>
            </div>

            <div className="h-[57rem] 3xl:h-[74rem] overflow-scroll col-span-1 flex-1 px-1 sm:px-2 pt-4">
              {/* Completed (server) reports */}
              {maintenanceReports.length === 0 && !openMaintenanceSession ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-neutral-600">
                    <p className="text-xl font-semibold">No maintenance reports yet</p>
                    <p>Click <span className="font-bold">Start Maintenance</span> to create one.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Draft/New report form at the top */}
                  {openMaintenanceSession && (
                    <MaintenanceReportCard
                      key={`draft-${openMaintenanceSession.session_id}`}
                      title={`Report ${maintenanceReports.length + 1}`}
                      report={draftReport || createEmptyReport()}
                      onChange={(updatedReport) => updateDraft(updatedReport)}
                      defaultOpen={true}
                      errors={reportErrors}
                      isSubmitted={false}
                      onEdit={() => {}}
                      onSubmit={(r) => handleReportSubmit(r, { sessionId: openMaintenanceSession.session_id })}
                      artifactId={artifact?.artifact_id || artifact?.id || contributionData?.contribution_id}
                      sessionId={openMaintenanceSession.session_id}
                    />
                  )}

                  {/* Completed reports in descending order but with ascending numbers */}
                  {[...maintenanceReports].slice().reverse().map((report, idx) => {
                    const reportNumber = idx + 1;  // This makes numbering start from 1 and go up
                    return (
                      <MaintenanceReportCard
                        key={`completed-${reportNumber}-${report.id ?? reportNumber}`}
                        title={`Report ${reportNumber}`}
                        report={report}
                        onChange={(updatedReport) => updateReport(maintenanceReports.length - idx - 1, updatedReport)}
                        defaultOpen={idx === 0 && !openMaintenanceSession}
                        errors={reportErrors}
                        isSubmitted={report.isSubmitted || true}
                        onEdit={() => handleReportEdit(maintenanceReports.length - idx - 1)}
                        onSubmit={(r) => handleReportSubmit(r)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add the modal component here */}
      <PopupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        buttonText={modalConfig.buttonText}
      />
    </div>
  );
}

/* ---------------------- Sliding panel TABLE for metadata ---------------------- */
function CellLabel({ children }) {
  return <div className="text-sm font-semibold text-neutral-700">{children}</div>;
}
function CellValue({ children }) {
  return (
    <div className="text-sm text-neutral-900 whitespace-pre-wrap">
      {children?.toString()?.trim() ? (
        children
      ) : (
        <span className="italic text-neutral-500">Not provided</span>
      )}
    </div>
  );
}

function ArtifactMetadataTable({ metadata }) {
  const m = metadata || {};
  const val = (snake, camel) => m?.[snake] ?? m?.[camel] ?? "";
  const rows = [
    {
      section: "Basic Information",
      items: [
        ["Collection Number", val("collection_number", "collectionNumber")],
        ["Date of Creation / Age", val("date_of_creation", "age")],
        ["Culture / Civilization", val("culture", "culture")],
      ],
    },
    {
      section: "Origin & Current Location",
      items: [
        ["Origin / Provenance", val("provenance", "provenance")],
        ["Current Location", val("current_location", "location")],
      ],
    },
    {
      section: "Discovery & Acquisition",
      items: [
        ["Discovery Details", val("discovery_details", "discovery")],
        ["Excavation Site", val("excavation_site", "excavationSite")],
        ["Acquisition History", val("acquisition_history", "acquisitionHistory")],
      ],
    },
    {
      section: "Curatorial",
      items: [["Curatorial Description", val("curatorial_description", "curatorialDescription")]],
    },
  ];
  return (
    <div className="w-full h-full">
      <div className="text-xl font-bold mb-3">Artifact Metadata</div>
      {!metadata && <div className="text-sm text-neutral-500 italic">No artifact metadata yet for this contribution.</div>}
      {metadata && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-2 w-64">Field</th>
                <th className="px-4 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((group, gi) => (
                <Fragment key={gi}>
                  <tr className="bg-neutral-100">
                    <td className="px-4 py-2 font-bold text-neutral-800" colSpan={2}>{group.section}</td>
                  </tr>
                  {group.items.map(([label, value], ii) => (
                    <tr key={ii} className="border-t border-neutral-200">
                      <td className="px-4 py-2 align-top"><CellLabel>{label}</CellLabel></td>
                      <td className="px-4 py-2"><CellValue>{value}</CellValue></td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
