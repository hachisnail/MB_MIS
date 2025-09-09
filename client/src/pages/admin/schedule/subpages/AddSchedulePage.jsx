import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import TimePicker from '../../../../features/TimePicker';
import { FormInput } from '@/features/FormUtilities';
import Toast from '@/features/Toast';
import StyledButton from '@/components/buttons/StyledButton';
import { LoadingSpinner } from '@/components/commons';
import Breadcrumb from '@/components/Breadcrumb';
import axiosClient from '@/lib/axiosClient';
import {
  getLocalDateString,
  timeStringToMinutes,
  countOverlappingEvents,
  formatTimeTo12H
} from '@/utils/scheduleUtils';
import { normalizeStatus } from '../../appointments/components/statusUtils';

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
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  
  // Date disable feature state
  const [isDateDisableMode, setIsDateDisableMode] = useState(false);
  
  // Form setup for Add Schedule
  const {
    control: scheduleControl,
    register: scheduleRegister,
    handleSubmit: handleScheduleSubmit,
    formState: { errors: scheduleErrors },
    reset: resetScheduleForm,
    watch: watchSchedule
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      availability: 'SHARED'
    }
  });

  // Form setup for Disable Date
  const {
    control: disableDateControl,
    register: disableDateRegister,
    handleSubmit: handleDisableDateSubmit,
    formState: { errors: disableDateErrors },
    reset: resetDisableDateForm
  } = useForm({
    defaultValues: {
      reason: ''
    }
  });

  // Watch form values
  const watchedScheduleData = watchSchedule();

  // Availability options for dropdown
  const availabilityOptions = [
    { value: 'SHARED', label: 'Shared - Can be booked with other events' },
    { value: 'EXCLUSIVE', label: 'Exclusive - Reserved for this event only' }
  ];
  
  // Toast state
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

  // Build date strings
  const dateString = getLocalDateString(selectedDate);
  const monthLabel = selectedDate.toLocaleString('default', { month: 'long' }) + ' ' + selectedDate.getFullYear();
  const weekdayName = selectedDate.toLocaleString('default', { weekday: 'long' });
  const dayNum = selectedDate.getDate();

  // Fetch events for the selected date
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const formattedDate = dateString;
      
      // Fetch schedules
      const schedulesResponse = await axiosClient.get(`/auth/schedules?date=${formattedDate}`);
      
      // Process schedules - exclude COMPLETED and DISABLED (date disable entries)
      const scheduleEvents = schedulesResponse.data
        .filter(schedule => 
          schedule.status !== 'COMPLETED' && 
          !(schedule.status === 'DISABLED' && schedule.title === 'DATE_DISABLED')
        )
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
          schedule_id: schedule.schedule_id
        }));

      // Fetch appointments
      const appointmentsResponse = await axiosClient.get(`/auth/appointment`);
      
      // Filter approved appointments for the selected date
      const approvedAppointments = appointmentsResponse.data.filter(appointment => {
        if (!appointment || !appointment.preferred_date) return false;
        
        const status = appointment.AppointmentStatus?.status || '';
        const isApproved = normalizeStatus(status) === 'APPROVED';
        const appointmentDate = appointment.preferred_date.split('T')[0];
        
        return appointmentDate === formattedDate && isApproved;
      });

      // Process appointments
      const appointmentEvents = approvedAppointments.map(appointment => {
        let startTime = "09:00";
        let endTime = "10:00";

        if (appointment.start_time && appointment.end_time) {
          startTime = appointment.start_time;
          endTime = appointment.end_time;
        }

        return {
          id: `appointment-${appointment.appointment_id}`,
          appointment_id: appointment.appointment_id,
          title: appointment.purpose_of_visit || 'Unnamed Appointment',
          date: appointment.preferred_date.split('T')[0],
          startTime,
          endTime,
          isAppointment: true,
          status: 'APPROVED',
          availability: 'SHARED'
        };
      });

      setBackendEvents([...scheduleEvents, ...appointmentEvents]);
    } catch (error) {
      console.error('Error fetching events:', error);
      showToast('Error loading schedule data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dateString]);

  // Fetch calendar events for the month
  const fetchMonthEvents = useCallback(async () => {
    try {
      const year = viewedDate.getFullYear();
      const month = viewedDate.getMonth();

      const schedulesResponse = await axiosClient.get('/auth/schedules');
      const appointmentsResponse = await axiosClient.get('/auth/appointment');

      // Process schedules for the month
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
          isSchedule: true,
          isDisabled: schedule.status === 'DISABLED'
        }));

      // Process appointments for the month
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
          isActive: normalizeStatus(appointment.AppointmentStatus?.status || '') === 'APPROVED',
          isAppointment: true
        }));

      setCalendarEvents([...monthSchedules, ...monthAppointments]);
    } catch (error) {
      console.error('Error fetching monthly events:', error);
    }
  }, [viewedDate]);

  // Fetch disabled dates from schedules table
  const fetchDisabledDates = useCallback(async () => {
    try {
      const response = await axiosClient.get('/auth/schedules');
      if (response.data && Array.isArray(response.data)) {
        // Filter schedules that are marked as disabled (status = 'DISABLED')
        const disabledSchedules = response.data.filter(schedule => 
          schedule.status === 'DISABLED' && schedule.title === 'DATE_DISABLED'
        );
        setDisabledDates(disabledSchedules.map(schedule => schedule.date.split('T')[0]));
      }
    } catch (error) {
      console.error('Error fetching disabled dates:', error);
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
        showToast('Please select start and end times', 'error');
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

      // Check for exclusive event conflicts
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

      if (data.availability === 'EXCLUSIVE') {
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

      if (data.availability === 'SHARED') {
        const overlappingCount = countOverlappingEvents(backendEvents, newStartTime, newEndTime);
        if (overlappingCount >= 5) {
          showToast('Maximum limit reached: Cannot add more than 5 overlapping events', 'error');
          return;
        }
      }

      const scheduleData = {
        title: data.title,
        description: data.description,
        date: dateString,
        start_time: newStartTime,
        end_time: newEndTime,
        availability: data.availability
      };

      await axiosClient.post('/auth/schedules', scheduleData);
      showToast('Schedule added successfully', 'success');

      // Reset form
      resetScheduleForm();
      setNewStartTime('');
      setNewEndTime('');

      // Refresh events
      fetchEvents();
      fetchMonthEvents();
    } catch (error) {
      console.error('Error creating schedule:', error);
      showToast(error.response?.data?.message || 'Failed to create schedule', 'error');
    }
  };

  // Handle disabling a date with react-hook-form
  const onDisableDateSubmit = async (data) => {
    try {
      // Create a special schedule entry to mark the date as disabled
      // For disable dates, we bypass the 6AM-6PM validation since it's a different use case
      const disableScheduleData = {
        title: 'DATE_DISABLED',
        description: data.reason,
        date: dateString,
        start_time: '00:00', // Full day disable - bypass time validation
        end_time: '23:59',   // Full day disable - bypass time validation
        availability: 'EXCLUSIVE',
        status: 'DISABLED'
      };

      await axiosClient.post('/auth/schedules', disableScheduleData);

      showToast('Date disabled successfully', 'success');
      resetDisableDateForm();
      setIsDateDisableMode(false);
      
      // Refresh disabled dates
      fetchDisabledDates();
      fetchMonthEvents();
    } catch (error) {
      console.error('Error disabling date:', error);
      showToast(error.response?.data?.message || 'Failed to disable date', 'error');
    }
  };

  // Check if date is disabled
  const isDateDisabled = (date) => {
    const dateStr = getLocalDateString(date);
    return disabledDates.includes(dateStr);
  };

  return (
    <div className="relative w-full h-full p-6 select-none">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          
          <p className="text-gray-600 mt-1 text-lg">Select a date and add new schedules or disable dates</p>
        </div>
        <StyledButton
          onClick={() => navigate('/admin/schedule')}
          buttonColor="bg-gray-500"
          hoverColor="hover:bg-gray-600"
          textColor="text-white"
          className="flex items-center gap-2"
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
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Schedule
        </StyledButton>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 h-[calc(100%-3rem)]">
        {/* Left Side - Calendar */}
        <div className="w-1/2 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{monthLabel}</h2>
            </div>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={({ date }) => {
                const dateStr = getLocalDateString(date);
                if (isDateDisabled(date)) {
                  return 'bg-red-100 text-red-500 cursor-not-allowed';
                }
                return 'relative';
              }}
              onActiveStartDateChange={({ activeStartDate }) => {
                setViewedDate(activeStartDate);
              }}
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const ds = getLocalDateString(date);
                  
                  if (isDateDisabled(date)) {
                    return (
                      <span className="absolute top-1 right-1 text-red-500 text-xs font-bold">
                        X
                      </span>
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
                    <span className="absolute top-1 right-1 rounded-full bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center">
                      {totalCount}
                    </span>
                  ) : null;
                }
                return null;
              }}
              tileDisabled={({ date }) => isDateDisabled(date) && !isDateDisableMode}
              showNeighboringMonth={false}
              className="p-2 rounded-lg mx-auto text-lg"
            />
          </div>

          {/* Date Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Selected Date</h3>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-[#9590FF]">
                {weekdayName}, {selectedDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
              {isDateDisabled(selectedDate) && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg mt-3">
                  <p className="font-semibold">This date is disabled</p>
                  <p className="text-sm mt-1">No appointments or schedules can be added for this date.</p>
                </div>
              )}
              {backendEvents.length > 0 && !isDateDisabled(selectedDate) && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Existing events on this date:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {backendEvents.map(event => (
                      <div key={event.id} className="text-xs bg-gray-100 p-2 rounded">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-gray-500 ml-2">
                          {formatTimeTo12H(event.startTime)} - {formatTimeTo12H(event.endTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Add Schedule Form or Disable Date */}
        <div className="w-1/3">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full overflow-y-auto">
            {/* Toggle between Add Schedule and Disable Date */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsDateDisableMode(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  !isDateDisableMode 
                    ? 'bg-[#9590FF] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Add Schedule
              </button>
              <button
                onClick={() => setIsDateDisableMode(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isDateDisableMode 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Disable Date
              </button>
            </div>

            {!isDateDisableMode ? (
              // Add Schedule Form
              <>
                <h2 className="text-xl font-bold mb-4">
                  Add Schedule for {weekdayName}, {dayNum}
                </h2>

                {isDateDisabled(selectedDate) ? (
                  <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                    <p className="font-semibold">Cannot add schedule</p>
                    <p className="text-sm mt-1">This date has been disabled for appointments and schedules.</p>
                  </div>
                ) : (
                  <form onSubmit={handleScheduleSubmit(onScheduleSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Title *
                      </label>
                      <FormInput
                        placeholder="Enter event title"
                        register={scheduleRegister}
                        name="title"
                        error={scheduleErrors.title}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <div className="flex flex-col">
                        <textarea
                          {...scheduleRegister("description")}
                          placeholder="Enter event description"
                          rows="3"
                          className={`border text-xl px-2 py-3 rounded-2xl w-full resize-none ${
                            scheduleErrors.description ? "border-red-600" : "border-black"
                          } focus:outline-none`}
                          style={{
                            boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
                          }}
                        />
                        <span className="text-red-600 text-md h-6 pl-2">
                          {scheduleErrors.description?.message || ""}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time *
                        </label>
                        <TimePicker
                          id="start-time"
                          className="w-full"
                          onChange={setNewStartTime}
                          value={newStartTime}
                          minTime="06:00"
                          maxTime="18:00"
                          stepMinutes={15}
                          format12Hour={true}
                        />
                      </div>
                      <div>
                        <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
                          End Time *
                        </label>
                        <TimePicker
                          id="end-time"
                          className="w-full"
                          onChange={setNewEndTime}
                          value={newEndTime}
                          minTime="06:00"
                          maxTime="18:00"
                          stepMinutes={15}
                          format12Hour={true}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Availability
                      </label>
                      <div className="flex flex-col">
                        <div className="grid grid-cols-2 gap-4">
                          <label className="border border-black rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                 style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}>
                            <input
                              {...scheduleRegister("availability")}
                              type="radio"
                              value="SHARED"
                              className="w-4 h-4 text-[#9590FF] focus:ring-[#9590FF]"
                            />
                            <div>
                              <span className="font-medium text-xl">Shared</span>
                              <span className="block text-xs text-gray-500">Can be booked with other events</span>
                            </div>
                          </label>
                          <label className="border border-black rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                 style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}>
                            <input
                              {...scheduleRegister("availability")}
                              type="radio"
                              value="EXCLUSIVE"
                              className="w-4 h-4 text-[#9590FF] focus:ring-[#9590FF]"
                            />
                            <div>
                              <span className="font-medium text-xl">Exclusive</span>
                              <span className="block text-xs text-gray-500">Reserved for this event only</span>
                            </div>
                          </label>
                        </div>
                        <span className="text-red-600 text-md h-6 pl-2">
                          {scheduleErrors.availability?.message || ""}
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
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
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">Important Notes for Regular Schedules:</p>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• Schedules must be between 6:00 AM and 6:00 PM</li>
                            <li>• Minimum duration is 15 minutes</li>
                            <li>• You cannot schedule during exclusive event times</li>
                            <li>• Maximum 5 overlapping shared events allowed</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <StyledButton
                      type="submit"
                      buttonColor="bg-[#9590FF]"
                      hoverColor="hover:bg-[#8580e8]"
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
                      Add Schedule
                    </StyledButton>
                  </form>
                )}
              </>
            ) : (
              // Disable Date Form
              <>
                <h2 className="text-xl font-bold mb-4 text-red-600">
                  Disable Date: {weekdayName}, {dayNum}
                </h2>

                {isDateDisabled(selectedDate) ? (
                  <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg">
                    <p className="font-semibold">Date Already Disabled</p>
                    <p className="text-sm mt-1">This date is already disabled for appointments and schedules.</p>
                  </div>
                ) : (
                  <form onSubmit={handleDisableDateSubmit(onDisableDateSubmit)} className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-red-700 font-medium">Warning!</p>
                      <p className="text-sm text-red-600 mt-1">
                        Disabling this date will prevent any new appointments or schedules from being created on this date.
                        Existing appointments and schedules will not be affected.
                      </p>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-yellow-500 mr-2 mt-0.5"
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
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">Note for Date Disabling:</p>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• Date disabling covers the entire day (24 hours)</li>
                            <li>• No time restrictions apply for disabling dates</li>
                            <li>• This is different from regular schedule creation</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Disabling *
                      </label>
                      <div className="flex flex-col">
                        <textarea
                          {...disableDateRegister("reason")}
                          placeholder="Enter reason for disabling this date (e.g., Holiday, Maintenance, Special Event)"
                          rows="4"
                          className={`border text-xl px-2 py-3 rounded-2xl w-full resize-none ${
                            disableDateErrors.reason ? "border-red-600" : "border-black"
                          } focus:outline-none`}
                          style={{
                            boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
                          }}
                        />
                        <span className="text-red-600 text-md h-6 pl-2">
                          {disableDateErrors.reason?.message || ""}
                        </span>
                      </div>
                    </div>

                    <StyledButton
                      type="submit"
                      buttonColor="bg-red-500"
                      hoverColor="hover:bg-red-600"
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
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6" />
                        <path d="M9 9l6 6" />
                      </svg>
                      Disable Date
                    </StyledButton>
                  </form>
                )}
              </>
            )}
          </div>
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
    </div>
  );
};

export default AddSchedulePage;
