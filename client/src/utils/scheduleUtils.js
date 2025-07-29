// Utility functions for Schedule page

export function getLocalDateString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function timeStringToMinutes(str) {
  const [hourStr, minuteStr] = str.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10) || 0;
  return hour * 60 + minute;
}

export function formatTimeTo12H(str) {
  if (!str) return '';

  let [hour, minute] = str.split(':');
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10) || 0;

  const suffix = hour >= 12 ? 'pm' : 'am';
  const normalized = hour % 12 || 12;
  const minuteStr = minute.toString().padStart(2, '0');
  return `${normalized}:${minuteStr}${suffix}`;
}

export function countOverlappingEvents(events, startTime, endTime) {
  const newStart = timeStringToMinutes(startTime);
  const newEnd = timeStringToMinutes(endTime);

  const newEvent = { start: newStart, end: newEnd };

  return events.filter(event => {
    const eventStart = timeStringToMinutes(event.startTime);
    const eventEnd = timeStringToMinutes(event.endTime);
    return (newEvent.start < eventEnd && eventStart < newEvent.end);
  }).length;
}

export function convertTo24Hour(timeStr) {
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
}

// Transform backend data to match the expected format for DayScheduler
export const transformScheduleData = (schedules) => {
  return schedules
    .filter(schedule => schedule.status !== 'COMPLETED')
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
      isActive: schedule.status !== 'COMPLETED'
    }));
};

export const transformAppointmentData = (appointments) => {
  return appointments.map(appointment => {
    const visitor = appointment.Visitor || {};
    const status = appointment.AppointmentStatus?.status || 'TO_REVIEW';

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
      isActive: status === 'CONFIRMED'
    };
  }).filter(Boolean);
};
