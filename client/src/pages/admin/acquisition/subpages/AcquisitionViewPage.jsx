import { useLocation, useOutletContext } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axiosClient from "@/lib/axiosClient";
import {
  RenderRelatedDocs,
  RenderArtifactImageAndDonatorInfo,
  InfoSection,
  DonatorInfoSection,
  PreviewAbout,
  ArtifactImageGallery,
  ArtifactInfoGrid,
} from "../components/ViewPageRenderer";

import ButtonSelector from "../../../../features/ButtonSelector";
import MoaBuilder from "../components/MoaBuilder/MoaBuilder";
import MultiLineInputField from "../../../../features/MultiLineInputField";
import StyledButton from "@/components/buttons/StyledButton";

import { decodeBase64 } from "@/utils/base64";
import {
  formatDateRange,
  formatDate,
  formatDateTime,
} from "../components/formatDateRange";
import { useAuth } from "../../../../context/authContext";
import Breadcrumb from "../../../../components/Breadcrumb";
import Timeline from "../components/Timeline";
import TransactionDetailsCard from "../components/TransactionDetailsCard";
import AcquisitionDetailsSection from "../components/AcquisitionDetailsSection";

import OverviewShell from "../layouts/OverviewShell";
import DocumentShell from "../layouts/DocumentShell";
import TransactionShell from "../layouts/TransactionShell";
import ArtifactDetailsShell from "../layouts/ArtifactDetailsShell";

import ArtifactMetadataForm from "../components/ArtifactMetadataForm";
import { OptionsPanel } from "../components/ViewPageRenderer";

import ConversationTimeline from "./ConversationTimeline";

import { LoadingSpinner } from "../../../../components/commons";
import {
  Address,
  Email,
  From,
  Organization,
  PhoneNumber,
} from "../components/ViewPageSvg";

import { getMessagingClient, toTimelineItem } from "@/lib/messagingClient";

/* ---------------- Tabs (with gating support) ---------------- */

const ALL_TABS = ["Overview", "Document", "Transaction", "Artifact Details"];

function DocumentTabs({ labels = ALL_TABS, active, onChange }) {
  return (
    <div className="w-full h-full items-end justify-end flex gap-3">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(label)}
          className={`w-[12rem] h-[3rem] flex items-center justify-center rounded-md border-[3px] text-2xl font-bold cursor-pointer transition-colors
            ${
              active === label
                ? "bg-black border-black text-[#CDC469]"
                : "border-black text-black hover:bg-gray-300"
            }`}
        >
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ========================================================= */

const AcquisitionViewPage = () => {
  const lastBumpedIdRef = useRef(null);
  const moaRef = useRef(null);
  const location = useLocation();
  const [acquisitionType, setAcquisitionType] = useState("");
  const [activeTab, setActiveTab] = useState("left");
  const [contributionData, setContributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDocument, setActiveDocument] = useState("Overview");
  const [step, setStep] = useState(0);

  const [conversationId, setConversationId] = useState(null);

  // form_states
  const [approved, setApproved] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");

  const { setExtraBlockContent } = useOutletContext();
  const [itemTab, setItemTab] = useState("Donor");

  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const tabs = ["Donor", "Artifact Information"];

  // --- metadata editing state (UI) ---
  const [pendingMeta, setPendingMeta] = useState({
    collectionNumber: "",
    age: "",
    culture: "",
    provenance: "",
    location: "",
    discovery: "",
    excavationSite: "",
    acquisitionHistory: "",
  });
  const [curatorialDesc, setCuratorialDesc] = useState("");

  // ---- saved metadata % (from artifact_metadata table) ----
  const [metadataPercent, setMetadataPercent] = useState(0);

  const SERVER_URL = import.meta.env.VITE_SERVER_URL;
  const { user } = useAuth();

  // --- safe references (works in local + prod) ---
  const artifact =
    contributionData?.ContributionArtifact || contributionData?.contributionartifact;
  const contributor =
    contributionData?.Contributor || contributionData?.contributor;
  const timeline =
    contributionData?.ContributionTimeline || contributionData?.contributiontimeline;
  const lendingDetail =
    contributionData?.LendingDetail || contributionData?.lendingdetail;

  /* ---------------- timeline → step mapping ---------------- */
  const mapTimelineStep = (timeline) => {
    if (timeline?.completed_at) return 5;
    if (timeline?.on_delivery_at) return 4;
    if (timeline?.moa_settled_at) return 3;
    if (timeline?.approved_at) return 2;
    if (timeline?.under_review_at) return 1;
    if (timeline?.submitted_at) return 0;
    return 0;
  };

  // 🔐 Source of truth for completion (status-based)
  const isCompleted = contributionData?.status === "completed";
  const isRejected = contributionData?.status === "rejected";


  // derive gating for Artifact Details tab (status → single source of truth)
  const showArtifactDetails = isCompleted;
  const tabsToShow = showArtifactDetails
    ? ALL_TABS
    : ["Overview", "Document", "Transaction"];

  /* ---------------- helpers ---------------- */

  // Compute % from saved metadata row (server truth)
  function computeSavedMetadataPercent(data) {
    if (!data || typeof data !== "object") return 0;
    const fields = [
      "date_of_creation",
      "culture",
      "provenance",
      "current_location",
      "discovery_details",
      "excavation_site",
      "acquisition_history",
      "curatorial_description",
    ];
    const total = fields.length;
    let filled = 0;
    for (const k of fields) {
      const v = (data?.[k] ?? "").toString().trim();
      if (v) filled += 1;
    }
    return Math.round((filled / Math.max(1, total)) * 100);
  }

  /* ---------------- Effects ---------------- */

  useEffect(() => {
    setExtraBlockContent(
      contributionData && (
        <DocumentTabs
          labels={tabsToShow}
          active={activeDocument}
          onChange={setActiveDocument}
        />
      )
    );

    const wantsProgressView =
      activeDocument === "Transaction" || activeDocument === "Document";

    const cid = contributionData?.contribution_id;
    const canBump =
      wantsProgressView && step === 0 && cid && lastBumpedIdRef.current !== cid;

    if (canBump) {
      lastBumpedIdRef.current = cid;
      updateStep(cid, 1).catch((e) => {
        console.error("updateStep failed:", e);
        if (lastBumpedIdRef.current === cid) lastBumpedIdRef.current = null;
      });
    }

    return () => setExtraBlockContent(null);
  }, [
    activeDocument,
    step,
    contributionData?.contribution_id,
    setExtraBlockContent,
    showArtifactDetails,
  ]);

  // Guard: if user somehow lands on "Artifact Details" before completion, send back to Overview
  useEffect(() => {
    if (activeDocument === "Artifact Details" && !isCompleted) {
      setActiveDocument("Overview");
    }
  }, [activeDocument, isCompleted]);

  useEffect(() => {
    if (location.pathname.includes("lending")) {
      setAcquisitionType("lending");
    } else if (location.pathname.includes("donation")) {
      setAcquisitionType("donation");
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchContribution();
  }, [location.pathname]);

  // load metadata for this contribution into UI state
  useEffect(() => {
    const id = contributionData?.contribution_id;
    if (!id) return;

    (async () => {
      try {
        const { data } = await axiosClient.get(`/auth/contributions/${id}/metadata`);
        setPendingMeta({
          collectionNumber: data.collection_number ?? "",
          age: data.date_of_creation ?? "",
          culture: data.culture ?? "",
          provenance: data.provenance ?? "",
          location: data.current_location ?? "",
          discovery: data.discovery_details ?? "",
          excavationSite: data.excavation_site ?? "",
          acquisitionHistory: data.acquisition_history ?? "",
        });
        setCuratorialDesc(data.curatorial_description ?? "");
        // percent strictly from saved server state
        setMetadataPercent(computeSavedMetadataPercent(data));
      } catch (e) {
        console.error("Failed to load metadata:", e);
      }
    })();
  }, [contributionData?.contribution_id]);

  /* ---------------- Messaging (via messaging client) ---------------- */

  const messaging = useRef(getMessagingClient()).current;

  useEffect(() => {
    async function setup() {
      if (!contributionData?.contribution_id) return;

      const cid = contributionData.contribution_id;

      // 1. Ensure conversation exists
      const { data: convo } = await axiosClient.get(
        `/auth/conversations/by-contribution/${cid}`
      );
      setConversationId(convo.conversation_id);

      // 2. Fetch history
      const { data: history } = await axiosClient.get(
        `/auth/conversations/${convo.conversation_id}/messages`
      );
      setMessages(history);

      // 3. Join + listen via messaging client
      messaging.joinConversation(convo.conversation_id);

      const off = messaging.onMessage((msg) => {
        // de-dup by (id, created_at, message)
        setMessages((prev) => {
          const key = `${msg.message_id ?? ""}-${msg.created_at ?? ""}-${msg.message ?? ""}`;
          if (
            prev.some(
              (p) =>
                `${p.message_id ?? ""}-${p.created_at ?? ""}-${p.message ?? ""}` === key
            )
          ) {
            return prev;
          }
          const next = [...prev, msg];
          next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          return next;
        });
      });

      return () => {
        off();
        messaging.leaveConversation(convo.conversation_id);
      };
    }

    setup();
  }, [contributionData?.contribution_id]); // messaging is stable via ref

  const sendMessage = (text) => {
    if (!conversationId || !text.trim()) return;
    // Server infers user from session; no need to pass sender ids
    messaging.sendUserMessage(conversationId, text.trim());
  };
  console.log(messages);
  /* ---------------- Submit / server calls ---------------- */

  const handleSubmit = async () => {
    if (responseMessage !== "" && approved !== null) {
      try {
        const status = approved ? "approved" : "rejected";

        if (approved) {
          await moaRef.current?.saveContract?.();
        }

        await axiosClient.patch(
          `auth/contributions/${contributionData?.contribution_id}/status`,
          { status, responseMessage }
        );

        await fetchContribution();
        setActiveDocument("Transaction");

        setResponseMessage("");
        setApproved(null);
      } catch (error) {
        console.error("Error in handleSubmit:", error);
      }
    } else {
      alert("Response message and approve decision is required!");
    }
  };

  const fetchContribution = async () => {
    try {
      setLoading(true);
      const segments = location.pathname.split("/");
      const encodedId = segments[segments.length - 1];
      const decoded = decodeBase64(encodedId);
      const [id] = decoded.split(" ");
      const endpoint = `/auth/contributions/${id}`;
      const response = await axiosClient.get(endpoint);
      setContributionData(response.data);
    } catch (error) {
      console.error("Error fetching contribution:", error);
      setContributionData(null);
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (contribution_id, step) => {
    try {
      await axiosClient.put("/auth/update-step", { contribution_id, step });
      console.log("updated step " + step);
      setStep(step);
    } catch (error) {
      console.error("Failed to update timeline:", error);
    }
  };

  const settleMoa = async () => {
    try {
      const contribution_id = contributionData?.contribution_id;
      const step = 4;
      await axiosClient.put("/auth/update-step", { contribution_id, step });
      console.log("updated step " + step);
      setStep(step);
    } catch (error) {
      console.error("Failed to update timeline:", error);
    }
  };

  // ✅ Status-overlay for progress (status can't be behind the timeline)
  useEffect(() => {
    const tStep = mapTimelineStep(timeline || {});
    let sStep = 0;
    const st = contributionData?.status;
    if (st === "approved") sStep = 2;
    if (st === "completed") sStep = 5;
    setStep(Math.max(tStep, sStep));
  }, [timeline, contributionData?.status]);

function checkShouldTrigger(messages) {
  const hasAcceptNo = messages.some(m =>
    (m.message ?? "").split("\n").map(l => l.trim()).includes("• Accept MOA: No")
  );

  const hasMoaErrorsYes = messages.some(m =>
    (m.message ?? "").split("\n").map(l => l.trim()).includes("• MOA errors: Yes")
  );

  return hasAcceptNo || hasMoaErrorsYes;
}


const overrideMoa = checkShouldTrigger(messages);


  const donatorInformation = contributor
    ? [
        {
          label: "From",
          value: `${contributor?.first_name} ${contributor?.last_name}`,
          icon: <From />,
        },
        { label: "Email", value: contributor?.email, icon: <Email /> },
        {
          label: "Phone Number",
          value: contributor?.phone_number || "Not provided",
          icon: <PhoneNumber />,
        },
        {
          label: "Address",
          value:
            [contributor?.street, contributor?.barangay, contributor?.city, contributor?.province]
              .filter(Boolean)
              .join(", ") || "Not provided",
          icon: <Address />,
        },
        {
          label: "Organization",
          value: contributor?.organization || "Not provided",
          icon: <Organization />,
        },
      ]
    : [];

  const lendingReason = lendingDetail
    ? [
        {
          label: "Propose duration of the loan:",
          value: formatDateRange(lendingDetail.duration_from, lendingDetail.duration_to),
        },
        {
          label: "Specific conditions or requirements for handling of the artifact:",
          value: lendingDetail.lend_conditions || "Not provided",
        },
        {
          label: "Specific liability concerns or requirements regarding the artifact:",
          value: lendingDetail.lend_liabilities || "Not provided",
        },
        {
          label: "Reason for lending:",
          value: lendingDetail.lending_reason || "Not provided",
        },
      ]
    : [];

  const steps = [
    { label: "Submitted", description: "Contribution has been logged and queued for review." },
    { label: "Under Review", description: "Currently being evaluated." },
    { label: "Approved", description: "Submission passed review." },
    { label: "MOA Settled", description: "MOA has been issued and acknowledged." },
    { label: "On Delivery", description: "Artifact is in the process of delivery." },
    { label: "Completed", description: "Process finalized." },
  ];

  const relatedImages =
    artifact?.related_images?.map((img, idx) => ({
      key: idx.toString(),
      src: `${SERVER_URL}/uploads/private/pictures/${img}`,
      label: img,
    })) || [];

  const attachedFiles =
    artifact?.documents?.map((doc, idx) => ({
      key: idx.toString(),
      filename: doc,
      category: "file",
      url: `${SERVER_URL}/uploads/private/files/${doc}`,
    })) || [];

  const artifactInfo = artifact
    ? [
        { label: "Title/Name of the Artifact:", value: artifact.title || "Not provided" },
        { label: "Artifact Description:", value: artifact.description || "Not provided" },
        { label: "How and where was the artifact acquired:", value: artifact.acquisition_details || "Not provided" },
        { label: "Additional Information:", value: artifact.additional_info || "Not provided" },
        { label: "Brief narrative or story related to the artifact:", value: artifact.narrative || "Not provided" },
      ]
    : [];

  const transactionDescription = contributionData
    ? [
        { label: "Status", value: contributionData.status },
        { label: "Last Progress Date", value: formatDate(contributionData.updated_at) },
      ]
    : [];

  const artifactImg =
    artifact?.images?.map((img, idx) => ({
      src: `${SERVER_URL}/uploads/private/pictures/${img}`,
      label: `Image ${idx + 1}`,
    })) || [];

  const email = contributor?.email || "";
  const { date: submittedDate, time: submittedTime } = formatDateTime(contributionData?.submission_date);

  const previewAbout = [
    { label: "Current Manager", value: user.fname + " " + user.lname },
    { label: "Status", value: contributionData?.status || "Not Provided" },
    { label: "Type", value: acquisitionType || "Not Provided" },
    { label: "Date Submitted", value: submittedDate || "Not Provided" },
    { label: "Time", value: submittedTime || "Not Provided" },
  ];

  // NEW: complete action (status-based)
  const markCompleted = async () => {
    try {
      const id = contributionData?.contribution_id;
      await axiosClient.patch(`/auth/contributions/${id}/status`, {
        status: "completed",
        responseMessage: "Marked completed by staff.",
      });
       updateStep(id, 6)
      await fetchContribution();
      setActiveDocument("Overview");
    } catch (e) {
      console.error("Failed to mark as completed:", e);
      alert("Failed to complete the contribution. Please check server logs.");
    }
  };


    const markCanceled = async () => {
    try {
      const id = contributionData?.contribution_id;
      await axiosClient.patch(`/auth/contributions/${id}/status`, {
        status: "rejected",
        responseMessage: "Marked rejcted by staff.",
      });
      await fetchContribution();
      setActiveDocument("Overview");
    } catch (e) {
      console.error("Failed to mark as rejected:", e);
      alert("Failed to reject the contribution. Please check server logs.");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col justify-center gap-y-3 w/full h-full items-center">
        {!contributionData ? (
          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
            <span>No contribution data found or invalid ID.</span>
          </div>
        ) : (
          <>
            {/* Overview */}
            {activeDocument === "Overview" && (
              <OverviewShell
                left={
                  <>
                    <span className="text-white text-5xl font-semibold">
                      About
                    </span>
                    <PreviewAbout previewAbout={previewAbout} />
                    <DonatorInfoSection
                      donatorInformation={donatorInformation}
                      containerClassName="w-full h-fit flex flex-col gap-y-4 "
                      labelClassName="text-xl items-end text-[#666666] font-normal gap-x-2 flex "
                      valueClassName="text-2xl font-semibold text-white pl-20 font-normal 3xl:text-3xl"
                      itemClassName="w-full flex flex-col"
                    />
                  </>
                }
                middle={
                  <>
                    <div className="w-full h-35 pb-5 flex items-end justify-start overflow-hidden">
                      <span className="block text-5xl font-semibold text-white break-words">
                        {contributionData.ContributionArtifact.title}
                      </span>
                    </div>
                    <ArtifactImageGallery
                      artifactImg={artifactImg}
                      onActiveDocumentChange={setActiveDocument}
                    />
                  </>
                }
                right={
                  <>
                    <span className="text-5xl text-white font-semibold">
                      About The Artifact
                    </span>
                    <ArtifactInfoGrid artifactInfo={artifactInfo} />
                    <div className="w-full h-fit flex flex-col gap-y-10">
                      <div className="flex justify-between w-full h-fit items-center">
                        <span className="text-4xl font-bold text-white">
                          {isCompleted ? "Artifact Data Status" : "Timeline"}
                        </span>
                        <button
                          onClick={() => setActiveDocument("Transaction")}
                          className="h-[4rem] w-[13rem] rounded-full cursor-pointer bg-white text-[#000000] text-xl font-semibold"
                        >
                          Click For Full View
                        </button>
                      </div>
                      {isCompleted ? (
                        <Timeline
                          variant="percent"
                          percent={metadataPercent}
                          label="Artifact metadata completion"
                          widthClass="w-[40rem] 3xl:w-[49rem]"
                          barHeight={110}
                        />
                      ) : (
                        <Timeline currentStep={step} steps={steps} />
                      )}
                    </div>
                  </>
                }
              />
            )}

            {/* Document */}
            {activeDocument === "Document" && (
              <DocumentShell
                left={
                  <>
                    <div className="absolute left-0 -top-[12rem] w-full h-[12rem] bg-black flex items-start justify-end pl-10 pb-5 pt-4 overflow-hidden flex-col">
                      <span className="text-white text-3xl font-bold text-left break-words line-clamp-3 max-w-[38rem]">
                        {contributionData.ContributionArtifact.title}
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
                middle={
                  <>
                    <InfoSection
                      title="About The Artifact"
                      items={artifactInfo}
                      titleClassName=" 3xl:text-6xl "
                      containerClassName="pr-20"
                      labelClassName="font-hind font-bold text-2xl text-[#555555]"
                      valueClassName="block  3xl:text-3xl w-[calc(100%-2rem)]  text-[#1D1911] font-bold font-hind break-words"
                      itemHeight="h-19 3xl:h-27"
                    />

                    <AcquisitionDetailsSection
                      acquisitionType={acquisitionType}
                      lendingReason={lendingReason}
                      step={step}
                      steps={steps}
                    />
                  </>
                }
                right={
                  <>
                    <RenderRelatedDocs
                      relatedImages={relatedImages}
                      attachedFiles={attachedFiles}
                      containerHeight="h-[29rem]"
                      imageBoxWidth="w-[29rem]"
                      fileBoxWidth="w-[17rem]"
                      imgHeight="h-52"
                    />
                    <TransactionDetailsCard
                      acquisitionType={acquisitionType}
                      transactionDescription={transactionDescription}
                      user={user}
                      setActiveDocument={setActiveDocument}
                    />
                  </>
                }
              />
            )}

            {/* Transaction */}
            {activeDocument === "Transaction" && (
              <TransactionShell
                left={
                  <>
                    <MoaBuilder ref={moaRef} payload={contributionData} />
                    {contributionData.status === "pending" && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 rounded-md">
                        <span className="text-white text-2xl">
                          Contract will be accesible when the form is Accepted
                        </span>
                      </div>
                    )}
                  </>
                }
                right={
                  <>
                    <div className="w-full px-20 min-h-[21rem] rounded-md gap-y-8 bg-[#1D1911] flex flex-col justify-center items-center">
                      <span className="text-4xl font-bold text-white">Timeline</span>
                      <Timeline currentStep={step} steps={steps} />
                    </div>

                    {contributionData.status === "pending" ? (
                      // --- Pending contract form ---
                      <form className="w-full h-full rounded-lg bg-gray-200 flex flex-col px-10 pt-15 pb-5">
                        <span className="text-4xl font-semibold">Respond</span>
                        <div className="px-5 pt-5 pb-2 flex flex-col gap-5">
                          <span className="text-2xl font-semibold w-40">Approve?</span>

                          <ButtonSelector
                            options={[
                              {
                                value: true,
                                label: "Yes",
                                activeStyle: "bg-green-500 hover:bg-green-600 text-white",
                              },
                              {
                                value: false,
                                label: "No",
                                activeStyle: "bg-red-500 hover:bg-red-600 text-white",
                              },
                            ]}
                            onChange={(val) => setApproved(val)}
                          />

                          <MultiLineInputField
                            placeholder="Send a response to the donor…"
                            mode="hard"
                            value={responseMessage}
                            onChange={setResponseMessage}
                            heightClass="h-75"
                            helperText={`Reply will be sent to ${email}`}
                            maxChars={2500}
                          />
                        </div>

                        <div className="px-5 w-full h-fit flex justify-end pl-5">
                          <StyledButton
                            className="w-50 mt-5"
                            buttonColor="bg-[#6F3FFF]"
                            onClick={handleSubmit}
                          >
                            Done
                          </StyledButton>
                        </div>
                      </form>
                    ) : (
                      // --- Conversation timeline + admin override controls ---
                      <>
                        <div className="flex flex-col gap-y-2">
                          <span className="text-xl font-semibold">Override Form Controls:</span>
                          <div className="flex gap-3 flex-wrap">
                            {overrideMoa && (
                              <>
                            <StyledButton
                              className="w-50 mt-5"
                              buttonColor="bg-[#6F3FFF]"
                              onClick={() => settleMoa()}
                              disabled={isCompleted || isRejected}
                            >
                              Settle MOA
                            </StyledButton>
                            <StyledButton
                              className="w-50 mt-5"
                              buttonColor="bg-emerald-600"
                              onClick={markCompleted}
                              disabled={isCompleted || isRejected}
                              title={isCompleted ? "Already completed" : "Mark as completed"}
                            >
                              {isCompleted ? "Completed" : "Mark Completed"}
                            </StyledButton>
                            </>
                            )}
                            <StyledButton
                              className="w-50 mt-5"
                              buttonColor="bg-red-500"
                              onClick={markCanceled}
                              disabled={isRejected || isCompleted}
                              title={isRejected ? "Already rejected" : "Mark as rejected"}
                            >
                              {isCompleted ? "Cancel Contribution" : "Cancelled"}
                            </StyledButton>
                          </div>
                        </div>

                        <div className="w-full h-full justify-between p-2 bg-white shadow-[inset_0_6px_6px_rgba(0,0,0,0.8),inset_0_-6px_6px_rgba(0,0,0,0.3)] rounded-xl flex flex-col">
                          <ConversationTimeline
                            items={messages.map((m) => toTimelineItem(m, user))}
                            height="29rem"
                          />

                          <div className="mt-3 relative w-full">
                            <input
                              type="text"
                              value={chatText}
                              onChange={(e) => setChatText(e.target.value)}
                              placeholder="Type a message..."
                              className="w-full h-14 rounded-xl border-2 border-black bg-white shadow-[inset_0_6px_6px_rgba(0,0,0,0.4)] pl-4 pr-28 text-lg outline-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (chatText.trim()) {
                                    sendMessage(chatText.trim());
                                    setChatText("");
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (chatText.trim()) {
                                  sendMessage(chatText.trim());
                                  setChatText("");
                                }
                              }}
                              className="absolute right-2 top-1.5 h-11 px-4 rounded-lg bg-black text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] text-sm font-semibold active:translate-y-[1px] inline-flex items-center gap-2"
                              title="Send"
                              aria-label="Send"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M22 2 15 22l-4-9-9-4Z" />
                                <path d="M22 2 11 13" />
                              </svg>
                              Send
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                }
              />
            )}

            {/* Artifact Details (only reachable when completed due to gating) */}
            {activeDocument === "Artifact Details" && showArtifactDetails && (
              <ArtifactDetailsShell
                left={
                  <>
                    <div className="absolute left-0 -top-[12rem] w-full h-[12rem] bg-black flex items-start justify-end pl-10 pb-5 pt-4 overflow-hidden flex-col">
                      <span className="text-white text-3xl font-bold text-left break-words line-clamp-3 max-w-[38rem]">
                        {contributionData.ContributionArtifact.title}
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
                middle={
                  <ArtifactMetadataForm
                    value={pendingMeta}
                    onChange={setPendingMeta}
                  />
                }
                right={
                  <div className="w-full pl-5 h-full flex flex-col gap-4 pr-6">
                    <div className="flex-1 min-h-0 rounded-lg border border-gray-300 p-6 flex gap-x-4">
                      <div className="mt-3 gap-6 flex w-full h-full flex-col ">
                        <span className="text-4xl font-bold">Curatorial Description</span>

                        <MultiLineInputField
                          placeholder="Enter staff-facing curatorial description…"
                          mode="hard"
                          value={curatorialDesc}
                          onChange={setCuratorialDesc}
                          heightClass="h-full 2xl:h-[23rem]"
                          maxChars={8000}
                        />
                      </div>

                      <OptionsPanel
                        onEdit={() => {
                          // optional: toggle edit mode
                        }}
                        onSave={async () => {
                          try {
                            const id = contributionData?.contribution_id;
                            const payload = {
                              date_of_creation: pendingMeta?.age ?? null,
                              culture: pendingMeta?.culture ?? null,
                              provenance: pendingMeta?.provenance ?? null,
                              current_location: pendingMeta?.location ?? null,
                              discovery_details: pendingMeta?.discovery ?? null,
                              excavation_site: pendingMeta?.excavationSite ?? null,
                              acquisition_history: pendingMeta?.acquisitionHistory ?? null,
                              curatorial_description: curatorialDesc ?? null,
                            };
                            await axiosClient.post(`/auth/contributions/${id}/metadata`, payload, {
                              headers: { "Content-Type": "application/json" },
                            });

                            const { data } = await axiosClient.get(`/auth/contributions/${id}/metadata`);
                            setPendingMeta({
                              collectionNumber: data.collection_number ?? "",
                              age: data.date_of_creation ?? "",
                              culture: data.culture ?? "",
                              provenance: data.provenance ?? "",
                              location: data.current_location ?? "",
                              discovery: data.discovery_details ?? "",
                              excavationSite: data.excavation_site ?? "",
                              acquisitionHistory: data.acquisition_history ?? "",
                            });
                            setCuratorialDesc(data.curatorial_description ?? "");
                            setMetadataPercent(computeSavedMetadataPercent(data));
                          } catch (e) {
                            console.error("[Options] Save Changes failed:", e);
                            alert("Failed to save metadata. Check console for details.");
                          }
                        }}
                        onComplete={async () => {
                          try {
                            const id = contributionData?.contribution_id;
                            await axiosClient.post(`/auth/contributions/${id}/metadata/complete`);

                            // Refresh local copy
                            const { data } = await axiosClient.get(`/auth/contributions/${id}/metadata`);
                            setPendingMeta({
                              collectionNumber: data.collection_number ?? "",
                              age: data.date_of_creation ?? "",
                              culture: data.culture ?? "",
                              provenance: data.provenance ?? "",
                              location: data.current_location ?? "",
                              discovery: data.discovery_details ?? "",
                              excavationSite: data.excavation_site ?? "",
                              acquisitionHistory: data.acquisition_history ?? "",
                            });
                            setCuratorialDesc(data.curatorial_description ?? "");
                            setMetadataPercent(computeSavedMetadataPercent(data));

                            alert("Metadata finalized. Collection number will appear when the contribution is completed.");
                          } catch (e) {
                            const status = e?.response?.status;
                            const msg = e?.response?.data?.message || e?.message || "Unknown error";
                            if (status === 403) {
                              alert("You need admin privileges to finalize metadata.");
                            } else if (status === 404) {
                              alert(`Finalize failed: ${msg}`);
                            } else {
                              alert(`Finalize failed (${status || "error"}): ${msg}`);
                            }
                            console.error("[Options] Complete failed:", e);
                          }
                        }}
                      />
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
                  </div>
                }
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AcquisitionViewPage;
