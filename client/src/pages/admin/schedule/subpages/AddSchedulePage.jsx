import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Calendar from "react-calendar";

import "react-calendar/dist/Calendar.css";

import TimePicker from "../../../../features/TimePicker";
import { FormInput } from "@/features/FormUtilities";
import Toast from "@/features/Toast";
import StyledButton from "@/components/buttons/StyledButton";
import { LoadingSpinner } from "@/components/commons";
import Breadcrumb from "@/components/Breadcrumb";
import axiosClient from "@/lib/axiosClient";
import {
  getLocalDateString,
  timeStringToMinutes,
  countOverlappingEvents,
  formatTimeTo12H,
} from "@/utils/scheduleUtils";
import { normalizeStatus } from "../../appointments/components/statusUtils";

const AddSchedulePage = () => {
  const navigate = useNavigate();

  // Calendar and form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewedDate, setViewedDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [backendEvents, setBackendEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state with react-hook-form
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  // Date disable feature state
  const [isDateDisableMode, setIsDateDisableMode] = useState(false);

  // Form setup for Add Schedule
  const {
    control: scheduleControl,
    register: scheduleRegister,
    handleSubmit: handleScheduleSubmit,
    formState: { errors: scheduleErrors },
    reset: resetScheduleForm,
    watch: watchSchedule,
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

  // Availability options for dropdown
  const availabilityOptions = [
    { value: "SHARED", label: "Shared - Can be booked with other events" },
    { value: "EXCLUSIVE", label: "Exclusive - Reserved for this event only" },
  ];

  // Toast state
  const [toastConfig, setToastConfig] = useState({
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToastConfig({
      message,
      type,
    });
  };

  const hideToast = () => {
    setToastConfig({
      ...toastConfig,
      message: "",
    });
  };

  // Build date strings
  const dateString = getLocalDateString(selectedDate);
  const monthLabel =
    selectedDate.toLocaleString("default", { month: "long" }) +
    " " +
    selectedDate.getFullYear();
  const weekdayName = selectedDate.toLocaleString("default", {
    weekday: "long",
  });
  const dayNum = selectedDate.getDate();

  // Fetch events for the selected date
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const formattedDate = dateString;

      // Fetch schedules
      const schedulesResponse = await axiosClient.get(
        `/auth/schedules?date=${formattedDate}`
      );

      // Process schedules - exclude COMPLETED and DISABLED (date disable entries)
      const scheduleEvents = schedulesResponse.data
        .filter(
          (schedule) =>
            schedule.status !== "COMPLETED" &&
            !(
              schedule.status === "DISABLED" &&
              schedule.title === "DATE_DISABLED"
            )
        )
        .map((schedule) => ({
          id: `schedule-${schedule.schedule_id}`,
          title: schedule.title || "Unnamed Schedule",
          description: schedule.description || "",
          date: schedule.date,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          availability: schedule.availability || "SHARED",
          status: schedule.status || "ACTIVE",
          isSchedule: true,
          schedule_id: schedule.schedule_id,
        }));

      // Fetch appointments
      const appointmentsResponse = await axiosClient.get(`/auth/appointment`);

      // Filter approved appointments for the selected date
      const approvedAppointments = appointmentsResponse.data.filter(
        (appointment) => {
          if (!appointment || !appointment.preferred_date) return false;

          const status = appointment.AppointmentStatus?.status || "";
          const isApproved = normalizeStatus(status) === "APPROVED";
          const appointmentDate = appointment.preferred_date.split("T")[0];

          return appointmentDate === formattedDate && isApproved;
        }
      );

      // Process appointments
      const appointmentEvents = approvedAppointments.map((appointment) => {
        let startTime = "09:00";
        let endTime = "10:00";

        if (appointment.start_time && appointment.end_time) {
          startTime = appointment.start_time;
          endTime = appointment.end_time;
        }

        return {
          id: `appointment-${appointment.appointment_id}`,
          appointment_id: appointment.appointment_id,
          title: appointment.purpose_of_visit || "Unnamed Appointment",
          date: appointment.preferred_date.split("T")[0],
          startTime,
          endTime,
          isAppointment: true,
          status: "APPROVED",
          availability: "SHARED",
        };
      });

      setBackendEvents([...scheduleEvents, ...appointmentEvents]);
    } catch (error) {
      console.error("Error fetching events:", error);
      showToast("Error loading schedule data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [dateString]);

  // Fetch calendar events for the month
  const fetchMonthEvents = useCallback(async () => {
    try {
      const year = viewedDate.getFullYear();
      const month = viewedDate.getMonth();

      const schedulesResponse = await axiosClient.get("/auth/schedules");
      const appointmentsResponse = await axiosClient.get("/auth/appointment");

      // Process schedules for the month
      const monthSchedules = schedulesResponse.data
        .filter((schedule) => {
          if (!schedule.date) return false;
          const scheduleDate = new Date(schedule.date);
          return (
            !isNaN(scheduleDate.getTime()) &&
            scheduleDate.getMonth() === month &&
            scheduleDate.getFullYear() === year
          );
        })
        .map((schedule) => ({
          id: `schedule-${schedule.schedule_id}`,
          date: schedule.date.split("T")[0],
          isActive: schedule.status !== "COMPLETED",
          isSchedule: true,
          isDisabled: schedule.status === "DISABLED",
        }));

      // Process appointments for the month
      const monthAppointments = appointmentsResponse.data
        .filter((appointment) => {
          if (!appointment.preferred_date) return false;
          const dateStr = appointment.preferred_date.split("T")[0];
          const appointmentDate = new Date(dateStr);

          return (
            !isNaN(appointmentDate.getTime()) &&
            appointmentDate.getMonth() === month &&
            appointmentDate.getFullYear() === year
          );
        })
        .map((appointment) => ({
          id: `appointment-${appointment.appointment_id}`,
          date: appointment.preferred_date.split("T")[0],
          isActive:
            normalizeStatus(appointment.AppointmentStatus?.status || "") ===
            "APPROVED",
          isAppointment: true,
        }));

      setCalendarEvents([...monthSchedules, ...monthAppointments]);
    } catch (error) {
      console.error("Error fetching monthly events:", error);
    }
  }, [viewedDate]);

  // Fetch disabled dates from schedules table
  const fetchDisabledDates = useCallback(async () => {
    try {
      const response = await axiosClient.get("/auth/schedules");
      if (response.data && Array.isArray(response.data)) {
        // Filter schedules that are marked as disabled (status = 'DISABLED')
        const disabledSchedules = response.data.filter(
          (schedule) =>
            schedule.status === "DISABLED" && schedule.title === "DATE_DISABLED"
        );
        setDisabledDates(
          disabledSchedules.map((schedule) => schedule.date.split("T")[0])
        );
      }
    } catch (error) {
      console.error("Error fetching disabled dates:", error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedDate, fetchEvents]);

  useEffect(() => {
    fetchMonthEvents();
    fetchDisabledDates();
  }, [viewedDate, fetchMonthEvents, fetchDisabledDates]);

  // Handle adding a new schedule with react-hook-form
  const onScheduleSubmit = async (data) => {
    try {
      if (!newStartTime || !newEndTime) {
        showToast("Please select start and end times", "error");
        return;
      }

      const startMinutes = timeStringToMinutes(newStartTime);
      const endMinutes = timeStringToMinutes(newEndTime);
      const sixAM = timeStringToMinutes("06:00");
      const sixPM = timeStringToMinutes("18:00");

      if (startMinutes < sixAM || endMinutes > sixPM) {
        showToast("Schedule must be between 6:00 AM and 6:00 PM", "error");
        return;
      }

      if (startMinutes >= endMinutes) {
        showToast("Start time must be earlier than end time", "error");
        return;
      }

      const duration = endMinutes - startMinutes;
      if (duration < 15) {
        showToast("Schedule duration must be at least 15 minutes", "error");
        return;
      }

      // Check for exclusive event conflicts
      const existingExclusiveEvent = backendEvents.find((event) => {
        if (!event.isSchedule) return false;
        if (event.availability === "EXCLUSIVE" && event.date === dateString) {
          const eventStart = timeStringToMinutes(event.startTime);
          const eventEnd = timeStringToMinutes(event.endTime);
          return startMinutes < eventEnd && eventStart < endMinutes;
        }
        return false;
      });

      if (existingExclusiveEvent) {
        showToast(
          "Cannot schedule during an exclusive event time slot",
          "error"
        );
        return;
      }

      if (data.availability === "EXCLUSIVE") {
        const existingEvents = backendEvents.filter((event) => {
          if (event.date !== dateString) return false;
          const eventStart = timeStringToMinutes(event.startTime);
          const eventEnd = timeStringToMinutes(event.endTime);
          return startMinutes < eventEnd && eventStart < endMinutes;
        });

        if (existingEvents.length > 0) {
          showToast(
            "Cannot set as exclusive - time slot already has events scheduled",
            "error"
          );
          return;
        }
      }

      if (data.availability === "SHARED") {
        const overlappingCount = countOverlappingEvents(
          backendEvents,
          newStartTime,
          newEndTime
        );
        if (overlappingCount >= 5) {
          showToast(
            "Maximum limit reached: Cannot add more than 5 overlapping events",
            "error"
          );
          return;
        }
      }

      const scheduleData = {
        title: data.title,
        description: data.description,
        date: dateString,
        start_time: newStartTime,
        end_time: newEndTime,
        availability: data.availability,
      };

      await axiosClient.post("/auth/schedules", scheduleData);
      showToast("Schedule added successfully", "success");

      // Reset form
      resetScheduleForm();
      setNewStartTime("");
      setNewEndTime("");

      // Refresh events
      fetchEvents();
      fetchMonthEvents();
    } catch (error) {
      console.error("Error creating schedule:", error);
      showToast(
        error.response?.data?.message || "Failed to create schedule",
        "error"
      );
    }
  };

  // Handle disabling a date with react-hook-form
  const onDisableDateSubmit = async (data) => {
    try {
      // Create a special schedule entry to mark the date as disabled
      // For disable dates, we bypass the 6AM-6PM validation since it's a different use case
      const disableScheduleData = {
        title: "DATE_DISABLED",
        description: data.reason,
        date: dateString,
        start_time: "00:00", // Full day disable - bypass time validation
        end_time: "23:59", // Full day disable - bypass time validation
        availability: "EXCLUSIVE",
        status: "DISABLED",
      };

      await axiosClient.post("/auth/schedules", disableScheduleData);

      showToast("Date disabled successfully", "success");
      resetDisableDateForm();
      setIsDateDisableMode(false);

      // Refresh disabled dates
      fetchDisabledDates();
      fetchMonthEvents();
    } catch (error) {
      console.error("Error disabling date:", error);
      showToast(
        error.response?.data?.message || "Failed to disable date",
        "error"
      );
    }
  };

  // Check if date is disabled
  const isDateDisabled = (date) => {
    const dateStr = getLocalDateString(date);
    return disabledDates.includes(dateStr);
  };

  return (
    <>
      <div className="flex w-full h-full select-none gap-x-10">
        <div className="min-w-[55rem] h-full">
          
 <Calendar
    onChange={setSelectedDate}
    value={selectedDate}
    tileClassName={({ date }) => {
      const dateStr = getLocalDateString(date);
      if (isDateDisabled(date)) {
        return "bg-red-100  text-red-500 cursor-not-allowed";
      }
      return "relative";
    }}
    tileContent={({ date, view }) => {
      if (view === "month") {
        const ds = getLocalDateString(date);

        if (isDateDisabled(date)) {
          return (
            <span className="absolute top-1 right-1 text-red-500 text-xs font-bold">
              X
            </span>
          );
        }

        const activeSchedules = calendarEvents.filter(
          (event) =>
            event.date === ds && event.isSchedule && event.isActive
        ).length;

        const confirmedAppointments = calendarEvents.filter(
          (event) =>
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
    tileDisabled={({ date }) =>
      isDateDisabled(date) && !isDateDisableMode
    }
    showNeighboringMonth={false}
    className="w-full h-[400px]  rounded-lg text-4xl" // override width & height heres
    
  />


        </div>
        <div className="min-w-[30rem] h-full"></div>
        <div className="w-full h-full"></div>
      </div>
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
      <Toast
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={hideToast}
      />
    </>
  );
};

export default AddSchedulePage;
