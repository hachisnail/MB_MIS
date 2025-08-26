import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContextMenu from "../../../../components/modals/ContextMenu";
import { handlePreview } from "../../../../components/commons";
import { ImageCarousel } from "../../../../features/Utilities";

export function RenderRelatedDocs({ relatedImages = [], attachedFiles = [] }) {
  const [imageCurrentPage, setImageCurrentPage] = useState(1);
  const [fileCurrentPage, setFileCurrentPage] = useState(1);
  const navigate = useNavigate();

  /** Images pagination **/
  const itemsPerPage = 3;
  const totalPages = Math.ceil(relatedImages.length / itemsPerPage);

  const paginatedImages = relatedImages.slice(
    (imageCurrentPage - 1) * itemsPerPage,
    imageCurrentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (imageCurrentPage < totalPages) {
      setImageCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (imageCurrentPage > 1) {
      setImageCurrentPage((prev) => prev - 1);
    }
  };

  /** Files pagination **/
  const fileItemsPerPage = 4;
  const fileTotalPages = Math.ceil(attachedFiles.length / fileItemsPerPage);

  const paginatedFiles = attachedFiles.slice(
    (fileCurrentPage - 1) * fileItemsPerPage,
    fileCurrentPage * fileItemsPerPage
  );

  const handleFileNextPage = () => {
    if (fileCurrentPage < fileTotalPages) {
      setFileCurrentPage((prev) => prev + 1);
    }
  };

  const handleFilePreviousPage = () => {
    if (fileCurrentPage > 1) {
      setFileCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start gap-y-5">
      {/* Images Section */}
      <div className="w-full p-5 rounded-lg border border-gray-400 flex flex-col">
        <span className="text-2xl font-semibold">
          Related images / about the artifact
        </span>

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

            <div className="flex gap-x-4 h-64 w-full">
              {paginatedImages.map(({ key, src }) => (
                <div
                  key={key}
                  className="w-65 h-65 flex items-center bg-cover bg-no-repeat bg-center text-white justify-center border bg-gray-600 rounded-lg"
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

      {/* Files Section */}
      <div className="w-full h-[12rem] flex rounded-lg border-gray-400 border bg-black">
        <div className="max-w-60 w-full h-full flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">
            Attached Files
          </span>
        </div>

        <div className="rounded-lg w-full h-full bg-white gap-y-2 pt-4 flex items-center flex-col justify-center px-4">
          <div className="flex items-center w-full gap-x-2">
            {/* Prev Button */}
            <button
              onClick={handleFilePreviousPage}
              disabled={fileCurrentPage === 1}
              className="hover:text-gray-600 h-full cursor-pointer disabled:opacity-50"
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

            {/* File Cards */}
            <div className="w-full flex gap-x-2">
              {paginatedFiles.map(({ key, filename, category }) => (
                <ContextMenu
                  key={key}
                  menuItems={[
                    {
                      label: "Preview",
                      onClick: () =>
                        handlePreview(navigate, category, filename),
                    },
                    {
                      label: "Download",
                      onClick: () => alert("download clicked"),
                    },
                    {
                      label: "Delete",
                      onClick: () => alert("delete clicked"),
                    },
                  ]}
                >
                  <div className="w-33 h-33 flex flex-col items-center justify-center text-black bg-gray-200 rounded-lg">
                    <div className="w-5 h-5 border"></div>
                    <span>{filename}</span>
                    <span>{category}</span>
                  </div>
                </ContextMenu>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleFileNextPage}
              disabled={fileCurrentPage === fileTotalPages}
              className="hover:text-gray-600 h-full cursor-pointer disabled:opacity-50"
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

          {/* Page Indicators */}
          <div className="flex gap-x-2 ">
            {Array.from({ length: fileTotalPages }).map((_, index) => (
              <div
                key={index}
                className={`w-5 h-1 rounded ${
                  fileCurrentPage === index + 1 ? "bg-gray-900" : "bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RenderArtifactInformation({ artifactImg = [] }) {
  return (
    <div className="w-full max-w-[48rem] h-[62rem] flex flex-col gap-y-5 px-15">
      <div className="w-full h-auto p-4 bg-white rounded-xl shadow-[0_2px_16px_2px_rgba(0,0,0,0.25)]">
        <div className="w-fit h-fit flex flex-col gap-2">
          <div className="w-full h-[4rem] px-17 flex gap-3 items-center">
            <div className="w-14 h-14 text-[#332613]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-full h-full"
              >
                <path
                  clipRule="evenodd"
                  fillRule="evenodd"
                  d="M1 1H15V15H1V1ZM6 9L8 11L13 6V13H3V12L6 9ZM6.5 7C7.32843 7 8 6.32843 8 5.5C8 4.67157 7.32843 4 6.5 4C5.67157 4 5 4.67157 5 5.5C5 6.32843 5.67157 7 6.5 7Z"
                />
              </svg>
            </div>
            <span className="text-4xl text-[#332613] font-hind font-bold tracking-wider">
              Artifact Image
            </span>
          </div>
          <ImageCarousel mainSize="w-98 h-98" thumbnailSize="w-22 h-22" images={artifactImg} />
        </div>
      </div>

      <div className="w-full h-[5rem] bg-white rounded-xl shadow-[0_6px_16px_2px_rgba(0,0,0,0.25)] flex items-center justify-between">
        <div className="w-[22rem] h-full flex items-center justify-center">
          <p className="text-2xl font-bold font-hind text-[#383123]">
            This artifact is currently
          </p>
        </div>
        <div className="w-[26rem] h-full flex items-center px-12">
          <div className="w-full h-12 bg-[#FFBE63] flex items-center justify-center rounded-xl">
            <p className="text-xl font-bold tracking-wider font-hind">
              On Maintenance
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-[23rem]">
        <div className="w-full h-full rounded-xl bg-gradient-to-b from-black via-[#2e1c00] to-[#383123] gap-6 flex flex-col px-8 py-5">
          <div className="h-auto w-full">
            <span className="text-4xl font-hind text-[#FFBE63] font-semibold tracking-wide">
              Maintenance Description
            </span>
          </div>
          <div className="w-full h-full">
            <p className="text-xl text-white font-hind font-normal text-justify">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
