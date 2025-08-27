import { useState, useEffect, useCallback, useMemo } from "react";
import { useSocketClient } from "@/context/authContext";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import Toast from "@/features/Toast";
import { SearchBar, CardDropdownPicker } from "@/features/Utilities";
import { LoadingSpinner, ErrorBox, EmptyMessage } from "@/components/commons";

import {
  AppointmentFormItem,
  AttendanceItem,
  VisitorRecordItem,
  AppointmentPreview,
} from "./components/AppointmentsList";
import { formatDate } from "./components/dateUtils";
import { standardizeStatus } from "./components/statusUtils";
import { formatDateForDisplay } from "@/components/commons";
import {
  TableHeaderContainer,
  SummaryPanel,
} from "../../../features/Utilities";
import ContextMenu from "../../../components/modals/ContextMenu";
import ListRenderer from "../../../components/tables/ListRenderer";

import useToast from "../../../components/commons";

const Appointments = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State management
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [visitorRecords, setVisitorRecords] = useState([]);
  const [stats, setStats] = useState({
    approved: 0,
    rejected: 0,
    completed: 0,
    failed: 0,
    expectedVisitors: 0,
    present: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Check if we're returning from a view page with a specific tab
    return location.state?.activeTab || "forms";
  });
  const [expandedRecordId, setExpandedRecordId] = useState(null);

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
    { key: "forms", label: "Forms" },
    { key: "attendance", label: "Attendance" },
    { key: "visitorRecords", label: "Visitor Records" },
  ];

  const formHeaders = [
    { label: "Creation Date", width: 19 },
    { label: "Visitor Name", width: "1fr" },
    { label: "Preferred Time", width: 11.7 },
    { label: "Status", width: 9.5 },
    { label: "Visitor Count", width: 12 },
    { label: "Last Updated", width: 16 },
  ];

  const attendanceHeaders = [
    { label: "Date", width: 15 },
    { label: "Visitor Name", width: "1fr" },
    { label: "Purpose of Visit", width: 12.3 },
    { label: "Preferred Date", width: 11.5 },
    { label: "Expected Visitor", width: 12.5 },
    { label: "Present", width: 13 },
  ];

  const visitorHeaders = [
    { label: "Date", width: "1fr" },
    { label: "Visitors", width: "1fr" },
    { label: "Visitor Count", width: 39 },
  ];

  const headersMap = {
    forms: formHeaders,
    attendance: attendanceHeaders,
    visitorRecords: visitorHeaders,
  };

  // Update active tab when location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Helper function to format date for API

  const formatDateForAPI = useCallback((date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Data fetching
  const fetchData = useCallback(
    async (endpoint, setter) => {
      try {
        let url = `/auth/${endpoint}`;
        if (selectedDate) {
          const dateParam = formatDateForAPI(selectedDate);
          if (dateParam) {
            url += `?date=${dateParam}`;
          }
        }
        const response = await axiosClient.get(url);
        setter(response.data);
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        showToast(`Failed to load ${endpoint.replace("-", " ")}`, "error");
      }
    },
    [selectedDate, formatDateForAPI, showToast]
  );

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchData("appointment", setAppointments),
        fetchData("appointment/stats", setStats),
        fetchData("attendance", setAttendanceData),
        fetchData("visitor-records", setVisitorRecords),
      ]);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchAllData();
  }, [selectedDate, fetchAllData]);

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
  }, [socket, fetchAllData]);

  // Event handlers

  const handleDateChange = useCallback(
    (date) => {
      setSelectedDate(date);
      if (date) {
        showToast(`Filtering data for ${formatDateForDisplay(date)}`, "info");
      } else {
        showToast("Showing all dates", "info");
      }
    },
    [showToast]
  );

  const toggleRecordExpansion = useCallback((id) => {
    setExpandedRecordId((prevId) => (prevId === id ? null : id));
  }, []);

  // Filtering and sorting logic
  const filteredData = useMemo(() => {
    let filteredAppointments = [...appointments];
    let filteredAttendance = [...attendanceData];
    let filteredVisitorRecords = [...visitorRecords];

    // Apply search filter
    if (searchQuery) {
      filteredAppointments = filteredAppointments.filter(
        (appt) =>
          (appt.Visitor?.first_name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (appt.Visitor?.last_name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (appt.preferred_time || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (appt.AppointmentStatus?.status || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );

      filteredAttendance = filteredAttendance.filter(
        (record) =>
          record.visitorName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          record.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      filteredVisitorRecords = filteredVisitorRecords.filter(
        (record) =>
          record.visitorName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (record.date &&
            record.date
              .toString()
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter for appointments
    if (statusFilter !== "All Statuses") {
      filteredAppointments = filteredAppointments.filter((appt) => {
        const status = standardizeStatus(
          appt.AppointmentStatus?.status || "To Review"
        );
        return status === statusFilter;
      });
    }

    // Apply sorting
    const sortData = (data, type) => {
      if (!columnFilter) return data;

      const sorted = [...data];
      sorted.sort((a, b) => {
        let compareResult = 0;

        switch (type) {
          case "forms":
            switch (columnFilter) {
              case "creation_date":
                compareResult =
                  new Date(a.creation_date) - new Date(b.creation_date);
                break;
              case "visitor_name":
                compareResult =
                  `${a.Visitor?.last_name} ${a.Visitor?.first_name}`.localeCompare(
                    `${b.Visitor?.last_name} ${b.Visitor?.first_name}`
                  );
                break;
              case "preferred_time":
                compareResult = (a.start_time || "").localeCompare(
                  b.start_time || ""
                );
                break;
              case "visitor_count":
                compareResult =
                  (a.population_count || 0) - (b.population_count || 0);
                break;
              case "status":
                const statusA = standardizeStatus(
                  a.AppointmentStatus?.status || "To Review"
                );
                const statusB = standardizeStatus(
                  b.AppointmentStatus?.status || "To Review"
                );
                compareResult = statusA.localeCompare(statusB);
                break;
              case "updated_at":
                const dateA = a.AppointmentStatus?.updated_at
                  ? new Date(a.AppointmentStatus.updated_at)
                  : new Date(0);
                const dateB = b.AppointmentStatus?.updated_at
                  ? new Date(b.AppointmentStatus.updated_at)
                  : new Date(0);
                compareResult = dateA - dateB;
                break;
            }
            break;

          case "attendance":
            switch (columnFilter) {
              case "date":
                compareResult = new Date(a.date) - new Date(b.date);
                break;
              case "visitor_name":
                compareResult = a.visitorName.localeCompare(b.visitorName);
                break;
              case "purpose":
                compareResult = a.purpose.localeCompare(b.purpose);
                break;
              case "preferred_date":
                compareResult =
                  new Date(a.preferredDate) - new Date(b.preferredDate);
                break;
              case "expected_visitor":
                compareResult =
                  parseInt(a.expectedVisitor || 0) -
                  parseInt(b.expectedVisitor || 0);
                break;
              case "present":
                const presentA =
                  a.present === "ongoing" ? 0 : parseInt(a.present || 0);
                const presentB =
                  b.present === "ongoing" ? 0 : parseInt(b.present || 0);
                compareResult = presentA - presentB;
                break;
            }
            break;

          case "visitorRecords":
            switch (columnFilter) {
              case "date":
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                compareResult = dateA - dateB;
                break;
              case "visitor_name":
                compareResult = (a.visitorName || "").localeCompare(
                  b.visitorName || ""
                );
                break;
              case "visit_counts":
                compareResult = (a.visitCount || 0) - (b.visitCount || 0);
                break;
            }
            break;
        }

        return sortDirection === "desc" ? -compareResult : compareResult;
      });

      return sorted;
    };

    return {
      appointments: sortData(filteredAppointments, "forms"),
      attendanceData: sortData(filteredAttendance, "attendance"),
      visitorRecords: sortData(filteredVisitorRecords, "visitorRecords"),
    };
  }, [
    appointments,
    attendanceData,
    visitorRecords,
    searchQuery,
    statusFilter,
    columnFilter,
    sortDirection,
  ]);

  return (
    <>
      <div className="w-full h-full flex gap-x-15 overflow-scroll lg:flex-row flex-col">
        {isPreview === false && (
          <SummaryPanel
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="Total Appointments"
            totalCount={appointments.length}
            dateLabel={formatDateForDisplay(selectedDate || new Date())}
            summaryData={[
              {
                label: "To Review",
                value: appointments
                  .filter(
                    (appt) =>
                      !appt.AppointmentStatus?.status ||
                      appt.AppointmentStatus?.status.toUpperCase() ===
                        "TO_REVIEW"
                  )
                  .length.toString(),
              },
              { label: "Approved", value: stats.approved },
              { label: "Completed", value: stats.completed },
              { label: "Failed", value: stats.failed },
              { label: "Rejected", value: stats.rejected },
              { label: "Expected Visitors", value: stats.expectedVisitors },
              { label: "Present", value: stats.present },
            ]}
            button={activeTab === "forms" &&{
              label: "Walk ins",
              onClick: () => {
                const walkInsBreadcrumb = "Walk Ins";
                const encodedParam = btoa(walkInsBreadcrumb);
                navigate(`/admin/appointment/walk-ins/${encodedParam}`);
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
                ...(activeTab === "forms"
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
                  : activeTab === "attendance"
                  ? [
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
                        value: "purpose|asc",
                        label: "Purpose of Visit (A-Z)",
                      },
                      {
                        value: "purpose|desc",
                        label: "Purpose of Visit (Z-A)",
                      },
                      {
                        value: "preferred_date|asc",
                        label: "Preferred Date (Oldest First)",
                      },
                      {
                        value: "preferred_date|desc",
                        label: "Preferred Date (Newest First)",
                      },
                      {
                        value: "expected_visitor|asc",
                        label: "Expected Visitors (Low-High)",
                      },
                      {
                        value: "expected_visitor|desc",
                        label: "Expected Visitors (High-Low)",
                      },
                      {
                        value: "present|asc",
                        label: "Present Count (Low-High)",
                      },
                      {
                        value: "present|desc",
                        label: "Present Count (High-Low)",
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
                { value: "Confirmed", label: "Confirmed" },
                { value: "Rejected", label: "Rejected" },
                { value: "Failed", label: "Failed" },
                { value: "To Review", label: "To Review" },
                { value: "Completed", label: "Completed" },
              ]}
            />
          </div>
          <div className="w-full h-[61rem] flex flex-col">
            <TableHeaderContainer headers={headersMap[activeTab]} />
            <div className="w-full h-[52rem]  border-y border-gray-400">
              {activeTab === "forms" && (
                <>
                  <ListRenderer
                    isLoading={isLoading}
                    error={error}
                    items={filteredData.appointments}
                    emptyMessage="No appointment data available"
                    renderItem={(appt) => (
                      <div
                        key={appt.appointment_id}
                        onClick={() => {
                          setActivePreviewId(appt.appointment_id);
                          setIsPreview(true);
                        }}
                      >
                        <AppointmentFormItem
                          activePreview={activePreviewId}
                          appointment={appt}
                          cameFrom="forms"
                        />
                      </div>
                    )}
                  />
                </>
              )}
              {activeTab === "attendance" && (
                <>
                  <ListRenderer
                    isLoading={isLoading}
                    error={error}
                    items={filteredData.attendanceData}
                    emptyMessage="No attendance records found"
                    renderItem={(row, i) => (
                      <AttendanceItem
                        key={i}
                        attendance={row}
                        cameFrom="attendance"
                      />
                    )}
                  />
                </>
              )}
              {activeTab === "visitorRecords" && (
                <>
                  <ListRenderer
                    isLoading={isLoading}
                    error={error}
                    items={filteredData.visitorRecords}
                    emptyMessage="No visitor records available"
                    renderItem={(record) => (
                      <VisitorRecordItem
                        key={record.id}
                        record={record}
                        isExpanded={expandedRecordId === record.id}
                        onToggle={toggleRecordExpansion}
                        cameFrom="visitorRecords"
                      />
                    )}
                  />
                </>
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

                    const colorMap = {
                      CONFIRMED: "bg-green-600",
                      COMPLETED: "bg-blue-600",
                      REJECTED: "bg-red-600",
                      FAILED: "bg-gray-600",
                      "To Review": "bg-yellow-600",
                      CANCELED: "bg-purple-600",
                    };

                    return colorMap[status] || "bg-gray-500";
                  })()}`}
                >
                  {appointments.find(
                    (a) => a.appointment_id === activePreviewId
                  )?.AppointmentStatus?.status || "No Status"}
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
                cameFrom="forms"
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
