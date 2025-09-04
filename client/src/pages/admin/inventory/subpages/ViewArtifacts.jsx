import { useState } from "react";
import {
  RenderRelatedDocs,
  RenderArtifactInformation,
} from "../components/Artifactlist";

const ViewArtifacts = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const donorDetails = [
    { label: "Full Name of Donor:", value: "Juan Dela Cruz" },
    { label: "Sex:", value: "Male" },
    { label: "Address:", value: "Baguio City, Benguet" },
  ];

  const relatedImages = [
    { src: "/src/assets/sample1.jpg", alt: "Image 1" },
    { src: "/src/assets/sample2.jpg", alt: "Image 2" },
  ];

  const attachedFiles = [
    { name: "File 1", url: "#" },
    { name: "File 2", url: "#" },
  ];

  const artifactImg = "/src/assets/sample-artifact.jpg";

  return (
    <div className="w-full h-full rounded-md grid grid-cols-[43rem_1fr_1fr]">
      {/* left column */}
      <div className="col-span-1 w-full h-full bg-black relative overflow-visible flex flex-col">
        <div className="absolute left-0 -top-[12rem] w-full h-[12rem] bg-black flex items-start justify-end pl-10 pb-5 pt-4 overflow-hidden flex-col">
          <span className="text-white text-3xl font-bold text-left break-words line-clamp-3 max-w-[38rem]">
            {/* {contributionData.ContributionArtifact.title} */}
          </span>
          {/* <Breadcrumb hideTitle={true} overrideTheme="text-white" /> */}
        </div>
        {/* <RenderArtifactImageAndDonatorInfo
          donatorInformation={donatorInformation}
          artifactImg={artifactImg}
        /> */}
        <div className="absolute left-0 -bottom-[1.2rem] w-full h-[1.2rem] bg-black"></div>
      </div>

      {/* middle column */}
      <div className="col-span-1 w-[62rem] h-full flex flex-col gap-8">
        <div className="w-[36rem] h-[10rem] bg-[#EDCA86] rounded-r-3xl"></div>
        <div className="w-[36rem] h-[26rem] bg-[#9A8252] rounded-r-3xl"></div>
        <div className="w-[36rem] h-[26rem] bg-[#1D1911] rounded-r-3xl"></div>
      </div>

      {/* right column */}
<div className="relative col-span-1 w-full h-full flex flex-col ml-12 gap-12 overflow-visible">
  {/* top section */}
  <div className="w-full h-[40rem] bg-[#1D1911] rounded-l-3xl"></div>

  {/* bottom section */}
  <div className="w-full h-full flex relative">
    <div className="w-full">
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
  </div>

  {/* sliding panel (covers entire right column) */}
  <div
    className={`absolute top-0 right-0 w-full h-[70rem] bg-white border-2 border-[#1D1911] rounded-l-3xl z-20 transform transition-transform duration-500 ${
      isPanelOpen ? "translate-x-0" : "translate-x-full"
    }`}
  >
    {/* toggle button (sticks to left edge of panel, overlaps middle column) */}
 <button
  onClick={() => setIsPanelOpen((prev) => !prev)}
  className={`absolute -bottom-38 -translate-y-1/2  
              ${isPanelOpen ? "-left-[5rem] w-[5rem]" : "-left-[12rem] w-[12rem]"} 
              h-[32rem] bg-[#1D1911] rounded-tl-2xl rounded-bl-2xl 
              text-white font-bold shadow-lg z-30 
              flex items-center justify-center 
              transition-all duration-500`}
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
    {/* panel content */}
    <div className="w-full h-full flex flex-col  p-6 items-center justify-center text-white text-2xl gap-8">
      <div className="w-full h-[24rem] bg-amber-200">

      </div>

      <div className="w-full h-[20rem] bg-blue-200">

      </div>

      <div className="w-full h-[22rem] bg-red-200">

      </div>
    </div>
  </div>
</div>

    </div>
  );
};

export default ViewArtifacts;
