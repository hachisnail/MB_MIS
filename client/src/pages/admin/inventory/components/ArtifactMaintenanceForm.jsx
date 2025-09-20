import React from "react";

/* ---------------- RowField (reusable input) ---------------- */
const RowField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  labelWidth = "w-72",
}) => (
  <div className="w-full flex items-center gap-4">
    <span
      className={`text-[#555555] font-hind font-bold text-2xl ${labelWidth}`}
    >
      {label}
    </span>
    <input
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex-1 h-16 rounded-xl border border-gray-300 px-4 text-xl font-semibold text-[#1D1911]
        shadow-[inset_0_6px_10px_rgba(0,0,0,0.12)] outline-none ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
    />
  </div>
);

/* ---------------- StatusPill (visual status) ---------------- */
const StatusPill = ({ status }) => {
  const s = (status || "").toLowerCase().trim();

  const map = {
    "on display": {
      label: "On Display",
      cls: "bg-green-100 text-green-800 border-green-300",
    },
    "in maintenance": {
      label: "In Maintenance",
      cls: "bg-amber-100 text-amber-800 border-amber-300",
    },
    on_display: {
      label: "On Display",
      cls: "bg-green-100 text-green-800 border-green-300",
    },
    in_maintenance: {
      label: "In Maintenance",
      cls: "bg-amber-100 text-amber-800 border-amber-300",
    },
  };

  const picked =
    map[s] ||
    (s.includes("display")
      ? map["on display"]
      : s.includes("maint")
      ? map["in maintenance"]
      : { label: status || "—", cls: "bg-gray-100 text-gray-700 border-gray-300" });

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 h-10 rounded-full border text-sm font-semibold ${picked.cls}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-current opacity-70" />
      {picked.label}
    </span>
  );
};

/* ---------------- DamageImagesGrid ----------------
   - Displays images
   - Optional add/remove controls via URLs
---------------------------------------------------*/
const DamageImagesGrid = ({ images = [], onChange = () => {} }) => {
  const [newUrl, setNewUrl] = React.useState("");

  const addImage = () => {
    const url = newUrl.trim();
    if (!url) return;
    onChange([...images, url]);
    setNewUrl("");
  };

  const removeAt = (idx) => {
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Add by URL */}
      <div className="flex items-center gap-3">
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Paste damage image URL…"
          className="flex-1 h-12 rounded-lg border border-gray-300 px-3 text-base shadow-[inset_0_6px_10px_rgba(0,0,0,0.06)] outline-none"
        />
        <button
          type="button"
          onClick={addImage}
          className="h-12 px-4 rounded-lg bg-black text-white text-sm font-semibold active:translate-y-[1px]"
        >
          Add
        </button>
      </div>

      {/* Grid */}
      {images.length === 0 ? (
        <div className="text-gray-500 text-sm">No damage images yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Damage ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/80 text-white text-sm font-bold flex items-center justify-center"
                title="Remove"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Controlled form. Parent owns state via `value` and `onChange`.
 * Kept simple & predictable.
 *
 * Props shape (recommended):
 * value = {
 *   status: "On Display" | "In Maintenance" | "on_display" | "in_maintenance",
 *   maintenanceDescription: string,
 *   damageImages: string[], // URLs
 *   // (legacy fields below are kept for backward-compat but unused)
 *   collectionNumber?: string, age?: string, culture?: string, provenance?: string,
 *   location?: string, discovery?: string, excavationSite?: string, acquisitionHistory?: string,
 * }
 */
export default function ArtifactMetadataForm({
  value = {},
  onChange = () => {},
}) {
  const meta = {
    // NEW fields
    status: "", // "On Display" / "In Maintenance" or snake_case
    maintenanceDescription: "",
    damageImages: [],
    // Legacy/unused (kept to avoid breaking callers that still pass them)
    collectionNumber: "",
    age: "",
    culture: "",
    provenance: "",
    location: "",
    discovery: "",
    excavationSite: "",
    acquisitionHistory: "",
    ...value,
  };

  // keep setter for future edits (even though top/middle are now read-only displays)
  const set = (k) => (v) => onChange({ ...meta, [k]: v });

  return (
    <div className="w-full h-full flex flex-col gap-8 pr-20">
      {/* =================== TOP: Status =================== */}
      <div className="w-full min-h-fit rounded-lg border border-gray-300 p-8 flex flex-col gap-6">
        <span className="text-4xl font-bold">Artifact Status</span>

        {/* Read-only sentence with fallback when not set */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[#555555] font-hind font-bold text-2xl">
            This artifact is currently:
          </span>
          {meta.status ? (
            <StatusPill status={meta.status} />
          ) : (
            <span className="text-gray-500 italic text-xl">
              Status hasn&apos;t been set yet
            </span>
          )}
        </div>
      </div>

      {/* ================= MIDDLE: Maintenance Description (read-only box) ================= */}
      <div className="w-full min-h-fit rounded-lg border border-gray-300 p-8 flex flex-col gap-4">
        <span className="text-4xl font-bold">Maintenance Description</span>
        <div className="rounded-xl border border-gray-200 bg-white p-4 min-h-[10rem]">
          {meta.maintenanceDescription && meta.maintenanceDescription.trim() ? (
            <p className="whitespace-pre-wrap text-lg text-[#1D1911]">
              {meta.maintenanceDescription}
            </p>
          ) : (
            <span className="text-gray-500 italic">No description yet</span>
          )}
        </div>
      </div>

      {/* ================= BOTTOM: Artifact Damage Images ================= */}
      <div className="w-full min-h-fit rounded-lg border border-gray-300 p-8 flex flex-col gap-6">
        <span className="text-4xl font-bold">Artifact Damage Images</span>
        <DamageImagesGrid
          images={meta.damageImages || []}
          onChange={set("damageImages")}
        />
      </div>
    </div>
  );
}
