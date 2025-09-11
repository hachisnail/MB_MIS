import { useState, useEffect } from "react";

export default function MaintenanceReportCard({
  title = "Report 1",
  report = {},
  onChange,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const set = (key, value) => {
    onChange && onChange({ ...report, [key]: value });
  };

  const inputBase =
    "w-full bg-transparent outline-none border-b border-neutral-300 focus:border-black px-1 py-0.5 text-lg";
  const textAreaBase =
  "w-full h-[6rem]  overflow-y-auto resize-none rounded-md border border-neutral-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder:text-neutral-400 text-lg";

  const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

  return (
    <section className=" bg-white overflow-y-auto">
      <div className="border rounded-lg border-black">
        {/* Header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-[#EDCA86] text-black"
        >
          <span className="font-semibold text-lg">{title}</span>
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-90" : "-rotate-90"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10.293 14.707a1 1 0 010-1.414L12.586 11H4a1 1 0 110-2h8.586l-2.293-2.293A1 1 0 1111.707 5.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Body */}
        <div className={`${open ? "block" : "hidden"}`}>
          {/* Row 1 */}
          <div className="h-18 grid [grid-template-columns:4rem_18rem_1fr_10rem_10rem] border-b border-neutral-300">
            <div className="p-2.5 border-r border-neutral-300">
              <div className="text-lg font-medium text-neutral-800">ID</div>
              <input
                className={inputBase}
                value={report.id || ""}
                onChange={(e) => set("id", e.target.value)}
              />
            </div>
            <div className=" p-2.5 border-r border-neutral-300">
              <div className="text-lg font-medium text-neutral-800">Person Responsible</div>
              <input
                className={inputBase}
                value={report.personResponsible || ""}
                onChange={(e) => set("personResponsible", e.target.value)}
              />
            </div>
            <div className="p-2.5 border-r border-neutral-300">
              <div className="text-lg font-medium text-neutral-800">Action Taken</div>
              <input
                className={inputBase}
                value={report.actionTaken || ""}
                onChange={(e) => set("actionTaken", e.target.value)}
              />
            </div>
            <div className="p-2.5 border-r border-neutral-300">
              <div className="text-lg font-medium text-neutral-800">Date Start</div>
              <input
                type="date"
                className={`${inputBase} border-0 border-b`}
                value={report.dateStart || ""}
                onChange={(e) => set("dateStart", e.target.value)}
              />
            </div>
            <div className="p-2.5">
              <div className="text-lg font-medium text-neutral-800">Date End</div>
              <input
                type="date"
                className={`${inputBase} border-0 border-b`}
                value={report.dateEnd || ""}
                onChange={(e) => set("dateEnd", e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Dimension / Storage / Personnel */}
          <div className="h-19 grid [grid-template-columns:22rem_14rem_1fr] border-b border-neutral-300">
            <div className="p-2.5 border-r border-neutral-300">
              <div className="text-lg font-medium text-neutral-800">Dimension</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <SmallLabeledInput label="L" value={report.dimL || ""} onChange={(v) => set("dimL", v)} />
                <span className="text-neutral-400">/</span>
                <SmallLabeledInput label="W" value={report.dimW || ""} onChange={(v) => set("dimW", v)} />
                <span className="text-neutral-400">/</span>
                <SmallLabeledInput label="H" value={report.dimH || ""} onChange={(v) => set("dimH", v)} />
              </div>
            </div>
            <div className="p-2.5 border-r border-neutral-300">
              <div className="text-lg font-medium text-neutral-800">Storage</div>
              <input
                className={inputBase}
                value={report.storage || ""}
                onChange={(e) => set("storage", e.target.value)}
              />
            </div>
            <div className="p-2.5">
              <div className="text-lg font-medium text-neutral-800">Responsible Personnel</div>
              <input
                className={inputBase}
                value={report.responsiblePersonnel || ""}
                onChange={(e) => set("responsiblePersonnel", e.target.value)}
              />
            </div>
          </div>

          {/* Long text areas */}
         {/* Initial Condition Report (inline) */}
          <RowInline title="Initial Condition Report" hint="baseline when acquired…">
            <textarea
              className={textAreaBase}
              value={report.initialCondition || ""}
              onChange={(e) => set("initialCondition", e.target.value)}
              placeholder="Describe the baseline condition when acquired…"
            />
          </RowInline>

          {/* Observed Damages / Deterioration (inline) */}
          <RowInline title="Observed Damages / Deterioration" hint="e.g., cracks, fading, corrosion, pest damage…">
            <textarea
              className={textAreaBase}
              value={report.damages || ""}
              onChange={(e) => set("damages", e.target.value)}
              placeholder="List damages, deterioration, or issues observed…"
            />
          </RowInline>

          {/* Environmental Factors (inline) */}
          <RowInline title="Environmental Factors" hint="(light, humidity, temperature effects)…">
            <textarea
              className={textAreaBase}
              value={report.environment || ""}
              onChange={(e) => set("environment", e.target.value)}
              placeholder="Note environmental conditions affecting the artifact…"
            />
          </RowInline>


          {/* Images */}
          <div className=" grid grid-cols-2 border-t border-neutral-300">
            <div className="p-2.5 border-r border-neutral-300">
              <div className="text-lg font-medium text-neutral-800">Image Before Maintenance</div>
              <ImageMultiDrop
                values={toArray(report.imgBefore)}
                onAdd={(files) => set("imgBefore", [...toArray(report.imgBefore), ...files])}
                onRemove={(idx) => {
                  const next = [...toArray(report.imgBefore)];
                  next.splice(idx, 1);
                  set("imgBefore", next);
                }}
                onClearAll={() => set("imgBefore", [])}
                inputId={`${title}-before`}
              />
            </div>
            <div className="p-2.5">
              <div className="text-lg font-medium text-neutral-800">Image After Maintenance</div>
              <ImageMultiDrop
                values={toArray(report.imgAfter)}
                onAdd={(files) => set("imgAfter", [...toArray(report.imgAfter), ...files])}
                onRemove={(idx) => {
                  const next = [...toArray(report.imgAfter)];
                  next.splice(idx, 1);
                  set("imgAfter", next);
                }}
                onClearAll={() => set("imgAfter", [])}
                inputId={`${title}-after`}
              />
            </div>
          </div>

         <RowInline title="Preventive Measures Taken" hint="e.g., UV protection, humidity control, protective casing…">
            <textarea
              className={textAreaBase}
              value={report.preventive || ""}
              onChange={(e) => set("preventive", e.target.value)}
              placeholder="Document preventive measures applied…"
            />
          </RowInline>

          <RowInline title="Remarks/Notes" hint="Enter text…">
            <textarea
              className={textAreaBase}
              value={report.remarks || ""}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Additional notes…"
            />
          </RowInline>

        </div>
      </div>
    </section>
  );
}

/* --- Helpers --- */
function RowFull({ title, hint, children }) {
  return (
    <div className="border-t border-neutral-300 p-2.5">
      <div className="text-lg font-medium text-neutral-800">{title}</div>
      {hint && <div className="text-lg text-neutral-500">{hint}</div>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
function RowInline({ title, hint, children, labelWidth = "w-48" }) {
  return (
    <div className="h-30 border-t border-neutral-300 p-2.5">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 ${labelWidth}`}>
          <div className="text-lg font-medium text-neutral-800">{title}</div>
          {hint && <div className="text-sm text-neutral-500">{hint}</div>}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function SmallLabeledInput({ label, value, onChange }) {
  return (
    <label className="inline-flex items-center gap-1">
      <span className="text-sm text-neutral-500">{label}</span>
      <input
        className="w-12 border-b border-neutral-300 focus:border-black outline-none px-1 py-0.5 text-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/* Image uploader */
function ImageMultiDrop({ values = [], onAdd, onRemove, onClearAll, inputId }) {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const mapped = values
      .map((v) => {
        if (!v) return null;
        if (typeof v === "string") return { url: v, revoke: false };
        const url = URL.createObjectURL(v);
        return { url, revoke: true };
      })
      .filter(Boolean);

    setPreviews(mapped);

    return () => {
      mapped.forEach((p) => {
        if (p.revoke) URL.revokeObjectURL(p.url);
      });
    };
  }, [values]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onAdd && onAdd(files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) onAdd && onAdd(files);
  };
  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="space-y-2 mt-1.5">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="h-auto rounded-lg border-2 border-dashed border-neutral-300 p-3 flex items-center justify-between gap-2"
      >
        <label htmlFor={inputId} className="cursor-pointer text-lg text-neutral-700 hover:text-black">
          Upload images
        </label>
        {values.length > 0 && (
          <button
            type="button"
            onClick={() => onClearAll && onClearAll()}
            className="text-lg px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200"
          >
            Clear all
          </button>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {previews.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {previews.map((p, idx) => (
            <li key={idx} className="relative group">
              <img
                src={p.url}
                alt={`upload-${idx}`}
className="h-[26rem] w-full object-cover rounded-md border border-neutral-200 bg-white"
              />
              <button
                type="button"
                onClick={() => onRemove && onRemove(idx)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-lg px-1.5 py-0.5 rounded bg-black/70 text-white"
                title="Remove"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
