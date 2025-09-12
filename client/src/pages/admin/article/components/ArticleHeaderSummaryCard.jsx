import React from "react";

export default function ArticleHeaderSummaryCard({
  title,
  selectedDate,
  author,
  category,
  contentType,
  municipality,
  barangay,
  status,
  statusLabels,
  onEdit,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">Details</div>
        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
        >
          Edit details
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm">
        <div><span className="font-medium">Title:</span> {title || "—"}</div>
        <div><span className="font-medium">Date:</span> {selectedDate || "—"}</div>
        <div><span className="font-medium">Author:</span> {author || "—"}</div>
        <div><span className="font-medium">Category:</span> {category || "—"}</div>
        <div><span className="font-medium">Type:</span> {contentType || "—"}</div>
        {contentType === "event" && (
          <>
            <div><span className="font-medium">Municipality:</span> {municipality || "—"}</div>
            <div><span className="font-medium">Barangay:</span> {barangay || "—"}</div>
          </>
        )}
        <div><span className="font-medium">Status:</span> {statusLabels?.[status] ?? status ?? "—"}</div>
      </div>
    </div>
  );
}
