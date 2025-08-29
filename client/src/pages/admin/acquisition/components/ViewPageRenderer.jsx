import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { handlePreview } from "../../../../components/commons";
import { ImageCarousel } from "../../../../features/Utilities";
import ContextMenu from "../../../../components/modals/ContextMenu";
import { formatDate } from "../../appointments/components/dateUtils";
import ImageViewerModal from "../../../../features/ImageViewerModal";
import { FileType } from "lucide-react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export function RenderRelatedDocs({ relatedImages = [], attachedFiles = [] }) {
  const [imageCurrentPage, setImageCurrentPage] = useState(1);
  const [fileCurrentPage, setFileCurrentPage] = useState(1);
  const [isLending, setIsLending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);

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
    if (imageCurrentPage < totalPages) setImageCurrentPage((prev) => prev + 1);
  };
  const handlePreviousPage = () => {
    if (imageCurrentPage > 1) setImageCurrentPage((prev) => prev - 1);
  };

  /** Files pagination **/
  const fileItemsPerPage = 4;
  const fileTotalPages = Math.ceil(attachedFiles.length / fileItemsPerPage);
  const paginatedFiles = attachedFiles.slice(
    (fileCurrentPage - 1) * fileItemsPerPage,
    fileCurrentPage * fileItemsPerPage
  );
  const handleFileNextPage = () => {
    if (fileCurrentPage < fileTotalPages)
      setFileCurrentPage((prev) => prev + 1);
  };
  const handleFilePreviousPage = () => {
    if (fileCurrentPage > 1) setFileCurrentPage((prev) => prev - 1);
  };

  console.log(attachedFiles);

  return (
    <div
      className={`w-[55rem] h-full flex flex-col items-center gap-y-5 ${
        isLending ? "justify-center" : "justify-start"
      }`}
    >
      {/* Images Section */}
      {relatedImages.length > 0 && (
        <div className="w-full p-5 rounded-lg border border-gray-400 flex flex-col">
          <span className="text-2xl font-semibold">
            Related Images / About the Artifact
          </span>

          <div className="max-w-[60rem] h-full flex flex-col items-center gap-y-4 mt-4 justify-center">
            <div className="flex items-center gap-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={imageCurrentPage === 1}
                className="h-full border-r hover:text-gray-600 cursor-pointer disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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

              <div className="w-[47rem] flex gap-x-4">
                {paginatedImages.map(({ key, src, label }, idx) => (
                  <div
                    key={key}
                    className="w-50 h-50 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setModalStartIndex(
                        (imageCurrentPage - 1) * itemsPerPage + idx
                      );
                      setIsModalOpen(true);
                    }}
                  >
                    <img
                      src={
                        src.startsWith("http")
                          ? src
                          : `${SERVER_URL}/uploads/private/pictures/${src}`
                      }
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={imageCurrentPage === totalPages}
                className="h-full hover:text-gray-600 border-l cursor-pointer disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
            </div>

            <div className="flex gap-x-2 mt-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <div
                  key={index}
                  className={`w-5 h-1 rounded ${
                    imageCurrentPage === index + 1
                      ? "bg-gray-900"
                      : "bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Files Section */}
      {attachedFiles.length > 0 && (
        <div className="w-full h-[12rem] flex rounded-lg border-gray-400 border bg-black mt-5">
          <div className="max-w-60 w-full h-full flex items-center justify-center">
            <span className="text-white text-2xl font-semibold">
              Attached Files
            </span>
          </div>

          <div className="rounded-lg w-full h-full bg-white gap-y-2 pt-4 flex items-center flex-col justify-center px-4">
            <div className="flex items-center w-full gap-x-2">
              <button
                onClick={handleFilePreviousPage}
                disabled={fileCurrentPage === 1}
                className="hover:text-gray-600 border-r h-full cursor-pointer disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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

              <div className="w-full flex gap-x-2">
                {paginatedFiles.map(({ key, filename, category, url }) => (
                  <ContextMenu
                    key={key}
                    menuItems={[
                      {
                        label: "Preview",
                        onClick: () => {
                            const fileType = filename.split('.').pop().toLowerCase();
                          handlePreview(
                            navigate,
                            `${location.pathname}/view`, 
                            url,
                            filename,
                            fileType
                          )}
                      },
                      {
                        label: "Download",
                        onClick: () => window.open(url, "_blank"),
                      },
                      {
                        label: "Delete",
                        onClick: () => alert("delete clicked"),
                      },
                    ]}
                  >
                    <div className="w-32 h-32 flex flex-col pt-7 items-center justify-center text-black bg-gray-200 rounded-lg">
                      <div className="w-5 h-5 border mb-1"></div>
                      <span className="text-sm h-5 truncate w-25">
                        {filename}
                      </span>
                      <span className="text-xs">{category}</span>
                    </div>
                  </ContextMenu>
                ))}
              </div>

              <button
                onClick={handleFileNextPage}
                disabled={fileCurrentPage === fileTotalPages}
                className="hover:text-gray-600 h-full border-l cursor-pointer disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
            </div>

            <div className="flex gap-x-2 mt-2">
              {Array.from({ length: fileTotalPages }).map((_, index) => (
                <div
                  key={index}
                  className={`w-5 h-1 rounded ${
                    fileCurrentPage === index + 1
                      ? "bg-gray-900"
                      : "bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {isModalOpen && (
        <ImageViewerModal
          images={relatedImages}
          initialIndex={modalStartIndex}
          onClose={() => setIsModalOpen(false)}
        />
      )}
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

      <div className="max-h-[24rem] h-full gap-y-5 flex flex-col overflow-auto border-b border-gray-400  pr-5">
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
