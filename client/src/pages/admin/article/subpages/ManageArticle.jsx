import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { X as XIcon } from "lucide-react";
import { STATUS, STATUS_LABELS } from "../components/articleStatus";
import ArticlePreview from "../components/ArticlePreview";

import {
  getVolumeFromYYYYMMDD,
  getYearFromYYYYMMDD,
  computeNextSequence,
  makeDisplayLabel,
} from "../components/archiveHelpers";

// === NEW imports (split-out files) ===
import {
  paths,
  getArticle,
  listArticles,
  createArticle,
  updateArticle,
  uploadContentImage,
} from "../components/articleApi";

import {
  getManilaTodayISO,
  toISOZFromManila,
  isDateDisabledForSchedule,
  toManilaParts,
} from "../components/articleDates";

import { validateForm } from "../components/articleValidation";
import { AUTHOR_ALLOWED } from "../components/articleConstants";

import ArticleHeaderSummaryCard from "../components/ArticleHeaderSummaryCard";
import ArticleScheduledFields from "../components/ArticleScheduledFields";
import ArticleThumbnailInput from "../components/ArticleThumbnailInput";
import ArticleDetailsForm from "../components/ArticleDetailsForm";
// =====================================

const ArticleEditorForm = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
  const UPLOAD_PATH = paths.pictures || `${SERVER_ORIGIN}/uploads/pictures/`;

  const { user } = useAuth();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { encoded } = useParams();

  const userRole = user.roleId;
  const allowedRoles = [1, 2, 5];
  const isViewer = userRole === 3;
  const isReviewer = userRole === 4;
  const isPrivileged = [1, 2, 5].includes(user.roleId);

  const forcedFromNav = routerLocation.state?.forceReviewMode === true;
  const queryParams = new URLSearchParams(routerLocation.search);
  const forceEditorMode = queryParams.get("mode") === "edit";

  // Editor mirror + ref
  const [editorHTML, setEditorHTML] = useState("");
  const [editorText, setEditorText] = useState("");
  const editorRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState("");
  const [address, setAddress] = useState(""); // kept for compat
  const [selectedDate, setSelectedDate] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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

  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [uploadPeriodStartTime, setUploadPeriodStartTime] = useState("");

  const [uploadPeriodEndTime, setUploadPeriodEndTime] = useState("");

  // Keep original archive bucket on edit
  const [origVolume, setOrigVolume] = useState(null);
  const [origSeqNum, setOrigSeqNum] = useState(null);
  const [origContentType, setOrigContentType] = useState(null);

  // Draft prompt
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState(null);

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
  const isOwner = article ? String(article.user_id) === String(user.id) : null;

  const shouldShowReviewer =
    !forceEditorMode &&
    (forcedFromNav || user.roleId === 4 || user.roleId === 3 || (isOwner === false && isPrivileged));

  const draftKey = articleId ? `article-draft-${articleId}` : "new-article-draft";
  const draftData = useMemo(
    () => ({
      title,
      selectedDate,
      author,
      category,
      content_type: contentType,
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
      contentType,
      municipality,
      barangay,
      status,
      uploadPeriodStart,
      uploadPeriodEnd,
      editorHTML,
    ]
  );
  useAutosave(isDirty ? draftData : null, draftKey, 1000);

  // Submit to API
  const handleSubmit = async (e) => {
    e.preventDefault();

    // client-side validation
    const newErrors = validateForm({
      title,
      selectedDate,
      author,
      category,
      contentType,
      status,
      editorHTML,
      uploadPeriodStart,
      uploadPeriodEnd,
      uploadPeriodStartTime,
      uploadPeriodEndTime,
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("article_category", category);
    formData.append("content_type", contentType); // required
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

    // Manila → UTC helpers
    let startDateTime = "";
    let endDateTime = "";
    if (status === "scheduled") {
      startDateTime = toISOZFromManila(uploadPeriodStart, uploadPeriodStartTime, "08:00");
      endDateTime = toISOZFromManila(uploadPeriodEnd, uploadPeriodEndTime, "23:59");
      formData.append("uploadPeriodStart", startDateTime);
      formData.append("uploadPeriodEnd", endDateTime);
    }

    if (thumbnail && thumbnail instanceof File) {
      formData.append("thumbnail", thumbnail);
    }
    if (removeThumbnail) {
      // if your backend supports explicit removal flag, you could:
      // formData.append("removeThumbnail", "true");
    }

    // === Derived archive fields (editor-computed) ===
    const finalVolume = getVolumeFromYYYYMMDD(selectedDate) || "";
    const year = getYearFromYYYYMMDD(selectedDate);
    const sameBucket =
      isEditing &&
      origVolume &&
      origContentType &&
      Number(origVolume) === Number(finalVolume) &&
      String(origContentType || "").toLowerCase() === String(contentType || "").toLowerCase();

    const finalSeqNum = sameBucket ? origSeqNum || "" : computeNextSequence(articles, year, contentType) || "";
    if (finalVolume) formData.append("volume", String(finalVolume));
    if (finalSeqNum) formData.append("sequence_number", String(finalSeqNum));

    try {
      if (isEditing) {
        await updateArticle(articleId, formData);
        const updated = await getArticle(articleId);
        if (updated?.data?.images) {
          setPreviewImage(`${UPLOAD_PATH}${updated.data.images}`);
        }
        setThumbnail(null);
        resetForm();
        navigate("/admin/article");
      } else {
        await createArticle(formData);
        setThumbnail(null);
        setPreviewImage(null);
        resetForm();
        navigate("/admin/article");
      }

      fetchArticles();
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "creating"} article:`, err?.response?.data || err?.message);
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
    setContentType("");
    setMunicipality("");
    setSelectedDate("");
    setThumbnail(null);
    setPreviewImage(null);
    setContentImages([]);
    setCaption("");
    setBarangay("");
    setReviewerNotes("");
    setStatus("pending");
    setUploadPeriodStart("");
    setUploadPeriodEnd("");
    setUploadPeriodStartTime("");
    setUploadPeriodEndTime("");
    editorRef.current?.setContent("");
    setEditorHTML("");
    setEditorText("");
    setIsEditing(false);
    setEditingArticleId(null);
    setArticle(null);
    setOrigVolume(null);
    setOrigSeqNum(null);
    setOrigContentType(null);
    clearDraft(draftKey);
  };

  // guard ref to avoid double-fetch on id change
  const hasRun = useRef(false);
  useEffect(() => {
    hasRun.current = false;
  }, [articleId]);

  // initial load / draft load
  useEffect(() => {
    if (hasRun.current) return;

    const fetchArticleAndLoadDraft = async () => {
      hasRun.current = true;

      const draft = loadDraft(draftKey);
      if (draft?.data && (draft.data.title || draft.data.description || draft.data.author)) {
        const draftAge = draft._savedAt ? Math.floor((new Date() - new Date(draft._savedAt)) / (1000 * 60)) : null;
        setDraftToLoad({ draft, draftAge });
        setShowDraftPrompt(true);
        return;
      }

      if (articleId) {
        try {
          const response = await getArticle(articleId);
          const data = response.data;
          setArticle(data);
          setIsEditing(true);
          setEditingArticleId(data.article_id);

          setTitle(data.title || "");
          setAuthor(data.author || "");
          setCategory(data.article_category || "");
          setContentType((data.content_type || "").toLowerCase() || "");
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

          setOrigVolume(data.volume ?? null);
          setOrigSeqNum(data.sequence_number ?? null);
          setOrigContentType((data.content_type || "").toLowerCase() || null);

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
      }
    };

    fetchArticleAndLoadDraft();
  }, [articleId, draftKey]);

  // hydrate switching review -> edit
  useEffect(() => {
    if (forceEditorMode && article?.description && editorRef.current) {
      const current = editorRef.current.getHTML?.() || "";
      if (!current || current === "<p></p>") {
        editorRef.current.setContent(article.description);
        setEditorHTML(article.description);
        setEditorText(editorRef.current.getText?.() || "");
      }
    }
  }, [forceEditorMode, article]);

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await listArticles();
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
    const newErrors = validateForm({
      title,
      selectedDate,
      author,
      category,
      contentType,
      status,
      editorHTML,
      uploadPeriodStart,
      uploadPeriodEnd,
      uploadPeriodStartTime,
      uploadPeriodEndTime,
    });
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
  const handleImageUpload = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const fileList = e?.target?.files || e?.dataTransfer?.files;
    const file = fileList?.[0];
    if (!file) return;

    try {
      const response = await uploadContentImage(file);
      if (response.data?.images?.length > 0) {
        const uploadedFilename = response.data.images[0];
        const fullImageUrl = `${SERVER_ORIGIN}/uploads/pictures/${uploadedFilename}`;

        editorRef.current?.runChain((chain) =>
          chain
            .focus()
            .insertContent({
              type: "image",
              attrs: { src: fullImageUrl, alt: file.name },
            })
            .run()
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
    if (removeThumbnail) setRemoveThumbnail(false);
    handleThumbnailChange(e);
    setHasThumbnail(!!e.target.files && e.target.files.length > 0);
    if (e.target.files && e.target.files.length > 0) setIsDirty(true);
  };

  // reviewer cancel
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

  const showBackToReview = isPrivileged && forcedFromNav && !!articleId && forceEditorMode;

  // --- Live archive preview ---
  const volumePreview = useMemo(() => getVolumeFromYYYYMMDD(selectedDate), [selectedDate]);

  const seqPreview = useMemo(() => {
    const year = getYearFromYYYYMMDD(selectedDate);
    const sameBucket =
      isEditing &&
      origVolume &&
      origContentType &&
      Number(origVolume) === Number(volumePreview) &&
      String(origContentType || "").toLowerCase() === String(contentType || "").toLowerCase();

    if (sameBucket && origSeqNum) return origSeqNum;
    return computeNextSequence(articles, year, contentType);
  }, [articles, selectedDate, contentType, isEditing, origVolume, origContentType, origSeqNum, volumePreview]);

  const seqLabelPreview = useMemo(() => makeDisplayLabel(contentType, seqPreview), [contentType, seqPreview]);

  // ---- Schedule date rules ----
  const manilaTodayISO = useMemo(() => getManilaTodayISO(), []);

  const handleStartDateChange = (val) => {
    if (isDateDisabledForSchedule(val, manilaTodayISO)) {
      setErrors((e) => ({ ...e, uploadPeriodStart: "That date isn’t allowed for scheduling." }));
      return;
    }
    setUploadPeriodStart(val);
    setIsDirty(true);
    clearFieldError("uploadPeriodStart");

    if (uploadPeriodEnd && new Date(`${uploadPeriodEnd}T00:00:00+08:00`) < new Date(`${val}T00:00:00+08:00`)) {
      setUploadPeriodEnd(val);
      clearFieldError("uploadPeriodEnd");
    }
  };

  const handleEndDateChange = (val) => {
    if (isDateDisabledForSchedule(val, manilaTodayISO)) {
      setErrors((e) => ({ ...e, uploadPeriodEnd: "That date isn’t allowed for scheduling." }));
      return;
    }
    if (uploadPeriodStart && new Date(`${val}T00:00:00+08:00`) < new Date(`${uploadPeriodStart}T00:00:00+08:00`)) {
      setErrors((e) => ({ ...e, uploadPeriodEnd: "End must be the same as or after Start." }));
      return;
    }
    setUploadPeriodEnd(val);
    setIsDirty(true);
    clearFieldError("uploadPeriodEnd");
  };

  // Manila-friendly created/updated
  const createdParts = useMemo(() => toManilaParts(article?.created_at), [article?.created_at]);
  const updatedParts = useMemo(() => toManilaParts(article?.updated_at), [article?.updated_at]);

  // prefill author on first render if creating a new article
  useEffect(() => {
    if (!isEditing && !author && user) {
      const first = (user.fname || "").trim();
      const last = (user.lname || "").trim();
      const full = [first, last].filter(Boolean).join(" ").trim();
      if (full) {
        setAuthor(full); // not marking dirty; it's auto-fill
      }
    }
  }, [isEditing, author, user]);

  // ---------- Auto-hide Header (Summary) ----------
  const headerRef = useRef(null);
  const [headerHidden, setHeaderHidden] = useState(false);

  const headerComplete = useMemo(() => {
    if (!title.trim() || !selectedDate || !author.trim() || !category || !contentType) return false;
    if (contentType === "event" && !municipality) return false;
    if (status === "scheduled" && (!uploadPeriodStart || !uploadPeriodEnd)) return false;
    return true;
  }, [
    title,
    selectedDate,
    author,
    category,
    contentType,
    municipality,
    status,
    uploadPeriodStart,
    uploadPeriodEnd,
  ]);

  const onHeaderBlurCapture = (e) => {
    const next = e.relatedTarget;
    const stillInside = next && headerRef.current?.contains(next);
    if (!stillInside && headerComplete) {
      setHeaderHidden(true);
    }
  };
  // -----------------------------------------------

  return (
    <>
      {/* Leave-page Prompt */}
      {PromptModal}

      <div
        className="w-full h-full gap-4 gap-x-15 pt-5 border-t-1
        grid grid-rows-[1fr_40rem] 
        md:grid-rows-[1fr_40rem]
        lg:flex lg:flex-row
        2xl:flex 2xl:flex-row
        3xl:flex 3xl:flex-row overflow-auto"
      >
        {/* LEFT SIDE - Editor + Form */}
        {userRole && allowedRoles.includes(userRole) && !shouldShowReviewer ? (
          <div className="bg-white w-full p-6 rounded-lg shadow-xl relative max-h-full transition-all duration-300">
            <h2 className="text-3xl font-bold mb-2">Header</h2>

            {/* Archive badges preview */}
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
                {volumePreview ? `Vol.${volumePreview}` : "Vol.—"}
              </span>
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
                {seqLabelPreview || (contentType === "article" ? "No.—" : "Event #—")}
              </span>
            </div>

            {showBackToReview && (
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
              {/* --- Auto-hide Header Block --- */}
              {headerHidden ? (
                <ArticleHeaderSummaryCard
                  title={title}
                  selectedDate={selectedDate}
                  author={author}
                  category={category}
                  contentType={contentType}
                  municipality={municipality}
                  barangay={barangay}
                  status={status}
                  statusLabels={STATUS_LABELS}
                  onEdit={() => setHeaderHidden(false)}
                />
              ) : (
                <div
                  ref={headerRef}
                  onBlurCapture={onHeaderBlurCapture}
                  className="rounded-xl border border-gray-200"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                    <span className="font-semibold">Details</span>
                    <button
                      type="button"
                      onClick={() => setHeaderHidden(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
                      title={headerComplete ? "Hide details" : "Hide anyway"}
                    >
                      Hide
                    </button>
                  </div>

                  {/* Details block (title, date, author, category, type, municipality/barangay, status) */}
                  <ArticleDetailsForm
                    errors={errors}
                    values={{
                      title,
                      selectedDate,
                      author,
                      category,
                      contentType,
                      municipality,
                      barangay,
                      status,
                    }}
                    onChange={{
                      title: (v) => {
                        setTitle(v);
                        setIsDirty(true);
                        clearFieldError("title");
                      },
                      selectedDate: (v) => {
                        setSelectedDate(v);
                        setIsDirty(true);
                        clearFieldError("selectedDate");
                      },
                      author: (v) => {
                        setAuthor(v);
                        setIsDirty(true);
                        clearFieldError("author");
                      },
                      category: (v) => {
                        setCategory(v);
                        setIsDirty(true);
                        clearFieldError("category");
                      },
                      contentType: (v) => {
                        setContentType(v);
                        setIsDirty(true);
                        clearFieldError("content_type");
                      },
                      municipality: (v) => {
                        setMunicipality(v);
                        setBarangay("");
                        setIsDirty(true);
                      },
                      barangay: (v) => {
                        setBarangay(v);
                        setIsDirty(true);
                      },
                      status: (v) => {
                        setStatus(v);
                        setIsDirty(true);
                      },
                    }}
                    statusOptions={STATUS.filter((s) => AUTHOR_ALLOWED.has(s.value))}
                    statusLabels={STATUS_LABELS}
                  />

                  {/* Scheduled fields */}
                  {status === "scheduled" && (
                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ArticleScheduledFields
                        errors={errors}
                        manilaTodayISO={manilaTodayISO}
                        uploadPeriodStart={uploadPeriodStart}
                        uploadPeriodEnd={uploadPeriodEnd}
                        uploadPeriodStartTime={uploadPeriodStartTime}
                        uploadPeriodEndTime={uploadPeriodEndTime}
                        onStartDate={handleStartDateChange}
                        onEndDate={handleEndDateChange}
                        onStartTime={(v) => {
                          setUploadPeriodStartTime(v);
                          setIsDirty(true);
                        }}
                        onEndTime={(v) => {
                          setUploadPeriodEndTime(v);
                          setIsDirty(true);
                        }}
                        disabled={isReviewer}
                      />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="p-4">
                    <ArticleThumbnailInput
                      inputRef={thumbnailInputRef}
                      previewImage={
                        typeof previewImage === "string" ? previewImage : (previewImage?.name || null)
                      }
                      removeThumbnail={removeThumbnail}
                      onChange={handleCustomThumbnailChange}
                      onRemove={handleRemoveThumbnail}
                    />
                  </div>
                </div>
              )}
              {/* --- End Auto-hide Header Block --- */}

              {/* Rich Text Editor */}
              <RichTextEditor
                ref={editorRef}
                errors={errors}
                setIsDirty={setIsDirty}
                fontSizes={fontSizes}
                onImageUpload={handleImageUpload}
                editable={!isReviewer}
                placeholder="Start writing your article..."
                initialHTML={editorHTML || article?.description || ""}
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
          // Reviewer view
          <div className="bg-white w-full 2xl:w-1/2 p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-start mb-6 gap-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold leading-tight">Review Article</h2>
                {/* Title + Author */}
                <div className="mt-3">
                  <p className="text-sm font-semibold text-neutral-600">Title</p>
                  <p className="text-xl font-medium text-neutral-900">{title || "N/A"}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    <span className="font-semibold">Author:</span>{" "}
                    <span className="text-neutral-800">{author || "N/A"}</span>
                  </p>
                </div>
              </div>

              {isPrivileged && (
                <StyledButton
                  type="button"
                  buttonColor="bg-indigo-600"
                  hoverColor="hover:bg-indigo-700"
                  textColor="text-white"
                  onClick={() => {
                    navigate(`/admin/article/edit-article/${encoded}?mode=edit`, {
                      state: { forceReviewMode: true },
                      replace: true,
                    });
                  }}
                >
                  Edit this article
                </StyledButton>
              )}
            </div>

            {/* Meta: Created / Updated */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-sm font-semibold text-neutral-600">Date Created (PH)</p>
                <div className="mt-1">
                  <p className="text-base text-neutral-900">{createdParts.date}</p>
                  <p className="text-sm text-neutral-600">{createdParts.time}</p>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-sm font-semibold text-neutral-600">Last Updated (PH)</p>
                <div className="mt-1">
                  <p className="text-base text-neutral-900">{updatedParts.date}</p>
                  <p className="text-sm text-neutral-600">{updatedParts.time}</p>
                </div>
              </div>
            </div>

            {/* Reviewer Notes */}
            <div className="space-y-2">
              <label htmlFor="reviewerNotes" className="text-lg font-bold">
                Reviewer&apos;s Notes
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

            {/* Change Status */}
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
                  {STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {STATUS_LABELS[s.value] ?? s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled block */}
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
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        min={manilaTodayISO}
                        aria-invalid={!!errors.uploadPeriodStart}
                        title={errors.uploadPeriodStart || ""}
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
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        min={uploadPeriodStart || manilaTodayISO}
                        aria-invalid={!!errors.uploadPeriodEnd}
                        title={errors.uploadPeriodEnd || ""}
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
        <ViewPort
          sizes={{
            lg: { width: 500, height: 545 },
            xl: { width: 675, height: 545 },
            "2xl": { width: 1000, height: 545 },
            "3xl": { width: 1100, height: 700 },
          }}
        >
          <ArticlePreview
            contentType={contentType}
            volume={volumePreview || null}
            sequenceNumber={seqPreview || null}
            title={title}
            selectedDate={selectedDate}
            author={author}
            municipality={municipality}
            barangay={barangay}
            category={category}
            previewImage={previewImage}
            removeThumbnail={removeThumbnail}
            editorHTML={editorHTML}
          />
        </ViewPort>
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
              {draftToLoad.draftAge ? ` (saved ${draftToLoad.draftAge} minutes ago)` : ""}. Do you want
              to load it?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={async () => {
                  setShowDraftPrompt(false);
                  setDraftToLoad(null);
                  if (articleId) {
                    try {
                      const response = await getArticle(articleId);
                      const data = response.data;
                      setArticle(data);
                      setIsEditing(true);
                      setEditingArticleId(data.article_id);

                      setTitle(data.title || "");
                      setAuthor(data.author || "");
                      setCategory(data.article_category || "");
                      setContentType((data.content_type || "").toLowerCase() || "");
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

                      setOrigVolume(data.volume ?? null);
                      setOrigSeqNum(data.sequence_number ?? null);
                      setOrigContentType((data.content_type || "").toLowerCase() || null);

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
                  setContentType(draft.data.content_type || "");
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
                      const response = await getArticle(articleId);
                      const data = response.data;
                      setArticle(data);
                      setIsEditing(true);
                      setEditingArticleId(data.article_id);

                      if (data.images) setPreviewImage(`${UPLOAD_PATH}${data.images}`);
                      else setPreviewImage(null);
                      setThumbnail(null);

                      setOrigVolume(data.volume ?? null);
                      setOrigSeqNum(data.sequence_number ?? null);
                      setOrigContentType((data.content_type || "").toLowerCase() || null);

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
