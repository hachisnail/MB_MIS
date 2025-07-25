// src/pages/Schedule.jsx

import React, { useState, useCallback, useEffect } from 'react';
import Calendar from 'react-calendar';
import TimePicker from 'react-time-picker';
import 'react-calendar/dist/Calendar.css';
import 'react-time-picker/dist/TimePicker.css';
import LiveClock from '../../components/function/LiveClock';
import Toast from '../../components/function/Toast';
import DayScheduler from '../../components/DayScheduler'; // Import the new DayScheduler component
import { LoadingSpinner } from '../../components/list/commons'; // Import LoadingSpinner
import axiosClient from '../../lib/axiosClient'; // Import axiosClient for API calls
import { AppointmentViewPage } from '../../components/subpages/AppointmentViewPage'; // Import AppointmentViewPage
import ConfirmationModal from '../../components/modals/ConfirmationModal'; // Import ConfirmationModal
import StyledButton from '../../components/buttons/StyledButton'; // Import StyledButton


// ---------------- UTILITY FUNCTIONS ----------------
// Safely build a YYYY-MM-DD string from a Date object (no UTC offset).
function getLocalDateString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeStringToMinutes(str) {
  const [hourStr, minuteStr] = str.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10) || 0;
  return hour * 60 + minute;
}

function formatTimeTo12H(str) {
  if (!str) return '';

  let [hour, minute] = str.split(':');
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10) || 0;

  const suffix = hour >= 12 ? 'pm' : 'am';
  const normalized = hour % 12 || 12;
  const minuteStr = minute.toString().padStart(2, '0');
  return `${normalized}:${minuteStr}${suffix}`;
}

function countOverlappingEvents(events, startTime, endTime) {
  const newStart = timeStringToMinutes(startTime);
  const newEnd = timeStringToMinutes(endTime);

  const newEvent = { start: newStart, end: newEnd };

  return events.filter(event => {
    const eventStart = timeStringToMinutes(event.startTime);
    const eventEnd = timeStringToMinutes(event.endTime);
    return (newEvent.start < eventEnd && eventStart < newEvent.end);
  }).length;
}

// ---------------- MAIN SCHEDULE PAGE ----------------
const Schedule = () => {
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newAvailability, setNewAvailability] = useState('SHARED'); // Default to 'SHARED'
  // Track the currently selected appointment from the DayScheduler
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // State to manage new schedule form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');

  // Build a local date string for the selected date (no UTC offset).
  const dateString = getLocalDateString(selectedDate);
  const monthLabel = selectedDate.toLocaleString('default', { month: 'long' }) + ' ' + selectedDate.getFullYear();
  const weekdayName = selectedDate.toLocaleString('default', { weekday: 'long' });
  const dayNum = selectedDate.getDate();

  const [backendEvents, setBackendEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Managed by fetchAllData

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [todayTours, setTodayTours] = useState([]);
  const [viewedDate, setViewedDate] = useState(new Date());

  // Define utility functions for data fetching using real backend APIs
  const fetchSchedules = useCallback(async (date = null) => {
    try {
      const params = date ? { date: getLocalDateString(date) } : {};
      const response = await axiosClient.get('/auth/schedules', { params });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching schedules:', error);
      showToast('Error loading schedule data', 'error');
      return [];
    }
  }, []);

  const fetchAppointments = useCallback(async (date = null) => {
    try {
      // Fetch ALL appointments first, then filter by date and status on client side
      // This matches the old project's approach
      const response = await axiosClient.get('/auth/appointment');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showToast('Error loading appointment data', 'error');
      return [];
    }
  }, []);

  // Transform backend data to match the expected format for DayScheduler
  const transformScheduleData = (schedules) => {
    return schedules
      .filter(schedule => schedule.status !== 'COMPLETED') // Filter out COMPLETED schedules from day scheduler
      .map(schedule => ({
        id: `schedule-${schedule.schedule_id}`,
        schedule_id: schedule.schedule_id,
        title: schedule.title || 'Unnamed Schedule',
        description: schedule.description || '',
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        availability: schedule.availability || 'SHARED',
        status: schedule.status || 'ACTIVE',
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        isSchedule: true,
        isAppointment: false,
        isActive: schedule.status !== 'COMPLETED' // Add isActive property
      }));
  };

  const transformAppointmentData = (appointments) => {
    return appointments.map(appointment => {
      const visitor = appointment.Visitor || {};
      const status = appointment.AppointmentStatus?.status || 'TO_REVIEW';

      // Only include confirmed appointments in the schedule view
      if (status !== 'CONFIRMED') return null;

      return {
        id: `appointment-${appointment.appointment_id}`,
        appointment_id: appointment.appointment_id,
        title: appointment.purpose_of_visit,
        description: appointment.additional_notes || '',
        date: appointment.preferred_date,
        startTime: appointment.start_time || '09:00',
        endTime: appointment.end_time || '10:00',
        organizer: `${visitor.first_name || ''} ${visitor.last_name || ''}`.trim(),
        numPeople: appointment.population_count,
        status: status,
        isSchedule: false,
        isAppointment: true,
        isActive: status === 'CONFIRMED' // Add isActive property
      };
    }).filter(Boolean); // Remove null entries
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Format date for API
      const formattedDate = dateString;
      console.log("Fetching data for date:", formattedDate);

      // FETCH SCHEDULES 
      console.log("Fetching schedules from:", `/auth/schedules?date=${formattedDate}`);
      const schedulesResponse = await axiosClient.get(`/auth/schedules?date=${formattedDate}`);
      console.log("Raw schedules data:", schedulesResponse.data);

      // Process schedules - filter out COMPLETED status
      const scheduleEvents = schedulesResponse.data
        .filter(schedule => schedule.status !== 'COMPLETED')
        .map(schedule => ({
          id: `schedule-${schedule.schedule_id}`,
          title: schedule.title || 'Unnamed Schedule',
          description: schedule.description || '',
          date: schedule.date,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          availability: schedule.availability || 'SHARED',
          status: schedule.status || 'ACTIVE',
          isSchedule: true,
          schedule_id: schedule.schedule_id, // Store the ID for easier access later
          isActive: schedule.status !== 'COMPLETED' // Add isActive property
        }));

      console.log("Processed schedule events:", scheduleEvents);

      // FETCH ALL APPOINTMENTS
      console.log("Fetching appointments from:", `/auth/appointment`);
      let appointmentsResponse;
      try {
        appointmentsResponse = await axiosClient.get(`/auth/appointment`);
        console.log("Raw appointments data count:", appointmentsResponse.data.length);
      } catch (appointmentError) {
        console.error("Error fetching appointments:", appointmentError);
        showToast('Failed to load appointments', 'error');
        appointmentsResponse = { data: [] };
      }

      // CONFIRMED APPOINTMENTS ONLY - Filter by status and date
      const confirmedAppointments = appointmentsResponse.data.filter(appointment => {
        if (!appointment || !appointment.preferred_date) {
          return false;
        }

        // Check if status is CONFIRMED
        const status = appointment.AppointmentStatus?.status || '';
        const isConfirmed = status.toUpperCase() === 'CONFIRMED';

        // Normalize date format by removing any time portion
        const appointmentDate = appointment.preferred_date.split('T')[0];

        // Match both date and CONFIRMED status
        const matches = appointmentDate === formattedDate && isConfirmed;

        if (matches) {
          console.log("Found CONFIRMED appointment for selected date:", appointment);
        }

        return matches;
      });

      console.log("CONFIRMED appointments count:", confirmedAppointments.length);

      // Process CONFIRMED appointments
      const appointmentEvents = confirmedAppointments.map(appointment => {
        // Handle time formats
        let startTime = "09:00";
        let endTime = "10:00";

        // Try to use direct time fields first
        if (appointment.start_time && appointment.end_time) {
          startTime = appointment.start_time;
          endTime = appointment.end_time;
        }
        // Fall back to preferred_time if available
        else if (appointment.preferred_time && appointment.preferred_time.includes('-')) {
          const [startPart, endPart] = appointment.preferred_time.split('-').map(t => t.trim());

          // Convert from 12-hour format (9:00 AM) to 24-hour format (09:00)
          if (startPart) {
            startTime = convertTo24Hour(startPart);
          }

          if (endPart) {
            endTime = convertTo24Hour(endPart);
          } else {
            // If no end time, add 1 hour to start time
            const hourVal = parseInt(startTime.split(':')[0], 10);
            const minuteVal = parseInt(startTime.split(':')[1], 10);
            const newHour = (hourVal + 1) % 24;
            endTime = `${newHour.toString().padStart(2, '0')}:${minuteVal.toString().padStart(2, '0')}`;
          }
        }

        return {
          id: `appointment-${appointment.appointment_id}`,
          appointment_id: appointment.appointment_id, // Add this field
          title: appointment.purpose_of_visit || 'Unnamed Appointment',
          description: appointment.additional_notes || '',
          date: appointment.preferred_date.split('T')[0],
          startTime,
          endTime,
          organizer: appointment.Visitor ?
            `${appointment.Visitor.first_name || ''} ${appointment.Visitor.last_name || ''}`.trim() :
            'Unknown Visitor',
          numPeople: `${appointment.population_count || 1} visitors`,
          isAppointment: true,
          status: 'CONFIRMED',
          availability: 'SHARED', // All appointments are shared by default
          isActive: true // Add isActive property for confirmed appointments
        };
      });

      console.log("Processed appointment events:", appointmentEvents);

      // Combine and set events
      const allEvents = [...appointmentEvents, ...scheduleEvents];
      console.log("Final combined events:", allEvents);
      console.log("Total events:", allEvents.length);

      setBackendEvents(allEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      showToast('Error loading schedule data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dateString]);

  const fetchTodayTours = useCallback(async () => {
    try {
      console.log("hit");

      // Format date for API
      const formattedDate = dateString;
      console.log("Fetching today's tours for:", formattedDate);

      // Get all schedules for today (including completed ones)
      const schedulesResponse = await axiosClient.get(`/auth/schedules?date=${formattedDate}`);

      // Get all appointments
      const appointmentsResponse = await axiosClient.get(`/auth/appointment`);

      console.log("Today's schedules:", schedulesResponse.data.length);
      console.log("All appointments:", appointmentsResponse.data.length);

      // Process all schedules for today
      const todaySchedules = schedulesResponse.data
        .filter(schedule => schedule && schedule.date)  // Ensure date exists
        .map(schedule => ({
          id: `schedule-${schedule.schedule_id}`,
          title: schedule.title || 'Schedule',
          organizer: 'Schedule',
          date: schedule.date,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          isDone: schedule.status === 'COMPLETED',
          isSchedule: true
        }));

      console.log("Processed schedules:", todaySchedules.length);

      // Filter appointments for today's date and process them
      // Only include CONFIRMED and COMPLETED appointments
      const todayAppointments = appointmentsResponse.data
        .filter(appointment => {
          // Skip if preferred_date is missing
          if (!appointment.preferred_date) {
            return false;
          }

          // Normalize date format by removing any time portion
          const appointmentDate = appointment.preferred_date.split('T')[0];
          const matchesDate = appointmentDate === formattedDate;

          if (matchesDate) {
            console.log(`Found appointment for ${formattedDate}:`, appointment.appointment_id);
          }

          return matchesDate;
        })
        .filter(appointment => {
          // Only include CONFIRMED and COMPLETED appointments (case-insensitive)
          const status = (appointment.AppointmentStatus?.status || '').toUpperCase();
          return status === 'CONFIRMED' || status === 'COMPLETED';
        })
        .map(appointment => {
          // Process time values
          let startTime = "09:00";
          let endTime = "10:00";

          // Try direct time fields first
          if (appointment.start_time && appointment.end_time) {
            startTime = appointment.start_time;
            endTime = appointment.end_time;
            console.log(`Using direct time fields for ${appointment.appointment_id}: ${startTime}-${endTime}`);
          }
          // Fall back to preferred_time if available
          else if (appointment.preferred_time && typeof appointment.preferred_time === 'string') {
            try {
              const timeParts = appointment.preferred_time.split('-');
              if (timeParts[0]) startTime = convertTo24Hour(timeParts[0].trim());
              if (timeParts[1]) endTime = convertTo24Hour(timeParts[1].trim());
              console.log(`Parsed preferred_time for ${appointment.appointment_id}: ${startTime}-${endTime}`);
            } catch (error) {
              console.error("Error parsing preferred_time:", appointment.preferred_time, error);
              // Keep default times on error
            }
          }

          return {
            id: `appointment-${appointment.appointment_id}`,
            appointment_id: appointment.appointment_id, // Add this field
            title: appointment.purpose_of_visit || 'Visitor Appointment',
            organizer: appointment.Visitor ?
              `${appointment.Visitor.first_name || ''} ${appointment.Visitor.last_name || ''}`.trim() :
              'Unknown Visitor',
            numPeople: `${appointment.population_count || 1} visitors`,
            date: appointment.preferred_date.split('T')[0],
            startTime,
            endTime,
            isDone: (appointment.AppointmentStatus?.status || '').toUpperCase() === 'COMPLETED',
            isAppointment: true
          };
        });

      console.log("Processed appointments:", todayAppointments.length);

      // Combine and sort by start time
      const allTours = [...todaySchedules, ...todayAppointments];
      allTours.sort((a, b) => {
        return timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime);
      });

      console.log("Today's total tours:", allTours.length);
      setTodayTours(allTours);

    } catch (error) {
      console.error('Error fetching today tours:', error);
      showToast('Error loading today\'s tours', 'error');
    }
  }, [dateString]);

  // Helper function to convert 12-hour time format to 24-hour format (from old project)
  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "09:00";

    // Check if time string has AM/PM
    const hasAMPM = timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm');

    if (hasAMPM) {
      // Handle 12-hour format with AM/PM
      const isPM = timeStr.toLowerCase().includes('pm');
      // Remove AM/PM and trim
      const cleanTime = timeStr.toLowerCase().replace(/am|pm/g, '').trim();
      const [hourStr, minuteStr] = cleanTime.split(':');
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr || '0', 10);

      // Convert to 24-hour format
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;

      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    } else {
      // Already in 24-hour format or just missing AM/PM
      const [hourStr, minuteStr] = timeStr.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr || '0', 10);

      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  };

  const fetchMonthEvents = useCallback(async () => {
    try {
      const year = viewedDate.getFullYear();
      const month = viewedDate.getMonth();

      console.log(`Fetching calendar events for month: ${month + 1}/${year}`);

      // Get all schedules
      const schedulesResponse = await axiosClient.get('/auth/schedules');
      console.log("All schedules:", schedulesResponse.data.length);

      // Get all appointments
      const appointmentsResponse = await axiosClient.get('/auth/appointment');
      console.log("All appointments:", appointmentsResponse.data.length);

      // Filter schedules for this month and process them
      const monthSchedules = schedulesResponse.data
        .filter(schedule => {
          if (!schedule.date) return false;

          // Parse date properly and compare year and month
          const scheduleDate = new Date(schedule.date);
          return !isNaN(scheduleDate.getTime()) &&
            scheduleDate.getMonth() === month &&
            scheduleDate.getFullYear() === year;
        })
        .map(schedule => ({
          id: `schedule-${schedule.schedule_id}`,
          date: schedule.date.split('T')[0], // Normalize date format
          isActive: schedule.status !== 'COMPLETED',
          isSchedule: true
        }));

      console.log("Month-filtered schedules:", monthSchedules.length);

      // Filter appointments for this month and process them
      const monthAppointments = appointmentsResponse.data
        .filter(appointment => {
          // Skip appointments without preferred_date
          if (!appointment.preferred_date) return false;

          // Extract date and normalize format (remove time portion if present)
          const dateStr = appointment.preferred_date.split('T')[0];
          const appointmentDate = new Date(dateStr);

          // Check if date is valid and in current month/year
          return !isNaN(appointmentDate.getTime()) &&
            appointmentDate.getMonth() === month &&
            appointmentDate.getFullYear() === year;
        })
        .map(appointment => ({
          id: `appointment-${appointment.appointment_id}`,
          date: appointment.preferred_date.split('T')[0],
          isActive: (appointment.AppointmentStatus?.status || '').toUpperCase() === 'CONFIRMED',
          isAppointment: true
        }));

      console.log("Month-filtered appointments:", monthAppointments.length);

      // Combine both types of events
      const allEvents = [...monthSchedules, ...monthAppointments];
      console.log(`Total filtered calendar events: ${allEvents.length}`);

      setCalendarEvents(allEvents);
    } catch (error) {
      console.error('Error fetching monthly events:', error);
    }
  }, [viewedDate]);

  // Memoize fetchAllData
  const fetchAllData = useCallback(async () => {
    setIsLoading(true); // Start loading
    try {
      await Promise.all([
        fetchEvents(),
        fetchTodayTours(),
        fetchMonthEvents()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false); // End loading
    }
  }, [fetchEvents, fetchTodayTours, fetchMonthEvents]); // Removed isLoading from dependencies

  // Single useEffect for initial data load
  useEffect(() => {
    fetchAllData();
  }, [selectedDate, viewedDate, fetchAllData]); // Re-run when selectedDate or viewedDate changes

  // Handle mark as done button click
  const handleMarkAsDone = async () => {
    if (!selectedAppointment) return;

    if (selectedAppointment.isAppointment) {
      // Fetch real appointment data from backend
      try {
        const response = await axiosClient.get(`/auth/attendance/${selectedAppointment.appointment_id}`);
        const appointmentData = response.data;

        setModalData({
          appointmentId: selectedAppointment.appointment_id,
          fromFirstName: appointmentData.fromFirstName || '',
          fromLastName: appointmentData.fromLastName || '',
          email: appointmentData.email || '',
          phone: appointmentData.phone || '',
          organization: appointmentData.organization || '',
          street: appointmentData.street || '',
          barangay: appointmentData.barangay || '',
          city_municipality: appointmentData.city_municipality || '',
          province: appointmentData.province || '',
          purpose: appointmentData.purpose || selectedAppointment.title,
          populationCount: appointmentData.populationCount || selectedAppointment.numPeople || 0,
          preferredDate: appointmentData.preferredDate || selectedAppointment.date,
          preferredTime: appointmentData.preferredTime || `${selectedAppointment.startTime} - ${selectedAppointment.endTime}`,
          notes: appointmentData.notes || selectedAppointment.description || '',
          status: appointmentData.status || 'CONFIRMED',
          dateSent: appointmentData.creation_date || new Date().toLocaleString()
        });
        setShowAppointmentModal(true);
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        showToast('Error loading appointment details', 'error');
      }
    } else if (selectedAppointment.isSchedule) {
      setShowConfirmModal(true);
    }
  };

  // Handle schedule confirmation
  const handleScheduleConfirm = async () => {
    try {
      setIsLoading(true);
      const scheduleId = selectedAppointment.schedule_id;
      await axiosClient.patch(`/auth/schedules/${scheduleId}/status`, {
        status: 'COMPLETED'
      });
      showToast('Schedule marked as completed', 'success');
      setSelectedAppointment(null);
      setShowConfirmModal(false);
      fetchAllData(); // Refresh all data
    } catch (error) {
      console.error('Error updating schedule status:', error);
      showToast(error.message || 'Error updating schedule status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update appointment status
  const updateAppointmentStatus = async (appointmentId, status, presentCount = null) => {
    try {
      const requestData = { status };
      if (presentCount !== null) {
        requestData.present_count = presentCount;
      }

      await axiosClient.patch(`/auth/appointment/${appointmentId}/status`, requestData);
      fetchAllData(); // Refresh all data after update
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  };

  const handleAddEvent = async () => {
    try {
      if (!newTitle) {
        showToast('Please enter an event title', 'error');
        return;
      }

      const startMinutes = timeStringToMinutes(newStartTime);
      const endMinutes = timeStringToMinutes(newEndTime);
      const sevenAM = timeStringToMinutes('07:00');
      const fivePM = timeStringToMinutes('17:00');

      if (startMinutes < sevenAM || endMinutes > fivePM) {
        showToast('Schedule must be between 7:00 AM and 5:00 PM', 'error');
        return;
      }

      if (startMinutes >= endMinutes) {
        showToast('Start time must be earlier than end time', 'error');
        return;
      }

      const duration = endMinutes - startMinutes;
      if (duration < 15) {
        showToast('Schedule duration must be at least 15 minutes', 'error');
        return;
      }

      // Check for existing exclusive schedules
      const existingExclusiveEvent = backendEvents.find(event => {
        if (!event.isSchedule) return false;
        if (event.availability === 'EXCLUSIVE' && event.date === dateString) {
          const eventStart = timeStringToMinutes(event.startTime);
          const eventEnd = timeStringToMinutes(event.endTime);
          return (startMinutes < eventEnd && eventStart < endMinutes);
        }
        return false;
      });

      if (existingExclusiveEvent) {
        showToast('Cannot schedule during an exclusive event time slot', 'error');
        return;
      }

      // Check for adding an exclusive event
      if (newAvailability === 'EXCLUSIVE') {
        const existingEvents = backendEvents.filter(event => {
          if (event.date !== dateString) return false;
          const eventStart = timeStringToMinutes(event.startTime);
          const eventEnd = timeStringToMinutes(event.endTime);
          return (startMinutes < eventEnd && eventStart < endMinutes);
        });

        if (existingEvents.length > 0) {
          showToast('Cannot set as exclusive - time slot already has events scheduled', 'error');
          return;
        }
      }

      // Check for overlapping limit for shared events
      if (newAvailability === 'SHARED') {
        const overlappingCount = countOverlappingEvents(backendEvents, newStartTime, newEndTime);
        if (overlappingCount >= 5) { // Assuming a max of 5 overlapping shared events
          showToast('Maximum limit reached: Cannot add more than 5 overlapping events', 'error');
          return;
        }
      }

      const scheduleData = {
        title: newTitle,
        description: newDesc,
        date: dateString,
        start_time: newStartTime,
        end_time: newEndTime,
        availability: newAvailability
      };

      await axiosClient.post('/auth/schedules', scheduleData);

      showToast('Schedule added successfully', 'success');

      setNewTitle('');
      setNewDesc('');
      setNewStartTime('09:00');
      setNewEndTime('10:00');
      setNewAvailability('SHARED');

      fetchAllData(); // Refresh all data
    } catch (error) {
      console.error('Error creating schedule:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to create schedule', 'error');
    }
  };

  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToastConfig({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToastConfig({
      ...toastConfig,
      isVisible: false
    });
  };

  return (
    <div className="relative w-full h-full bg-[#F0F0F0] select-none flex pt-10 overflow-hidden">
      {showAppointmentModal && modalData ? (
        <AppointmentViewPage
          showModal={showAppointmentModal}
          modalData={modalData}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointment(null);
            setModalData(null);
          }}
          onSend={() => {
            fetchAllData(); // Refresh data after appointment update
          }}
          updateAppointmentStatus={updateAppointmentStatus}
          showRespondSection={true}
          isFullPage={false}
        />
      ) : (
        <div className="w-full bg-[#F0F0F0] h-full flex flex-col pb-7">
          <div className="w-full h-full flex flex-col xl:flex-row gap-y-5 xl:gap-y-0 justify-between px-4 sm:px-12 gap-x-10">

            {/* LEFT SECTION - Calendar & Today's Scheduled Tours */}
            <div className="w-full xl:w-[31rem] h-fit flex flex-col gap-y-6 items-center justify-around">
              {/* Calendar */}
              <div className="w-full xl:min-w-[31rem] xl:max-w-[31rem] min-h-[27rem] flex flex-col gap-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-semibold">{monthLabel}</span>
                </div>
                <div className="rounded-xl bg-black p-3 shadow-xl">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    tileClassName="relative"
                    onActiveStartDateChange={({ activeStartDate }) => {
                      setViewedDate(activeStartDate);
                    }}
                    tileContent={({ date, view }) => {
                      if (view === 'month') {
                        // Get the date string in YYYY-MM-DD format for comparison
                        const ds = getLocalDateString(date);

                        // Count active schedules for this date
                        const activeSchedules = calendarEvents.filter(event =>
                          event.date === ds && event.isSchedule && event.isActive
                        ).length;

                        // Count confirmed appointments for this date
                        const confirmedAppointments = calendarEvents.filter(event =>
                          event.date === ds && event.isAppointment && event.isActive
                        ).length;

                        // Total count of events
                        const totalCount = activeSchedules + confirmedAppointments;

                        // Only show badge if there are events (no zero badges)
                        return totalCount > 0 ? (
                          <span className="absolute top-1 right-1 rounded-full bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center">
                            {totalCount}
                          </span>
                        ) : null;
                      }
                      return null;
                    }}
                    showNeighboringMonth={false}
                    className="p-2 rounded-lg mx-auto text-lg"
                  />
                </div>
              </div>

              {/* Today's Scheduled Tours */}
              <div className="w-full xl:min-w-[31rem] xl:max-w-[31rem] flex flex-col h-[40rem] bg-white rounded-xl shadow-xl p-5">
                <span className="text-2xl font-semibold mb-4">Today's Scheduled Tours</span>
                <div className="w-full border-t border-gray-200 pt-4 space-y-3 max-h-140 overflow-y-auto">
                  {todayTours.length === 0 && (
                    <div className="bg-gray-100 text-gray-700 p-3 rounded-lg">
                      No Scheduled Tours
                    </div>
                  )}
                  {todayTours.map((tour, idx) => (
                    <div
                      key={tour.id || idx}
                      className={`
                        ${idx % 2 === 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}
                        p-3 rounded-lg flex items-center justify-between
                      `}
                    >
                      <div className="flex items-center flex-grow">
                        <div
                          className={`
                            ${idx % 2 === 0 ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-800'}
                            px-3 py-1.5 rounded mr-3 text-sm
                          `}
                        >
                          {formatTimeTo12H(tour.startTime)}-{formatTimeTo12H(tour.endTime)}
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">
                            {tour.organizer || 'No Name'}
                          </div>
                          <div className="text-sm truncate max-w-[150px]">
                            {tour.title}
                          </div>
                          {tour.numPeople && (
                            <div className="text-sm">{tour.numPeople}</div>
                          )}
                        </div>
                      </div>
                      {tour.isDone && (
                        <div className="bg-green-500 text-xs px-2 py-1 rounded whitespace-nowrap">
                          tour done
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION - Day Scheduler */}
            <div className="w-full xl:flex-1 h-full flex flex-col gap-y-8 min-w-0">
              {/* Title and date navigation */}
              <div className="w-full min-h-[5rem] flex flex-col justify-between">
                <span className="text-4xl font-bold text-black">Today's Schedule</span>
                <div className="w-full h-fit flex items-center">
                  <span className="w-[14rem] text-center text-3xl font-bold text-[#9590FF]">
                    {weekdayName} {dayNum}
                  </span>
                  <div className="flex items-center ml-4">
                    {/* <i
                      className="text-3xl fa-solid fa-less-than cursor-pointer hover:text-gray-700"
                      onClick={() => {
                        const prevDay = new Date(selectedDate);
                        prevDay.setDate(prevDay.getDate() - 1);
                        setSelectedDate(prevDay);
                      }}
                    />
                    <span className="mx-3" />
                    <i
                      className="text-3xl fa-solid fa-greater-than cursor-pointer hover:text-gray-700"
                      onClick={() => {
                        const nextDay = new Date(selectedDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setSelectedDate(nextDay);
                      }}
                    /> */}
                    <svg
                      className="w-8 h-8 cursor-pointer hover:text-gray-700"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      onClick={() => {
                        const prevDay = new Date(selectedDate);
                        prevDay.setDate(prevDay.getDate() - 1);
                        setSelectedDate(prevDay);
                      }}
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span className="mx-3" />
                    <svg
                      className="w-8 h-8 cursor-pointer hover:text-gray-700"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      onClick={() => {
                        const nextDay = new Date(selectedDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setSelectedDate(nextDay);
                      }}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* DayScheduler container */}
              <div className="w-full flex-1 bg-white p-5 rounded-xl shadow-xl overflow-hidden">
                <DayScheduler
                  appointments={backendEvents}
                  selectedDate={selectedDate}
                  onSelectAppointment={setSelectedAppointment}
                  selectedAppointment={selectedAppointment}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* RIGHT SECTION - Clock, Form, and Selected Appointment */}
            <div className="w-full xl:w-[31rem] h-full flex flex-col gap-y-5">
              {/* Live Clock with Time Context */}
              <div className="w-full rounded-xl bg-white shadow-xl p-6 flex items-center justify-center gap-x-8 hover:shadow-2xl transition-shadow">
                <div className="bg-gray-100 p-3 rounded-full">
                  {/* <i className="text-5xl fa-solid fa-clock text-[#9590FF]" /> */}
                  <svg
                    className="w-12 h-12 text-[#9590FF]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <LiveClock />
                </div>
              </div>

              {/* Add Schedule */}
              <div className="w-full max-w-lg mx-auto rounded-2xl bg-white shadow-2xl p-8 space-y-6">
                <div>
                  <span className="text-2xl font-bold block mb-2 text-gray-800">
                    Add a Schedule for
                  </span>
                  <span className="text-lg font-semibold text-[#A6A3F6]">
                    {weekdayName} {dayNum}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Event Title */}
                  <div className="flex flex-col">
                    <label htmlFor="event-title" className="text-sm text-gray-600 mb-1">
                      Event Title
                    </label>
                    <input
                      type="text"
                      id="event-title"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6A3F6] text-sm"
                      placeholder="Enter event title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>

                  {/* Event Description */}
                  <div className="flex flex-col">
                    <label htmlFor="event-desc" className="text-sm text-gray-600 mb-1">
                      Description
                    </label>
                    <textarea
                      id="event-desc"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6A3F6] text-sm resize-none"
                      rows="3"
                      placeholder="Enter event description"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>

                  {/* Start / End Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label htmlFor="start-time" className="text-sm text-gray-600 mb-1">
                        Start Time
                      </label>
                      <TimePicker
                        id="start-time"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6A3F6] text-sm"
                        onChange={setNewStartTime}
                        value={newStartTime}
                        format="hh:mm a"
                        disableClock
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="end-time" className="text-sm text-gray-600 mb-1">
                        End Time
                      </label>
                      <TimePicker
                        id="end-time"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6A3F6] text-sm"
                        onChange={setNewEndTime}
                        value={newEndTime}
                        format="hh:mm a"
                        disableClock
                      />
                    </div>
                  </div>

                  {/* Availability Selection - Improved Layout */}
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-2">
                      Availability
                    </label>
                    <div className="flex gap-4">
                      <label className="bg-white border border-gray-300 rounded-lg p-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors w-full">
                        <input
                          type="radio"
                          name="availability"
                          value="SHARED"
                          checked={newAvailability === 'SHARED'}
                          onChange={() => setNewAvailability('SHARED')}
                          className="w-4 h-4 text-[#A6A3F6] focus:ring-[#A6A3F6]"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">Shared</span>
                          <span className="text-xs text-gray-500">Can be booked with other events</span>
                        </div>
                      </label>
                      <label className="bg-white border border-gray-300 rounded-lg p-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors w-full">
                        <input
                          type="radio"
                          name="availability"
                          value="EXCLUSIVE"
                          checked={newAvailability === 'EXCLUSIVE'}
                          onChange={() => setNewAvailability('EXCLUSIVE')}
                          className="w-4 h-4 text-[#A6A3F6] focus:ring-[#A6A3F6]"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">Exclusive</span>
                          <span className="text-xs text-gray-500">Reserved for this event only</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Exclusive Event Warning/Helper */}
                  <div className="mt-2">
                    <div className="flex items-start">
                      {/* <i className="fas fa-info-circle text-blue-500 mr-2 mt-1"></i> */}
                      <svg
                        className="w-5 h-5 text-blue-500 mr-2 mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Note:</span> You cannot schedule during times that have exclusive events.
                        {newAvailability === 'EXCLUSIVE' && (
                          <span className="block mt-1 text-amber-600">
                            This event will be marked as exclusive and will block other events during this time slot.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Add Event Button */}
                  <StyledButton
                    onClick={handleAddEvent}
                    buttonColor="bg-[#A6A3F6]"
                    hoverColor="hover:bg-[#8e8aec]"
                    textColor="text-white"
                    className="w-full py-3 font-semibold transition-all flex items-center justify-center gap-2"
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
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Add Event
                  </StyledButton>
                </div>
              </div>

              {/* Selected Appointment/Schedule */}
              <div className="w-full shadow-xl bg-white rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Selected Event</h2>
                {selectedAppointment ? (
                  <>
                    {/* Title with label based on type */}
                    <p className="mb-2">
                      <strong>{selectedAppointment.isAppointment ? 'Purpose:' : 'Title:'}</strong> {selectedAppointment.title}
                    </p>

                    {/* Show Visitor only for appointments */}
                    {selectedAppointment.isAppointment && selectedAppointment.organizer && (
                      <p className="mb-2">
                        <strong>Visitor:</strong> {selectedAppointment.organizer}
                      </p>
                    )}

                    {/* Time for both types */}
                    <p className="mb-2">
                      <strong>Time:</strong>{' '}
                      {formatTimeTo12H(selectedAppointment.startTime)} -{' '}
                      {formatTimeTo12H(selectedAppointment.endTime)}
                    </p>

                    {/* Number of People only for appointments */}
                    {selectedAppointment.isAppointment && selectedAppointment.numPeople && (
                      <p className="mb-2">
                        <strong>Number of People:</strong>{' '}
                        {selectedAppointment.numPeople}
                      </p>
                    )}

                    {/* Availability only for schedules */}
                    {selectedAppointment.isSchedule && (
                      <p className="mb-2">
                        <strong>Availability:</strong>{' '}
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${selectedAppointment.availability === 'EXCLUSIVE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                          }`}>
                          {selectedAppointment.availability}
                        </span>
                      </p>
                    )}

                    {/* Description for both types */}
                    {selectedAppointment.description && (
                      <p className="mb-2">
                        <strong>Description:</strong>{' '}
                        <span className="text-gray-700">{selectedAppointment.description}</span>
                      </p>
                    )}

                    <div className="flex justify-end">
                      <StyledButton
                        onClick={handleMarkAsDone}
                        buttonColor="bg-green-500"
                        hoverColor="hover:bg-green-600"
                        textColor="text-white"
                        className="mt-4 transition-colors"
                      >
                        Mark as Done
                      </StyledButton>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 italic">No event selected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && ( // Simplified condition
        <div className="fixed inset-0 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg flex items-center space-x-3">
            <LoadingSpinner /> {/* Using the imported component */}
            <span>Loading events...</span>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <Toast
        message={toastConfig.message}
        type={toastConfig.type}
        isVisible={toastConfig.isVisible}
        onClose={hideToast}
      />

      {/* Confirmation modal for schedules */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleScheduleConfirm}
        title="Mark Schedule as Completed"
        message={
          <>
            Are you sure you want to mark this schedule as completed?
            <br />
            <span className="font-semibold">{selectedAppointment?.title}</span>
            <br />
            <span className="text-sm text-gray-500">
              {selectedAppointment?.date}, {formatTimeTo12H(selectedAppointment?.startTime)} - {formatTimeTo12H(selectedAppointment?.endTime)}
            </span>
          </>
        }
        type="question"
        theme="light"
      />
    </div>
  );
};

export default Schedule;
