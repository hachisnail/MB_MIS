import {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { renderAsync } from "docx-preview";
import ViewPort from "../../../../../features/Viewport";
import styles from "./DocxPreview.module.css";

import axiosClient from "../../../../../lib/axiosClient";

import {
  DEFAULT_TEMPLATES,
  ALWAYS_EDITABLE_KEYS,
  DATE_ALIASES,
  pickTemplate,
  toDocxData,
  buildFileName,
  buildDocxBlob,
  extractFieldsFromTemplate,
  onlyDate,
  fmtDate,
  diffHuman,
} from "./docxUtils";

const MoaBuilder = forwardRef(
  (
    {
      payload,
      templateUrls = DEFAULT_TEMPLATES,
      templateBuffers,
      onReadyBlob,
    },
    ref
  ) => {
    const [templateKey, setTemplateKey] = useState("donation");
    const [templateAB, setTemplateAB] = useState(null);

    const [data, setData] = useState({});
    const [dbContract, setDbContract] = useState({});
    const [reference, setReference] = useState("");

    const [blob, setBlob] = useState(null);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState([]);
    const [isRendering, setIsRendering] = useState(false);
    const previewRef = useRef(null);

    const [showModal, setShowModal] = useState(false);
    const [docFields, setDocFields] = useState([]);
    const [formValues, setFormValues] = useState({});
    const [draftValues, setDraftValues] = useState({});

    const isApproved = payload?.status === "approved";

    const fetchContract = async () => {
      try {
        const response = await axiosClient.get(
          `/auth/contract/${payload?.contribution_id}`
        );
        setDbContract(response.data);
      } catch (error) {
        console.error("Failed to fetch contract!");
      }
    };
    const setContractPayload = async (data) => {
      try {
        const response = await axiosClient.post("auth/set-contract", {
          contribution_id: data.contribution_id,
          type: data.type,
          fileName: data.fileName, // ✅ use whatever buildActivePayload decided
          mergedData: data.mergedData,
        });

        console.log("Contract saved:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error posting contract payload:", error);
        throw error;
      }
    };

    const ensureTemplateLoaded = async (key) => {
      setError("");
      try {
        let ab;
        if (templateBuffers?.[key]) {
          ab = templateBuffers[key];
        } else {
          const url = templateUrls?.[key];
          if (!url) throw new Error(`Missing template URL for key "${key}".`);
          const res = await fetch(url, {
            credentials: "include",
            headers: { "Cache-Control": "no-cache" },
          });
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

    const fileNameMemo = useMemo(
      () => buildFileName({ templateKey, payload, data }),
      [templateKey, payload, data]
    );

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
        setError(
          list.length
            ? "Template errors found. See details below."
            : e?.message || "Template render failed."
        );
        setBlob(null);
      }
    }, [templateAB, data, onReadyBlob]);

    useEffect(() => {
      let cancelled = false;
      let root;

      const waitForFonts = async () => {
        if (document.fonts && document.fonts.ready) {
          try {
            await document.fonts.ready;
          } catch {}
        }
      };

      const clampWideContent = (hostEl) => {
        const pages = hostEl.querySelectorAll(".page");
        pages.forEach((page) => {
          const pad = 24;
          const w = page.clientWidth ? page.clientWidth - pad : undefined;
          if (!w) return;
          page.querySelectorAll("img, table").forEach((el) => {
            el.style.maxWidth = `${w}px`;
          });
        });
      };

      const doPreview = async () => {
        if (!previewRef.current) return;
        previewRef.current.innerHTML = "";
        if (!blob) return;

        try {
          setIsRendering(true);
          setError(null);

          await waitForFonts();
          if (cancelled) return;

          root = document.createElement("div");
          root.className = styles.root;
          const host = document.createElement("div");
          host.className = "docx";
          root.appendChild(host);
          previewRef.current.appendChild(root);

          await renderAsync(blob, host, null, {
            className: "docx",
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
          });
          if (cancelled) return;

          clampWideContent(host);
        } catch (e) {
          if (!cancelled) {
            console.error(e);
            setError(
              "Preview failed. The document may still download correctly."
            );
          }
        } finally {
          if (!cancelled) setIsRendering(false);
        }
      };

      doPreview();

      return () => {
        cancelled = true;
        if (root && root.parentNode) root.parentNode.removeChild(root);
      };
    }, [blob]);

    // ---- Build payload helper (DRY) ----
    const buildActivePayload = useCallback(
      () => ({
        contribution_id: payload?.contribution_id || "N/A",
        type: payload?.contribution_type || "N/A",

        fileName: isApproved ? reference || "N/A" : fileNameMemo,
        mergedData: data || {},
      }),
      [
        payload?.contribution_id,
        payload?.contribution_type,
        isApproved,
        fileNameMemo,
        reference,
        data,
      ]
    );

    // ---- Imperative save for parent ----
    const saveContract = useCallback(async () => {
      if (!payload?.contribution_id) throw new Error("Missing contribution_id");
      const activePayload = buildActivePayload();
      return setContractPayload(activePayload);
    }, [payload?.contribution_id, buildActivePayload]);

    useImperativeHandle(ref, () => ({ saveContract }));


    useEffect(() => {
      if (!payload) return;
      const key = pickTemplate(payload);
      setTemplateKey(key);

      if (isApproved) {
        (async () => {
          await fetchContract();

          setDbContract((prev) => {
            if (!prev?.payload) return prev;

            const payloadData =
              typeof prev.payload === "string"
                ? JSON.parse(prev.payload)
                : prev.payload;

            setData(payloadData?.mergedData || {});
            setReference(payloadData?.fileName || "");
            return prev;
          });
        })();
      } else {
        setData(toDocxData(payload));
      }

      ensureTemplateLoaded(key);
    }, [payload, isApproved]);

    const editableKeys = useMemo(() => {
      const set = new Set(docFields);
      ALWAYS_EDITABLE_KEYS.forEach((k) => set.add(k));
      return Array.from(set);
    }, [docFields]);

    const nonDateDocFields = useMemo(() => {
      const skip = new Set([
        ...DATE_ALIASES.start,
        ...DATE_ALIASES.end,
        "total",
      ]);
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
      setDraftValues(values);
    }, [showModal, nonDateDocFields, data, templateKey]);

    const applyOverrides = () => {
      setFormValues(draftValues);

      setData((prev) => {
        let next = { ...prev, ...draftValues };
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

    const download = () => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isApproved
        ? reference || "N/A" // ✅ reuse DB filename after approval
        : fileNameMemo; // ✅ generate filename before approval
      a.click();
      URL.revokeObjectURL(url);
    };

    const overridelabel = {
      name: "Complete Name",
      province: "Province",
      barangay: "Barangay",
      city: "Municipality/City",
      email: "Email",
      artifact: "Artifact",
    };

    const logActivePayload = () => {
      if (!payload) {
        console.warn("No payload found!");
        return;
      }

      const activePayload = buildActivePayload();
      console.log("Active Payload:", JSON.stringify(activePayload, null, 2));

      setContractPayload(activePayload);
    };

    const handleDraftChange = (key, value) => {
      setDraftValues((prev) => ({ ...prev, [key]: value }));
    };

    return (
      <div>
        <div className="w-fit h-fit bg-white flex flex-col mb-4 ">
          <ViewPort
            title="Memorandum Of Agreement"
            width={200}
            height={490}
            sizes={{
              lg: { width: 300, height: 490 },
              "2xl": { width: 530, height: 513 },
              "3xl": { width: 550, height: 945 },
            }}
          >
            <div className="rounded-xl h-[134.5rem] w-[81.7rem] border bg-white shadow-inner overflow-auto">
              {(error || (errors && errors.length > 0)) && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                  {error}
                  {errors?.length > 0 && (
                    <ul className="mt-2 list-disc pl-5">
                      {errors.map((e, i) => (
                        <li key={i}>
                          <span className="font-semibold">{e.id}:</span>{" "}
                          {e.message}{" "}
                          {e.file && (
                            <span className="opacity-70">in {e.file}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div ref={previewRef} style={{ all: "unset" }} />
              {isRendering && (
                <p className="text-sm text-gray-500 ">Rendering preview…</p>
              )}
              {!blob && !error && (
                <p className="text-sm text-gray-500">
                  Waiting for payload and template to render…
                </p>
              )}
            </div>
          </ViewPort>
        </div>

        {/* Override Modal (with draftValues) */}
        <div
          className={`${
            showModal
              ? "absolute inset-0 z-10 flex items-center justify-center"
              : "hidden"
          } w-full h-full`}
        >
          <div className="w-fit p-5 h-fit border bg-white rounded-md shadow">
            <div className="space-y-3 w-[40rem] overflow-y-auto pr-2">
              {/* Always render date controls for Lending */}
              {templateKey === "lending" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">
                        Start period of lending duration
                      </label>
                      <input
                        type="date"
                        value={draftValues.start_raw || ""}
                        onChange={(e) =>
                          handleDraftChange(
                            "start_raw",
                            onlyDate(e.target.value)
                          )
                        }
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">
                        End period of lending duration
                      </label>
                      <input
                        type="date"
                        value={draftValues.end_raw || ""}
                        onChange={(e) =>
                          handleDraftChange("end_raw", onlyDate(e.target.value))
                        }
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">
                      Lending duration
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={diffHuman(
                        onlyDate(draftValues.start_raw || ""),
                        onlyDate(draftValues.end_raw || "")
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
                      <label className="text-sm font-medium text-gray-600">
                        {overridelabel[key] ?? key}
                      </label>
                      <textarea
                        value={draftValues[key] ?? ""}
                        onChange={(e) => handleDraftChange(key, e.target.value)}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                        rows={3}
                      />
                    </div>
                  );
                }

                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">
                      {overridelabel[key] ?? key}
                    </label>
                    <input
                      type="text"
                      value={draftValues[key] ?? ""}
                      onChange={(e) => handleDraftChange(key, e.target.value)}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    />
                  </div>
                );
              })}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md border"
                >
                  Cancel
                </button>
                <button
                  onClick={applyOverrides}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white shadow"
                >
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
  }
);

export default MoaBuilder;
