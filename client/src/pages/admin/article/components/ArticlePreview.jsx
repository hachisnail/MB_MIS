import React from "react";
import texture from "@/assets/Texture.png";

import MSBLogo from "@/assets/MSBLogo.png";
import seal from "@/assets/seal.png";

const ArticlePreview = ({
  contentType = "",
  volume = null,
  sequenceNumber = null,

  title,
  selectedDate,
  author,
  municipality,
  barangay,
  category,
  previewImage,     // kept for compatibility (not used)
  removeThumbnail,  // kept for compatibility (not used)
  editorHTML,
}) => {
  const isEvent = String(contentType || "").toLowerCase() === "event";
  const isArticle = String(contentType || "").toLowerCase() === "article";

  const rightBadge =
    sequenceNumber != null && sequenceNumber !== ""
      ? isArticle
        ? `No.${sequenceNumber}`
        : `Event #${sequenceNumber}`
      : isArticle
      ? "No.—"
      : "Event #—";

  const datePretty = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "[month dd, yyyy]";

  return (
    <div className="bg-white w-[50rem] p-6 rounded-lg shadow-2xl mt-4 2xl:mt-0">
      <h3 className="text-xl font-bold mb-3">Preview</h3>

      {/* Archive badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
          {volume ? `Vol.${volume}` : "Vol.—"}
        </span>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
          {rightBadge}
        </span>
        {contentType && (
          <span className="ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide">
            {contentType}
          </span>
        )}
      </div>

      <div className="border border-gray-300 p-3 mb-3 rounded">
        {/* Mini header band */}
        <div className="flex w-full justify-center font-hina">
          <div className="w-full max-w-[70rem]">
            {/* Top border */}
            <div className="border-t-[2px] border-black" />

            {/* 3-column band */}
            <div className="grid grid-cols-[25%_50%_25%] items-stretch text-center text-xs sm:text-sm">
              {/* Left column */}
              <div className="flex flex-col items-end justify-center px-2 py-2 gap-1 text-right">
                <div className="flex gap-1 justify-end">
                  <img src={MSBLogo} alt="MSB Logo" className="w-5 h-5 sm:w-6 sm:h-6" />
                  <img src={seal} alt="Seal" className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="leading-tight tracking-wide">
                  <div className="font-semibold">Prov. Gov. of</div>
                  <div className="font-semibold">Camarines Norte</div>
                  <div>Museum & Shrine</div>
                  <div>Division</div>
                </div>
              </div>

              {/* Middle column */}
              <div className="px-2 sm:px-3 py-2 border-x-[2px] border-black">
                <div className="border-t border-black mb-1" />
                <div className="font-semibold text-sm sm:text-base">
                  Museo{" "}
                  <span
                    className="font-bold"
                    style={{ color: "#F8BB1F", textShadow: "0 0 1px #bfa100" }}
                  >
                    B
                  </span>
                  ulawan News
                </div>
                <div className="mt-1 font-bold underline text-base sm:text-lg md:text-xl break-words leading-tight">
                  {title || "Title of the News or Event"}
                </div>
                <div className="mt-1 text-xs sm:text-sm">{author || "—"}</div>
                <div className="border-b border-black mt-1" />
              </div>

              {/* Right column */}
              <div className="flex flex-col items-start justify-center px-2 py-2 gap-0.5 text-left">
                <div className="italic font-semibold text-xs sm:text-sm">
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })
                    : "—"}
                </div>
                <div className="text-[10px] sm:text-xs">
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </div>
                <div className="underline text-[10px] sm:text-xs">
                  {`Vol.${volume ?? "—"}, ${rightBadge || "No.—"}`}
                </div>
              </div>
            </div>

            {/* Bottom border */}
            <div className="border-b-[2px] border-black" />
          </div>
        </div>
      </div>

      {/* PREVIEW BODY */}
      <div
        className="
          border border-gray-200 p-4 rounded min-h-[300px] font-[Hina Mincho]
          
          /* 🔽 Make embeds miniature in PREVIEW only */
          preview-mini
          [&_iframe[src*='youtube']]:w-full
          [&_iframe[src*='youtube']]:h-auto
          [&_iframe[src*='youtube']]:aspect-video
          [&_iframe[src*='youtube']]:mx-auto
          [&_iframe[src*='youtube']]:!max-w-[18rem]   /* ~288px base */
          sm:[&_iframe[src*='youtube']]:!max-w-[22rem] /* ~352px */
          md:[&_iframe[src*='youtube']]:!max-w-[26rem] /* ~416px */
          lg:[&_iframe[src*='youtube']]:!max-w-[30rem] /* ~480px */
          xl:[&_iframe[src*='youtube']]:!max-w-[32rem] /* ~512px */

          [&_.youtube-video]:w-full
          [&_.youtube-video]:mx-auto
          [&_.youtube-video]:!max-w-[18rem]
          sm:[&_.youtube-video]:!max-w-[22rem]
          md:[&_.youtube-video]:!max-w-[26rem]
          lg:[&_.youtube-video]:!max-w-[30rem]
          xl:[&_.youtube-video]:!max-w-[32rem]
        "
      >
        {/* Thumbnail intentionally not displayed in article view */}

        <div className="editor-content-preview not-prose max-w-none break-words font-hina">
          {editorHTML ? (
            <div
              className="editor-content-preview"
              dangerouslySetInnerHTML={{ __html: editorHTML }}
            />
          ) : (
            <p className="text-gray-400 italic">Article content will appear here...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlePreview;
