import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation  } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import axios from "axios";
import Button from "../../../../components/buttons/artclbtn";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import StyledButton from "@/components/buttons/StyledButton";
import { useAuth } from "@/context/authContext";
import useAutosave, { loadDraft, clearDraft } from "@/features/ContentDrafting.jsx";
import usePrompt from "@/hooks/usePrompt";
import ViewPort from "../../../../features/Viewport";
import { handleGenerateCaption, handleSummarizeCaption } from "../components/CaptionGenerator";
import RichTextEditor from "../components/RichTextEditor";
import { X as XIcon } from "lucide-react"; // only needed for thumbnail 'X' button
import { STATUS, STATUS_LABELS } from '../components/articleStatus';

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
  const AUTHOR_ALLOWED = new Set(['pending','scheduled','posted','archived']);
  const navigate = useNavigate();
  const forcedFromNav   = location.state?.forceReviewMode === true;  
  const queryParams = new URLSearchParams(location.search); 
  const forceEditorMode = queryParams.get("mode") === "edit";
  // editor mirror state (strings) + ref for commands
  const [editorHTML, setEditorHTML] = useState("");
  const [editorText, setEditorText] = useState("");
  const editorRef = useRef(null);

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
    Basud: ["Mampili", "Matnog", "San Felipe", "San Isidro", "Tuaca"],
    Capalonga: ["Alayao", "Bayabas", "Del Pilar", "Itok", "Old Camp"],
    Daet: ["Alawihao", "Awitan", "Bagasbas", "Borabod", "Camambugan", "Dogongan"],
    "San Lorenzo Ruiz": ["Daguit", "Langga", "Laniton", "Mampurog", "Matacong"],
    "Jose Panganiban": ["Bagong Bayan", "Calero", "Larap", "Plaridel", "Osmeña"],
    Labo: ["Baay", "Bagacay", "Bagong Silang I", "Bakiad", "Talobatib"],
    Mercedes: ["Apuao", "Caucauayan", "Colasi", "Hinipagan", "San Roque"],
    Paracale: ["Bagumbayan", "Batobalani", "Calaburnay", "Capacuan", "Tugos"],
    "San Vicente": ["Asdum", "Cabanbanan", "Calabagas", "Fabrica", "Iraya Sur"],
    "Santa Elena": ["Basiad", "Bulala", "Maulawin", "Polungguitguit", "Rizal"],
    Talisay: ["Binanuahan", "Calintaan", "Del Rosario", "San Isidro", "Tinago"],
    Vinzons: ["Calangcawan Norte", "Candelaria", "Manmuntay", "Pinagtigasan", "Sula"],
  };

  const [status, setStatus] = useState("pending");
  const [uploadPeriodStart, setUploadPeriodStart] = useState("");
  const [uploadPeriodEnd, setUploadPeriodEnd] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [contentImages, setContentImages] = useState([]);
  const [caption, setCaption] = useState("");
  const [barangay, setBarangay] = useState("");
  const thumbnailInputRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [hasThumbnail, setHasThumbnail] = useState(!!thumbnail || !!previewImage);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const { encoded } = useParams();
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [uploadPeriodStartTime, setUploadPeriodStartTime] = useState("");
  const [uploadPeriodEndTime, setUploadPeriodEndTime] = useState("");

  // Draft prompt modal state
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState(null);

  // Unsaved changes prompt
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
  const isPrivileged = [1,2,5].includes(user.roleId);
  const isOwner = article ? String(article.user_id) === String(user.id) : null;

    const shouldShowReviewer =
      !forceEditorMode && (
        forcedFromNav ||
        user.roleId === 4 ||           
        user.roleId === 3 ||          
        (isOwner === false && isPrivileged)
      );

  const draftKey = articleId ? `article-draft-${articleId}` : "new-article-draft";
  const draftData = useMemo(
    () => ({
      title,
      selectedDate,
      author,
      category,
      municipality,
      barangay,
      status,
      uploadPeriodStart,
      uploadPeriodEnd,
      description: editorHTML || "",
    }),
    [
      title,
      selectedDate,
      author,
      category,
      municipality,
      barangay,
      status,
      uploadPeriodStart,
      uploadPeriodEnd,
      editorHTML,
    ]
  );
  useAutosave(isDirty ? draftData : null, draftKey, 1000);

  // Submit (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("title", title);
    formData.append("article_category", category);
    formData.append("description", editorHTML || "");
    formData.append("user_id", String(user.id));
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

    try {
      let response;
      if (isEditing) {
        response = await axiosClient.put(`/auth/article/${articleId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const updated = await axiosClient.get(`/auth/articles/${articleId}`);
        if (updated.data.images) {
          setPreviewImage(`${UPLOAD_PATH}${updated.data.images}`);
        }
        setThumbnail(null);
        resetForm();
        navigate("/admin/article");
      } else {
        response = await axios.post(`${BASE_URL}/auth/article`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        setThumbnail(null);
        setPreviewImage(null);
      }

      resetForm();
      navigate("/admin/article");
      fetchArticles();
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "creating"} article:`, err.response?.data || err.message);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

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
    editorRef.current?.setContent("");
    setIsEditing(false);
    setEditingArticleId(null);
    setArticle(null);
    clearDraft(draftKey);
  };

  // re-run guard when articleId changes
  useEffect(() => {
    hasRun.current = false;
  }, [articleId]);

  // initial load / draft load
  useEffect(() => {
    if (hasRun.current) return; 

    const fetchArticleAndLoadDraft = async () => {
      hasRun.current = true;

      const draft = loadDraft(draftKey); // { data, hash, _savedAt }
       if (draft?.data && (draft.data.title || draft.data.description || draft.data.author)) {
        const draftAge = draft._savedAt ? Math.floor((new Date() - new Date(draft._savedAt)) / (1000 * 60)) : null;
        setDraftToLoad({ draft, draftAge }); // keep whole object; we’ll read draft.data later
        setShowDraftPrompt(true);
        return;
      }


      if (articleId) {
        try {
          const response = await axiosClient.get(`/auth/articles/${articleId}`);
          const data = response.data;
          setArticle(data);
          setIsEditing(true);
          setEditingArticleId(data.article_id);


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
            editorRef.current?.setContent(data.description || "");
            setEditorHTML(data.description || "");
            setEditorText(editorRef.current?.getText() || "");

            if (data.upload_date) {
              const formattedDate = new Date(data.upload_date).toISOString().split("T")[0];
              setSelectedDate(formattedDate);
            } else {
              setSelectedDate("");
            }
          

          if (data.images) {
            setPreviewImage(`${UPLOAD_PATH}${data.images}`);
          } else {
            setPreviewImage(null);
          }
          setThumbnail(null);

          setUploadPeriodStart(data.upload_period_start ? data.upload_period_start.split("T")[0] : "");
          setUploadPeriodEnd(data.upload_period_end ? data.upload_period_end.split("T")[0] : "");

          setUploadPeriodStartTime(
            data.upload_period_start
              ? new Date(data.upload_period_start).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Manila",
                })
              : ""
          );
          setUploadPeriodEndTime(
            data.upload_period_end
              ? new Date(data.upload_period_end).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Manila",
                })
              : ""
          );
        } catch (err) {
          console.error("Failed to fetch article:", err);
        }
      } else {

      }
    };

    fetchArticleAndLoadDraft();
  }, [articleId, draftKey]);

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/auth/articles`);
      setArticles(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setErrMsg("Failed to load articles. Check that the API server is running.");
      setArticles([]);
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  useEffect(() => {
    setHasThumbnail(!!thumbnail || !!previewImage);
  }, [thumbnail, previewImage]);

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    setErrors({});
    setIsDirty(false);
  }, []);

  const fontSizes = [
    { label: "Small", value: "0.75em" },
    { label: "Normal", value: "1em" },
    { label: "Medium", value: "1.25em" },
    { label: "Large", value: "1.5em" },
    { label: "XL", value: "1.75em" },
    { label: "2XL", value: "2em" },
  ];

  // inline image upload from editor
  const handleImageUpload = async (e) => {   // Prevent the browser from opening the dropped file
    if (e?.preventDefault) e.preventDefault();
    const fileList = e?.target?.files || e?.dataTransfer?.files;   
    const file = fileList?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("contentImages", file);

      const response = await axios.post(`${BASE_URL}/auth/article/content-images`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.images?.length > 0) {
        const uploadedFilename = response.data.images[0];
        const fullImageUrl = `${SERVER_ORIGIN}/uploads/pictures/${uploadedFilename}`;

        // use ref to insert the image
        editorRef.current?.runChain((chain) =>
          chain.focus().setImage({ src: fullImageUrl, alt: file.name }).run()
        );

        setContentImages((prev) => [...prev, uploadedFilename]);
        setIsDirty(true);
      }
    } catch (err) {
      console.error("Error uploading content image:", err);
      alert("Failed to upload image");
    }
  };

  const handleRemoveThumbnail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
    setRemoveThumbnail(true);
    setHasThumbnail(false);
    setIsDirty(true);
  };

  const handleCustomThumbnailChange = (e) => {
    if (removeThumbnail) {
      setRemoveThumbnail(false);
    }
    handleThumbnailChange(e);
    setHasThumbnail(!!e.target.files && e.target.files.length > 0);
    if (e.target.files && e.target.files.length > 0) {
      setIsDirty(true);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!author.trim()) newErrors.author = "Author is required";
    if (!category) newErrors.category = "Category is required";
    if (!municipality.trim()) newErrors.municipality = "Address is required";
    if (!selectedDate) newErrors.selectedDate = "Date is required";
    if (!editorHTML || editorHTML === "<p></p>") newErrors.description = "Body content is required";
    return newErrors;
  };

  const handleCancel = () => {
    resetForm();
    navigate("/admin/article");
  };

  const handleCancelClick = () => {
    if (isDirty) setShowCancelConfirm(true);
    else handleCancel();
  };

  // beforeunload guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

console.log("ArticleEditorForm mode check", {
  locationState: location.state,
  query: location.search,
  forceEditorMode,
  isPrivileged,
  isOwner,
  shouldShowReviewer,
  renderEditorUI: userRole && allowedRoles.includes(userRole) && !shouldShowReviewer
});

  return (
    <>
      {PromptModal}
      <div className="flex w-full h-full gap-4 pt-5 border-t-1">
        {/* LEFT SPACER */}
        <div className="hidden 2xl:block 2xl:w-1/5" />

        {/* LEFT SIDE - Editor + Form */}
        {userRole && allowedRoles.includes(userRole) && !shouldShowReviewer ? (
          <div className="bg-white w-full 2xl:w-2/5 p-6 rounded-lg shadow-xl relative max-h-[85vh] overflow-auto transition-all duration-300">
            <h2 className="text-3xl font-bold mb-6">Header</h2>
                {isPrivileged && (
                  <div className="flex justify-end mb-4">
                    <StyledButton
                      type="button"
                      buttonColor="bg-gray-500"
                      hoverColor="hover:bg-gray-600"
                      textColor="text-white"
                      onClick={() => {
                        navigate(`/admin/article/edit-article/${encoded}?mode=review`, {
                          replace: true,
                        });
                      }}
                    >
                      Back to Review
                    </StyledButton>
                  </div>
                )}
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

              {/* Status */}
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
                  {STATUS.filter(s => AUTHOR_ALLOWED.has(s.value)).map(s => (
                      <option key={s.value} value={s.value}>
                        {STATUS_LABELS[s.value] ?? s.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Scheduled fields */}
              {status === "scheduled" && (
                <>
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

              {/* Thumbnail */}
              <div className="flex flex-col md:flex-row gap-4">
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
                    accept="image/*"
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
              <RichTextEditor
                ref={editorRef}
                errors={errors}
                setIsDirty={setIsDirty}
                fontSizes={fontSizes}
                onImageUpload={handleImageUpload}
                editable={!isReviewer}
                placeholder="Start writing your article..."
                initialHTML="" // set server value if editing
                onUpdate={({ html, text }) => {
                  setEditorHTML(html);
                  setEditorText(text);
                  setIsDirty(true);
                }}
              />

              {/* Caption */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="caption" className="text-xl font-bold text-gray-800">
                    Publicly Displayed Caption
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleGenerateCaption(editorText, setCaption, setIsGeneratingCaption)}
                      disabled={isGeneratingCaption || !editorText.trim()}
                      className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isGeneratingCaption ? "Generating..." : "Generate with AI"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSummarizeCaption(editorText, setCaption, setIsSummarizing, BASE_URL)
                      }
                      disabled={isSummarizing || !editorText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSummarizing ? "Summarizing..." : "Summarize with Node"}
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
        ) : (
          // Reviewer view (unchanged except it now uses editorHTML string for preview)
              <div className="bg-white w-full 2xl:w-2/5 p-6 rounded-lg shadow-xl ...">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold">Review Article</h2>

                  {isPrivileged && (
                    <StyledButton
                      type="button"
                      buttonColor="bg-indigo-600"
                      hoverColor="hover:bg-indigo-700"
                      textColor="text-white"
                      onClick={() => {
                        navigate(`/admin/article/edit-article/${encoded}?mode=edit`, {
                          replace: true,
                        });
                      }}
                    >
                      Edit this article
                    </StyledButton>
                  )}
                </div>
            <div className="space-y-4">
              <div>
                <p className="text-lg font-bold">Title:</p>
                <p>{title || "N/A"}</p>
              </div>

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

              <div>
                <p className="text-lg font-bold">Current Status:</p>
                <p className="capitalize">{status}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="reviewerNotes" className="text-lg font-bold">
                  Reviewer's Notes
                </label>
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
                  {STATUS.map(s => (
                    <option key={s.value} value={s.value}>
                      {STATUS_LABELS[s.value] ?? s.label}
                    </option>
                  ))}
                </select>
              </div>

              {status === "scheduled" && (
                <div className="flex flex-col gap-4">
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
                
            {userRole !== 3 && (
              <div className="flex justify-end gap-3">
                <StyledButton
                  type="button"
                  onClick={() => navigate("/admin/article")}
                  buttonColor="bg-gray-500"
                  hoverColor="hover:bg-gray-600"
                  textColor="text-white"
                >
                  Cancel
                </StyledButton>

                <Button
                  type="submit"
                  className="w-full md:w-auto px-6 py-3 bg-[#c78216] text-white font-bold rounded-2xl hover:bg-[#d69641] transition-colors"
                >
                  Save Status
                </Button>
              </div>
            )}
            </form>
          </div>
        )}

        {/* RIGHT SIDE - Article Preview */}
        <ViewPort width={550} height={545}>
          <div className="bg-white w-[50rem] p-6 rounded-lg shadow-2xl overflow-y-auto max-h-[90vh] mt-4 2xl:mt-0">
            <h3 className="text-2xl font-bold mb-4">Preview</h3>
            <div className="border border-gray-200 p-4 mb-4 rounded">
              <h1 className="text-center text-3xl font-bold">{title || "Title of the News or Event"}</h1>
            </div>

            <div className="flex w-full justify-center mb-6 font-hina">
              <div className="flex w-full items-center justify-center text-center text-base">
                <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
                  <h4 className="text-lg font-medium">Date</h4>
                  <p className={`text-sm ${!selectedDate ? "text-gray-500 italic" : ""}`}>
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
                  <p className={`text-sm ${!author ? "text-gray-500 italic" : ""}`}>
                    {author || "[Name of the Author]"}
                  </p>
                </span>
                <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
                  <h4 className="text-lg font-medium">Address</h4>
                  <p className={`text-sm ${!municipality && !barangay ? "text-gray-500 italic" : ""}`}>
                    {barangay ? `${barangay}, ` : ""}
                    {municipality || "[Location]"}
                  </p>
                </span>
                <span className="w-1/4 h-24 border border-gray-300 flex flex-col items-center justify-center p-2">
                  <h4 className="text-lg font-medium">Category</h4>
                  <p className={`text-sm ${!category ? "text-gray-500 italic" : ""}`}>
                    {category || "[placeholder]"}
                  </p>
                </span>
              </div>
            </div>

            <div className="border border-gray-200 p-4 rounded min-h-[300px] font-[Hina Mincho]">
              {previewImage && !removeThumbnail ? (
                <div className="flex justify-center mb-4">
                  <img src={previewImage} alt="Article thumbnail" className="max-h-64 object-contain" />
                </div>
              ) : null}

              <div className="editor-content-preview not-prose max-w-none ... overflow-y-auto relative break-words font-hina">
                {editorHTML ? (
                  <div
                    className="editor-content-preview"
                    dangerouslySetInnerHTML={{ __html: editorHTML }}
                  />
                ) : (
                  <p className="text-gray-400 italic">Article content will appear here...</p>
                )}
              </div>


            </div>
          </div>
        </ViewPort>

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
          setShowDraftPrompt(false);
          setDraftToLoad(null);
          setErrors({});
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        visible={showSubmitConfirm}
        title={isEditing ? "Save Changes?" : "Submit Article?"}
        message="Are you sure you want to proceed?"
        onConfirm={() => {
          handleSubmit({ preventDefault: () => {} });
          setShowSubmitConfirm(false);
          setShowDraftPrompt(false);
          setIsDirty(false);
          setDraftToLoad(null);
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
              {draftToLoad.draftAge ? ` (saved ${draftToLoad.draftAge} minutes ago)` : ""}. Do you want to load it?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={async () => {
                  // Skip
                  setShowDraftPrompt(false);
                  setDraftToLoad(null);
                  if (articleId) {
                    try {
                      const response = await axiosClient.get(`/auth/articles/${articleId}`);
                      const data = response.data;
                      setArticle(data);
                      setIsEditing(true);
                      setEditingArticleId(data.article_id);

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

                      editorRef.current?.setContent(data.description || "");
                      setEditorHTML(data.description || "");
                      setEditorText(editorRef.current?.getText() || "");

                      if (data.upload_date) {
                        const formattedDate = new Date(data.upload_date).toISOString().split("T")[0];
                        setSelectedDate(formattedDate);
                      } else {
                        setSelectedDate("");
                      }

                      if (data.images) setPreviewImage(`${UPLOAD_PATH}${data.images}`);
                      else setPreviewImage(null);
                      setThumbnail(null);

                      setUploadPeriodStart(data.upload_period_start ? data.upload_period_start.split("T")[0] : "");
                      setUploadPeriodEnd(data.upload_period_end ? data.upload_period_end.split("T")[0] : "");

                      setUploadPeriodStartTime(
                        data.upload_period_start
                          ? new Date(data.upload_period_start).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "Asia/Manila",
                            })
                          : ""
                      );
                      setUploadPeriodEndTime(
                        data.upload_period_end
                          ? new Date(data.upload_period_end).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "Asia/Manila",
                            })
                          : ""
                      );
                    } catch (err) {
                      console.error("Failed to fetch article:", err);
                    }
                  } else {
                    resetForm();
                  }
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip Draft
              </button>
              <button
                onClick={async () => {
                  // Load
                  const { draft } = draftToLoad;
                  setTitle(draft.data.title || "");
                  setAuthor(draft.data.author || "");
                  setCategory(draft.data.category || "");
                  setMunicipality(draft.data.municipality || "");
                  setBarangay(draft.data.barangay || "");
                  setStatus(draft.data.status || "pending");
                  setSelectedDate(draft.data.selectedDate || "");
                  setUploadPeriodStart(draft.data.upload_period_start || "");
                  setUploadPeriodEnd(draft.data.upload_period_end || "");
                  setReviewerNotes(draft.data.reviewer_notes || "");
                  setCaption(draft.data.caption || "");

                  editorRef.current?.setContent(draft.data.description || "");
                  setEditorHTML(draft.data.description || "");
                  setEditorText(editorRef.current?.getText() || "");

                  setShowDraftPrompt(false);
                  setDraftToLoad(null);

                  if (articleId) {
                    try {
                      const response = await axiosClient.get(`/auth/articles/${articleId}`);
                      const data = response.data;
                      setArticle(data);
                      setIsEditing(true);
                      setEditingArticleId(data.article_id);

                      if (data.images) setPreviewImage(`${UPLOAD_PATH}${data.images}`);
                      else setPreviewImage(null);
                      setThumbnail(null);

                      setUploadPeriodStart(data.upload_period_start ? data.upload_period_start.split("T")[0] : "");
                      setUploadPeriodEnd(data.upload_period_end ? data.upload_period_end.split("T")[0] : "");

                      setUploadPeriodStartTime(
                        data.upload_period_start
                          ? new Date(data.upload_period_start).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "Asia/Manila",
                            })
                          : ""
                      );
                      setUploadPeriodEndTime(
                        data.upload_period_end
                          ? new Date(data.upload_period_end).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "Asia/Manila",
                            })
                          : ""
                      );
                    } catch (err) {
                      console.error("Failed to fetch article:", err);
                    }
                  }
                }}
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
