import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { format } from 'date-fns';
import ReCAPTCHA from "react-google-recaptcha";

import axiosClient from "@/lib/axiosClient";
import { useSocketClient } from "../../../context/authContext";
import {
  checkTimeSlotAvailability,
  checkMonthlyAvailability
} from "../../../utils/scheduleValidation";
import { normalizeStatus } from "../../admin/appointments/components/statusUtils";

import ConfirmationModal from "@/components/modals/ConfirmationModal";
import PopupModal from "@/components/modals/PopupModal";
import Toast from "../../../features/Toast";
import usePrompt from "../../../hooks/usePrompt";

import NoticeStep from "./components/NoticeStep";
import PersonalInfoStep from "./components/PersonalInfoStep";
import VisitDetailsStep from "./components/VisitDetailsStep";
import ScheduleStep from "./components/ScheduleStep";


const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organization: "",
  province: "",
  city: "",
  barangay: "",
  street: "",
  purpose: "",
  populationCount: "",
  selectedDate: null,
  selectedTime: "",
  additionalNotes: "",
  requestLetterUpload: [],
};

const Appointment = () => {
  const user = null; // Hardcoded since this was previously passed as prop

  const [formData, setFormData] = useState({
    ...initialFormData,
    userLoggedIn: !!user,
  });

  const [step, setStep] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const recaptchaRef = useRef(null);
  const socket = useSocketClient();

  // Schedule-related state
  const [timeSlotCounts, setTimeSlotCounts] = useState({});
  const [timeSlotExclusive, setTimeSlotExclusive] = useState({});
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [confirmedSlots, setConfirmedSlots] = useState({});
  const [disabledDates, setDisabledDates] = useState([]);
  const [isLoadingDateAvailability, setIsLoadingDateAvailability] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [viewedDate, setViewedDate] = useState(new Date());

  const [toast, setToast] = useState({
    type: 'info',
    message: ''
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast({
      type,
      message
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, message: '' }));
  }, []);

  // Automatically hide toast after 3 seconds when message changes
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, message: '' }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  // State for tracking unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Use the prompt hook to warn about unsaved changes
  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty && hasUserInteracted,
    "light"
  );

  // Track if user has actually interacted with the form
  const markAsInteracted = useCallback(() => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  }, [hasUserInteracted]);

  // Check if form has actual changes (not just initialization)
  const checkForRealChanges = useCallback(() => {
    const keys = Object.keys(initialFormData);
    return keys.some((key) => {
      const initialValue = initialFormData[key];
      const currentValue = formData[key];
      return JSON.stringify(initialValue) !== JSON.stringify(currentValue);
    });
  }, [formData]);

  // Watch for form changes
  useEffect(() => {
    // Only set dirty if user has interacted and there are real changes
    if (hasUserInteracted) {
      const hasChanges = checkForRealChanges();
      setIsDirty(hasChanges);
    }
  }, [formData, hasUserInteracted, checkForRealChanges]);

  // Reset isDirty when form is submitted successfully
  useEffect(() => {
    const handleFormSubmitted = () => {
      setIsDirty(false);
      setHasUserInteracted(false);
    };

    window.addEventListener('formSubmitted', handleFormSubmitted);

    return () => {
      window.removeEventListener('formSubmitted', handleFormSubmitted);
    };
  }, []);

  // Helper functions for time requirements
  const isTimeRequired = (purpose) =>
    purpose === 'School Field Trip' || purpose === 'Museum Group Tour';

  const shouldShowTimeOptions = (purpose) =>
    purpose === 'School Field Trip' ||
    purpose === 'Museum Group Tour' ||
    purpose === 'Photography or Media Projects';

  // Schedule availability functions
  const checkTimeSlotAvailabilityLocal = async (date) => {
    return checkTimeSlotAvailability(date, axiosClient, showToast, setTimeSlotCounts, setTimeSlotExclusive, setConfirmedSlots, setIsLoadingTimeSlots);
  };

  const checkMonthlyAvailabilityLocal = async (year, month) => {
    return checkMonthlyAvailability(year, month, axiosClient, {}, setDisabledDates, setIsLoadingDateAvailability);
  };

  // Check time slot availability when date changes
  useEffect(() => {
    if (formData.selectedDate) {
      checkTimeSlotAvailabilityLocal(formData.selectedDate);
    }
  }, [formData.selectedDate]);

  // Helper function to get local date string
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch calendar events for the viewed month
  const fetchMonthEvents = useCallback(async () => {
    try {
      const year = viewedDate.getFullYear();
      const month = viewedDate.getMonth();

      const [schedulesResponse, appointmentsResponse] = await Promise.all([
        axiosClient.get('/auth/schedules/public/availability'),
        axiosClient.get('/auth/appointment')
      ]);

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
          isActive: normalizeStatus(appointment.AppointmentStatus?.status) === 'APPROVED',
          isAppointment: true
        }));

      const allEvents = [...monthSchedules, ...monthAppointments];
      setCalendarEvents(allEvents);
    } catch (error) {
      console.error('Error fetching monthly events:', error);
    }
  }, [viewedDate]);

  // Fetch events when viewed date changes
  useEffect(() => {
    fetchMonthEvents();
  }, [viewedDate, fetchMonthEvents]);

  // Check monthly availability when component mounts
  useEffect(() => {
    const currentDate = new Date();
    checkMonthlyAvailabilityLocal(currentDate.getFullYear(), currentDate.getMonth());
  }, []);

  // Create a proper callback function for availability refresh
  const handleAvailabilityRefresh = useCallback(() => {
    if (formData.selectedDate) {
      checkTimeSlotAvailabilityLocal(formData.selectedDate);
    }
    const currentDate = new Date();
    checkMonthlyAvailabilityLocal(currentDate.getFullYear(), currentDate.getMonth());
  }, [formData.selectedDate]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleAppointmentChange = () => {
      handleAvailabilityRefresh();
      showToast('Appointment data updated - availability refreshed', 'info');
    };

    const handleScheduleChange = () => {
      handleAvailabilityRefresh();
      showToast('Schedule updated - availability refreshed', 'info');
    };

    socket.onDbChange("Appointment", "*", handleAppointmentChange);
    socket.onDbChange("AppointmentStatus", "*", handleAppointmentChange);
    socket.onDbChange("Schedule", "*", handleScheduleChange);

    return () => {
      socket.offDbChange("Appointment", "*", handleAppointmentChange);
      socket.offDbChange("AppointmentStatus", "*", handleAppointmentChange);
      socket.offDbChange("Schedule", "*", handleScheduleChange);
    };
  }, [socket, handleAvailabilityRefresh, showToast]);

  // Clear Form functions
  const handleClear = () => setShowClearConfirm(true);
  const cancelClear = () => setShowClearConfirm(false);
  const confirmClear = () => {
    setFormData({
      ...initialFormData,
      userLoggedIn: !!user,
    });
    setStep(0);
    setShowClearConfirm(false);
  };

  const handleNext = (data) => {
    markAsInteracted();
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev + 1);
  };

  const handleBack = (data) => {
    markAsInteracted();
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev - 1);
  };

  const handleSubmitFinal = async () => {
    try {
      setShowSubmitConfirm(false);
      showToast('Submitting appointment...', 'info');

      let captchaToken = null;
      const hasRequestLetterFiles = formData.requestLetterUpload && formData.requestLetterUpload.length > 0;

      if (!formData.userLoggedIn && hasRequestLetterFiles) {
        if (!recaptchaRef.current) throw new Error("Captcha not ready");
        captchaToken = await recaptchaRef.current.executeAsync();
        recaptchaRef.current.reset();
      }

      // Upload request letter files if any
      let uploadedRequestLetterFiles = [];
      if (hasRequestLetterFiles) {
        const form = new FormData();
        if (captchaToken) form.append("captchaToken", captchaToken);
        form.append("category", "private");
        formData.requestLetterUpload.forEach((f) => form.append("files", f));

        const uploadRes = await axiosClient.post("/auth/appointment/files", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        uploadedRequestLetterFiles = uploadRes.data.files;
      }

      let startTimeValue = null;
      let endTimeValue = null;

      if (formData.selectedTime) {
        const [startTime, endTime] = formData.selectedTime.split('-');
        const convertTo24Hour = (timeStr) => {
          const [hourStr, minuteStr] = timeStr.split(':');
          let hour = parseInt(hourStr, 10);
          if (hour >= 1 && hour <= 5) {
            hour += 12;
          }
          return `${hour.toString().padStart(2, '0')}:${minuteStr}:00`;
        };

        startTimeValue = convertTo24Hour(startTime);
        endTimeValue = convertTo24Hour(endTime);
      }

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        organization: formData.organization,
        province: formData.province,
        barangay: formData.barangay,
        city_municipality: formData.city,
        street: formData.street,
        purpose_of_visit: formData.purpose,
        population_count: formData.populationCount,
        preferred_date: formData.selectedDate
          ? format(formData.selectedDate, 'yyyy-MM-dd')
          : null,
        preferred_time: formData.selectedTime,
        start_time: startTimeValue,
        end_time: endTimeValue,
        additional_notes: formData.additionalNotes,
        request_letter_files: uploadedRequestLetterFiles,
        captchaToken: captchaToken
      };

      const response = await axiosClient.post('/auth/appointment', payload);

      if (response.status === 201) {
        confirmClear();
        setShowSuccessModal(true);
        // Trigger form reset event
        window.dispatchEvent(new Event('formSubmitted'));
      }
    } catch (err) {
      console.error('Request failed:', err);

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || 'Unknown error occurred';

        if (status === 400) {
          setApiError(`Validation Error: ${message}`);
        } else if (status === 409) {
          setApiError('Time slot conflict: Please select a different time');
        } else if (status === 500) {
          setApiError('Server error: Please try again later');
        } else {
          setApiError(`Error ${status}: ${message}`);
        }
      } else if (err.request) {
        setApiError('Network error: Please check your connection and try again');
      } else {
        setApiError('Failed to submit appointment. Please try again.');
      }
    }
  };

  const steps = [
    <NoticeStep
      key="notice"
      initialData={formData}
      onNext={handleNext}
      setFormData={setFormData}
      markAsInteracted={markAsInteracted}
    />,
    <PersonalInfoStep
      key="personal"
      initialData={formData}
      onNext={handleNext}
      onBack={handleBack}
      setFormData={setFormData}
      onClearForm={handleClear}
      markAsInteracted={markAsInteracted}
    />,
    <VisitDetailsStep
      key="visit"
      initialData={formData}
      onNext={handleNext}
      onBack={handleBack}
      setFormData={setFormData}
      onClearForm={handleClear}
      markAsInteracted={markAsInteracted}
    />,
    <ScheduleStep
      key="schedule"
      initialData={formData}
      onNext={() => setShowSubmitConfirm(true)}
      onBack={handleBack}
      setFormData={setFormData}
      onClearForm={handleClear}
      shouldShowTimeOptions={shouldShowTimeOptions(formData.purpose)}
      isTimeRequired={isTimeRequired(formData.purpose)}
      timeSlotExclusive={timeSlotExclusive}
      confirmedSlots={confirmedSlots}
      isLoadingTimeSlots={isLoadingTimeSlots}
      timeSlotCounts={timeSlotCounts}
      disabledDates={disabledDates}
      isLoadingDateAvailability={isLoadingDateAvailability}
      onAvailabilityRefresh={handleAvailabilityRefresh}
      calendarEvents={calendarEvents}
      markAsInteracted={markAsInteracted}
    />
  ];

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col pt-25">
      {steps[step]}

      {/* Unsaved changes modal */}
      {PromptModal}

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={cancelClear}
        onConfirm={confirmClear}
        title="Clear Form?"
        message="You have unsaved changes. Are you sure you want to clear the form?"
        type="question"
        theme="light"
      />

      <ConfirmationModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmitFinal}
        title="Confirm Appointment Submission"
        message={
          <div className="space-y-3">
            <div>
              <p>Are you sure you want to submit this appointment?</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
              <div><strong>Email:</strong> {formData.email}</div>
              <div><strong>Phone:</strong> {formData.phone || 'Not provided'}</div>
              <div><strong>Organization:</strong> {formData.organization || 'Not provided'}</div>
              <div><strong>Address:</strong> {formData.street ? `${formData.street}, ` : ''}{formData.barangay}, {formData.city}, {formData.province}</div>
              <div><strong>Purpose:</strong> {formData.purpose}</div>
              <div><strong>Date:</strong> {formData.selectedDate ? format(formData.selectedDate, 'MMMM d, yyyy') : 'Not selected'}</div>
              <div><strong>Time:</strong> {formData.selectedTime || 'No specific time preference'}</div>
              <div><strong>Population:</strong> {formData.populationCount} visitor(s)</div>
              {formData.requestLetterUpload && formData.requestLetterUpload.length > 0 && (
                <div>
                  <strong>Request Letter Files:</strong>
                  <ul className="ml-4 mt-1">
                    {formData.requestLetterUpload.map((file, index) => (
                      <li key={index} className="text-xs">• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {formData.additionalNotes && (
                <div><strong>Additional Notes:</strong> {formData.additionalNotes}</div>
              )}
            </div>
            <p className="text-sm text-gray-600">Your appointment will be submitted for review. You will receive a confirmation email shortly after submission.</p>
          </div>
        }
        type="question"
        theme="light"
      />

      <PopupModal
        isOpen={!!apiError}
        onClose={() => setApiError(null)}
        title="Submission Error"
        message={apiError}
        buttonText="Close"
        type="error"
        theme="light"
      />

      <PopupModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Submission Successful!"
        message="Your appointment has been successfully submitted and is awaiting review. You will receive a confirmation email shortly."
        buttonText="OK"
        type="success"
        theme="light"
      />

      {/* Toast Notifications */}
      <Toast
        type={toast.type}
        message={toast.message}
        duration={3000}
        onClose={hideToast}
      />

      {/* Invisible reCAPTCHA */}
      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        size="invisible"
        ref={recaptchaRef}
      />
    </div>
  );
};

export default Appointment;
