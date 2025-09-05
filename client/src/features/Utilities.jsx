import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { Fragment, useState, useRef, useEffect } from "react";
import { scrollToElementById } from "@/components/commons";
import ImageViewerModal from "./ImageViewerModal";

// admin utilities
export function SearchBar({ placeholder = "Search History", onChange, theme }) {
  let outer, inner;
  switch (theme) {
    case "dark":
      outer = "bg-[#191919] border-[#353535]";
      inner = "text-gray-300 placeholder-gray-500";
      break;
    case "light":
      outer = "bg-white border-[#353535]";
      inner = "text-gray-600 placeholder-gray-500";
      break;
    default:
      outer = "bg-white border-[#353535]";
      inner = "text-gray-600 placeholder-gray-500";
      break;
  }

  return (
    <div className="w-full max-w-sm ">
      <div className={`flex items-center ${outer} border rounded-md px-3 py-2`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 14.15z"
          />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          onChange={onChange}
          className={`ml-3 w-full bg-transparent outline-none text-2xl ${inner}`}
        />
      </div>
    </div>
  );
}

export function CardDropdownPicker({
  options = [],
  onChange,
  value = "",
  placeholder = "Select an option",
  theme = "light",
}) {
  const selected = options.find((opt) => opt.value === value);

  let outer, inner, optionStyle;
  switch (theme) {
    case "dark":
      outer = "bg-[#191919] border-[#353535]";
      inner = "text-gray-300 placeholder-gray-500 bg-[#191919]";
      optionStyle = "text-gray-300 hover:bg-[#2c2c2c]";
      break;
    case "light":
      outer = "bg-white border-[#353535]";
      inner = "text-gray-700 placeholder-gray-400 bg-white";
      optionStyle = "text-gray-700 hover:bg-gray-200";
      break;
    default:
      outer = "bg-white border-[#353535]";
      inner = "text-gray-700 placeholder-gray-400 bg-white";
      optionStyle = "text-gray-700 hover:bg-gray-200";
      break;
  }

  return (
    <div className="w-full max-w-sm">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton
            className={`w-full cursor-pointer text-left px-3 py-2 border rounded-md ${outer} ${inner} flex items-center justify-between text-2xl`}
          >
            <span>{selected?.label || placeholder}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </ListboxButton>

          <ListboxOptions
            className={`absolute mt-1 z-10 w-full max-h-60 overflow-auto rounded-md shadow-lg border ${outer}`}
          >
            {options.map((opt) => (
              <ListboxOption key={opt.value} value={opt.value} as={Fragment}>
                {(props) => (
                  <li
                    className={`cursor-pointer px-4 py-2 text-lg ${
                      props.focus ? "bg-blue-500 text-white" : optionStyle
                    }`}
                  >
                    {opt.label}
                  </li>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}

// Utilities for contribution form
export function StyledInput({
  placeholder = "Type here...",
  value = "",
  onChange = () => {},
  onBlur = () => {},
  error, // error prop is crucial
}) {
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}
        className={`
          w-full
          px-4 py-1
          text-md
          bg-white
          border
          rounded-full
          focus:outline-none
          focus:ring-2
          focus:ring-gray-300
          ${error ? "border-red-500" : "border-black"}
        `}
      />
    </>
  );
}

export function StyledSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  onBlur = () => {},
  error, // error prop is crucial
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full">
        <ListboxButton
          className={`
            w-full
            px-4 py-1
            text-sm
            text-left
            bg-white
            border
            rounded-full
            focus:outline-none
            focus:ring-2
            focus:ring-gray-300
            shadow-inner
            ${error ? "border-red-500" : "border-black"} 
          `}
          style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}
          onBlur={onBlur}
        >
          <span>{value || placeholder}</span>

          {/* Inline SVG icon */}
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </ListboxButton>

        <ListboxOptions
          className="
            absolute z-10 mt-1 max-h-60 w-full overflow-auto
            rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-gray-500 ring-opacity-5 focus:outline-none
          "
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value || option}
              value={option.value || option}
              className={({ active }) =>
                `relative cursor-pointer select-none py-2 pl-4 pr-4 ${
                  active ? "bg-gray-100" : ""
                }`
              }
            >
              {option.label || option}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

export function LabeledInput({
  style = "1",
  label,
  value,
  onChange,
  width = "w-60",
  placeholder,
  error,
  onBlur,
  isRequired = false, // Added isRequired prop
}) {
  const containerClass =
    style === "1"
      ? "flex w-full items-center justify-between"
      : "flex flex-col w-full gap-y-3 items-end justify-between";

  const labelWrapperClass = style !== "1" ? "w-full" : "w-fit";

  return (
    <div className={containerClass}>
      <div className={labelWrapperClass}>
        <span className="text-md font-medium">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>} {/* Display asterisk if required */}
        </span>
      </div>
      <div className={width}>
        <StyledInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          error={error} // This error prop is correctly passed to StyledInput
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}

export function StyledRadioSelector({
  selectedOption,
  onChange,
  options = [],
  label,
  onBlur = () => {},
  error, // error prop is crucial
  isRequired = false, // Added isRequired prop
}) {
  return (
    <div className="flex flex-col gap-y-1 w-full">
      {label && <span className="block text-xl font-semibold mb-1">{label}{isRequired && <span className="text-red-500 ml-1">*</span>}</span>}
      <div className="flex space-x-10">
        {options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              value={option.value}
              checked={selectedOption === option.value}
              onChange={onChange}
              onBlur={onBlur}
              // Tailwind's default radio button styling doesn't easily support border-colors directly on the input
              // It's often better to style the parent label or use custom radio button designs for error states.
              // For a simple fix, we can apply it here, but it might not be visually prominent.
              className={`w-5 h-5 accent-black ${error ? "border-red-500" : ""}`} // Added accent-black, border won't show on default radio
            />
            <span className="text-2xl font-semibold">{option.label}</span>
          </label>
        ))}
      </div>
      {error && ( // Display error message for radio selector
        <p className="text-red-500 text-xs font-hind mt-1">
          Please select an option.
        </p>
      )}
    </div>
  );
}

export function StyledFileInput({
  onFilesSelected,
  accept = "*",
  multiple = true,
  label = "Drag or Choose Files",
  initialFiles = [],
  error,
  isRequired = false,
}) {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState(initialFiles);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setSelectedFiles(initialFiles);
  }, [initialFiles]);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList);
    const updatedFiles = multiple
      ? [...selectedFiles, ...files]
      : files.slice(0, 1);

    setSelectedFiles(updatedFiles);
    if (onFilesSelected) onFilesSelected(updatedFiles);
  };

  const handleRemoveFile = (indexToRemove) => {
    const updated = selectedFiles.filter((_, i) => i !== indexToRemove);
    setSelectedFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = () => setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div
      className="flex items-start gap-4 text-[7px]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* File Input Box */}
      <div
        onClick={handleClick}
        className={`border-[1.5px] rounded-xl px-4 py-4 text-center cursor-pointer select-none transition w-36 ${
          isDragging ? "bg-indigo-100 border-indigo-400" : "hover:bg-gray-50"
        } ${error ? "border-red-500" : "border-black"}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
        <span className="text-gray-700 leading-tight">
          {label.split("Choose")[0]}
          <span className="text-indigo-600 font-medium underline">
            Choose Files
          </span>
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </span>
      </div>

      {/* File List (Horizontal Scroll) */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex flex-row space-x-2 h-10">
          {selectedFiles.length > 0 ? (
            selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center text-gray-800 bg-gray-100 px-3 py-1 rounded-md whitespace-nowrap"
                title={file.name}
              >
                <span className="truncate max-w-[120px]">📄 {file.name}</span>
                <button
                  onClick={() => handleRemoveFile(idx)}
                  className="ml-2 text-red-500 hover:text-red-700 text-sm font-bold"
                  title="Remove file"
                >
                  ❌
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic">No files</div>
          )}
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-xs font-hind mt-1">
          Please provide a URL or upload a file.
        </p>
      )}
    </div>
  );
}


// utilities for home

export function ScrollButton({
  pt = 0,
  title,
  targetId,
  direction = "left",
  textColor = "text-gray-600",
  hoverTextColor = "hover:text-gray-900",
  icon,
}) {
  return (
    <div className={`flex w-full ${direction === "left" ? "justify-start" : "justify-end" }`}>
      <button
        onClick={() => scrollToElementById(targetId, pt)}
        className={`items-center text-2xl flex ${textColor} hover:italic font-semibold rounded cursor-pointer ${hoverTextColor} transition`}
      >
        {direction === "left" && (icon || (
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
            <path d="M4 12l10 0" />
            <path d="M4 12l4 4" />
            <path d="M4 12l4 -4" />
            <path d="M20 4l0 16" />
          </svg>
        ))}
        <span className={direction === "left" ? "ml-2" : "mr-2"}>{title}</span>
        {direction === "right" && (icon || (
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
            <path d="M20 12l-10 0" />
            <path d="M20 12l-4 4" />
            <path d="M20 12l-4 -4" />
            <path d="M4 4l0 16" />
          </svg>
        ))}
      </button>
    </div>
  );
}


export function TableHeaderContainer({ headers = [], className = "", theme ="light" }) {
  if (!headers.length) return null;

  const gridCols = headers
    .map(({ width }) => {
      if (typeof width === "number") return `${width}rem`; 
      if (width === "auto") return "auto";
      if (width === "1fr") return "1fr";
      return "1fr"; 
    })
    .join(" ");

  return (
    <div
      className={`grid py-4 gap-y-5 h-fit ${className}`}
      style={{ gridTemplateColumns: gridCols }}
    >
      {headers.map(({ label }) => (
        <div
          key={label}
          className={`${theme === "light" ? "text-[#727272]" : "text-white" }  font-semibold flex px-3 py-2 text-2xl`}
        >
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function SummaryPanel({
  tabs = [],
  activeTab = null,
  onTabChange = () => {},
  title = "",
  totalCount = 0,
  dateLabel = "",
  summaryData = [],
  button = null, 
  className = "",
}) {
  return (
    <div
      className={`pb-[2rem] min-w-[34rem] items-center max-w-[34rem] h-full flex flex-col gap-y-[1.75rem] ${className}`}
    >
      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="w-full min-h-[3.2rem] flex items-start gap-x-[0.5rem]">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`w-fit cursor-pointer h-full px-[1rem] rounded-lg border text-2xl font-semibold ${
                activeTab === key
                  ? "bg-black text-white border-black"
                  : "border-gray-500"
              }`}
              onClick={() => onTabChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="h-fit w-full flex flex-col gap-y-[5rem]">
        {/* Header Count */}
        <div className="w-full h-[5rem] bg-black rounded-sm flex px-[1rem] text-2xl items-center justify-between font-semibold">
          <span className="text-white">{title}</span>
          <span className="w-[6rem] h-[3rem] bg-[#D4DBFF] flex items-center justify-center rounded-md">
            {totalCount}
          </span>
        </div>

        {/* Summary Data */}
        <div className="w-full h-fit flex flex-col gap-y-[1.75rem]">
          {dateLabel && (
            <span className="text-2xl font-semibold text-[#727272]">
              {dateLabel}
            </span>
          )}
          {summaryData.map(({ label, value }) => (
            <div key={label} className="w-full h-fit flex justify-between">
              <span className="text-2xl font-semibold">{label}</span>
              <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                <span className="text-2xl font-semibold">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* button */}
      {button && (
        <button
          onClick={button.onClick}
          className="justify-between w-[98%] flex px-[2rem] h-[6.25rem] items-center bg-black text-white hover:shadow-md transition-shadow hover:shadow-gray-600 rounded-lg"
        >
          <span className="text-3xl font-semibold">{button.label}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-[3.5rem] h-[3.5rem]"
            viewBox="0 0 24 24"
            stroke="#ffffff"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
            <path d="M9 12h6" />
            <path d="M12 9v6" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function NoImagePlaceholder({
  size = 64, 
  label = "No Image",
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size / 2}
        height={size / 2}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 8h.01" />
        <path d="M7 3h11a3 3 0 0 1 3 3v11m-.856 3.099a2.991 2.991 0 0 1 -2.144 .901h-12a3 3 0 0 1 -3 -3v-12c0 -.845 .349 -1.608 .91 -2.153" />
        <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
        <path d="M16.33 12.338c.574 -.054 1.155 .166 1.67 .662l3 3" />
        <path d="M3 3l18 18" />
      </svg>
      {label && (
        <span className="text-xs font-bold text-[#1D1911] px-1">{label}</span>
      )}
    </div>
  );
}



export function ImageCarousel({
  images = [],
  thumbnailSize = "w-29 h-29",
  mainSize = "w-[32rem] h-[32rem]",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      images.length > 0 ? (prev > 0 ? prev - 1 : images.length - 1) : 0
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      images.length > 0 ? (prev < images.length - 1 ? prev + 1 : 0) : 0
    );
  };

  // Always show 4 thumbnail slots
  const thumbnailSlots = Array.from({ length: 4 }, (_, idx) => {
    return images[idx] || { src: null, label: "Placeholder" };
  });

  return (
    <>
      <div className="w-full h-full flex justify-center items-center gap-4">
        {/* Prev Button */}
        <button
          onClick={handlePrev}
          disabled={images.length <= 1}
          className="hover:text-gray-600 h-full max-w-10 text-white cursor-pointer disabled:opacity-50"

        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
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

        {/* Thumbnails + Main image */}
        <div className="w-fit h-full flex items-center justify-center gap-4">
          {/* Thumbnails */}
          <div className="w-fit flex flex-col items-center justify-center gap-4">
            {thumbnailSlots.map((img, idx) => (
              <div
                key={idx}
                className={`border rounded-lg overflow-hidden flex items-center justify-center ${thumbnailSize} cursor-pointer ${
                  idx === currentIndex ? "" : ""
                }`}
                onClick={() => img.src && setCurrentIndex(idx)}
              >
                {img.src ? (
                  <img
                    src={img.src}
                    alt={img.label}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-400 text-sm">
                    <NoImagePlaceholder />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main image */}
          <div
            className={`${mainSize} border rounded-lg overflow-hidden flex  flex-col items-center justify-center cursor-pointer`}
            onClick={() => images[currentIndex] && setIsModalOpen(true)}
          >
            {images[currentIndex] ? (
              <img
                src={images[currentIndex].src}
                alt={images[currentIndex].label}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-400 text-xl">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={images.length <= 1}
          className="hover:text-gray-600 h-full max-w-10 text-white cursor-pointer disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
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

      {/* Modal */}
      {isModalOpen && (
        <ImageViewerModal
          images={images}
          initialIndex={currentIndex}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}




