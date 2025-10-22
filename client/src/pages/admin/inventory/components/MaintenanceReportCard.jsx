import { useState, useEffect } from "react";

export default function MaintenanceReportCard({
  title = "Report 1",
  report = {},
  onChange,
  defaultOpen = true,
  errors = {},
  isSubmitted = false,
  isReadOnly = false,
  onEdit,
  onSubmit,
  artifactId,
  sessionId,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [editMode, setEditMode] = useState(!isSubmitted);

  // local editable copy of the report (so we don't accidentally mutate parent's array)
  const [formData, setFormData] = useState(report || {});

  // when parent supplies a new `report` prop, update internal formData (for completed reports)
  useEffect(() => {
    setFormData(report || {});
    // keep editMode consistent: if parent says submitted, set editMode accordingly
    setEditMode(!isSubmitted);
  }, [report, isSubmitted]);

  // draft persistence only when artifactId && sessionId present (active session)
  const localKey = artifactId && sessionId ? `maintenanceForm-${artifactId}-${sessionId}` : null;

  useEffect(() => {
    if (localKey) {
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(parsed);
          if (onChange) onChange(parsed);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localKey]);

  useEffect(() => {
    if (localKey) {
      try {
        localStorage.setItem(localKey, JSON.stringify(formData));
      } catch {}
    }
  }, [formData, localKey]);

  // helpers to update formData and notify parent
  const setField = (key, value) => {
    if (!editMode) return;
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    if (onChange) onChange(updated);
  };

  const dimsFromLegacy =
    formData.dimensions && Array.isArray(formData.dimensions)
      ? formData.dimensions
      : [
          {
            L: formData.dimL || "",
            W: formData.dimW || "",
            H: formData.dimH || "",
          },
        ];

  const setDimensions = (nextDims) => {
    if (!editMode) return;
    const updated = { ...formData, dimensions: nextDims, dimL: "", dimW: "", dimH: "" };
    setFormData(updated);
    if (onChange) onChange(updated);
  };

  const handleEdit = () => {
    setEditMode(true);
    onEdit && onEdit();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Do not set editMode to false here; let parent control it after successful submit
    if (onSubmit) onSubmit(formData);
  };

  const inputBase = editMode
    ? "w-full bg-transparent outline-none border-b border-neutral-300 focus:border-black px-1 py-0.5 text-lg"
    : "w-full bg-transparent outline-none border-b border-transparent px-1 py-0.5 text-lg text-neutral-700";

  const textAreaBase = editMode
    ? "w-full h-[4rem] 3xl:h-[6rem] overflow-y-auto resize-none rounded-md border border-neutral-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder:text-neutral-400 text-lg"
    : "w-full h-[4rem] 3xl:h-[6rem] overflow-y-auto resize-none rounded-md border border-transparent px-2 py-1.5 text-lg text-neutral-700 bg-neutral-50";

  const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

  const updateDimAt = (i, field, value) => {
    if (!editMode) return;
    const next = dimsFromLegacy.map((d, idx) => (idx === i ? { ...d, [field]: value } : d));
    setDimensions(next);
  };

  const addDimRow = () => {
    if (!editMode) return;
    setDimensions([...dimsFromLegacy, { L: "", W: "", H: "" }]);
  };

  const removeDimRow = (i) => {
    if (!editMode) return;
    const next = dimsFromLegacy.slice();
    next.splice(i, 1);
    setDimensions(next.length ? next : [{ L: "", W: "", H: "" }]);
  };

  const formatDDMMYYYY = (iso) => {
    if (!iso) return "";
    const [y, m, d] = String(iso).split("-");
    if (!y || !m || !d) return iso;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  };

  // When submitting success, parent will refresh reports / clear draft. This child removes local draft only on explicit submit success if desired.
  const clearLocalDraft = () => {
    if (localKey) {
      try {
        localStorage.removeItem(localKey);
      } catch {}
    }
  };

  // If the parent tells us this report has been submitted, clear local draft copy
  useEffect(() => {
    if (isSubmitted && localKey) {
      clearLocalDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitted]);

  return (
    <section className="bg-white overflow-y-auto mb-4">
      <div className="border rounded-lg border-black">
        {/* Header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-3 py-1.5 text-black ${
            isSubmitted ? "bg-green-200" : "bg-[#EDCA86]"
          }`}
        >
          <span className="font-semibold text-lg">
            {title} {isSubmitted && "(Completed)"}
          </span>
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
        {open ? (
          <form onSubmit={handleSubmit}>
            {/* Row 1 (ID removed; Person Responsible now spans ID space) */}
            {/* grid: [ 22rem  1fr  10rem  10rem ] */}
            <div className="h-18 grid [grid-template-columns:22rem_1fr_10rem_10rem] border-b border-neutral-300">
              {/* Person Responsible */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Person Responsible</div>
                <input
                  className={inputBase}
                  value={formData.personResponsible || ""}
                  onChange={(e) => setField("personResponsible", e.target.value)}
                  readOnly={!editMode}
                />
                {errors.personResponsible && (
                  <p className="mt-1 text-sm text-red-600">{errors.personResponsible}</p>
                )}
              </div>

              {/* Action Taken */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Action Taken</div>
                <input
                  className={inputBase}
                  value={formData.actionTaken || ""}
                  onChange={(e) => setField("actionTaken", e.target.value)}
                  readOnly={!editMode}
                />
                {errors.actionTaken && (
                  <p className="mt-1 text-sm text-red-600">{errors.actionTaken}</p>
                )}
              </div>

              {/* Dates */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Date Start</div>
                <input
                  type="date"
                  className={`${inputBase} border-0 border-b`}
                  value={formData.dateStart || ""}
                  onChange={(e) => setField("dateStart", e.target.value)}
                  readOnly={!editMode}
                />
                {errors.dateStart && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateStart}</p>
                )}
              </div>
              <div className="p-2.5">
                <div className="text-lg font-medium text-neutral-800">Date End</div>
                <input
                  type="date"
                  className={`${inputBase} border-0 border-b`}
                  value={formData.dateEnd || ""}
                  onChange={(e) => setField("dateEnd", e.target.value)}
                  readOnly={!editMode}
                />
                {errors.dateEnd && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateEnd}</p>
                )}
              </div>
            </div>

            {/* Row 2: Dimensions (array) / Storage / Personnel / Final Location */}
            {/* grid: [ 22rem  14rem  1fr  12rem ] */}
            <div className="h-auto grid [grid-template-columns:22rem_14rem_1fr_12rem] border-b border-neutral-300">
              {/* Dimensions as an array */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-medium text-neutral-800">Dimensions</div>
                  {editMode && (
                    <button
                      type="button"
                      onClick={addDimRow}
                      className="text-sm px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {errors.dimensions && (
                  <p className="mt-1 text-sm text-red-600">{errors.dimensions}</p>
                )}

                <div className="mt-1.5 flex flex-col gap-2">
                  {dimsFromLegacy.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <SmallLabeledInput
                        label="L"
                        value={d.L}
                        onChange={(v) => updateDimAt(i, "L", v)}
                        readOnly={!editMode}
                      />
                      <span className="text-neutral-400">/</span>
                      <SmallLabeledInput
                        label="W"
                        value={d.W}
                        onChange={(v) => updateDimAt(i, "W", v)}
                        readOnly={!editMode}
                      />
                      <span className="text-neutral-400">/</span>
                      <SmallLabeledInput
                        label="H"
                        value={d.H}
                        onChange={(v) => updateDimAt(i, "H", v)}
                        readOnly={!editMode}
                      />
                      {editMode && dimsFromLegacy.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDimRow(i)}
                          className="ml-2 text-sm px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200"
                          title="Remove row"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Storage</div>
                <input
                  className={inputBase}
                  value={formData.storage || ""}
                  onChange={(e) => setField("storage", e.target.value)}
                  readOnly={!editMode}
                />
              </div>

              {/* Responsible Personnel */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Responsible Personnel</div>
                <input
                  className={inputBase}
                  value={formData.responsiblePersonnel || ""}
                  onChange={(e) => setField("responsiblePersonnel", e.target.value)}
                  readOnly={!editMode}
                />
              </div>

              {/* Final Location */}
              <div className="p-2.5">
                <div className="text-lg font-medium text-neutral-800">Final Location *</div>
                {editMode ? (
                  <select
                    className={`${inputBase} cursor-pointer`}
                    value={formData.finalLocation || ""}
                    onChange={(e) => setField("finalLocation", e.target.value)}
                    required
                  >
                    <option value="">Select location</option>
                    <option value="On Display">On Display</option>
                    <option value="In Storage">In Storage</option>
                    <option value="Gallery Exhibition">Gallery Exhibition</option>
                    <option value="Temporary Display">Temporary Display</option>
                    <option value="Conservation Lab">Conservation Lab</option>
                  </select>
                ) : (
                  <div className={inputBase}>
                    {formData.finalLocation || <span className="text-neutral-400">—</span>}
                  </div>
                )}
                {errors.finalLocation && (
                  <p className="mt-1 text-sm text-red-600">{errors.finalLocation}</p>
                )}
              </div>
            </div>

            {/* Long text areas */}
            <RowInline title="Initial Condition Report" hint="baseline when acquired…">
              <textarea
                className={textAreaBase}
                value={formData.initialCondition || ""}
                onChange={(e) => setField("initialCondition", e.target.value)}
                placeholder="Describe the baseline condition when acquired…"
                readOnly={!editMode}
              />
              {errors.initialCondition && (
                <p className="mt-1 text-sm text-red-600">{errors.initialCondition}</p>
              )}
            </RowInline>

            <RowInline
              title="Observed Damages / Deterioration"
              hint="e.g., cracks, fading, corrosion, pest damage…"
            >
              <textarea
                className={textAreaBase}
                value={formData.damages || ""}
                onChange={(e) => setField("damages", e.target.value)}
                placeholder="List damages, deterioration, or issues observed…"
                readOnly={!editMode}
              />
              {errors.damages && (
                <p className="mt-1 text-sm text-red-600">{errors.damages}</p>
              )}
            </RowInline>

            <RowInline title="Environmental Factors" hint="(light, humidity, temperature effects)…">
              <textarea
                className={textAreaBase}
                value={formData.environment || ""}
                onChange={(e) => setField("environment", e.target.value)}
                placeholder="Note environmental conditions affecting the artifact…"
                readOnly={!editMode}
              />
              {errors.environment && (
                <p className="mt-1 text-sm text-red-600">{errors.environment}</p>
              )}
            </RowInline>

            {/* Images */}
            <div className="grid grid-cols-2 border-t border-neutral-300">
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Image Before Maintenance</div>
                <ImageMultiDrop
                  values={toArray(formData.imgBefore)}
                  onAdd={editMode ? (files) => setField("imgBefore", [...toArray(formData.imgBefore), ...files]) : undefined}
                  onRemove={editMode ? (idx) => {
                    const next = [...toArray(formData.imgBefore)];
                    next.splice(idx, 1);
                    setField("imgBefore", next);
                  } : undefined}
                  onClearAll={editMode ? () => setField("imgBefore", []) : undefined}
                  inputId={`${title}-before`}
                  readOnly={!editMode}
                />
              </div>
              <div className="p-2.5">
                <div className="text-lg font-medium text-neutral-800">Image After Maintenance</div>
                <ImageMultiDrop
                  values={toArray(formData.imgAfter)}
                  onAdd={editMode ? (files) => setField("imgAfter", [...toArray(formData.imgAfter), ...files]) : undefined}
                  onRemove={editMode ? (idx) => {
                    const next = [...toArray(formData.imgAfter)];
                    next.splice(idx, 1);
                    setField("imgAfter", next);
                  } : undefined}
                  onClearAll={editMode ? () => setField("imgAfter", []) : undefined}
                  inputId={`${title}-after`}
                  readOnly={!editMode}
                />
              </div>
            </div>

            <RowInline
              title="Preventive Measures Taken"
              hint="e.g., UV protection, humidity control, protective casing…"
            >
              <textarea
                className={textAreaBase}
                value={formData.preventive || ""}
                onChange={(e) => setField("preventive", e.target.value)}
                placeholder="Document preventive measures applied…"
                readOnly={!editMode}
              />
              {errors.preventive && (
                <p className="mt-1 text-sm text-red-600">{errors.preventive}</p>
              )}
            </RowInline>

            <RowInline title="Remarks/Notes" hint="Enter text…">
              <textarea
                className={textAreaBase}
                value={formData.remarks || ""}
                onChange={(e) => setField("remarks", e.target.value)}
                placeholder="Additional notes…"
                readOnly={!editMode}
              />
              {errors.remarks && (
                <p className="mt-1 text-sm text-red-600">{errors.remarks}</p>
              )}
            </RowInline>

            {/* Bottom buttons */}
            <div className="w-full flex items-center justify-end gap-3 px-3 py-3 border-t border-neutral-300">
              {isSubmitted && !editMode && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-6 py-2 rounded-lg bg-blue-500 text-white text-base font-bold hover:bg-blue-600 border border-blue-600"
                >
                  Edit Report
                </button>
              )}
              {editMode && (
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#CDC469] text-[#1D1911] text-base font-bold hover:brightness-95 border border-[#1D1911]"
                >
                  {isSubmitted ? "Update Report" : "Submit Report"}
                </button>
              )}
            </div>
          </form>
        ) : (
          // Collapsed state: show ONLY the first row as a read-only summary
          <div>
            <div className="h-18 grid [grid-template-columns:22rem_1fr_10rem_10rem] border-b border-neutral-300 bg-neutral-50">
              {/* Person Responsible */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Person Responsible</div>
                <div className="text-lg min-h-[1.75rem]">
                  {formData.personResponsible?.trim() || <span className="text-neutral-400">—</span>}
                </div>
              </div>

              {/* Action Taken */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Action Taken</div>
                <div className="text-lg min-h-[1.75rem]">
                  {formData.actionTaken?.trim() || <span className="text-neutral-400">—</span>}
                </div>
              </div>

              {/* Date Start */}
              <div className="p-2.5 border-r border-neutral-300">
                <div className="text-lg font-medium text-neutral-800">Date Start</div>
                <div className="text-lg min-h-[1.75rem]">
                  {formData.dateStart ? (
                    formatDDMMYYYY(formData.dateStart)
                  ) : (
                    <span className="text-neutral-400">dd/mm/yyyy</span>
                  )}
                </div>
              </div>

              {/* Date End */}
              <div className="p-2.5">
                <div className="text-lg font-medium text-neutral-800">Date End</div>
                <div className="text-lg min-h-[1.75rem]">
                  {formData.dateEnd ? (
                    formatDDMMYYYY(formData.dateEnd)
                  ) : (
                    <span className="text-neutral-400">dd/mm/yyyy</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* --- Helpers --- */
function RowInline({ title, hint, children, labelWidth = "w-48" }) {
  return (
    <div className="h-27 3xl:h-30 border-t border-neutral-300 p-2.5">
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

function SmallLabeledInput({ label, value, onChange, readOnly = false }) {
  return (
    <label className="inline-flex items-center gap-1">
      <span className="text-sm text-neutral-500">{label}</span>
      <input
        className={`w-12 border-b outline-none px-1 py-0.5 text-lg ${
          readOnly
            ? "border-transparent text-neutral-700 bg-transparent"
            : "border-neutral-300 focus:border-black"
        }`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        readOnly={readOnly}
      />
    </label>
  );
}

/* ImageMultiDrop unchanged (keeps using formData values passed in) */
function ImageMultiDrop({ values = [], onAdd, onRemove, onClearAll, inputId, readOnly = false }) {
  const [previews, setPreviews] = useState([]);
  useEffect(() => {
    const mapped = values
      .map((v) => {
        if (!v) return null;
        if (typeof v === "string") return { url: v, revoke: false };
        if (v instanceof Blob) {
          const url = URL.createObjectURL(v);
          return { url, revoke: true };
        }
        // fallback: skip values that are not string or Blob/File
        return null;
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
    if (readOnly) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onAdd && onAdd(files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const files = dis.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) onAdd && onAdd(files);
  };
  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="space-y-2 mt-1.5">
      {!readOnly && (
        <div onDrop={handleDrop} onDragOver={handleDragOver} className="h-auto rounded-lg border-2 border-dashed border-neutral-300 p-3 flex items-center justify-between gap-2">
          <label htmlFor={inputId} className="cursor-pointer text-lg text-neutral-700 hover:text-black">Upload images</label>
          {values.length > 0 && <button type="button" onClick={() => onClearAll && onClearAll()} className="text-lg px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200">Clear all</button>}
          <input id={inputId} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </div>
      )}
      {previews.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {previews.map((p, idx) => (
            <li key={idx} className="relative group">
              <img src={p.url} alt={`upload-${idx}`} className="h-[26rem] w-full object-cover rounded-md border border-neutral-200 bg-white" />
              {!readOnly && <button type="button" onClick={() => onRemove && onRemove(idx)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-lg px-1.5 py-0.5 rounded bg-black/70 text-white" title="Remove">Remove</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
