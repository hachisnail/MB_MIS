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

const documentTabs = ["Overview", "Document", "Transaction"];

function DocumentTabs({ active, onChange }) {
  return (
    <div className="w-full h-full items-end justify-end flex gap-3">
      {documentTabs.map((label) => (
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

import { LoadingSpinner } from "../../../../components/commons";
import {
  Address,
  Email,
  From,
  Organization,
  PhoneNumber,
} from "../components/ViewPageSvg";

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

  // form_states
  const [approved, setApproved] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");

  const { setExtraBlockContent } = useOutletContext();

  const [itemTab, setItemTab] = useState("Donor");
  const tabs = ["Donor", "Artifact Information"];

  const SERVER_URL = import.meta.env.VITE_SERVER_URL;

  const { user } = useAuth();

  useEffect(() => {
    setExtraBlockContent(
      contributionData && (
        <DocumentTabs active={activeDocument} onChange={setActiveDocument} />
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
  ]);

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

  const fetchContribution = async () => {
    try {
      setLoading(true);
      const segments = location.pathname.split("/");
      const encodedId = segments[segments.length - 1];
      const decoded = decodeBase64(encodedId);
      const [id, ...titleParts] = decoded.split(" ");
      const title = titleParts.join(" ");

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
      await axiosClient.put("/auth/update-step", {
        contribution_id,
        step: step,
      });
      console.log("updated step " + step);
      setStep(step);
    } catch (error) {
      console.error("Failed to update timeline:", error);
    }
  };

  useEffect(() => {
    if (contributionData?.ContributionTimeline) {
      const stepIndex = mapTimelineStep(contributionData.ContributionTimeline);
      setStep(stepIndex);
    }
  }, [contributionData]);

  const donatorInformation = contributionData
    ? [
        {
          label: "From",
          value: `${contributionData.Contributor?.first_name} ${contributionData.Contributor?.last_name}`,
          icon: <From />,
        },
        {
          label: "Email",
          value: contributionData.Contributor?.email,
          icon: <Email />,
        },
        {
          label: "Phone Number",
          value: contributionData.Contributor?.phone_number || "Not provided",
          icon: <PhoneNumber />,
        },
        {
          label: "Address",
          value:
            [
              contributionData.Contributor?.street,
              contributionData.Contributor?.barangay,
              contributionData.Contributor?.city,
              contributionData.Contributor?.province,
            ]
              .filter(Boolean)
              .join(", ") || "Not provided",
          icon: <Address />,
        },
        {
          label: "Organization",
          value: contributionData.Contributor?.organization || "Not provided",
          icon: <Organization />,
        },
      ]
    : [];

  const lendingReason = contributionData?.LendingDetail
    ? [
        {
          label: "Propose duration of the loan:",
          value: formatDateRange(
            contributionData.LendingDetail.duration_from,
            contributionData.LendingDetail.duration_to
          ),
        },
        {
          label:
            "Specific conditions or requirements for handling of the artifact:",
          value:
            contributionData.LendingDetail.lend_conditions || "Not provided",
        },
        {
          label:
            "Specific liability concerns or requirements regarding the artifact:",
          value:
            contributionData.LendingDetail.lend_liabilities || "Not provided",
        },
        {
          label: "Reason for lending:",
          value:
            contributionData.LendingDetail.lending_reason || "Not provided",
        },
      ]
    : [];

  const mapTimelineStep = (timeline) => {
    if (timeline.completed_at) return 5; // Completed
    if (timeline.on_delivery_at) return 4; // On Delivery
    if (timeline.moa_settled_at) return 3; // MOA Settled
    if (timeline.approved_at) return 2; // Approved
    if (timeline.under_review_at) return 1; // Under Review
    if (timeline.submitted_at) return 0; // Submitted
    return 0; // fallback
  };

  const steps = [
    {
      label: "Submitted",
      description:
        "Contribution has been logged in the system and queued for review.",
    },
    {
      label: "Under Review",
      description:
        "This form is currently being evaluated and requirements are being verified.",
    },
    {
      label: "Approved",
      description:
        "Submission has passed review and is cleared for the next process.",
    },
    {
      label: "MOA Settled",
      description: "Memorandum of Agreement has been issued and acknowledged.",
    },
    {
      label: "On Delivery",
      description: "Artifact ise in the process of being delivered.",
    },
    {
      label: "Completed",
      description:
        "All steps have been finalized; process is officially closed.",
    },
  ];

  const relatedImages =
    contributionData?.ContributionArtifact?.related_images?.map((img, idx) => ({
      key: idx.toString(),
      src: `${SERVER_URL}/uploads/private/pictures/${img}`,
      label: `${img}`,
    })) || [];

  const attachedFiles =
    contributionData?.ContributionArtifact?.documents?.map((doc, idx) => ({
      key: idx.toString(),
      filename: doc,
      category: "file",
      url: `${SERVER_URL}/uploads/private/files/${doc}`,
    })) || [];

  const artifactInfo = contributionData?.ContributionArtifact
    ? [
        {
          label: "Title/Name of the Artifact:",
          value: contributionData.ContributionArtifact.title || "Not provided",
        },
        {
          label: "Artifact Description:",
          value:
            contributionData.ContributionArtifact.description || "Not provided",
        },
        {
          label: "How and where was the artifact acquired:",
          value:
            contributionData.ContributionArtifact.acquisition_details ||
            "Not provided",
        },
        {
          label: "Additional Information:",
          value:
            contributionData.ContributionArtifact.additional_info ||
            "Not provided",
        },
        {
          label: "Brief narrative or story related to the artifact:",
          value:
            contributionData.ContributionArtifact.narrative || "Not provided",
        },
      ]
    : [];

  const transactionDescription = contributionData
    ? [
        { label: "Status", value: contributionData.status },
        {
          label: "Last Progress Date",
          value: formatDate(contributionData.updated_at),
        },
      ]
    : [];

  const artifactImg =
    contributionData?.ContributionArtifact?.images?.map((img, idx) => ({
      src: `http://localhost:5000/uploads/private/pictures/${img}`,
      label: `Image ${idx + 1}`,
    })) || [];

  const email = contributionData?.Contributor?.email || "";

  const { date: submittedDate, time: submittedTime } = formatDateTime(
    contributionData?.submission_date
  );

  const previewAbout = [
    { label: "Current Manager", value: user.fname + " " + user.lname },
    { label: "Status", value: contributionData?.status || "Not Provided" },
    { label: "Type", value: acquisitionType || "Not Provided" },
    { label: "Date Submitted", value: submittedDate || "Not Provided" },
    { label: "Time", value: submittedTime || "Not Provided" },
  ];

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

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col justify-center gap-y-3 w-full h-full items-center">
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
                    <span className="text-white text-4xl font-semibold">
                      About
                    </span>
                    <PreviewAbout previewAbout={previewAbout} />
                    <DonatorInfoSection
                      donatorInformation={donatorInformation}
                      titleClassName="text-4xl text-white font-semibold mb-5"
                      containerClassName="w-full h-fit flex flex-col gap-y-4"
                      labelClassName="text-xl items-end text-[#666666] font-normal gap-x-2 flex"
                      valueClassName="text-2xl font-semibold text-white pl-20 font-normal"
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
                          Timeline
                        </span>
                        <button
                          onClick={() => setActiveDocument("Transaction")}
                          className="h-[4rem] w-[13rem] rounded-full cursor-pointer bg-white text-[#000000] text-xl font-semibold"
                        >
                          Click For Full View
                        </button>
                      </div>
                      <Timeline currentStep={step} steps={steps} />
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
                      <span className="text-4xl font-bold text-white">
                        Timeline
                      </span>
                      <Timeline currentStep={step} steps={steps} />
                    </div>

                    {contributionData.status === "pending" ? (
                      <form className="w-full h-full rounded-lg bg-gray-200 flex flex-col px-10 pt-15 pb-5">
                        <span className="text-4xl font-semibold">Respond</span>
                        <div className="px-5 pt-5 pb-2 flex flex-col gap-5">
                          <span className="text-2xl font-semibold w-40">
                            Approve?
                          </span>

                          <ButtonSelector
                            options={[
                              {
                                value: true,
                                label: "Yes",
                                activeStyle:
                                  "bg-green-500 hover:bg-green-600 text-white",
                              },
                              {
                                value: false,
                                label: "No",
                                activeStyle:
                                  "bg-red-500 hover:bg-red-600 text-white",
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
                      <div className="w-full h-full bg-neutral-300 rounded-md">
                        {/* post-approval UI */}
                      </div>
                    )}
                  </>
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
