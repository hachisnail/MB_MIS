import { useEffect, useRef, useState, useMemo } from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { renderAsync } from "docx-preview";
import ViewPort from "../../../../features/Viewport";

const DEFAULT_TEMPLATES = {
  donation: "http://localhost:5000/uploads/private/templates/DONATION-FORM.docx",
  lending:  "http://localhost:5000/uploads/private/templates/LEND-FORM.docx",
};

const FIXED_DELIMS = { start: "[[", end: "]]" };

const ALWAYS_EDITABLE_KEYS = [
  "name",
  "barangay",    
  "province",
  "city",
  "artifact",

];

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (!isValidDate(d)) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

const onlyDate = (val) => {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (!isValidDate(d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const diffHuman = (startISO, endISO) => {
  if (!startISO || !endISO) return "";
  const s = new Date(startISO);
  const e = new Date(endISO);
  const ms = e - s;
  if (!isValidDate(s) || !isValidDate(e) || ms < 0) return "";
  const days = Math.round(ms / 86400000);
  if (days < 31) return `${days} day(s)`;
  const months = Math.round(days / 30.4375);
  if (months < 24) return `${months} month(s)`;
  const years = Math.round(months / 12);
  return `${years} year(s)`;
};

const trimJoin = (...parts) => parts.map((s) => (s || "").trim()).filter(Boolean).join(" ");

const pickTemplate = (root) => {
  const type = (root?.contribution_type || root?.Contribution?.contribution_type || "").toLowerCase();
  return type === "lending" ? "lending" : "donation";
};

// ---- filename helpers ----
const padNum = (n, w = 4) => {
  const s = String(n ?? "");
  return /^\d+$/.test(s) ? s.padStart(w, "0") : s || "0000";
};

const slugify = (s, max = 40) => {
  if (!s) return "na";
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max) || "na"
  );
};

const safeName = (s, max = 180) =>
  (s || "")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const buildFileName = ({ templateKey, payload, data }) => {
  const now = new Date();
  const yyyy = now.getFullYear();

  const prefix = templateKey === "lending" ? "MOA-LEN" : "DON";

  // Raw IDs (no padding)
  const cid = payload?.contribution_id ?? "";
  const uid = payload?.contributor_id ?? "";
  const aid = data?.artifact_id ?? "";

  // Combination ID (no padding)
  const comboId = `${cid}${uid}${aid}${yyyy}`;

  // Random 3 uppercase letters
  const randLetters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("");

  // Random 3 digits
  const randNumbers = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

  return `${prefix}${comboId}-${randLetters}${randNumbers}`;
};




// ---- date token aliases (so different DOCX token names still work) ----
const DATE_ALIASES = {
  start: ["start", "start_date", "duration_from", "from", "date_from"],
  end:   ["end", "end_date", "duration_to", "to", "date_to"],
};

// ------------------------- Data shape for DOCX --------------------------
const toDocxData = (root) => {
  const a = root?.ContributionArtifact || root?.ontributionArtifact || {}; // tolerate typo
  const c = root?.Contributor || {};
  const lend = root?.LendingDetail || {};

  const name = trimJoin(c.first_name, c.last_name);
  const barangay = c.barangay || c.city || "";
  const province = c.province || "";
  const email = c.email || "";

  const artifact = a.title || a.description || "";
  const artifact_description = a.description || "";
  const artifact_id = a.artifact_id ?? "";
  const acquisition_details = a.acquisition_details || "";

  const submission_date = fmtDate(root?.submission_date || root?.created_at);

  const images = (a.images || []).join("\n");
  const documents = (a.documents || []).join("\n");
  const related_images = (a.related_images || []).join("\n");

  const base = {
    name,
    barangay,
    // a few friendly aliases (in case your template uses them)
    // Barangay: barangay,
    // baranagay: barangay,
    // Baranagay: barangay,
    // brgy: barangay,
    // Brgy: barangay,

    province,
    city: c.city || "",
    // email,
    artifact,
    // artifact_description,
    // artifact_id: String(artifact_id || ""),
    acquisition_details,
    // submission_date,
    // images,
    // documents,
    // related_images,
  };

  if (pickTemplate(root) === "lending") {
    const s = onlyDate(lend.duration_from || root?.submission_date || "");
    const e = onlyDate(lend.duration_to || root?.submission_date || "");

    const formattedStart = fmtDate(s);
    const formattedEnd = fmtDate(e);

    return {
      ...base,
      start_raw: s,
      end_raw: e,
      start: formattedStart,
      end: formattedEnd,
      total: diffHuman(s, e),

      // aliases
      start_date: formattedStart,
      end_date: formattedEnd,
      duration_from: formattedStart,
      duration_to: formattedEnd,
    };
  }

  return { ...base, donation_date: submission_date };
};

const buildDocxBlob = (templateAB, data) => {
  const zip = new PizZip(templateAB);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: FIXED_DELIMS,
  });
  doc.render(data);
  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

/** Extract placeholders used in the DOCX for the fixed [[ ]] delimiters */
const extractFieldsFromTemplate = (ab) => {
  try {
    const zip = new PizZip(ab);
    const read = (p) => (zip.file(p) ? zip.file(p).asText() : "");
    const docs = [
      read("word/document.xml"),
      ...Array.from({ length: 9 }, (_, i) => read(`word/header${i + 1}.xml`)),
      ...Array.from({ length: 9 }, (_, i) => read(`word/footer${i + 1}.xml`)),
    ].join("\n");

    const s = "\\[\\[";
    const e = "\\]\\]";
    const re = new RegExp(`${s}([\\s\\S]{0,400}?)${e}`, "g");
    const normalize = (x = "") =>
      x
        .replace(/<[^>]*>/g, "")
        .replace(/&[^;]+;/g, " ")
        .replace(/[^\w.-]+/g, "")
        .trim()
        .toLowerCase();

    const set = new Set();
    let m;
    while ((m = re.exec(docs)) !== null) {
      const key = normalize(m[1]);
      if (key) set.add(key);
    }
    return Array.from(set);
  } catch {
    return [];
  }
};

// ------------------------- Component --------------------------
const MoaBuilder = ({
  payload,
  templateUrls = DEFAULT_TEMPLATES,
  templateBuffers,
  onReadyBlob,
}) => {
  const [templateKey, setTemplateKey] = useState("donation");
  const [templateAB, setTemplateAB] = useState(null);
  const [data, setData] = useState({});
  const [blob, setBlob] = useState(null);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);
  const [isRendering, setIsRendering] = useState(false);
  const previewRef = useRef(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [docFields, setDocFields] = useState([]); // normalized lowercase
  const [formValues, setFormValues] = useState({});

  // Load template (by key)
  const ensureTemplateLoaded = async (key) => {
    setError("");
    try {
      let ab;
      if (templateBuffers?.[key]) {
        ab = templateBuffers[key];
      } else {
        const url = templateUrls?.[key];
        if (!url) throw new Error(`Missing template URL for key "${key}".`);
        const res = await fetch(url, { credentials: "include", headers: { "Cache-Control": "no-cache" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        ab = await res.arrayBuffer();
      }
      setTemplateAB(ab);
      setDocFields(extractFieldsFromTemplate(ab));
    } catch (e) {
      console.error(e);
      setError(`Failed to load template: ${e?.message || "Unknown error"}`);
    }
  };

  // Build blob when template/data change
  useEffect(() => {
    if (!templateAB) return;
    try {
      const out = buildDocxBlob(templateAB, data);
      setBlob(out);
      setErrors([]);
      setError("");
      onReadyBlob && onReadyBlob(out);
    } catch (e) {
      console.error(e);
      const list = e?.properties?.errors || [];
      setErrors(
        list.map((er) => ({
          id: er?.properties?.id || er.name,
          message: er.message,
          xtag: er?.properties?.xtag,
          file: er?.properties?.file,
        }))
      );
      setError(list.length ? "Template errors found. See details below." : e?.message || "Template render failed.");
      setBlob(null);
    }
  }, [templateAB, data, onReadyBlob]);

  // Render preview whenever blob changes
  useEffect(() => {
    const doPreview = async () => {
      if (!previewRef.current) return;
      previewRef.current.innerHTML = "";
      if (!blob) return;
      try {
        setIsRendering(true);
        await renderAsync(blob, previewRef.current, null, { className: "docx", inWrapper: true });
      } catch (e) {
        console.error(e);
        setError("Preview failed. The document may still download correctly.");
      } finally {
        setIsRendering(false);
      }
    };
    doPreview();
  }, [blob]);

  // When payload changes: pick template, compute data, and ensure template is loaded
  useEffect(() => {
    if (!payload) return;
    const key = pickTemplate(payload); // "donation" or "lending"
    setTemplateKey(key);
    setData(toDocxData(payload));
    ensureTemplateLoaded(key);
  }, [payload]);

  const editableKeys = useMemo(() => {
    const set = new Set(docFields);
    ALWAYS_EDITABLE_KEYS.forEach((k) => set.add(k));
    return Array.from(set);
  }, [docFields]);

  const nonDateDocFields = useMemo(() => {
    const skip = new Set([...DATE_ALIASES.start, ...DATE_ALIASES.end, "total"]);
    return editableKeys.filter((k) => !skip.has(k));
  }, [editableKeys]);

  useEffect(() => {
    if (!showModal) return;
    const values = {};
    nonDateDocFields.forEach((key) => {
      values[key] = data[key] ?? "";
    });
    if (templateKey === "lending") {
      values.start_raw = onlyDate(data.start_raw || "");
      values.end_raw = onlyDate(data.end_raw || "");
    }
    setFormValues(values);
  }, [showModal, nonDateDocFields, data, templateKey]);

  const handleInputChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const applyOverrides = () => {
    setData((prev) => {
      let next = { ...prev, ...formValues };
      if (templateKey === "lending") {
        const s = onlyDate(next.start_raw || prev.start_raw || "");
        const e = onlyDate(next.end_raw || prev.end_raw || "");
        next.start_raw = s;
        next.end_raw = e;
        next.start = fmtDate(s);
        next.end = fmtDate(e);
        next.total = diffHuman(s, e);
        next.start_date = next.start;
        next.end_date = next.end;
        next.duration_from = next.start;
        next.duration_to = next.end;
      }
      return next;
    });
    setShowModal(false);
  };

  const fileNameMemo = useMemo(
    () => buildFileName({ templateKey, payload, data }),
    [templateKey, payload, data]
  );

  const download = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileNameMemo}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // nice labels
  const overridelabel = {
    start: "Start period of lending duration",
    end: "End period of lending duration",
    total: "Lending duration",
    name: "Complete Name",
    province: "Province",
    barangay: "Barangay",
    // Barangay: "Barangay",
    // baranagay: "Barangay",
    // Baranagay: "Barangay",
    // brgy: "Barangay",
    // Brgy: "Barangay",
    city: "City",
    email: "Email",
    artifact: "Artifact",
    // artifact_description: "Artifact Description",
    // acquisition_details: "Acquisition Details",
    // artifact_id: "Artifact ID",
  };

const logActivePayload = () => {
  const activePayload = {
    ids: {
      contribution_id: payload?.contribution_id,
      contributor_id: payload?.contributor_id,
      artifact_id: payload?.ContributionArtifact?.artifact_id,
    },
    mergedData: data,
  };
  console.log(JSON.stringify(activePayload, null, 2));
};


  return (
    <div>
      <div className="w-fit h-fit bg-white flex flex-col mb-4 ">
        <ViewPort
          title="Memorandum Of Agreement"
          sizes={{
            "2xl": { width: 530, height: 490 },
            "3xl": { width: 550, height: 945 },
          }}
        >
          <div className="rounded-xl h-[140rem] w-[85rem] border bg-white shadow-inner overflow-auto">
            {(error || (errors && errors.length > 0)) && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                {error}
                {errors?.length > 0 && (
                  <ul className="mt-2 list-disc pl-5">
                    {errors.map((e, i) => (
                      <li key={i}>
                        <span className="font-semibold">{e.id}:</span> {e.message}{" "}
                        {e.file && <span className="opacity-70">in {e.file}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div ref={previewRef} style={{ all: "unset" }} />
            {isRendering && <p className="text-sm text-gray-500 ">Rendering preview…</p>}
            {!blob && !error && <p className="text-sm text-gray-500">Waiting for payload and template to render…</p>}
          </div>
        </ViewPort>
      </div>

      {/* Override Modal (vanilla) */}
      <div
        className={`${showModal ? "absolute inset-0 z-10 flex items-center justify-center" : "hidden"} w-full h-full`}
        // onClick={() => setShowModal(false)}
      >
        <div
          className="w-fit p-5 h-fit border bg-white rounded-md shadow"
        >
          <div className="space-y-3 w-[40rem]  overflow-y-auto pr-2">
            {/* Always render date controls for Lending */}
            {templateKey === "lending" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">start</label>
                    <input
                      type="date"
                      value={onlyDate(formValues.start_raw || data.start_raw || "")}
                      onChange={(e) => handleInputChange("start_raw", onlyDate(e.target.value))}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">end</label>
                    <input
                      type="date"
                      value={onlyDate(formValues.end_raw || data.end_raw || "")}
                      onChange={(e) => handleInputChange("end_raw", onlyDate(e.target.value))}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600">total</label>
                  <input
                    type="text"
                    readOnly
                    value={diffHuman(
                      onlyDate(formValues.start_raw || data.start_raw || ""),
                      onlyDate(formValues.end_raw || data.end_raw || "")
                    )}
                    className="rounded-lg border px-3 py-1.5 text-sm bg-gray-50"
                  />
                </div>
              </>
            )}

            {/* Fields: union of detected placeholders + ALWAYS_EDITABLE_KEYS */}
            {nonDateDocFields.map((key) => {
              const isLongText =
                key === "lend_conditions" ||
                key === "lend_liabilities" ||
                key === "lending_reason" ||
                key === "artifact_description" ||
                key === "acquisition_details";

              if (isLongText) {
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">{overridelabel[key] ?? key}</label>
                    <textarea
                      value={formValues[key] ?? ""}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                      rows={3}
                    />
                  </div>
                );
              }

              return (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600">{overridelabel[key] ?? key}</label>
                  <input
                    type="text"
                    value={formValues[key] ?? ""}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="rounded-lg border px-3 py-1.5 text-sm"
                  />
                  
                </div>
              );
            })}

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md border">
                Cancel
              </button>
              <button onClick={applyOverrides} className="px-4 py-2 rounded-md bg-blue-600 text-white shadow">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 ">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-sm bg-blue-600 text-white px-4 py-2 shadow hover:shadow-md"
        >
          Override
        </button>
        <button
          onClick={download}
          disabled={!blob}
          className="rounded-sm bg-black text-white px-4 py-2 shadow hover:shadow-md disabled:opacity-50"
        >
          Download DOCX
        </button>
          <button
    onClick={logActivePayload}
    className="rounded-sm bg-gray-700 text-white px-4 py-2 shadow hover:shadow-md"
  >
    Log JSON
  </button>
      </div>
    </div>
  );
};

export default MoaBuilder;
