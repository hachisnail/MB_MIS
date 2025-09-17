import React from "react";

const RowField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  labelWidth = "w-72",
}) => (
  <div className="w-full flex items-center gap-4">
    <span className={`text-[#555555] font-hind font-bold text-2xl ${labelWidth}`}>
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

/**
 * Controlled form. Parent owns state via `value` and `onChange`.
 * No internal state/useEffect → avoids update-depth loops & flicker.
 */
export default function ArtifactMetadataForm({
  value = {},
  onChange = () => {},
}) {
  const meta = {
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

  const set = (k) => (v) => onChange({ ...meta, [k]: v });

  return (
    <div className="w-full h-full flex flex-col gap-8 pr-20">
      {/* Basic Information */}
      <div className="w-full min-h-fit rounded-lg border border-gray-300 p-8 flex flex-col gap-6">
        <span className="text-4xl font-bold">Basic Information</span>
        <div className="flex flex-col gap-6">
          <RowField
            label="Collection Number"
            value={meta.collectionNumber}
            onChange={set("collectionNumber")}
            placeholder="Auto-generated when metadata is completed"
            disabled
          />
          <RowField
            label="Date of Creation / Age"
            value={meta.age}
            onChange={set("age")}
            placeholder="e.g., Pre-Hispanic Philippines (Iron Age) Approx. 12th–14th century CE"
          />
          <RowField
            label="Culture / Civilization"
            value={meta.culture}
            onChange={set("culture")}
            placeholder="e.g., Pre-colonial Philippine…"
          />
        </div>
      </div>

      {/* Origin & Current Location */}
      <div className="w-full min-h-fit rounded-lg border border-gray-300 p-8 flex flex-col gap-6">
        <span className="text-4xl font-bold">Origin &amp; Current Location</span>
        <div className="flex flex-col gap-6">
          <RowField
            label="Origin / Provenance"
            value={meta.provenance}
            onChange={set("provenance")}
            placeholder="Excavated near…"
          />
          <RowField
            label="Current Location"
            value={meta.location}
            onChange={set("location")}
            placeholder="National Museum of the Philippines (Manila)"
          />
        </div>
      </div>

      {/* Discovery & Acquisition */}
      <div className="w-full min-h-fit rounded-lg border border-gray-300 p-8 flex flex-col gap-6">
        <span className="text-4xl font-bold">Discovery &amp; Acquisition</span>
        <div className="flex flex-col gap-6">
          <RowField
            label="Discovery Details"
            value={meta.discovery}
            onChange={set("discovery")}
            placeholder="Found in 1987 by local farmers…"
          />
          <RowField
            label="Excavation Site"
            value={meta.excavationSite}
            onChange={set("excavationSite")}
            placeholder="Barangay Tulay na Lupa, Labo, Camarines Norte"
          />
          <RowField
            label="Acquisition History"
            value={meta.acquisitionHistory}
            onChange={set("acquisitionHistory")}
            placeholder="Donated to the National Museum in 1990…"
          />
        </div>
      </div>
    </div>
  );
}
