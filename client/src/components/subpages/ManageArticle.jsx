import { useEffect, useState, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { EditorContent } from "@tiptap/react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImageIcon,
  ColumnsIcon,
  TypeIcon,
  XIcon,
} from "lucide-react";
import axios from "axios";
import Button from "../buttons/artclbtn";
import { useParams } from "react-router-dom";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import {ColumnBlock,Column,} from "../../components/articleComponents/ColumBlock";
import axiosClient from "../../lib/axiosClient";




import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
// import { HardBreak } from '@tiptap/extension-hard-break';

import FontSize from "../../lib/axiosClient"


const ArticleEditorForm = () => {


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
    const [isEditing, setIsEditing] = useState(false);
    // Form state
      const [title, setTitle] = useState("");
      const [author, setAuthor] = useState("");
      const [category, setCategory] = useState("");
      const [address, setAddress] = useState("");
      const [selectedDate, setSelectedDate] = useState("");
      const [thumbnail, setThumbnail] = useState(null);
      const [previewImage, setPreviewImage] = useState(null);
      const Categories = ["Article", "Education", "Exhibit", "Contests", "Other"]; // changed from 'Contents'
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
      const [articles, setArticles] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [editingArticleId, setEditingArticleId] = useState(null);


      const { encoded } = useParams();

// const articleId = useMemo(() => {
//   try {
//     return encoded ? atob(encoded) : null;
//   } catch (err) {
//     console.error("Invalid base64 ID:", encoded);
//     return null;
//   }
// }, [encoded]);


let articleId = null;

try {
  if (encoded) {
    const decoded = atob(encoded);       // e.g. "123 Some Title"
    articleId = decoded.split(" ")[0];   // extract just the ID
  }
} catch (err) {
  console.error("Invalid base64 ID:", encoded);
}
      const [article, setArticle] = useState(null);



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
        response = await axiosClient.put(
          `/auth/article/${articleId}`,
          formData
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
    // Handle new thumbnail in <input type="file" />
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setPreviewImage(URL.createObjectURL(file));
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
    setArticle(null);
   
  };
    const [contentImages, setContentImages] = useState([]);
    const [barangay, setBarangay] = useState(""); // <-- Add this line

  const imageInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);



  useEffect(() => {
    
  if (articleId) {
    const fetchArticle = async () => {
      try {
        const response = await axiosClient.get(`/auth/articles/${articleId}`);

        const data = response.data;
        setArticle(data);
        setIsEditing(true);
        setEditingArticleId(data.article_id);

        // Set form fields
        setTitle(data.title || "");
        setAuthor(data.author || "");
        setCategory(data.article_category || "");
        setAddress(data.address || "");
        setSelectedDate(data.upload_date || "");
        setBarangay(data.barangay || "");

        if (data.upload_date) {
      const date = new Date(data.upload_date);
      const formattedDate = date.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
    } else {
      setSelectedDate("");
    }

    if (editor && data.description) {
      editor.commands.setContent(data.description);
    }
       
        if (data.images) {
          setPreviewImage(`${UPLOAD_PATH}${data.images}`);
        }
      } catch (err) {
        console.error("Failed to fetch article:", err);
      }
    };

    fetchArticle();
  }
}, [articleId, editor]); 

useEffect(() => {
  if (!encoded) {
    resetForm(); 
  }
}, [encoded]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/auth/articles`);
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


  

 
  
  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // First validate the form
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      // If there are errors, show them
      setErrors(newErrors);
    } else {
      // If form is valid, show confirm dialog
      setShowSubmitConfirm(true);
    }
  };


  // State for tracking the "dirty" state of form
  const [isDirty, setIsDirty] = useState(false);

  // State for confirmation dialogs
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // State for validation
  const [errors, setErrors] = useState({});


  // State for removing or replacing the current thumbnail
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  // Track if a thumbnail is present
  const [hasThumbnail, setHasThumbnail] = useState(
    !!thumbnail || !!previewImage
  );

  // Update hasThumbnail when thumbnail changes
  useEffect(() => {
    setHasThumbnail(!!thumbnail || !!previewImage);
  }, [thumbnail, previewImage]);

  // Reset errors when clicking on fields with errors
  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Reset form and error states when modal is closed
  useEffect(() => {
    setErrors({});
    setIsDirty(false);
  }, []);

  // Available font sizes for the dropdown
  const fontSizes = [
    { label: "Small", value: "0.75em" }, // ~14px if 1em = 16px
    { label: "Normal", value: "1em" }, // Default (16px)
    { label: "Medium", value: "1.25em" }, // 20px
    { label: "Large", value: "1.5em" }, // 24px
    { label: "XL", value: "1.75em" }, // 28px
    { label: "2XL", value: "2em" }, // 32px
  ];

  // For uploading inline images from the editor
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("contentImages", file);

      const response = await axios.post(
        `${BASE_URL}/auth/article/content-images`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (
        response.data &&
        response.data.images &&
        response.data.images.length > 0
      ) {
        const uploadedFilename = response.data.images[0];
        const fullImageUrl = `${BASE_URL}/uploads/pictures/${uploadedFilename}`;

        // Insert <img> into Tiptap
        if (editor) {
          editor
            .chain()
            .focus()
            .setImage({ src: fullImageUrl, alt: file.name })
            .run();
        }

        // Store the filename if needed
        setContentImages((prev) => [...prev, uploadedFilename]);

        // Mark form as dirty since we added content
        setIsDirty(true);
      }
    } catch (err) {
      console.error("Error uploading content image:", err);
      alert("Failed to upload image");
    }
  };

  // Apply selected font size to the editor
  const handleFontSizeChange = (e) => {
    const fontSize = e.target.value;
    editor?.chain().focus().setFontSize(fontSize).run();
  };

  // Handle removing the thumbnail
  const handleRemoveThumbnail = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset file input
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }

    // Set state to indicate thumbnail should be removed
    setRemoveThumbnail(true);
    setHasThumbnail(false);
    setIsDirty(true);
  };

  // Custom thumbnail change handler that wraps the original handler
  const handleCustomThumbnailChange = (e) => {
    // If we previously removed a thumbnail, reset that flag
    if (removeThumbnail) {
      setRemoveThumbnail(false);
    }

    // Call the original handler
    handleThumbnailChange(e);

    // Update hasThumbnail based on if a file was selected
    setHasThumbnail(!!e.target.files && e.target.files.length > 0);

    // Mark form as dirty if a file was selected
    if (e.target.files && e.target.files.length > 0) {
      setIsDirty(true);
    }
  };

  // Validate the form fields
  const validateForm = () => {
    const newErrors = {};

    // Check required fields
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!author.trim()) {
      newErrors.author = "Author is required";
    }
    if (!category) {
      newErrors.category = "Category is required";
    }
    if (!address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!selectedDate) {
      newErrors.selectedDate = "Date is required";
    }

    // Check editor content
    if (!editor?.getHTML() || editor.getHTML() === "<p></p>") {
      newErrors.description = "Body content is required";
    }

    return newErrors;
  };

  // Handle cancel button click
  const handleCancelClick = () => {
    // If form is dirty (has changes), show confirmation
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      // If no changes, just close the modal
      resetForm();
    }
  };


  // Add this helper function inside your ArticleModal component
  const setListClass = (className) => {
    setTimeout(() => {
      document.querySelectorAll(".ProseMirror ol").forEach((ol) => {
        ol.classList.remove("circle-number-list", "roman-list", "letter-list");
        if (className) ol.classList.add(className);
      });
    }, 10);
  };


  return (
    <>
    <div className="flex w-full h-full gap-4 pt-5 border-t-1">
        {/* LEFT SPACER */}
        <div className="hidden 2xl:block 2xl:w-1/5" />
        {/* LEFT SIDE - Editor + Form */}
        <div
          className="
              bg-white
              w-full
              2xl:w-2/5
              p-6
              rounded-lg
              shadow-xl
              relative
              max-h-[90vh]
              overflow-auto
              transition-all
              duration-300
            "
        >
          <button
            onClick={handleCancelClick}
            className="absolute top-3 right-3 text-2xl text-gray-600 hover:text-black"
          >
            &times;
          </button>

          <h2 className="text-3xl font-bold mb-6">Header</h2>

    <form onSubmit={handleSubmit} className="space-y-6">
  {/* Title */}
  <input
    className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 placeholder-gray-500 ${
      errors.title ? "border-red-600" : "border-black"
    }`}
    type="text"
    value={title}
    onChange={(e) => {
      setTitle(e.target.value);
      setIsDirty(true);
      clearFieldError("title");
    }}
    onClick={() => clearFieldError("title")}
    placeholder={`Title${errors.title ? " *" : ""}`}
  />

  {/* Date, Author, Category */}
  <div className="flex flex-col md:flex-row gap-4">
    <input
      className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
        errors.selectedDate ? "border-red-600" : "border-black"
      }`}
      type="date"
      value={selectedDate}
      onChange={(e) => {
        setSelectedDate(e.target.value);
        setIsDirty(true);
        clearFieldError("selectedDate");
      }}
    />
    <input
      className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 placeholder-gray-500 ${
        errors.author ? "border-red-600" : "border-black"
      }`}
      type="text"
      value={author}
      onChange={(e) => {
        setAuthor(e.target.value);
        setIsDirty(true);
        clearFieldError("author");
      }}
      placeholder={`Author${errors.author ? " *" : ""}`}
    />
    <select
      className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
        errors.category ? "border-red-600" : "border-black"
      }`}
      value={category}
      onChange={(e) => {
        setCategory(e.target.value);
        setIsDirty(true);
        clearFieldError("category");
      }}
    >
      <option value="" disabled={category !== ""}>
        {`Category${errors.category ? " *" : ""}`}
      </option>
      {Categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  </div>

  {/* Barangay, Municipality */}
  <div className="flex flex-col md:flex-row gap-4">
    <input
      className="w-full px-4 py-3 border-2 border-black rounded-2xl text-base md:text-lg outline-none placeholder-gray-500"
      type="text"
      value={barangay}
      onChange={(e) => {
        setBarangay(e.target.value);
        setIsDirty(true);
      }}
      placeholder="Barangay"
    />
    <select
      className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
        errors.address ? "border-red-600" : "border-black"
      }`}
      value={address}
      onChange={(e) => {
        setAddress(e.target.value);
        setIsDirty(true);
        clearFieldError("address");
      }}
    >
      <option value="" disabled={address !== ""}>
        {`Municipality${errors.address ? " *" : ""}`}
      </option>
      {Municipalities.map((mun) => (
        <option key={mun} value={mun}>
          {mun}
        </option>
      ))}
    </select>
  </div>

  {/* Thumbnail */}
  <div className="relative">
    <input
      ref={thumbnailInputRef}
      className="w-full px-4 py-3 border-2 border-black rounded-2xl text-base md:text-lg outline-none file:hidden"
      type="file"
      name="thumbnail"
      onChange={handleCustomThumbnailChange}
      style={{ color: "transparent" }}
    />
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-700 truncate max-w-[75%]">
      {removeThumbnail || (!thumbnail && !previewImage)
        ? "No Image selected"
        : previewImage && typeof previewImage === "string"
        ? previewImage.split("/").pop()
        : thumbnail && thumbnail.name}
    </div>
    {previewImage && !removeThumbnail && (
      <button
        type="button"
        onClick={handleRemoveThumbnail}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800"
      >
        <XIcon size={15} strokeWidth={3} />
      </button>
    )}
  </div>

  {/* Rich Text Editor */}
  <div className="space-y-2">
    <label className={`font-bold ${errors.description ? "text-red-600" : ""}`}>
      Body {errors.description && "*"}
    </label>

    {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-[#d6c2ad] rounded border border-black-400">
                    {/* Headings */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={(evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            editor?.chain().focus().toggleHeading({ level }).run();
                            setIsDirty(true);
                          }}
                          className={`text-sm px-2 py-1 border rounded-sm ${
                            editor?.isActive("heading", { level }) ? "bg-white" : ""
                          }`}
                        >
                          H{level}
                        </button>
                      ))}
                    </div>
    
                    <div className="border-l h-6 mx-2" />
    
                    {/* Font Size */}
                    <div className="flex items-center gap-1">
                      <TypeIcon size={16} className="text-gray-600" />
                      <select
                        onChange={handleFontSizeChange}
                        className="px-1 py-1 border rounded text-sm"
                        defaultValue="1em"
                      >
                        {fontSizes.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                      {/* Highlight (moved here) */}
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor?.chain().focus().toggleHighlight().run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive("highlight") ? "bg-white" : ""
                        }`}
                        title="Highlight"
                      >
                        <i className="fas fa-highlighter" />
                      </button>
                    </div>
    
                    <div className="border-l h-6 mx-2" />
    
                    {/* Bold, Underline, Italic */}
                    <div className="flex gap-1 ml-2">
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor?.chain().focus().toggleBold().run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive("bold") ? "bg-white" : ""
                        }`}
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor?.chain().focus().toggleUnderline().run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive("underline") ? "bg-white" : ""
                        }`}
                      >
                        <UnderlineIcon size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor?.chain().focus().toggleItalic().run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive("italic") ? "bg-white" : ""
                        }`}
                      >
                        <Italic size={16} />
                      </button>
                    </div>
    
                    <div className="border-l h-6 mx-2" />
    
                    {/* Alignment */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor?.chain().focus().setTextAlign("left").run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive({ textAlign: "left" }) ? "bg-white" : ""
                        }`}
                      >
                        <AlignLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor?.chain().focus().setTextAlign("center").run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive({ textAlign: "center" })
                            ? "bg-white"
                            : ""
                        }`}
                      >
                        <AlignCenter size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor?.chain().focus().setTextAlign("right").run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive({ textAlign: "right" }) ? "bg-white" : ""
                        }`}
                      >
                        <AlignRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor?.chain().focus().setTextAlign("justify").run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive({ textAlign: "justify" })
                            ? "bg-white"
                            : ""
                        }`}
                      >
                        <AlignJustify size={16} />
                      </button>
                    </div>
    
                    <div className="border-l h-6 mx-2" />
    
                    {/* Two Column / Three Column */}
                    <div className="flex gap-1">
                      {/* Two Column */}
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor
                            .chain()
                            .focus()
                            .insertContent({
                              type: "columnBlock",
                              content: [
                                {
                                  type: "column",
                                  content: [{ type: "paragraph" }],
                                },
                                {
                                  type: "column",
                                  content: [{ type: "paragraph" }],
                                },
                              ],
                            })
                            .run();
                        }}
                        className="p-1 border rounded"
                        title="Insert Two Column Layout"
                      >
                        <ColumnsIcon size={16} />
                      </button>
                      {/* Three Column (custom box with 3 columns) */}
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          editor
                            .chain()
                            .focus()
                            .insertContent({
                              type: "columnBlock",
                              content: [
                                {
                                  type: "column",
                                  content: [{ type: "paragraph" }],
                                },
                                {
                                  type: "column",
                                  content: [{ type: "paragraph" }],
                                },
                                {
                                  type: "column",
                                  content: [{ type: "paragraph" }],
                                },
                              ],
                            })
                            .run();
                        }}
                        className="p-1 border rounded flex items-center justify-center"
                        title="Insert Three Column Layout"
                      >
                        {/* Custom SVG for 3 columns */}
                        <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                          <rect
                            x="1"
                            y="2"
                            width="4"
                            height="12"
                            rx="1"
                            fill="#555"
                          />
                          <rect
                            x="7"
                            y="2"
                            width="4"
                            height="12"
                            rx="1"
                            fill="#555"
                          />
                          <rect
                            x="13"
                            y="2"
                            width="4"
                            height="12"
                            rx="1"
                            fill="#555"
                          />
                        </svg>
                      </button>
                    </div>
    
                    {/* Divider before list buttons */}
                    <div className="border-l h-6 mx-2" />
    
                    {/* List Buttons */}
                    <div className="flex gap-1">
                      {/* Bullet List */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          editor?.chain().focus().toggleBulletList().run();
                          setIsDirty(true);
                        }}
                        className={`p-1 border rounded ${
                          editor?.isActive("bulletList") ? "bg-white" : ""
                        }`}
                        title="Bullet List"
                      >
                        <i className="fas fa-list-ul" />
                      </button>
                    </div>
    
                    {/* Divider before image/youtube/highlight */}
                    <div className="border-l h-6 mx-2" />
    
                    {/* Insert Image / YouTube / Highlight */}
                    <div className="flex gap-1">
                      {/* Insert Image */}
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          imageInputRef.current?.click();
                        }}
                        className="p-1 border rounded"
                        title="Insert Image"
                      >
                        <ImageIcon size={16} />
                      </button>
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
    
                      {/* YouTube Embed */}
                      <button
                        type="button"
                        onClick={async (evt) => {
                          evt.preventDefault();
                          evt.stopPropagation();
                          const url = prompt("Enter YouTube URL");
                          if (url) {
                            editor
                              ?.chain()
                              .focus()
                              .setYoutubeVideo({ src: url })
                              .run();
                            setIsDirty(true);
                          }
                        }}
                        className="p-1 border rounded"
                        title="Embed YouTube Video"
                      >
                        <i className="fab fa-youtube" />
                      </button>
                    </div>
                  </div>

    {/* Editor area */}
                  <div
                    className="
                          border rounded p-4 min-h-[21.5rem] max-h-[21.5rem] 
                          sm:min-h-[24rem] sm:max-h-[24rem] 
                          md:min-h-[36.5rem] md:max-h-[36.5rem] 
                          lg:min-h-[36.5rem] lg:max-h-[36.5rem] 
                          xl:min-h-[36.6rem] xl:max-h-[36.6rem] 
                          2xl:min-h-[37rem] 2xl:max-h-[37rem] 
                          overflow-auto prose focus:outline-none
                          [&_.youtube-video]:!w-full [&_.youtube-video]:!max-w-[400px] [&_.youtube-video]:!mx-auto
                        "
                    tabIndex={0}
                    onClick={() => editor?.commands.focus()}
                  >
                    <EditorContent editor={editor} />
                  </div>
                </div>

  {/* Buttons */}
  <div className="flex justify-between">
    <Button
      type="button"
      onClick={handleCancelClick}
      className="bg-gray-500 hover:bg-gray-600"
    >
      Cancel
    </Button>
    <Button type="submit" className="mt-4">
      {isEditing ? "Save Changes" : "Submit Article"}
    </Button>
  </div>
  
</form>
</div>
{/* RIGHT SIDE - Article Preview */}
        <div
          className="
              bg-white
              w-full
              2xl:w-2/5
              p-6
              rounded-lg
              shadow-xl
              overflow-y-auto
              max-h-[90vh]
              mt-4
              2xl:mt-0
              hidden
              lg:block
            "
        >
          <h3 className="text-2xl font-bold mb-4">Preview</h3>
          <div className="border border-gray-200 p-4 mb-4 rounded">
            <h1 className="text-center text-3xl font-bold">
              {title || "Title of the News or Event"}
            </h1>
          </div>

          <div className="flex w-full justify-center mb-6">
            <div className="flex w-full items-center justify-center text-center text-base">
              <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
                <h4 className="text-lg font-medium">Date</h4>
                <p
                  className={`text-sm ${
                    !selectedDate ? "text-gray-500 italic" : ""
                  }`}
                >
                  {selectedDate
                    ? new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "[month dd, yyyy]"}
                </p>
              </span>
              <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
                <h4 className="text-lg font-medium">Author</h4>
                <p
                  className={`text-sm ${!author ? "text-gray-500 italic" : ""}`}
                >
                  {author || "[Name of the Author]"}
                </p>
              </span>
              <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
                <h4 className="text-lg font-medium">Address</h4>
                <p
                  className={`text-sm ${
                    !address && !barangay ? "text-gray-500 italic" : ""
                  }`}
                >
                  {barangay ? `${barangay}, ` : ""}
                  {address || "[Location]"}
                </p>
              </span>
              <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
                <h4 className="text-lg font-medium">Category</h4>
                <p
                  className={`text-sm ${
                    !category ? "text-gray-500 italic" : ""
                  }`}
                >
                  {category || "[placeholder]"}
                </p>
              </span>
            </div>
          </div>

          <div className="border border-gray-200 p-4 rounded min-h-[300px] font-[Hina Mincho]">
            {previewImage && !removeThumbnail ? (
              <div className="flex justify-center mb-4">
                <img
                  src={previewImage}
                  alt="Article thumbnail"
                  className="max-h-64 object-contain"
                />
              </div>
            ) : null}
            <div
              className="
                prose max-w-none
                min-h-[18rem] max-h-[24rem]
                sm:min-h-[22rem] sm:max-h-[28rem]
                md:min-h-[26rem] md:max-h-[32rem]
                lg:min-h-[30rem] lg:max-h-[30rem]
                xl:min-h-[32rem] xl:max-h-[32rem]
                2xl:min-h-[34rem] 2xl:max-h-[34rem]
                overflow-y-auto
                relative
                break-words
                "
            >
              {editor?.getHTML() ? (
                <div
                  className="editor-content-preview"
                  dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                />
              ) : (
                <p className="text-gray-400 italic">
                  Article content will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
        {/* RIGHT SPACER */}
<div className="hidden 2xl:block 2xl:w-1/5" />
      </div>
      </>
  );
};


export default ArticleEditorForm;