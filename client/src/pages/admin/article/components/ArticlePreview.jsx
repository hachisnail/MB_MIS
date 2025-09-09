import React from "react";
import texture from "../../../../assets/Texture.png";

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
  previewImage,
  removeThumbnail,
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

  const datePretty =
    selectedDate
      ? new Date(selectedDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "[month dd, yyyy]";

  return (
    <div className="bg-white w-full max-w-[50rem] p-6 rounded-lg shadow-2xl mt-4 2xl:mt-0" >
      
      <h3 className="text-2xl font-bold mb-4">Preview</h3>

      {/* Archive badges */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
          {volume ? `Vol.${volume}` : "Vol.—"}
        </span>
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
          {rightBadge}
        </span>
        {contentType && (
          <span className="ml-auto inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wide">
            {contentType}
          </span>
        )}
      </div>

      <div className="border border-gray-200 p-4 mb-4 rounded">
        <h1 className="text-center text-3xl font-bold">
          {title || "Title of the News or Event"}
        </h1>
      </div>

      <div className="flex w-full justify-center mb-6 font-hina">
        <div className="flex w-full items-center justify-center text-center text-base">
          <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
            <h4 className="text-lg font-medium">Date</h4>
            <p className={`text-sm ${!selectedDate ? "text-gray-500 italic" : ""}`}>
              {datePretty}
            </p>
          </span>

          <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
            <h4 className="text-lg font-medium">Author</h4>
            <p className={`text-sm ${!author ? "text-gray-500 italic" : ""}`}>
              {author || "[Name of the Author]"}
            </p>
          </span>

          {/* Address only for Events */}
          {isEvent ? (
            <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
              <h4 className="text-lg font-medium">Address</h4>
              <p
                className={`text-sm ${
                  !municipality && !barangay ? "text-gray-500 italic" : ""
                }`}
              >
                {barangay ? `${barangay}, ` : ""}
                {municipality || "[Location]"}
              </p>
            </span>
          ) : (
            <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2 opacity-50">
              <h4 className="text-lg font-medium">Address</h4>
              <p className="text-sm italic">Hidden for articles</p>
            </span>
          )}

          <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
            <h4 className="text-lg font-medium">Category</h4>
            <p className={`text-sm ${!category ? "text-gray-500 italic" : ""}`}>
              {category || "[placeholder]"}
            </p>
          </span>
        </div>
      </div>

      <div className="border border-gray-200 p-4 rounded min-h-[300px] font-[Hina Mincho]">
        {previewImage && !removeThumbnail ? (
          <div className="flex justify-center mb-4">
            <img
              src={previewImage}
              alt="Article thumbnail"
              className="max-h-64 object-contain"
            />
          </div>
        ) : null}

        <div className="editor-content-preview not-prose max-w-none break-words font-hina">
          {editorHTML ? (
            <div
              className="editor-content-preview"
              dangerouslySetInnerHTML={{ __html: editorHTML }}
            />
          ) : (
            <p className="text-gray-400 italic">
              Article content will appear here...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlePreview;
