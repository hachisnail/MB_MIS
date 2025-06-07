import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ContextMenu = ({ x, y, onPreview, onDownload, onClose }) => {
  // Optional: limit menu inside viewport
  const menuWidth = 140;
  const menuHeight = 80; // approx

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let posX = x;
  let posY = y;

  if (posX + menuWidth > windowWidth) posX = windowWidth - menuWidth - 10;
  if (posY + menuHeight > windowHeight) posY = windowHeight - menuHeight - 10;

  return ReactDOM.createPortal(
    <ul
      style={{
        position: "fixed",
        top: posY,
        left: posX,
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "8px 0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        zIndex: 1000,
        width: menuWidth,
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="text-gray-700"
    >
      <li
        onClick={() => {
          onPreview();
          onClose();
        }}
        className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
      >
        Preview
      </li>
      <li
        onClick={() => {
          onDownload();
          onClose();
        }}
        className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
      >
        Download
      </li>
    </ul>,
    document.body
  );
};

const FileUploadDownload = () => {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("uncategorized");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [categoryFiles, setCategoryFiles] = useState([]); // [{ category: "name", files: [] }]
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    file: null,
    category: null,
  });

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, file: null, category: null });
  };

  useEffect(() => {
    const handleClick = () => {
      closeContextMenu();
    };

    if (contextMenu.visible) {
      window.addEventListener("click", handleClick);
    }
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu.visible]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/list", {
        withCredentials: true,
      });
      // Expecting res.data.categories to be array of { category: string, files: array }
      setCategoryFiles(res.data.categories);
      setError("");
    } catch (err) {
      setError("Failed to load files");
      setCategoryFiles([]);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      const res = await axios.post(`http://localhost:5000/api/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedFile(res.data);
      setError("");
      alert("Upload successful!");
      fetchFiles();
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      setError("Upload failed: " + (err.response?.data?.message || ""));
    }
  };

  const handlePreview = () => {
    if (!contextMenu.file || !contextMenu.category) return;

    const ext = contextMenu.file.split(".").pop().toLowerCase();
    const previewable = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "pdf",
      "txt",
      "json",
      "js",
      "html",
      "css",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "zip",
      "rar",
      "7z",
    ];

    if (!previewable.includes(ext)) {
      alert("Preview not available for this file type.");
      return;
    }

    navigate(`preview/${contextMenu.category}/${contextMenu.file}`);
    closeContextMenu();
  };

  const handleDownload = () => {
    if (!contextMenu.file || !contextMenu.category) return;

    const downloadUrl = `http://localhost:5000/api/download/${contextMenu.category}/${contextMenu.file}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.setAttribute("download", contextMenu.file);
    document.body.appendChild(a);
    a.click();
    a.remove();
    closeContextMenu();
  };

  const onRightClickFile = (e, category, filename) => {
    e.preventDefault();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      file: filename,
      category: category,
    });
  };

  return (
    <div className="max-w-full max-h-full relative p-4">
      <form onSubmit={handleUpload} className="mb-4 space-y-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2"
          required
        >
          <option value="uncategorized">Uncategorized</option>
          {/* Populate categories from categoryFiles */}
          {categoryFiles.map((cat) => (
            <option key={cat.category} value={cat.category}>
              {cat.category}
            </option>
          ))}
        </select>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Upload
        </button>
      </form>

      {uploadedFile && (
        <div>
          <p>Uploaded: {uploadedFile.filename}</p>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {/* Render files grouped by categories */}
      {categoryFiles.length === 0 && <p>No files available.</p>}

      {categoryFiles.map((categoryData) => (
  <div key={categoryData.category} className="mb-6">
    <h3 className="text-lg font-semibold mb-2">{categoryData.category}</h3>
    <div className="flex flex-wrap gap-4">
      {categoryData.files.length === 0 && (
        <p className="text-sm text-gray-500">No files in this category.</p>
      )}
      {categoryData.files.map((file) => {
        const ext = file.filename.split(".").pop().toLowerCase();

        let icon = null;
        let bgColor = "bg-gray-100";

        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          bgColor = "bg-yellow-100";
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-20 h-20 text-yellow-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 14l2-2 3 3 4-4"
              />
            </svg>
          );
        } else if (ext === "pdf") {
          bgColor = "bg-red-100";
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-20 h-20 text-red-600"
            >
              <path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zM6 20V4h6v5h5v11H6z" />
              <path d="M9 12h6v2H9z" />
            </svg>
          );
        } else if (["zip", "rar", "7z"].includes(ext)) {
          bgColor = "bg-green-100";
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-20 h-20 text-green-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18M9 6h6M9 18h6"
              />
            </svg>
          );
        } else {
          bgColor = "bg-gray-100";
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-20 h-20 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h10v10H7z"
              />
            </svg>
          );
        }

        return (
          <div
            key={file.filename}
            onContextMenu={(e) =>
              onRightClickFile(e, categoryData.category, file.filename)
            }
            className={`${bgColor} p-3 rounded cursor-context-menu w-[7rem] h-fit break-words select-none relative`}
            title={file.filename}
          >
            <div className="flex items-center gap-2 mb-2">{icon}</div>
            <p className="text-sm truncate">{file.filename}</p>
          </div>
        );
      })}
    </div>
  </div>
))}


      {/* Context menu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default FileUploadDownload;
    