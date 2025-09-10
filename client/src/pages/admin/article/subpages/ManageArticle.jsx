import { useEffect, useState, useRef, useMemo, useLayoutEffect  } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { X as XIcon, ChevronDown, ChevronRight } from "lucide-react";
import { STATUS, STATUS_LABELS } from "../components/articleStatus";
import ArticlePreview from "../components/ArticlePreview";
import {
  getVolumeFromYYYYMMDD,
  getYearFromYYYYMMDD,
  computeNextSequence,
  makeDisplayLabel,
} from "../components/archiveHelpers";

import { getLocalDateString } from "../../../../utils/scheduleUtils";

const ArticleEditorForm = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
  const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`;
  const { user } = useAuth();
  const routerLocation = useLocation();
  const userRole = user.roleId;
  const allowedRoles = [1, 2, 5];
  const isViewer = userRole === 3;
  const isReviewer = userRole === 4;
  const hasRun = useRef(false);
  const AUTHOR_ALLOWED = new Set(["pending", "scheduled", "posted", "archived"]);
  const navigate = useNavigate();

  const forcedFromNav = routerLocation.state?.forceReviewMode === true;
  const queryParams = new URLSearchParams(routerLocation.search);
  const forceEditorMode = queryParams.get("mode") === "edit";

  // Editor mirror + ref
  const [editorHTML, setEditorHTML] = useState("");
  const [editorText, setEditorText] = useState("");
  const editorRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  // Form state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState(""); 
  const [address, setAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const Categories = ["Article", "Education", "Exhibit", "Contests", "Events", "Other"];
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
  const isPrivileged = [1, 2, 5].includes(user.roleId);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    let startDateTime = '';
    let endDateTime = '';
    const toISOZFromManila = (datePart, timePart, fallbackHHmm = '00:00') => {
      if (!datePart) return '';
      const hhmm = (timePart && timePart.length ? timePart : fallbackHHmm).slice(0, 5);
      const isoWithOffset = `${datePart}T${hhmm}:00+08:00`;
      return new Date(isoWithOffset).toISOString();
    };

    if (status === 'scheduled') {
      startDateTime = toISOZFromManila(uploadPeriodStart, uploadPeriodStartTime, '08:00');
      endDateTime   = toISOZFromManila(uploadPeriodEnd,   uploadPeriodEndTime,   '23:59');

      if (!startDateTime) {
        setErrors((e) => ({ ...e, uploadPeriodStart: 'Start is required for scheduled.' }));
        return;
      }
      if (!endDateTime) {
        setErrors((e) => ({ ...e, uploadPeriodEnd: 'End is required for scheduled.' }));
        return;
      }
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        setErrors((e) => ({ ...e, uploadPeriodEnd: 'End must be after Start.' }));
        return;
      }

      formData.append('uploadPeriodStart', startDateTime);
      formData.append('uploadPeriodEnd', endDateTime);
    }

    if (thumbnail && thumbnail instanceof File) {
      formData.append("thumbnail", thumbnail);
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

    const finalSeqNum = sameBucket
      ? (origSeqNum || "")
      : (computeNextSequence(articles, year, contentType) || "");


    if (finalVolume) formData.append("volume", String(finalVolume));
    if (finalSeqNum) formData.append("sequence_number", String(finalSeqNum));

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


  // re-run guard when id changes
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
          const response = await axiosClient.get(`/auth/articles/${articleId}`);
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
  const handleImageUpload = async (e) => {
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

        editorRef.current?.runChain((chain) =>
    chain.focus().insertContent({
    type: 'image',
    attrs: { src: fullImageUrl, alt: file.name },
  }).run()
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

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!selectedDate) newErrors.selectedDate = "Date is required";
    if (!author.trim()) newErrors.author = "Author is required";
    if (!category) newErrors.category = "Category is required";
    if (!contentType) newErrors.content_type = "Type is required";
    if (!status) newErrors.status = "Status is required";

    if (!editorHTML || editorHTML === "<p></p>") newErrors.description = "Body content is required";

    if (status === "scheduled") {
      if (!uploadPeriodStart) newErrors.uploadPeriodStart = "Start date is required for scheduled.";
      if (!uploadPeriodEnd) newErrors.uploadPeriodEnd = "End date is required for scheduled.";
      if (uploadPeriodStart && uploadPeriodEnd) {
        const start = new Date(`${uploadPeriodStart}T${(uploadPeriodStartTime || "00:00").slice(0,5)}:00+08:00`);
        const end   = new Date(`${uploadPeriodEnd}T${(uploadPeriodEndTime || "23:59").slice(0,5)}:00+08:00`);
        if (end <= start) newErrors.uploadPeriodEnd = "End must be after Start.";
      }
    }

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

  const showBackToReview = isPrivileged && forcedFromNav && !!articleId && forceEditorMode;

  // --- Live archive preview ---
  const volumePreview = useMemo(
    () => getVolumeFromYYYYMMDD(selectedDate),
    [selectedDate]
  );

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

  const seqLabelPreview = useMemo(
    () => makeDisplayLabel(contentType, seqPreview),
    [contentType, seqPreview]
  );

  // ---- Schedule date rules (tile disabler) ----
const manilaTodayISO = useMemo(() => {
  // normalize to Manila midnight, then to yyyy-mm-dd
  const now = new Date();
  const manilaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  manilaNow.setHours(0, 0, 0, 0);
  const y = manilaNow.getFullYear();
  const m = String(manilaNow.getMonth() + 1).padStart(2, "0");
  const d = String(manilaNow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}, []);

const isDateDisabledForSchedule = (isoDate) => {
  if (!isoDate) return false;

  // Rule 1: disallow past dates vs Manila today
  const selected = new Date(`${isoDate}T00:00:00+08:00`);
  const today = new Date(`${manilaTodayISO}T00:00:00+08:00`);
  if (selected < today) return true;

  // Rule 2 (optional): blackout dates example
  // const blackout = new Set(["2025-12-25", "2025-01-01"]);
  // if (blackout.has(isoDate)) return true;

  // Rule 3 (optional): block weekends
  // const dow = selected.getDay();
  // if (dow === 0 || dow === 6) return true;

  return false;
};

const handleStartDateChange = (val) => {
  if (isDateDisabledForSchedule(val)) {
    setErrors((e) => ({ ...e, uploadPeriodStart: "That date isn’t allowed for scheduling." }));
    return;
  }
  setUploadPeriodStart(val);
  setIsDirty(true);
  clearFieldError("uploadPeriodStart");

  // If end is before new start, snap it forward
  if (uploadPeriodEnd && new Date(`${uploadPeriodEnd}T00:00:00+08:00`) < new Date(`${val}T00:00:00+08:00`)) {
    setUploadPeriodEnd(val);
    clearFieldError("uploadPeriodEnd");
  }
};

const handleEndDateChange = (val) => {
  if (isDateDisabledForSchedule(val)) {
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

// Manila-friendly date/time parts
const toManilaParts = (iso) => {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Manila",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Manila",
  });
  return { date, time };
};

const createdParts = useMemo(() => toManilaParts(article?.created_at), [article?.created_at]);
const updatedParts = useMemo(() => toManilaParts(article?.updated_at), [article?.updated_at]);


// prefill author on first render if creating a new article
useEffect(() => {
  if (!isEditing && !author && user) {
    const first = (user.fname || "").trim();
    const last  = (user.lname || "").trim();
    const full  = [first, last].filter(Boolean).join(" ").trim();

    if (full) {
      setAuthor(full);
      // don't mark dirty; it's an auto-fill
    }
  }
}, [isEditing, author, user]);

function Collapsible({ title = "Details", collapsed, onToggle, children }) {
  const bodyRef = useRef(null);

  // When closed: 0. When open and done animating: 'none' (no more measuring while typing).
  const [maxH, setMaxH] = useState(collapsed ? 0 : "none");
  const isFirstRender = useRef(true);
  const isAnimatingRef = useRef(false);

  // Toggle open/close animation
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    // Skip first render to avoid an initial flash
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setMaxH(collapsed ? 0 : "none");
      return;
    }

    const onEnd = () => {
      isAnimatingRef.current = false;
      // After expanding, let height be natural so typing doesn't animate.
      if (!collapsed) setMaxH("none");
      el.removeEventListener("transitionend", onEnd);
    };

    el.addEventListener("transitionend", onEnd);
    isAnimatingRef.current = true;

    if (collapsed) {
      // Collapse: snap to current pixel height, then to 0.
      if (maxH === "none") setMaxH(el.scrollHeight);
      // next frame -> 0 to animate closed
      requestAnimationFrame(() => setMaxH(0));
    } else {
      // Expand: from 0 to content height; once finished, set to 'none'
      const target = el.scrollHeight;
      // If currently at 0, growing to the measured height will animate
      setMaxH(target);
    }

    return () => el.removeEventListener("transitionend", onEnd);
  }, [collapsed]);

  // While expanding (not after), follow content growth (e.g., images load)
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (!collapsed && maxH !== "none" && isAnimatingRef.current) {
      const next = el.scrollHeight;
      if (next !== maxH) setMaxH(next);
    }
    // Intentionally ignore when maxH === 'none' so typing doesn't cause re-animations.
  }, [children, collapsed, maxH]);

  return (
    <div className="rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <span className="font-semibold">{title}</span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className="transition-[max-height] duration-300 ease-in-out overflow-hidden will-change-[max-height]"
        style={{ maxHeight: maxH === "none" ? "none" : `${maxH}px` }}
        aria-hidden={collapsed}
      >
        <div className="p-4 space-y-6">{children}</div>
      </div>
    </div>
  );
}




  return (
    <>
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
          <div className="bg-white w-full p-6  rounded-lg shadow-xl relative max-h-full transition-all duration-300 ">
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

              <Collapsible
  title="Details"
  collapsed={detailsCollapsed}
  onToggle={() => setDetailsCollapsed((v) => !v)}
>
              {/* Title */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
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
              </div>
              </div>
              {/* Date, Author */}
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
              </div>

              {/* Category + Type */}
              <div className="flex flex-col md:flex-row gap-4">
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

                <div className="flex-1">
                  <label htmlFor="contentType" className={`font-bold ${errors.content_type ? "text-red-600" : ""}`}>
                    Type {errors.content_type && "*"}
                  </label>
                  <select
                    id="contentType"
                    className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
                      errors.content_type ? "border-red-600" : "border-black"
                    }`}
                    value={contentType}
                    onChange={(e) => {
                      setContentType(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    <option value="" disabled={contentType !== ""}>Type</option>
                    <option value="article">Article</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              </div>

              {/* Municipality/Barangay only when Event */}
              {contentType === "event" && (
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
  <select
    id="barangay"
    className="w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black disabled:bg-gray-100 disabled:text-gray-500"
    value={barangay}
    onChange={(e) => {
      setBarangay(e.target.value);
      setIsDirty(true);
    }}
    disabled={!municipality || (municipalitiesWithBarangays[municipality]?.length ?? 0) === 0}
  >
    <option value="" disabled>
      {municipality ? "Select Barangay" : "Select Municipality first"}
    </option>

    {(municipalitiesWithBarangays[municipality] || [])
      // optional: sort alphabetically
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((bgy) => (
        <option key={bgy} value={bgy}>
          {bgy}
        </option>
      ))}
  </select>
</div>

                </div>
              )}

              {/* Status */}
              <div className="flex-1">
                <label htmlFor="status" className="font-bold">Status</label>
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
                  {STATUS.filter((s) => AUTHOR_ALLOWED.has(s.value)).map((s) => (
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
      <label htmlFor="uploadPeriodStart" className="font-bold">Start Date</label>
      <div className="flex gap-2">
        <input
          id="uploadPeriodStart"
          type="date"
          className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
            errors.uploadPeriodStart ? "border-red-600" : "border-black"
          }`}
          value={uploadPeriodStart}
          onChange={(e) => handleStartDateChange(e.target.value)}
          // native guard: disable past tiles
          min={manilaTodayISO}
          aria-invalid={!!errors.uploadPeriodStart}
          title={errors.uploadPeriodStart || ""}
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
      <label htmlFor="uploadPeriodEnd" className="font-bold">End Date</label>
      <div className="flex gap-2">
        <input
          id="uploadPeriodEnd"
          type="date"
          className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
            errors.uploadPeriodEnd ? "border-red-600" : "border-black"
          }`}
          value={uploadPeriodEnd}
          onChange={(e) => handleEndDateChange(e.target.value)}
          // native guard: end cannot be before start and cannot be in the past
          min={uploadPeriodStart || manilaTodayISO}
          aria-invalid={!!errors.uploadPeriodEnd}
          title={errors.uploadPeriodEnd || ""}
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
                  <label htmlFor="thumbnail" className="font-bold">Thumbnail</label>
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
</Collapsible>
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
                      onClick={() => handleSummarizeCaption(editorText, setCaption, setIsSummarizing, BASE_URL)}
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

  {/* Moved: Change Status (replaces 'Current Status') */}
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

    {/* Scheduled block: keep your tile-disabler version here */}
    {status === "scheduled" && (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <label htmlFor="uploadPeriodStart" className="font-bold">Start Date</label>
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
            <label htmlFor="uploadPeriodStartTime" className="font-bold">Start Time</label>
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
            <label htmlFor="uploadPeriodEnd" className="font-bold">End Date</label>
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
            <label htmlFor="uploadPeriodEndTime" className="font-bold">End Time</label>
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
            // md: { width: 400,  height: 400 },
            lg: { width: 500, height: 545 },
            xl: { width: 600, height: 545 },
            "2xl": { width: 750, height: 545 },
            "3xl": { width: 800, height: 725 },
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
                      const response = await axiosClient.get(`/auth/articles/${articleId}`);
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
