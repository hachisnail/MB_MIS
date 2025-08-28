import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import {
  RenderRelatedDocs,
  RenderLendingReason,
  RenderArtifactInformation,
} from "../components/ViewPageRenderer";
import StyledButton from "@/components/buttons/StyledButton";
import MultiLineInput from "@/features/MultiLineInput";
import { decodeBase64 } from "@/utils/base64";
import { Transition } from "@headlessui/react";

import { LoadingSpinner } from "../../../../components/commons";
const AcquisitionViewPage = () => {
  const location = useLocation();
  const [acquisitionType, setAcquisitionType] = useState("");
  const [activeTab, setActiveTab] = useState("left");
  const [messageReply, setMessageReply] = useState();
  const [contributionData, setContributionData] = useState(null);
  const [loading, setLoading] = useState(true); // <-- loading state

 const [itemTab, setItemTab] = useState("Donor");
const tabs = ["Donor", "Artifact Information"];
  const SERVER_URL = import.meta.env.VITE_SERVER_URL;

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
      setLoading(true); // start loading
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
      setLoading(false); // stop loading
    }
  };

  const donatorInformation = contributionData
    ? [
        {
          label: "From",
          value: `${contributionData.Contributor?.first_name} ${contributionData.Contributor?.last_name}`,
        },
        { label: "Email", value: contributionData.Contributor?.email },
        {
          label: "Phone Number",
          value: contributionData.Contributor?.phone_number || "Not provided",
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
        },
        {
          label: "Organization",
          value: contributionData.Contributor?.organization || "Not provided",
        },
      ]
    : [];

  const lendingReason = contributionData?.LendingDetail
    ? [
        {
          label: "Propose duration of the loan:",
          value: `${contributionData.LendingDetail.duration_from} - ${contributionData.LendingDetail.duration_to}`,
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

  const relatedImages =
    contributionData?.ContributionArtifact?.related_images?.map((img, idx) => ({
      key: idx.toString(),
      src: `${SERVER_URL}/uploads/private/pictures/${img}`,
      label: `Related Image ${idx + 1}`,
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

  return (
    <div className="flex flex-col justify-center gap-y-3 w-full h-full items-center overflow-hidden">
      {!contributionData ? (
        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
          No contribution data found or invalid ID.
        </div>
      ) : (
      <>
        {/* <div className="w-full h-full flex flex-col px-15">
          <div className="w-full h-fit flex">
            {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setItemTab(tab)}
            className={`px-4 w-80 py-2 font-semibold rounded-t-md transition-colors duration-300 ${
              itemTab === tab
                ? "bg-white border-t border-l border-r border-gray-500 text-black"
                : "bg-gray-200 border-b border-gray-500 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
                <div className="w-full h-full border-b border-gray-500">

        </div>
          </div>
          <div className="p-5 border-x border-b border-gray-500 rounded-b-md bg-white w-full h-full">
        {itemTab === "Donor" && <div className="w-full h-full flex items-center justify-center">Donor content goes here</div>}
        {itemTab === "Artifact Information" && (
          <div className="w-full h-full flex items-center justify-center">Artifact Information content goes here</div>
        )}
        {itemTab === "Interact" && <div className="w-full h-full flex items-center justify-center">Interact content goes here</div>}

      </div>

        </div> */}

      <div className=" flex">
        {/* button right */}
        {activeTab === "right" && (
          <button
            className="w-fit h-full hover:text-gray-500 cursor-pointer border-l bg-gradient-to-r rounded-sm from-gray-300 to-white"
            onClick={() => setActiveTab("left")}
          >
            {/* pagination */}
            <span className="[writing-mode:vertical-rl] rotate-180 text-xl font-bold">
              Previous Page
            </span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4l3 8l-3 8" />

            </svg>
          </button>
        )}
        
        {activeTab === "left" && (
          <div className="flex gap-x-10 w-fit h-full">
            <div className="w-full max-w-[58rem] h-full flex flex-col gap-y-10">
              <div className="w-[55rem] min-h-fit h-fit border gap-y-5 border-gray-400 rounded-lg flex flex-col p-8">
                <span className="text-4xl font-semibold">
                  Donators Information
                </span>
                {donatorInformation.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex gap-x-5 w-full text-2xl h-fit font-semibold "
                  >
                    <span className="w-45">{label}</span>
                    <span
                      className={` font-normal text-[#333333] overflow-x-scroll`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              {acquisitionType === "lending" ? (
                <RenderLendingReason lendingReason={lendingReason} />
              ) : (
                <RenderRelatedDocs
                  relatedImages={relatedImages}
                  attachedFiles={attachedFiles}

                />
              )}
            </div>

            <div className="w-fit h-full">
              <RenderArtifactInformation
                artifactInfo={artifactInfo}
                artifactImg={artifactImg}
              />
            </div>
          </div>
        )}

        {activeTab === "right" && (
          <div className="w-full px-15 flex h-full gap-x-10">
            {acquisitionType === "lending" ? (
              <RenderRelatedDocs
                relatedImages={relatedImages}
                attachedFiles={attachedFiles}
              />
            ) : (
              <RenderArtifactInformation
                artifactInfo={artifactInfo}
                artifactImg={artifactImg}
              />
            )}

            <form className="w-[58rem] h-full rounded-lg bg-gray-200 flex flex-col px-10 pt-15 pb-5">
              <span className="text-4xl font-semibold">Respond</span>
              <div className="p-5 flex flex-col gap-5">
                <span className="text-2xl font-semibold w-40">Approve?</span>
                <div id="accept-btn" className="gap-x-5 flex">
                  <StyledButton
                    className="w-50 "
                    buttonColor="bg-[#6F3FFF]"
                    hoverColor="bg-blue-600"
                  >
                    Yes
                  </StyledButton>

                  <StyledButton className="w-50">No</StyledButton>
                </div>
              </div>
              <MultiLineInput
                id="message"
                label="Leave a message"
                value={messageReply}
                onChange={(v) => setMessageReply(v)}
                placeholder="Write something..."
                rows={29}
                maxLength={500}
                autosize
                showCount
                error=""
                theme="light"
                label_size="2xl"
              />
              <div className=" w-full h-fit flex justify-between pl-5">
                <span className="text-gray-500">
                  Reply will be sent to{" "}
                  <span className="text-[#370BFF]">{email}</span>
                </span>
                <StyledButton className="w-50 mt-5" buttonColor="bg-[#6F3FFF]">
                  Done
                </StyledButton>
              </div>
            </form>
          </div>
        )}

        {/* button left */}
        {activeTab === "left" && (
          <button
            className="w-fit h-full hover:text-gray-500 cursor-pointer border-r bg-gradient-to-l rounded-sm from-gray-300 to-white"
            onClick={() => setActiveTab("right")}
          >
            <span className="[writing-mode:vertical-rl] rotate-360 text-xl font-bold ">
              Next Page
            </span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 20l-3 -8l3 -8" />

            </svg>
          </button>
        )}
      </div>
      <div className="w-full h-1 flex items-center justify-center gap-x-5">
        <div
          className={`w-100 h-1 ${
            activeTab === "left" ? "bg-black" : "bg-gray-500"
          }`}
        ></div>
        <div
          className={`w-100 h-1 ${
            activeTab === "right" ? "bg-black" : "bg-gray-500"
          }`}
        ></div>
      </div>


      </>
      )}
    </div>
  );
};

export default AcquisitionViewPage;
