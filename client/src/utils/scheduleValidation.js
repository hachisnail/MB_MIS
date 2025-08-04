import { timeStringToMinutes, countOverlappingEvents } from './scheduleUtils';

/**
 * Validates if an appointment can be scheduled based on various constraints
 * @param {Object} appointmentData - The appointment data to validate
 * @param {string} appointmentData.date - Date in YYYY-MM-DD format
 * @param {string} appointmentData.startTime - Start time in HH:MM format
 * @param {string} appointmentData.endTime - End time in HH:MM format
 * @param {Array} existingEvents - Array of existing schedules and appointments
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateAppointmentSchedule = (appointmentData, existingEvents) => {
  const { date, startTime, endTime } = appointmentData;
  
  // Validate time constraints (7:00 AM to 5:00 PM)
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);
  const sevenAM = timeStringToMinutes('07:00');
  const fivePM = timeStringToMinutes('17:00');
  
  if (startMinutes < sevenAM || endMinutes > fivePM) {
    return {
      isValid: false,
      error: 'Appointments must be scheduled between 7:00 AM and 5:00 PM'
    };
  }
  
  // Validate start time is before end time
  if (startMinutes >= endMinutes) {
    return {
      isValid: false,
      error: 'Start time must be earlier than end time'
    };
  }
  
  // Validate minimum duration (15 minutes)
  const duration = endMinutes - startMinutes;
  if (duration < 15) {
    return {
      isValid: false,
      error: 'Appointment duration must be at least 15 minutes'
    };
  }
  
  // Check for exclusive schedule conflicts
  const existingExclusiveEvent = existingEvents.find(event => {
    if (!event.isSchedule || event.date !== date) return false;
    if (event.availability === 'EXCLUSIVE') {
      const eventStart = timeStringToMinutes(event.startTime);
      const eventEnd = timeStringToMinutes(event.endTime);
      return (startMinutes < eventEnd && eventStart < endMinutes);
    }
    return false;
  });
  
  if (existingExclusiveEvent) {
    return {
      isValid: false,
      error: 'Cannot schedule during an exclusive event time slot'
    };
  }
  
  // Check overlapping events limit (max 5)
  const overlappingCount = countOverlappingEvents(
    existingEvents.filter(e => e.date === date),
    startTime,
    endTime
  );
  
  if (overlappingCount >= 5) {
    return {
      isValid: false,
      error: 'Maximum limit reached: Cannot add more than 5 overlapping events'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Check time slot availability for a specific date
 * @param {Date} date - The date to check
 * @param {Object} axiosClient - Axios instance for API calls
 * @param {Function} showToast - Toast notification function
 * @param {Function} setTimeSlotCounts - State setter for time slot counts
 * @param {Function} setTimeSlotExclusive - State setter for exclusive slots
 * @param {Function} setConfirmedSlots - State setter for confirmed slots
 * @param {Function} setIsLoadingTimeSlots - State setter for loading state
 */
export const checkTimeSlotAvailability = async (
  date,
  axiosClient,
  showToast,
  setTimeSlotCounts,
  setTimeSlotExclusive,
  setConfirmedSlots,
  setIsLoadingTimeSlots
) => {
  if (!date) return;

  setIsLoadingTimeSlots(true);
  showToast('Checking time slot availability...', 'info');

  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const timeSlots = ['09:00-10:29', '10:30-11:59', '01:00-02:29', '02:30-04:00'];
    const counts = {};
    const exclusive = {};
    const confirmed = {};

    timeSlots.forEach(slot => {
      counts[slot] = 0;
      exclusive[slot] = false;
      confirmed[slot] = false;
    });

    // Fetch both appointments and schedules
    const [appointmentResponse, scheduleResponse] = await Promise.all([
      axiosClient.get('/auth/appointment'),
      axiosClient.get(`/auth/schedules?date=${formattedDate}`)
    ]);

    // Process confirmed appointments for this date
    const todayAppointments = appointmentResponse.data.filter(appointment => {
      const appointmentDate = appointment.preferred_date.split('T')[0];
      return appointmentDate === formattedDate;
    });

    todayAppointments.forEach(appointment => {
      const status = (appointment.AppointmentStatus?.status || '').toUpperCase();
      if (status === 'CONFIRMED' && appointment.start_time && appointment.end_time) {
        let startTime = appointment.start_time.substring(0, 5);
        let endTime = appointment.end_time.substring(0, 5);

        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        if (startHour >= 13) {
          startTime = `${(startHour - 12).toString().padStart(2, '0')}:${startTime.split(':')[1]}`;
        }
        if (endHour >= 13) {
          endTime = `${(endHour - 12).toString().padStart(2, '0')}:${endTime.split(':')[1]}`;
        }

        const timeKey = `${startTime}-${endTime}`;
        if (timeSlots.includes(timeKey)) {
          confirmed[timeKey] = true;
        }
      }
    });

    // Process schedules for this date
    if (scheduleResponse.data && Array.isArray(scheduleResponse.data)) {
      const activeSchedules = scheduleResponse.data.filter(schedule => schedule.status !== 'COMPLETED');

      activeSchedules.forEach(schedule => {
        if (schedule.start_time && schedule.end_time) {
          timeSlots.forEach(slot => {
            const [slotStart, slotEnd] = slot.split('-');
            if (checkTimeOverlap(schedule.start_time, schedule.end_time, slotStart, slotEnd)) {
              if (schedule.availability === 'EXCLUSIVE') {
                exclusive[slot] = true;
              } else {
                counts[slot] += 1;
              }
            }
          });
        }
      });
    }

    setTimeSlotCounts(counts);
    setTimeSlotExclusive(exclusive);
    setConfirmedSlots(confirmed);

    const availableSlots = timeSlots.filter(slot => !exclusive[slot] && !confirmed[slot] && counts[slot] < 5);
    if (availableSlots.length === 0) {
      showToast('No time slots available for this date', 'warning');
    } else {
      showToast(`${availableSlots.length} time slots available`, 'success');
    }

  } catch (error) {
    console.error('Error checking time slot availability:', error);
    showToast('Failed to check time slot availability', 'error');
  } finally {
    setIsLoadingTimeSlots(false);
  }
};

/**
 * Check if a specific date should be disabled
 * @param {Date} date - The date to check
 * @param {Object} axiosClient - Axios instance for API calls
 * @returns {boolean} - Whether the date has available slots
 */
export const checkDateAvailability = async (date, axiosClient) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  const timeSlots = ['09:00-10:29', '10:30-11:59', '01:00-02:29', '02:30-04:00'];
  let availableSlots = 0;

  try {
    const [appointmentResponse, scheduleResponse] = await Promise.all([
      axiosClient.get('/auth/appointment'),
      axiosClient.get(`/auth/schedules/public/availability?date=${formattedDate}`)
    ]);

    // Check each time slot
    for (const slot of timeSlots) {
      let isSlotAvailable = true;
      let slotCount = 0;

      // Check appointments for this date and slot
      const todayAppointments = appointmentResponse.data.filter(appointment => {
        const appointmentDate = appointment.preferred_date.split('T')[0];
        return appointmentDate === formattedDate;
      });

      // Check if any confirmed appointment blocks this slot
      const confirmedInSlot = todayAppointments.some(appointment => {
        const status = (appointment.AppointmentStatus?.status || '').toUpperCase();
        if (status === 'CONFIRMED' && appointment.start_time && appointment.end_time) {
          let startTime = appointment.start_time.substring(0, 5);
          let endTime = appointment.end_time.substring(0, 5);

          const startHour = parseInt(startTime.split(':')[0], 10);
          const endHour = parseInt(endTime.split(':')[0], 10);

          if (startHour >= 13) {
            startTime = `${(startHour - 12).toString().padStart(2, '0')}:${startTime.split(':')[1]}`;
          }
          if (endHour >= 13) {
            endTime = `${(endHour - 12).toString().padStart(2, '0')}:${endTime.split(':')[1]}`;
          }

          const timeKey = `${startTime}-${endTime}`;
          return timeKey === slot;
        }
        return false;
      });

      if (confirmedInSlot) {
        isSlotAvailable = false;
      } else {
        // Check schedules for this slot
        if (scheduleResponse.data && Array.isArray(scheduleResponse.data)) {
          const activeSchedules = scheduleResponse.data.filter(schedule => schedule.status !== 'COMPLETED');

          for (const schedule of activeSchedules) {
            if (schedule.start_time && schedule.end_time) {
              const [slotStart, slotEnd] = slot.split('-');
              if (checkTimeOverlap(schedule.start_time, schedule.end_time, slotStart, slotEnd)) {
                if (schedule.availability === 'EXCLUSIVE') {
                  isSlotAvailable = false;
                  break;
                } else {
                  slotCount += 1;
                }
              }
            }
          }

          // Check if slot count exceeds limit (5)
          if (slotCount >= 5) {
            isSlotAvailable = false;
          }
        }
      }

      if (isSlotAvailable) {
        availableSlots++;
      }
    }

    return availableSlots > 0;
  } catch (error) {
    console.error('Error checking date availability:', error);
    return true; // Default to available if error occurs
  }
};

/**
 * Check multiple dates and update disabled dates for a month
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @param {Object} axiosClient - Axios instance for API calls
 * @param {Function} setMonthlySchedules - State setter for monthly schedules
 * @param {Function} setDisabledDates - State setter for disabled dates
 * @param {Function} setIsLoadingDateAvailability - State setter for loading state
 */
export const checkMonthlyAvailability = async (
  year,
  month,
  axiosClient,
  setMonthlySchedules,
  setDisabledDates,
  setIsLoadingDateAvailability
) => {
  setIsLoadingDateAvailability(true);
  const unavailableDates = [];

  try {
    // Fetch all appointments once for the month
    const appointmentResponse = await axiosClient.get('/auth/appointment');

    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Check each day of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const timeSlots = ['09:00-10:29', '10:30-11:59', '01:00-02:29', '02:30-04:00'];
      let availableSlots = 0;

      try {
        // Fetch schedules for this specific date
        const scheduleResponse = await axiosClient.get(`/auth/schedules?date=${formattedDate}`);
        setMonthlySchedules(prev => [...prev, ...scheduleResponse.data]);

        // Check each time slot for this date
        for (const slot of timeSlots) {
          let isSlotAvailable = true;
          let slotCount = 0;

          // Check appointments for this date and slot
          const todayAppointments = appointmentResponse.data.filter(appointment => {
            const appointmentDate = appointment.preferred_date.split('T')[0];
            return appointmentDate === formattedDate;
          });

          // Check if any confirmed appointment blocks this slot
          const confirmedInSlot = todayAppointments.some(appointment => {
            const status = (appointment.AppointmentStatus?.status || '').toUpperCase();
            if (status === 'CONFIRMED' && appointment.start_time && appointment.end_time) {
              let startTime = appointment.start_time.substring(0, 5);
              let endTime = appointment.end_time.substring(0, 5);

              const startHour = parseInt(startTime.split(':')[0], 10);
              const endHour = parseInt(endTime.split(':')[0], 10);

              if (startHour >= 13) {
                startTime = `${(startHour - 12).toString().padStart(2, '0')}:${startTime.split(':')[1]}`;
              }
              if (endHour >= 13) {
                endTime = `${(endHour - 12).toString().padStart(2, '0')}:${endTime.split(':')[1]}`;
              }

              const timeKey = `${startTime}-${endTime}`;
              return timeKey === slot;
            }
            return false;
          });

          if (confirmedInSlot) {
            isSlotAvailable = false;
          } else {
            // Check schedules for this slot
            if (scheduleResponse.data && Array.isArray(scheduleResponse.data)) {
              const activeSchedules = scheduleResponse.data.filter(schedule => schedule.status !== 'COMPLETED');

              for (const schedule of activeSchedules) {
                if (schedule.start_time && schedule.end_time) {
                  const [slotStart, slotEnd] = slot.split('-');
                  if (checkTimeOverlap(schedule.start_time, schedule.end_time, slotStart, slotEnd)) {
                    if (schedule.availability === 'EXCLUSIVE') {
                      isSlotAvailable = false;
                      break;
                    } else {
                      slotCount += 1;
                    }
                  }
                }
              }

              // Check if slot count exceeds limit (5)
              if (slotCount >= 5) {
                isSlotAvailable = false;
              }
            }
          }

          if (isSlotAvailable) {
            availableSlots++;
          }
        }
      } catch (dateError) {
        console.error(`Error checking availability for ${formattedDate}:`, dateError);
        // If there's an error fetching schedules for this date, assume it's available
        availableSlots = timeSlots.length;
      }

      // If no slots are available for this date, mark it as disabled
      if (availableSlots === 0) {
        unavailableDates.push(formattedDate);
      }
    }

    setDisabledDates(unavailableDates);
  } catch (error) {
    console.error('Error checking monthly availability:', error);
  } finally {
    setIsLoadingDateAvailability(false);
  }
};

// Helper function to check time overlap
const checkTimeOverlap = (start1, end1, start2, end2) => {
  const timeToMinutes = (timeStr) => {
    let hour, minute;
    const cleanTime = timeStr.split(':').slice(0, 2).join(':');
    const [hourStr, minuteStr] = cleanTime.split(':');
    hour = parseInt(hourStr, 10);
    minute = parseInt(minuteStr || '0', 10);

    if (hour >= 1 && hour <= 5) {
      hour += 12;
    }

    return hour * 60 + minute;
  };

  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
};
