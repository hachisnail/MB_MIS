// src/pages/admin/article/ArticleEditorForm.jsx
import { useEffect, useState, useRef, useMemo, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";

import Button from "../../../../components/buttons/artclbtn";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import StyledButton from "@/components/buttons/StyledButton";
import PopupModal from "@/components/modals/PopupModal";
import Modal from "@/components/modals/Modal";
import { useAuth } from "@/context/authContext";

import useAutosave, {
  loadDraft,
  clearDraft,
  getDismissedDraftHash,
  setDismissedDraftHash,
  shouldPromptForDraft,
} from "@/features/ContentDrafting.jsx";

import ViewPort from "../../../../features/Viewport";
import { handleGenerateCaption, handleSummarizeCaption } from "../components/CaptionGenerator";
import RichTextEditor from "../components/RichTextEditor";
import { STATUS, STATUS_LABELS } from "../components/articleStatus";
import ArticlePreview from "../components/ArticlePreview";

import {
  getVolumeFromYYYYMMDD,
  getYearFromYYYYMMDD,
  computeNextSequence,
  makeDisplayLabel,
} from "../components/archiveHelpers";

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

/* ✅ Use your existing blocker hook */
import { useBlocker } from "@/hooks/useBlocker";

const SUPPRESS_DRAFT_FLAG = "suppressDraftPromptOnce";

/** Uppercase the first non-space character of a string */
const capFirst = (s = "") => {
  const ws = (s.match(/^\s*/) || [""])[0];
  const rest = s.slice(ws.length);
  if (!rest) return s;
  return ws + rest.charAt(0).toUpperCase() + rest.slice(1);
};

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
  const [showImageSizeModal, setShowImageSizeModal] = useState(false);
  const [imageSizeMsg, setImageSizeMsg] = useState("");

  const [isDirty, setIsDirty] = useState(false);
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

  const [origVolume, setOrigVolume] = useState(null);
  const [origSeqNum, setOrigSeqNum] = useState(null);
  const [origContentType, setOrigContentType] = useState(null);

  // Draft prompt
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState(null);

  // Navigation/blocker guards
  const bypassBlockRef = useRef(false);         // used to skip the custom blocker
  const [isSaving, setIsSaving] = useState(false); // true while submit/save is running

  // Add with other useState hooks
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");

  // Dirty suppression
  const suppressDirtyRef = useRef(false);
  const markDirty = () => {
    if (!suppressDirtyRef.current) setIsDirty(true);
  };
  const runWithoutDirty = (fn) => {
    suppressDirtyRef.current = true;
    try {
      fn?.();
      setIsDirty(false);
    } finally {
      requestAnimationFrame(() => {
        suppressDirtyRef.current = false;
      });
    }
  };
  const setIsDirtySafe = (v) => {
    if (v) {
      if (!suppressDirtyRef.current) setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  };

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

  // Stop autosave after user picks “Don’t Save”
  const [suppressAutosave, setSuppressAutosave] = useState(false);
  useAutosave(isDirty && !suppressAutosave ? draftData : null, draftKey, 1000, forceEditorMode);

  // Live archive preview
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

  const isNumbered = useMemo(
    () => article?.volume != null && article?.sequence_number != null,
    [article?.volume, article?.sequence_number]
  );
  const wasPosted = useMemo(
    () => String(article?.status || "").toLowerCase() === "posted",
    [article?.status]
  );
  const willBePosted = useMemo(
    () => String(status || "").toLowerCase() === "posted",
    [status]
  );
  const becomingPosted = useMemo(
    () => !wasPosted && willBePosted,
    [wasPosted, willBePosted]
  );

  // Extracted save so the leave modal can call it
  const saveArticle = async ({ skipNavigate = false } = {}) => {
    console.log("[Save] start", { skipNavigate });

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
      console.log("[Save] validation failed", newErrors);
      setErrors(newErrors);
      openValidationAlert(newErrors);
      return false;
    }

    const formData = new FormData();
    formData.append("title", capFirst(title)); // normalize before save
    formData.append("article_category", category);
    if (contentType) formData.append("content_type", contentType);
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

    if (status === "scheduled") {
      const startDateTime = toISOZFromManila(uploadPeriodStart, uploadPeriodStartTime, "08:00");
      const endDateTime = toISOZFromManila(uploadPeriodEnd, uploadPeriodEndTime, "23:59");
      formData.append("uploadPeriodStart", startDateTime);
      formData.append("uploadPeriodEnd", endDateTime);
    }

    if (thumbnail && thumbnail instanceof File) {
      formData.append("thumbnail", thumbnail);
    }

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
        console.log("[Save] updateArticle");
        await updateArticle(articleId, formData);
      } else {
        console.log("[Save] createArticle");
        await createArticle(formData);
      }

      // suppress draft prompt after a real save
      sessionStorage.setItem(SUPPRESS_DRAFT_FLAG, "1");
      setShowDraftPrompt(false);
      setDraftToLoad(null);
      clearDraft(draftKey);
      clearDraft("new-article-draft");

      if (!skipNavigate) {
        console.log("[Save] success -> navigating");
        bypassBlockRef.current = true;
        setIsSaving(true);
        setIsDirty(false);
        navigate("/admin/article", { replace: true });
        return true;
      }

      console.log("[Save] success (no navigation)");
      runWithoutDirty(() => {});
      setIsDirty(false);
      return true;
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "creating"} article:`, err?.response?.data || err?.message);
      return false;
    } finally {
      console.log("[Save] finished");
    }
  };

  // Submit to API (normal Save/Submit button)
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Submit] start");

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
      console.log("[Submit] validation failed", newErrors);
      setErrors(newErrors);
      openValidationAlert(newErrors);
      return;
    }

    const formData = new FormData();
    formData.append("title", capFirst(title)); // normalize before submit
    formData.append("article_category", category);
    if (contentType) formData.append("content_type", contentType);
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

    if (status === "scheduled") {
      const startDateTime = toISOZFromManila(uploadPeriodStart, uploadPeriodStartTime, "08:00");
      const endDateTime = toISOZFromManila(uploadPeriodEnd, uploadPeriodEndTime, "23:59");
      formData.append("uploadPeriodStart", startDateTime);
      formData.append("uploadPeriodEnd", endDateTime);
    }

    if (thumbnail && thumbnail instanceof File) {
      formData.append("thumbnail", thumbnail);
    }

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
        console.log("[Submit] updateArticle");
        await updateArticle(articleId, formData);
      } else {
        console.log("[Submit] createArticle");
        await createArticle(formData);
      }

      sessionStorage.setItem(SUPPRESS_DRAFT_FLAG, "1");
      setShowDraftPrompt(false);
      setDraftToLoad(null);
      clearDraft(draftKey);
      clearDraft("new-article-draft");

      console.log("[Submit] success -> navigating");
      bypassBlockRef.current = true;
      setIsSaving(true);
      setIsDirty(false);
      navigate("/admin/article", { replace: true });
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "creating"} article:`, err?.response?.data || err?.message);
    } finally {
      console.log("[Submit] finished");
    }
  };

  // Guarded submit (archive-numbering rules)
  const [showCannotSchedule, setShowCannotSchedule] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const confirmActionRef = useRef(null);
  const openArchiveConfirm = (actionFn) => {
    confirmActionRef.current = actionFn;
    setShowArchiveConfirm(true);
  };

  const guardedHandleSubmit = (e) => {
    e.preventDefault();
    console.log("[GuardedSubmit]");

    if (isNumbered && status === "scheduled") {
      setShowCannotSchedule(true);
      return;
    }

    if (!isNumbered && becomingPosted) {
      openArchiveConfirm(() => {
        console.log("[GuardedSubmit] confirm assign numbers -> handleSubmit");
        runWithoutDirty(() => setStatus("posted"));
        handleSubmit({ preventDefault: () => {} });
      });
      return;
    }

    setShowSubmitConfirm(true);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  };
  useEffect(() => {
    return () => {
      if (previewImage?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // Core reset
  const resetFormCore = () => {
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

  const resetForm = () => {
    runWithoutDirty(() => {
      resetFormCore();
    });
  };

  // guard ref to avoid double-fetch on id change
  const hasRun = useRef(false);
  useEffect(() => {
    hasRun.current = false;
  }, [articleId]);

  // initial load / draft load
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const fetchAndHydrate = async () => {
      if (!articleId) return;
      try {
        const response = await getArticle(articleId);
        const data = response.data;

        runWithoutDirty(() => {
          setArticle(data);
          setIsEditing(true);
          setEditingArticleId(data.article_id);

          setTitle(capFirst(data.title || "")); // normalize from server
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
        });
      } catch (err) {
        console.error("Failed to fetch article:", err);
      }
    };

    // REVIEWER VIEW: ignore drafts completely, just fetch server data
    if (!forceEditorMode) {
      setShowDraftPrompt(false);
      setDraftToLoad(null);
      fetchAndHydrate();
      return;
    }

    // EDITOR VIEW: honor suppress flag first
    if (sessionStorage.getItem(SUPPRESS_DRAFT_FLAG) === "1") {
      sessionStorage.removeItem(SUPPRESS_DRAFT_FLAG);
      fetchAndHydrate();
      return;
    }

    const draft = loadDraft(draftKey);
    const dismissedHash = getDismissedDraftHash(draftKey);
    const hasDraftContent =
      !!draft?.data && (draft.data.title || draft.data.description || draft.data.author);

    if (hasDraftContent && shouldPromptForDraft({ draft, baseHash: "", dismissedHash })) {
      const draftAge = draft._savedAt
        ? Math.floor((new Date() - new Date(draft._savedAt)) / (1000 * 60))
        : null;
      setDraftToLoad({ draft, draftAge });
      setShowDraftPrompt(true);
      return;
    }

    fetchAndHydrate();
  }, [articleId, draftKey, forceEditorMode, UPLOAD_PATH]);

  // hydrate switching review -> edit
  useEffect(() => {
    if (forceEditorMode && article?.description && editorRef.current) {
      const current = editorRef.current.getHTML?.() || "";
      if (!current || current === "<p></p>") {
        runWithoutDirty(() => {
          editorRef.current.setContent(article.description);
          setEditorHTML(article.description);
          setEditorText(editorRef.current?.getText() || "");
        });
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
      openValidationAlert(newErrors);
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
              attrs: { src: fullImageUrl, alt: file.name, widthPct: 100 },
            })
            .run()
        );

        setContentImages((prev) => [...prev, uploadedFilename]);
        markDirty();
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
    markDirty();
  };

const handleCustomThumbnailChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    if (file.size > maxSize) {
      setImageSizeMsg("The selected image exceeds the 5MB limit. Please choose a smaller file.");
      setShowImageSizeModal(true);
      e.target.value = ""; // Clear the input so user can select again
      return; // Stop here — don't continue
    }

    if (removeThumbnail) setRemoveThumbnail(false);
    handleThumbnailChange(e);
    setHasThumbnail(!!e.target.files && e.target.files.length > 0);
    if (e.target.files && e.target.files.length > 0) markDirty();
  }
};


  // reviewer cancel → navigate; the blocker will intercept if dirty
  const handleCancelClick = () => {
    navigate("/admin/article");
  };

  // beforeunload: native browser prompt for hard refresh/close (does NOT save)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !isSaving) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSaving]);

  const showBackToReview = isPrivileged && forcedFromNav && !!articleId && forceEditorMode;

  // ---- Schedule date rules ----
  const manilaTodayISO = useMemo(() => getManilaTodayISO(), []);
  const handleStartDateChange = (val) => {
    if (isDateDisabledForSchedule(val, manilaTodayISO)) {
      setErrors((e) => ({ ...e, uploadPeriodStart: "That date isn’t allowed for scheduling." }));
      return;
    }
    setUploadPeriodStart(val);
    markDirty();
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
    markDirty();
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
      if (full) setAuthor(full);
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
  }, [title, selectedDate, author, category, contentType, municipality, status, uploadPeriodStart, uploadPeriodEnd]);

  const onHeaderBlurCapture = (e) => {
    if (!headerComplete) return;
    const next = e.relatedTarget;
    if (!next) return;
    const stillInside = headerRef.current?.contains(next);
    if (!stillInside) setHeaderHidden(true);
  };

  // Hide draft overlay entirely in reviewer view
  useEffect(() => {
    if (shouldShowReviewer && showDraftPrompt) {
      setShowDraftPrompt(false);
      setDraftToLoad(null);
    }
  }, [shouldShowReviewer, showDraftPrompt]);

  /* ===== Route leave guard state using your useBlocker ===== */
  const nextNavRef = useRef(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  useBlocker(
    (tx) => {
      console.log("[BLOCKER] invoked", {
        isDirty,
        bypass: bypassBlockRef.current,
        isSaving,
      });
      nextNavRef.current = tx.retry;
      setShowLeaveDialog(true); // we only run when actually dirty (see `when` below)
    },
    isDirty && !bypassBlockRef.current && !isSaving // guard while saving
  );
  /* ======================================================== */


  // Map validator keys to labels and element ids to focus/scroll
const FIELD_LABELS = {
  title: ["Title", "title"],
  selectedDate: ["Date", "selectedDate"],
  author: ["Author", "author"],
  category: ["Category", "category"],
  content_type: ["Type", "contentType"],
  status: ["Status", "status"],
  description: ["Body", "body-editor"], // matches containerId we pass to RTE
  uploadPeriodStart: ["Schedule Start Date", "uploadPeriodStart"],
  uploadPeriodEnd: ["Schedule End Date", "uploadPeriodEnd"],
};

const openValidationAlert = (errorsObj) => {
  const missing = Object.keys(errorsObj);
  if (!missing.length) return;

  const labels = missing
    .map((k) => FIELD_LABELS[k]?.[0] || k)
    .join(", ");

  setValidationMsg(
    `Please complete the required field${missing.length > 1 ? "s" : ""}: ${labels}.`
  );
  setShowValidationModal(true);

  // Scroll/focus to the first missing field
  const firstKey = missing[0];
  const domId = FIELD_LABELS[firstKey]?.[1];

  setTimeout(() => {
    if (!domId) return;

    const el =
      document.getElementById(domId) ||
      document.getElementById("body-editor") ||
      document.querySelector(`[name="${domId}"]`);

    if (el?.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (typeof el?.focus === "function") {
      el.focus({ preventScroll: true });
    }
  }, 0);
};

  return (
    <>
      {/* Main layout */}
      <div
        className="w-full h-full gap-4 gap-x-15 pt-5 border-t
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
                    navigate(`/admin/article/edit-article/${encoded}?mode=review`, { replace: true });
                  }}
                >
                  Back to Review
                </StyledButton>
              </div>
            )}

            <form onSubmit={guardedHandleSubmit} className="space-y-6">
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
                <div ref={headerRef} onBlurCapture={onHeaderBlurCapture} className="rounded-xl border border-gray-200">
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

                  {/* Details block */}
                  <ArticleDetailsForm
                    errors={errors}
                    values={{ title, selectedDate, author, category, contentType, municipality, barangay, status }}
                    onChange={{
                      title: (v) => {
                        setTitle(capFirst(v)); // normalize while typing
                        markDirty();
                        clearFieldError("title");
                      },
                      selectedDate: (v) => {
                        setSelectedDate(v);
                        markDirty();
                        clearFieldError("selectedDate");
                      },
                      author: (v) => {
                        setAuthor(v);
                        markDirty();
                        clearFieldError("author");
                      },
                      category: (v) => {
                        setCategory(v);
                        markDirty();
                        clearFieldError("category");
                      },
                      contentType: (v) => {
                        setContentType(v);
                        markDirty();
                        clearFieldError("content_type");
                      },
                      municipality: (v) => {
                        setMunicipality(v);
                        setBarangay("");
                        markDirty();
                      },
                      barangay: (v) => {
                        setBarangay(v);
                        markDirty();
                      },
                      status: (v) => {
                        setStatus(v);
                        markDirty();
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
                          markDirty();
                        }}
                        onEndTime={(v) => {
                          setUploadPeriodEndTime(v);
                          markDirty();
                        }}
                        disabled={isReviewer}
                      />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="p-4">
                    <ArticleThumbnailInput
                      inputRef={thumbnailInputRef}
                      previewUrl={typeof previewImage === "string" ? previewImage : null}
                      removeThumbnail={removeThumbnail}
                      onChange={handleCustomThumbnailChange}
                      onRemove={handleRemoveThumbnail}
                    />
                  </div>
                </div>
              )}

              {/* Rich Text Editor */}
              <RichTextEditor
                ref={editorRef}
                errors={errors}
                setIsDirty={setIsDirtySafe}
                fontSizes={[
                  { label: "Small", value: "0.75em" },
                  { label: "Normal", value: "1em" },
                  { label: "Medium", value: "1.25em" },
                  { label: "Large", value: "1.5em" },
                  { label: "XL", value: "1.75em" },
                  { label: "2XL", value: "2em" },
                ]}
                onImageUpload={handleImageUpload}
                editable={!isReviewer}
                placeholder="Start writing your article..."
                initialHTML={editorHTML || article?.description || ""}
                onUpdate={({ html, text }) => {
                  console.log("[Form:RTE:onUpdate] set dirty");
                  setEditorHTML(html);
                  setEditorText(text);
                  markDirty();
                }}
                containerId="body-editor"
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
                      onClick={() => handleSummarizeCaption(editorText, setCaption, setIsSummarizing, BASE_URL)}
                      disabled={isSummarizing || !editorText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSummarizing ? "Summarizing..." : "Summarize"}
                    </button>
                  </div>
                </div>
                <textarea
                  id="caption"
                  className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg text-base md:text-lg outline-none resize-none focus:border-blue-500 transition-colors"
                  value={caption}
                  onChange={(e) => {
                    setCaption(e.target.value);
                    markDirty();
                  }}
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
                  onClick={() => console.log("[ConfirmDialog] Submit clicked")}
                >
                  {isEditing ? "Save Changes" : "Submit Article"}
                </StyledButton>
              </div>
            </form>
          </div>
        ) : (
          // Reviewer view
          <div className="bg-white w-full 2xl:w-1/2 p-6 rounded-lg shadow-xl relative z-10">
            <div className="flex justify-between items-start mb-6 gap-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold leading-tight">Review Article</h2>
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

            {/* Meta */}
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

            {/* Inline banner when numbered */}
            {isNumbered && (
              <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                This article already has archive numbers (Vol. {article?.volume}, No. {article?.sequence_number}).
                Scheduling and archive numbers are now locked. You can still change status to <b>Posted</b>,{" "}
                <b>Rejected</b>, or <b>Archived</b>, but you cannot switch to <b>Scheduled</b> or alter the schedule window.
              </div>
            )}

            {/* Reviewer Notes */}
            <div className="space-y-2">
              <label htmlFor="reviewerNotes" className="text-lg font-bold">
                Reviewer&apos;s Notes
              </label>
              <textarea
                id="reviewerNotes"
                className="w-full h-40 p-4 border-2 border-black rounded-lg text-base md:text-lg outline-none resize-none"
                value={reviewerNotes}
                onChange={(e) => {
                  setReviewerNotes(e.target.value);
                  markDirty();
                }}
                placeholder="Add your notes here..."
                disabled={isViewer}
              />
            </div>

            {/* Change Status */}
            <form onSubmit={guardedHandleSubmit} className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <label htmlFor="reviewerStatus" className="font-bold whitespace-nowrap">
                  Change Status:
                </label>
                <select
                  id="reviewerStatus"
                  className="flex-1 px-4 py-3 border-2 border-black rounded-2xl text-base md:text-lg outline-none"
                  value={status}
                  onChange={(e) => {
                    const next = e.target.value;

                    if (isNumbered && next === "scheduled") {
                      setShowCannotSchedule(true);
                      return;
                    }

                    if (!isNumbered && String(next).toLowerCase() === "posted" && !wasPosted) {
                      openArchiveConfirm(() => {
                        runWithoutDirty(() => setStatus("posted"));
                      });
                      return;
                    }

                    setStatus(next);
                    markDirty();
                  }}
                  disabled={isViewer}
                >
                  {STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {STATUS_LABELS[s.value] ?? s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled block — only if not numbered */}
              {status === "scheduled" && !isNumbered && (
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
                          markDirty();
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
                          markDirty();
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
        <div className="relative z-0">
          <ViewPort
            sizes={{
              lg: { width: 600, height: 545 },
              xl: { width: 675, height: 545 },
              "2xl": { width: 600, height: 570 },
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
      </div>

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        visible={showSubmitConfirm}
        title={isEditing ? "Save Changes?" : "Submit Article?"}
        message="Are you sure you want to proceed?"
        onConfirm={() => {
          console.log("[ConfirmDialog] onConfirm -> handleSubmit");
          setIsSaving(true); // prevent blocker while submit runs
          handleSubmit({ preventDefault: () => {} });
          setShowSubmitConfirm(false);
          setShowDraftPrompt(false);
          setDraftToLoad(null);
          setErrors({});
        }}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      {/* Draft Prompt Modal */}
      {showDraftPrompt && draftToLoad && !shouldShowReviewer && (
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
                  setDismissedDraftHash(draftKey, draftToLoad?.draft?.hash || "");
                  setDraftToLoad(null);

                  if (articleId) {
                    try {
                      const response = await getArticle(articleId);
                      const data = response.data;

                      runWithoutDirty(() => {
                        setArticle(data);
                        setIsEditing(true);
                        setEditingArticleId(data.article_id);

                        setTitle(capFirst(data.title || "")); // normalize from server
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
                      });
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
                  const { draft } = draftToLoad;

                  runWithoutDirty(() => {
                    setTitle(capFirst(draft.data.title || "")); // normalize from draft
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
                  });

                  setShowDraftPrompt(false);
                  setDraftToLoad(null);

                  if (articleId) {
                    try {
                      const response = await getArticle(articleId);
                      const data = response.data;

                      runWithoutDirty(() => {
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
                      });
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

      {/* POPUPS */}
      <PopupModal
        isOpen={showCannotSchedule}
        onClose={() => setShowCannotSchedule(false)}
        title="Scheduling is locked"
        message="This article already has archive numbers. Scheduling can’t be changed anymore."
        buttonText="Okay"
        type="warning"
      />

      <PopupModal
        isOpen={showArchiveConfirm}
        onClose={() => {
          const action = confirmActionRef.current;
          setShowArchiveConfirm(false);
          confirmActionRef.current = null;
          if (typeof action === "function") action();
        }}
        title="Assign archive numbers?"
        message="Setting status to Posted will permanently assign archive numbers (Vol./No.). After that, content type and scheduling window can no longer be changed. Continue?"
        buttonText="Continue"
        type="info"
      />

      <PopupModal
        isOpen={showImageSizeModal}
        onClose={() => setShowImageSizeModal(false)}
        title="Image Too Large"
        message={imageSizeMsg}
        buttonText="Got it"
        type="warning"
      />

      <PopupModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          title="Missing required fields"
          message={validationMsg}
          buttonText="Got it"
          type="warning"
        />
      {/* === Leave modal using your Modal / design (Save / Don’t Save / Cancel) === */}
      <Modal
        isOpen={showLeaveDialog}
        onClose={() => {
          // overlay/ESC/X act like Cancel
          setShowLeaveDialog(false);
        }}
        title="Save changes before leaving?"
        type="question"
        theme="light"
      >
        <div className="text-lg text-gray-900 mb-6">
          You have unsaved changes. Do you want to save?
        </div>

        <div className="flex justify-end gap-2">
          {/* Cancel */}
          <button
            onClick={() => setShowLeaveDialog(false)}
            className="px-4 py-2 text-gray-700 cursor-pointer border border-gray-700 hover:text-black bg-gray-100 rounded-sm transition-colors"
          >
            Cancel
          </button>
          {/* Don’t Save */}
          <button
            onClick={() => {
              setSuppressAutosave(true);       // stop draft autosave
              clearDraft(draftKey);            // clear drafts
              clearDraft("new-article-draft");
              setIsSaving(true);               // prevent blocker
              bypassBlockRef.current = true;   // prevent blocker
              setIsDirty(false);
              setShowLeaveDialog(false);
              nextNavRef.current?.();          // perform the blocked navigation
            }}
            className="px-4 py-2 text-gray-700 cursor-pointer border border-gray-700 hover:text-black bg-gray-100 rounded-sm transition-colors"
          >
            Don’t Save
          </button>

          {/* Save */}
          <button
            onClick={async () => {
              console.log("[LeaveModal] Save clicked");
              setIsSaving(true);
              bypassBlockRef.current = true;
              const ok = await saveArticle({ skipNavigate: true });
              if (ok) {
                setShowLeaveDialog(false);
                setIsDirty(false);
                nextNavRef.current?.();
              } else {
                // if save failed, let user decide again
                setIsSaving(false);
                bypassBlockRef.current = false;
              }
            }}
            className="px-4 py-2 cursor-pointer bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition-colors"
          >
            Save
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ArticleEditorForm;
