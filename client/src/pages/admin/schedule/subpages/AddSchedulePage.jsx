import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Calendar from "react-calendar";

import "react-calendar/dist/Calendar.css";
import "./AddSchedulePage.css";

import TimePicker from "../../../../features/TimePicker";
import { FormInput } from "@/features/FormUtilities";
import MultiLineInput from "@/features/MultiLineInput";
import Toast from "@/features/Toast";
import StyledButton from "@/components/buttons/StyledButton";
import { LoadingSpinner } from "@/components/commons";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

// Custom multiline input component with same styling as FormInput
const CustomMultiLineInput = ({
  placeholder,
  register,
  name,
  error = "",
  className = "",
  disabled = false,
  rows = 3,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <textarea
        {...register(name, {
          onChange: (e) => {
            // No auto-capitalization for multiline inputs
            // Just let the user type naturally
          },
        })}
        rows={rows}
        disabled={disabled}
        className={`border text-xl px-2 py-3 rounded-2xl w-full resize-y min-h-[3rem] ${
          error !== "" ? "border-red-600" : "border-black"
        } focus:outline-none ${
          disabled ? "border-gray-400 cursor-not-allowed" : ""
        }`}
        style={{
          boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
        }}
        placeholder={placeholder}
      />
      <span className="text-red-600 text-md h-6 pl-2">
        {error?.message || ""}
      </span>
    </div>
  );
};

import axiosClient from "@/lib/axiosClient";
import { useSocketClient } from '@/context/authContext';
import {
  getLocalDateString,
  timeStringToMinutes,
  countOverlappingEvents,
  formatTimeTo12H,
  convertTo24Hour
} from "@/utils/scheduleUtils";
import { validateScheduleCreation } from "@/utils/scheduleValidation";
import { normalizeStatus } from "../../appointments/components/statusUtils";

const AddSchedulePage = () => {
  const navigate = useNavigate();

  // Calendar and form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewedDate, setViewedDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [backendEvents, setBackendEvents] = useState([]);
  const [dayEvents, setDayEvents] = useState([]); // Combined schedules and appointments for selected date
  const [isLoading, setIsLoading] = useState(false);

  // Socket client for real-time updates
  const socket = useSocketClient();

  // Form state with react-hook-form
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  // Selected schedule for details viewer
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Schedule type state (Day or Time) - only for Close a Date
  const [scheduleType, setScheduleType] = useState("time"); // "time" or "day"

  // Active mode state (Add Schedule or Close a Date)
  const [activeMode, setActiveMode] = useState("addSchedule"); // "addSchedule" or "closeDate"

  // Form setup for Add Schedule
  const {
    control: scheduleControl,
    register: scheduleRegister,
    handleSubmit: handleScheduleSubmit,
    formState: { errors: scheduleErrors },
    reset: resetScheduleForm,
    watch: watchSchedule,
    setValue: setScheduleValue,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      availability: "SHARED",
    },
  });

  // Form setup for Disable Date
  const {
    control: disableDateControl,
    register: disableDateRegister,
    handleSubmit: handleDisableDateSubmit,
    formState: { errors: disableDateErrors },
    reset: resetDisableDateForm,
  } = useForm({
    defaultValues: {
      reason: "",
    },
  });

  // Watch form values
  const watchedScheduleData = watchSchedule();

  // Toast state
  const [toastConfig, setToastConfig] = useState({
    message: "",
    type: "info",
    visible: false,
  });

  // Confirmation modal states
  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);
  const [showDisableDateConfirm, setShowDisableDateConfirm] = useState(false);
  const [pendingScheduleData, setPendingScheduleData] = useState(null);
  const [pendingDisableDateData, setPendingDisableDateData] = useState(null);

  // Show toast message
  const showToast = (message, type = "info") => {
    setToastConfig({
      message,
      type,
      visible: true,
    });
  };

  // Hide toast message
  const hideToast = () => {
    setToastConfig((prev) => ({ ...prev, visible: false }));
  };

  // Fetch monthly events for calendar display (schedules + appointments)
  const fetchMonthEvents = useCallback(async () => {
    try {
      const year = viewedDate.getFullYear();
      const month = viewedDate.getMonth();

      console.log(`Fetching calendar events for month: ${month + 1}/${year}`);

      // Fetch all schedules
      const schedulesResponse = await axiosClient.get('/auth/schedules');
      console.log("All schedules:", schedulesResponse.data.length);

      // Fetch all appointments
      const appointmentsResponse = await axiosClient.get('/auth/appointment');
      console.log("All appointments:", appointmentsResponse.data.length);

      // Filter schedules for current month
      const monthSchedules = schedulesResponse.data.filter(schedule => {
        if (!schedule.date) return false;
        const scheduleDate = new Date(schedule.date);
        return !isNaN(scheduleDate.getTime()) &&
          scheduleDate.getMonth() === month &&
          scheduleDate.getFullYear() === year;
      });

      console.log("Month-filtered schedules:", monthSchedules.length);

      // Filter appointments for current month
      const monthAppointments = appointmentsResponse.data.filter(appointment => {
        if (!appointment.preferred_date) return false;
        const dateStr = appointment.preferred_date.split('T')[0];
        const appointmentDate = new Date(dateStr);

        // Include all appointments (both flexible and fixed time) for calendar indicators
        return !isNaN(appointmentDate.getTime()) &&
          appointmentDate.getMonth() === month &&
          appointmentDate.getFullYear() === year;
      });

      console.log("Month-filtered appointments:", monthAppointments.length);

      // Process schedules for calendar display
      const scheduleEvents = monthSchedules.map(schedule => ({
        id: `schedule-${schedule.schedule_id}`,
        date: schedule.date.split('T')[0],
        isActive: schedule.status !== 'COMPLETED',
        isSchedule: true,
        type: schedule.type || "schedule"
      }));

      // Process appointments for calendar display
      const appointmentEvents = monthAppointments.map(appointment => ({
        id: `appointment-${appointment.appointment_id}`,
        date: appointment.preferred_date.split('T')[0],
        isActive: normalizeStatus(appointment.AppointmentStatus?.status || '') === 'APPROVED',
        isAppointment: true
      }));

      const allCalendarEvents = [...scheduleEvents, ...appointmentEvents];
      console.log(`Total filtered calendar events: ${allCalendarEvents.length}`);

      setCalendarEvents(allCalendarEvents);
      setBackendEvents(monthSchedules); // Keep for backward compatibility

      // Extract disabled dates
      const disabled = monthSchedules
        .filter((event) => event.type === "DISABLED")
        .map((event) => new Date(event.date));
      setDisabledDates(disabled);

    } catch (error) {
      console.error('Error fetching monthly events:', error);
      showToast('Error loading calendar events', 'error');
    }
  }, [viewedDate]);

  // Fetch events for selected date (schedules + appointments)
  const fetchDayEvents = useCallback(async () => {
    try {
      const dateString = getLocalDateString(selectedDate);
      console.log("Fetching day events for:", dateString);

      // Fetch schedules for the selected date
      const schedulesResponse = await axiosClient.get(`/auth/schedules?date=${dateString}`);
      console.log("Day schedules:", schedulesResponse.data.length);

      // Fetch all appointments and filter by date
      const appointmentsResponse = await axiosClient.get('/auth/appointment');
      console.log("All appointments for filtering:", appointmentsResponse.data.length);

      // Process schedules
      const daySchedules = schedulesResponse.data.map(schedule => ({
        id: `schedule-${schedule.schedule_id}`,
        title: schedule.title || 'Schedule',
        description: schedule.description || '',
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        availability: schedule.availability || 'SHARED',
        status: schedule.status || 'ACTIVE',
        type: schedule.type || 'schedule',
        isSchedule: true,
        schedule_id: schedule.schedule_id
      }));

      // Filter and process appointments for selected date
      const dayAppointments = appointmentsResponse.data
        .filter(appointment => {
          if (!appointment.preferred_date) return false;
          const appointmentDate = appointment.preferred_date.split('T')[0];
          return appointmentDate === dateString;
        })
        .filter(appointment => {
          const status = appointment.AppointmentStatus?.status || '';
          const normalizedStatus = normalizeStatus(status);
          return normalizedStatus === 'APPROVED' || normalizedStatus === 'COMPLETED';
        })
        .map(appointment => {
          // Handle time formats
          let startTime = "09:00";
          let endTime = "10:00";
          let hasFlexibleTime = false;

          // Check if appointment has flexible time
          if (!appointment.start_time && !appointment.end_time) {
            hasFlexibleTime = true;
            startTime = "Flexible";
            endTime = "";
          } else if (appointment.start_time && appointment.end_time) {
            startTime = appointment.start_time;
            endTime = appointment.end_time;
          } else if (appointment.preferred_time && typeof appointment.preferred_time === 'string') {
            try {
              const timeParts = appointment.preferred_time.split('-');
              if (timeParts[0]) startTime = convertTo24Hour(timeParts[0].trim());
              if (timeParts[1]) endTime = convertTo24Hour(timeParts[1].trim());
            } catch (error) {
              console.error("Error parsing preferred_time:", appointment.preferred_time, error);
            }
          }

          return {
            id: `appointment-${appointment.appointment_id}`,
            appointment_id: appointment.appointment_id,
            title: appointment.purpose_of_visit || 'Visitor Appointment',
            description: appointment.additional_notes || '',
            organizer: appointment.Visitor ?
              `${appointment.Visitor.first_name || ''} ${appointment.Visitor.last_name || ''}`.trim() :
              'Unknown Visitor',
            numPeople: `${appointment.population_count || 1} visitors`,
            date: appointment.preferred_date.split('T')[0],
            startTime,
            endTime,
            status: normalizeStatus(appointment.AppointmentStatus?.status || ''),
            isAppointment: true,
            hasFlexibleTime
          };
        });

      const allDayEvents = [...daySchedules, ...dayAppointments];
      console.log("Combined day events:", allDayEvents.length);

      setDayEvents(allDayEvents);

    } catch (error) {
      console.error('Error fetching day events:', error);
      showToast('Error loading day events', 'error');
    }
  }, [selectedDate]);

  // Main data fetching function
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchMonthEvents(),
        fetchDayEvents()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMonthEvents, fetchDayEvents]);

  // Handle calendar date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Handle calendar navigation (month change)
  const handleViewChange = ({ activeStartDate }) => {
    setViewedDate(activeStartDate);
  };

  // Check if a date is disabled
  const isDateDisabled = (date) => {
    return disabledDates.some(
      (disabledDate) =>
        date.getFullYear() === disabledDate.getFullYear() &&
        date.getMonth() === disabledDate.getMonth() &&
        date.getDate() === disabledDate.getDate()
    );
  };

  // Handle form submission for adding a new schedule (SHARED only) - Show confirmation first
  const onNewScheduleSubmit = (data) => {
    // Validate time inputs - always required for Add Schedule
    if (!newStartTime || !newEndTime) {
      showToast("Please select both start and end times", "error");
      return;
    }

    const dateString = getLocalDateString(selectedDate);

    // Use validateScheduleCreation function (allows creation during exclusive events)
    const scheduleValidation = validateScheduleCreation(
      {
        date: dateString,
        startTime: newStartTime,
        endTime: newEndTime
      },
      dayEvents
    );

    if (!scheduleValidation.isValid) {
      showToast(scheduleValidation.error, "error");
      return;
    }

    // Store data for confirmation
    setPendingScheduleData(data);
    setShowScheduleConfirm(true);
  };

  // Actual schedule creation after confirmation
  const handleScheduleConfirm = async () => {
    if (!pendingScheduleData) return;

    setIsLoading(true);
    setShowScheduleConfirm(false);

    try {
      const dateString = getLocalDateString(selectedDate);

      // Add Schedule is always SHARED with specific time
      // Backend expects start_time and end_time (with underscores)
      const requestData = {
        date: dateString,
        title: pendingScheduleData.title,
        description: pendingScheduleData.description || "",
        start_time: newStartTime, // Changed from startTime to start_time
        end_time: newEndTime,     // Changed from endTime to end_time
        availability: "SHARED", // Always SHARED for Add Schedule
      };

      const response = await axiosClient.post("/auth/schedules", requestData);

      if (response.status === 201) {
        showToast("Schedule added successfully!", "success");

        // Reset form
        resetScheduleForm();
        setNewStartTime("");
        setNewEndTime("");
        setPendingScheduleData(null);

        // Refresh data
        fetchAllData();
      }
    } catch (error) {
      console.error("Error adding schedule:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      showToast(
        `Failed to add schedule. ${error.response?.data?.message || "Please try again."
        }`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for closing a date (Day or Time with EXCLUSIVE) - Show confirmation first
  const onDisableDateSubmit = (data) => {
    // Validate time inputs if in time mode
    if (scheduleType === "time" && (!newStartTime || !newEndTime)) {
      showToast("Please select both start and end times", "error");
      return;
    }

    // Store data for confirmation
    setPendingDisableDateData(data);
    setShowDisableDateConfirm(true);
  };

  // Actual date disabling after confirmation
  const handleDisableDateConfirm = async () => {
    if (!pendingDisableDateData) return;

    setIsLoading(true);
    setShowDisableDateConfirm(false);

    try {
      const dateString = getLocalDateString(selectedDate);
      let requestData = {};

      if (scheduleType === "day") {
        // For day mode, create a special schedule that covers the entire day
        // Since /auth/schedules/disable doesn't exist, we'll use the regular endpoint
        // with a special title to indicate it's a date disable
        requestData = {
          date: dateString,
          title: "DATE_DISABLED", // Special title that backend recognizes
          description: pendingDisableDateData.reason || "Date closed",
          start_time: "00:00", // Full day coverage
          end_time: "23:59",   // Full day coverage
          availability: "EXCLUSIVE", // EXCLUSIVE to block everything
        };
      } else {
        // For time mode, create an EXCLUSIVE schedule
        requestData = {
          date: dateString,
          title: pendingDisableDateData.title || "Time Slot Closed",
          description: pendingDisableDateData.reason || "Time slot unavailable",
          start_time: newStartTime, // Changed from startTime to start_time
          end_time: newEndTime,     // Changed from endTime to end_time
          availability: "EXCLUSIVE", // EXCLUSIVE for Close Date time mode
        };
      }

      // Always use the regular schedules endpoint since /disable doesn't exist
      const response = await axiosClient.post("/auth/schedules", requestData);

      if (response.status === 201) {
        showToast(
          scheduleType === "day"
            ? "Date disabled successfully!"
            : "Time slot closed successfully!",
          "success"
        );

        // Reset form
        resetDisableDateForm();
        setNewStartTime("");
        setNewEndTime("");
        setPendingDisableDateData(null);

        // Refresh data
        fetchAllData();
      }
    } catch (error) {
      console.error("Error closing date/time:", error);
      showToast(
        `Failed to ${scheduleType === "day" ? "disable date" : "close time slot"}. ${error.response?.data?.message || "Please try again."
        }`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle time picker changes
  const handleStartTimeChange = (time) => {
    setNewStartTime(time);
  };

  const handleEndTimeChange = (time) => {
    setNewEndTime(time);
  };

  // Handle mode switch
  const handleModeSwitch = (mode) => {
    setActiveMode(mode);
  };

  // Handle schedule type switch
  const handleTypeSwitch = (type) => {
    setScheduleType(type);
  };

  // Load data on component mount and when viewed date changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Socket integration for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleScheduleChange = () => {
      console.log("[Socket] Schedule changed – fetching data...");
      fetchAllData();
    };

    const handleAppointmentChange = () => {
      console.log("[Socket] Appointment changed – fetching data...");
      fetchAllData();
    };

    // Listen for schedule changes
    socket.onDbChange("Schedule", "*", handleScheduleChange);

    // Listen for appointment changes
    socket.onDbChange("Appointment", "*", handleAppointmentChange);
    socket.onDbChange("AppointmentStatus", "*", handleAppointmentChange);

    return () => {
      socket.offDbChange("Schedule", "*", handleScheduleChange);
      socket.offDbChange("Appointment", "*", handleAppointmentChange);
      socket.offDbChange("AppointmentStatus", "*", handleAppointmentChange);
    };
  }, [socket, fetchAllData]);


  return (
    <div className="add-schedule-page h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Back Button */}
      <div className="flex-shrink-0 p-4 pb-2">
        <button
          onClick={() => navigate('/admin/schedule')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Schedule
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 px-4 pb-4 min-h-0">
        {/* Left Column - Calendar */}
        <div className="bg-white rounded-lg shadow-md shadow-gray-600 p-4 min-w-0 min-h-0 flex flex-col xl:col-span-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl font-semibold">
              {viewedDate.toLocaleString('default', { month: 'long' })} {viewedDate.getFullYear()}
            </span>
          </div>
          <div className="rounded-xl bg-black p-3 shadow-md shadow-gray-600 flex-1 flex flex-col">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              onActiveStartDateChange={handleViewChange}
              tileClassName="relative"
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const ds = getLocalDateString(date);

                  // Check if date is disabled (has disabled schedule)
                  const isDisabled = isDateDisabled(date);

                  // Show red X for disabled dates
                  if (isDisabled) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-red-500 text-3xl font-bold disabled-date-indicator">×</span>
                      </div>
                    );
                  }

                  const activeSchedules = calendarEvents.filter(event =>
                    event.date === ds && event.isSchedule && event.isActive
                  ).length;

                  const confirmedAppointments = calendarEvents.filter(event =>
                    event.date === ds && event.isAppointment && event.isActive
                  ).length;

                  const totalCount = activeSchedules + confirmedAppointments;

                  return totalCount > 0 ? (
                    <span className="absolute top-1 right-1 rounded-full bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center">
                      {totalCount}
                    </span>
                  ) : null;
                }
                return null;
              }}
              showNeighboringMonth={false}
              className="w-full rounded-lg flex-1"
            />
          </div>
        </div>

        {/* Middle Column - Selected Date Details */}
        <div className="flex flex-col gap-4 min-w-0 min-h-0 xl:col-span-3">
          {/* Top Card - Schedules list */}
          <div className="bg-white rounded-xl shadow-md shadow-gray-600 p-4 flex flex-col flex-1 min-h-0">
            <h2 className="text-2xl font-bold mb-1">
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
            <div className="text-gray-600 font-semibold mb-3">Schedules</div>

            <div className="space-y-2 flex-1 overflow-y-auto px-1">
              {dayEvents.length > 0 ? (
                dayEvents.map((event, index) => (
                  <div
                    key={event.id || index}
                    onClick={() => setSelectedSchedule(event)}
                    className={`bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer rounded-lg px-3 py-2 ${selectedSchedule?.id === event.id ? "ring-2 ring-inset ring-purple-500" : ""
                      }`}
                  >
                    <div className="font-semibold truncate">{event.title || (event.type === "DISABLED" ? "Date Closed" : "Untitled")}</div>
                    <div className="text-xs text-gray-600">
                      {event.type !== "DISABLED" && event.startTime && event.endTime && !event.hasFlexibleTime
                        ? `${formatTimeTo12H(event.startTime)} - ${formatTimeTo12H(event.endTime)}`
                        : event.hasFlexibleTime
                          ? "Flexible Time"
                          : event.type === "DISABLED"
                            ? "All Day - Unavailable"
                            : "No time specified"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">No schedules or appointments for this date</div>
              )}
            </div>
          </div>

          {/* Bottom Card - Selected event details */}
          <div className="bg-white rounded-xl shadow-md shadow-gray-600 p-4 h-[20rem] overflow-y-auto">
            {selectedSchedule ? (
              <>
                <div className="mb-2">
                  <div className="text-xl font-bold">{selectedSchedule.title || "Event Details"}</div>
                  <div className="text-sm text-gray-600">
                    {selectedSchedule.startTime && selectedSchedule.endTime && !selectedSchedule.hasFlexibleTime
                      ? `${formatTimeTo12H(selectedSchedule.startTime)} - ${formatTimeTo12H(selectedSchedule.endTime)}`
                      : selectedSchedule.hasFlexibleTime
                        ? "Flexible Time"
                        : ""}
                  </div>
                </div>

                <div className="text-gray-800 mb-2 font-semibold text-lg">Description</div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {selectedSchedule.description
                    ? selectedSchedule.description
                    : "No description provided for this event."}
                </div>
              </>
            ) : (
              <div className="text-gray-500 italic">Select an event from the list above to view details</div>
            )}
          </div>
        </div>

        {/* Right Column - Add Schedule / Close Date Form */}
        <div className="bg-white rounded-lg shadow-md shadow-gray-600 p-4 overflow-y-auto min-w-0 min-h-0 xl:col-span-3">


          {/* Mode Selection Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleModeSwitch("addSchedule")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeMode === "addSchedule"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              Add Schedule
            </button>
            <button
              onClick={() => handleModeSwitch("closeDate")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeMode === "closeDate"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              Close a Date
            </button>
          </div>

          {activeMode === "addSchedule" && (
            <>
              {/* Add Schedule Form - Only for specific time (SHARED) */}
              <form onSubmit={handleScheduleSubmit(onNewScheduleSubmit)} className="space-y-4">
                <div className="text-lg font-semibold mb-4">
                  Add a schedule for {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">
                    Important Notes for Regular Schedules:
                  </h3>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
                    <li>Schedules must be between 6:00 AM and 6:00 PM</li>
                    <li>Minimum duration is 15 minutes</li>
                    <li><strong>Schedules can be created during exclusive event times (unlike appointments)</strong></li>
                    <li>Maximum 5 overlapping shared events allowed</li>
                  </ul>
                </div>
                {/* Schedule Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Schedule Title
                  </label>
                  <FormInput
                    register={scheduleRegister}
                    name="title"
                    placeholder="Enter schedule title"
                    error={scheduleErrors.title || ""}
                    type="text"
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <CustomMultiLineInput
                    register={scheduleRegister}
                    name="description"
                    placeholder="Enter description (optional)"
                    rows={4}
                    error={scheduleErrors?.description || ""}
                    className="w-full"
                  />
                </div>

                {/* Time Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Time
                    </label>
                    <TimePicker
                      value={newStartTime}
                      onChange={handleStartTimeChange}
                      placeholder="Start time"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Time
                    </label>
                    <TimePicker
                      value={newEndTime}
                      onChange={handleEndTimeChange}
                      placeholder="End time"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <StyledButton
                  type="submit"
                  buttonColor="bg-purple-500"
                  hoverColor="hover:bg-purple-600"
                  textColor="text-white"
                  className="w-full py-3 font-semibold transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add Schedule"}
                </StyledButton>
              </form>

            </>
          )}

          {activeMode === "closeDate" && (
            <>
              {/* Schedule Type Selection for Close Date */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleTypeSwitch("day")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${scheduleType === "day"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Day
                </button>
                <button
                  onClick={() => handleTypeSwitch("time")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${scheduleType === "time"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Time
                </button>
              </div>

              {/* Warning and Notes for Close Date (Below buttons) */}
              <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  Make {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} unavailable
                </h3>
                <div className="text-sm text-red-700 font-semibold">Warning!</div>
                <p className="text-xs text-red-700 mt-1">
                  Disabling this date will prevent any new appointments from being created on this date. Existing appointments and schedules will not be affected.
                </p>
              </div>
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">Note for Date Disabling:</h4>
                <ul className="text-xs text-gray-700 list-disc pl-5 space-y-1">
                  <li>Date disabling covers the entire day (24 hours)</li>
                  <li>No time restrictions apply for disabling dates</li>
                  <li>This is different from regular schedule creation</li>
                </ul>
              </div>

              {/* Close Date Form */}
              <form onSubmit={handleDisableDateSubmit(onDisableDateSubmit)} className="space-y-3">
                <div className="text-lg font-semibold mb-1">
                  Close {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {/* Schedule Title - Hidden in Day Mode */}
                {scheduleType === "time" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Schedule Title
                    </label>
                    <FormInput
                      register={disableDateRegister}
                      name="title"
                      placeholder="Enter schedule title"
                      error={disableDateErrors?.title || ""}
                      type="text"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Description/Reason */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {scheduleType === "day" ? "Reason for closing" : "Description"}
                  </label>
                  <CustomMultiLineInput
                    register={disableDateRegister}
                    name="reason"
                    placeholder={scheduleType === "day" ? "Enter reason for closing this date" : "Enter description (optional)"}
                    rows={4}
                    error={disableDateErrors?.reason || ""}
                    className="w-full"
                  />
                </div>

                {/* Time Pickers - Only in Time Mode */}
                {scheduleType === "time" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Start Time
                      </label>
                      <TimePicker
                        value={newStartTime}
                        onChange={handleStartTimeChange}
                        placeholder="Start time"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        End Time
                      </label>
                      <TimePicker
                        value={newEndTime}
                        onChange={handleEndTimeChange}
                        placeholder="End time"
                      />
                    </div>
                  </div>
                )}

                <StyledButton
                  type="submit"
                  buttonColor="bg-red-500"
                  hoverColor="hover:bg-red-600"
                  textColor="text-white"
                  className="w-full py-3 font-semibold transition-all flex items-center justify-center gap-2"
                  disabled={isLoading}
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
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6" />
                    <path d="M9 9l6 6" />
                  </svg>
                  {isLoading ? "Processing..." : scheduleType === "day" ? "Disable Date" : "Close Time Slot"}
                </StyledButton>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#9590FF] rounded-full p-1">
              <LoadingSpinner />
            </div>
            <span className="text-gray-700 font-medium">Loading...</span>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={hideToast}
      />

      {/* Confirmation Modals */}
      
      {/* Add Schedule Confirmation Modal */}
      <ConfirmationModal
        isOpen={showScheduleConfirm}
        onClose={() => {
          setShowScheduleConfirm(false);
          setPendingScheduleData(null);
        }}
        onConfirm={handleScheduleConfirm}
        title="Confirm Schedule Creation"
        message={
          pendingScheduleData ? (
            <>
              Are you sure you want to add this schedule?
              <br />
              <br />
              <strong>Title:</strong> {pendingScheduleData.title}
              <br />
              <strong>Date:</strong> {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              <br />
              <strong>Time:</strong> {formatTimeTo12H(newStartTime)} - {formatTimeTo12H(newEndTime)}
              <br />
              {pendingScheduleData.description && (
                <>
                  <strong>Description:</strong> {pendingScheduleData.description}
                  <br />
                </>
              )}
              <strong>Availability:</strong> Shared
            </>
          ) : (
            "Are you sure you want to add this schedule?"
          )
        }
        type="question"
        theme="light"
      />

      {/* Disable Date Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisableDateConfirm}
        onClose={() => {
          setShowDisableDateConfirm(false);
          setPendingDisableDateData(null);
        }}
        onConfirm={handleDisableDateConfirm}
        title={scheduleType === "day" ? "⚠️ Disable Entire Date" : "⚠️ Close Time Slot"}
        message={
          pendingDisableDateData ? (
            <>
              <div className="text-red-600 font-semibold mb-2">
                ⚠️ WARNING: This action will prevent new appointments and schedules from being created!
              </div>
              Are you sure you want to {scheduleType === "day" ? "disable the entire date" : "close this time slot"}?
              <br />
              <br />
              <strong>Date:</strong> {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              <br />
              {scheduleType === "time" && (
                <>
                  <strong>Time:</strong> {formatTimeTo12H(newStartTime)} - {formatTimeTo12H(newEndTime)}
                  <br />
                  {pendingDisableDateData.title && (
                    <>
                      <strong>Title:</strong> {pendingDisableDateData.title}
                      <br />
                    </>
                  )}
                </>
              )}
              {scheduleType === "day" && (
                <>
                  <strong>Coverage:</strong> All Day (24 hours)
                  <br />
                </>
              )}
              {pendingDisableDateData.reason && (
                <>
                  <strong>Reason:</strong> {pendingDisableDateData.reason}
                  <br />
                </>
              )}
              <br />
              <div className="text-sm text-gray-600">
                Existing appointments and schedules will not be affected.
              </div>
            </>
          ) : (
            `Are you sure you want to ${scheduleType === "day" ? "disable this date" : "close this time slot"}?`
          )
        }
        type="danger"
        theme="light"
      />
    </div>
  );
};

export default AddSchedulePage;
