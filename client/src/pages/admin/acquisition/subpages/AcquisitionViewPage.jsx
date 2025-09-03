import { useLocation, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import {
  RenderRelatedDocs,
  RenderArtifactImageAndDonatorInfo,
  InfoSection,
} from "../components/ViewPageRenderer";
import StyledButton from "@/components/buttons/StyledButton";
import MultiLineInput from "@/features/MultiLineInput";
import { decodeBase64 } from "@/utils/base64";
import { formatDateRange, formatDate } from "../components/formatDateRange";
import { useAuth } from "../../../../context/authContext";
import CurvedButton from "../components/CurvedButton";
import Breadcrumb from "../../../../components/Breadcrumb";
import Timeline from "../components/Timeline";

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
  const location = useLocation();
  const [acquisitionType, setAcquisitionType] = useState("");
  const [activeTab, setActiveTab] = useState("left");
  const [messageReply, setMessageReply] = useState();
  const [contributionData, setContributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDocument, setActiveDocument] = useState("Overview");

  const { setExtraBlockContent } = useOutletContext();

  const [itemTab, setItemTab] = useState("Donor");
  const tabs = ["Donor", "Artifact Information"];
  const SERVER_URL = import.meta.env.VITE_SERVER_URL;

  const { user } = useAuth();

  useEffect(() => {
    setExtraBlockContent(
      <DocumentTabs active={activeDocument} onChange={setActiveDocument} />
    );
    return () => setExtraBlockContent(null);
  }, [activeDocument, setExtraBlockContent]);

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

  const [step, setStep] = useState(0);

  const steps = [
    {
      label: "Submitted",
      description: "Your request has been submitted and is awaiting review.",
    },
    {
      label: "Under Review",
      description: "Our team is currently reviewing your submission.",
    },
    {
      label: "Approved",
      description:
        "Your request has been approved and is moving to the next phase.",
    },
    {
      label: "MOA Sent",
      description:
        "A Memorandum of Agreement (MOA) has been sent for your confirmation.",
    },
    {
      label: "Delivered",
      description: "The requested items/services have been delivered.",
    },
    {
      label: "Completed",
      description: "The process has been successfully completed.",
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

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleButtonClick = () => {
    setActiveDocument("Transaction"); // switch to Transaction tab
  };

  return (
    <div className="flex flex-col justify-center gap-y-3 w-full h-full items-center ">
      {!contributionData ? (
        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
          <span>No contribution data found or invalid ID.</span>
        </div>
      ) : (
        <>
          {activeDocument === "Overview" && (
            <div className="w-full h-full   grid grid-cols-[1fr_43rem_47rem]">
              <div className="col-span-1 w-full h-full bg-[#1C1B19] rounded-l-md "></div>

              <div className="col-span-1 w-full h-full bg-[#1A0F0F]"></div>

              <div className="col-span-1 w-full h-full bg-[#1D1911] rounded-r-md"></div>
            </div>
          )}

          {activeDocument === "Document" && (
            <div className="w-full h-full rounded-md grid grid-cols-[43rem_1fr_40rem]">
              {/* Left column */}
              <div className="col-span-1 w-full h-full bg-black relative overflow-visible flex flex-col">
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
                <div className="absolute left-0 -bottom-[1.2rem] w-full h-[1.2rem] bg-black"></div>
              </div>

              {/* Middle column */}
              <div className="col-span-1 w-full h-full flex flex-col ">
                <InfoSection
                  title="About The Artifact"
                  items={artifactInfo}
                  labelClassName="font-hind font-bold text-2xl text-[#555555]"
                  valueClassName="block w-full max-w-[36rem] text-[#1D1911] font-bold font-hind break-words"
                  itemHeight="h-19"
                />

                <div
                  className={`w-full  min-h-[32rem] bg-[#1D1911] ${
                    acquisitionType === "lending" && "rounded-r-4xl pb-8"
                  }`}
                >
                  {acquisitionType === "lending" ? (
                    <InfoSection
                      title="Reason For Lending"
                      items={lendingReason}
                      titleClassName="mb-2 text-white"
                      labelClassName="font-hind font-medium text-xl text-[#CDC469]"
                      valueClassName="block w-full max-w-[36rem] text-white text-2xl font-medium font-hind break-words"
                      itemHeight="h-22"
                      containerClassName="justify-end"
                    />
                  ) : (
                    <div className=" w-full h-full flex flex-col items-center justify-center ">
                      <div className="w-fit h-fit flex flex-col items-center justify-center space-y-8">
                        <h2 className="text-4xl font-bold text-white">
                          Timeline
                        </h2>

                        <Timeline currentStep={step} steps={steps} />

                        {/* <div className="flex w-fit h-fit gap-x-5">
                          <button
                            onClick={() => setStep((s) => Math.max(0, s - 1))}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() =>
                              setStep((s) => Math.min(steps.length - 1, s + 1))
                            }
                            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400"
                          >
                            Next
                          </button>
                        </div> */}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="col-span-1 w-full h-full rounded-r-md flex flex-col">
                <div className="w-full h-full pb-5">
                  {/* image + file container */}

                  <RenderRelatedDocs
                    relatedImages={relatedImages}
                    attachedFiles={attachedFiles}
                    imageBoxWidth="25rem"
                    imageBoxHeight="h-full"
                    fileBoxWidth="14rem"
                    fileBoxHeight="h-full"
                    imgHeight="h-60"
                  />
                </div>

                <div
                  className={`w-full  min-h-[32rem]   ${
                    acquisitionType === "lending"
                      ? "bg-[#E4E4E4]"
                      : "bg-[#1D1911]"
                  } rounded-r-4xl flex`}
                >
                  {acquisitionType === "lending" && (
                    <div
                      className={`w-full max-w-10 h-ull ${
                        acquisitionType === "lending"
                          ? "bg-white"
                          : "bg-[#1D1911]"
                      } rounded-r-4xl`}
                    ></div>
                  )}
                  <div
                    className={`w-full h-full px-13 py-10 flex flex-col space-y-5 ${
                      acquisitionType === "lending"
                        ? "text-[#2F0000]"
                        : "text-white"
                    } `}
                  >
                    <span className="text-3xl font-semibold ">
                      Transaction Details
                    </span>
                    <div className="w-full h-fit border-y py-8 border-[#9B9B9B] flex flex-col">
                      <div className="flex w-full h-fit pb-8">
                        {transactionDescription.map(({ label, value }, idx) => (
                          <div key={idx} className="flex flex-col w-1/2">
                            <span className="text-xl ">{label}</span>
                            <span className="text-2xl font-semibold capitalize ">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="w-full flex flex-col">
                        <span className="text-xl ">Current Manager</span>
                        <span className="text-2xl font-semibold capitalize ">
                          {user.fname + " " + user.lname}
                        </span>
                      </div>
                    </div>
                    <CurvedButton
                      text="Click To See Transaction"
                      bgColor={
                        acquisitionType === "lending" ? `#2F0000` : `#51442C`
                      }
                      textColor="#FFFFFF"
                      pressedColor={
                        acquisitionType === "lending" ? `#512727` : `#2F0000`
                      }
                      fontSize={19}
                      onClick={handleButtonClick}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeDocument === "Transaction" && (
            <div className="w-full h-full rounded-md bg-[#1C1B19]"></div>
          )}
        </>
      )}
    </div>
  );
};

export default AcquisitionViewPage;
