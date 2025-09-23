import { useState, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import ReCAPTCHA from "react-google-recaptcha";

import axiosClient from "@/lib/axiosClient";
import { useSocketClient } from "../../../context/authContext";
import {
  checkTimeSlotAvailability,
  checkMonthlyAvailability,
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
import ReviewStep from "./components/ReviewStep";

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

  const [toast, setToast] = useState({ type: "info", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    setToast({ type, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, message: "" }));
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, message: "" }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  // Unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty && hasUserInteracted,
    "light"
  );

  const markAsInteracted = useCallback(() => {
    if (!hasUserInteracted) setHasUserInteracted(true);
  }, [hasUserInteracted]);

  const checkForRealChanges = useCallback(() => {
    const keys = Object.keys(initialFormData);
    return keys.some((key) => {
      const initialValue = initialFormData[key];
      const currentValue = formData[key];
      return JSON.stringify(initialValue) !== JSON.stringify(currentValue);
    });
  }, [formData]);

  useEffect(() => {
    if (hasUserInteracted) {
      setIsDirty(checkForRealChanges());
    }
  }, [formData, hasUserInteracted, checkForRealChanges]);

  useEffect(() => {
    const handleFormSubmitted = () => {
      setIsDirty(false);
      setHasUserInteracted(false);
    };
    window.addEventListener("formSubmitted", handleFormSubmitted);
    return () => window.removeEventListener("formSubmitted", handleFormSubmitted);
  }, []);

  // Helpers for time requirements
  const isTimeRequired = (purpose) =>
    purpose === "School Field Trip" || purpose === "Museum Group Tour";
  const shouldShowTimeOptions = (purpose) =>
    purpose === "School Field Trip" ||
    purpose === "Museum Group Tour" ||
    purpose === "Photography or Media Projects";

  // Availability helpers
  const checkTimeSlotAvailabilityLocal = useCallback(
    async (date) => {
      return checkTimeSlotAvailability(
        date,
        axiosClient,
        showToast,
        setTimeSlotCounts,
        setTimeSlotExclusive,
        setConfirmedSlots,
        setIsLoadingTimeSlots
      );
    },
    [showToast]
  );

  const checkMonthlyAvailabilityLocal = useCallback(async (year, month) => {
    return checkMonthlyAvailability(
      year,
      month,
      axiosClient,
      {},
      setDisabledDates,
      setIsLoadingDateAvailability
    );
  }, []);

  // Fetch calendar events for viewed month
  const fetchMonthEvents = useCallback(async () => {
    try {
      const year = viewedDate.getFullYear();
      const month = viewedDate.getMonth();

      const [schedulesResponse, appointmentsResponse] = await Promise.all([
        axiosClient.get("/auth/schedules/public/availability"),
        axiosClient.get("/auth/appointment"),
      ]);

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
        }));

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
            normalizeStatus(appointment.AppointmentStatus?.status) === "APPROVED",
          isAppointment: true,
        }));

      setCalendarEvents([...monthSchedules, ...monthAppointments]);
    } catch (error) {
      console.error("Error fetching monthly events:", error);
    }
  }, [viewedDate]);

  // React to date changes
  useEffect(() => {
    if (formData.selectedDate) {
      checkTimeSlotAvailabilityLocal(formData.selectedDate);
    }
  }, [formData.selectedDate, checkTimeSlotAvailabilityLocal]);

  useEffect(() => {
    fetchMonthEvents();
  }, [viewedDate, fetchMonthEvents]);

  useEffect(() => {
    const currentDate = new Date();
    checkMonthlyAvailabilityLocal(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
  }, [checkMonthlyAvailabilityLocal]);

  const handleAvailabilityRefresh = useCallback(() => {
    if (formData.selectedDate) {
      checkTimeSlotAvailabilityLocal(formData.selectedDate);
    }
    const currentDate = new Date();
    checkMonthlyAvailabilityLocal(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
  }, [
    formData.selectedDate,
    checkTimeSlotAvailabilityLocal,
    checkMonthlyAvailabilityLocal,
  ]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleAppointmentChange = () => {
      handleAvailabilityRefresh();
      showToast("Appointment data updated - availability refreshed", "info");
    };

    const handleScheduleChange = () => {
      handleAvailabilityRefresh();
      showToast("Schedule updated - availability refreshed", "info");
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

  // Clear Form handlers
  const handleClear = useCallback(() => setShowClearConfirm(true), []);
  const cancelClear = useCallback(() => setShowClearConfirm(false), []);
  const confirmClear = useCallback(() => {
    setFormData({
      ...initialFormData,
      userLoggedIn: !!user,
    });
    setStep(0);
    setShowClearConfirm(false);
  }, []);

  const handleNext = useCallback(
    (data) => {
      markAsInteracted();
      setFormData((prev) => ({ ...prev, ...data }));
      setStep((prev) => prev + 1);
    },
    [markAsInteracted]
  );

  const handleBack = useCallback(
    (data) => {
      markAsInteracted();
      setFormData((prev) => ({ ...prev, ...data }));
      setStep((prev) => prev - 1);
    },
    [markAsInteracted]
  );

  const proceedToReview = useCallback(() => {
    markAsInteracted();
    setStep((prev) => prev + 1);
  }, [markAsInteracted]);

  // Submit logic
  const handleSubmitFinal = useCallback(async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      showToast("Submitting appointment...", "info");

      let captchaToken = null;
      const hasRequestLetterFiles =
        formData.requestLetterUpload && formData.requestLetterUpload.length > 0;

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
        const [startTime, endTime] = formData.selectedTime.split("-");
        const convertTo24Hour = (timeStr) => {
          const [hourStr, minuteStr] = timeStr.split(":");
          let hour = parseInt(hourStr, 10);
          if (hour >= 1 && hour <= 5) hour += 12;
          return `${hour.toString().padStart(2, "0")}:${minuteStr}:00`;
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
          ? format(formData.selectedDate, "yyyy-MM-dd")
          : null,
        preferred_time: formData.selectedTime,
        start_time: startTimeValue,
        end_time: endTimeValue,
        additional_notes: formData.additionalNotes,
        request_letter_files: uploadedRequestLetterFiles,
        captchaToken: captchaToken,
      };

      const response = await axiosClient.post("/auth/appointment", payload);

      if (response.status === 201) {
        confirmClear();
        setShowSuccessModal(true);
        window.dispatchEvent(new Event("formSubmitted"));
      }
    } catch (err) {
      console.error("Request failed:", err);

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || "Unknown error occurred";

        if (status === 400) {
          setApiError(`Validation Error: ${message}`);
        } else if (status === 409) {
          setApiError("Time slot conflict: Please select a different time");
        } else if (status === 500) {
          setApiError("Server error: Please try again later");
        } else {
          setApiError(`Error ${status}: ${message}`);
        }
      } else if (err.request) {
        setApiError("Network error: Please check your connection and try again");
      } else {
        setApiError("Failed to submit appointment. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmClear, formData, showToast, isSubmitting]);

  // Only render the active step to avoid setState during render in other steps
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <NoticeStep
            initialData={formData}
            onNext={handleNext}
            setFormData={setFormData}
            markAsInteracted={markAsInteracted}
          />
        );
      case 1:
        return (
          <PersonalInfoStep
            initialData={formData}
            onNext={handleNext}
            onBack={handleBack}
            setFormData={setFormData}
            onClearForm={handleClear}
            markAsInteracted={markAsInteracted}
          />
        );
      case 2:
        return (
          <VisitDetailsStep
            initialData={formData}
            onNext={handleNext}
            onBack={handleBack}
            setFormData={setFormData}
            onClearForm={handleClear}
            markAsInteracted={markAsInteracted}
          />
        );
      case 3:
        return (
          <ScheduleStep
            initialData={formData}
            onNext={proceedToReview} // pass reference, do not invoke
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
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            onBack={handleBack}
            onConfirm={handleSubmitFinal}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col pt-25">
      {renderStep()}

      {/* Unsaved changes modal */}
      {PromptModal}

      {/* Clear Form confirmation */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={cancelClear}
        onConfirm={confirmClear}
        title="Clear Form?"
        message="You have unsaved changes. Are you sure you want to clear the form?"
        type="question"
        theme="light"
      />

      {/* Submit error */}
      <PopupModal
        isOpen={!!apiError}
        onClose={() => setApiError(null)}
        title="Submission Error"
        message={apiError}
        buttonText="Close"
        type="error"
        theme="light"
      />

      {/* Submit success */}
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
