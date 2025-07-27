// FileName: /Appointments.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useSocketClient } from "../../context/authContext";
import axiosClient from '../../lib/axiosClient';
import TimelineDatePicker from '../../features/TimelineDatePicker';
import Toast from '../../components/function/Toast';
import { SearchBar, CardDropdownPicker } from "../../features/Utilities";
import Breadcrumb from '../../components/Breadcrumb';


const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [columnFilter, setColumnFilter] = useState('');

  // Stats from backend
  const [stats, setStats] = useState({
    approved: 0,
    rejected: 0,
    completed: 0,
    failed: 0,
    expectedVisitors: 0,
    present: 0
  });

  // Track the currently active tab
  const [activeTab, setActiveTab] = useState('forms');

  // State for visitor record row expansion
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  // State for visitor records and attendance data
  const [visitorRecords, setVisitorRecords] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  // Toast message
  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  // const API_URL = import.meta.env.VITE_API_BASE_URL; // <--- REMOVE OR COMMENT OUT THIS LINE

  // Memoized showToast and hideToast functions
  const showToast = useCallback((message, type = 'success') => {
    setToastConfig({
      isVisible: true,
      message,
      type
    });
  }, []); // No dependencies, so it's stable

  const hideToast = useCallback(() => {
    setToastConfig(prevConfig => ({
      ...prevConfig,
      isVisible: false
    }));
  }, []); // No dependencies, so it's stable

  // Helper functions (pure, no need for useCallback unless passed as prop to memoized child)
  const convertTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    const cleanTime = timeStr.includes(':') ? timeStr.split(':').slice(0, 2).join(':') : timeStr;
    const [hourStr, minuteStr] = cleanTime.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr || '0', 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeDisplay = (start_time, end_time) => {
    if (!start_time || !end_time) {
      return 'Flexible';
    }
    const formattedStart = convertTo12Hour(start_time);
    const formattedEnd = convertTo12Hour(end_time);
    if (formattedStart && formattedEnd) {
      return `${formattedStart} - ${formattedEnd}`;
    }
    return 'Flexible';
  };

  const standardizeStatus = useCallback((status) => {
    if (!status) return 'To Review';
    const formatted = status.toLowerCase().replace(/_/g, ' ');
    return formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []); // No dependencies, so it's stable

  const getStatusLabel = useCallback((status) => {
    const standardStatus = standardizeStatus(status);
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';

    switch (standardStatus.toLowerCase()) {
      case 'confirmed':
        bgColor = 'bg-green-500';
        textColor = 'text-white';
        break;
      case 'rejected':
        bgColor = 'bg-red-600';
        textColor = 'text-white';
        break;
      case 'failed':
        bgColor = 'bg-orange-600';
        textColor = 'text-white';
        break;
      case 'to review':
        bgColor = 'bg-purple-200';
        textColor = 'text-black';
        break;
      case 'completed':
        bgColor = 'bg-blue-600';
        textColor = 'text-white';
        break;
      default:
        break;
    }
    bgColor += ' h-9 w-30 flex items-center justify-center';
    return (
      <span className={`${bgColor} ${textColor} px-2 py-1 rounded inline-flex items-center justify-center`}>
        {standardStatus}
      </span>
    );
  }, [standardizeStatus]); // Depends on standardizeStatus, which is stable

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
  }, []); // Stable

  const toggleRecordExpansion = useCallback((id) => {
    setExpandedRecordId(prevId => prevId === id ? null : id);
  }, []); // Stable

  const formatDateForAPI = useCallback((date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []); // Stable

  // Refactored fetch functions to be more generic and reusable
  const fetchData = useCallback(async (endpoint, setter) => {
    try {
      let url = `/auth/${endpoint}`; // <--- FIXED: Remove /api prefix to match User.jsx pattern
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

  // Combined data fetching into a single effect
  useEffect(() => {
    // This effect will run on mount and whenever selectedDate changes
    fetchData('appointment', setAppointments);
    fetchData('appointment/stats', setStats);
    fetchData('attendance', setAttendanceData);
    fetchData('visitor-records', setVisitorRecords);
  }, [selectedDate, fetchData]); // Only re-run when selectedDate or fetchData (which is stable) changes

  const handleAttendanceRowClick = useCallback((row) => {
    if (!row || !row.appointment_id) {
      console.error('Missing appointment ID');
      showToast('Cannot find appointment details', 'error');
      return;
    }

    // Create encoded ID for navigation
    const encodedId = btoa(`${row.appointment_id} `);
    return `/admin/appointment/${encodedId}`;
  }, [showToast]);

  const handleVisitorDetailClick = useCallback((detail, record) => {
    if (!detail.appointment_id) {
      console.error('Missing appointment ID');
      showToast('Cannot find visitor details', 'error');
      return;
    }

    // Create encoded ID for navigation
    const encodedId = btoa(`${detail.appointment_id} `);
    return `/admin/appointment/${encodedId}`;
  }, [showToast]);

  const handleRowClick = useCallback((appt) => {
    if (!appt || !appt.appointment_id) return;

    // Create encoded ID for navigation
    const encodedId = btoa(`${appt.appointment_id} `);
    return `/admin/appointment/${encodedId}`;
  }, []);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
    if (date) {
      showToast(`Filtering data for ${formatDateForDisplay(date)}`, 'info');
    } else {
      showToast('Showing all dates', 'info');
    }
  }, [showToast]); // Stable

  const tabButtonStyle = useCallback((tabName) => {
    return tabName === activeTab
      ? 'bg-black text-white border-black'
      : 'border-gray-500 text-black';
  }, [activeTab]); // Stable

  /**
   * Use useMemo for filtered data to ensure it only re-calculates when dependencies change
   */
  const memoizedFilteredData = useMemo(() => {
    let currentFilteredAppointments = [];
    let currentFilteredAttendance = [];
    let currentFilteredVisitorRecords = [];

    // Forms (Appointments) filtering and sorting
    currentFilteredAppointments = [...appointments];
    if (searchQuery) {
      currentFilteredAppointments = currentFilteredAppointments.filter(appt =>
        (appt.Visitor?.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appt.Visitor?.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (appt.preferred_time || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (appt.AppointmentStatus?.status || '').toLowerCase().includes((searchQuery || '').toLowerCase())
      );
    }
    if (statusFilter !== 'All Statuses') {
      currentFilteredAppointments = currentFilteredAppointments.filter(appt => {
        const status = standardizeStatus(appt.AppointmentStatus?.status || 'To Review');
        return status === statusFilter;
      });
    }
    if (activeTab === 'forms' && columnFilter) {
      currentFilteredAppointments.sort((a, b) => {
        // Sorting logic for forms
        switch (columnFilter) {
          case 'creation_date':
            return sortDirection === 'asc' ? new Date(a.creation_date) - new Date(b.creation_date) : new Date(b.creation_date) - new Date(a.creation_date);
          case 'visitor_name':
            return sortDirection === 'asc' ? `${a.Visitor?.last_name} ${a.Visitor?.first_name}`.localeCompare(`${b.Visitor?.last_name} ${b.Visitor?.first_name}`) : `${b.Visitor?.last_name} ${b.Visitor?.first_name}`.localeCompare(`${a.Visitor?.last_name} ${a.Visitor?.first_name}`);
          case 'preferred_time':
            return sortDirection === 'asc' ? (a.start_time || '').localeCompare(b.start_time || '') : (b.start_time || '').localeCompare(a.start_time || '');
          case 'visitor_count':
            return sortDirection === 'asc' ? (a.population_count || 0) - (b.population_count || 0) : (b.population_count || 0) - (a.population_count || 0);
          case 'status':
            const statusA = standardizeStatus(a.AppointmentStatus?.status || 'To Review');
            const statusB = standardizeStatus(b.AppointmentStatus?.status || 'To Review');
            return sortDirection === 'asc' ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
          case 'updated_at':
            const dateA = a.AppointmentStatus?.updated_at ? new Date(a.AppointmentStatus.updated_at) : new Date(0);
            const dateB = b.AppointmentStatus?.updated_at ? new Date(b.AppointmentStatus.updated_at) : new Date(0);
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
          default:
            return 0;
        }
      });
    }

    // Attendance filtering and sorting
    currentFilteredAttendance = [...attendanceData];
    if (searchQuery) {
      currentFilteredAttendance = currentFilteredAttendance.filter(record =>
        record.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'attendance' && columnFilter) {
      currentFilteredAttendance.sort((a, b) => {
        // Sorting logic for attendance
        switch (columnFilter) {
          case 'date':
            return sortDirection === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
          case 'visitor_name':
            return sortDirection === 'asc' ? a.visitorName.localeCompare(b.visitorName) : b.visitorName.localeCompare(a.visitorName);
          case 'purpose':
            return sortDirection === 'asc' ? a.purpose.localeCompare(b.purpose) : b.purpose.localeCompare(a.purpose);
          case 'preferred_date':
            return sortDirection === 'asc' ? new Date(a.preferredDate) - new Date(b.preferredDate) : new Date(b.preferredDate) - new Date(a.preferredDate);
          case 'expected_visitor':
            return sortDirection === 'asc' ? parseInt(a.expectedVisitor || 0) - parseInt(b.expectedVisitor || 0) : parseInt(b.expectedVisitor || 0) - parseInt(a.expectedVisitor || 0);
          case 'present':
            const presentA = a.present === 'ongoing' ? 0 : parseInt(a.present || 0);
            const presentB = b.present === 'ongoing' ? 0 : parseInt(b.present || 0);
            return sortDirection === 'asc' ? presentA - presentB : presentB - presentA;
          default:
            return 0;
        }
      });
    }

    // Visitor Records filtering and sorting
    currentFilteredVisitorRecords = [...visitorRecords];
    if (searchQuery) {
      currentFilteredVisitorRecords = currentFilteredVisitorRecords.filter(record =>
        record.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.date && record.date.toString().toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (activeTab === 'visitorRecords' && columnFilter) {
      currentFilteredVisitorRecords.sort((a, b) => {
        // Sorting logic for visitor records
        switch (columnFilter) {
          case 'date':
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
          case 'visitor_name':
            return sortDirection === 'asc' ? (a.visitorName || '').localeCompare(b.visitorName || '') : (b.visitorName || '').localeCompare(a.visitorName || '');
          case 'visit_counts':
            return sortDirection === 'asc' ? (a.visitCount || 0) - (b.visitCount || 0) : (b.visitCount || 0) - (a.visitCount || 0);
          default:
            return 0;
        }
      });
    }

    return {
      appointments: currentFilteredAppointments,
      attendanceData: currentFilteredAttendance,
      visitorRecords: currentFilteredVisitorRecords
    };
  }, [searchQuery, statusFilter, columnFilter, sortDirection, activeTab, appointments, attendanceData, visitorRecords, standardizeStatus]);


  const socket = useSocketClient();

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
                  {memoizedFilteredData.appointments.length > 0 ? (
                    memoizedFilteredData.appointments.map((appt) => {
                      const status = standardizeStatus(appt.AppointmentStatus?.status || 'To Review');
                      const updatedAt = appt.AppointmentStatus?.updated_at
                        ? new Date(appt.AppointmentStatus.updated_at).toLocaleString()
                        : 'N/A';

                      const encodedId = btoa(`${appt.appointment_id} `);

                      return (
                        <NavLink
                          key={appt.appointment_id}
                          to={encodedId}
                          className="min-w-[94rem] text-xl h-fit font-semibold grid grid-cols-6 cursor-pointer hover:bg-gray-300"
                        >
                          <div className="px-4 py-3 border-b-1 border-gray-400">
                            {appt.creation_date
                              ? new Date(appt.creation_date).toLocaleString()
                              : 'N/A'}
                          </div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">
                            {appt.Visitor?.first_name} {appt.Visitor?.last_name}
                          </div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">
                            {formatTimeDisplay(appt.start_time, appt.end_time)}
                          </div>

                          <div className="px-4 py-3 border-b-1 border-gray-400">
                            {getStatusLabel(status)}
                          </div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">
                            {appt.population_count}
                          </div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">
                            {updatedAt}
                          </div>
                        </NavLink>
                      );
                    })
                  ) : (
                    <div className="min-w-[94rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                      <div className="text-2xl text-gray-500 flex flex-col items-center">
                        <svg
                          className="w-16 h-16 mb-4 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                        </svg>
                        <p>No appointment data available</p>
                        <p className="text-lg mt-2">Try adjusting your filters or search criteria</p>
                      </div>
                    </div>
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
                  {memoizedFilteredData.attendanceData.length > 0 ? (
                    memoizedFilteredData.attendanceData.map((row, i) => {
                      const presentValue = row.present ?? 'ongoing';
                      const encodedId = row.appointment_id ? btoa(`${row.appointment_id} `) : '#';

                      return (
                        <NavLink
                          key={i}
                          to={encodedId}
                          className="min-w-[94rem] text-xl h-fit font-semibold grid grid-cols-6 hover:bg-gray-300 cursor-pointer"
                        >
                          <div className="px-4 py-3 border-b-1 border-gray-400">{row.date}</div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">{row.visitorName}</div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">{row.purpose}</div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">{row.preferredDate}</div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">{row.expectedVisitor}</div>
                          <div className="px-4 py-3 border-b-1 border-gray-400">{presentValue}</div>
                        </NavLink>
                      );
                    })
                  ) : (
                    <div className="min-w-[94rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                      <div className="text-2xl text-gray-500 flex flex-col items-center">
                        <svg
                          className="w-16 h-16 mb-4 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                          <path d="M9 16l2 2 4-4" />
                        </svg>
                        <p>No attendance records found</p>
                        <p className="text-lg mt-2">Try adjusting your filters or search criteria</p>
                      </div>
                    </div>
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
                  {memoizedFilteredData.visitorRecords.length > 0 ? (
                    memoizedFilteredData.visitorRecords.map((record) => (
                      <React.Fragment key={record.id}>
                        {/* Main Row */}
                        <div
                          className="min-w-[94rem] text-xl h-fit font-semibold grid grid-cols-3 cursor-pointer hover:bg-gray-300 border-b-1 border-gray-200"
                          onClick={() => toggleRecordExpansion(record.id)}
                        >
                          <div className="px-4 py-4">{formatDate(record.date)}</div>
                          <div className="px-4 py-4">{record.visitorName}</div>
                          <div className="px-4 py-4 flex justify-between items-center">
                            <span>{record.visitCount}</span>
                            <svg
                              className={`w-5 h-5 mr-4 text-gray-500 transform ${expandedRecordId === record.id ? 'rotate-180' : ''}`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded Row with Details */}
                        {expandedRecordId === record.id && (
                          <div className="min-w-[94rem] flex justify-end">
                            <div className="w-[45%] my-4 mr-4 rounded-lg overflow-hidden shadow-sm">
                              {record.details && record.details.length > 0 ? (
                                <div style={{
                                  maxHeight: record.details.length > 3 ? 'calc(3*3.5rem)' : 'auto',
                                  overflowY: record.details.length > 3 ? 'scroll' : 'visible',
                                  scrollbarWidth: 'thin',
                                  scrollbarColor: '#333 #ccc'
                                }}>
                                  <table className="w-full border-collapse bg-white">
                                    <thead className="sticky top-0 bg-white z-10">
                                      <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Purpose of visit</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Visitor Count</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Present</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Date</th>
                                        <th className="w-10 py-3 px-2 text-right">
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {record.details.map((detail, idx) => {
                                        const detailWithId = {
                                          ...detail,
                                          appointment_id: detail.appointment_id || null
                                        };

                                        return (
                                          <tr key={idx} className={idx !== record.details.length - 1 ? "border-b border-gray-200" : ""}>
                                            <td className="py-3 px-4 text-gray-800">{detail.purpose}</td>
                                            <td className="py-3 px-4 text-center text-gray-800">{detail.visitorCount}</td>
                                            <td className="py-3 px-4 text-center text-gray-800">{detail.present}</td>
                                            <td className="py-3 px-4 text-center text-gray-800">{formatDate(detail.date)}</td>
                                            <td className="py-3 px-2 text-right">
                                              {detail.appointment_id ? (
                                                <NavLink
                                                  to={btoa(`${detail.appointment_id} `)}
                                                  className="text-blue-500 hover:text-blue-700"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <svg
                                                    className="w-5 h-5"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  >
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                  </svg>
                                                </NavLink>
                                              ) : (
                                                <span className="text-gray-400">
                                                  <svg
                                                    className="w-5 h-5"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  >
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                  </svg>
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="p-8 text-center text-gray-500">
                                  No details available for this record.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="min-w-[94rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                      <div className="text-2xl text-gray-500 flex flex-col items-center">
                        <svg
                          className="w-16 h-16 mb-4 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="7" r="4" />
                          <path d="M12 11v4" />
                          <circle cx="12" cy="15" r="6" />
                          <path d="M12 15l2 2" />
                        </svg>
                        <p>No visitor records available</p>
                        <p className="text-lg mt-2">Try adjusting your filters or search criteria</p>
                      </div>
                    </div>
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
        isVisible={toastConfig.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default Appointments;
