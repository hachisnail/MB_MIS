// // FileUploadDownload.jsx
// import { useState, useEffect } from "react";
// import { useNavigate, NavLink } from "react-router-dom";
// import axiosClient from "../lib/axiosClient";
// import TooltipButton from "../components/buttons/TooltipButton";
// import { handlePreview } from "../components/list/commons";
// import {
//   ContextMenu,
//   ContextMenuContent,
//   ContextMenuItem,
//   ContextMenuTrigger,
// } from "@/components/ui/context-menu"; // shadcn/ui context menu

// import ContextMenu from "../components/modals/ContextMenu";

// // 🔹 Upload form component
// const FileUploadForm = ({ onUpload }) => {
//   const [file, setFile] = useState(null);
//   const [category, setCategory] = useState("uncategorized");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!file) {
//       alert("Please select a file first.");
//       return;
//     }
//     onUpload(file, category);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="mb-4 space-y-2">
//       <input
//         type="file"
//         onChange={(e) => setFile(e.target.files[0])}
//         className="border p-2"
//       />
//       <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
//         Upload
//       </button>
//     </form>
//   );
// };

// // 🔹 Single file card with context menu
// const FileCard = ({ file, category, navigate, onDownload, onDelete }) => {
//   const ext = file.filename.split(".").pop().toLowerCase();

//   let icon = null;
//   let bgColor = "bg-gray-100";

//   if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
//     bgColor = "bg-yellow-100";
//     icon = <span className="text-yellow-600 text-4xl">🖼️</span>;
//   } else if (ext === "pdf") {
//     bgColor = "bg-red-100";
//     icon = <span className="text-red-600 text-4xl">📕</span>;
//   } else if (["zip", "rar", "7z"].includes(ext)) {
//     bgColor = "bg-green-100";
//     icon = <span className="text-green-600 text-4xl">📦</span>;
//   } else if (["doc", "docx"].includes(ext)) {
//     bgColor = "bg-blue-100";
//     icon = <span className="text-blue-600 text-4xl">📄</span>;
//   } else if (["xls", "xlsx"].includes(ext)) {
//     bgColor = "bg-lime-100";
//     icon = <span className="text-lime-600 text-4xl">📊</span>;
//   } else if (["js", "json", "html", "css", "txt"].includes(ext)) {
//     bgColor = "bg-indigo-100";
//     icon = <span className="text-indigo-600 text-4xl">💻</span>;
//   } else {
//     icon = <span className="text-gray-600 text-4xl">📁</span>;
//   }

//   return (
//     <ContextMenu>
//       <ContextMenuTrigger>
//         <div
//           className={`${bgColor} p-3 rounded cursor-pointer w-full min-h-[8rem] select-none flex flex-col justify-between items-center shadow-sm`}
//           title={file.filename}
//         >
//           <div className="flex items-center justify-center mb-1">{icon}</div>
//           <p className="text-sm truncate text-center">{file.filename}</p>
//         </div>
//       </ContextMenuTrigger>
//       <ContextMenuContent className="w-40">
//         <ContextMenuItem
//           inset
//           onClick={() => handlePreview(navigate, category, file.filename)}
//         >
//           Preview
//         </ContextMenuItem>
//         <ContextMenuItem inset onClick={() => onDownload(category, file.filename)}>
//           Download
//         </ContextMenuItem>
//         <ContextMenuItem
//           inset
//           className="text-red-600 focus:text-red-700"
//           onClick={() => onDelete(category, file.filename)}
//         >
//           Delete
//         </ContextMenuItem>
//       </ContextMenuContent>
//     </ContextMenu>
//   );
// };

// // 🔹 File category section (grid rendering instead of single line)
// const FileCategorySection = ({ categoryData, navigate, onDownload, onDelete }) => (
//   <div className="mb-6">
//     <h3 className="text-lg font-semibold mb-2">{categoryData.category}</h3>

//     {categoryData.files.length === 0 && (
//       <p className="text-sm text-gray-500">No files in this category.</p>
//     )}

//     <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-4">
//       {categoryData.files.map((file) => (
//         <FileCard
//           key={file.filename}
//           file={file}
//           category={categoryData.category}
//           navigate={navigate}
//           onDownload={onDownload}
//           onDelete={onDelete}
//         />
//       ))}
//     </div>
//   </div>
// );

// // 🔹 Main component
// const FileUploadDownload = () => {
//   const [categoryFiles, setCategoryFiles] = useState([]);
//   const [uploadedFile, setUploadedFile] = useState(null);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const fetchFiles = async () => {
//     try {
//       const res = await axiosClient.get("/list");
//       setCategoryFiles(res.data.categories);
//       setError("");
//     } catch {
//       setError("Failed to load files");
//       setCategoryFiles([]);
//     }
//   };

//   useEffect(() => {
//     fetchFiles();
//   }, []);

//   const handleUpload = async (file, category) => {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("category", category);

//     try {
//       const res = await axiosClient.post("/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setUploadedFile(res.data);
//       setError("");
//       alert("Upload successful!");
//       fetchFiles();
//     } catch (err) {
//       setError("Upload failed: " + (err.response?.data?.message || ""));
//     }
//   };

//   const handleDownload = (category, filename) => {
//     const downloadUrl = `http://localhost:5000/api/download/${category}/${filename}`;
//     const a = document.createElement("a");
//     a.href = downloadUrl;
//     a.setAttribute("download", filename);
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//   };

//   const handleDelete = async (category, filename) => {
//     if (!window.confirm(`Delete file "${filename}"?`)) return;
//     try {
//       await axiosClient.delete(`/delete/${category}/${filename}`);
//       alert("File deleted");
//       fetchFiles();
//     } catch {
//       alert("Delete failed");
//     }
//   };

//   return (
//     <div className="w-full p-5 h-[69rem]">
//       {/* Upload Form */}
//       <FileUploadForm onUpload={handleUpload} />

//       {uploadedFile && <p>Uploaded: {uploadedFile.filename}</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {categoryFiles.length === 0 && <p>No files available.</p>}

//       {/* Categories */}
//       {categoryFiles.map((cat) => (
//         <FileCategorySection
//           key={cat.category}
//           categoryData={cat}
//           navigate={navigate}
//           onDownload={handleDownload}
//           onDelete={handleDelete}
//         />
//       ))}

//       {/* Nav buttons */}
//       <div className="w-fit h-fit flex gap-x-5">
//         <NavLink to="modal">
//           <TooltipButton
//             buttonText="Modals Samples"
//             tooltipText="Click to open modals usage demo"
//           />
//         </NavLink>
//         <NavLink to="router-flag">
//           <TooltipButton
//             buttonText="Router Flags"
//             tooltipText="This will disable pages on the website likely to controll content displayed"
//           />
//         </NavLink>
//         <NavLink to="table-forms">
//           <TooltipButton
//             buttonText="Table Forms"
//             tooltipText="Tables and forms expirements for rendering it using a library"
//           />
//         </NavLink>
//       </div>
//     </div>
//   );
// };

// export default FileUploadDownload;
import React from 'react'
import { NavLink } from 'react-router-dom'

 function FileUploadDownload  ()  {

  return (
    <div className='w-full h-full border flex flex-col'>
      <span>Sandbox Links</span>
      <NavLink to="/admin/dashboard" className="px-2 py-1 bg-gray-500 w-fit rounded-md text-white">back </NavLink>
    </div>
  )
}

export default FileUploadDownload
