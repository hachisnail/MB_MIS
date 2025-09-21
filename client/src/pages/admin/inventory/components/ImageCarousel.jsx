import React, { useMemo, useState, useCallback } from "react";

/** --------- Helpers (local & self-contained) --------- */
function NoImagePlaceholder({ size = 64, label = "No Image", className = "" }) {
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
      {label && <span className="text-xs font-bold text-[#1D1911] px-1">{label}</span>}
    </div>
  );
}

const handleImageError =
  ({ message = "Failed to load image!", textSize = "text-xs" } = {}) =>
  (e) => {
    const img = e.currentTarget;
    const wrapper = document.createElement("div");
    wrapper.className =
      "flex items-center flex-col justify-center w-full h-full bg-gray-500 rounded-xl";
    wrapper.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5" class="w-12 h-12 text-gray-400" viewBox="0 0 24 24">
        <path d="M15 8h.01" />
        <path d="M7 3h11a3 3 0 0 1 3 3v11m-.856 3.099a2.991 2.991 0 0 1 -2.144 .901h-12a3 3 0 0 1 -3 -3v-12c0 -.845 .349 -1.608 .91 -2.153" />
        <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
        <path d="M16.33 12.338c.574 -.054 1.155 .166 1.67 .662l3 3" />
        <path d="M3 3l18 18" />
      </svg>
      <span class="text-gray-400 ${textSize}">${message}</span>
    `;
    const container = img.parentElement;
    if (!container) return;
    container.replaceChildren(wrapper);
  };

/** --------- Component --------- */
/**
 * @param {Object} props
 * @param {{src: string|null, alt?: string, label?: string}[]} props.images
 * @param {string} [props.thumbnailSizeClass] Tailwind size class for thumbs
 * @param {string} [props.mainSizeClass] Tailwind size class for main image
 * @param {(index:number)=>void} [props.onOpenModal] optional callback when main image clicked
 */
export default function ImageCarousel({
  images = [],
  thumbnailSizeClass = "w-[5rem] h-[5rem]",
  mainSizeClass = "w-[14rem] h-[14rem]",
  onOpenModal,
}) {
  const [index, setIndex] = useState(0);
  const hasImages = images && images.length > 0;

  const current = useMemo(() => (hasImages ? images[index] : null), [images, index, hasImages]);

  const next = useCallback(() => {
    if (!hasImages) return;
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [hasImages, images.length]);

  const prev = useCallback(() => {
    if (!hasImages) return;
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [hasImages, images.length]);

  const goTo = useCallback(
    (i) => {
      if (!hasImages) return;
      const clamped = Math.max(0, Math.min(i, images.length - 1));
      setIndex(clamped);
    },
    [hasImages, images.length]
  );

  // Always show 4 thumbnail slots
  const thumbnailSlots = useMemo(() => {
    const base = images.slice(0, 4);
    return base.length < 4
      ? [...base, ...Array.from({ length: 4 - base.length }, () => ({ src: null, label: "Placeholder" }))]
      : base;
  }, [images]);

  const openModal = () => {
    if (!hasImages) return;
    if (onOpenModal) onOpenModal(index);
  };

  return (
    <div className="w-full h-full flex justify-center items-center gap-4">
      {/* Prev */}
      <button
        onClick={prev}
        disabled={!hasImages || images.length <= 1}
        className="hover:text-gray-300 h-full max-w-10 text-white cursor-pointer disabled:opacity-50"
        aria-label="Previous image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M13 20l-3 -8l3 -8" />
        </svg>
      </button>

      {/* Thumbs + Main */}
      <div className="w-fit h-full flex items-center justify-center gap-4">
        {/* Thumbs (vertical) */}
        <div className="w-fit flex flex-col items-center justify-center gap-4">
          {thumbnailSlots.map((img, i) => (
            <div
              key={`thumb-${i}-${img?.src ?? "empty"}`}
              className={`border rounded-lg overflow-hidden flex items-center justify-center ${thumbnailSizeClass} cursor-pointer`}
              onClick={() => img.src && goTo(i)}
            >
              {img.src ? (
                <img
                  src={img.src}
                  alt={img.alt || img.label || `Image ${i + 1}`}
                  className="object-cover w-full h-full"
                  onError={handleImageError({ textSize: "text-[0.7rem]" })}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-400">
                  <NoImagePlaceholder label="" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main */}
        <div
          className={`${mainSizeClass} border rounded-lg overflow-hidden flex items-center justify-center cursor-pointer`}
          onClick={openModal}
        >
          {current?.src ? (
            <img
              src={current.src}
              alt={current.alt || current.label || `Image ${index + 1}`}
              className="object-cover w-full h-full"
              onError={handleImageError()}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-400">
              <NoImagePlaceholder />
            </div>
          )}
        </div>
      </div>

      {/* Next */}
      <button
        onClick={next}
        disabled={!hasImages || images.length <= 1}
        className="hover:text-gray-300 h-full max-w-10 text-white cursor-pointer disabled:opacity-50"
        aria-label="Next image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M11 4l3 8l-3 8" />
        </svg>
      </button>
    </div>
  );
}
