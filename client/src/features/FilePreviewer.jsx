import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { renderAsync } from "docx-preview";
import * as XLSX from "xlsx";
import StyledButton from "@/components/buttons/StyledButton";
import TooltipButton from "@/components/buttons/TooltipButton";

const icons = {
  image: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 text-yellow-600"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14h18zM5 5h14v11l-4-4-3 3-5-5-2 2V5z" />
    </svg>
  ),
  text: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4z"
      />
    </svg>
  ),
  archive: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l1.664 12.305A2 2 0 006.651 22h10.698a2 2 0 001.987-1.695L21 8M5 8h14l-1.5 12h-11L5 8zm4 0V4h6v4"
      />
    </svg>
  ),
  unknown: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 text-red-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.054 0 1.62-1.14.984-2L13.684 4.58a1.25 1.25 0 00-2.368 0L4.094 17c-.636.86-.07 2 0 2z"
      />
    </svg>
  ),
};

// Minimal CSS so we don't depend on docx-preview's stylesheet
const DOCX_CSS = `
  .docx { background:#fff; color:#111; line-height:1.6; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, "Apple Color Emoji", "Segoe UI Emoji"; }
  .docx * { box-sizing:border-box; }
  .docx a { text-decoration: underline; }
  .docx p { margin: 0 0 0.75rem 0; }
  .docx h1, .docx h2, .docx h3, .docx h4, .docx h5, .docx h6 { font-weight:600; margin:1rem 0 .5rem; line-height:1.25; }
  .docx h1 { font-size:2rem; }
  .docx h2 { font-size:1.5rem; }
  .docx h3 { font-size:1.25rem; }
  .docx h4 { font-size:1.125rem; }
  .docx h5 { font-size:1rem; }
  .docx h6 { font-size:.875rem; }
  .docx img { max-width:100%; height:auto; }
  .docx ul, .docx ol { padding-left:1.5rem; margin:0 0 0.75rem 0; }
  .docx table { width:100%; border-collapse:collapse; margin: .75rem 0; }
  .docx table td, .docx table th { border:1px solid #e5e7eb; padding:.5rem .625rem; vertical-align:top; }
  .docx blockquote { border-left:4px solid #e5e7eb; margin:.75rem 0; padding:.25rem .75rem; color:#374151; }
  .docx code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:.95em; }
`;

const FilePreviewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const docxContainerRef = useRef(null);

  const { fileUrl, filename, fileType } = location.state || {};

  const [fileContent, setFileContent] = useState("");
  const [excelData, setExcelData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [docxBuffer, setDocxBuffer] = useState(null);

  // normalize once to avoid casing issues
  const normalizedType = (fileType || "").toLowerCase();

  useEffect(() => {
    if (!fileUrl || !normalizedType) return;

    const controller = new AbortController();
    let isStale = false; // guards async setState after unmount or prop change

    const fetchFile = async () => {
      setLoading(true);
      setError("");
      setFileContent("");
      setExcelData([]);

      try {
        const res = await fetch(fileUrl, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Unauthorized or file not found");

        // Handle DOCX — fetch and store buffer, render in a separate effect when container is mounted
        if (normalizedType === "docx") {
          const blob = await res.blob();
          const arrayBuffer = await blob.arrayBuffer();
          if (!isStale) setDocxBuffer(arrayBuffer);
        }

        // Handle plain-text-ish files
        else if (["txt", "json", "js", "html", "css"].includes(normalizedType)) {
          const text = await res.text();
          if (!isStale) setFileContent(text);
        }

        // Handle Excel
        else if (["xlsx", "xls"].includes(normalizedType)) {
          const data = await res.arrayBuffer();
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (!isStale) setExcelData(json);
        }

        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        setError(err.message || "Failed to load file");
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      isStale = true;
      controller.abort();
    };
  }, [fileUrl, normalizedType]);

  // Render DOCX once: when we have the buffer AND the container is mounted
  useEffect(() => {
    let cancelled = false;
    const container = docxContainerRef.current;
    if (!docxBuffer || !container || normalizedType !== "docx") return;

    (async () => {
      try {
        container.innerHTML = "";
        await renderAsync(docxBuffer, container, undefined, {
          className: "docx",
          inWrapper: true,
          ignoreFonts: true,
          breakPages: false,
          useMathMLRenderer: true,
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to render DOCX");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [docxBuffer, normalizedType]);

  const renderPreview = () => {
    if (loading)
      return (
        <p className="text-gray-500 text-xl text-center py-10">Loading...</p>
      );
    if (error)
      return <p className="text-red-500 text-xl text-center py-10">{error}</p>;

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(normalizedType))
      return (
        <img
          src={fileUrl}
          alt={filename}
          className="h-[55.5rem] mx-auto rounded"
        />
      );

    if (normalizedType === "pdf")
      return (
        <iframe
          src={fileUrl}
          title="PDF Preview"
          className="w-full h-[55.5rem] border rounded"
        />
      );

    if (normalizedType === "docx")
      return (
        <div
          ref={docxContainerRef}
          className="prose prose-sm sm:prose lg:prose-lg max-w-full h-[55.5rem] overflow-auto p-4 bg-white border rounded"
          style={{ background: "white" }}
        />
      );

    if (["txt", "json", "js", "html", "css"].includes(normalizedType))
      return (
        <pre className="bg-gray-100 text-sm p-4 rounded overflow-auto h-[55.5rem] whitespace-pre-wrap">
          {fileContent}
        </pre>
      );

    if (["xlsx", "xls"].includes(normalizedType))
      return (
        <div className="overflow-auto h-[55.5rem] border rounded p-2 bg-white text-sm">
          <table className="w-full border-collapse">
            <tbody>
              {excelData.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1 whitespace-nowrap">
                      {cell ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    if (["zip", "rar", "7z"].includes(normalizedType))
      return (
        <div className="text-center text-sm text-gray-600">
          Archive preview not supported.{" "}
          <a href={fileUrl} className="text-blue-600 underline" download>
            Download file
          </a>
        </div>
      );

    return (
      <div className="text-center text-red-500">
        {icons.unknown}
        <p className="mt-2">Unknown or unsupported file type.</p>
      </div>
    );
  };

  const fileIcon = ["jpg", "jpeg", "png", "gif", "webp"].includes(normalizedType)
    ? icons.image
    : [
        "txt",
        "json",
        "js",
        "html",
        "css",
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
      ].includes(normalizedType)
    ? icons.text
    : ["zip", "rar", "7z"].includes(normalizedType)
    ? icons.archive
    : icons.unknown;

  return (
    <div className="w-full px-5 min-w-fit h-full py-5 1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
      {/* Inject minimal DOCX CSS so we don't import external stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: DOCX_CSS }} />

      <div className="flex items-center gap-3 mb-4 border-b pb-4">
        {fileIcon}
        <h1 className="text-2xl font-semibold break-all">{filename}</h1>
        <div className="ml-auto flex gap-2">
          {fileUrl && (
            <a href={fileUrl} download={filename}>
              <TooltipButton
                buttonText="Download"
                tooltipText="Click to download file/document."
                buttonColor="bg-blue-600"
                hoverColor="hover:bg-blue-700"
                textColor="text-white"
                tooltipColor="bg-blue-800 text-white"
                className="w-fit"
              />
            </a>
          )}
          <StyledButton onClick={() => navigate(-1)}>Go Back</StyledButton>
        </div>
      </div>

      {renderPreview()}
    </div>
  );
};

export default FilePreviewer;
