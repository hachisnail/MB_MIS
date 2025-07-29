// FileName: /Appointments.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocketClient } from "@/context/authContext";
import { useLocation } from 'react-router-dom';
import axiosClient from '../../lib/axiosClient';
import TimelineDatePicker from '../../features/TimelineDatePicker';
import Toast from '../../features/Toast';
import { SearchBar, CardDropdownPicker } from "../../features/Utilities";
import { LoadingSpinner, ErrorBox, EmptyMessage } from "../../components/list/commons";
import {
  AppointmentFormItem,
  AttendanceItem,
  VisitorRecordItem,
  standardizeStatus,
  formatDateForDisplay,
  formatDate
} from "../../components/list/AppointmentsList";


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
    present: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Check if we're returning from a view page with a specific tab
    return location.state?.activeTab || 'forms';
  });
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [columnFilter, setColumnFilter] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Toast
  const [toastConfig, setToastConfig] = useState({
    message: '',
    type: 'success'
  });

  const socket = useSocketClient();

  // Update active tab when location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Toast functions
  const showToast = useCallback((message, type = 'success') => {
    setToastConfig({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig(prevConfig => ({ ...prevConfig, message: '' }));
  }, []);

  // Helper function to format date for API

  const formatDateForAPI = useCallback((date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Data fetching
  const fetchData = useCallback(async (endpoint, setter) => {
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
      showToast(`Failed to load ${endpoint.replace('-', ' ')}`, 'error');
    }
  }, [selectedDate, formatDateForAPI, showToast]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchData('appointment', setAppointments),
        fetchData('appointment/stats', setStats),
        fetchData('attendance', setAttendanceData),
        fetchData('visitor-records', setVisitorRecords)
      ]);
    } catch (err) {
      setError('Failed to load data. Please try again.');
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

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    if (date) {
      showToast(`Filtering data for ${formatDateForDisplay(date)}`, 'info');
    } else {
      showToast('Showing all dates', 'info');
    }
  }, [showToast]);

  const toggleRecordExpansion = useCallback((id) => {
    setExpandedRecordId(prevId => prevId === id ? null : id);
  }, []);

  const tabButtonStyle = useCallback((tabName) => {
    return tabName === activeTab
      ? 'bg-black text-white border-black'
      : 'border-gray-500 text-black';
  }, [activeTab]);

  // Filtering and sorting logic
  const filteredData = useMemo(() => {
    let filteredAppointments = [...appointments];
    let filteredAttendance = [...attendanceData];
    let filteredVisitorRecords = [...visitorRecords];

    // Apply search filter
    if (searchQuery) {
      filteredAppointments = filteredAppointments.filter(appt =>
        (appt.Visitor?.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appt.Visitor?.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appt.preferred_time || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appt.AppointmentStatus?.status || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

      filteredAttendance = filteredAttendance.filter(record =>
        record.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      filteredVisitorRecords = filteredVisitorRecords.filter(record =>
        record.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.date && record.date.toString().toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter for appointments
    if (statusFilter !== 'All Statuses') {
      filteredAppointments = filteredAppointments.filter(appt => {
        const status = standardizeStatus(appt.AppointmentStatus?.status || 'To Review');
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
          case 'forms':
            switch (columnFilter) {
              case 'creation_date':
                compareResult = new Date(a.creation_date) - new Date(b.creation_date);
                break;
              case 'visitor_name':
                compareResult = `${a.Visitor?.last_name} ${a.Visitor?.first_name}`.localeCompare(
                  `${b.Visitor?.last_name} ${b.Visitor?.first_name}`
                );
                break;
              case 'preferred_time':
                compareResult = (a.start_time || '').localeCompare(b.start_time || '');
                break;
              case 'visitor_count':
                compareResult = (a.population_count || 0) - (b.population_count || 0);
                break;
              case 'status':
                const statusA = standardizeStatus(a.AppointmentStatus?.status || 'To Review');
                const statusB = standardizeStatus(b.AppointmentStatus?.status || 'To Review');
                compareResult = statusA.localeCompare(statusB);
                break;
              case 'updated_at':
                const dateA = a.AppointmentStatus?.updated_at ? new Date(a.AppointmentStatus.updated_at) : new Date(0);
                const dateB = b.AppointmentStatus?.updated_at ? new Date(b.AppointmentStatus.updated_at) : new Date(0);
                compareResult = dateA - dateB;
                break;
            }
            break;

          case 'attendance':
            switch (columnFilter) {
              case 'date':
                compareResult = new Date(a.date) - new Date(b.date);
                break;
              case 'visitor_name':
                compareResult = a.visitorName.localeCompare(b.visitorName);
                break;
              case 'purpose':
                compareResult = a.purpose.localeCompare(b.purpose);
                break;
              case 'preferred_date':
                compareResult = new Date(a.preferredDate) - new Date(b.preferredDate);
                break;
              case 'expected_visitor':
                compareResult = parseInt(a.expectedVisitor || 0) - parseInt(b.expectedVisitor || 0);
                break;
              case 'present':
                const presentA = a.present === 'ongoing' ? 0 : parseInt(a.present || 0);
                const presentB = b.present === 'ongoing' ? 0 : parseInt(b.present || 0);
                compareResult = presentA - presentB;
                break;
            }
            break;

          case 'visitorRecords':
            switch (columnFilter) {
              case 'date':
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                compareResult = dateA - dateB;
                break;
              case 'visitor_name':
                compareResult = (a.visitorName || '').localeCompare(b.visitorName || '');
                break;
              case 'visit_counts':
                compareResult = (a.visitCount || 0) - (b.visitCount || 0);
                break;
            }
            break;
        }

        return sortDirection === 'desc' ? -compareResult : compareResult;
      });

      return sorted;
    };

    return {
      appointments: sortData(filteredAppointments, 'forms'),
      attendanceData: sortData(filteredAttendance, 'attendance'),
      visitorRecords: sortData(filteredVisitorRecords, 'visitorRecords')
    };
  }, [appointments, attendanceData, visitorRecords, searchQuery, statusFilter, columnFilter, sortDirection]);

  return (
    <div className="relative w-full h-full bg-[#F0F0F0] select-none flex pt-[1rem] overflow-hidden">
      <div className="w-full h-full flex flex-col gap-y-5 px-7 pb-7 pt-[1rem] overflow-hidden">

        <div className="w-full h-[calc(100%-9rem)] flex flex-col xl:flex-row gap-y-5 xl:gap-y-0 xl:gap-x-5 pt-5">
          {/* Left panel: Stats + Buttons */}
          <div className="min-w-[34rem] h-full flex flex-col gap-y-7">
            {/* Tab Buttons */}
            <div className="w-full max-w-[35rem] text-gray-500 h-[3.5rem] flex py-0 gap-x-2 items-center">
              <button
                onClick={() => setActiveTab('forms')}
                className={`px-4 h-full border-1 rounded-lg cursor-pointer ${tabButtonStyle('forms')}`}
              >
                <span className="text-2xl font-semibold">Forms</span>
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-4 h-full border-1 rounded-lg cursor-pointer ${tabButtonStyle('attendance')}`}
              >
                <span className="text-2xl font-semibold">Attendance</span>
              </button>
              <button
                onClick={() => setActiveTab('visitorRecords')}
                className={`px-4 h-full border-1 rounded-lg cursor-pointer ${tabButtonStyle('visitorRecords')}`}
              >
                <span className="text-2xl font-semibold">Visitor Records</span>
              </button>
            </div>

            {/* Stats */}
            <div className="w-full h-full flex flex-col gap-y-[5rem] overflow-y-auto">
              {/* Total appointments */}
              <div className="bg-[#161616] px-4 h-[5rem] flex justify-between items-center rounded-sm">
                <span className="text-2xl text-white font-semibold">Total Appointments</span>
                <div className="w-[6rem] h-[3rem] bg-[#D4DBFF] flex items-center justify-center rounded-md">
                  <span className="text-2xl text-black font-semibold">
                    {appointments.length}
                  </span>
                </div>
              </div>

              {/* More stats */}
              <div className="w-full h-auto flex flex-col gap-y-7">
                <span className="text-2xl font-semibold text-[#727272]">
                  {formatDateForDisplay(selectedDate || new Date())}
                </span>

                {/* To Review */}
                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">To Review</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">
                      {appointments.filter(appt =>
                        !appt.AppointmentStatus?.status ||
                        appt.AppointmentStatus?.status.toUpperCase() === 'TO_REVIEW'
                      ).length}
                    </span>
                  </div>
                </div>

                {/* Approved/Confirmed */}
                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Approved</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{stats.approved}</span>
                  </div>
                </div>

                {/* Completed */}
                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Completed</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{stats.completed}</span>
                  </div>
                </div>

                {/* Failed */}
                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Failed</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{stats.failed || 0}</span>
                  </div>
                </div>

                {/* Rejected */}
                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Rejected</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{stats.rejected}</span>
                  </div>
                </div>

                {/* Expected Visitors */}
                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Expected Visitors</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{stats.expectedVisitors}</span>
                  </div>
                </div>

                {/* Present */}
                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Present</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{stats.present}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Tables */}
          <div className="w-full h-full flex flex-col gap-y-7 overflow-x-auto overflow-y-hidden">
            <div className="w-full h-fit flex gap-x-3 items-center">
                            <TimelineDatePicker
                defaultValue={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onDateChange={(dateString) => handleDateChange(dateString ? new Date(dateString) : null)}
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
                  const [column, direction] = value.split('|');
                  setColumnFilter(column);
                  setSortDirection(direction || 'asc');
                }}
                placeholder="Sort By..."
                theme="light"
                options={[
                  { value: '', label: 'Sort By...' },
                  ...(activeTab === 'forms' ? [
                    { value: 'creation_date|asc', label: 'Creation Date (Oldest First)' },
                    { value: 'creation_date|desc', label: 'Creation Date (Newest First)' },
                    { value: 'visitor_name|asc', label: 'Visitor Name (A-Z)' },
                    { value: 'visitor_name|desc', label: 'Visitor Name (Z-A)' },
                    { value: 'preferred_time|asc', label: 'Preferred Time (Earliest First)' },
                    { value: 'preferred_time|desc', label: 'Preferred Time (Latest First)' },
                    { value: 'status|asc', label: 'Status (A-Z)' },
                    { value: 'status|desc', label: 'Status (Z-A)' },
                    { value: 'visitor_count|asc', label: 'Visitor Count (Low-High)' },
                    { value: 'visitor_count|desc', label: 'Visitor Count (High-Low)' },
                    { value: 'updated_at|asc', label: 'Last Updated (Oldest First)' },
                    { value: 'updated_at|desc', label: 'Last Updated (Newest First)' }
                  ] : activeTab === 'attendance' ? [
                    { value: 'date|asc', label: 'Date (Oldest First)' },
                    { value: 'date|desc', label: 'Date (Newest First)' },
                    { value: 'visitor_name|asc', label: 'Visitor Name (A-Z)' },
                    { value: 'visitor_name|desc', label: 'Visitor Name (Z-A)' },
                    { value: 'purpose|asc', label: 'Purpose of Visit (A-Z)' },
                    { value: 'purpose|desc', label: 'Purpose of Visit (Z-A)' },
                    { value: 'preferred_date|asc', label: 'Preferred Date (Oldest First)' },
                    { value: 'preferred_date|desc', label: 'Preferred Date (Newest First)' },
                    { value: 'expected_visitor|asc', label: 'Expected Visitors (Low-High)' },
                    { value: 'expected_visitor|desc', label: 'Expected Visitors (High-Low)' },
                    { value: 'present|asc', label: 'Present Count (Low-High)' },
                    { value: 'present|desc', label: 'Present Count (High-Low)' }
                  ] : [
                    { value: 'date|asc', label: 'Date (Oldest First)' },
                    { value: 'date|desc', label: 'Date (Newest First)' },
                    { value: 'visitor_name|asc', label: 'Visitor Name (A-Z)' },
                    { value: 'visitor_name|desc', label: 'Visitor Name (Z-A)' },
                    { value: 'visit_counts|asc', label: 'Visit Counts (Low-High)' },
                    { value: 'visit_counts|desc', label: 'Visit Counts (High-Low)' }
                  ])
                ]}
              />
              <CardDropdownPicker
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Statuses"
                theme="light"
                options={[
                  { value: 'All Statuses', label: 'All Statuses' },
                  { value: 'Confirmed', label: 'Confirmed' },
                  { value: 'Rejected', label: 'Rejected' },
                  { value: 'Failed', label: 'Failed' },
                  { value: 'To Review', label: 'To Review' },
                  { value: 'Completed', label: 'Completed' }
                ]}
              />

            </div>

            {/* FORMS (Appointments) TABLE */}
            {activeTab === 'forms' && (
              <div className="flex flex-col min-w-[94rem] h-[calc(100%-7rem)]">
                {/* Table Header - Fixed */}
                <div className="bg-[#F0F0F0] min-w-[94rem] w-full font-semibold grid grid-cols-6 justify-between mb-7">
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Creation Date
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Visitor Name
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Preferred Time
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Status
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Visitor Count
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Last Updated
                  </div>
                </div>

                {/* Table Data - Scrollable */}
                <div className="w-full min-w-[94rem] overflow-y-auto h-full border-t-1 border-t-gray-400">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : error ? (
                    <ErrorBox message={error} />
                  ) : filteredData.appointments.length > 0 ? (
                    filteredData.appointments.map((appt) => (
                      <AppointmentFormItem key={appt.appointment_id} appointment={appt} cameFrom="forms" />
                    ))
                  ) : (
                    <EmptyMessage message="No appointment data available" />
                  )}
                </div>
              </div>
            )}

            {/* ATTENDANCE TABLE */}
            {activeTab === 'attendance' && (
              <div className="flex flex-col min-w-[94rem] h-[calc(100%-7rem)]">
                {/* Table Header - Fixed */}
                <div className="bg-[#F0F0F0] min-w-[94rem] w-full font-semibold grid grid-cols-6 justify-between mb-7">
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Date
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Visitor Name
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Purpose of Visit
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Preferred Date
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Expected Visitor
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Present
                  </div>
                </div>

                {/* Table Data - Scrollable */}
                <div className="w-full min-w-[94rem] overflow-y-auto h-full border-t-1 border-t-gray-400">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : error ? (
                    <ErrorBox message={error} />
                  ) : filteredData.attendanceData.length > 0 ? (
                    filteredData.attendanceData.map((row, i) => (
                      <AttendanceItem key={i} attendance={row} cameFrom="attendance" />
                    ))
                  ) : (
                    <EmptyMessage message="No attendance records found" />
                  )}
                </div>
              </div>
            )}

            {/* VISITOR RECORDS TABLE */}
            {activeTab === 'visitorRecords' && (
              <div className="flex flex-col min-w-[94rem] h-[calc(100%-7rem)]">
                {/* Table Header - Fixed */}
                <div className="bg-[#F0F0F0] min-w-[94rem] w-full font-semibold grid grid-cols-3 justify-between mb-7">
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Date
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2 w-[480px]">
                    Visitors
                  </div>
                  <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">
                    Visit Counts
                  </div>
                </div>

                {/* Table Data - Scrollable */}
                <div className="w-full min-w-[94rem] overflow-y-auto h-full border-t-1 border-t-gray-400">
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={hideToast}
      />
    </div>
  );
};

export default Appointments;
