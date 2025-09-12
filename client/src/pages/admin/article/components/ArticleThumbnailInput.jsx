import React from "react";
import { X as XIcon } from "lucide-react";

export default function ArticleThumbnailInput({
  inputRef,
  previewImage,
  removeThumbnail,
  onChange,
  onRemove,
}) {
  return (
    <div className="relative">
      <label htmlFor="thumbnail" className="font-bold">Thumbnail</label>
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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-700 truncate max-w-[75%]">
        {removeThumbnail || !previewImage ? "No Image selected" : previewImage.split("/").pop()}
      </div>
      {previewImage && !removeThumbnail && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800"
        >
          <XIcon size={15} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
