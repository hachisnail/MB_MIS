import React, { useState, useEffect } from "react";
// import AdminNav from '../../components/navbar/AdminNav';
import { NavLink } from "react-router-dom";
import axios from "axios";
import { useEditor } from "@tiptap/react";
// import CustomDatePicker from '../../features/CustomDatePicker';
import TimelineDatePicker from "../../features/TimelineDatePicker";
import { SearchBar, CardDropdownPicker } from "../../features/Utilities";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import {
  ColumnBlock,
  Column,
} from "../../components/articleComponents/ColumBlock";

import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
// import { HardBreak } from '@tiptap/extension-hard-break';

import { useNavigate } from "react-router-dom";
import Articleslist from "../../components/list/Articleslist";


const Categories = ["Article", "Education", "Exhibit", "Contests", "Other"]; // changed from 'Contents'



import FontSize from "../../components/articleComponents/FontSize";

const ArticleForm = () => {
  const navigate = useNavigate();
  // Form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  // const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [contentImages, setContentImages] = useState([]);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [barangay, setBarangay] = useState(""); // <-- Add this line
  // Articles and filters
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");

  // Example categories
  // Municipality list (copied from Content.jsx)
  const Municipalities = [
    "Basud",
    "Capalonga",
    "Daet",
    "Jose Panganiban",
    "Labo",
    "Mercedes",
    "Paracale",
    "San Lorenzo Ruiz",
    "San Vicente",
    "Santa Elena",
    "Talisay",
    "Vinzons",
  ];
  const token = localStorage.getItem("token");
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, ""); // "http://localhost:5000"
  const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`;

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TextStyle,
      Image,
      ColumnBlock,
      Column,
      FontSize,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Start writing your article...",
      }),
      Highlight,
      Youtube,
      // HardBreak.configure({
      //   HTMLAttributes: {
      //     class: 'hard-break',
      //   },
      // }),
    ],
    content: "",
    editable: true,
    editorProps: {
      handleKeyDown(view, event) {
        // ...custom logic...
      },
    },
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/auth/articles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      // Ensure response.data is always an array
      setArticles(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(
        "Failed to load articles. Check that the API server is running."
      );
      setArticles([]); // <-- Always reset to empty array on error
      setLoading(false);
    }
  };

  // Handle new or updated article submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("article_category", category);
    formData.append("description", editor?.getHTML() || "");
    formData.append("user_id", 1);
    formData.append("author", author);
    formData.append("address", address);
    formData.append("selectedDate", selectedDate);
    formData.append("content_images", JSON.stringify(contentImages));
    formData.append("barangay", barangay); // <-- Add this line

    if (thumbnail && thumbnail instanceof File) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      let response;
      if (isEditing) {
        // Update existing
        response = await axios.put(
          `${BASE_URL}/auth/article/${editingArticleId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );
        console.log("Article updated successfully!", response.data);
      } else {
        // Create new
        response = await axios.post(`${BASE_URL}/auth/article`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        console.log("Article created successfully!", response.data);
      }

      resetForm();
      fetchArticles();
    } catch (err) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} article:`,
        err.response?.data || err.message
      );
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setCategory("");
    setAddress("");
    setSelectedDate("");
    setThumbnail(null);
    setPreviewImage(null);
    setContentImages([]);
    setBarangay("");
    editor?.commands.setContent("");
    // setShowModal(false);
    setIsEditing(false);
    setEditingArticleId(null);
    setIsArtifactModalOpen(false);
  };

  // Handle editing article (click on table row)
  // const handleRowClick = (article) => {
  //   setIsEditing(true);
  //   setEditingArticleId(article.article_id);
  //   setTitle(article.title || "");
  //   setAuthor(article.author || "");
  //   setCategory(article.article_category || "");
  //   setAddress(article.address || "");
  //   setBarangay(article.barangay || ""); // <-- Set barangay from article

  //   if (article.upload_date) {
  //     const date = new Date(article.upload_date);
  //     const formattedDate = date.toISOString().split("T")[0];
  //     setSelectedDate(formattedDate);
  //   } else {
  //     setSelectedDate("");
  //   }

  //   if (editor && article.description) {
  //     editor.commands.setContent(article.description);
  //   }

  //   if (article.images) {
  //     const imageUrl = `${UPLOAD_PATH}${article.images}`;
  //     setPreviewImage(imageUrl);
  //     setThumbnail(article.images);
  //   } else {
  //     setPreviewImage(null);
  //     setThumbnail(null);
  //   }

  //   if (article.content_images) {
  //     try {
  //       const parsedImages = JSON.parse(article.content_images);
  //       if (Array.isArray(parsedImages)) {
  //         setContentImages(parsedImages);
  //       } else {
  //         setContentImages([]);
  //       }
  //     } catch {
  //       setContentImages([]);
  //     }
  //   } else {
  //     setContentImages([]);
  //   }

  //   // setShowModal(true);
  //   // setIsArtifactModalOpen(true);
  //   navigate("/admin/article/add-article", {
  //     state: {
  //       article,
  //       isEditing: true,
  //       editor,
  //       setTitle,
  //       setAuthor,
  //       setCategory,
  //       setAddress,
  //       setSelectedDate,
  //       setThumbnail,
  //       setPreviewImage,
  //       setContentImages,
  //       setBarangay,
  //     },
  //   });
  // };

  // Handle new thumbnail in <input type="file" />
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Filter the articles by searchTerm, category, and status
  const filteredArticles = articles.filter((article) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      article.title?.toLowerCase().includes(term) ||
      article.author?.toLowerCase().includes(term) ||
      article.article_category?.toLowerCase().includes(term);

    const matchesCategory =
      !selectedCategoryFilter ||
      article.article_category === selectedCategoryFilter;

    const matchesStatus =
      !selectedStatusFilter || article.status === selectedStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const postedCount = articles.filter(
    (article) => article.status === "posted"
  ).length;
  const pendingCount = articles.filter(
    (article) => article.status === "pending"
  ).length;
  const totalCount = articles.length;

  const handleStatusChange = async (articleId, newStatus) => {
    try {
      await axios.put(
        `${BASE_URL}/auth/article/${articleId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      setArticles((prev) =>
        prev.map((a) =>
          a.article_id === articleId ? { ...a, status: newStatus } : a
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Unable to update article status.");
    }
  };

  const getStatusBadge = (status) => {
    let color = "";
    let bg = "";
    let label = "";
    switch (status) {
      case "posted":
        color = "text-green-700";
        bg = "bg-green-100";
        label = "Posted";
        break;
      case "pending":
        color = "text-yellow-700";
        bg = "bg-yellow-100";
        label = "Pending";
        break;
      default:
        color = "text-gray-700";
        bg = "bg-gray-200";
        label = status;
    }
    return (
      <span
        className={`px-3 py-1 rounded-full font-semibold text-base ${color} ${bg}`}
      >
        {label}
      </span>
    );
  };

  const encodedProfile = localStorage.getItem("userProfile");
  let userRole = "";
  if (encodedProfile) {
    try {
      const profile = JSON.parse(atob(encodedProfile));
      userRole = profile.role;
    } catch (e) {
      userRole = "";
    }
  }

  const actionOptions = [
    { label: "Pending", value: "pending" },
    { label: "Posted", value: "posted" },
    { label: "Rejected", value: "rejected" },
    { label: "Archived", value: "archived" },
  ];

  const [selectedAction, setSelectedAction] = useState("");

  const CatOptions = [
    { label: "Article", value: "pending" },
    { label: "Education", value: "posted" },
    { label: "Exhibit", value: "rejected" },
    { label: "Contests", value: "archived" },
    { label: "Other", value: "other" },
  ];

  const [selectedCat, setSelectedCat] = useState("");

  return (
    
    <>
     <div className="w-full min-w-fit h-full pt-5 max-w-[137rem] 1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-w-[175rem] 3xl:max-h-[88rem]">
      <div className="w-full h-full flex flex-col gap-y-[2rem]">
        <div className="w-full h-full flex flex-col xl:flex-row gap-y-5 xl:gap-x-5 pt-5 border-t-1">
          {/* Left: Info and Add */}
          <div className="min-w-[34rem] h-full flex flex-col gap-y-7">
            <div className="w-full max-w-[35rem] text-gray-500 min-h-[5rem] flex py-2 gap-x-2">
              <button className="px-4 h-full border-1 border-black text-white bg-black rounded-lg">
                <span className="text-2xl font-semibold">Articles</span>
              </button>
            </div>

            <div className="w-full h-full flex flex-col gap-y-[5rem]">
              <div className="bg-[#161616] px-4 h-[5rem] flex justify-between items-center rounded-sm">
                <span className="text-2xl text-white font-semibold">Articles</span>
                <div className="w-[6rem] h-[3rem] bg-[#D4DBFF] flex items-center justify-center rounded-md">
                  <span className="text-2xl text-black font-semibold">{totalCount || 0}</span>
                </div>
              </div>

              <div className="w-full h-auto flex flex-col gap-y-7">
                <span className="text-2xl font-semibold text-[#727272]">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </span>

                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Posted</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{postedCount || 0}</span>
                  </div>
                </div>

                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Pending</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{pendingCount || 0}</span>
                  </div>
                </div>

                <NavLink to="add-article">
                  <button
                    onClick={resetForm}
                    className="cursor-pointer flex items-center justify-between w-full px-6 py-4 bg-[#6BFFD5] text-black font-medium"
                  >
                    
                    <span className="text-2xl font-semibold">Add New Article</span>
                    <span className="border-2 border-black rounded-full p-2 flex items-center justify-center">
                      <i className="fas fa-plus text-xl"></i>
                    </span>
                  </button>
                </NavLink>
              </div>
            </div>
          </div>

          {/* Right: Filters and List */}
          <div className="w-full h-full flex flex-col gap-y-7">
            <div className="w-full py-2 flex flex-wrap items-center gap-x-2 min-w-[20rem] sm:min-w-[28rem] md:min-w-[32rem] lg:min-w-[38rem] xl:min-w-[40rem]">
              <TimelineDatePicker onDateChange={setFilterDate} theme="light" />
              <SearchBar theme="light" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <CardDropdownPicker value={selectedCat} onChange={setSelectedCat} placeholder="Categories" theme="light" options={CatOptions} />
              <CardDropdownPicker value={selectedAction} onChange={setSelectedAction} placeholder="Filter by action" theme="light" options={actionOptions} />
            </div>

            <div className="bg-[#F0F0F0] min-w-[60rem] w-full font-semibold grid grid-cols-5 justify-between mb-7">
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Date</div>
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Title</div>
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Author</div>
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Category</div>
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Status</div>
            </div>

            <div className="w-full min-w-[60rem] overflow-y-auto h-full border-t-1 border-t-gray-400" style={{ maxHeight: "45rem" }}>
              {loading ? (
                <div className="min-w-[60rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                  <div className="text-2xl text-gray-500 flex flex-col items-center">
                    <i className="fas fa-inbox text-5xl mb-4"></i>
                    <p>Loading articles...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="min-w-[60rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                  <div className="text-2xl text-red-500 flex flex-col items-center">
                    <i className="fas fa-exclamation-circle text-5xl mb-4"></i>
                    <p>{error}</p>
                    <button
                      onClick={fetchArticles}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <Articleslist
                    key={article.article_id}
                    article={article}
                    // handleRowClick={handleRowClick}
                    handleStatusChange={handleStatusChange}
                    userRole={userRole}
                    getStatusBadge={getStatusBadge}
                  />
                ))
              ) : (
                <div className="min-w-[60rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                  <div className="text-2xl text-gray-500 flex flex-col items-center">
                    <i className="fas fa-inbox text-5xl mb-4"></i>
                    <p>No article found</p>
                    <p className="text-lg mt-2">Try adjusting your filters or search criteria</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ArticleForm;
