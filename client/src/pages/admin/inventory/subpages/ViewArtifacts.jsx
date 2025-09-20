import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// ✅ same components your Acquisition page uses
import Breadcrumb from "../../../../components/Breadcrumb";
import {
  RenderRelatedDocs,
  RenderArtifactImageAndDonatorInfo,
  OptionsPanel,
} from "../../acquisition/components/ViewPageRenderer";
import ArtifactDetailsShell from "../../acquisition/layouts/ArtifactDetailsShell";

// ✅ maintenance form (replacing the old metadata form)
import ArtifactMaintenanceForm from "../components/ArtifactMaintenanceForm";

// local inventory piece
import MaintenanceReportCard from "../components/MaintenanceReportCard";

// ✅ network + helpers
import axiosClient from "@/lib/axiosClient";
import { decodeBase64 } from "@/utils/base64";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

function extractContributionIdFromPath(pathname) {
  const segments = pathname.split("/");
  const last = segments[segments.length - 1] || "";

  // Try base64-encoded "ID ..." (same pattern used in AcquisitionViewPage)
  try {
    const decoded = decodeBase64(last);
    if (decoded && typeof decoded === "string") {
      const [id] = decoded.split(" ");
      if (id) return id;
    }
  } catch {
    // ignore; fall back to raw
  }
  // Fallback: use the raw last segment if it looks like an id
  return last;
}

export default function ViewArtifacts() {
  const location = useLocation();

  // data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contributionData, setContributionData] = useState(null);

  // tabs
  const [activeTab, setActiveTab] = useState("Artifact Information");
  const TABS = ["Artifact Information", "Maintenance Report"];

  // report editor state (your existing MaintenanceReportCard)
  const [maintReport1, setMaintReport1] = useState({
    id: "",
    personResponsible: "",
    actionTaken: "",
    dateStart: "",
    dateEnd: "",
    dimL: "",
    dimW: "",
    dimH: "",
    storage: "",
    responsiblePersonnel: "",
    initialCondition: "",
    damages: "",
    environment: "",
    imgBefore: null,
    imgAfter: null,
    preventive: "",
    remarks: "",
  });

  // ✅ maintenance editing (replaces old metadata form state)
  const [maintenance, setMaintenance] = useState({
    status: "", // "On Display" | "In Maintenance" (snake_case accepted by the form too)
    maintenanceDescription: "",
    damageImages: [],
  });

  // (Optional) keep curatorial description on the right panel
  const [curatorialDesc, setCuratorialDesc] = useState("");

  // --------------------- Fetch (same controller as Acquisition page) ---------------------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const id = extractContributionIdFromPath(location.pathname);
        if (!id) throw new Error("Invalid contribution id in URL");

        // main fetch (ContributionController.getContributionById)
        const { data } = await axiosClient.get(`/auth/contributions/${id}`);
        setContributionData(data);

        // If you already store maintenance data server-side, hydrate here (example):
        // const m = await axiosClient.get(`/auth/contributions/${data?.contribution_id}/maintenance`);
        // setMaintenance({
        //   status: m.data?.status ?? "",
        //   maintenanceDescription: m.data?.description ?? "",
        //   damageImages: m.data?.damage_images ?? [],
        // });
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
            `${contributor?.first_name ?? ""} ${contributor?.last_name ?? ""}`.trim() || "Not provided",
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
      {/* --- Tabs (preview-style) --- */}
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

      {/* ====================== ARTIFACT INFORMATION — same design as acquisition ====================== */}
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
          /* ✅ Replaced the metadata form with the maintenance form */
          middle={
            <ArtifactMaintenanceForm value={maintenance} onChange={setMaintenance} />
          }
          right={
            <div className="w-full h-full flex flex-col gap-4 pr-6">
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
                  {/* Adapted arrays to acquisition renderer props */}
                  <RenderRelatedDocs
                    relatedImages={relatedImages}
                    attachedFiles={attachedFiles}
                    containerHeight="h-full"
                    imageBoxWidth="w-[29rem]"
                    fileBoxWidth="w-[17rem]"
                    imgHeight="h-52"
                  />
                </div>

                <OptionsPanel
                  onEdit={() => {
                    // optional: toggle edit mode, etc.
                  }}
                  onSave={async () => {
                    // Wire this to your maintenance endpoint when ready (example below).
                    // Keeping it as a console.log to avoid 404s if the route doesn't exist yet.
                    //
                    // const id = contributionData?.contribution_id;
                    // await axiosClient.post(`/auth/contributions/${id}/maintenance`, {
                    //   status: maintenance.status,
                    //   description: maintenance.maintenanceDescription,
                    //   damage_images: maintenance.damageImages,
                    //   curatorial_description: curatorialDesc,
                    // });
                    console.log("Save maintenance", {
                      maintenance,
                      curatorialDesc,
                      contributionId: contributionData?.contribution_id,
                    });
                    alert("Maintenance data not yet wired to API. See console for payload.");
                  }}
                  onComplete={async () => {
                    // Optional finalize behavior for maintenance
                    console.log("Complete maintenance", {
                      maintenance,
                      curatorialDesc,
                      contributionId: contributionData?.contribution_id,
                    });
                    alert("Finalize maintenance (stub). Wire to API when available.");
                  }}
                />
              </div>
            </div>
          }
        />
      )}

      {/* ====================== MAINTENANCE REPORT TAB ====================== */}
      {activeTab === "Maintenance Report" && (
        <div className="w-full h-full grid grid-cols-[43rem_1fr] items-start">
          {/* LEFT: black rail (fixed height, won’t stretch) */}
          <div className="col-span-1 relative overflow-visible self-start h-full">
            <div className="absolute inset-x-0 -top-full -bottom-[1.2rem] bg-black" aria-hidden />
          </div>

          <div>
            <div className="w-full h-20 rounded-r-2xl bg-[#1D1911] flex items-center justify-start pl-12">
              <span className="text-3xl font-bold font-hind text-white tracking-wide">
                Maintenance record
              </span>
            </div>

            {/* RIGHT: card content */}
            <div className="h-full col-span-1 flex-1 px-1 sm:px-2 pt-4">
              <MaintenanceReportCard
                title="Report 1"
                report={maintReport1}
                onChange={setMaintReport1}
                defaultOpen
              />
            </div>

            <div className="w-full">{/* spacer */}</div>
          </div>
        </div>
      )}
    </div>
  );
}
