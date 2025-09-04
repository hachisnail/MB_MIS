import { useState, useEffect, useRef, Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { handlePreview } from "../../../../components/commons";
import { ImageCarousel } from "../../../../features/Utilities";
import ContextMenu from "../../../../components/modals/ContextMenu";
import { formatDate } from "../../appointments/components/dateUtils";
import ImageViewerModal from "../../../../features/ImageViewerModal";
import { InfoModal } from "../../../../features/InfoModal";

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
  imageBoxWidth = "28rem",
  imageBoxHeight = "36rem",
  fileBoxWidth = "18rem",
  fileBoxHeight = "36rem",
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
  const totalPages = Math.ceil(relatedImages.length / itemsPerPage);

  const paginatedImages = relatedImages.slice(
    (imageCurrentPage - 1) * itemsPerPage,
    imageCurrentPage * itemsPerPage
  );

  /** Pagination for files **/
  const fileItemsPerPage = 4;
  const fileTotalPages = Math.ceil(attachedFiles.length / fileItemsPerPage);

  const paginatedFiles = attachedFiles.slice(
    (fileCurrentPage - 1) * fileItemsPerPage,
    fileCurrentPage * fileItemsPerPage
  );
  // console.log(relatedImages);

  return (
    <div className="w-full h-full flex gap-x-5">
      {/* Images Section */}
      {/* Images Section */}
      <div
        className="pt-5 gap-5  bg-[#1D1911] rounded-2xl shadow-lg shadow-gray-400 flex flex-col items-center"
        style={{ width: imageBoxWidth, height: imageBoxHeight }}
      >
        <span className="text-xl font-bold text-white font-hind tracking-wider">
          Related Images
        </span>

        {/* White container (fixed size, border maintained) */}
        <div className="w-full h-full bg-white rounded-2xl p-4">
          <div
            className="w-full h-full gap-4 bg-white rounded-2xl p-4 shadow-[inset_0_6px_8px_rgba(0,0,0,0.25),inset_0_-6px_8px_rgba(0,0,0,0.25)] overflow-y-auto flex flex-col"
            style={{ height: `calc(${imageBoxHeight} - 7rem)` }}
          >
            {paginatedImages.length > 0 ? (
              paginatedImages.map((img, i) => (
                <div
                  title={img.label}
                  key={img.key || i}
                  className={`flex-none border border-gray-400 hover:scale-105 transition-transform cursor-pointer rounded-xl w-full ${imgHeight} bg-center bg-cover`}
                  style={{ backgroundImage: `url("${img.src}")` }}
                  onClick={() => {
                    setModalStartIndex(
                      (imageCurrentPage - 1) * itemsPerPage + i
                    );
                    setIsModalOpen(true);
                  }}
                >
                  {/* Hover overlay */}
                  <div className="w-full h-full rounded-xl bg-black/0 hover:bg-black/20 transition"></div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No images available</p>
            )}
          </div>
        </div>
      </div>

      {/* Files Section */}
      <div
        className="pt-5 gap-5  bg-[#1D1911] rounded-2xl shadow-lg shadow-gray-400 flex flex-col items-center"
        style={{ width: fileBoxWidth, height: fileBoxHeight }}
      >
        <span className="text-xl font-bold text-white font-hind tracking-wider">
          Attached Files
        </span>

        <div className="w-full h-full bg-white rounded-2xl p-4">
          <div
            className="w-full h-full bg-white rounded-2xl p-4 shadow-[inset_0_8px_12px_rgba(0,0,0,0.25),inset_0_-8px_12px_rgba(0,0,0,0.25)] overflow-y-auto flex flex-col items-center gap-6"
            style={{ height: `calc(${fileBoxHeight} - 7rem)` }}
          >
            {paginatedFiles.length > 0 ? (
              paginatedFiles.map(({ key, filename, category, url }, i) => (
                <ContextMenu
                  className="w-full h-fit"
                  key={key || i}
                  menuItems={[
                    {
                      label: "Preview",
                      onClick: () => {
                        const fileType = filename
                          .split(".")
                          .pop()
                          .toLowerCase();
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
                    {
                      label: "Delete",
                      onClick: () => alert("delete clicked"),
                    },
                  ]}
                >
                  <div className="flex w-full rounded-2xl py-4 px-2 border border-gray-400 flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                    {/* File Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="black"
                      className="w-12 h-12"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4H6a2 2 0 00-2 2v12a2 
                        2 0 002 2h12a2 2 0 002-2V10l-6-6z"
                      />
                    </svg>

                    {/* File Name */}
                    <p
                      title={filename}
                      className="w-full mt-2 text-sm font-medium text-red-600 truncate max-w-[12rem] text-center"
                    >
                      {filename}
                    </p>
                    {category && (
                      <p className="text-md capitalize  text-gray-500">
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
      </div>

      {/* Image Modal */}
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
