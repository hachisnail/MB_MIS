import { useState, useEffect, useCallback, useMemo } from "react";
import { useSocketClient } from "@/context/authContext";
import { useLocation } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import Toast from "@/features/Toast";
import { SearchBar, CardDropdownPicker } from "@/features/Utilities";
import {
  LoadingSpinner,
  ErrorBox,
  EmptyMessage,
} from "@/components/list/commons";
import {
  AppointmentFormItem,
  AttendanceItem,
  VisitorRecordItem,
  standardizeStatus,
  formatDate,
} from "@/components/list/AppointmentsList";
import { formatDateForDisplay } from "@/components/list/commons";
import { TableHeaderContainer, SummaryPanel } from "../../features/Utilities";

import useToast from "../../components/list/commons";

const Appointments = () => {
  const location = useLocation();

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

  // Toast
  const { toastConfig, showToast, hideToast } = useToast();

  const socket = useSocketClient();

  const tabs = [
    { key: "forms", label: "Forms" },
    { key: "attendance", label: "Attendance" },
    { key: "visitorRecords", label: "Visitor Records" },
  ];

  const formHeaders = [
    { label: "Creation Date", width: "auto" },
    { label: "Visitor Name", width: "auto" },
    { label: "Preferred Time", width: "auto" },
    { label: "Status", width: "auto" },
    { label: "Visitor Count", width: "auto" },
    { label: "Last Updated", width: "auto" },
  ];

  const attendanceHeaders = [
    { label: "Date", width: "auto" },
    { label: "Visitor Name", width: "auto" },
    { label: "Purpose of Visit", width: "auto" },
    { label: "Preferred Date", width: "auto" },
    { label: "Expected Visitor", width: "auto" },
    { label: "Present", width: "auto" },
  ];

  const visitorHeaders = [
    { label: "Date", width: "auto" },
    { label: "Visitors", width: "auto" },
    { label: "Visitor Count", width: "auto" },
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
      <div className="w-full h-full flex gap-x-5 overflow-scroll lg:flex-row flex-col">
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
                    appt.AppointmentStatus?.status.toUpperCase() === "TO_REVIEW"
                )
                .length.toString(),
            },
            { label: "Approved", value: stats.approved },
            { label: "Completed", value: stats.completed },
            { label: "Failed", value: stats.failed },
            { label: "Rejected", value: stats.rejected },
            { label: "Ecpected Visitors", value: stats.expectedVisitors },
            { label: "Present", value: stats.present },
          ]}
          // button={{
          //   label: "Add new artifacts",
          //   onClick: () => navigate("/admin/acquisition/add-artifact")
          // }} removed no button in appointment
        />

        <div className="w-full h-full flex flex-col min-w-[43.75rem] gap-y-7">
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
            <div className="w-full h-[55rem] border-y border-gray-400">
              {activeTab === "forms" && (
                <>
                  {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center ">
                      <LoadingSpinner />
                    </div>
                  )}

                  {error ? (
                    <ErrorBox message={error} />
                  ) : filteredData.appointments.length > 0 ? (
                    filteredData.appointments.map((appt) => (
                      <AppointmentFormItem
                        key={appt.appointment_id}
                        appointment={appt}
                        cameFrom="forms"
                      />
                    ))
                  ) : !isLoading && filteredData.appointments.length === 0 ? (
                    <EmptyMessage message="No appointment data available" />
                  ) : null}
                </>
              )}
              {activeTab === "attendance" && (
                <>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : error ? (
                    <ErrorBox message={error} />
                  ) : filteredData.attendanceData.length > 0 ? (
                    filteredData.attendanceData.map((row, i) => (
                      <AttendanceItem
                        key={i}
                        attendance={row}
                        cameFrom="attendance"
                      />
                    ))
                  ) : (
                    <EmptyMessage message="No attendance records found" />
                  )}
                </>
              )}
              {activeTab === "visitorRecords" && (
                <>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : error ? (
                    <ErrorBox message={error} />
                  ) : filteredData.visitorRecords.length > 0 ? (
                    filteredData.visitorRecords.map((record) => (
                      <VisitorRecordItem
                        key={record.id}
                        record={record}
                        isExpanded={expandedRecordId === record.id}
                        onToggle={toggleRecordExpansion}
                        cameFrom="visitorRecords"
                      />
                    ))
                  ) : (
                    <EmptyMessage message="No visitor records available" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
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
