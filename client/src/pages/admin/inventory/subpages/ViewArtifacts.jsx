import { useState } from "react";
import { RenderRelatedDocs } from "../components/Artifactlist";
import ImageCarousel from "../components/ImageCarousel";
import MaintenanceReportCard from "../components/MaintenanceReportCard";

const ViewArtifacts = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const relatedImages = [
    { src: "https://picsum.photos/id/1011/800/800", alt: "Forest" },
    { src: "https://picsum.photos/id/1025/800/800", alt: "Doggo" },
    { src: "https://picsum.photos/id/1020/800/800", alt: "Lake" },
    { src: "https://picsum.photos/id/1003/800/800", alt: "Bridge" },
  ];

  const attachedFiles = [
    { name: "File 1", url: "#" },
    { name: "File 2", url: "#" },
  ];

  // tabs
  const [activeTab, setActiveTab] = useState("Artifact Information");
  const TABS = ["Artifact Information", "Maintenance Report"];

  // ✅ define the report state (this fixes "maintReport1 is not defined")
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

      {activeTab === "Artifact Information" && (
        <>
          <div className="w-full h-full rounded-md grid grid-cols-[43rem_34rem_52rem]">
            {/* ==================== LEFT COLUMN (full overflow background) ==================== */}
            <div className="col-span-1 relative overflow-visible h-full">
              <div className="absolute inset-x-0 -top-full -bottom-[1.2rem] bg-black" aria-hidden />
              <div className="relative w-full h-full flex flex-col">
                <div className="w-full h-[12rem] flex items-start justify-end pl-10 pb-5 pt-4 overflow-hidden flex-col">
                  <span className="text-white text-3xl font-bold text-left break-words line-clamp-3 max-w-[38rem]">
                    {/* {contributionData.ContributionArtifact.title} */}
                  </span>
                </div>
              </div>
            </div>

            {/* ==================== MIDDLE COLUMN ==================== */}
            <div className="col-span-1 w-[30rem] h-full flex flex-col gap-8">
              <div className="w-[30rem] h-[7rem] bg-[#EDCA86] rounded-r-3xl flex justify-center items-center p-2">
                <div className="w-full h-fit flex items-center gap-1">
                  <span className="text-2xl font-semibold text-black">This artifact is currently</span>
                  <div className="w-[12rem] h-full bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">On Maintenance</span>
                  </div>
                </div>
              </div>

              <div className="w-[30rem] h-[20rem] bg-[#9A8252] rounded-r-3xl flex flex-col items-center p-6 gap-4 text-white font-hind px-10">
                <span className="text-3xl font-semibold">Maintenance description</span>
                <p className="text-lg font-semibold text-justify tracking-wider">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                  labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                  voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                  non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
              </div>

              <div className="w-[30rem] h-[27rem] bg-[#1D1911] rounded-r-3xl flex flex-col items-center p-6 gap-4 text-white font-hind">
                <span className="text-3xl font-bold">Artifact Damage</span>

                <div className="flex items-center justify-center overflow-hidden">
                  <ImageCarousel
                    images={relatedImages}
                    thumbnailSizeClass="w-[3rem] h-[3rem]"
                    mainSizeClass="w-[14rem] h-[14rem]"
                  />
                </div>

                <span className="text-2xl font-bold">Termite Damage</span>

                <span className="text-lg font-bold text-center">
                  The handle shows visible termite damage, with parts of the wood hollowed out and weakened.
                </span>
              </div>
            </div>

            {/* ==================== RIGHT COLUMN (with sliding panel) ==================== */}
            <div className="relative col-span-1 w-full h-[60rem] flex flex-col ml-12 gap-12 overflow-visible">
              {/* top section */}
              <div className="w-full h-[29rem] bg-[#1D1911] rounded-l-3xl"></div>

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
                    imgHeight="h-12"
                  />
                </div>
              </div>

              {/* sliding panel (covers entire right column) */}
              <div
                className={`absolute top-0 right-0 w-full h-[60rem] bg-white border-2 border-[#1D1911] rounded-l-3xl z-20 transform transition-transform duration-500 ${
                  isPanelOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
                {/* toggle button (sticks to left edge of panel, overlaps middle column) */}
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

                {/* panel content — header + Report card */}
                <div className="w-full h-full flex flex-col p-4 overflow-auto">
                  
                  <div className="w-full h-[24rem] bg-amber-200"></div>
                  <div className="w-full h-[20rem] bg-blue-200"></div>
                  <div className="w-full h-[22rem] bg-red-200"></div>
                
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====================== MAINTENANCE REPORT TAB (only black rail) ====================== */}
      {activeTab === "Maintenance Report" && (
  <div className="w-full h-full grid grid-cols-[43rem_1fr] items-start">
    {/* LEFT: black rail (fixed height, won’t stretch) */}
    <div className="col-span-1 relative overflow-visible self-start h-full">
      {/* background that overflows above/below the column, but is bounded to h-[60rem] */}
      <div className="absolute inset-x-0 -top-full -bottom-[1.2rem] bg-black" aria-hidden />
      
    </div>

        <div >
          <div className="w-full h-20 rounded-r-2xl bg-[#1D1911] flex items-center justify-start pl-12">
            <span className="text-3xl font-bold font-hind text-white tracking-wide">Maintenance record</span>
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
    <div className="w-full">
      
    </div>
    </div>
  </div>
)}

    </div>
  );
};

export default ViewArtifacts;
