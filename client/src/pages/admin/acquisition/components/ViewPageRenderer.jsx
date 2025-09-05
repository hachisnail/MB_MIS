import { useState, useEffect, useRef, Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { handlePreview } from "../../../../components/commons";
import { ImageCarousel } from "../../../../features/Utilities";
import ContextMenu from "../../../../components/modals/ContextMenu";
import { formatDate } from "../../appointments/components/dateUtils";
import ImageViewerModal from "../../../../features/ImageViewerModal";
import { InfoModal } from "../../../../features/InfoModal";
import NoImagePlaceholder from "../../../../features/Utilities";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

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

export function RenderArtifactImageAndDonatorInfo({
  donatorInformation = [],
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
    <div className="w-full max-w-[58rem] just h-full flex flex-col gap-y-5 px-5">
      <ImageCarousel
        images={artifactImg}
        thumbnailSize="w-26 h-26"
        mainSize="w-[29rem] h-[29rem]"
      />

      {/* <div className="max-h-[30rem] h-full gap-y-3 flex flex-col overflow-auto border-t border-gray-400 pt-5 pl-10 pr-5">
        <span className="text-white text-3xl font-hind">
          Donators Information
        </span>
        {donatorInformation.map(({ label, value, icon }, idx) => (
          <div
            key={idx}
            className="w-full flex flex-col h-fit text-2xl font-medium"
          >
            <span
              id="value"
              className="font-normal text-md items-end gap-x-2 flex text-[#666666]"
            >
              {icon}
              {label}:
            </span>
            <span className="text-white font-normal ml-20">{value}</span>
          </div>
        ))}
      </div> */}
      <DonatorInfoSection donatorInformation={donatorInformation} />
    </div>
  );
}

export function DonatorInfoSection({
  donatorInformation = [],
  title = "Donors Information",
  titleClassName = "text-white text-3xl font-hind",
  labelClassName = "font-normal text-md items-end gap-x-2 flex text-[#666666]",
  valueClassName = "text-white font-normal ml-20",
  containerClassName = "max-h-[30rem] h-full gap-y-3 flex flex-col overflow-auto border-t border-gray-400 pt-5 pl-10 pr-5",
  itemClassName = "w-full flex flex-col h-fit text-2xl font-medium",
}) {
  return (
    <div className={containerClassName}>
      <span className={titleClassName}>{title}</span>
      {donatorInformation.map(({ label, value, icon }, idx) => (
        <div key={idx} className={itemClassName}>
          <span id="value" className={labelClassName}>
            {icon}
            {label}:
          </span>
          <span className={valueClassName}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export const InfoSection = ({
  title,
  items = [],
  titleClassName = "",
  labelClassName = "",
  valueClassName = "",
  itemHeight = "",
  containerClassName = "",
}) => {
  const [modalContent, setModalContent] = useState(null);

  const handleClick = (label, value, idx) => {
    if (idx === 0) return;

    const displayValue = value || "Not provided";
    if (displayValue === "Not provided") return;

    setModalContent({ label, value: displayValue });
  };

  return (
    <div
      className={`w-full h-full flex flex-col pl-20 gap-y-3 ${containerClassName}`}
    >
      {/* Section Title */}
      <span className={`text-4xl font-bold ${titleClassName}`}>{title}</span>

      {/* Items */}
      {items.map(({ label, value }, idx) => {
        const displayValue = value || "Not provided";
        return (
          <div
            key={idx}
            className={`flex flex-col text-xl ${
              idx === 0 ? "h-fit" : itemHeight
            }`}
          >
            <span className={labelClassName}>{label}</span>
            <div
              className={`w-full ${
                idx === 0 ? "h-fit" : "h-full"
              } pl-5 overflow-hidden cursor-pointer`}
              onClick={() => handleClick(label, value, idx)}
            >
              <span
                className={`${valueClassName} ${
                  idx === 0 ? "h-fit" : itemHeight
                }`}
              >
                {displayValue}
              </span>
            </div>
          </div>
        );
      })}

      {/* Reusable Modal */}
      <InfoModal
        isOpen={!!modalContent}
        onClose={() => setModalContent(null)}
        title={modalContent?.label}
        content={modalContent?.value}
      />
    </div>
  );
};

export function RenderRelatedDocs({
  relatedImages = [],
  attachedFiles = [],
  containerHeight = "h-[36rem]",
  imageBoxWidth = "w-[28rem]",
  fileBoxWidth = "w-[18rem]",
  imgHeight = "h-70",
}) {
  const [imageCurrentPage, setImageCurrentPage] = useState(1);
  const [fileCurrentPage, setFileCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  /** Pagination for images **/
  const itemsPerPage = 3;
  const paginatedImages = relatedImages.slice(
    (imageCurrentPage - 1) * itemsPerPage,
    imageCurrentPage * itemsPerPage
  );

  /** Pagination for files **/
  const fileItemsPerPage = 4;
  const paginatedFiles = attachedFiles.slice(
    (fileCurrentPage - 1) * fileItemsPerPage,
    fileCurrentPage * fileItemsPerPage
  );

  return (
    <div className={`w-full flex gap-x-5 ${containerHeight}`}>
      {/* image container */}
      <div
        className={`h-full flex flex-col items-center rounded-xl pb-4 shadow-sm shadow-gray-400 ${imageBoxWidth}`}
      >
        <div className="h-fit w-full flex flex-col items-center rounded-t-xl justify-center bg-[#1D1911]">
          <span className="my-3 text-white text-xl font-semibold">
            Related Images
          </span>
          <div className="h-5 w-full bg-white rounded-t-xl"></div>
        </div>

        <div className="w-[calc(100%-2rem)] p-2 gap-y-1 h-full flex flex-col overflow-y-scroll rounded-lg shadow-[inset_0_8px_12px_rgba(0,0,0,0.25),inset_0_-8px_12px_rgba(0,0,0,0.50)]">
          {paginatedImages.length > 0 ? (
            paginatedImages.map((img, i) => (
              <div
                key={img.key || i}
                title={img.label}
                className={`flex-none border border-gray-400 hover:scale-101 transition-transform cursor-pointer rounded-xl w-full ${imgHeight} bg-black`}
                onClick={() => {
                  setModalStartIndex((imageCurrentPage - 1) * itemsPerPage + i);
                  setIsModalOpen(true);
                }}
              >
                {img?.src ? (
                  <img
                    src={img.src}
                    alt={img.label || "Related image"}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.replaceWith(
                        (() => {
                          const wrapper = document.createElement("div");
                          wrapper.className =
                            "flex items-center flex-col justify-center w-full h-full bg-gray-100 rounded-xl";
                          wrapper.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5" class="w-12 h-12 text-gray-400" viewBox="0 0 24 24">
                            <path d="M15 8h.01" />
                            <path d="M7 3h11a3 3 0 0 1 3 3v11m-.856 3.099a2.991 2.991 0 0 1 -2.144 .901h-12a3 3 0 0 1 -3 -3v-12c0 -.845 .349 -1.608 .91 -2.153" />
                            <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
                            <path d="M16.33 12.338c.574 -.054 1.155 .166 1.67 .662l3 3" />
                            <path d="M3 3l18 18" 
                            />
                            </svg>
                            <span class=" text-gray-400"> Failed to load image! </span>
                            `;
                          return wrapper;
                        })()
                      );
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-xl">
                    <NoImagePlaceholder />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-40 bg-gray-200 rounded-xl">
              <NoImagePlaceholder />
            </div>
          )}
        </div>
      </div>

      {/* file container */}
      <div
        className={`h-full flex flex-col items-center rounded-xl pb-4 shadow-sm shadow-gray-600 ${fileBoxWidth}`}
      >
        <div className="h-fit w-full flex flex-col items-center rounded-t-xl justify-center bg-[#1D1911]">
          <span className="my-3 text-white text-xl font-semibold">
            Attached Files
          </span>
          <div className="h-5 w-full bg-white rounded-t-xl"></div>
        </div>
        <div className="w-[calc(100%-2rem)] p-2 gap-y-1 h-full flex flex-col overflow-y-scroll rounded-lg shadow-[inset_0_8px_12px_rgba(0,0,0,0.25),inset_0_-8px_12px_rgba(0,0,0,0.50)]">
          {paginatedFiles.length > 0 ? (
            paginatedFiles.map(({ key, filename, category, url }, i) => (
              <ContextMenu
                className="w-full h-fit"
                key={key || i}
                menuItems={[
                  {
                    label: "Preview",
                    onClick: () => {
                      const fileType = filename.split(".").pop().toLowerCase();
                      handlePreview(
                        navigate,
                        `${location.pathname}/view`,
                        url,
                        filename,
                        fileType
                      );
                    },
                  },
                  {
                    label: "Download",
                    onClick: () => window.open(url, "_blank"),
                  },
                ]}
              >
                <div className="flex w-full rounded-2xl py-4 px-2 border border-gray-400 flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="black"
                    className="w-12 h-12"
                  >
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                    <path d="M9 14v.01" />
                    <path d="M12 14v.01" />
                    <path d="M15 14v.01" />
                  </svg>
                  <p
                    title={filename}
                    className="w-full mt-2 text-sm font-medium text-red-600 truncate max-w-[12rem] text-center"
                  >
                    {filename}
                  </p>
                  {category && (
                    <p className="text-md capitalize text-gray-500">
                      {category}
                    </p>
                  )}
                </div>
              </ContextMenu>
            ))
          ) : (
            <p className="text-gray-500 text-center">No files available</p>
          )}
        </div>
      </div>

      {/* Modal */}
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
