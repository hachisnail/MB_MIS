import React, { useState, useEffect } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import axiosClient from "../lib/axiosClient";
import TooltipButton from "../components/buttons/TooltipButton";
import ContextMenu from "../components/modals/ContextMenu";

const FileUploadDownload = () => {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("uncategorized");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [categoryFiles, setCategoryFiles] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchFiles = async () => {
    try {
      const res = await axiosClient.get("/list");
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
      const res = await axiosClient.post("/upload", formData, {
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

  const handlePreview = (category, filename) => {
    const encoded = btoa(`${category}/${filename}`);
    navigate(`/admin/preview/${encoded}`);
  };

  const handleDownload = (category, filename) => {
    const downloadUrl = `http://localhost:5000/api/download/${category}/${filename}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Add more actions if you want, e.g., delete, rename
  const handleDelete = async (category, filename) => {
    if (!window.confirm(`Delete file "${filename}"?`)) return;
    try {
      await axiosClient.delete(`/delete/${category}/${filename}`);
      alert("File deleted");
      fetchFiles();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="w-full p-5 h-[69rem] ">
      <form onSubmit={handleUpload} className="mb-4 space-y-2">
        {/* <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2"
          required
        >
          <option value="uncategorized">Uncategorized</option>
          {categoryFiles.map((cat) => (
            <option key={cat.category} value={cat.category}>
              {cat.category}
            </option>
          ))}
        </select> */}
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

      {categoryFiles.length === 0 && <p>No files available.</p>}

      {categoryFiles.map((categoryData) => (
        <div key={categoryData.category} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {categoryData.category}
          </h3>
          <div className="flex flex-wrap gap-4">
            {categoryData.files.length === 0 && (
              <p className="text-sm text-gray-500">
                No files in this category.
              </p>
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
                    className="w-10 h-10 text-yellow-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L13 1.586A2 2 0 0011.586 1H4zm8 0v4a1 1 0 001 1h4v9H4V5h8z" />
                  </svg>
                );
              } else if (ext === "pdf") {
                bgColor = "bg-red-100";
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16c0 1.104.896 2 2 2h12a2 2 0 002-2V8l-6-6zM13 9V3.5L18.5 9H13zM8 13v-2h1.5a1.5 1.5 0 010 3H9v1H8v-2zm3.5-2H13a.5.5 0 110 1h-1v1h1a.5.5 0 110 1h-1.5v-3zm3.5 0h1a1 1 0 011 1v2a1 1 0 01-1 1h-1v-4z" />
                  </svg>
                );
              } else if (["zip", "rar", "7z"].includes(ext)) {
                bgColor = "bg-green-100";
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M4 12h16M4 8h16M4 4h16"
                    />
                  </svg>
                );
              } else if (["doc", "docx"].includes(ext)) {
                bgColor = "bg-blue-100";
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 4h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"
                    />
                    <text x="8" y="16" className="text-xs fill-current">
                      DOC
                    </text>
                  </svg>
                );
              } else if (["xls", "xlsx"].includes(ext)) {
                bgColor = "bg-lime-100";
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-lime-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16l4-4m0 0l4-4m-4 4l4 4m-4-4l-4-4"
                    />
                  </svg>
                );
              } else if (["js", "json", "html", "css", "txt"].includes(ext)) {
                bgColor = "bg-indigo-100";
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16l-2-2m0 0l2-2m-2 2h8"
                    />
                  </svg>
                );
              } else {
                bgColor = "bg-gray-100";
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                );
              }

              const menuItems = [
                {
                  label: "Preview",
                  onClick: () =>
                    handlePreview(categoryData.category, file.filename),
                },
                {
                  label: "Download",
                  onClick: () =>
                    handleDownload(categoryData.category, file.filename),
                },
                {
                  label: "Delete",
                  onClick: () =>
                    handleDelete(categoryData.category, file.filename),
                },
              ];

              return (
                <ContextMenu key={file.filename} menuItems={menuItems}>
                  <div
                    className={`${bgColor} p-3 rounded cursor-pointer w-[7rem] select-none relative flex flex-col justify-between`}
                    title={file.filename}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {icon}
                    </div>
                    <p className="text-sm truncate mb-1">{file.filename}</p>
                  </div>
                </ContextMenu>
              );
            })}
          </div>
        </div>
      ))}
      <div className="w-fit h-fit flex gap-x-5">
        <NavLink to="modal">
          <TooltipButton
            buttonText="Modals Samples"
            tooltipText="Click to open modals usage demo"
          />
        </NavLink>
        <NavLink to="router-flag">
          <TooltipButton
            buttonText="Router Flags"
            tooltipText="This will disable pages on the website likely to controll content displayed"
          />
        </NavLink>
      </div>
    </div>
  );
};

export default FileUploadDownload;
