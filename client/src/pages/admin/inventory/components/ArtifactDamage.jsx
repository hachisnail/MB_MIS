// src/pages/admin/inventory/components/ArtifactMaintenanceForm.jsx
import React from "react";

export default function ArtifactMaintenanceForm({ value = {}, onChange }) {
  const { status = "", maintenanceDescription, damageImages = [] } = value || {};

  // Single source of truth for the caption/description you want
  const CAPTION_TEXT = "Artifact Damage Images";

  // Keep your description, but fall back to the caption text if it's empty
  const desc = (maintenanceDescription || "").trim() || CAPTION_TEXT;

  return (
    <section className="w-full h-full flex flex-col gap-4">
      {/* Header / Status */}
      <div className="w-full rounded-lg border border-gray-300 p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">Maintenance</h2>
          {status ? (
            <span className="px-3 py-1.5 rounded-md text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {status}
            </span>
          ) : null}
        </div>

        {/* Description */}
        <p className="text-lg text-gray-800">{desc}</p>
      </div>

      {/* Damage Images */}
      <div className="w-full rounded-lg border border-gray-300 p-4 bg-white">
        {damageImages?.length ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {damageImages.map((item, idx) => {
              const src = item?.src || item;       // tolerate string[] or {src,label}
              const overlay = item?.label || "";   // keep your "Before/After" overlay if present
              return (
                <li key={idx} className="relative">
                  <img
                    src={src}
                    alt={overlay || CAPTION_TEXT}
                    className="w-full h-56 object-cover rounded-md border border-gray-200"
                  />
                  {/* optional small overlay tag (e.g., "Before 1", "After 2") */}
                  {overlay ? (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-sm">
                      {overlay}
                    </div>
                  ) : null}

                  {/* Always use your requested caption text below the image */}
                  <div className="mt-2 text-sm text-gray-800">{CAPTION_TEXT}</div>
                </li>
              );
            })}
          </ul>
        ) : (
          // No images: still show your caption so the text is visible
          <div className="h-48 flex items-center justify-center text-gray-500 italic">
            {CAPTION_TEXT}
          </div>
        )}
      </div>
    </section>
  );
}
