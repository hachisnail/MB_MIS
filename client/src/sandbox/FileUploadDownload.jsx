import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axiosClient from "../lib/axiosClient";
import TooltipButton from "../components/buttons/TooltipButton";
import ContextMenu from "../components/modals/ContextMenu";

const FileUploadDownload = () => {
  const [file, setFile] = useState(null);
  // const [category, setCategory] = useState("uncategorized");
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
    navigate(`preview/${category}/${filename}`);
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

      <NavLink to="modal">
        <TooltipButton
          buttonText="Modals Samples"
          tooltipText="Click to open modals usage demo"
        />
      </NavLink>
    </div>
  );
};

export default FileUploadDownload;
