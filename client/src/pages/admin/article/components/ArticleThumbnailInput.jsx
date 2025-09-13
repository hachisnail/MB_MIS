// components/ArticleThumbnailInput.jsx
import React from "react";
import { X as XIcon } from "lucide-react";

export default function ArticleThumbnailInput({
  inputRef,
  previewUrl,          // <-- URL (blob or absolute)
  removeThumbnail,
  onChange,
  onRemove,
}) {
  const fileLabel =
    !previewUrl || removeThumbnail
      ? "No image selected"
      : (() => {
          try {
            const p = previewUrl.split("?")[0];
            return p.split("/").pop() || "thumbnail";
          } catch {
            return "thumbnail";
          }
        })();

  return (
    <div className="space-y-2">
      <label htmlFor="thumbnail" className="font-bold">Thumbnail</label>

      <div className="flex items-start gap-4">
        {/* File picker */}
        <div className="flex-1 relative">
          <input
            id="thumbnail"
            ref={inputRef}
            className="w-full px-4 py-3 border-2 border-black rounded-2xl text-base md:text-lg outline-none file:hidden"
            type="file"
            name="thumbnail"
            onChange={onChange}
            accept="image/*"
            style={{ color: "transparent" }}
          />
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-700 truncate max-w-[75%] pointer-events-none">
            {fileLabel}
          </div>
          {previewUrl && !removeThumbnail && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800"
              aria-label="Remove thumbnail"
              title="Remove thumbnail"
            >
              <XIcon size={15} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Visual preview */}
        <div className="w-28 h-28 border rounded-lg overflow-hidden grid place-items-center bg-gray-50">
          {previewUrl && !removeThumbnail ? (
            <img
              src={previewUrl}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="text-xs text-gray-500">No preview</span>
          )}
        </div>
      </div>
    </div>
  );
}
