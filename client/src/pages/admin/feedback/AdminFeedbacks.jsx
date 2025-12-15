import React, { useEffect, useState, useMemo, useCallback } from "react";
import axiosClient from "@/lib/axiosClient";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import Toast from "@/features/Toast";
import { TableHeaderContainer, SearchBar, CardDropdownPicker } from "@/features/Utilities";
import FeedbackListRow from "./FeedbackListRow";
import FeedbackDetailPanel from "./FeedbackDetailPanel";
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
    const [status, setStatus] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

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

    // Initialize action state when activeFeedback changes
    useEffect(() => {
        if (activeFeedback) {
            const statusOptions = ["SUBMITTED", "REVIEWED", "RESPONDED", "RESOLVED"];
            const normalizedStatus = statusOptions.includes(activeFeedback.feedback_status)
                ? activeFeedback.feedback_status
                : "SUBMITTED";
            setStatus(normalizedStatus);
            setAdminNotes(activeFeedback.admin_notes || "");
        }
    }, [activeFeedback]);

    // Handle save action
    const handleSave = useCallback(async () => {
        try {
            setActionLoading(true);

            // Determine the correct endpoint based on feedback type
            const feedbackType = detectFeedbackType(activeFeedback);
            const endpoint = feedbackType === FEEDBACK_TYPES.WEBSITE
                ? `/feedback/website/status/${activeFeedback.id}`
                : `/feedback/appointment/status/${activeFeedback.id}`;

            await axiosClient.put(endpoint, {
                status,
                admin_notes: adminNotes,
            });
            showToast("Feedback status updated", "success");
            fetchAllFeedbacks();
            setIsPreview(false);
            setActiveFeedback(null);
        } catch (err) {
            console.error("Error updating feedback status", err);
            showToast(
                err.response?.data?.message || "Failed to update status",
                "error"
            );
        } finally {
            setActionLoading(false);
        }
    }, [activeFeedback, status, adminNotes, showToast, fetchAllFeedbacks]);

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

    return (
        <>
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
                            <FeedbackDetailPanel
                                feedback={activeFeedback}
                                showActions={false}
                            />
                        </div>

                        {/* Sticky Actions */}
                        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-900"
                                    >
                                        {["SUBMITTED", "REVIEWED", "RESPONDED", "RESOLVED"].map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">Admin Notes</label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add response or notes..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsPreview(false);
                                        setActiveFeedback(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-500 text-white font-semibold rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Toast />
        </>
    );
}
