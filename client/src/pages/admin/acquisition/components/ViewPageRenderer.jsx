import { useState, useEffect, useRef, Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { handlePreview } from "../../../../components/commons";
import { ImageCarousel } from "../../../../features/Utilities";
import ContextMenu from "../../../../components/modals/ContextMenu";
import { formatDate } from "../../appointments/components/dateUtils";
import ImageViewerModal from "../../../../features/ImageViewerModal";
import { InfoModal } from "../../../../features/InfoModal";

import { FileType } from "lucide-react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

// export function RenderRelatedDocs({ relatedImages = [], attachedFiles = [] }) {
//   const [imageCurrentPage, setImageCurrentPage] = useState(1);
//   const [fileCurrentPage, setFileCurrentPage] = useState(1);
//   const [isLending, setIsLending] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalStartIndex, setModalStartIndex] = useState(0);

//   const location = useLocation();
//   const navigate = useNavigate();

//   useEffect(() => {
//     setIsLending(location.pathname.includes("lending"));
//   }, [location.pathname]);

//   /** Images pagination **/
//   const itemsPerPage = 3;
//   const totalPages = Math.ceil(relatedImages.length / itemsPerPage);
//   const paginatedImages = relatedImages.slice(
//     (imageCurrentPage - 1) * itemsPerPage,
//     imageCurrentPage * itemsPerPage
//   );

//   const handleNextPage = () => {
//     if (imageCurrentPage < totalPages) setImageCurrentPage((prev) => prev + 1);
//   };
//   const handlePreviousPage = () => {
//     if (imageCurrentPage > 1) setImageCurrentPage((prev) => prev - 1);
//   };

//   /** Files pagination **/
//   const fileItemsPerPage = 4;
//   const fileTotalPages = Math.ceil(attachedFiles.length / fileItemsPerPage);
//   const paginatedFiles = attachedFiles.slice(
//     (fileCurrentPage - 1) * fileItemsPerPage,
//     fileCurrentPage * fileItemsPerPage
//   );
//   const handleFileNextPage = () => {
//     if (fileCurrentPage < fileTotalPages)
//       setFileCurrentPage((prev) => prev + 1);
//   };
//   const handleFilePreviousPage = () => {
//     if (fileCurrentPage > 1) setFileCurrentPage((prev) => prev - 1);
//   };

//   console.log(attachedFiles);

//   return (
//     <div
//       className={`w-[55rem] h-full flex flex-col items-center gap-y-5 ${
//         isLending ? "justify-center" : "justify-start"
//       }`}
//     >
//       {/* Images Section */}
//       {relatedImages.length > 0 && (
//         <div className="w-full p-5 rounded-lg border border-gray-400 flex flex-col">
//           <span className="text-2xl font-semibold">
//             Related Images / About the Artifact
//           </span>

//           <div className="max-w-[60rem] h-full flex flex-col items-center gap-y-4 mt-4 justify-center">
//             <div className="flex items-center gap-x-2">
//               <button
//                 onClick={handlePreviousPage}
//                 disabled={imageCurrentPage === 1}
//                 className="h-full border-r hover:text-gray-600 cursor-pointer disabled:opacity-50"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   width="18"
//                   height="18"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="3"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 >
//                   <path d="M13 20l-3 -8l3 -8" />
//                 </svg>
//               </button>

//               <div className="w-[47rem] flex gap-x-4">
//                 {paginatedImages.map(({ key, src, label }, idx) => (
//                   <div
//                     key={key}
//                     className="w-50 h-50 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer"
//                     onClick={() => {
//                       setModalStartIndex(
//                         (imageCurrentPage - 1) * itemsPerPage + idx
//                       );
//                       setIsModalOpen(true);
//                     }}
//                   >
//                     <img
//                       src={
//                         src.startsWith("http")
//                           ? src
//                           : `${SERVER_URL}/uploads/private/pictures/${src}`
//                       }
//                       alt={label}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                 ))}
//               </div>

//               <button
//                 onClick={handleNextPage}
//                 disabled={imageCurrentPage === totalPages}
//                 className="h-full hover:text-gray-600 border-l cursor-pointer disabled:opacity-50"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   width="18"
//                   height="18"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="3"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 >
//                   <path d="M11 4l3 8l-3 8" />
//                 </svg>
//               </button>
//             </div>

//             <div className="flex gap-x-2 mt-2">
//               {Array.from({ length: totalPages }).map((_, index) => (
//                 <div
//                   key={index}
//                   className={`w-5 h-1 rounded ${
//                     imageCurrentPage === index + 1
//                       ? "bg-gray-900"
//                       : "bg-gray-400"
//                   }`}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Files Section */}
//       {attachedFiles.length > 0 && (
//         <div className="w-full h-[12rem] flex rounded-lg border-gray-400 border bg-black mt-5">
//           <div className="max-w-60 w-full h-full flex items-center justify-center">
//             <span className="text-white text-2xl font-semibold">
//               Attached Files
//             </span>
//           </div>

//           <div className="rounded-lg w-full h-full bg-white gap-y-2 pt-4 flex items-center flex-col justify-center px-4">
//             <div className="flex items-center w-full gap-x-2">
//               <button
//                 onClick={handleFilePreviousPage}
//                 disabled={fileCurrentPage === 1}
//                 className="hover:text-gray-600 border-r h-full cursor-pointer disabled:opacity-50"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   width="18"
//                   height="18"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="3"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 >
//                   <path d="M13 20l-3 -8l3 -8" />
//                 </svg>
//               </button>

//               <div className="w-full flex gap-x-2">
//                 {paginatedFiles.map(({ key, filename, category, url }) => (
//                   <ContextMenu
//                     key={key}
//                     menuItems={[
//                       {
//                         label: "Preview",
//                         onClick: () => {
//                           const fileType = filename
//                             .split(".")
//                             .pop()
//                             .toLowerCase();
//                           handlePreview(
//                             navigate,
//                             `${location.pathname}/view`,
//                             url,
//                             filename,
//                             fileType
//                           );
//                         },
//                       },
//                       {
//                         label: "Download",
//                         onClick: () => window.open(url, "_blank"),
//                       },
//                       {
//                         label: "Delete",
//                         onClick: () => alert("delete clicked"),
//                       },
//                     ]}
//                   >
//                     <div className="w-32 h-32 flex flex-col pt-7 items-center justify-center text-black bg-gray-200 rounded-lg">
//                       <div className="w-5 h-5 border mb-1"></div>
//                       <span className="text-sm h-5 truncate w-25">
//                         {filename}
//                       </span>
//                       <span className="text-xs">{category}</span>
//                     </div>
//                   </ContextMenu>
//                 ))}
//               </div>

//               <button
//                 onClick={handleFileNextPage}
//                 disabled={fileCurrentPage === fileTotalPages}
//                 className="hover:text-gray-600 h-full border-l cursor-pointer disabled:opacity-50"
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   width="18"
//                   height="18"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="3"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 >
//                   <path d="M11 4l3 8l-3 8" />
//                 </svg>
//               </button>
//             </div>

//             <div className="flex gap-x-2 mt-2">
//               {Array.from({ length: fileTotalPages }).map((_, index) => (
//                 <div
//                   key={index}
//                   className={`w-5 h-1 rounded ${
//                     fileCurrentPage === index + 1
//                       ? "bg-gray-900"
//                       : "bg-gray-400"
//                   }`}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Image Viewer Modal */}
//       {isModalOpen && (
//         <ImageViewerModal
//           images={relatedImages}
//           initialIndex={modalStartIndex}
//           onClose={() => setIsModalOpen(false)}
//         />
//       )}
//     </div>
//   );
// }

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

      <div className="max-h-[30rem] h-full gap-y-3 flex flex-col overflow-auto border-t border-gray-400 pt-5 pl-10 pr-5">
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
      </div>
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
  const refs = useRef([]);
  refs.current = [];

  const handleClick = (label, value, idx) => {
    const el = refs.current[idx];
    if (!el) return;

    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight);
    const lines = Math.round(el.scrollHeight / lineHeight);

    const maxLines = idx === 1 ? 1 : 2;
    if (lines > maxLines) {
      setModalContent({ label, value });
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col pl-20 gap-y-3 ${containerClassName}`}
    >
      {/* Section Title */}
      <span className={`text-4xl font-bold ${titleClassName}`}>{title}</span>

      {/* Items */}
      {items.map(({ label, value }, idx) => (
        <div
          key={idx}
          className={`flex flex-col text-xl ${
            idx === 0 ? "h-fit" : itemHeight
          }`}
        >
          <span className={labelClassName}>{label}</span>
          <div
            className={`w-full ${
              idx == 0 ? "h-fit" : "h-full"
            } h-full pl-5 overflow-hidden cursor-pointer`}
            onClick={() => handleClick(label, value, idx)}
          >
            <span
              ref={(el) => (refs.current[idx] = el)}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: idx === 1 ? 1 : 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "normal",
              }}
              className={valueClassName}
            >
              {value}
            </span>
          </div>
        </div>
      ))}

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
                      <p className="text-md capitalize  text-gray-500">{category}</p>
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
