import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import Toast from "@/features/Toast";
import { TableHeaderContainer, SearchBar, CardDropdownPicker } from "@/features/Utilities";
import FeedbackListRow from "./FeedbackListRow";
import FeedbackDetailPanelInfo from "./FeedbackDetailPanelInfo";
import ListRenderer from "@/components/tables/ListRenderer";
import useToast from "@/components/commons";
import { formatDateForDisplay } from "@/components/commons";
import {
    FEEDBACK_TYPES,
    getRatingFields,
    calculateOverallRating,
    detectFeedbackType,
} from "./feedbackDimensions";

const FEEDBACK_TABS = [
    { key: "all", label: "All Feedback" },
    { key: "appointment", label: "Appointments" },
    { key: "website", label: "Website" },
];

const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "SUBMITTED", label: "Submitted" },
    { key: "REVIEWED", label: "Reviewed" },
    { key: "RESPONDED", label: "Responded" },
    { key: "RESOLVED", label: "Resolved" },
];

const HEADERS = [
    { label: "Visitor Name", width: "1fr" },
    { label: "Feedback Type", width: 14 },
    { label: "Overall Rating", width: 14 },
    { label: "Status", width: 12 },
    { label: "Submitted", width: 12 },
];

export default function AdminFeedbacks() {
    const navigate = useNavigate();

    // State
    const [allFeedbacks, setAllFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedbackTypeFilter, setFeedbackTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [sortDir, setSortDir] = useState("desc");
    const [selectedDate, setSelectedDate] = useState(null);

    // Side panel state
    const [isPreview, setIsPreview] = useState(false);
    const [activeFeedback, setActiveFeedback] = useState(null);

    // Export modal state
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");
    const [exportStatusFilter, setExportStatusFilter] = useState("all");

    const { showToast } = useToast();

    // Format date for API
    const formatDateForAPI = (date) => {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    // Fetch all feedbacks (both appointment and website)
    const fetchAllFeedbacks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch appointment feedbacks (returns direct array)
            const appointmentRes = await axiosClient.get("/feedback/appointment/all", {
                validateStatus: () => true,
            });
            const appointmentFeedbacks = Array.isArray(appointmentRes.data)
                ? appointmentRes.data.map((f) => ({ ...f, feedback_type: "appointment" }))
                : [];

            // Fetch website feedbacks (returns {feedbackList, summary})
            const websiteRes = await axiosClient.get("/feedback/website/all", {
                validateStatus: () => true,
            });
            const websiteFeedbackList = websiteRes.data?.feedbackList || websiteRes.data || [];
            const websiteFeedbacks = Array.isArray(websiteFeedbackList)
                ? websiteFeedbackList.map((f) => ({ ...f, feedback_type: "website" }))
                : [];

            // Combine and set
            setAllFeedbacks([...appointmentFeedbacks, ...websiteFeedbacks]);
        } catch (err) {
            console.error("Error fetching feedbacks:", err);
            setError("Failed to load feedbacks");
            setAllFeedbacks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchAllFeedbacks();
    }, [fetchAllFeedbacks]);

    // Handle date change
    const handleDateChange = useCallback(
        (date) => {
            setSelectedDate(date);
            if (date) {
                showToast(
                    `Filtering data for ${formatDateForDisplay(date)}`,
                    "info"
                );
            } else {
                showToast("Showing all dates", "info");
            }
        },
        [showToast]
    );

    // Export to Excel handler
    const exportExcel = useCallback(async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            // 1. Determine if we are keeping the current UI filters
            const isDefaultExport = exportStatusFilter === "all";
            const hasDateRange = exportStartDate || exportEndDate;

            if (isDefaultExport && !hasDateRange) {
                // Scenario 1: Default export (mirrors the table content)
                if (searchQuery.trim()) params.set("q", searchQuery.trim());
                if (selectedDate) params.set("date", selectedDate.toISOString().split("T")[0]);
                if (feedbackTypeFilter !== "all") params.set("feedbackType", feedbackTypeFilter);
                if (statusFilter !== "all") params.set("status", statusFilter);
            } else if (!isDefaultExport) {
                // Scenario 2: Export-specific filter (overrides table content)
                params.set("exportStatusFilter", exportStatusFilter);
            }
            // Note: If (isDefaultExport && hasDateRange) is true, we use *only* the date range.

            // 2. Add NEW Date Range Filters (always included if present)
            if (exportStartDate.trim()) params.set("exportStartDate", exportStartDate.trim());
            if (exportEndDate.trim()) params.set("exportEndDate", exportEndDate.trim());

            const url = `/feedback/export?${params.toString()}`;

            const resp = await axiosClient.get(url, {
                responseType: "blob",
                headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
                validateStatus: () => true,
            });

            if (resp.status !== 200) {
                try {
                    const text = await resp.data.text();
                    throw new Error(text || `Export failed (${resp.status})`);
                } catch {
                    throw new Error(`Export failed (${resp.status})`);
                }
            }

            const blob = new Blob([resp.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const link = document.createElement("a");
            const href = URL.createObjectURL(blob);
            link.href = href;
            link.download = `feedback_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(href);

            showToast("Feedback exported successfully.", "success");
            setIsExportModalOpen(false);
        } catch (e) {
            console.error("[AdminFeedbacks] export error:", e);
            showToast("Export failed. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    }, [feedbackTypeFilter, statusFilter, searchQuery, selectedDate, exportStatusFilter, exportStartDate, exportEndDate, showToast]);

    // Summary statistics
    const stats = useMemo(() => {
        const total = allFeedbacks.length;
        const appointment = allFeedbacks.filter(
            (f) => f.feedback_type === "appointment"
        ).length;
        const website = allFeedbacks.filter(
            (f) => f.feedback_type === "website"
        ).length;
        const submitted = allFeedbacks.filter(
            (f) => f.feedback_status === "SUBMITTED"
        ).length;
        const reviewed = allFeedbacks.filter(
            (f) => f.feedback_status === "REVIEWED"
        ).length;

        // Calculate average rating (across all feedbacks)
        let totalRating = 0;
        let ratingCount = 0;
        allFeedbacks.forEach((f) => {
            const rating = calculateOverallRating(f, f.feedback_type);
            if (rating !== "N/A") {
                totalRating += parseFloat(rating);
                ratingCount += 1;
            }
        });
        const avgRating =
            ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : "N/A";

        return [
            { label: "Total Feedbacks", Value: String(total) },
            { label: "Average Rating", Value: String(avgRating) },
            { label: "Appointment", Value: String(appointment) },
            { label: "Website", Value: String(website) },
            { label: "Submitted", Value: String(submitted) },
            { label: "Reviewed", Value: String(reviewed) },
        ];
    }, [allFeedbacks]);

    // Filter feedbacks
    const filteredFeedbacks = useMemo(() => {
        let filtered = allFeedbacks;

        // Feedback type filter
        if (feedbackTypeFilter !== "all") {
            filtered = filtered.filter(
                (f) => f.feedback_type === feedbackTypeFilter
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((f) => f.feedback_status === statusFilter);
        }

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (f) =>
                    (f.visitor_name && f.visitor_name.toLowerCase().includes(q)) ||
                    (f.visitor_email && f.visitor_email.toLowerCase().includes(q)) ||
                    (f.visitor_phone && f.visitor_phone.toLowerCase().includes(q))
            );
        }

        // Date filter
        if (selectedDate) {
            const dateStr = selectedDate.toISOString().split("T")[0];
            filtered = filtered.filter((f) => {
                const feedDate = (
                    f.submitted_at ||
                    f.created_at ||
                    ""
                ).split("T")[0];
                return feedDate === dateStr;
            });
        }

        return filtered;
    }, [allFeedbacks, feedbackTypeFilter, statusFilter, searchQuery, selectedDate]);

    // Sort feedbacks
    const sortedFeedbacks = useMemo(() => {
        const sorted = [...filteredFeedbacks];

        sorted.sort((a, b) => {
            let compareResult = 0;

            switch (sortBy) {
                case "date":
                    compareResult =
                        new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
                    break;
                case "name":
                    compareResult = (a.visitor_name || "").localeCompare(
                        b.visitor_name || ""
                    );
                    break;
                case "rating":
                    const ratingA = parseFloat(calculateOverallRating(a, a.feedback_type));
                    const ratingB = parseFloat(calculateOverallRating(b, b.feedback_type));
                    compareResult = ratingA - ratingB;
                    break;
                case "type":
                    compareResult = (a.feedback_type || "").localeCompare(
                        b.feedback_type || ""
                    );
                    break;
                default:
                    compareResult = 0;
            }

            return sortDir === "desc" ? -compareResult : compareResult;
        });

        return sorted;
    }, [filteredFeedbacks, sortBy, sortDir]);

    // Export Modal Component
    const ExportModal = ({ isOpen, onClose }) => {
        if (!isOpen) return null;

        const totalCount = sortedFeedbacks.length;
        const appointmentCount = sortedFeedbacks.filter((f) => f.feedback_type === "appointment").length;
        const websiteCount = sortedFeedbacks.filter((f) => f.feedback_type === "website").length;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl shadow-2xl min-w-[35rem] max-w-lg">

                    {/* Modal Header */}
                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h3 className="text-2xl font-bold">Export Feedback to Excel</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">
                            &times;
                        </button>
                    </div>

                    <p className="mb-4 text-sm text-gray-600">
                        Choose filters below to scope your export. Your current filters are applied by default.
                    </p>

                    {/* Feedback Type Filter */}
                    <div className="mb-5">
                        <label className="text-lg font-semibold text-gray-800 block mb-2">1. Filter by Feedback Type</label>
                        <select
                            className="w-full h-10 px-3 rounded-lg border border-gray-400 text-base font-medium cursor-pointer"
                            value={exportStatusFilter}
                            onChange={(e) => setExportStatusFilter(e.target.value)}
                            disabled={loading}
                        >
                            <option value="all">All Feedback Types</option>
                            <option value="appointment">Appointment Only</option>
                            <option value="website">Website Only</option>
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="mb-6">
                        <label className="text-lg font-semibold text-gray-800 block mb-2">2. Filter by Submitted Date Range</label>
                        <div className="flex space-x-4">
                            <input
                                type="date"
                                className="w-1/2 h-10 px-3 rounded-lg border border-gray-400 text-base"
                                placeholder="Start Date"
                                value={exportStartDate}
                                onChange={(e) => setExportStartDate(e.target.value)}
                                disabled={loading}
                            />
                            <input
                                type="date"
                                className="w-1/2 h-10 px-3 rounded-lg border border-gray-400 text-base"
                                placeholder="End Date"
                                value={exportEndDate}
                                onChange={(e) => setExportEndDate(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Export Preview / Totals Section */}
                    <div className="p-4 bg-black text-white rounded-lg mb-6">
                        <h4 className="text-xl font-bold mb-3 border-b border-gray-600 pb-2">Export Report Preview</h4>
                        <div className="grid grid-cols-2 gap-y-2 font-medium">
                            <span className="text-gray-300">Total Feedbacks in Export:</span>
                            <span className="text-right text-3xl font-extrabold">{totalCount}</span>

                            <span className="text-gray-400 mt-2">Appointment Feedback:</span>
                            <span className="text-right mt-2">{appointmentCount}</span>

                            <span className="text-gray-400">Website Feedback:</span>
                            <span className="text-right">{websiteCount}</span>
                        </div>
                    </div>

                    {/* Modal Footer: Buttons (lower right) */}
                    <div className="flex justify-end pt-3">
                        <button
                            onClick={onClose}
                            className="h-10 px-4 rounded-lg text-lg font-semibold mr-3 border border-gray-400 text-gray-800 hover:bg-gray-100"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={exportExcel}
                            disabled={loading || totalCount === 0}
                            className={`h-10 px-4 rounded-lg text-lg font-semibold 
                                ${loading || totalCount === 0 ? "opacity-60 cursor-not-allowed bg-gray-600" : "cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"}`}
                        >
                            {loading ? "Exporting..." : "⬇️ Export to Excel"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Export Modal */}
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />

            <div className="w-full h-full flex gap-2 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 h-full flex flex-col overflow-hidden">
                    {/* Summary Cards */}
                    <div className="flex-shrink-0 flex-wrap flex gap-7 items-center justify-center px-10 py-10">
                        {stats.map(({ label, Value }) => (
                            <div
                                key={label}
                                className="w-70 rounded-xl h-25 text-white bg-black font-semibold flex flex-col items-center justify-center"
                            >
                                <span className="text-sm">{label}</span>
                                <span className="text-5xl">{Value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 flex flex-col gap-y-7 overflow-hidden px-10">
                        {/* Feedback Type Tabs */}
                        <div className="flex-shrink-0 min-w-[40rem] min-h-[3.2rem] flex items-center gap-x-3 flex-wrap">
                            {FEEDBACK_TABS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    className={`w-fit cursor-pointer h-full px-4 rounded-lg border-1 text-xl font-semibold ${feedbackTypeFilter === key
                                        ? "bg-black text-white border-black"
                                        : "border-gray-500 text-gray-800 hover:border-gray-700"
                                        }`}
                                    onClick={() => setFeedbackTypeFilter(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Control Bar */}
                        <div className="flex-shrink-0 min-w-[100rem] min-h-[3.2rem] gap-x-5 flex items-start flex-wrap">
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-[3.1em] px-3 rounded-lg border border-[#353535] text-base font-medium cursor-pointer bg-white"
                            >
                                {STATUS_TABS.map(({ key, label }) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                            {/* Date Picker */}
                            <TimelineDatePicker
                                defaultValue={
                                    selectedDate ? selectedDate.toISOString().split("T")[0] : ""
                                }
                                onDateChange={(ds) =>
                                    handleDateChange(ds ? new Date(ds) : null)
                                }
                                theme="light"
                            />

                            {/* Search Bar */}
                            <div className="[&_input]:text-black [&_input]:placeholder-gray-500">
                                <SearchBar
                                    theme="light"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, email, or phone"
                                />
                            </div>

                            {/* Sort Picker */}
                            <CardDropdownPicker
                                value={`${sortBy}|${sortDir}`}
                                onChange={(value) => {
                                    const [column, direction] = value.split("|");
                                    setSortBy(column);
                                    setSortDir(direction || "asc");
                                }}
                                placeholder="Sort By..."
                                theme="light"
                                options={[
                                    { value: "", label: "Sort By..." },
                                    { value: "date|desc", label: "Date (Newest First)" },
                                    { value: "date|asc", label: "Date (Oldest First)" },
                                    { value: "name|asc", label: "Visitor Name (A-Z)" },
                                    { value: "name|desc", label: "Visitor Name (Z-A)" },
                                    { value: "rating|desc", label: "Rating (High-Low)" },
                                    { value: "rating|asc", label: "Rating (Low-High)" },
                                    { value: "type|asc", label: "Feedback Type (A-Z)" },
                                ]}
                            />

                            {/* Export Button */}
                            <div className="ml-auto">
                                <button
                                    onClick={() => setIsExportModalOpen(true)}
                                    disabled={loading}
                                    className={`h-full px-6 py-2 rounded-lg border-1 text-2xl font-semibold
                                        ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                                        bg-black text-white border-black hover:bg-gray-900`}
                                    title="Export feedbacks to Excel"
                                >
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="w-full flex-1 flex flex-col min-h-0">
                            <TableHeaderContainer headers={HEADERS} />
                            <div className="w-full flex-1 overflow-y-auto border-y border-gray-400">
                                <ListRenderer
                                    isLoading={loading}
                                    error={error}
                                    items={sortedFeedbacks}
                                    emptyMessage="No feedbacks found"
                                    renderItem={(feedback) => (
                                        <div
                                            key={`${feedback.feedback_type}-${feedback.id}`}
                                            onClick={() => {
                                                setActiveFeedback(feedback);
                                                setIsPreview(true);
                                            }}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <FeedbackListRow
                                                feedback={feedback}
                                                headers={HEADERS}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Panel Detail View */}
                {isPreview && activeFeedback && (
                    <div className="w-full max-w-[35rem] h-[99%] shadow-md shadow-gray-700 rounded-md flex flex-col mt-[2px] mr-[.5rem]">
                        <div className="flex-shrink-0 min-h-[4rem] flex pl-5 pr-3 items-center bg-black justify-between rounded-t-md">
                            <div className="flex gap-x-2 items-center">
                                <span className="text-xl text-white font-md">
                                    Feedback Details
                                </span>
                                {(() => {
                                    const feedback = activeFeedback;
                                    const statusColors = {
                                        SUBMITTED: "bg-blue-600",
                                        REVIEWED: "bg-green-600",
                                        RESPONDED: "bg-purple-600",
                                        RESOLVED: "bg-gray-600",
                                    };
                                    return (
                                        <span
                                            className={`text-white text-md font-md px-2 py-1 rounded-md ${statusColors[feedback?.feedback_status] || "bg-gray-500"
                                                }`}
                                        >
                                            {feedback?.feedback_status || "Unknown"}
                                        </span>
                                    );
                                })()}
                                <span className="text-white text-sm px-2 py-1 rounded-md bg-gray-700">
                                    {(() => {
                                        const feedbackType = detectFeedbackType(activeFeedback);
                                        return feedbackType === FEEDBACK_TYPES.WEBSITE
                                            ? "Website"
                                            : "Appointment";
                                    })()}
                                </span>
                            </div>

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="19"
                                height="19"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                onClick={() => {
                                    setIsPreview(false);
                                    setActiveFeedback(null);
                                }}
                                className="cursor-pointer hover:opacity-80"
                            >
                                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                <path d="M10 10l4 4m0 -4l-4 4" />
                            </svg>
                        </div>

                        <div className="w-full flex-1 px-6 py-6 overflow-y-auto">
                            <FeedbackDetailPanelInfo feedback={activeFeedback} />
                        </div>

                        {/* Open Button - Sticky */}
                        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
                            <button
                                onClick={() => {
                                    const encoded = btoa(`${activeFeedback.id} ${activeFeedback.feedback_type} ${activeFeedback.visitor_name || ''}`);
                                    navigate(`/admin/feedback/view/${encoded}`);
                                }}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                            >
                                Open Full Details
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Toast />
        </>
    );
}
