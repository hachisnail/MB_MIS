import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axiosClient from '@/lib/axiosClient';
import StyledButton from '@/components/buttons/StyledButton';
import Toast from '@/features/Toast';
import usePrompt from '@/hooks/usePrompt';
import { format } from 'date-fns';
import Calendar from 'react-calendar';
import TimePicker from 'react-time-picker';
import 'react-calendar/dist/Calendar.css';
import 'react-time-picker/dist/TimePicker.css';
import {
    FormInput,
    DropdownInput,
    ContactNumberInput,
    EmailInput,
    DateInput,
} from '@/features/FormUtilities';
import { useSocketClient } from '@/context/authContext';
import { TypedDropdown, useAddressLogic } from '@/features/AddressDropdownSystem';
import {
    checkTimeSlotAvailability,
    checkDateAvailability,
    checkMonthlyAvailability,
    validateAppointmentSchedule
} from '@/utils/scheduleValidation';
import { getLocalDateString, timeStringToMinutes } from '@/utils/scheduleUtils';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

// Validation schemas for each page
const page1Schema = yup.object({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    phone: yup.string().matches(/^(09|\+639)\d{9}$/, 'Please enter a valid phone number').nullable(),
    organization: yup.string().nullable(),
    street: yup.string().nullable(),
    province: yup.string().required('Province is required'),
    city: yup.string().required('City is required'),
    barangay: yup.string().required('Barangay is required'),
    purpose: yup.string().required('Please select a purpose'),
    populationCount: yup.number()
        .typeError('Please enter a valid number')
        .positive('Population count must be greater than 0')
        .integer('Population count must be a whole number')
        .required('Population count is required'),
});

const page2Schema = yup.object({
    selectedTime: yup.string().when('purpose', {
        is: 'School Field Trip',
        then: (schema) => schema.required('Please select a time slot'),
        otherwise: (schema) => schema.nullable(),
    }),
    timePreference: yup.string().when('purpose', {
        is: (value) => value !== 'School Field Trip',
        then: (schema) => schema.required('Please select a time preference'),
        otherwise: (schema) => schema.nullable(),
    }),
    manualStartTime: yup.string().nullable(),
    manualEndTime: yup.string().nullable(),
    additionalNotes: yup.string()
        .max(500, 'Notes cannot exceed 500 characters')
        .nullable(),
});

const WalkInsPage = () => {
    const [currentPage, setCurrentPage] = useState(1); // 1 or 2 for the two pages
    const navigate = useNavigate();
    const socket = useSocketClient();

    // Address logic hook
    const {
        provinces,
        cities,
        barangays,
        selectedProvince,
        setSelectedProvince,
        selectedCity,
        setSelectedCity,
        selectedBarangay,
        setSelectedBarangay,
        getFilteredProvinces,
        getFilteredCities,
        getFilteredBarangays,
        isLoadingProvinces,
        isLoadingCities,
        isLoadingBarangays,
        provincesError,
        citiesError,
        barangaysError
    } = useAddressLogic();

    const [toastConfig, setToastConfig] = useState({
        message: '',
        type: 'success'
    });

    const initialFormData = {
        // About the Visitor
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        province: '',
        city: '',
        barangay: '',
        street: '',
        organization: '',

        // About Visit
        purpose: '',
        populationCount: '',

        // Date and Time
        visitDate: format(new Date(), 'yyyy-MM-dd'),
        selectedTime: '',
        timePreference: 'specific', // 'specific' or 'flexible'
        manualStartTime: null,
        manualEndTime: null,
        additionalNotes: ''
    };

    // React Hook Form setup for Page 1
    const page1Form = useForm({
        defaultValues: initialFormData,
        resolver: yupResolver(page1Schema),
        mode: 'onTouched'
    });

    // React Hook Form setup for Page 2
    const page2Form = useForm({
        defaultValues: initialFormData,
        resolver: yupResolver(page2Schema),
        mode: 'onTouched'
    });

    const [selectedDate, setSelectedDate] = useState(new Date()); // Calendar date selection

    // Time slot availability states
    const [timeSlotCounts, setTimeSlotCounts] = useState({});
    const [timeSlotExclusive, setTimeSlotExclusive] = useState({});
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const [confirmedSlots, setConfirmedSlots] = useState({});

    // Date availability states
    const [disabledDates, setDisabledDates] = useState([]);
    const [isLoadingDateAvailability, setIsLoadingDateAvailability] = useState(false);
    const [monthlySchedules, setMonthlySchedules] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [viewedDate, setViewedDate] = useState(new Date());

    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(09|\+639)\d{9}$/;

    // Get current form data from both forms
    const getCurrentFormData = () => {
        const page1Data = page1Form.getValues();
        const page2Data = page2Form.getValues();
        return { ...page1Data, ...page2Data };
    };

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
        const page1Values = page1Form.getValues();
        const page2Values = page2Form.getValues();

        // Check if any field has a non-empty, non-default value
        const hasPage1Changes =
            page1Values.firstName !== '' ||
            page1Values.lastName !== '' ||
            page1Values.email !== '' ||
            page1Values.phone !== '' ||
            page1Values.organization !== '' ||
            page1Values.street !== '' ||
            page1Values.province !== '' ||
            page1Values.city !== '' ||
            page1Values.barangay !== '' ||
            page1Values.purpose !== '' ||
            (page1Values.populationCount !== '' && page1Values.populationCount !== undefined);

        const hasPage2Changes =
            page2Values.selectedTime !== '' ||
            page2Values.manualStartTime !== null ||
            page2Values.manualEndTime !== null ||
            page2Values.additionalNotes !== '';

        return hasPage1Changes || hasPage2Changes;
    }, [page1Form, page2Form]);

    // Watch for form changes in both forms
    useEffect(() => {
        let isFirstRender = true;

        const subscription1 = page1Form.watch((value, { name, type }) => {
            // Skip the initial subscription call
            if (isFirstRender) {
                isFirstRender = false;
                return;
            }

            // Mark as interacted when user types
            if (type === 'change' && !hasUserInteracted) {
                markAsInteracted();
            }

            // Only set dirty if user has interacted and there are real changes
            if (type === 'change') {
                const hasChanges = checkForRealChanges();
                setIsDirty(hasChanges);
            }
        });

        return () => {
            subscription1.unsubscribe();
        };
    }, [page1Form, hasUserInteracted, checkForRealChanges, markAsInteracted]);

    useEffect(() => {
        let isFirstRender = true;

        const subscription2 = page2Form.watch((value, { name, type }) => {
            // Skip the initial subscription call
            if (isFirstRender) {
                isFirstRender = false;
                return;
            }

            // Mark as interacted when user types
            if (type === 'change' && !hasUserInteracted) {
                markAsInteracted();
            }

            // Only set dirty if user has interacted and there are real changes
            if (type === 'change') {
                const hasChanges = checkForRealChanges();
                setIsDirty(hasChanges);
            }
        });

        return () => {
            subscription2.unsubscribe();
        };
    }, [page2Form, hasUserInteracted, checkForRealChanges, markAsInteracted]);

    // Reset isDirty when form is submitted
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

    const showToast = useCallback((message, type = 'success') => {
        setToastConfig({
            message,
            type
        });
    }, []);

    const hideToast = useCallback(() => {
        setToastConfig(prevConfig => ({
            ...prevConfig,
            message: ''
        }));
    }, []);

    // Automatically hide toast after 3 seconds when message changes
    useEffect(() => {
        if (toastConfig.message) {
            const timer = setTimeout(() => {
                setToastConfig(prev => ({ ...prev, message: '' }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastConfig.message]);

    // Handle address changes and sync with form
    const handleProvinceChange = (province) => {
        markAsInteracted();
        setSelectedProvince(province);
        const provinceName = province?.name || '';
        page1Form.setValue('province', provinceName, { shouldValidate: true });
        page1Form.setValue('city', '', { shouldValidate: false });
        page1Form.setValue('barangay', '', { shouldValidate: false });
        setSelectedCity(null);
        setSelectedBarangay(null);

        // Clear error when province is selected
        if (province) {
            page1Form.clearErrors('province');
        }
    };

    const handleCityChange = (city) => {
        markAsInteracted();
        setSelectedCity(city);
        const cityName = city?.name || '';
        page1Form.setValue('city', cityName, { shouldValidate: true });
        page1Form.setValue('barangay', '', { shouldValidate: false });
        setSelectedBarangay(null);

        // Clear error when city is selected
        if (city) {
            page1Form.clearErrors('city');
        }
    };

    const handleBarangayChange = (barangay) => {
        markAsInteracted();
        setSelectedBarangay(barangay);
        const barangayName = barangay?.name || '';
        page1Form.setValue('barangay', barangayName, { shouldValidate: true });

        // Clear error when barangay is selected
        if (barangay) {
            page1Form.clearErrors('barangay');
        }
    };

    // Initialize address selections from form data
    useEffect(() => {
        if (initialFormData.province && provinces.length > 0) {
            const prov = provinces.find((p) => p.name === initialFormData.province);
            if (prov) setSelectedProvince(prov);
        }
    }, [initialFormData.province, provinces]);

    useEffect(() => {
        if (initialFormData.city && cities.length > 0) {
            const city = cities.find((c) => c.name === initialFormData.city);
            if (city) setSelectedCity(city);
        }
    }, [initialFormData.city, cities]);

    useEffect(() => {
        if (initialFormData.barangay && barangays.length > 0) {
            const barangay = barangays.find((b) => b.name === initialFormData.barangay);
            if (barangay) setSelectedBarangay(barangay);
        }
    }, [initialFormData.barangay, barangays]);

    const handleNext = async () => {
        // First, manually validate address fields since they're not directly controlled by react-hook-form
        let hasErrors = false;

        if (!selectedProvince) {
            page1Form.setError('province', { type: 'manual', message: 'Province is required' });
            hasErrors = true;
        } else {
            page1Form.clearErrors('province');
        }

        if (!selectedCity) {
            page1Form.setError('city', { type: 'manual', message: 'City is required' });
            hasErrors = true;
        } else {
            page1Form.clearErrors('city');
        }

        if (!selectedBarangay) {
            page1Form.setError('barangay', { type: 'manual', message: 'Barangay is required' });
            hasErrors = true;
        } else {
            page1Form.clearErrors('barangay');
        }

        // Trigger validation for all other fields
        const isValid = await page1Form.trigger();

        if (isValid && !hasErrors) {
            // Sync data between forms
            const page1Data = page1Form.getValues();
            page2Form.reset({ ...page2Form.getValues(), ...page1Data });
            setCurrentPage(2);
        } else {
            showToast('Please complete all required fields', 'error');
        }
    };

    const handlePrevious = () => {
        // Sync data between forms
        const page2Data = page2Form.getValues();
        page1Form.reset({ ...page1Form.getValues(), ...page2Data });
        setCurrentPage(1);
    };

    // Helper function to fetch existing events for validation
    const fetchExistingEvents = async (date) => {
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');

            const [schedulesResponse, appointmentsResponse] = await Promise.all([
                axiosClient.get('/auth/schedules'),
                axiosClient.get('/auth/appointment')
            ]);

            // Transform schedules to match validation format
            const schedules = schedulesResponse.data
                .filter(schedule => {
                    if (!schedule.date || !schedule.start_time || !schedule.end_time) return false;
                    const scheduleDate = schedule.date.split('T')[0];
                    return scheduleDate === formattedDate && schedule.status !== 'COMPLETED';
                })
                .map(schedule => ({
                    date: schedule.date.split('T')[0],
                    startTime: schedule.start_time.substring(0, 5), // Extract HH:MM format
                    endTime: schedule.end_time.substring(0, 5), // Extract HH:MM format
                    availability: schedule.availability || 'SHARED',
                    isSchedule: true
                }));

            // Transform appointments to match validation format - CRITICAL FIX
            // Include ALL confirmed appointments AND walk-ins regardless of status
            const appointments = appointmentsResponse.data
                .filter(appointment => {
                    if (!appointment.preferred_date) return false;
                    const appointmentDate = appointment.preferred_date.split('T')[0];
                    const status = (appointment.AppointmentStatus?.status || '').toUpperCase();

                    // Include CONFIRMED appointments AND ALL walk-ins (even pending ones)
                    // Walk-ins are auto-confirmed so we count them all
                    return appointmentDate === formattedDate &&
                        (status === 'CONFIRMED' || appointment.is_walk_in === true || appointment.is_walk_in === 1);
                })
                .map(appointment => {
                    // Handle different time formats properly
                    let startTime = null;
                    let endTime = null;

                    if (appointment.start_time && appointment.end_time) {
                        startTime = appointment.start_time.substring(0, 5);
                        endTime = appointment.end_time.substring(0, 5);
                    } else if (appointment.preferred_time && appointment.preferred_time.includes('-')) {
                        // Handle School Field Trip time slots
                        const [start, end] = appointment.preferred_time.split('-');

                        // Convert afternoon slots properly (01:00-05:00 PM = 13:00-17:00)
                        const convertSlotTime = (timeStr) => {
                            const [hourStr, minuteStr] = timeStr.trim().split(':');
                            let hour = parseInt(hourStr, 10);
                            const minute = parseInt(minuteStr || '0', 10);

                            // Convert afternoon slots (1-5 PM)
                            if (hour >= 1 && hour <= 5) {
                                hour += 12;
                            }

                            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                        };

                        startTime = convertSlotTime(start);
                        endTime = convertSlotTime(end);
                    }

                    // Only return appointments that have valid times for validation
                    if (!startTime || !endTime) {
                        return null; // Filter out appointments without times
                    }

                    return {
                        date: appointment.preferred_date.split('T')[0],
                        startTime,
                        endTime,
                        isSchedule: false,
                        isAppointment: true,
                        appointmentId: appointment.appointment_id,
                        isWalkIn: appointment.is_walk_in
                    };
                })
                .filter(Boolean); // Remove null entries

            console.log(`Found ${appointments.length} existing appointments/walk-ins for ${formattedDate}`);
            return [...schedules, ...appointments];
        } catch (error) {
            console.error('Error fetching existing events:', error);
            return [];
        }
    };

    // Helper function to convert AM/PM time to 24-hour format for validation
    const convertTimeForValidation = (timeStr) => {
        if (!timeStr) return null;

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
            // Already in 24-hour format
            const [hourStr, minuteStr] = timeStr.split(':');
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr || '0', 10);
            return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        }
    };

    const handleSubmit = async () => {
        const isValid = await page2Form.trigger();
        if (!isValid) {
            showToast('Please complete all required fields', 'error');
            return;
        }

        const currentFormData = getCurrentFormData();

        // Check if manual times are provided for validation
        const hasManualTimes = currentFormData.purpose !== 'School Field Trip' &&
            currentFormData.manualStartTime &&
            currentFormData.manualEndTime;

        if (hasManualTimes) {
            try {
                // Convert times to 24-hour format for validation
                const startTime24 = convertTimeForValidation(currentFormData.manualStartTime);
                const endTime24 = convertTimeForValidation(currentFormData.manualEndTime);

                if (!startTime24 || !endTime24) {
                    showToast('Invalid time format selected', 'error');
                    return;
                }

                // Fetch existing events for the selected date
                const existingEvents = await fetchExistingEvents(selectedDate);

                // Prepare appointment data for validation
                const appointmentData = {
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    startTime: startTime24,
                    endTime: endTime24
                };

                // Validate the appointment schedule
                const validationResult = validateAppointmentSchedule(appointmentData, existingEvents);

                if (!validationResult.isValid) {
                    showToast(`Time conflict: ${validationResult.error}`, 'error');
                    return;
                }
            } catch (error) {
                console.error('Validation error:', error);
                showToast('Time validation failed. Please try again.', 'error');
                return;
            }
        }

        // Validate School Field Trip appointments for 5-appointment limit
        if (currentFormData.purpose === 'School Field Trip' && currentFormData.selectedTime) {
            try {
                // Convert selected time slot to start/end times for validation
                const [startTime, endTime] = currentFormData.selectedTime.split('-');

                // Convert time slot format (e.g., "09:00" or "01:00") to 24-hour format
                const convertSlotTo24Hour = (timeStr) => {
                    const [hourStr, minuteStr] = timeStr.split(':');
                    let hour = parseInt(hourStr, 10);
                    // Handle afternoon slots (01:00-05:00 PM should be 13:00-17:00)
                    if (hour >= 1 && hour <= 5) {
                        hour += 12;
                    }
                    return `${hour.toString().padStart(2, '0')}:${minuteStr}`;
                };

                const startTime24 = convertSlotTo24Hour(startTime);
                const endTime24 = convertSlotTo24Hour(endTime);

                // Fetch existing events for the selected date
                const existingEvents = await fetchExistingEvents(selectedDate);

                // Count overlapping events manually for School Field Trip
                const overlappingEvents = existingEvents.filter(event => {
                    const eventStart = timeStringToMinutes(event.startTime);
                    const eventEnd = timeStringToMinutes(event.endTime);
                    const slotStart = timeStringToMinutes(startTime24);
                    const slotEnd = timeStringToMinutes(endTime24);

                    // Check if there's any overlap
                    return (slotStart < eventEnd && eventStart < slotEnd);
                });

                console.log(`Overlapping events count: ${overlappingEvents.length}`);

                // Check if adding this appointment would exceed the limit
                if (overlappingEvents.length >= 5) {
                    showToast(`Cannot add appointment: This time slot already has 5 overlapping events (limit reached)`, 'error');
                    return;
                }

                // Also check for exclusive schedules
                const hasExclusiveConflict = existingEvents.some(event => {
                    if (!event.isSchedule || event.availability !== 'EXCLUSIVE') return false;
                    const eventStart = timeStringToMinutes(event.startTime);
                    const eventEnd = timeStringToMinutes(event.endTime);
                    const slotStart = timeStringToMinutes(startTime24);
                    const slotEnd = timeStringToMinutes(endTime24);
                    return (slotStart < eventEnd && eventStart < slotEnd);
                });

                if (hasExclusiveConflict) {
                    showToast('Cannot schedule during an exclusive event time slot', 'error');
                    return;
                }
            } catch (error) {
                console.error('Time slot validation error:', error);
                showToast('Time slot validation failed. Please try again.', 'error');
                return;
            }
        }

        // If validation passes or no manual times provided, show confirmation modal
        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);

        const currentFormData = getCurrentFormData();

        // Time conversion logic (same as Appointment.jsx)
        let startTimeValue = null;
        let endTimeValue = null;

        if (currentFormData.purpose === 'School Field Trip' && currentFormData.selectedTime) {
            const [startTime, endTime] = currentFormData.selectedTime.split('-');
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
        } else if (currentFormData.purpose !== 'School Field Trip' && currentFormData.timePreference === 'specific' && currentFormData.manualStartTime && currentFormData.manualEndTime) {
            // For manual time input, convert from 12-hour to 24-hour format with seconds
            const convertTo24Hour = (timeStr) => {
                if (!timeStr) return null;

                const hasAMPM = timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm');

                if (hasAMPM) {
                    const isPM = timeStr.toLowerCase().includes('pm');
                    const cleanTime = timeStr.toLowerCase().replace(/am|pm/g, '').trim();
                    const [hourStr, minuteStr] = cleanTime.split(':');
                    let hour = parseInt(hourStr, 10);
                    const minute = parseInt(minuteStr || '0', 10);

                    if (isPM && hour < 12) hour += 12;
                    if (!isPM && hour === 12) hour = 0;

                    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
                } else {
                    // Already in 24-hour format
                    return `${timeStr}:00`;
                }
            };

            startTimeValue = convertTo24Hour(currentFormData.manualStartTime);
            endTimeValue = convertTo24Hour(currentFormData.manualEndTime);
        }

        // Payload structure matching Appointment.jsx exactly
        const payload = {
            first_name: currentFormData.firstName,
            last_name: currentFormData.lastName,
            email: currentFormData.email,
            phone: currentFormData.phone,
            organization: currentFormData.organization,
            province: selectedProvince?.name || '',
            barangay: selectedBarangay?.name || '',
            city_municipality: selectedCity?.name || '',
            street: currentFormData.street,
            purpose_of_visit: currentFormData.purpose,
            population_count: currentFormData.populationCount,
            preferred_date: currentFormData.visitDate,
            preferred_time: currentFormData.purpose === 'School Field Trip'
                ? currentFormData.selectedTime
                : (currentFormData.manualStartTime && currentFormData.manualEndTime)
                    ? `${currentFormData.manualStartTime}-${currentFormData.manualEndTime}`
                    : null,
            start_time: startTimeValue,
            end_time: endTimeValue,
            additional_notes: currentFormData.additionalNotes,
            // Walk-in specific flags
            is_walk_in: true,
            status: 'confirmed' // Walk-ins are automatically confirmed
        };

        try {
            const response = await axiosClient.post('/auth/appointment', payload);

            if (response.status === 201) {
                showToast('Walk-in visitor registered successfully!', 'success');

                // Reset forms
                page1Form.reset(initialFormData);
                page2Form.reset(initialFormData);
                setCurrentPage(1);

                // Reset address selections
                setSelectedProvince(null);
                setSelectedCity(null);
                setSelectedBarangay(null);

                // Reset selected date to current date
                setSelectedDate(new Date());

                // Trigger form reset event
                window.dispatchEvent(new Event('formSubmitted'));

                // Stay on the same page (page 1) for next walk-in entry
                // No navigation - just reset to page 1 for continuous walk-in processing
            }
        } catch (error) {
            console.error('Request failed:', error);

            // Error handling
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Unknown error occurred';

                if (status === 400) {
                    showToast(`Validation error: ${message}`, 'error');
                } else if (status === 409) {
                    showToast('Time slot conflict detected', 'error');
                } else if (status === 500) {
                    showToast('Server error occurred', 'error');
                } else {
                    showToast(`Error: ${message}`, 'error');
                }
            } else if (error.request) {
                showToast('Network connection error', 'error');
            } else {
                showToast('Registration failed. Please try again.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelSubmit = () => {
        setShowConfirmModal(false);
    };

    // Check time slot availability when date changes and user is on page 2
    useEffect(() => {
        if (selectedDate && currentPage === 2) {
            checkTimeSlotAvailability(
                selectedDate,
                axiosClient,
                showToast,
                setTimeSlotCounts,
                setTimeSlotExclusive,
                setConfirmedSlots,
                setIsLoadingTimeSlots
            );
        }

        // Always update form data with selected date regardless of page
        if (selectedDate) {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            page2Form.setValue('visitDate', dateString);
        }
    }, [selectedDate, currentPage, page2Form]);

    // Check monthly availability when component mounts or when month changes
    useEffect(() => {
        const currentDate = new Date();
        checkMonthlyAvailability(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            axiosClient,
            setMonthlySchedules,
            setDisabledDates,
            setIsLoadingDateAvailability
        );
    }, []);

    // Fetch calendar events for the viewed month
    const fetchMonthEvents = useCallback(async () => {
        try {
            const year = viewedDate.getFullYear();
            const month = viewedDate.getMonth();

            const [schedulesResponse, appointmentsResponse] = await Promise.all([
                axiosClient.get('/auth/schedules'),
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
                    isActive: (appointment.AppointmentStatus?.status || '').toUpperCase() === 'CONFIRMED',
                    isAppointment: true
                }));

            const allEvents = [...monthSchedules, ...monthAppointments];
            setCalendarEvents(allEvents);
        } catch (error) {
            console.error('Error fetching monthly events:', error);
        }
    }, [viewedDate]);

    useEffect(() => {
        fetchMonthEvents();
    }, [viewedDate, fetchMonthEvents]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        // Trigger form change event
        window.dispatchEvent(new Event('formChanged'));
    };

    const handleTimeSelect = async (time) => {
        // Validate time slot before allowing selection
        try {
            // Convert selected time slot to start/end times for validation
            const [startTime, endTime] = time.split('-');

            // Convert time slot format to 24-hour format
            const convertSlotTo24Hour = (timeStr) => {
                const [hourStr, minuteStr] = timeStr.split(':');
                let hour = parseInt(hourStr, 10);
                // Handle afternoon slots (01:00-05:00 PM should be 13:00-17:00)
                if (hour >= 1 && hour <= 5) {
                    hour += 12;
                }
                return `${hour.toString().padStart(2, '0')}:${minuteStr}`;
            };

            const startTime24 = convertSlotTo24Hour(startTime);
            const endTime24 = convertSlotTo24Hour(endTime);

            // Fetch existing events for the selected date
            const existingEvents = await fetchExistingEvents(selectedDate);

            // Prepare appointment data for validation
            const appointmentData = {
                date: format(selectedDate, 'yyyy-MM-dd'),
                startTime: startTime24,
                endTime: endTime24
            };

            // Validate the appointment schedule
            const validationResult = validateAppointmentSchedule(appointmentData, existingEvents);

            if (!validationResult.isValid) {
                showToast(`Time slot unavailable: ${validationResult.error}`, 'error');
                return;
            }

            // If validation passes, set the time
            page2Form.setValue('selectedTime', time);

            // Trigger form change event
            window.dispatchEvent(new Event('formChanged'));
        } catch (error) {
            console.error('Time slot validation error:', error);
            showToast('Time slot validation failed', 'error');
        }
    };

    const handleManualStartTimeChange = (time) => {
        page2Form.setValue('manualStartTime', time);
        // Trigger form change event
        window.dispatchEvent(new Event('formChanged'));
    };

    const handleManualEndTimeChange = (time) => {
        page2Form.setValue('manualEndTime', time);
        // Trigger form change event
        window.dispatchEvent(new Event('formChanged'));
    };

    const handleTimePreferenceChange = (preference) => {
        page2Form.setValue('timePreference', preference);
        // Clear time fields when switching to flexible
        if (preference === 'flexible') {
            page2Form.setValue('manualStartTime', null);
            page2Form.setValue('manualEndTime', null);
        } else {
            // Set default times when switching to specific (optional)
            page2Form.setValue('manualStartTime', null);
            page2Form.setValue('manualEndTime', null);
        }
        // Trigger form change event
        window.dispatchEvent(new Event('formChanged'));
    };

    // Socket integration for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleScheduleChange = () => {
            fetchMonthEvents();
            if (selectedDate && currentPage === 2) {
                checkTimeSlotAvailability(
                    selectedDate,
                    axiosClient,
                    showToast,
                    setTimeSlotCounts,
                    setTimeSlotExclusive,
                    setConfirmedSlots,
                    setIsLoadingTimeSlots
                );
            }
        };

        const handleAppointmentChange = () => {
            fetchMonthEvents();
            if (selectedDate && currentPage === 2) {
                checkTimeSlotAvailability(
                    selectedDate,
                    axiosClient,
                    showToast,
                    setTimeSlotCounts,
                    setTimeSlotExclusive,
                    setConfirmedSlots,
                    setIsLoadingTimeSlots
                );
            }
        };

        socket.onDbChange("Schedule", "*", handleScheduleChange);
        socket.onDbChange("Appointment", "*", handleAppointmentChange);
        socket.onDbChange("AppointmentStatus", "*", handleAppointmentChange);

        return () => {
            socket.offDbChange("Schedule", "*", handleScheduleChange);
            socket.offDbChange("Appointment", "*", handleAppointmentChange);
            socket.offDbChange("AppointmentStatus", "*", handleAppointmentChange);
        };
    }, [socket, selectedDate, currentPage, fetchMonthEvents]);

    // Page 1 Component
    const renderPage1 = () => (
        <div className="w-full max-w-[1200px] mx-auto p-8">
            {/* About the Visitor Section */}
            <div className="mb-12">
                <div className="grid grid-cols-12 gap-8 mb-6">
                    {/* Left side - Title */}
                    <div className="col-span-3">
                        <h2 className="text-3xl font-semibold text-gray-900">About the Visitor</h2>
                    </div>

                    {/* Right side - Empty for alignment */}
                    <div className="col-span-9"></div>
                </div>

                {/* Full width horizontal line */}
                <hr className="border-gray-300 mb-8" />

                <div className="grid grid-cols-12 gap-8">
                    {/* Left side - Empty for alignment */}
                    <div className="col-span-3"></div>

                    {/* Right side - Form Fields */}
                    <div className="col-span-9">
                        <form onSubmit={page1Form.handleSubmit(() => { })}>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <FormInput
                                        placeholder="First Name"
                                        register={page1Form.register}
                                        name="firstName"
                                        error={page1Form.formState.errors.firstName || ""}
                                        className="w-full h-12 text-base"
                                        onFocus={markAsInteracted}
                                        onChange={markAsInteracted}
                                    />
                                </div>

                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <FormInput
                                        placeholder="Last Name"
                                        register={page1Form.register}
                                        name="lastName"
                                        error={page1Form.formState.errors.lastName || ""}
                                        className="w-full h-12 text-base"
                                        onFocus={markAsInteracted}
                                        onChange={markAsInteracted}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <EmailInput
                                        control={page1Form.control}
                                        name="email"
                                        error={page1Form.formState.errors.email || ""}
                                        className="w-full h-12 text-base"
                                    />
                                </div>

                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="w-full [&>div]:w-full [&_input]:w-full [&_input]:h-12 [&_input]:text-base">
                                        <ContactNumberInput
                                            control={page1Form.control}
                                            name="phone"
                                            error={page1Form.formState.errors.phone || ""}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        Province <span className="text-red-500">*</span>
                                    </label>
                                    <TypedDropdown
                                        placeholder="Type to search..."
                                        options={provinces}
                                        selectedItem={selectedProvince}
                                        onChange={handleProvinceChange}
                                        isLoading={isLoadingProvinces}
                                        error={page1Form.formState.errors.province?.message || provincesError || ""}
                                        filterFunction={getFilteredProvinces}
                                        maxSuggestions={10}
                                        variant="rounded"
                                        size="medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <TypedDropdown
                                        placeholder={selectedProvince ? "Type to search..." : "Select province first"}
                                        options={cities}
                                        selectedItem={selectedCity}
                                        onChange={handleCityChange}
                                        disabled={!selectedProvince}
                                        isLoading={isLoadingCities}
                                        error={page1Form.formState.errors.city?.message || citiesError || ""}
                                        filterFunction={getFilteredCities}
                                        maxSuggestions={10}
                                        variant="rounded"
                                        size="medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        Barangay <span className="text-red-500">*</span>
                                    </label>
                                    <TypedDropdown
                                        placeholder={selectedCity ? "Type to search..." : "Select city first"}
                                        options={barangays}
                                        selectedItem={selectedBarangay}
                                        onChange={handleBarangayChange}
                                        disabled={!selectedCity}
                                        isLoading={isLoadingBarangays}
                                        error={page1Form.formState.errors.barangay?.message || barangaysError || ""}
                                        filterFunction={getFilteredBarangays}
                                        maxSuggestions={12}
                                        variant="rounded"
                                        size="medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        Street
                                    </label>
                                    <FormInput
                                        placeholder="Street"
                                        register={page1Form.register}
                                        name="street"
                                        error={page1Form.formState.errors.street || ""}
                                        className="w-full h-12 text-base"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    Organization
                                </label>
                                <FormInput
                                    placeholder="Organization"
                                    register={page1Form.register}
                                    name="organization"
                                    error={page1Form.formState.errors.organization || ""}
                                    className="w-full h-12 text-base"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* About Visit Section */}
            <div className="mb-8">
                <div className="grid grid-cols-12 gap-8">
                    {/* Left side - Title */}
                    <div className="col-span-3">
                        <h2 className="text-3xl font-semibold text-gray-900 mb-2">About Visit</h2>
                    </div>

                    {/* Right side - Empty for alignment */}
                    <div className="col-span-9"></div>
                </div>

                {/* Full width horizontal line */}
                <hr className="border-gray-300 mb-6" />

                <div className="grid grid-cols-12 gap-8">
                    {/* Left side - Empty for alignment */}
                    <div className="col-span-3"></div>

                    {/* Right side - Form Fields */}
                    <div className="col-span-9">
                        <div className="mb-6">
                            <label className="block text-base font-medium text-gray-700 mb-2">
                                Purpose Visits <span className="text-red-500">*</span>
                            </label>
                            <DropdownInput
                                control={page1Form.control}
                                name="purpose"
                                error={page1Form.formState.errors.purpose || ""}
                                options={[
                                    { value: "", label: "Choose Purpose" },
                                    { value: "Research Paper", label: "Research Paper" },
                                    { value: "School Field Trip", label: "School Field Trip" },
                                    { value: "Museum Group Tour", label: "Museum Group Tour" },
                                    { value: "Interviews", label: "Interviews" },
                                    { value: "Collaboration Meetings", label: "Collaboration Meetings" },
                                    { value: "Photography or Media Projects", label: "Photography or Media Projects" },
                                    { value: "Conservation Consultation", label: "Conservation Consultation" }
                                ]}
                                className="w-full h-12 text-base"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-base font-medium text-gray-700 mb-2">
                                Population Count <span className="text-red-500">*</span>
                            </label>
                            <FormInput
                                placeholder="Number of visitors"
                                register={page1Form.register}
                                name="populationCount"
                                type="number"
                                error={page1Form.formState.errors.populationCount || ""}
                                className="w-full h-12 text-base"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Page 2 Component
    const renderPage2 = () => {
        const formData = getCurrentFormData();

        return (
            <div className="w-full max-w-[1200px] mx-auto p-8">
                {/* Date and Time of the Visit Section */}
                <div className="mb-12">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-3">
                            <h2 className="text-3xl font-semibold text-gray-900 mb-2">Date and Time of the Visit</h2>
                        </div>

                        {/* Right side - Empty for alignment */}
                        <div className="col-span-9"></div>
                    </div>

                    {/* Full width horizontal line */}
                    <hr className="border-gray-300 mb-8" />

                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Empty for alignment */}
                        <div className="col-span-3"></div>

                        {/* Right side - Calendar and Time Selection */}
                        <div className="col-span-9">
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                {/* Left side - Calendar */}
                                <div className="max-w-sm">
                                    <label className="block text-base font-medium text-gray-700 mb-4">
                                        Select preferred date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="rounded-xl bg-black p-3 shadow-xl inline-block">
                                        <Calendar
                                            onChange={handleDateSelect}
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
                                            tileDisabled={({ date }) => {
                                                const dateString = getLocalDateString(date);
                                                return disabledDates.includes(dateString);
                                            }}
                                            showNeighboringMonth={false}
                                            className="p-2 rounded-lg text-base"
                                        />
                                    </div>
                                    {selectedDate && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            Selected: <span className="font-semibold">{format(selectedDate, 'MMMM d, yyyy')}</span>
                                        </div>
                                    )}
                                    {isLoadingDateAvailability && (
                                        <p className="mt-2 text-sm text-gray-500">Checking date availability...</p>
                                    )}
                                </div>

                                {/* Right side - Time slots for School Field Trip */}
                                {formData.purpose === 'School Field Trip' && (
                                    <div>
                                        <label className="block text-lg font-medium text-gray-700 mb-6">
                                            Select preferred time <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-1 gap-4">
                                            {['09:00-10:29', '10:30-11:59', '01:00-02:29', '02:30-04:00'].map((time) => {
                                                const isExclusive = timeSlotExclusive[time];
                                                const hasConfirmedAppointment = confirmedSlots[time];
                                                const slotOverlapCount = timeSlotCounts[time] || 0;
                                                const isOverLimit = slotOverlapCount >= 5;
                                                const isUnavailable = isExclusive || hasConfirmedAppointment || isOverLimit;
                                                const isSelected = formData.selectedTime === time;

                                                return (
                                                    <div key={time} className="relative group">
                                                        <button
                                                            type="button"
                                                            onClick={() => !isUnavailable && handleTimeSelect(time)}
                                                            disabled={isUnavailable}
                                                            className={`w-full px-6 py-4 border-2 rounded-lg text-left transition-colors relative text-lg
                                                            ${isSelected
                                                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                                    : isUnavailable
                                                                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                                }
                                                        `}
                                                        >
                                                            <span className={`font-medium ${isUnavailable ? 'line-through' : ''}`}>
                                                                {time}
                                                            </span>
                                                            {slotOverlapCount > 0 && !isUnavailable && (
                                                                <span className="text-sm text-gray-500 block">
                                                                    {slotOverlapCount}/5 slots used
                                                                </span>
                                                            )}
                                                            {isUnavailable && (
                                                                <span className="absolute inset-0 flex items-center justify-center text-red-600">
                                                                    <i className="fa-solid fa-times text-2xl"></i>
                                                                </span>
                                                            )}
                                                        </button>

                                                        {isUnavailable && (
                                                            <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-3 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                                {isExclusive ? 'This time slot has an exclusive schedule' :
                                                                    hasConfirmedAppointment ? 'This time slot already has a confirmed appointment' :
                                                                        isOverLimit ? 'This time slot has reached the maximum limit of 5 overlapping events' :
                                                                            'This time slot is unavailable'}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {page2Form.formState.errors.selectedTime && (
                                            <p className="mt-3 text-lg text-red-600">Please select a time slot</p>
                                        )}
                                        {isLoadingTimeSlots && (
                                            <p className="mt-3 text-lg text-gray-500">Checking time slot availability...</p>
                                        )}
                                    </div>
                                )}

                                {/* Right side - Manual time selection for other purposes */}
                                {formData.purpose && formData.purpose !== 'School Field Trip' && (
                                    <div>
                                        <label className="block text-lg font-medium text-gray-700 mb-6">
                                            Select visit time <span className="text-gray-500">(Optional)</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex flex-col">
                                                <label htmlFor="manual-start-time" className="text-lg text-gray-600 mb-2">
                                                    Start Time <span className="text-gray-500">(Optional)</span>
                                                </label>
                                                <Controller
                                                    name="manualStartTime"
                                                    control={page2Form.control}
                                                    render={({ field }) => (
                                                        <TimePicker
                                                            id="manual-start-time"
                                                            onChange={(time) => {
                                                                field.onChange(time);
                                                                handleManualStartTimeChange(time);
                                                            }}
                                                            value={field.value}
                                                            format="hh:mm a"
                                                            disableClock
                                                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6A3F6] text-lg"
                                                        />
                                                    )}
                                                />
                                                {page2Form.formState.errors.manualStartTime && (
                                                    <p className="mt-2 text-lg text-red-600">
                                                        {page2Form.formState.errors.manualStartTime.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <label htmlFor="manual-end-time" className="text-lg text-gray-600 mb-2">
                                                    End Time <span className="text-gray-500">(Optional)</span>
                                                </label>
                                                <Controller
                                                    name="manualEndTime"
                                                    control={page2Form.control}
                                                    render={({ field }) => (
                                                        <TimePicker
                                                            id="manual-end-time"
                                                            onChange={(time) => {
                                                                field.onChange(time);
                                                                handleManualEndTimeChange(time);
                                                            }}
                                                            value={field.value}
                                                            format="hh:mm a"
                                                            disableClock
                                                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A6A3F6] text-lg"
                                                        />
                                                    )}
                                                />
                                                {page2Form.formState.errors.manualEndTime && (
                                                    <p className="mt-2 text-lg text-red-600">
                                                        {page2Form.formState.errors.manualEndTime.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                            <div className="flex items-start">
                                                <svg
                                                    className="w-6 h-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0"
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
                                                <p className="text-lg text-blue-700">
                                                    <span className="font-medium">Note:</span> Time selection is optional for walk-in visitors.
                                                    If no specific time is provided, the visit will be recorded without time constraints.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Visit Section */}
                <div className="mb-8">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-3">
                            <h2 className="text-3xl font-semibold text-gray-900 mb-2">About Visit</h2>
                        </div>

                        {/* Right side - Empty for alignment */}
                        <div className="col-span-9"></div>
                    </div>

                    {/* Full width horizontal line */}
                    <hr className="border-gray-300 mb-6" />

                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Empty for alignment */}
                        <div className="col-span-3"></div>

                        {/* Right side - Form Fields */}
                        <div className="col-span-9">
                            <form onSubmit={page2Form.handleSubmit(() => { })}>
                                <div className="mb-6">
                                    <label className="block text-base font-medium text-gray-700 mb-2">
                                        Note
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            {...page2Form.register('additionalNotes')}
                                            rows="6"
                                            maxLength="500"
                                            placeholder="Additional notes (optional)"
                                            className={`w-full px-3 py-2 border text-base rounded-lg focus:outline-none resize-none ${page2Form.formState.errors.additionalNotes
                                                ? "border-red-600"
                                                : "border-black"
                                                }`}
                                            style={{
                                                boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
                                            }}
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-red-600 text-sm h-5 pl-1">
                                                {page2Form.formState.errors.additionalNotes?.message || ""}
                                            </span>
                                            <span className="text-sm text-gray-500 pr-1">
                                                {page2Form.watch('additionalNotes')?.length || 0}/500
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {PromptModal}
            {/* Main Container */}
            <div className="w-full h-full bg-white">
                {/* Content */}
                <div className="flex-1">
                    {currentPage === 1 ? renderPage1() : renderPage2()}
                </div>

                {/* Footer with buttons */}
                <div className="border-t border-gray-200 p-8">
                    <div className="flex justify-between items-center max-w-[1400px] mx-auto">
                        <div>
                            {currentPage === 1 ? (
                                <button
                                    onClick={() => navigate('/admin/appointment')}
                                    className="px-8 py-3 bg-black text-white text-lg rounded hover:bg-gray-800 transition-colors"
                                >
                                    Return
                                </button>
                            ) : (
                                <button
                                    onClick={handlePrevious}
                                    className="px-8 py-3 bg-black text-white text-lg rounded hover:bg-gray-800 transition-colors"
                                >
                                    PREV
                                </button>
                            )}
                        </div>

                        <div>
                            {currentPage === 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-black text-white text-lg rounded hover:bg-gray-800 transition-colors"
                                >
                                    NEXT
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-black text-white text-lg rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting && (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    )}
                                    {isSubmitting ? 'SUBMITTING...' : 'DONE'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={cancelSubmit}
                onConfirm={confirmSubmit}
                title="Confirm Walk-in Registration"
                message={
                    <div className="space-y-3">
                        <div>
                            <p>Are you sure you want to register this walk-in visitor?</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                            <div><strong>Name:</strong> {getCurrentFormData().firstName} {getCurrentFormData().lastName}</div>
                            <div><strong>Email:</strong> {getCurrentFormData().email}</div>
                            <div><strong>Purpose:</strong> {getCurrentFormData().purpose}</div>
                            <div><strong>Date:</strong> {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Not selected'}</div>
                            <div><strong>Time:</strong> {
                                getCurrentFormData().purpose === 'School Field Trip'
                                    ? (getCurrentFormData().selectedTime || 'Not selected')
                                    : getCurrentFormData().manualStartTime && getCurrentFormData().manualEndTime
                                        ? `${getCurrentFormData().manualStartTime} - ${getCurrentFormData().manualEndTime}`
                                        : 'No specific time (flexible)'
                            }</div>
                            <div><strong>Population:</strong> {getCurrentFormData().populationCount} visitor(s)</div>
                        </div>
                        <p className="text-sm text-gray-600">This visitor will be automatically confirmed and registered.</p>
                    </div>
                }
                type="question"
                theme="light"
            />

            <Toast
                message={toastConfig.message}
                type={toastConfig.type}
                onClose={hideToast}
            />
        </>
    );
};

export default WalkInsPage;
