import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import Toast from "@/features/Toast";
import { TableHeaderContainer, SummaryPanel, SearchBar, CardDropdownPicker } from "@/features/Utilities";
import FeedbackListRow from "./FeedbackListRow";
import FeedbackDetailPanel from "./FeedbackDetailPanel";
import ListRenderer from "@/components/tables/ListRenderer";
import useToast from "@/components/commons";
import { formatDateForDisplay } from "@/components/commons";

const statusTabs = [
  { key: "all", label: "All" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "COMPLETED", label: "Completed" },
];

const headers = [
  { label: "Visitor Name", width: "1fr" },
  { label: "Appointment", width: 16 },
  { label: "Overall Rating", width: 14 },
  { label: "Status", width: 12 },
  { label: "Submitted", width: 12 },
];

export default function Feedbacks() {
  const { appointmentId: paramId } = useParams();
  const navigate = useNavigate();

  // State
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedDate, setSelectedDate] = useState(null);

  // Preview panel
  const [isPreview, setIsPreview] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState(null);

  const { showToast } = useToast();

  // Helper to format date for API
  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Load feedbacks based on whether we have an appointment ID or load all
  const fetchFeedbacksForAppointment = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/feedback/appointment/${id}/all`);
      setAllFeedbacks(res.data.feedbackList || []);
    } catch (err) {
      console.error("Error fetching appointment feedbacks:", err);
      setError(err.response?.data?.message || "Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/feedback`;
      const params = new URLSearchParams();
      if (selectedDate) {
        const dateParam = formatDateForAPI(selectedDate);
        if (dateParam) params.set("date_from", dateParam);
      }
      if (params.toString()) url += `?${params.toString()}`;

      const res = await axiosClient.get(url);
      setAllFeedbacks(Array.isArray(res.data) ? res.data : res.data?.feedbackList || []);
    } catch (err) {
      console.error("Error fetching all feedbacks:", err);
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || "Failed to load feedbacks");
      }
      setAllFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) {
      const parsed = parseInt(paramId);
      if (!isNaN(parsed)) {
        fetchFeedbacksForAppointment(parsed);
      }
    } else {
      fetchAllFeedbacks();
    }
  }, [paramId, selectedDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const ratingFields = [
      'accessibility_booking', 'accessibility_availability', 'staff_helpfulness',
      'staff_communication', 'facility_cleanliness', 'facility_comfort',
      'process_clarity', 'process_timeliness', 'service_expectations', 'service_quality'
    ];

    const totalFeedbacks = allFeedbacks.length;
    const byStatus = {
      SUBMITTED: allFeedbacks.filter(f => f.feedback_status === 'SUBMITTED').length,
      REVIEWED: allFeedbacks.filter(f => f.feedback_status === 'REVIEWED').length,
      RESPONDED: allFeedbacks.filter(f => f.feedback_status === 'RESPONDED').length,
      RESOLVED: allFeedbacks.filter(f => f.feedback_status === 'RESOLVED').length,
    };

    let totalRating = 0;
    let ratingCount = 0;
    allFeedbacks.forEach(f => {
      const ratings = ratingFields
        .map(field => f[field])
        .filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
      if (ratings.length > 0) {
        totalRating += ratings.reduce((a, b) => a + b, 0);
        ratingCount += ratings.length;
      }
    });
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 'N/A';

    return [
      { label: "Total Feedbacks", Value: String(totalFeedbacks) },
      { label: "Average Rating", Value: String(avgRating) },
      { label: "Submitted", Value: String(byStatus.SUBMITTED) },
      { label: "Reviewed", Value: String(byStatus.REVIEWED) },
      { label: "Responded", Value: String(byStatus.RESPONDED) },
      { label: "Resolved", Value: String(byStatus.RESOLVED) },
    ];
  }, [allFeedbacks]);

  // Filter and sort feedbacks
  const filteredFeedbacks = useMemo(() => {
    let filtered = allFeedbacks;

    // Tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(f => f.feedback_status === activeTab);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        (f.visitor_name && f.visitor_name.toLowerCase().includes(q)) ||
        (f.visitor_email && f.visitor_email.toLowerCase().includes(q)) ||
        (f.visitor_phone && f.visitor_phone.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [allFeedbacks, activeTab, searchQuery]);

  const sortedFeedbacks = useMemo(() => {
    const sorted = [...filteredFeedbacks];

    sorted.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case "date":
          compareResult = new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
          break;
        case "name":
          compareResult = (a.visitor_name || "").localeCompare(b.visitor_name || "");
          break;
        case "rating":
          const getRating = (f) => {
            const fields = ['accessibility_booking', 'accessibility_availability', 'staff_helpfulness',
              'staff_communication', 'facility_cleanliness', 'facility_comfort',
              'process_clarity', 'process_timeliness', 'service_expectations', 'service_quality'];
            const ratings = fields.map(field => f[field]).filter(v => v !== null);
            return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
          };
          compareResult = getRating(a) - getRating(b);
          break;
        default:
          compareResult = 0;
      }

      return sortDir === "desc" ? -compareResult : compareResult;
    });

    return sorted;
  }, [filteredFeedbacks, sortBy, sortDir]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      showToast(`Filtering data for ${formatDateForDisplay(date)}`, "info");
    } else {
      showToast("Showing all dates", "info");
    }
  };

  // Calculate display data
  const summaryData = useMemo(() => {
    const byStatus = {
      SUBMITTED: allFeedbacks.filter(f => f.feedback_status === 'SUBMITTED').length,
      COMPLETED: allFeedbacks.filter(f => f.feedback_status === 'COMPLETED').length,
    };

    const ratingFields = [
      'accessibility_booking', 'accessibility_availability', 'staff_helpfulness',
      'staff_communication', 'facility_cleanliness', 'facility_comfort',
      'process_clarity', 'process_timeliness', 'service_expectations', 'service_quality'
    ];

    let totalRating = 0;
    let ratingCount = 0;
    allFeedbacks.forEach(f => {
      const ratings = ratingFields
        .map(field => f[field])
        .filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
      if (ratings.length > 0) {
        totalRating += ratings.reduce((a, b) => a + b, 0);
        ratingCount += ratings.length;
      }
    });
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 'N/A';

    return [
      { label: "Total Feedbacks", value: allFeedbacks.length },
      { label: "Average Rating", value: avgRating },
      { label: "Submitted", value: byStatus.SUBMITTED },
      { label: "Completed", value: byStatus.COMPLETED },
    ];
  }, [allFeedbacks]);

  // Only show side panel if not viewing appointment-specific feedbacks
  const showSummaryPanel = !paramId;

  return (
    <>
      <div className="w-full h-full flex gap-x-4 overflow-hidden lg:flex-row flex-col">
        {showSummaryPanel && (
          <SummaryPanel
            tabs={statusTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="Total Feedbacks"
            totalCount={allFeedbacks.length}
            dateLabel={formatDateForDisplay(selectedDate || new Date())}
            summaryData={summaryData}
          />
        )}

        <div className="flex-1 h-full flex flex-col min-w-0 gap-y-7">
          {/* Controls */}
          <div className="w-full min-h-[3.2rem] flex gap-x-3 items-center flex-wrap">
            <TimelineDatePicker
              defaultValue={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
              onDateChange={(dateString) =>
                handleDateChange(dateString ? new Date(dateString) : null)
              }
              theme="light"
            />
            <div className="[&_input]:text-black [&_input]:placeholder-gray-500">
              <SearchBar
                theme="light"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feedbacks"
              />
            </div>

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
                { value: "date|asc", label: "Date (Oldest First)" },
                { value: "date|desc", label: "Date (Newest First)" },
                { value: "name|asc", label: "Visitor Name (A-Z)" },
                { value: "name|desc", label: "Visitor Name (Z-A)" },
                { value: "rating|asc", label: "Rating (Low-High)" },
                { value: "rating|desc", label: "Rating (High-Low)" },
              ]}
            />
          </div>

          {/* Table */}
          <div className="w-full flex flex-col flex-1 min-h-0">
            <TableHeaderContainer headers={headers} />
            <div className="w-full flex-1 border-y overflow-y-auto border-gray-400">
              <ListRenderer
                isLoading={loading}
                error={error}
                items={sortedFeedbacks}
                emptyMessage="No feedbacks available"
                renderItem={(feedback) => (
                  <div
                    key={feedback.id}
                    onClick={() => {
                      setActiveFeedbackId(feedback.id);
                      setIsPreview(true);
                    }}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <FeedbackListRow
                      feedback={feedback}
                      headers={headers}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Side panel preview - similar to Appointments */}
        {isPreview === true && activeFeedbackId && (
          <div className="w-full max-w-[35rem] h-[99%] shadow-md shadow-gray-700 rounded-md flex flex-col mt-[2px] mr-[.5rem]">
            <div className="min-h-[4rem] flex pl-5 pr-3 rounded-md items-center bg-black justify-between">
              <div className="flex gap-x-2 items-center">
                <span className="text-xl text-white font-md">
                  Feedback Details
                </span>
                <span
                  className={`text-white text-md font-md px-2 py-1 rounded-md ${(() => {
                    const status = allFeedbacks.find(f => f.id === activeFeedbackId)?.feedback_status;
                    const statusColors = {
                      SUBMITTED: "bg-blue-600",
                      COMPLETED: "bg-green-600",
                      RESPONDED: "bg-purple-600",
                      RESOLVED: "bg-gray-600",
                    };
                    return statusColors[status] || "bg-gray-500";
                  })()}`}
                >
                  {allFeedbacks.find(f => f.id === activeFeedbackId)?.feedback_status || "Unknown"}
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
                  setActiveFeedbackId(null);
                }}
                className="cursor-pointer"
              >
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M10 10l4 4m0 -4l-4 4" />
              </svg>
            </div>

            <div className="w-full h-full py-10 px-10 overflow-y-auto">
              <FeedbackDetailPanel
                feedback={allFeedbacks.find(f => f.id === activeFeedbackId)}
                onClose={() => {
                  setIsPreview(false);
                  setActiveFeedbackId(null);
                }}
                onSave={() => {
                  fetchAllFeedbacks();
                  setIsPreview(false);
                  setActiveFeedbackId(null);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <Toast />
    </>
  );
}

