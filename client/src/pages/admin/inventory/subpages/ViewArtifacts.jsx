import { useState } from "react";
import {
  RenderRelatedDocs,
  RenderArtifactInformation,
} from "../components/Artifactlist";

// ✅ Reusable component for donor info items
const DonorInfoItem = ({ icon, label, value }) => (
  <div className="w-full h-[3.5rem] flex flex-col gap-1">
    <div className="w-full h-[2rem] flex gap-2 text-black items-end">
      <div className="w-10 h-10">{icon}</div>
      <p className="font-bold text-2xl font-hind">{label}:</p>
    </div>
    <div className="w-full h-[2.5rem] flex items-center pl-16">
      <p className="text-2xl font-bold text-[#624925]">{value}</p>
    </div>
  </div>
);

// ✅ Artifact Damage component
const ArtifactDamage = ({ relatedImages = [] }) => {
  const [imageCurrentPage, setImageCurrentPage] = useState(1);

  const itemsPerPage = 3;
  const totalPages = Math.ceil(relatedImages.length / itemsPerPage);

  const paginatedImages = relatedImages.slice(
    (imageCurrentPage - 1) * itemsPerPage,
    imageCurrentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (imageCurrentPage < totalPages) {
      setImageCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (imageCurrentPage > 1) {
      setImageCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <div className="w-full h-[30rem] px-4 pt-2 rounded-lg border border-gray-400 flex flex-col">
      <span className="text-2xl font-bold">Artifact Damages</span>

      <div className="max-w-[60rem] h-full flex flex-col items-center gap-y-4 mt-4 justify-center">
        <div className="flex items-center">
          {/* Prev Button */}
          <button
            onClick={handlePreviousPage}
            disabled={imageCurrentPage === 1}
            className="h-full hover:text-gray-600 cursor-pointer disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 20l-3 -8l3 -8" />
            </svg>
          </button>

          {/* Images */}
          <div className="flex gap-x-4 h-64 w-full">
            {paginatedImages.map(({ key, src }) => (
              <div
                key={key}
                className="w-63 h-63 flex items-center bg-cover bg-no-repeat bg-center text-white justify-center border bg-gray-600 rounded-lg"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextPage}
            disabled={imageCurrentPage === totalPages}
            className="h-full hover:text-gray-600 cursor-pointer disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4l3 8l-3 8" />
            </svg>
          </button>
        </div>

        {/* Damage Notes Box */}
        <div className="w-full h-[8rem]  flex flex-col items-center py-2 px-12 gap-2"> 
          <span className="text-2xl font-semibold text-[#393224]">Termite Damage</span>

          <span className="text-xl font-semibold text-[#393224]">
            The handle shows visible termite damage, with parts of the wood hollowed out and weakened.
          </span>
        </div>

        {/* Page Indicators */}
        <div className="flex gap-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <div
              key={index}
              className={`w-5 h-1 rounded ${
                imageCurrentPage === index + 1 ? "bg-gray-900" : "bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ViewArtifacts = () => {
  const [activeTab, setActiveTab] = useState("left");

  // Donor info data
  const donorDetails = [
    {
      label: "Name",
      value: "Juan Dela Cruz",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z"
          />
        </svg>
      ),
    },
    {
      label: "Email",
      value: "juandlacruz@gmail.com",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path d="M20 4H4v16h16V4zm-2 2L12 13 6 6V6h12zM6 18V8l6 6 6-6v10H6z" />
        </svg>
      ),
    },
    {
      label: "Contact",
      value: "09786734766",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.21 1.11l-2.43 2.43z" />
        </svg>
      ),
    },
    {
      label: "Address",
      value: "Ofelia Street, Barangay 2, Daet, Camarines Norte",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
      ),
    },
    {
      label: "Organization",
      value: "Juan dela Cruz Elementary School",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z"
          />
        </svg>
      ),
    },
  ];

  const relatedImages = [
    { key: "1", src: "https://placehold.co/600x600?text=Overview+1" },
    { key: "2", src: "https://placehold.co/600x600?text=Detail+2" },
    { key: "3", src: "https://placehold.co/600x600?text=Angle+3" },
    { key: "4", src: "https://placehold.co/600x600?text=Angle+4" },
    { key: "5", src: "https://placehold.co/600x600?text=Context+5" },
    { key: "6", src: "https://placehold.co/600x600?text=Close-up+6" },
  ];

  const attachedFiles = [
    { key: "1", filename: "file 1", category: "file" },
    { key: "2", filename: "file 2", category: "file" },
    { key: "3", filename: "file 3", category: "file" },
    { key: "4", filename: "file 4", category: "file" },
    { key: "5", filename: "file 5", category: "file" },
  ];



  const artifactImg = [
    {
      src: "https://stockcake.com/i/historical-artifact-display_1355705_1099471",
      label: "Ancient Weaponry Display",
    },
    {
      src: "https://stockcake.com/i/ancient-artifact-display_1330400_874474",
      label: "Museum Urn Exhibit",
    },
    {
      src: "https://stockcake.com/i/ancient-artifacts-displayed_1355707_1099471",
      label: "Armor & Relics Showcase",
    },
    {
      src: "https://stockcake.com/i/museum-artifact-collection_1247966_1088396",
      label: "Mixed Artifacts Gallery",
    },
  ];

  return (
    <div className="flex flex-col justify-center w-full h-full items-center gap-y-3">
      <div className="flex">
        {/* button right */}
        {activeTab === "right" && (
          <button
            className="w-fit h-full hover:text-gray-500 cursor-pointer"
            onClick={() => setActiveTab("left")}
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
              <path d="M13 20l-3 -8l3 -8" />
            </svg>
          </button>
        )}

        {activeTab === "left" && (
          <div className="flex gap-x-10 w-fit h-[62rem]">
            <div className="w-fit h-fit">
              <RenderArtifactInformation
               
                artifactImg={artifactImg}
              />
            </div>

            <div className="w-full max-w-[58rem] h-[62rem]  flex flex-col gap-y-6 ">
              <div className="w-full min-h-fit h-fit rounded-xl shadow-[0_6px_16px_2px_rgba(0,0,0,0.25)] gap-y-5 flex flex-col p-8">
                <span className="text-4xl font-semibold">
                  Donors Information
                </span>
                <div className="w-full h-[22.5rem] px-6 flex flex-col gap-3 py-2">
                  {donorDetails.map((item, idx) => (
                    <DonorInfoItem key={idx} {...item} />
                  ))}
                </div>
              </div>

              <ArtifactDamage relatedImages={relatedImages} />
            </div>
          </div>
        )}

        {activeTab === "right" && (
          <div className="w-full flex h-full gap-x-10">
            <div className="w-full h-[62rem] min-w-[48rem] flex flex-col p-6 gap-y-4 rounded-xl shadow-[0_2px_16px_2px_rgba(0,0,0,0.25)]">
              <span className="text-4xl font-semibold text-[#383123]">
                Artifact Information
              </span>
              <div className="w-full h-[26rem] rounded-xl bg-gradient-to-b from-[#FFBE63] to-[#383123] flex flex-col gap-4 p-6" >
                <span>
                    Basic Informationsdads
                </span>
                
              </div>
              <div className="w-full h-[16rem] rounded-xl bg-gradient-to-b from-[#383123] to-[#010101]" ></div>
              <div className="w-full h-[22rem] rounded-xl bg-[#000000]" ></div>
            </div>

            <div className="w-full min-w-[64rem] h-full flex flex-col px-10 pb-5 gap-y-6">
              <div className="w-full h-[24rem] rounded-xl bg-gradient-to-b from-[#000000] to-[#383123]">

              </div>
              <div className="w-full h-auto">
                <RenderRelatedDocs
                  relatedImages={relatedImages}
                  attachedFiles={attachedFiles}
                />
              </div>
            </div>
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

      {/* tab indicators */}
      <div className="w-full h-1 flex items-center justify-center gap-x-5">
        <div
          className={`w-100 h-1 ${
            activeTab === "left" ? "bg-black" : "bg-gray-500"
          }`}
        />
        <div
          className={`w-100 h-1 ${
            activeTab === "right" ? "bg-black" : "bg-gray-500"
          }`}
        />
      </div>
    </div>
  );
};

export default ViewArtifacts;
