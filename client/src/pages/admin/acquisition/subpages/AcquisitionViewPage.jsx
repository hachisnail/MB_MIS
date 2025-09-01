import { useLocation, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import {
  RenderRelatedDocs,
  RenderLendingReason,
  RenderArtifactImageAndDonatorInfo,
  InfoSection,
} from "../components/ViewPageRenderer";
import StyledButton from "@/components/buttons/StyledButton";
import MultiLineInput from "@/features/MultiLineInput";
import { decodeBase64 } from "@/utils/base64";
import { Transition } from "@headlessui/react";
import { formatDateRange, formatDate } from "../components/formatDateRange";
import { useAuth } from "../../../../context/authContext";

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
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.6666 17.5V15.8333C16.6666 14.9493 16.3155 14.1014 15.6903 13.4763C15.0652 12.8512 14.2174 12.5 13.3333 12.5H6.66665C5.78259 12.5 4.93474 12.8512 4.30962 13.4763C3.6845 14.1014 3.33331 14.9493 3.33331 15.8333V17.5M13.3333 5.83333C13.3333 7.67428 11.8409 9.16667 9.99998 9.16667C8.15903 9.16667 6.66665 7.67428 6.66665 5.83333C6.66665 3.99238 8.15903 2.5 9.99998 2.5C11.8409 2.5 13.3333 3.99238 13.3333 5.83333Z"
                stroke="#666666"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ),
        },
        {
          label: "Email",
          value: contributionData.Contributor?.email,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.33335 16.6667C2.87502 16.6667 2.48266 16.5035 2.15627 16.1771C1.82988 15.8507 1.66669 15.4584 1.66669 15V5.00004C1.66669 4.54171 1.82988 4.14935 2.15627 3.82296C2.48266 3.49657 2.87502 3.33337 3.33335 3.33337H16.6667C17.125 3.33337 17.5174 3.49657 17.8438 3.82296C18.1702 4.14935 18.3334 4.54171 18.3334 5.00004V15C18.3334 15.4584 18.1702 15.8507 17.8438 16.1771C17.5174 16.5035 17.125 16.6667 16.6667 16.6667H3.33335ZM10 10.8334L3.33335 6.66671V15H16.6667V6.66671L10 10.8334ZM10 9.16671L16.6667 5.00004H3.33335L10 9.16671ZM3.33335 6.66671V5.00004V15V6.66671Z"
                fill="#666666"
              />
            </svg>
          ),
        },
        {
          label: "Phone Number",
          value: contributionData.Contributor?.phone_number || "Not provided",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_4651_3194)">
                <path
                  d="M18.3333 14.1V16.6C18.3343 16.8321 18.2867 17.0618 18.1937 17.2745C18.1008 17.4871 17.9644 17.678 17.7934 17.8349C17.6224 17.9918 17.4205 18.1113 17.2006 18.1856C16.9808 18.26 16.7478 18.2876 16.5167 18.2667C13.9523 17.9881 11.4892 17.1118 9.32498 15.7084C7.31151 14.4289 5.60443 12.7219 4.32499 10.7084C2.91663 8.53438 2.04019 6.0592 1.76665 3.48337C1.74583 3.25293 1.77321 3.02067 1.84707 2.80139C1.92092 2.58211 2.03963 2.38061 2.19562 2.20972C2.35162 2.03883 2.54149 1.9023 2.75314 1.80881C2.9648 1.71532 3.1936 1.66692 3.42499 1.66671H5.92498C6.32941 1.66273 6.72148 1.80594 7.02812 2.06965C7.33476 2.33336 7.53505 2.69958 7.59165 3.10004C7.69717 3.9001 7.89286 4.68565 8.17499 5.44171C8.2871 5.73998 8.31137 6.06414 8.24491 6.37577C8.17844 6.68741 8.02404 6.97347 7.79998 7.20004L6.74165 8.25837C7.92795 10.3447 9.65536 12.0721 11.7417 13.2584L12.8 12.2C13.0266 11.976 13.3126 11.8216 13.6243 11.7551C13.9359 11.6887 14.26 11.7129 14.5583 11.825C15.3144 12.1072 16.0999 12.3029 16.9 12.4084C17.3048 12.4655 17.6745 12.6694 17.9388 12.9813C18.203 13.2932 18.3435 13.6914 18.3333 14.1Z"
                  stroke="#666666"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_4651_3194">
                  <rect width="20" height="20" fill="white" />
                </clipPath>
              </defs>
            </svg>
          ),
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
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 15.8333V16.6667C5 16.9028 4.92014 17.1007 4.76042 17.2604C4.60069 17.4201 4.40278 17.5 4.16667 17.5H3.33333C3.09722 17.5 2.89931 17.4201 2.73958 17.2604C2.57986 17.1007 2.5 16.9028 2.5 16.6667V10L4.25 5C4.33333 4.75 4.48264 4.54861 4.69792 4.39583C4.91319 4.24306 5.15278 4.16667 5.41667 4.16667H7.5V2.5H12.5V4.16667H14.5833C14.8472 4.16667 15.0868 4.24306 15.3021 4.39583C15.5174 4.54861 15.6667 4.75 15.75 5L17.5 10V16.6667C17.5 16.9028 17.4201 17.1007 17.2604 17.2604C17.1007 17.4201 16.9028 17.5 16.6667 17.5H15.8333C15.5972 17.5 15.3993 17.4201 15.2396 17.2604C15.0799 17.1007 15 16.9028 15 16.6667V15.8333H5ZM4.83333 8.33333H15.1667L14.2917 5.83333H5.70833L4.83333 8.33333ZM6.25 13.3333C6.59722 13.3333 6.89236 13.2118 7.13542 12.9688C7.37847 12.7257 7.5 12.4306 7.5 12.0833C7.5 11.7361 7.37847 11.441 7.13542 11.1979C6.89236 10.9549 6.59722 10.8333 6.25 10.8333C5.90278 10.8333 5.60764 10.9549 5.36458 11.1979C5.12153 11.441 5 11.7361 5 12.0833C5 12.4306 5.12153 12.7257 5.36458 12.9688C5.60764 13.2118 5.90278 13.3333 6.25 13.3333ZM13.75 13.3333C14.0972 13.3333 14.3924 13.2118 14.6354 12.9688C14.8785 12.7257 15 12.4306 15 12.0833C15 11.7361 14.8785 11.441 14.6354 11.1979C14.3924 10.9549 14.0972 10.8333 13.75 10.8333C13.4028 10.8333 13.1076 10.9549 12.8646 11.1979C12.6215 11.441 12.5 11.7361 12.5 12.0833C12.5 12.4306 12.6215 12.7257 12.8646 12.9688C13.1076 13.2118 13.4028 13.3333 13.75 13.3333ZM4.16667 14.1667H15.8333V10H4.16667V14.1667Z"
                fill="#666666"
              />
            </svg>
          ),
        },
        {
          label: "Organization",
          value: contributionData.Contributor?.organization || "Not provided",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 16.6667V14.3542C0 13.882 0.118056 13.4445 0.354167 13.0417C0.590278 12.6389 0.916667 12.3334 1.33333 12.125C1.52778 12.0278 1.71528 11.9375 1.89583 11.8542C2.09028 11.7709 2.29167 11.6945 2.5 11.625V16.6667H0ZM3.33333 10.8334C2.63889 10.8334 2.04861 10.5903 1.5625 10.1042C1.07639 9.6181 0.833333 9.02782 0.833333 8.33337C0.833333 7.63893 1.07639 7.04865 1.5625 6.56254C2.04861 6.07643 2.63889 5.83337 3.33333 5.83337C4.02778 5.83337 4.61806 6.07643 5.10417 6.56254C5.59028 7.04865 5.83333 7.63893 5.83333 8.33337C5.83333 9.02782 5.59028 9.6181 5.10417 10.1042C4.61806 10.5903 4.02778 10.8334 3.33333 10.8334ZM3.33333 9.16671C3.56944 9.16671 3.76389 9.09032 3.91667 8.93754C4.08333 8.77087 4.16667 8.56949 4.16667 8.33337C4.16667 8.09726 4.08333 7.90282 3.91667 7.75004C3.76389 7.58337 3.56944 7.50004 3.33333 7.50004C3.09722 7.50004 2.89583 7.58337 2.72917 7.75004C2.57639 7.90282 2.5 8.09726 2.5 8.33337C2.5 8.56949 2.57639 8.77087 2.72917 8.93754C2.89583 9.09032 3.09722 9.16671 3.33333 9.16671ZM3.33333 16.6667V14.3334C3.33333 13.8612 3.45139 13.4306 3.6875 13.0417C3.9375 12.6389 4.26389 12.3334 4.66667 12.125C5.52778 11.6945 6.40278 11.375 7.29167 11.1667C8.18056 10.9445 9.08333 10.8334 10 10.8334C10.9167 10.8334 11.8194 10.9445 12.7083 11.1667C13.5972 11.375 14.4722 11.6945 15.3333 12.125C15.7361 12.3334 16.0556 12.6389 16.2917 13.0417C16.5417 13.4306 16.6667 13.8612 16.6667 14.3334V16.6667H3.33333ZM5 15H15V14.3334C15 14.1806 14.9583 14.0417 14.875 13.9167C14.8056 13.7917 14.7083 13.6945 14.5833 13.625C13.8333 13.25 13.0764 12.9723 12.3125 12.7917C11.5486 12.5973 10.7778 12.5 10 12.5C9.22222 12.5 8.45139 12.5973 7.6875 12.7917C6.92361 12.9723 6.16667 13.25 5.41667 13.625C5.29167 13.6945 5.1875 13.7917 5.10417 13.9167C5.03472 14.0417 5 14.1806 5 14.3334V15ZM10 10C9.08333 10 8.29861 9.67365 7.64583 9.02087C6.99306 8.3681 6.66667 7.58337 6.66667 6.66671C6.66667 5.75004 6.99306 4.96532 7.64583 4.31254C8.29861 3.65976 9.08333 3.33337 10 3.33337C10.9167 3.33337 11.7014 3.65976 12.3542 4.31254C13.0069 4.96532 13.3333 5.75004 13.3333 6.66671C13.3333 7.58337 13.0069 8.3681 12.3542 9.02087C11.7014 9.67365 10.9167 10 10 10ZM10 8.33337C10.4583 8.33337 10.8472 8.17365 11.1667 7.85421C11.5 7.52087 11.6667 7.12504 11.6667 6.66671C11.6667 6.20837 11.5 5.81949 11.1667 5.50004C10.8472 5.16671 10.4583 5.00004 10 5.00004C9.54167 5.00004 9.14583 5.16671 8.8125 5.50004C8.49306 5.81949 8.33333 6.20837 8.33333 6.66671C8.33333 7.12504 8.49306 7.52087 8.8125 7.85421C9.14583 8.17365 9.54167 8.33337 10 8.33337ZM16.6667 10.8334C15.9722 10.8334 15.3819 10.5903 14.8958 10.1042C14.4097 9.6181 14.1667 9.02782 14.1667 8.33337C14.1667 7.63893 14.4097 7.04865 14.8958 6.56254C15.3819 6.07643 15.9722 5.83337 16.6667 5.83337C17.3611 5.83337 17.9514 6.07643 18.4375 6.56254C18.9236 7.04865 19.1667 7.63893 19.1667 8.33337C19.1667 9.02782 18.9236 9.6181 18.4375 10.1042C17.9514 10.5903 17.3611 10.8334 16.6667 10.8334ZM16.6667 9.16671C16.9028 9.16671 17.0972 9.09032 17.25 8.93754C17.4167 8.77087 17.5 8.56949 17.5 8.33337C17.5 8.09726 17.4167 7.90282 17.25 7.75004C17.0972 7.58337 16.9028 7.50004 16.6667 7.50004C16.4306 7.50004 16.2292 7.58337 16.0625 7.75004C15.9097 7.90282 15.8333 8.09726 15.8333 8.33337C15.8333 8.56949 15.9097 8.77087 16.0625 8.93754C16.2292 9.09032 16.4306 9.16671 16.6667 9.16671ZM17.5 16.6667V11.625C17.7083 11.6945 17.9028 11.7709 18.0833 11.8542C18.2778 11.9375 18.4722 12.0278 18.6667 12.125C19.0833 12.3334 19.4097 12.6389 19.6458 13.0417C19.8819 13.4445 20 13.882 20 14.3542V16.6667H17.5Z"
                fill="#666666"
              />
            </svg>
          ),
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
                <div className="absolute left-0 -top-[12rem] w-full h-[12rem] bg-black flex items-center justify-center p-4 overflow-hidden">
                  <span className="text-white text-5xl font-bold text-center break-words line-clamp-3">
                    {contributionData.ContributionArtifact.title}
                  </span>
                </div>
                <RenderArtifactImageAndDonatorInfo
                  donatorInformation={donatorInformation}
                  artifactImg={artifactImg}
                />
                <div className="absolute left-0 -bottom-[1.2rem] w-full h-[1.2rem] bg-black"></div>
              </div>

              {/* Middle column */}
              <div className="col-span-1 w-full h-full flex flex-col pr-5">
                <InfoSection
                  title="About The Artifact"
                  items={artifactInfo}
                  labelClassName="font-hind font-bold text-[#555555]"
                  valueClassName="block w-full max-w-[36rem] text-[#1D1911] font-bold font-hind break-words"
                  itemHeight=" h-19"
                />

                <div className="w-full pb-8 min-h-[32rem] bg-[#1D1911] rounded-r-4xl">
                  <InfoSection
                    title="Reason For Lending"
                    items={lendingReason}
                    titleClassName="mb-2 text-white"
                    labelClassName="font-hind font-medium text-xl text-[#CDC469]"
                    valueClassName="block w-full max-w-[36rem] text-white text-2xl font-medium font-hind break-words"
                    itemHeight=" h-22"
                    containerClassName="justify-end"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="col-span-1 w-full h-full rounded-r-md flex flex-col">
                <div className="w-full h-full">
                  {/* image + file container */}
                </div>

                <div className="w-full  min-h-[32rem]  bg-[#E4E4E4] rounded-r-4xl flex">
                  <div className="w-full max-w-10 h-ull bg-white rounded-r-4xl"></div>
                  <div className="w-full h-full px-13 py-10 flex flex-col space-y-5">
                    <span className="text-3xl font-semibold text-[#2F0000]">
                      Transaction Details
                    </span>
                    <div className="w-full h-fit border-y py-8 border-[#9B9B9B] flex flex-col">
                      <div className="flex w-full h-fit pb-8">
                        {transactionDescription.map(({ label, value }, idx) => (
                          <div key={idx} className="flex flex-col w-1/2">
                            <span className="text-xl text-[#2F0000]">
                              {label}
                            </span>
                            <span className="text-2xl font-semibold capitalize text-[#2F0000]">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="w-full flex flex-col">
                        <span className="text-xl text-[#2F0000]">
                          Current Manager
                        </span>
                        <span className="text-2xl font-semibold capitalize text-[#2F0000]">
                          {user.fname +" "+ user.lname}
                        </span>
                      </div>
                    </div>
                    
                    <button className="">

                    </button>




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
