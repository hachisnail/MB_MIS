// /src/sandbox/ContractDocxBuilder.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { renderAsync } from "docx-preview"; // client-side DOCX -> HTML renderer

// Delimiter presets (use [[ ]] to avoid Word run-splitting issues)
const DELIMITER_PRESETS = [
  { label: "{{ }} (default)", start: "{{", end: "}}" },
  { label: "[[ ]] (Word-friendly)", start: "[[", end: "]]" },
  { label: "<< >>", start: "<<", end: ">>" },
];

// Debounce helper
const useDebouncedEffect = (effect, deps, delay = 400) => {
  useEffect(() => {
    const h = setTimeout(() => effect(), delay);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
};

// Safe escape for regex pieces (MDN pattern)
const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function ContractDocxBuilder() {
  const [templateFile, setTemplateFile] = useState(null);
  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [filledBlob, setFilledBlob] = useState(null);
  const [error, setError] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [errors, setErrors] = useState([]);
  const [delims, setDelims] = useState(DELIMITER_PRESETS[1]); // default [[ ]]
  const [jsonInput, setJsonInput] = useState("{}");

  const previewRef = useRef(null);

  // -------- Detect delimiters + fields (tolerant to run-splitting) --------
  const detectDelimitersAndFields = (zip) => {
    const readXml = (p) => (zip.file(p) ? zip.file(p).asText() : "");
    const docs = [
      readXml("word/document.xml"),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => readXml(`word/header${i}.xml`)),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => readXml(`word/footer${i}.xml`)),
    ].join("\\n");

    // Finder that allows XML/tags/entities between start and end
    const makeFinder = (start, end) => {
      const s = escapeRegExp(start);
      const e = escapeRegExp(end);
      // Capture up to 200 chars inside (adjust if you have very long tokens)
      const re = new RegExp(`${s}([\\s\\S]{0,200}?)${e}`, "g");
      const normalize = (x) =>
        (x || "")
          .replace(/<[^>]*>/g, "") // strip XML tags
          .replace(/&[^;]+;/g, " ") // strip entities
          .replace(/[^\w.-]+/g, "") // keep token chars only
          .trim();

      return () => {
        const set = new Set();
        let m;
        while ((m = re.exec(docs)) !== null) {
          const key = normalize(m[1]);
          if (key) set.add(key);
        }
        return Array.from(set);
      };
    };

    const curly = makeFinder("{{", "}}");
    const square = makeFinder("[[", "]]");
    const angle = makeFinder("<<", ">>");

    const options = [
      { preset: DELIMITER_PRESETS[0], fields: curly() },
      { preset: DELIMITER_PRESETS[1], fields: square() },
      { preset: DELIMITER_PRESETS[2], fields: angle() },
    ];

    // pick the delimiter with the most hits
    const best = options.sort((a, b) => b.fields.length - a.fields.length)[0];
    return best;
  };

  // -------- Upload template --------
  const onTemplateUpload = async (e) => {
    setError("");
    setErrors([]);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Please upload a .docx template file.");
      return;
    }
    try {
      const ab = await file.arrayBuffer();
      setTemplateFile(file);
      setTemplateBuffer(ab);

      const zip = new PizZip(ab);
      const detected = detectDelimitersAndFields(zip);
      if (!detected) {
        setFields([]);
        setFormData({});
        setJsonInput("{}");
        setError("Couldn't inspect template.");
        setFilledBlob(null);
        return;
      }

      setDelims(detected.preset);

      // If 0 fields (extreme run-splitting), don't block; user can paste JSON keys
      const discovered = (detected.fields || []).filter(Boolean);
      setFields(discovered);
      const seed = Object.fromEntries(discovered.map((k) => [k, ""]));
      setFormData(seed);
      setJsonInput(JSON.stringify(seed, null, 2));
      setFilledBlob(null);
    } catch (err) {
      console.error(err);
      setError("Couldn't read template. Make sure the DOCX isn't corrupted.");
    }
  };

  // -------- Data updates --------
  const updateField = (k, v) => {
    const updated = { ...formData, [k]: v };
    setFormData(updated);
    setJsonInput(JSON.stringify(updated, null, 2));
  };

  const loadSampleData = () => {
    const sample = {};
    for (const k of fields) {
      const lower = String(k).toLowerCase();
      if (lower.includes("name")) sample[k] = "Juan Dela Cruz";
      else if (lower.includes("address")) sample[k] = "Daet, Camarines Norte";
      else if (lower.includes("artifact")) sample[k] = "Bicolano Heritage oil painting";
      else if (lower.includes("date")) sample[k] = new Date().toISOString().slice(0, 10);
      else sample[k] = `Sample ${k}`;
    }
    setFormData(sample);
    setJsonInput(JSON.stringify(sample, null, 2));
  };

  // -------- Build + preview --------
  const buildDocx = async () => {
    if (!templateBuffer) return;
    try {
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: delims.start, end: delims.end },
      });
      doc.render(formData); // new API (no .setData)
      const blob = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      setFilledBlob(blob);
      setErrors([]);
    } catch (err) {
      console.error(err);
      const list = err?.properties?.errors || [];
      setErrors(
        list.map((e) => ({
          id: e?.properties?.id || e.name,
          message: e.message,
          xtag: e?.properties?.xtag,
          context: e?.properties?.context,
          file: e?.properties?.file,
        }))
      );
      setError(
        list.length
          ? "Template errors found. See details below."
          : err?.message || "Template render failed."
      );
    }
  };

  useDebouncedEffect(() => {
    buildDocx();
  }, [JSON.stringify(formData), templateBuffer, delims]);

  useEffect(() => {
    const doPreview = async () => {
      if (!previewRef.current) return;
      previewRef.current.innerHTML = "";
      if (!filledBlob) return;
      try {
        setIsRendering(true);
        await renderAsync(filledBlob, previewRef.current, null, {
          className: "docx",
          inWrapper: true,
        });
      } catch (e) {
        console.error(e);
        setError("Preview failed. The document may still download correctly.");
      } finally {
        setIsRendering(false);
      }
    };
    doPreview();
  }, [filledBlob]);

  const download = () => {
    if (!filledBlob) return;
    const url = URL.createObjectURL(filledBlob);
    const a = document.createElement("a");
    a.href = url;
    const base = templateFile?.name?.replace(/\.docx$/i, "") || "contract";
    a.download = `${base}-filled.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------- Form UI --------
  const form = useMemo(() => {
    if (!fields || !fields.length)
      return (
        <div className="text-sm text-gray-500">
          No fields detected. Upload a DOCX with placeholders like {"{{client_name}}"} or {"[[client_name]]"}.
        </div>
      );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((k) => (
          <label key={k} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">{String(k)}</span>
            <input
              className="rounded-xl border px-3 py-2 shadow-sm focus:outline-none focus:ring w-full"
              value={formData?.[k] ?? ""}
              onChange={(e) => updateField(k, e.target.value)}
              placeholder={`Enter ${k}`}
            />
          </label>
        ))}
      </div>
    );
  }, [fields, formData]);

  return (
    <div className="min-h-screen w-full p-4 md:p-8 bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Contract DOCX Builder</h1>
            <p className="text-sm text-gray-600">
              Upload a .docx template with placeholders like {`${delims.start}client_name${delims.end}`}, fill the fields, preview, then download — all in the browser.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input type="file" accept=".docx" onChange={onTemplateUpload} className="hidden" />
              <span className="rounded-2xl bg-white border px-4 py-2 shadow hover:shadow-md">
                {templateFile ? "Change template" : "Upload template (.docx)"}
              </span>
            </label>
            <select
              value={delims.label}
              onChange={(e) => {
                const next =
                  DELIMITER_PRESETS.find((d) => d.label === e.target.value) ||
                  DELIMITER_PRESETS[0];
                setDelims(next);
                if (templateFile) onTemplateUpload({ target: { files: [templateFile] } });
              }}
              className="rounded-2xl border bg-white px-3 py-2 shadow"
              title="Choose tag delimiters"
            >
              {DELIMITER_PRESETS.map((d) => (
                <option key={d.label} value={d.label}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {(error || (errors && errors.length)) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
            {errors && errors.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-sm">
                {errors.map((e, i) => (
                  <li key={i}>
                    <span className="font-medium">{e.id}:</span> {e.message}{" "}
                    {e.xtag && (
                      <>
                        <code>{e.xtag}</code>
                      </>
                    )}
                    {e.file && <span className="opacity-70"> in {e.file}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Fill contract fields</h2>
          <p className="text-xs text-gray-500 -mt-1">
            Detected delimiters: <code>{delims.start}</code>…<code>{delims.end}</code> ·{" "}
            {fields?.length || 0} field(s) found
          </p>
          {form}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSampleData}
              className="rounded-2xl border bg-white px-3 py-1.5 shadow hover:shadow-md"
              disabled={!fields.length}
            >
              Load sample data
            </button>
          </div>

          <h3 className="text-md font-semibold mt-4">Or paste JSON data</h3>
          <textarea
            className="w-full rounded-xl border p-3 font-mono text-sm"
            rows={6}
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData(parsed);
              } catch {
                // ignore parse errors until valid JSON
              }
            }}
          />
          <p className="text-xs text-gray-500">
            Provide key-value pairs matching your template placeholders.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Live preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => buildDocx()}
                  className="rounded-2xl border bg-white px-4 py-2 shadow hover:shadow-md"
                  disabled={!templateBuffer}
                >
                  Rebuild
                </button>
                <button
                  onClick={download}
                  className="rounded-2xl bg-black text-white px-4 py-2 shadow hover:shadow-md disabled:opacity-50"
                  disabled={!filledBlob}
                >
                  Download DOCX
                </button>
              </div>
            </div>
            <div className="rounded-xl border bg-white shadow-inner overflow-auto max-h-[70vh] p-4">
              <div ref={previewRef} className="docx-wrapper" />
              {isRendering && (
                <p className="text-sm text-gray-500 mt-2">Rendering preview…</p>
              )}
              {!filledBlob && (
                <p className="text-sm text-gray-500">
                  Upload a template and start typing to see the preview.
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-3">
            <h2 className="text-lg font-semibold">Template tips</h2>
            <div className="rounded-xl border bg-white p-4 text-sm space-y-2">
              <p>
                In your .docx, put placeholders like <code>{"[[client_name]]"}</code>,{" "}
                <code>{"[[client_address]]"}</code>,{" "}
                <code>{"[[artifact_name]]"}</code>. This tool auto-detects them and
                builds the form.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use plain text placeholders (no smart quotes).</li>
                <li>
                  Avoid putting tokens inside hyperlinks/shapes; keep them in
                  regular paragraphs.
                </li>
                <li>
                  If Word still splits tokens, consider switching to the{" "}
                  <strong>[[ ]]</strong> delimiters.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
