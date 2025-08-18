import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import PopupModal from "@/components/modals/PopupModal";
import Toast from "../../../../features/Toast";
import NoticeStep from "./NoticeStep";
import PersonalInfoStep from "./PersonalInfoStep";
import AddressStep from "./AddressStep";
import VisitDetailsStep from "./VisitDetailsStep";
import ScheduleStep from "./ScheduleStep";
import { format } from 'date-fns';
import {
    checkTimeSlotAvailability,
    checkMonthlyAvailability
} from "../../../../utils/scheduleValidation";
import { useSocketClient } from "../../../../context/authContext";

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
};

const AppointmentForm = ({ user }) => {
    const [formData, setFormData] = useState({
        ...initialFormData,
        userLoggedIn: !!user,
    });

    const [step, setStep] = useState(0);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const socket = useSocketClient();

    // Schedule-related state
    const [timeSlotCounts, setTimeSlotCounts] = useState({});
    const [timeSlotExclusive, setTimeSlotExclusive] = useState({});
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const [confirmedSlots, setConfirmedSlots] = useState({});
    const [disabledDates, setDisabledDates] = useState([]);
    const [isLoadingDateAvailability, setIsLoadingDateAvailability] = useState(false);

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
        setFormData((prev) => ({ ...prev, ...data }));
        setStep((prev) => prev + 1);
    };

    const handleBack = (data) => {
        setFormData((prev) => ({ ...prev, ...data }));
        setStep((prev) => prev - 1);
    };

    const handleSubmitFinal = async () => {
        try {
            setShowSubmitConfirm(false);
            showToast('Submitting appointment...', 'info');

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
                additional_notes: formData.additionalNotes
            };

            const response = await axiosClient.post('/auth/appointment', payload);

            if (response.status === 201) {
                confirmClear();
                setShowSuccessModal(true);
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
        />,
        <PersonalInfoStep
            key="personal"
            initialData={formData}
            onNext={handleNext}
            onBack={handleBack}
            onClearForm={handleClear}
        />,
        <AddressStep
            key="address"
            initialData={formData}
            onNext={handleNext}
            onBack={handleBack}
            setFormData={setFormData}
            onClearForm={handleClear}
        />,
        <VisitDetailsStep
            key="visit"
            initialData={formData}
            onNext={handleNext}
            onBack={handleBack}
            setFormData={setFormData}
            onClearForm={handleClear}
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
        />
    ];

    return (
        <div className="w-screen h-screen flex items-center justify-center flex-col pt-25">
            {steps[step]}

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
                title="Confirm Submission?"
                message="Are you sure you want to submit this appointment?"
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
        </div>
    );
};

export default AppointmentForm;
