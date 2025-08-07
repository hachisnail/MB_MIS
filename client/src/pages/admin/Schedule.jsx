// src/pages/Schedule.jsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import TimePicker from 'react-time-picker';
import 'react-calendar/dist/Calendar.css';
import 'react-time-picker/dist/TimePicker.css';
import LiveClock from '@/features/LiveClock';
import Toast from '@/features/Toast';
import DayScheduler from '@/features/DayScheduler';
import { LoadingSpinner, EmptyMessage } from '@/components/list/commons';
import ScheduleItem from '@/components/list/ScheduleItem';
import axiosClient from '@/lib/axiosClient';
import { AppointmentViewPage } from '@/components/subpages/private/AppointmentViewPage';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import StyledButton from '@/components/buttons/StyledButton';
import { useSocketClient } from '@/context/authContext';
import {
  getLocalDateString,
  timeStringToMinutes,
  formatTimeTo12H,
  countOverlappingEvents,
  convertTo24Hour,
  transformScheduleData,
  transformAppointmentData
} from '@/utils/scheduleUtils';

// ---------------- MAIN SCHEDULE PAGE ----------------
const Schedule = () => {
  const navigate = useNavigate();

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

  const socket = useSocketClient();

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
          appointment_id: appointment.appointment_id,
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
          availability: 'SHARED',
          isActive: true
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

      const formattedDate = dateString;
      console.log("Fetching today's tours for:", formattedDate);

      const schedulesResponse = await axiosClient.get(`/auth/schedules?date=${formattedDate}`);

      const appointmentsResponse = await axiosClient.get(`/auth/appointment`);

      console.log("Today's schedules:", schedulesResponse.data.length);
      console.log("All appointments:", appointmentsResponse.data.length);

      const todaySchedules = schedulesResponse.data
        .filter(schedule => schedule && schedule.date)
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

      const todayAppointments = appointmentsResponse.data
        .filter(appointment => {
          if (!appointment.preferred_date) {
            return false;
          }

          const appointmentDate = appointment.preferred_date.split('T')[0];
          const matchesDate = appointmentDate === formattedDate;

          if (matchesDate) {
            console.log(`Found appointment for ${formattedDate}:`, appointment.appointment_id);
          }

          return matchesDate;
        })
        .filter(appointment => {
          const status = (appointment.AppointmentStatus?.status || '').toUpperCase();
          return status === 'CONFIRMED' || status === 'COMPLETED';
        })
        .map(appointment => {
          let startTime = "09:00";
          let endTime = "10:00";

          if (appointment.start_time && appointment.end_time) {
            startTime = appointment.start_time;
            endTime = appointment.end_time;
            console.log(`Using direct time fields for ${appointment.appointment_id}: ${startTime}-${endTime}`);
          } else if (appointment.preferred_time && typeof appointment.preferred_time === 'string') {
            try {
              const timeParts = appointment.preferred_time.split('-');
              if (timeParts[0]) startTime = convertTo24Hour(timeParts[0].trim());
              if (timeParts[1]) endTime = convertTo24Hour(timeParts[1].trim());
              console.log(`Parsed preferred_time for ${appointment.appointment_id}: ${startTime}-${endTime}`);
            } catch (error) {
              console.error("Error parsing preferred_time:", appointment.preferred_time, error);
            }
          }

          return {
            id: `appointment-${appointment.appointment_id}`,
            appointment_id: appointment.appointment_id,
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

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "09:00";

    const hasAMPM = timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm');

    if (hasAMPM) {
      const isPM = timeStr.toLowerCase().includes('pm');
      const cleanTime = timeStr.toLowerCase().replace(/am|pm/g, '').trim();
      const [hourStr, minuteStr] = cleanTime.split(':');
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr || '0', 10);

      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;

      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    } else {
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

      const schedulesResponse = await axiosClient.get('/auth/schedules');
      console.log("All schedules:", schedulesResponse.data.length);

      const appointmentsResponse = await axiosClient.get('/auth/appointment');
      console.log("All appointments:", appointmentsResponse.data.length);

      const monthSchedules = schedulesResponse.data
        .filter(schedule => {
          if (!schedule.date) return false;

          const scheduleDate = new Date(schedule.date);
          return !isNaN(scheduleDate.getTime()) &&
            scheduleDate.getMonth() === month &&
            scheduleDate.getFullYear() === year;
        })
        .map(schedule => ({
          id: `schedule-${schedule.schedule_id}`,
          date: schedule.date.split('T')[0],
          isActive: schedule.status !== 'COMPLETED',
          isSchedule: true
        }));

      console.log("Month-filtered schedules:", monthSchedules.length);

      const monthAppointments = appointmentsResponse.data
        .filter(appointment => {
          if (!appointment.preferred_date) return false;

          const dateStr = appointment.preferred_date.split('T')[0];
          const appointmentDate = new Date(dateStr);

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

      const allEvents = [...monthSchedules, ...monthAppointments];
      console.log(`Total filtered calendar events: ${allEvents.length}`);

      setCalendarEvents(allEvents);
    } catch (error) {
      console.error('Error fetching monthly events:', error);
    }
  }, [viewedDate]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchEvents(),
        fetchTodayTours(),
        fetchMonthEvents()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchEvents, fetchTodayTours, fetchMonthEvents]);

  useEffect(() => {
    fetchAllData();
  }, [selectedDate, viewedDate, fetchAllData]);

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

  const handleMarkAsDone = async () => {
    if (!selectedAppointment) return;

    if (selectedAppointment.isAppointment) {
      try {
        const response = await axiosClient.get(`/auth/attendance/${selectedAppointment.appointment_id}`);
        const appointmentData = response.data;

        const visitorName = `${appointmentData.fromFirstName || ''} ${appointmentData.fromLastName || ''}`.trim() || 'Unknown Visitor';
        const breadcrumbText = `${selectedAppointment.appointment_id} ${visitorName}`;
        const encodedId = btoa(breadcrumbText);

        navigate(`/admin/schedule/${encodedId}`, { state: { cameFrom: 'schedule' } });
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        showToast('Error loading appointment details', 'error');
      }


    } else if (selectedAppointment.isSchedule) {
      setShowConfirmModal(true);
    }
  };

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
      fetchAllData();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      showToast(error.message || 'Error updating schedule status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status, presentCount = null) => {
    try {
      const requestData = { status };
      if (presentCount !== null) {
        requestData.present_count = presentCount;
      }

      await axiosClient.patch(`/auth/appointment/${appointmentId}/status`, requestData);
      fetchAllData();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  };

  // Function to check multiple dates and update disabled dates
  const checkMonthlyAvailability = async (year, month) => {
    return validateMonthlyAvailability(year, month, axiosClient, setMonthlySchedules, setDisabledDates, setIsLoadingDateAvailability);
  };

  const handleAddEvent = async () => {
    try {
      if (!newTitle) {
        showToast('Please enter an event title', 'error');
        return;
      }

      const startMinutes = timeStringToMinutes(newStartTime);
      const endMinutes = timeStringToMinutes(newEndTime);
      const sixAM = timeStringToMinutes('06:00');
      const sixPM = timeStringToMinutes('18:00');

      if (startMinutes < sixAM || endMinutes > sixPM) {
        showToast('Schedule must be between 6:00 AM and 6:00 PM', 'error');
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

      if (newAvailability === 'EXCLUSIVE') {
        const existingEvents = backendEvents.filter(event => {
          if (event.date !== dateString) return false;
          const eventStart = timeStringToMinutes(event.startTime);
          const eventEnd = timeStringToMinutes(event.endTime);
          return (startMinutes < eventEnd && eventStart < endTime);
        });

        if (existingEvents.length > 0) {
          showToast('Cannot set as exclusive - time slot already has events scheduled', 'error');
          return;
        }
      }

      if (newAvailability === 'SHARED') {
        const overlappingCount = countOverlappingEvents(backendEvents, newStartTime, newEndTime);
        if (overlappingCount >= 5) {
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

      fetchAllData();
    } catch (error) {
      console.error('Error creating schedule:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to create schedule', 'error');
    }
  };

  const [toastConfig, setToastConfig] = useState({
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToastConfig({
      message,
      type
    });
  };

  const hideToast = () => {
    setToastConfig({
      ...toastConfig,
      message: ''
    });
  };

  return (
    <div className="relative w-full h-full bg-[#F0F0F0] select-none flex overflow-hidden">
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
            fetchAllData();
          }}
          updateAppointmentStatus={updateAppointmentStatus}
          showRespondSection={true}
          isFullPage={false}
        />
      ) : (
        <div className="w-full h-full flex flex-col pb-7">
          <div className="w-full h-full flex flex-col xl:flex-row gap-y-5 xl:gap-y-0 justify-between   gap-x-10">

            <div className="w-full xl:w-[31rem] h-fit flex flex-col gap-y-6 items-center justify-around">
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
                        const ds = getLocalDateString(date);

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
                    className="p-2 rounded-lg mx-auto text-lg"
                  />
                </div>
              </div>

              <style>{`
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #9ca3af #f3f4f6;
                }
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #f3f4f6;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #9ca3af;
                  border-radius: 4px;
                  border: 2px solid #f3f4f6;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: #6b7280;
                }
              `}</style>
              <div className="w-full xl:min-w-[31rem] xl:max-w-[31rem] flex flex-col h-[35rem] bg-white rounded-xl shadow-xl p-5">
                <span className="text-2xl font-semibold mb-4">Today's Scheduled Tours</span>
                <div className="w-full border-t border-gray-200 pt-4 space-y-3 h-[calc(100%-1rem)] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                  {todayTours.length === 0 && (
                    <div className="bg-gray-100 text-gray-700 p-3 rounded-lg">
                      No Scheduled Tours
                    </div>
                  )}
                  {todayTours.map((tour, idx) => (
                    <ScheduleItem
                      key={tour.id || idx}
                      tour={tour}
                      idx={idx}
                      formatTimeTo12H={formatTimeTo12H}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full xl:flex-1 h-full flex flex-col gap-y-8 min-w-0">
              <div className="w-full min-h-[5rem] flex flex-col justify-between">
                <span className="text-4xl font-bold text-black">Today's Schedule</span>
                <div className="w-full h-fit flex items-center">
                  <span className="w-[14rem] text-center text-3xl font-bold text-[#9590FF]">
                    {weekdayName} {dayNum}
                  </span>
                  <div className="flex items-center ml-4">
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

            <div className="w-full xl:w-[31rem] h-full flex flex-col gap-y-5">
              <div className="w-full rounded-xl bg-white shadow-xl p-6 flex items-center justify-center gap-x-8 hover:shadow-2xl transition-shadow">
                <div className="bg-gray-100 p-3 rounded-full">
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

                  <div className="mt-2">
                    <div className="flex items-start">
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

              <div className="w-full shadow-xl bg-white rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Selected Event</h2>
                {selectedAppointment ? (
                  <>
                    <p className="mb-2">
                      <strong>{selectedAppointment.isAppointment ? 'Purpose:' : 'Title:'}</strong> {selectedAppointment.title}
                    </p>

                    {selectedAppointment.isAppointment && selectedAppointment.organizer && (
                      <p className="mb-2">
                        <strong>Visitor:</strong> {selectedAppointment.organizer}
                      </p>
                    )}

                    <p className="mb-2">
                      <strong>Time:</strong>{' '}
                      {formatTimeTo12H(selectedAppointment.startTime)} -{' '}
                      {formatTimeTo12H(selectedAppointment.endTime)}
                    </p>

                    {selectedAppointment.isAppointment && selectedAppointment.numPeople && (
                      <p className="mb-2">
                        <strong>Number of People:</strong>{' '}
                        {selectedAppointment.numPeople}
                      </p>
                    )}

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

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#9590FF] rounded-full p-1">
              <LoadingSpinner />
            </div>
            <span className="text-gray-700 font-medium">Loading events...</span>
          </div>
        </div>
      )}

      <Toast
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={hideToast}
      />

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
