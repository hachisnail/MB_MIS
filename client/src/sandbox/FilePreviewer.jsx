import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { renderAsync } from "docx-preview";
import * as XLSX from "xlsx";
import StyledButton from "../components/buttons/StyledButton";
import TooltipButton from "../components/buttons/TooltipButton";

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

const FilePreviewer = () => {
  const { encoded } = useParams();
  const [fileType, setFileType] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [fileContent, setFileContent] = useState(""); // for text
  const [excelData, setExcelData] = useState([]); // for Excel
  const docxContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!encoded) {
      setError("Missing encoded path.");
      return;
    }

    try {
      const decodedPath = atob(encoded);
      const segments = decodedPath.split("/");
      const category = segments[0];
      const file = segments.slice(1).join("/");

      const ext = file.split(".").pop().toLowerCase();
      const url = `${
        import.meta.env.VITE_SERVER_URL
      }/uploads/${category}/${encodeURIComponent(file)}`;

      setFilename(file);
      setFileUrl(url);
      setFileType(ext);
      setFileContent("");
      setExcelData([]);

      if (["xlsx", "xls"].includes(ext)) {
        fetch(url)
          .then((res) => res.arrayBuffer())
          .then((data) => {
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            setExcelData(json);
          })
          .catch(() => setError("⚠️ Failed to load Excel file."));
      }

      if (["txt", "json", "js", "html", "css"].includes(ext)) {
        fetch(url)
          .then((res) => {
            if (!res.ok) throw new Error("File not found");
            return res.text();
          })
          .then(setFileContent)
          .catch(() => setFileContent("⚠️ Error loading text content."));
      }

      if (ext === "docx") {
        fetch(url)
          .then((res) => res.blob())
          .then((blob) => {
            if (docxContainerRef.current) {
              docxContainerRef.current.innerHTML = "";
              renderAsync(blob, docxContainerRef.current).catch(() => {
                setError("⚠️ Could not render DOCX!");
              });
            }
          });
      }
    } catch (err) {
      setError("Invalid file path.");
    }
  }, [encoded]);

  const renderPreview = () => {
    if (error) return <p className="text-red-500">{error}</p>;

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)) {
      return (
        <img
          src={fileUrl}
          alt={filename}
          className="h-[70rem] mx-auto rounded"
        />
      );
    }

    if (fileType === "pdf") {
      return (
        <iframe
          src={fileUrl}
          title="PDF Preview"
          className="w-full h-[70rem] border rounded"
        />
      );
    }

    if (fileType === "docx") {
      return (
        <div
          ref={docxContainerRef}
          className="prose h-[70rem] overflow-scroll max-w-full p-4 bg-white border rounded"
        />
      );
    }

    if (["txt", "json", "js", "html", "css"].includes(fileType)) {
      return (
        <pre className="bg-gray-100 text-sm p-4 rounded overflow-auto h-[71rem] whitespace-pre-wrap">
          {fileContent}
        </pre>
      );
    }

    if (["xlsx", "xls"].includes(fileType)) {
      return (
        <div className="overflow-auto h-[70rem] border rounded p-2 bg-white text-sm">
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
    }

    if (["zip", "rar", "7z"].includes(fileType)) {
      return (
        <div className="text-center text-sm text-gray-600">
          Archive preview not supported.{" "}
          <a href={fileUrl} className="text-blue-600 underline" download>
            Download file
          </a>
        </div>
      );
    }

    return (
      <div className="text-center text-red-500">
        {icons.unknown}
        <p className="mt-2">Unknown or unsupported file type.</p>
      </div>
    );
  };

  const fileIcon = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)
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
      ].includes(fileType)
    ? icons.text
    : ["zip", "rar", "7z"].includes(fileType)
    ? icons.archive
    : icons.unknown;

  return (
    <div className="w-full px-5 min-w-fit h-full py-2  1xl:max-h-[69rem] 2xl:max-h-[81rem]  3xl:max-h-[88rem]">
      <div className="flex items-center gap-3 mb-4 border-b pb-4">
        {fileIcon}
        <h1 className="text-2xl font-semibold break-all">{filename}</h1>

        <div className="ml-auto flex gap-2">
       
          {fileUrl && (
            <a href={fileUrl} download={filename}>
              <TooltipButton
                buttonText="Download"
                tooltipText="Click to download file/document."
                buttonColor="bg-[#6F3FFF]"
                hoverColor="hover:bg-blue-700"
                textColor="text-white"
                tooltipColor="bg-blue-800 text-white"
                className="w-fit"
              ></TooltipButton>
            </a>
          )}
             <StyledButton
            onClick={() => navigate(-1)}
          >
            Go Back
          </StyledButton>
        </div>
      </div>

      {renderPreview()}
    </div>
  );
};

export default FilePreviewer;
