import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
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
  List,
  ListOrdered,
  Highlighter as HighlighterIcon,
  Video as VideoIcon
} from "lucide-react";

import axios from "axios";
import Button from "../../../../components/buttons/artclbtn";

import { useParams } from "react-router-dom";
import { useEditor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import { ColumnBlock, Column } from "../components/ColumBlock";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
// import { HardBreak } from '@tiptap/extension-hard-break';

import Dropcursor from '@tiptap/extension-dropcursor';

import ConfirmDialog from "@/components/modals/ConfirmDialog";
import FontSize from "../components/FontSize";
import CustomImage from "../components/CustomImage";
import StyledButton from "@/components/buttons/StyledButton";

import { useAuth } from "@/context/authContext";
import useAutosave, { loadDraft, clearDraft } from "@/features/ContentDrafting.jsx";
import usePrompt from '@/hooks/usePrompt';

const ArticleEditorForm = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
  const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`;
  const { user } = useAuth();
  const userRole = user.roleId;
  const allowedRoles = [1, 2, 5];
  const isViewer = userRole === 3;
  const isReviewer = userRole === 4;
  const hasRun = useRef(false);

  const navigate = useNavigate();

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
      Image.configure({
        draggable: true,
      }),
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
      Dropcursor.configure({
        color: 'blue',
        width: 2,
      }),
      CustomImage,
      // HardBreak.configure({
      //   HTMLAttributes: {
      //     class: 'hard-break',
      //   },
      // }),
    ],
    content: "",
    editable: !isReviewer,
    editorProps: {
      handleKeyDown(view, event) {
        // custom shortcuts...
      },
      handleDrop(view, event, slice, moved) {
        const hasFiles = event.dataTransfer?.files?.length;

        // CASE 1: Moving existing node inside editor
        if (moved) {
          return false;
        }

        // CASE 2: Dropping new files
        if (hasFiles) {
          const images = Array.from(event.dataTransfer.files).filter(file =>
            file.type.startsWith("image/")
          );

          if (images.length === 0) return false;

          images.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
              const url = reader.result;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: url })
                )
              );
            };
            reader.readAsDataURL(file);
          });

          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      setIsDirty(true);
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
  const Categories = ["Article", "Education", "Exhibit", "Contests", "Other"];
  const municipalitiesWithBarangays = {
    "Basud": ["Mampili", "Matnog", "San Felipe", "San Isidro", "Tuaca"],
    "Capalonga": ["Alayao", "Bayabas", "Del Pilar", "Itok", "Old Camp"],
    "Daet": ["Alawihao", "Awitan", "Bagasbas", "Borabod", "Camambugan", "Dogongan"],
    "San Lorenzo Ruiz": ["Daguit", "Langga", "Laniton", "Mampurog", "Matacong"],
    "Jose Panganiban": ["Bagong Bayan", "Calero", "Larap", "Plaridel", "Osmeña"],
    "Labo": ["Baay", "Bagacay", "Bagong Silang I", "Bakiad", "Talobatib"],
    "Mercedes": ["Apuao", "Caucauayan", "Colasi", "Hinipagan", "San Roque"],
    "Paracale": ["Bagumbayan", "Batobalani", "Calaburnay", "Capacuan", "Tugos"],
    "San Vicente": ["Asdum", "Cabanbanan", "Calabagas", "Fabrica", "Iraya Sur"],
    "Santa Elena": ["Basiad", "Bulala", "Maulawin", "Polungguitguit", "Rizal"],
    "Talisay": ["Binanuahan", "Calintaan", "Del Rosario", "San Isidro", "Tinago"],
    "Vinzons": ["Calangcawan Norte", "Candelaria", "Manmuntay", "Pinagtigasan", "Sula"],
  };
  const [status, setStatus] = useState("pending");
  const [uploadPeriodStart, setUploadPeriodStart] = useState("");
  const [uploadPeriodEnd, setUploadPeriodEnd] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [municipality, setMunicipality] = useState("");
  const [contentImages, setContentImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [barangay, setBarangay] = useState("");
  const imageInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [hasThumbnail, setHasThumbnail] = useState(!!thumbnail || !!previewImage);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const { encoded } = useParams();
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [uploadPeriodStartTime, setUploadPeriodStartTime] = useState("");
  const [uploadPeriodEndTime, setUploadPeriodEndTime] = useState("");

  // Draft prompt modal state
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState(null);

  // Use the prompt hook to warn about unsaved changes
  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty,
    "light"
  );

  let articleId = null;
  try {
    if (encoded) {
      const decoded = atob(encoded);
      articleId = decoded.split(" ")[0];
    }
  } catch (err) {
    console.error("Invalid base64 ID:", encoded);
  }
  const [article, setArticle] = useState(null);

  const draftKey = articleId ? `article-draft-${articleId}` : 'new-article-draft';
  const draftData = useMemo(() => ({
    title,
    selectedDate,
    author,
    category,
    municipality,
    barangay,
    status,
    uploadPeriodStart,
    uploadPeriodEnd,
    description: editor?.getHTML() || "",
  }), [title, selectedDate, author, category, municipality, barangay, status, uploadPeriodStart, uploadPeriodEnd, editor?.getHTML()]);
  useAutosave(isDirty ? draftData : null, draftKey, 1000);

  // Function to generate caption using AI
  const handleGenerateCaption = async () => {
    const articleContent = editor.getText();
    if (!articleContent.trim()) {
      window.alert('Please write some content in the editor first to generate a caption.');
      return;
    }

    setIsGeneratingCaption(true);
    let retries = 0;
    const maxRetries = 5;
    let success = false;

    // The prompt for the AI model
    const prompt = `Summarize the following article content into a short, engaging caption, suitable for public display on a homepage. The caption should be no more than 150 characters. The content is: ${articleContent}`;

    while (retries < maxRetries && !success) {
      try {
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        setCaption(generatedText);
        success = true;
      } catch (error) {
        retries++;
        const delay = Math.pow(2, retries) * 1000;
        console.error(`API call failed. Retrying in ${delay / 1000}s...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    setIsGeneratingCaption(false);
    if (!success) {
      window.alert('Failed to generate caption. Please try again.');
    }
  };

  // Function to generate summary using Node Summarizer (backend API)
  const handleSummarizeCaption = async () => {
    

    const articleContent = editor.getText();
    if (!articleContent.trim()) {
      window.alert('Please write some content in the editor first to summarize.');
      return;
    }
    setIsSummarizing(true);
    try {
        // Replace with your actual backend endpoint
        const response = await axios.post(
            `${BASE_URL}/auth/summarize`,
            { text: articleContent },
            { withCredentials: true }
        );
        setCaption(response.data.summary || "");
    } catch (error) {
      window.alert('Failed to summarize. Please try again.');
      console.error(error);
    }
    setIsSummarizing(false);
  };

  // Handle new or updated article submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    console.log("Current status before submit:", status);

    formData.append("title", title);
    formData.append("article_category", category);
    formData.append("description", editor?.getHTML() || "");
    formData.append("user_id", userRole);
    formData.append("author", author);
    formData.append("address", municipality);
    formData.append("selectedDate", selectedDate);
    formData.append("editImages", JSON.stringify(contentImages));
    formData.append("caption", caption);
    formData.append("barangay", barangay);
    formData.append("reviewer_notes", reviewerNotes || "");
    formData.append("status", status);
    let startDateTime = "";
    let endDateTime = "";

    if (status === "scheduled") {
      startDateTime =
        uploadPeriodStart && uploadPeriodStartTime
          ? `${uploadPeriodStart}T${uploadPeriodStartTime}:00`
          : uploadPeriodStart || "";
      endDateTime =
        uploadPeriodEnd && uploadPeriodEndTime
          ? `${uploadPeriodEnd}T${uploadPeriodEndTime}:00`
          : uploadPeriodEnd || "";

      formData.append("uploadPeriodStart", startDateTime);
      formData.append("uploadPeriodEnd", endDateTime);
    } else {
      formData.append("uploadPeriodStart", "");
      formData.append("uploadPeriodEnd", "");
    }
    if (thumbnail && thumbnail instanceof File) {
      formData.append("thumbnail", thumbnail);
    }

    console.log("Submitting with thumbnail:", thumbnail);
    console.log("Caption state value:", caption);
    try {
      let response;
      if (isEditing) {
        // Update existing
        response = await axiosClient.put(
          `/auth/article/${articleId}`,
          formData,
          {
          headers: { "Content-Type": "multipart/form-data" },
        }
        );
        // Fetch updated article to get new thumbnail filename
        const updated = await axiosClient.get(`/auth/articles/${articleId}`);
        if (updated.data.images) {
          setPreviewImage(`${UPLOAD_PATH}${updated.data.images}`);
        }
        setThumbnail(null); // Reset thumbnail to null after update
        console.log("Article updated successfully!", response.data);
        resetForm();
        navigate('/admin/article');
      } else {
        // Create new
        response = await axios.post(`${BASE_URL}/auth/article`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        setThumbnail(null);
        setPreviewImage(null);
        console.log("Article created successfully!", response.data);
      }

      resetForm();
      navigate('/admin/article');
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
    setMunicipality("");
    setSelectedDate("");
    setThumbnail(null);
    setPreviewImage(null);
    setContentImages([]);
    setCaption("");
    setBarangay("");
    setReviewerNotes("");
    editor?.commands.setContent("");
    // setShowModal(false);
    setIsEditing(false);
    setEditingArticleId(null);
    setArticle(null);

    clearDraft(draftKey)
  };

  // This consolidated useEffect replaces the two previous ones.
  useEffect(() => {
    // Reset hasRun when articleId changes (navigating between different articles)
    hasRun.current = false;
  }, [articleId]);

  useEffect(() => {
    if (hasRun.current || !editor) {
      return;
    }

    const fetchArticleAndLoadDraft = async () => {
      // Set hasRun immediately to prevent duplicate execution
      hasRun.current = true;
      
      const draft = loadDraft(draftKey);
      let shouldLoadDraft = false;

      // Only check for draft and prompt user if it exists and has meaningful content
      if (draft && editor && (draft.title || draft.description || draft.author)) {
        const draftAge = draft._savedAt ? 
          Math.floor((new Date() - new Date(draft._savedAt)) / (1000 * 60)) : 
          null;
        
        // Store draft data and show modal instead of window.confirm
        setDraftToLoad({ draft, draftAge });
        setShowDraftPrompt(true);
        return; // Exit early, let the modal handle the decision
      }

      // Handle an existing article (edit mode)
      if (articleId) {
        try {
          const response = await axiosClient.get(`/auth/articles/${articleId}`);
          const data = response.data;
          setArticle(data);
          setIsEditing(true);
          setEditingArticleId(data.article_id);

          // If the user accepts the draft, load it (but don't clear it yet)
           if (shouldLoadDraft) {
              setTitle(draft.title || "");
              setAuthor(draft.author || "");
              setCategory(draft.category || "");
              setMunicipality(draft.municipality || "");
              setBarangay(draft.barangay || "");
              setStatus(draft.status || "pending");
              setSelectedDate(draft.selectedDate || "");
              setUploadPeriodStart(draft.upload_period_start || "");
              setUploadPeriodEnd(draft.upload_period_end || "");
              setReviewerNotes(draft.reviewer_notes || '');
              setCaption(draft.caption || '');
              
              if (editor && draft.description) {
                   editor.commands.setContent(draft.description);
              }
              console.log('Draft loaded from local storage.');
              // Don't clear the draft here - let it persist until form is submitted or reset
          } else {
              // Load the original article data from the server
              setTitle(data.title || "");
              setAuthor(data.author || "");
              setCategory(data.article_category || "");
              setMunicipality(data.address || "");
              setBarangay(data.barangay || "");
              setStatus(data.status || "pending");
              setUploadPeriodStart(data.upload_period_start || "");
              setUploadPeriodEnd(data.upload_period_end || "");
              setReviewerNotes(data.reviewer_notes || "");
              setCaption(data.caption || "");

              if (editor && data.description) {
                  editor.commands.setContent(data.description);
              }
              
              if (data.upload_date) {
                  const formattedDate = new Date(data.upload_date).toISOString().split('T')[0];
                  setSelectedDate(formattedDate);
              } else {
                  setSelectedDate("");
              }
              // Don't clear the draft if user cancels - they might want to load it later
          }
          
          // Handle thumbnail
          if (data.images) {
            setPreviewImage(`${UPLOAD_PATH}${data.images}`);
          } else {
            setPreviewImage(null);
          }
          setThumbnail(null);
          
          setUploadPeriodStart(data.upload_period_start ? data.upload_period_start.split('T')[0] : "");
          setUploadPeriodEnd(data.upload_period_end ? data.upload_period_end.split('T')[0] : "");

          setUploadPeriodStartTime(
            data.upload_period_start
              ? new Date(data.upload_period_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' })
              : ""
          );
          setUploadPeriodEndTime(
            data.upload_period_end
              ? new Date(data.upload_period_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' })
              : ""
          );

        } catch (err) {
          console.error("Failed to fetch article:", err);
        }
      } else {
        // Handle a new article (no articleId)
        if (shouldLoadDraft) {
          console.log('Draft loaded from local storage.');
          setTitle(draft.title || "");
          setAuthor(draft.author || "");
          setCategory(draft.category || "");
          setMunicipality(draft.municipality || "");
          setBarangay(draft.barangay || "");
          setStatus(draft.status || "pending");
          setReviewerNotes(draft.reviewerNotes || "");
          setCaption(draft.caption || "");
          if (editor) {
              editor.commands.setContent(draft.description || "");
          }
          if (draft.selectedDate) {
              setSelectedDate(draft.selectedDate);
          }
          console.log('Draft loaded from local storage.');
          
          // Don't clear the draft here - let it persist until form is submitted or reset
        } else {
         
          resetForm();
        }
      }
    };

    fetchArticleAndLoadDraft();
  }, [articleId, editor, draftKey]);


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
    { label: "Small", value: "0.75em" }, 
    { label: "Normal", value: "1em" },
    { label: "Medium", value: "1.25em" }, 
    { label: "Large", value: "1.5em" }, 
    { label: "XL", value: "1.75em" }, 
    { label: "2XL", value: "2em" }, 
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
        // Use SERVER_ORIGIN instead of BASE_URL to avoid /api in the path
        const fullImageUrl = `${SERVER_ORIGIN}/uploads/pictures/${uploadedFilename}`;

        // Insert <img> into Tiptap
        if (editor) {
          editor
            .chain()
            .focus()
            .setImage({ src: fullImageUrl, alt: file.name })
            .run();
        }

        setContentImages((prev) => [...prev, uploadedFilename]);
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
    setIsDirty(true)
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

  const validateForm = () => {
    const newErrors = {};
      if (!title.trim()) { newErrors.title = "Title is required"; }
      if (!author.trim()) { newErrors.author = "Author is required"; }
      if (!category) { newErrors.category = "Category is required"; }
      if (!municipality.trim()) { newErrors.municipality = "Address is required"; }
      if (!selectedDate) { newErrors.selectedDate = "Date is required"; }
      if (!editor?.getHTML() || editor.getHTML() === "<p></p>") { newErrors.description = "Body content is required"; }
      return newErrors;
    };

  const handleCancel = () => {
    resetForm();
    navigate('/admin/article'); // Navigate back to the article list
    };

  // Handle cancel button click
  const handleCancelClick = () => {
    // If form is dirty (has changes), show confirmation
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      handleCancel();
    
    }
    
  };


  // Draft prompt handlers
  const handleLoadDraft = async () => {
    if (!draftToLoad) return;
    
    const { draft } = draftToLoad;
    
    // Load draft data into form
    setTitle(draft.title || "");
    setAuthor(draft.author || "");
    setCategory(draft.category || "");
    setMunicipality(draft.municipality || "");
    setBarangay(draft.barangay || "");
    setStatus(draft.status || "pending");
    setSelectedDate(draft.selectedDate || "");
    setUploadPeriodStart(draft.upload_period_start || "");
    setUploadPeriodEnd(draft.upload_period_end || "");
    setReviewerNotes(draft.reviewer_notes || '');
    setCaption(draft.caption || '');
    
    if (editor && draft.description) {
      editor.commands.setContent(draft.description);
    }
    
    console.log('Draft loaded from local storage.');
    
    // Close modal and reset state
    setShowDraftPrompt(false);
    setDraftToLoad(null);
    
    // Continue with the rest of the article loading logic if needed
    if (articleId) {
      try {
        const response = await axiosClient.get(`/auth/articles/${articleId}`);
        const data = response.data;
        setArticle(data);
        setIsEditing(true);
        setEditingArticleId(data.article_id);
        
        // Handle thumbnail
        if (data.images) {
          setPreviewImage(`${UPLOAD_PATH}${data.images}`);
        } else {
          setPreviewImage(null);
        }
        setThumbnail(null);
        
        setUploadPeriodStart(data.upload_period_start ? data.upload_period_start.split('T')[0] : "");
        setUploadPeriodEnd(data.upload_period_end ? data.upload_period_end.split('T')[0] : "");

        setUploadPeriodStartTime(
          data.upload_period_start
            ? new Date(data.upload_period_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' })
            : ""
        );
        setUploadPeriodEndTime(
          data.upload_period_end
            ? new Date(data.upload_period_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' })
            : ""
        );
      } catch (err) {
        console.error("Failed to fetch article:", err);
      }
    }
  };

  const handleSkipDraft = async () => {
    if (!draftToLoad) return;
    
    // Close modal and reset state
    setShowDraftPrompt(false);
    setDraftToLoad(null);
    
    // Continue with normal article loading logic
    if (articleId) {
      try {
        const response = await axiosClient.get(`/auth/articles/${articleId}`);
        const data = response.data;
        setArticle(data);
        setIsEditing(true);
        setEditingArticleId(data.article_id);

        // Load the original article data from the server
        setTitle(data.title || "");
        setAuthor(data.author || "");
        setCategory(data.article_category || "");
        setMunicipality(data.address || "");
        setBarangay(data.barangay || "");
        setStatus(data.status || "pending");
        setUploadPeriodStart(data.upload_period_start || "");
        setUploadPeriodEnd(data.upload_period_end || "");
        setReviewerNotes(data.reviewer_notes || "");
        setCaption(data.caption || "");

        if (editor && data.description) {
          editor.commands.setContent(data.description);
        }
        
        if (data.upload_date) {
          const formattedDate = new Date(data.upload_date).toISOString().split('T')[0];
          setSelectedDate(formattedDate);
        } else {
          setSelectedDate("");
        }
        
        // Handle thumbnail
        if (data.images) {
          setPreviewImage(`${UPLOAD_PATH}${data.images}`);
        } else {
          setPreviewImage(null);
        }
        setThumbnail(null);
        
        setUploadPeriodStart(data.upload_period_start ? data.upload_period_start.split('T')[0] : "");
        setUploadPeriodEnd(data.upload_period_end ? data.upload_period_end.split('T')[0] : "");

        setUploadPeriodStartTime(
          data.upload_period_start
            ? new Date(data.upload_period_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' })
            : ""
        );
        setUploadPeriodEndTime(
          data.upload_period_end
            ? new Date(data.upload_period_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' })
            : ""
        );
      } catch (err) {
        console.error("Failed to fetch article:", err);
      }
    } else {
      // For new articles, just reset the form
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



  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to show prompt
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);



  return (
    <>
    {PromptModal}
    <div className="flex w-full h-full gap-4 pt-5 border-t-1">
        {/* LEFT SPACER */}
        <div className="hidden 2xl:block 2xl:w-1/5" />
        {/* LEFT SIDE - Editor + Form */}
        {userRole && allowedRoles.includes(userRole) && !isReviewer ? (
        <div className="bg-white w-full 2xl:w-2/5 p-6 rounded-lg shadow-xl relative max-h-[85vh] overflow-auto transition-all duration-300">
          <h2 className="text-3xl font-bold mb-6">Header</h2>

<form onSubmit={handleFormSubmit} className="space-y-6">
  {/* Title */}
<label htmlFor="title" className={`font-bold ${errors.title ? "text-red-600" : ""}`}>
  Title {errors.title && "*"}
</label>
<input
  id="title"
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
  <div className="flex-1">
    <label htmlFor="selectedDate" className={`font-bold ${errors.selectedDate ? "text-red-600" : ""}`}>
      Date {errors.selectedDate && "*"}
    </label>
    <input
      id="selectedDate"
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
  </div>
  <div className="flex-1">
    <label htmlFor="author" className={`font-bold ${errors.author ? "text-red-600" : ""}`}>
      Author {errors.author && "*"}
    </label>
    <input
      id="author"
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
  </div>
  <div className="flex-1">
    <label htmlFor="category" className={`font-bold ${errors.category ? "text-red-600" : ""}`}>
      Category {errors.category && "*"}
    </label>
    <select
      id="category"
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
</div>

{/* Barangay, Municipality */}
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">
    <label htmlFor="municipality" className={`font-bold ${errors.municipality ? "text-red-600" : ""}`}>
      Municipality {errors.municipality && "*"}
    </label>
    <select
      id="municipality"
      className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
        errors.municipality ? "border-red-600" : "border-black"
      }`}
      value={municipality}
      onChange={(e) => {
        setMunicipality(e.target.value);
        setBarangay("");
        setIsDirty(true);
        clearFieldError("municipality");
      }}
    >
      <option value="" disabled={municipality !== ""}>
        {`Municipality${errors.municipality ? " *" : ""}`}
      </option>
      {Object.keys(municipalitiesWithBarangays).map((mun) => (
        <option key={mun} value={mun}>
          {mun}
        </option>
      ))}
    </select>
  </div>
  <div className="flex-1">
    <label htmlFor="barangay" className="font-bold">
      Barangay
    </label>
    <input
      id="barangay"
      list="barangayList"
      className="w-full px-4 py-3 border-2 border-black rounded-2xl text-base md:text-lg outline-none placeholder-gray-500"
      type="text"
      value={barangay}
      onChange={(e) => setBarangay(e.target.value)}
      placeholder="Barangay (You can type or select)"
    />
    <datalist id="barangayList">
      {(municipalitiesWithBarangays[municipality] || []).map((bgy) => (
        <option key={bgy} value={bgy} />
      ))}
    </datalist>
  </div>
</div>

{/* Status Dropdown */}
<div className="flex-1">
      <label htmlFor="status" className="font-bold">
                                    Status
      </label>
      <select
                                    id="status"
                                    className="w-full px-4 py-3 border-2 border-black rounded-2xl text-base md:text-lg outline-none"
                                    name="status"
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        setIsDirty(true);
                                    }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="scheduled">Schedule</option>
                                    <option value="posted">Post</option>
                                    <option value="archived">Archive</option>
      </select>
</div>

      {/* Conditional rendering for scheduled posts */}
      {status === 'scheduled' && (
        <>
            {/* Start Date & Time Input */}
            <div className="flex-1">
                                        <label htmlFor="uploadPeriodStart" className="font-bold">
                                            Start Date
                                        </label>
                                        <div className="flex gap-2">
                                        <input
                                            id="uploadPeriodStart"
                                            type="date"
                                            className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
                                                errors.uploadPeriodStart ? "border-red-600" : "border-black"
                                            }`}
                                            value={uploadPeriodStart}
                                            onChange={(e) => {
                                                setUploadPeriodStart(e.target.value);
                                                setIsDirty(true);
                                                clearFieldError("uploadPeriodStart");
                                            }}
                                        />
                                        <input
                                            id="uploadPeriodStartTime"
                                            type="time"
                                            className="w-32 px-2 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black"
                                            value={uploadPeriodStartTime}
                                            onChange={(e) => {
                                                setUploadPeriodStartTime(e.target.value);
                                                setIsDirty(true);
                                            }}
                                        />
                                        </div>
            </div>

            {/* End Date & Time Input */}
            <div className="flex-1">
                <label htmlFor="uploadPeriodEnd" className="font-bold">
                                            End Date
                </label>
                <div className="flex gap-2">
                <input
                    id="uploadPeriodEnd"
                      type="date"
                      className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
                          errors.uploadPeriodEnd ? "border-red-600" : "border-black"
                      }`}
                      value={uploadPeriodEnd}
                      onChange={(e) => {
                          setUploadPeriodEnd(e.target.value);
                          setIsDirty(true);
                          clearFieldError("uploadPeriodEnd");
                      }}
                      min={uploadPeriodStart}
                />
                <input
                    id="uploadPeriodEndTime"
                    type="time"
                    className="w-32 px-2 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black"
                    value={uploadPeriodEndTime}
                    onChange={(e) => {
                        setUploadPeriodEndTime(e.target.value);
                        setIsDirty(true);
                    }}
                />
                </div>
            </div>
        </>
      )}

{/* Thumbnail  */}
<div className="flex flex-col md:flex-row gap-4">

  {/* Thumbnail */}
  <div className="relative flex-1">
    <label htmlFor="thumbnail" className="font-bold">
      Thumbnail
    </label>
    <input
      id="thumbnail"
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
                        <HighlighterIcon size={11} />
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
      console.log("Before toggle:", editor?.isActive("bulletList"));
      e.preventDefault();
      e.stopPropagation();
      editor?.chain().focus().toggleBulletList().run();
      setIsDirty(true);
      console.log("After toggle:", editor?.isActive("bulletList"));
    }}
    className={`p-1 border rounded ${
      editor?.isActive("bulletList") ? "bg-white" : ""
    }`}
    title="Bullet List"
  >
    <List size={18} />
  </button>

  {/* Roman List */}
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      editor?.chain().focus().toggleOrderedList().run();
      editor?.chain().focus().updateAttributes("orderedList", { class: "roman-list" }).run();
      setIsDirty(true);
    }}
    className={`p-1 border rounded ${
      editor?.isActive("orderedList", { class: "roman-list" }) ? "bg-white" : ""
    }`}
    title="Roman List"
  >
    <ListOrdered size={18} />
  </button>

  {/* Letter List */}
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      editor?.chain().focus().toggleOrderedList().run();
      editor?.chain().focus().updateAttributes("orderedList", { class: "letter-list" }).run();
      setIsDirty(true);
    }}
    className={`p-1 border rounded ${
      editor?.isActive("orderedList", { class: "letter-list" }) ? "bg-white" : ""
    }`}
    title="Letter List"
  >
    <ListOrdered size={18} />
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
                        <VideoIcon size={18} />
                      </button>
                    </div>
                  </div>

    {/* Editor area */}
                  <div
                    className="
                          border rounded p-4 min-h-[21.5rem] max-h-[21.5rem] 
                          sm:min-h-[10rem] sm:max-h-[5rem] 
                          md:min-h-[36.5rem] md:max-h-[36.5rem] 
                          lg:min-h-[36.5rem] lg:max-h-[36.5rem] 
                          xl:min-h-[36.6rem] xl:max-h-[36.6rem] 
                          2xl:min-h-[37rem] 2xl:max-h-[37rem] 
                          overflow-auto prose focus:outline-none
                          [&_.youtube-video]:!w-full [&_.youtube-video]:!max-w-[400px] [&_.youtube-video]:!mx-auto font-hina
                        "
                    tabIndex={0}
                    onClick={() => editor?.commands.focus()}
                  >
                    <EditorContent editor={editor} />
                  </div>
                </div>

{/*Caption Field with AI Button */}
<div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
    <div className="flex justify-between items-center mb-2">
        <label htmlFor="caption" className="text-xl font-bold text-gray-800">
            Publicly Displayed Caption
        </label>
        <div className="flex gap-2">
            <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isGeneratingCaption || !editor?.getText()?.trim()}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isGeneratingCaption ? 'Generating...' : 'Generate with AI'}
            </button>
            <button
                type="button"
                onClick={handleSummarizeCaption}
                disabled={isSummarizing || !editor?.getText()?.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isSummarizing ? 'Summarizing...' : 'Summarize with Node'}
                
            </button>
            
        </div>
    </div>
    <textarea
        id="caption"
        className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg text-base md:text-lg outline-none resize-none focus:border-blue-500 transition-colors"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Enter a brief, engaging caption for the article. This will be visible on the homepage."
        readOnly={isViewer}
    />
</div>
  {/* Buttons */}
<div className="flex justify-between">
  <StyledButton
    type="button"
    onClick={handleCancelClick}
    buttonColor="bg-gray-500"
    hoverColor="hover:bg-gray-600"
    textColor="text-white"
  >
    Cancel
  </StyledButton>
  <StyledButton
    type="submit"
    buttonColor="bg-blue-600"
    hoverColor="hover:bg-[#d69641]"
    textColor="text-white"
    className="mt-4"
  >
    {isEditing ? "Save Changes" : "Submit Article"}
  </StyledButton>
</div>


  
</form>
</div>
        ): (
        // RENDER THE SIMPLIFIED REVIEWER VIEW
        <div className="bg-white w-full 2xl:w-2/5 p-6 rounded-lg shadow-xl relative max-h-[85vh] overflow-auto transition-all duration-300">
          <h2 className="text-3xl font-bold mb-6">Review Article</h2>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <p className="text-lg font-bold">Title:</p>
              <p>{title || "N/A"}</p>
            </div>

            {/* Dates */}
            <div className="flex gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="font-bold">Date Created</label>
                  <p className="text-lg text-gray-700">{article?.created_at}</p>
                </div>
                <div className="flex-1">
                  <label className="font-bold">Last Updated</label>
                  <p className="text-lg text-gray-700">{article?.updated_at}</p>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div>
              <p className="text-lg font-bold">Current Status:</p>
              <p className="capitalize">{status}</p>
            </div>

            {/* Reviewer Notes */}
            <div className="space-y-2">
              <label htmlFor="reviewerNotes" className="text-lg font-bold">Reviewer's Notes</label>
              <textarea
                id="reviewerNotes"
                className="w-full h-40 p-4 border-2 border-black rounded-lg text-base md:text-lg outline-none resize-none"
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Add your notes here..."
                disabled={isViewer}
              />
            </div>
          </div>
          
          <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
            {/* Status Dropdown */}
            <div className="flex items-center gap-4">
              <label htmlFor="reviewerStatus" className="font-bold whitespace-nowrap">
                Change Status:
              </label>
              <select
                id="reviewerStatus"
                className="flex-1 px-4 py-3 border-2 border-black rounded-2xl text-base md:text-lg outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isViewer}
              >
                <option value="pending">Pending</option>
                <option value="posted">Post</option>
                <option value="rejected">Reject</option>
                <option value="archived">Archive</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            
            {/* Date & Time Pickers for Scheduled */}
            {status === 'scheduled' && (
              <div className="flex flex-col gap-4">
                {/* Start Date & Time Row */}
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1">
                    <label htmlFor="uploadPeriodStart" className="font-bold">
                      Start Date
                    </label>
                    <input
                      id="uploadPeriodStart"
                      type="date"
                      className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
                        errors.uploadPeriodStart ? "border-red-600" : "border-black"
                      }`}
                      value={uploadPeriodStart}
                      onChange={(e) => {
                        setUploadPeriodStart(e.target.value);
                        setIsDirty(true);
                        clearFieldError("uploadPeriodStart");
                      }}
                      disabled={isViewer}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="uploadPeriodStartTime" className="font-bold">
                      Start Time
                    </label>
                    <input
                      id="uploadPeriodStartTime"
                      type="time"
                      className="w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black"
                      value={uploadPeriodStartTime}
                      onChange={(e) => {
                        setUploadPeriodStartTime(e.target.value);
                        setIsDirty(true);
                      }}
                      disabled={isViewer}
                    />
                  </div>
                </div>
                {/* End Date & Time Row */}
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1">
                    <label htmlFor="uploadPeriodEnd" className="font-bold">
                      End Date
                    </label>
                    <input
                      id="uploadPeriodEnd"
                      type="date"
                      className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
                        errors.uploadPeriodEnd ? "border-red-600" : "border-black"
                      }`}
                      value={uploadPeriodEnd}
                      onChange={(e) => {
                        setUploadPeriodEnd(e.target.value);
                        setIsDirty(true);
                        clearFieldError("uploadPeriodEnd");
                      }}
                      min={uploadPeriodStart}
                      disabled={isViewer}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="uploadPeriodEndTime" className="font-bold">
                      End Time
                    </label>
                    <input
                      id="uploadPeriodEndTime"
                      type="time"
                      className="w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black"
                      value={uploadPeriodEndTime}
                      onChange={(e) => {
                        setUploadPeriodEndTime(e.target.value);
                        setIsDirty(true);
                      }}
                      disabled={isViewer}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {userRole !== 3 && (
              <div className="flex justify-end">
                <Button type="submit" className="w-full md:w-auto px-6 py-3 bg-[#c78216] text-white font-bold rounded-2xl hover:bg-[#d69641] transition-colors">
                  Save Status
                </Button>
              </div>
            )}
          </form>
        </div>
      )}
       
{/* RIGHT SIDE - Article Preview */}
        <div
              className="bg-white w-full 2xl:w-2/5 p-6 rounded-lg shadow-xl overflow-y-auto max-h-[85vh] mt-4 2xl:mt-0"
            >
              <h3 className="text-2xl font-bold mb-4">Preview</h3>
              <div className="border border-gray-200 p-4 mb-4 rounded">
                <h1 className="text-center text-3xl font-bold">
                  {title || "Title of the News or Event"}
                </h1>
              </div>
              <div className="flex w-full justify-center mb-6 font-hina">
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
                        !municipality && !barangay ? "text-gray-500 italic" : ""
                      }`}
                    >
                      {barangay ? `${barangay}, ` : ""}
                      {municipality || "[Location]"}
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
                  className="prose max-w-none min-h-[18rem] max-h-[24rem] sm:min-h-[22rem] sm:max-h-[28rem] md:min-h-[26rem] md:max-h-[32rem] lg:min-h-[30rem] lg:max-h-[30rem] xl:min-h-[32rem] xl:max-h-[32rem] 2xl:min-h-[57rem] 2xl:max-h-[34rem] overflow-y-auto relative break-words font-hina"
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

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        visible={showCancelConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Discard them?"
        onConfirm={() => {
          resetForm();
          setShowCancelConfirm(false);
          setErrors({});
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        visible={showSubmitConfirm}
        title={isEditing ? 'Save Changes?' : 'Submit Article?'}
        message="Are you sure you want to proceed?"
        onConfirm={() => {
          handleSubmit({ preventDefault: () => {} }, removeThumbnail);
          setShowSubmitConfirm(false);
          setErrors({});
        }}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      {/* Draft Prompt Modal */}
      {showDraftPrompt && draftToLoad && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border-2 border-gray-300">
            <h3 className="text-lg font-semibold mb-4">Draft Found</h3>
            <p className="text-gray-600 mb-6">
              It looks like you have a saved draft
              {draftToLoad.draftAge ? ` (saved ${draftToLoad.draftAge} minutes ago)` : ''}. 
              Do you want to load it?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSkipDraft}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip Draft
              </button>
              <button
                onClick={handleLoadDraft}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Load Draft
              </button>
            </div>
          </div>
        </div>
      )}
      </>
  );
};




export default ArticleEditorForm;