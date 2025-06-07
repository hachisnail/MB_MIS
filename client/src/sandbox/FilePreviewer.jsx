import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const icons = {
  image: (
    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11l2 2 4-4 5 5" />
    </svg>
  ),
  text: (
    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
    </svg>
  ),
  archive: (
    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6" />
    </svg>
  ),
  unknown: (
    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
    </svg>
  ),
};

const FilePreviewer = () => {
  const { category, filename } = useParams();
  const [fileType, setFileType] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!category || !filename) {
      setError("Missing category or filename.");
      return;
    }

    const ext = filename.split(".").pop().toLowerCase();
    const url = `/assets/${category}/${filename}`;

    setFileType(ext);
    setFileUrl(url);

    if (["txt", "json", "js", "html", "css"].includes(ext)) {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("File not found or failed to load");
          return res.text();
        })
        .then(setFileContent)
        .catch(() => setFileContent("⚠️ Error loading text content."));
    }
  }, [category, filename]);

  const renderPreview = () => {
    if (error) return <p className="text-red-500">{error}</p>;

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)) {
      return <img src={fileUrl} alt={filename} className="max-h-[80vh] mx-auto rounded" />;
    }

    if (["pdf"].includes(fileType)) {
      return <iframe src={fileUrl} title="PDF Preview" className="w-full h-[80vh] border rounded" />;
    }

    if (["txt", "json", "js", "html", "css"].includes(fileType)) {
      return (
        <pre className="bg-gray-100 text-sm p-4 rounded overflow-auto max-h-[80vh] whitespace-pre-wrap">
          {fileContent}
        </pre>
      );
    }

    if (["doc", "docx", "xls", "xlsx"].includes(fileType)) {
      return (
        <div className="text-center text-sm">
          Cannot preview {fileType.toUpperCase()} files directly.{" "}
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            Download or open in supported software
          </a>
        </div>
      );
    }

    if (["zip", "rar", "7z"].includes(fileType)) {
      return (
        <div className="text-center text-sm text-gray-600">
          🔒 Archive preview not supported.{" "}
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

  const fileIcon =
    ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType)
      ? icons.image
      : ["txt", "json", "js", "html", "css", "pdf", "doc", "docx", "xls", "xlsx"].includes(fileType)
      ? icons.text
      : ["zip", "rar", "7z"].includes(fileType)
      ? icons.archive
      : icons.unknown;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        {fileIcon}
        <h1 className="text-xl font-semibold break-all">{filename}</h1>
      </div>
      {renderPreview()}
    </div>
  );
};

export default FilePreviewer;
