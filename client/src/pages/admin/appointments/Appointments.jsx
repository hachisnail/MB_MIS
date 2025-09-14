import React, { useState, useEffect, useMemo } from "react";
import { useSocketClient } from "@/context/authContext";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import Toast from "@/features/Toast";
import { SearchBar, CardDropdownPicker } from "@/features/Utilities";
import AppointmentListRow from "./components/AppointmentListRow";
import VisitorRecordListRow from "./components/VisitorRecordListRow";
import { AppointmentPreview } from "./components/AppointmentsList";
import { standardizeStatus, normalizeStatus } from "./components/statusUtils";
import { formatDateForDisplay } from "@/components/commons";
import { TableHeaderContainer, SummaryPanel } from "../../../features/Utilities";
import ListRenderer from "../../../components/tables/ListRenderer";
import useToast from "../../../components/commons";

const Appointments = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State management
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [visitorRecords, setVisitorRecords] = useState([]);
  const [stats, setStats] = useState({
    approved: 0,
    rejected: 0,
    completed: 0,
    failed: 0,
    expectedVisitors: 0,
    present: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || "pending";
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [columnFilter, setColumnFilter] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isPreview, setIsPreview] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState(null);

  // Toast
  const { toastConfig, showToast, hideToast } = useToast();

  const socket = useSocketClient();

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "forms", label: "Forms" },
    { key: "visitorRecords", label: "Visitor Records" },
  ];

  const appointmentHeaders = [
    { label: "Creation Date", width: 19 },
    { label: "Visitor Name", width: "1fr" },
    { label: "Preferred Time", width: 13 },
    { label: "Status", width: 9.5 },
    { label: "Visitor Count", width: 12 },
    { label: "Last Updated", width: 16 },
  ];

  const pendingHeaders = [
    { label: "Creation Date", width: 19 },
    { label: "Visitor Name", width: "1fr" },
    { label: "Preferred Time", width: 13 },
    { label: "Status", width: 9.5 },
    { label: "Visitor Count", width: 12 },
  ];

  const visitorHeaders = [
    { label: "Date", width: "1fr" },
    { label: "Visitors", width: "1fr" },
    { label: "Visitor Count", width: 39 },
  ];

  const headersMap = {
    forms: appointmentHeaders,
    pending: pendingHeaders,
    visitorRecords: visitorHeaders,
  };

  // Update active tab when location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Helper function to format date for API
  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Data fetching
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let url = `/auth/appointment`;
      if (selectedDate) {
        const dateParam = formatDateForAPI(selectedDate);
        if (dateParam) {
          url += `?date=${dateParam}`;
        }
      }
      const response = await axiosClient.get(url);
      setAppointments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments. Check that the API server is running.");
      setAppointments([]);
    }
  };



  const fetchStats = async () => {
    try {
      let url = `/auth/appointment/stats`;
      if (selectedDate) {
        const dateParam = formatDateForAPI(selectedDate);
        if (dateParam) {
          url += `?date=${dateParam}`;
        }
      }
      const response = await axiosClient.get(url);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchVisitorRecords = async () => {
    try {
      let url = `/auth/visitor-records`;
      if (selectedDate) {
        const dateParam = formatDateForAPI(selectedDate);
        if (dateParam) {
          url += `?date=${dateParam}`;
        }
      }
      const response = await axiosClient.get(url);
      setVisitorRecords(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching visitor records:", error);
      setVisitorRecords([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchAppointments(),
        fetchStats(),
        fetchVisitorRecords(),
      ]);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedDate]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleAppointmentChange = () => {
      fetchAllData();
    };

    socket.onDbChange("Appointment", "*", handleAppointmentChange);
    socket.onDbChange("AppointmentStatus", "*", handleAppointmentChange);
    socket.onDbChange("Visitor", "*", handleAppointmentChange);

    return () => {
      socket.offDbChange("Appointment", "*", handleAppointmentChange);
      socket.offDbChange("AppointmentStatus", "*", handleAppointmentChange);
      socket.offDbChange("Visitor", "*", handleAppointmentChange);
    };
  }, [socket]);

  // Event handlers
  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      showToast(`Filtering data for ${formatDateForDisplay(date)}`, "info");
    } else {
      showToast("Showing all dates", "info");
    }
  };


  // Filter appointments based on search, status, and tab
  const filteredAppointments = appointments.filter((appt) => {
    const searchLower = searchQuery.toLowerCase();

    // Tab filter - use normalized status for consistent checking
    let matchesTab = true;
    if (activeTab === "pending") {
      const normalizedStatus = normalizeStatus(appt.AppointmentStatus?.status);
      matchesTab = normalizedStatus === "PENDING" || normalizedStatus === "APPROVED";
    } else if (activeTab === "forms") {
      const normalizedStatus = normalizeStatus(appt.AppointmentStatus?.status);
      matchesTab = normalizedStatus !== "PENDING" && normalizedStatus !== "APPROVED";
    }

    // Search filter
    const matchesSearch = !searchQuery ||
      (appt.Visitor?.first_name || "").toLowerCase().includes(searchLower) ||
      (appt.Visitor?.last_name || "").toLowerCase().includes(searchLower) ||
      (appt.preferred_time || "").toLowerCase().includes(searchLower) ||
      (appt.AppointmentStatus?.status || "").toLowerCase().includes(searchLower);

    // Status filter - use standardized status for display comparison
    const matchesStatus = statusFilter === "All Statuses" ||
      standardizeStatus(appt.AppointmentStatus?.status || "PENDING") === statusFilter;

    return matchesTab && matchesSearch && matchesStatus;
  });

  
  // --- De-dupe helpers ---
  // normalize for safe comparisons
  const norm = (s) => (s || "").trim().toLowerCase();

  // build a key using name + email
  const makeKey = (name, email) => `${norm(name)}|${norm(email)}`;

  // merge multiple visitor records that share same name+email
  const dedupeVisitorRecords = (records, appointments) => {
    if (!Array.isArray(records) || !records.length) return [];

    // Build a map of visitorId -> email using the appointments payload
    // Appointments include: appt.Visitor?.email (from backend)
    const emailByVisitorId = new Map();
    for (const appt of Array.isArray(appointments) ? appointments : []) {
      const vid = appt?.Visitor?.visitor_id;
      const em = appt?.Visitor?.email;
      if (vid != null && em) emailByVisitorId.set(vid, em);
    }

    const bucket = new Map();
    for (const rec of records) {
      const email = emailByVisitorId.get(rec.id) || ""; // fallback if not found
      const key = makeKey(rec.visitorName, email);

      if (!bucket.has(key)) {
        bucket.set(key, {
          ...rec,
          email,              // keep email for filtering/display
          visitCount: rec.visitCount || 0,
          details: Array.isArray(rec.details) ? [...rec.details] : []
        });
      } else {
        const acc = bucket.get(key);
        acc.visitCount = (acc.visitCount || 0) + (rec.visitCount || 0);
        if (Array.isArray(rec.details)) {
          acc.details = acc.details.concat(rec.details);
        }
      }
    }

    // (optional) sort details inside each merged row by date desc
    for (const row of bucket.values()) {
      row.details?.sort?.((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    return Array.from(bucket.values());
  };


  // Filter visitor records

  const dedupedVisitorRecords = useMemo(
    () => dedupeVisitorRecords(visitorRecords, appointments),
    [visitorRecords, appointments]
  );

  const filteredVisitorRecords = dedupedVisitorRecords.filter((record) => {
    if (!searchQuery || activeTab !== "visitorRecords") return true;

    const searchLower = searchQuery.toLowerCase();
    return (record.visitorName || "").toLowerCase().includes(searchLower) ||
      (record.email || "").toLowerCase().includes(searchLower) ||
      (record.date ? record.date.toString().toLowerCase() : "").includes(searchLower);
  });


  // Sort data
  const sortData = (data, type) => {
    if (!columnFilter || !data.length) return data;

    return [...data].sort((a, b) => {
      let compareResult = 0;

      if (type === "appointments") {
        switch (columnFilter) {
          case "creation_date":
            compareResult = new Date(a.creation_date) - new Date(b.creation_date);
            break;
          case "visitor_name":
            const nameA = `${a.Visitor?.last_name || ""} ${a.Visitor?.first_name || ""}`;
            const nameB = `${b.Visitor?.last_name || ""} ${b.Visitor?.first_name || ""}`;
            compareResult = nameA.localeCompare(nameB);
            break;
          case "preferred_time":
            // Get the time value for comparison
            const getTimeValue = (appt) => {
              if (appt.preferred_time && appt.preferred_time.includes('-')) {
                // Extract the start time from the range (e.g., "9:00 AM - 10:00 AM" -> "9:00 AM")
                return appt.preferred_time.split('-')[0].trim();
              }
              return appt.start_time || appt.preferred_time || "";
            };
            compareResult = getTimeValue(a).localeCompare(getTimeValue(b));
            break;
          case "visitor_count":
            compareResult = (a.population_count || 0) - (b.population_count || 0);
            break;
          case "status":
            const statusA = standardizeStatus(a.AppointmentStatus?.status || "Pending");
            const statusB = standardizeStatus(b.AppointmentStatus?.status || "Pending");
            compareResult = statusA.localeCompare(statusB);
            break;
          case "updated_at":
            const dateA = a.AppointmentStatus?.updated_at ? new Date(a.AppointmentStatus.updated_at) : new Date(0);
            const dateB = b.AppointmentStatus?.updated_at ? new Date(b.AppointmentStatus.updated_at) : new Date(0);
            compareResult = dateA - dateB;
            break;
        }
      } else if (type === "visitorRecords") {
        switch (columnFilter) {
          case "date":
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            compareResult = dateA - dateB;
            break;
          case "visitor_name":
            compareResult = (a.visitorName || "").localeCompare(b.visitorName || "");
            break;
          case "visit_counts":
            compareResult = (a.visitCount || 0) - (b.visitCount || 0);
            break;
        }
      }

      return sortDirection === "desc" ? -compareResult : compareResult;
    });
  };

  const sortedAppointments = sortData(filteredAppointments, "appointments");
  const sortedVisitorRecords = sortData(filteredVisitorRecords, "visitorRecords");

  // Calculate counts - use normalized status for consistent checking
  const pendingCount = appointments.filter(
    (appt) => normalizeStatus(appt.AppointmentStatus?.status) === "PENDING"
  ).length;

  const approvedCount = appointments.filter(
    (appt) => normalizeStatus(appt.AppointmentStatus?.status) === "APPROVED"
  ).length;


  return (
    <>
      <div className="w-full h-full flex gap-x-15 overflow-hidden lg:flex-row flex-col">
        {isPreview === false && (
          <SummaryPanel
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="Total Appointments"
            totalCount={appointments.length}
            dateLabel={formatDateForDisplay(selectedDate || new Date())}
            summaryData={[
              { label: "Pending", value: pendingCount },
              { label: "Approved", value: approvedCount },
              { label: "Completed", value: stats.completed },
              { label: "Failed", value: stats.failed },
              { label: "Rejected", value: stats.rejected },
              { label: "Expected Visitors", value: stats.expectedVisitors },
              { label: "Present", value: stats.present },
            ]}
            button={{
              label: "Walk ins",
              onClick: () => {
                // const walkInsBreadcrumb = "Walk Ins";
                // const encodedParam = btoa(walkInsBreadcrumb);
                navigate(`/admin/appointment/walk-ins/`);
              },
            }}
          />
        )}

        <div className="w-full h-full flex flex-col min-w-[43.75rem] gap-y-7 ">
          <div className="w-full min-h-[3.2rem] flex gap-x-3 items-center ">
            <TimelineDatePicker
              defaultValue={
                selectedDate ? selectedDate.toISOString().split("T")[0] : ""
              }
              onDateChange={(dateString) =>
                handleDateChange(dateString ? new Date(dateString) : null)
              }
              theme="light"
            />
            <div className="[&_input]:text-black [&_input]:placeholder-gray-500">
              <SearchBar
                theme="light"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search History"
              />
            </div>

            <CardDropdownPicker
              value={`${columnFilter}|${sortDirection}`}
              onChange={(value) => {
                const [column, direction] = value.split("|");
                setColumnFilter(column);
                setSortDirection(direction || "asc");
              }}
              placeholder="Sort By..."
              theme="light"
              options={[
                { value: "", label: "Sort By..." },
                ...(activeTab === "forms" || activeTab === "pending"
                  ? [
                    {
                      value: "creation_date|asc",
                      label: "Creation Date (Oldest First)",
                    },
                    {
                      value: "creation_date|desc",
                      label: "Creation Date (Newest First)",
                    },
                    {
                      value: "visitor_name|asc",
                      label: "Visitor Name (A-Z)",
                    },
                    {
                      value: "visitor_name|desc",
                      label: "Visitor Name (Z-A)",
                    },
                    {
                      value: "preferred_time|asc",
                      label: "Preferred Time (Earliest First)",
                    },
                    {
                      value: "preferred_time|desc",
                      label: "Preferred Time (Latest First)",
                    },
                    { value: "status|asc", label: "Status (A-Z)" },
                    { value: "status|desc", label: "Status (Z-A)" },
                    {
                      value: "visitor_count|asc",
                      label: "Visitor Count (Low-High)",
                    },
                    {
                      value: "visitor_count|desc",
                      label: "Visitor Count (High-Low)",
                    },
                    {
                      value: "updated_at|asc",
                      label: "Last Updated (Oldest First)",
                    },
                    {
                      value: "updated_at|desc",
                      label: "Last Updated (Newest First)",
                    },
                  ]
                  : [
                    { value: "date|asc", label: "Date (Oldest First)" },
                    { value: "date|desc", label: "Date (Newest First)" },
                    {
                      value: "visitor_name|asc",
                      label: "Visitor Name (A-Z)",
                    },
                    {
                      value: "visitor_name|desc",
                      label: "Visitor Name (Z-A)",
                    },
                    {
                      value: "visit_counts|asc",
                      label: "Visit Counts (Low-High)",
                    },
                    {
                      value: "visit_counts|desc",
                      label: "Visit Counts (High-Low)",
                    },
                  ]),
              ]}
            />
            <CardDropdownPicker
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              theme="light"
              options={[
                { value: "All Statuses", label: "All Statuses" },
                { value: "Approved", label: "Approved" },
                { value: "Rejected", label: "Rejected" },
                { value: "Failed", label: "Failed" },
                { value: "Pending", label: "Pending" },
                { value: "Completed", label: "Completed" },
              ]}
            />
          </div>
          <div className="w-full h-full flex flex-col">
            <TableHeaderContainer headers={headersMap[activeTab]} />
            <div className="w-full h-[52rem] 3xl:h-[67rem] border-y overflow-y-auto border-gray-400">
              {(activeTab === "forms" || activeTab === "pending") && (
                <ListRenderer
                  isLoading={loading}
                  error={error}
                  items={sortedAppointments}
                  emptyMessage={`No ${activeTab === "pending" ? "pending" : ""} appointment data available`}
                  renderItem={(appt) => (
                    <AppointmentListRow
                      key={appt.appointment_id}
                      appointment={appt}
                      headers={headersMap[activeTab]}
                      onRowClick={(appointment) => {
                        if (activeTab === "forms") {
                          // Navigate directly to AppointmentViewPage for forms tab
                          const appointmentBreadcrumb = `${appointment.appointment_id} ${appointment.Visitor?.first_name || ''} ${appointment.Visitor?.last_name || ''}`;
                          const encodedParam = btoa(appointmentBreadcrumb);
                          navigate(`/admin/appointment/${encodedParam}`, {
                            state: { cameFrom: activeTab }
                          });
                        } else {
                          // Show preview for other tabs (pending, etc.)
                          setActivePreviewId(appointment.appointment_id);
                          setIsPreview(true);
                        }
                      }}
                      activePreviewId={activePreviewId}
                      cameFrom={activeTab}
                    />
                  )}
                />
              )}
              {activeTab === "visitorRecords" && (
                <ListRenderer
                  isLoading={loading}
                  error={error}
                  items={sortedVisitorRecords}
                  emptyMessage="No visitor records available"
                  renderItem={(record) => (
                    <VisitorRecordListRow
                      key={record.id}
                      record={record}
                      headers={headersMap[activeTab]}
                      cameFrom="visitorRecords"
                    />
                  )}
                />
              )}
            </div>
          </div>
        </div>

        {isPreview === true && (
          <div className="w-full max-w-[35rem] h-[99%] shadow-md shadow-gray-700 rounded-md flex flex-col mt-[2px] mr-[.5rem]">
            <div className="min-h-[4rem] flex pl-5 pr-3 rounded-md items-center bg-black justify-between">
              <div className="flex gap-x-2 items-center">
                <span className="text-xl text-white font-md">
                  Appointment Information
                </span>
                <span
                  className={`text-white text-md font-md px-2 py-1 rounded-md ${(() => {
                    const status =
                      appointments.find(
                        (a) => a.appointment_id === activePreviewId
                      )?.AppointmentStatus?.status || "";

                    const normalizedStatus = normalizeStatus(status);
                    const colorMap = {
                      APPROVED: "bg-green-600",
                      COMPLETED: "bg-blue-600",
                      REJECTED: "bg-red-600",
                      FAILED: "bg-gray-600",
                      PENDING: "bg-yellow-600",
                      CANCELED: "bg-purple-600",
                    };

                    return colorMap[normalizedStatus] || "bg-gray-500";
                  })()}`}
                >
                  {standardizeStatus(appointments.find(
                    (a) => a.appointment_id === activePreviewId
                  )?.AppointmentStatus?.status) || "No Status"}
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
                  setActivePreviewId(null);
                }}
                className="cursor-pointer"
              >
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M10 10l4 4m0 -4l-4 4" />
              </svg>
            </div>

            <div className="w-full h-full py-10 px-10">
              <AppointmentPreview
                key={activePreviewId}
                appointment={appointments.find(
                  (a) => a.appointment_id === activePreviewId
                )}
                cameFrom={activeTab}
              />
            </div>
          </div>
        )}
      </div>

      <Toast
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={hideToast}
      />
    </>
  );
};

export default Appointments;
