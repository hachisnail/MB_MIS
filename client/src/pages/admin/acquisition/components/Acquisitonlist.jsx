import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ContextMenu from "../../../../components/modals/ContextMenu";
import { handlePreview } from "../../../../components/commons";
import { ImageCarousel } from "../../../../features/Utilities";
import { formatDateForDisplay } from "@/components/commons";
import ListRowRenderer from "../../../../components/tables/ListRowRenderer";


const sampleDetails = [
  {
    purpose: "Research",
    visitorCount: 3,
    present: "Yes",
    date: "2025-08-23",
  },
  {
    purpose: "Exhibition",
    visitorCount: 5,
    present: "No",
    date: "2025-08-24",
  },
];


const acquisitionColumns = [
  {
    key: "submission_date",
    render: (date) => formatDateForDisplay(date),
  },
  {
    key: "Contributor",
    render: (_, item) =>
      `${item.Contributor?.first_name || ""} ${item.Contributor?.last_name || ""}`,
  },
  {
    key: "ContributionArtifact",
    render: (_, item) => item.ContributionArtifact?.title || "Untitled",
  },
  {
    key: "status",
    render: (value) => (
      <span
        className={`px-3 rounded font-semibold ${
          value === "approved"
            ? "bg-green-100 text-green-700"
            : value === "pending"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {value?.charAt(0).toUpperCase() + value?.slice(1)}
      </span>
    ),
  },
  {
    key: "contribution_type",
    render: (v) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : ""),
  },
];

export function AcquisitionItem({ item, headers }) {
  return (
    <ListRowRenderer
      item={item}
      columns={acquisitionColumns}
      headers={headers}
      // details={sampleDetails} // manually pass expanded data here
      onRowClick={`/admin/dashboard`}
    />
  );
}

export function RenderRelatedDocs({ relatedImages = [], attachedFiles = [] }) {
  const [imageCurrentPage, setImageCurrentPage] = useState(1);
  const [fileCurrentPage, setFileCurrentPage] = useState(1);
  const [isLending, setIsLending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLending(location.pathname.includes("lending"));
  }, [location.pathname]);

  /** Images pagination **/
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

  /** Files pagination **/
  const fileItemsPerPage = 4;
  const fileTotalPages = Math.ceil(attachedFiles.length / fileItemsPerPage);

  const paginatedFiles = attachedFiles.slice(
    (fileCurrentPage - 1) * fileItemsPerPage,
    fileCurrentPage * fileItemsPerPage
  );

  const handleFileNextPage = () => {
    if (fileCurrentPage < fileTotalPages) {
      setFileCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handleFilePreviousPage = () => {
    if (fileCurrentPage > 1) {
      setFileCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleDownload = () => {};

  return (
    <div
      className={`w-full h-full flex flex-col items-center ${
        isLending ? "justify-center" : "justify-start"
      }  gap-y-5`}
    >
      {/* Images Section */}
      <div className="w-full p-5 rounded-lg border border-gray-400 flex flex-col">
        <span className="text-2xl font-semibold">
          Related images / about the artifact
        </span>

        <div className="max-w-[60rem] h-full flex flex-col items-center gap-y-4 mt-4 justify-center">
          <div className="flex items-center">
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
          {/* Prev Button */}
          <div className="flex items-center w-full gap-x-2">
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
                  <div
                    key={key}
                    className="w-33 h-33 flex flex-col items-center justify-center text-black  bg-gray-200 rounded-lg"
                  >
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

export function RenderLendingReason({ lendingReason = [] }) {
  return (
    <div className="w-full min-h-fit h-full border border-gray-400 gap-y-5 rounded-lg flex flex-col p-8">
      <span className="text-4xl font-semibold">Reason for Lending</span>
      <div className="max-h-[33.5rem] h-full gap-y-6 flex flex-col overflow-auto">
        {lendingReason.map(({ label, value }) => (
          <div
            key={label}
            className="w-full flex flex-col h-fit text-2xl font-medium"
          >
            <span>{label}</span>
            <span className="text-blue-500">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RenderArtifactInformation({
  artifactInfo = [],
  artifactImg = [],
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getImage = (index) => {
    if (!artifactImg.length) return null;
    return artifactImg[(index + artifactImg.length) % artifactImg.length];
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + artifactImg.length) % artifactImg.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % artifactImg.length);
  };

  const sideImages = Array.from({ length: 4 }, (_, i) =>
    getImage(currentIndex + i + 1)
  );

  return (
    <div className="w-full max-w-[58rem] just h-full flex flex-col gap-y-5 px-15">
      <span className="text-4xl font-semibold">About The Artifact</span>

      <div className="max-h-[24rem] h-full gap-y-5 flex flex-col overflow-auto ">
        {artifactInfo.map(({ label, value }) => (
          <div
            key={label}
            className="w-full flex flex-col h-fit text-2xl font-medium"
          >
            <span id="value" className="font-normal">
              {label}
            </span>
            <span className="text-blue-500 font-normal">{value}</span>
          </div>
        ))}
      </div>

      <ImageCarousel images={artifactImg} />
    </div>
  );
}
