import { useLocation } from "react-router-dom";
import { useState, useEffect, act } from "react";
import {
  RenderRelatedDocs,
  RenderLendingReason,
  RenderArtifactInformation,
} from "@/components/list/Acquisitonlist";
import StyledButton from "@/components/buttons/StyledButton";
import MultiLineInput from "@/features/MultiLineInput";

const AcquisitionViewPage = () => {
  const location = useLocation();
  const [acquisitionType, setAcquisitionType] = useState("");
  const [activeTab, setActiveTab] = useState("left");
  const [messageReply, setMessageReply] = useState();

  useEffect(() => {
    if (location.pathname.includes("lending")) {
      setAcquisitionType("lending");
    } else if (location.pathname.includes("donation")) {
      setAcquisitionType("donation");
    }
  }, [location.pathname]);

  // set values here

  const donatorInformation = [
    { label: "From", value: "Juan Dela Cruz" },
    { label: "Email", value: "juandelacruz@gmail.com" },
    { label: "Phone Number", value: "09123456789" },
    {
      label: "Address",
      value: "Ofelia Street, Barangay 2, Daet, Camarines Norte",
    },
    { label: "Organization", value: "Juan dela Cruz Elementary School" },
  ];

  const lendingReason = [
    {
      label: "Propose duration of the loan:",
      value: "5 years, January 2024 - June 1, 2024",
    },
    {
      label:
        "Specific conditions or requirements for handling of the artifact:",
      value:
        "The artifact should be places somewhere there’s no much moist to avoid more rusting",
    },
    {
      label:
        "Specific liability concerns or requirements regarding the artifact:",
      value:
        "If the artifact get damaged you must compensate me with a value that is agreeable by the both party.If the artifact get damaged you must compensate me with a value that is agreeable by the both party.",
    },
    {
      label: "Reason for lending:",
      value:
        "I got a feeling that the artifact should be seen by everyone do be much more aware from where we came from.",
    },
  ];

  const relatedImages = [
    {
      key: "1",
      src: "https://placehold.co/600x600?text=Overview+1",
      label: "Overview 1",
    },
    {
      key: "2",
      src: "https://placehold.co/600x600?text=Detail+2",
      label: "Detail 2",
    },
    {
      key: "3",
      src: "https://placehold.co/600x600?text=Angle+3",
      label: "Angle 3",
    },
    {
      key: "4",
      src: "https://placehold.co/600x600?text=Angle+4",
      label: "Angle 4",
    },
    {
      key: "5",
      src: "https://placehold.co/600x600?text=Context+5",
      label: "Context 5",
    },
    {
      key: "6",
      src: "https://placehold.co/600x600?text=Close‑up+6",
      label: "Close‑up 6",
    },
  ];

  const attachedFiles = [
    { key: "1", filename: "file 1", category: "file" },
    { key: "2", filename: "file 2", category: "file" },
    { key: "3", filename: "file 3", category: "file" },
    { key: "4", filename: "file 4", category: "file" },
    { key: "5", filename: "file 5", category: "file" },
  ];

  const artifactInfo = [
    {
      label: "Title/Name of the Artifact:",
      value: "My Great Grandfather's Bolo during World War  2",
    },
    {
      label: "Artifact Description:",
      value:
        "The Bolo is Still intact,  there is a little rust near the handle an the scabbard is already missing.",
    },
    {
      label: "How and where was the artifact acquired:",
      value:
        "It was given to me by my father and it is passed through generations so it is like a family helium.",
    },
    {
      label: "Information about the artifact that the museum should know:",
      value: "The Blade is a little bit loose so you must be careful about it.",
    },
    {
      label: "Brief narrative or story related to the artifact.",
      value:
        "The artifact is used by my grandfather on the WWII and during a unit practice. U.S. Army’s 1st Filipino Infantry Regiment.",
    },
  ];

  const artifactImg = [
    {
      src: "https://placehold.co/600x600?text=Front+View",
      label: "Front View",
    },
    {
      src: "https://placehold.co/600x600?text=Side+View",
      label: "Side View",
    },
    {
      src: "https://placehold.co/600x600?text=Back+View",
      label: "Back View",
    },
    {
      src: "https://placehold.co/600x600?text=Close-up",
      label: "Close‑up",
    },
    {
      src: "https://placehold.co/600x600?text=Display+Case",
      label: "Display Case",
    },
  ];

  const email = "juandelacruz@gmail.com";

  return (
    <div className="flex flex-col justify-between w-full h-full items-center">
      <div className=" flex">
        {/* button right */}
        {activeTab === "right" && (
          <button
            className="w-fit h-full hover:text-gray-500 cursor-pointer"
            onClick={() => setActiveTab("left")}
          >
            {/* pagination */}

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

        {activeTab === "left" && (
          <div className="flex gap-x-10 w-fit h-full">
            <div className="min-w-[60rem] h-full flex flex-col gap-y-10">
              <div className="w-full min-h-fit h-fit border gap-y-5 border-gray-400 rounded-lg flex flex-col p-8">
                <span className="text-4xl font-semibold">
                  Donators Information
                </span>
                {donatorInformation.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex gap-x-5 w-full text-2xl h-fit font-semibold "
                  >
                    <span className="w-45">{label}</span>
                    <span className="font-normal text-[#333333]">{value}</span>
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

            <div className="w-full h-full">
              <RenderArtifactInformation
                artifactInfo={artifactInfo}
                artifactImg={artifactImg}
              />
            </div>
          </div>
        )}

        {activeTab === "right" && (
          <div className="w-full flex h-full gap-x-10">
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

            <form className="min-w-[60rem] h-full rounded-lg bg-gray-200 flex flex-col px-10 pt-15 pb-5">
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
                rows={32}
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
            className="w-fit h-full hover:text-gray-500 cursor-pointer"
            onClick={() => setActiveTab("right")}
          >
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
    </div>
  );
};

export default AcquisitionViewPage;
