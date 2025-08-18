import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '@/lib/axiosClient';
import StyledButton from '@/components/buttons/StyledButton';
import Toast from '@/features/Toast';
import usePrompt from '@/hooks/usePrompt';
import { format } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
    StyledInput,
    LabeledInput,
    StyledSelect,
} from '@/features/Utilities';
import { useSocketClient } from '@/context/authContext';
import useAddressLogic from '@/hooks/useAddressLogic';
import {
    checkTimeSlotAvailability,
    checkDateAvailability,
    checkMonthlyAvailability
} from '@/utils/scheduleValidation';
import { getLocalDateString } from '@/utils/scheduleUtils';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

// Enhanced TypedDropdown component for address selection
function TypedDropdown({
    placeholder,
    options,
    selectedItem,
    onChange,
    disabled = false,
    isLoading = false,
    error = null,
    filterFunction = null,
    onInputChange = null,
    showSuggestions = true,
    maxSuggestions = 8
}) {
    const [inputText, setInputText] = useState(selectedItem?.name || '');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        setInputText(selectedItem?.name || '');
    }, [selectedItem]);

    useEffect(() => {
        if (filterFunction && typeof filterFunction === 'function') {
            const filtered = filterFunction(inputText);
            setFilteredOptions(filtered.slice(0, maxSuggestions));
        } else {
            const filtered = options.filter((o) =>
                o.name.toLowerCase().includes(inputText.toLowerCase())
            );
            setFilteredOptions(filtered.slice(0, maxSuggestions));
        }
    }, [options, inputText, filterFunction, maxSuggestions]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputText(value);

        if (!disabled) {
            setShowDropdown(true);
            if (onInputChange) {
                onInputChange(value);
            }
            if (selectedItem && value !== selectedItem.name) {
                onChange(null);
            }
        }
    };

    const handleSelect = (item) => {
        setInputText(item.name);
        onChange(item);
        setShowDropdown(false);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        onChange(null);
        setInputText('');
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        switch (e.key) {
            case 'Escape':
                setShowDropdown(false);
                inputRef.current?.blur();
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions.length > 0 && showDropdown) {
                    handleSelect(filteredOptions[0]);
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!showDropdown) {
                    setShowDropdown(true);
                }
                break;
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                className={`flex border rounded-md px-3 py-2 transition-colors ${disabled
                    ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                    : error
                        ? 'bg-white border-red-500 focus-within:ring-2 focus-within:ring-blue-500'
                        : 'bg-white border-gray-300 focus-within:ring-2 focus-within:ring-blue-500'
                    }`}
            >
                <input
                    ref={inputRef}
                    className="outline-none flex-grow placeholder-gray-400 text-md bg-transparent"
                    placeholder={disabled ? 'Please select previous field first' : placeholder}
                    value={inputText}
                    disabled={disabled}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />

                {isLoading && (
                    <div className="ml-2 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {selectedItem && !disabled && !isLoading && (
                    <button
                        type="button"
                        className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={handleClear}
                        title="Clear selection"
                    >
                        ×
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}

            {showDropdown && !disabled && showSuggestions && (
                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 shadow-lg rounded-md">
                    {isLoading ? (
                        <div className="px-3 py-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            Loading...
                        </div>
                    ) : filteredOptions.length > 0 ? (
                        <>
                            {filteredOptions.map((option, index) => (
                                <div
                                    key={option.code}
                                    className={`px-3 py-2 cursor-pointer transition-colors hover:bg-gray-100 ${index === 0 ? 'bg-gray-50' : ''
                                        }`}
                                    onClick={() => handleSelect(option)}
                                >
                                    <div className="font-medium">{option.name}</div>
                                    {option.relevance && (
                                        <div className="text-xs text-gray-500">
                                            {option.relevance === 3 ? 'Exact match' :
                                                option.relevance === 2 ? 'Contains all letters' :
                                                    'Partial match'}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {inputText && filteredOptions.length < options.length && (
                                <div className="px-3 py-2 text-xs text-gray-500 border-t">
                                    Showing top {filteredOptions.length} results. Type more to refine search.
                                </div>
                            )}
                        </>
                    ) : inputText ? (
                        <div className="px-3 py-4 text-center text-gray-500">
                            <div className="mb-2">No results found for "{inputText}"</div>
                            <div className="text-xs">Try typing a different name or check spelling</div>
                        </div>
                    ) : (
                        <div className="px-3 py-4 text-center text-gray-500">
                            Start typing to search...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

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
        additionalNotes: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});
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

    // Check if form has unsaved changes
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData) ||
        selectedProvince || selectedCity || selectedBarangay;

    // Use the prompt hook to warn about unsaved changes
    const { PromptModal } = usePrompt(
        "You have unsaved changes. Are you sure you want to leave?",
        isDirty,
        "light"
    );

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

    const validateField = useCallback((fieldName, value, currentProvince = null, currentCity = null, currentBarangay = null) => {
        setFormErrors((prev) => {
            const errors = { ...prev };

            switch (fieldName) {
                case 'firstName':
                case 'lastName':
                    if (!value.trim()) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                case 'email':
                    if (!value.trim()) {
                        errors[fieldName] = true;
                    } else if (!emailRegex.test(value)) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                case 'phone':
                    if (value && !phoneRegex.test(value)) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                case 'province':
                    if (!currentProvince && !selectedProvince) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                case 'city':
                    if (!currentCity && !selectedCity) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                case 'barangay':
                    if (!currentBarangay && !selectedBarangay) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                case 'purpose':
                    if (!value) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                case 'populationCount':
                    if (!value || isNaN(value) || parseInt(value) <= 0) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                case 'selectedTime':
                    if (!value) {
                        errors[fieldName] = true;
                    } else {
                        delete errors[fieldName];
                    }
                    break;
                default:
                    break;
            }

            return errors;
        });
    }, [emailRegex, phoneRegex, selectedProvince, selectedCity, selectedBarangay]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        validateField(field, value);
    };

    const validatePage = (page) => {
        let isValid = true;
        const errors = {};

        if (page === 1) {
            // Validate Page 1 fields - mandatory fields
            if (!formData.firstName.trim()) {
                errors.firstName = true;
                isValid = false;
            }
            if (!formData.lastName.trim()) {
                errors.lastName = true;
                isValid = false;
            }
            // Email is now mandatory
            if (!formData.email.trim()) {
                errors.email = true;
                isValid = false;
            } else if (!emailRegex.test(formData.email)) {
                errors.email = true;
                isValid = false;
            }
            // Province, City, Barangay are now mandatory
            if (!selectedProvince) {
                errors.province = true;
                isValid = false;
            }
            if (!selectedCity) {
                errors.city = true;
                isValid = false;
            }
            if (!selectedBarangay) {
                errors.barangay = true;
                isValid = false;
            }
            // Phone validation (optional)
            if (formData.phone && !phoneRegex.test(formData.phone)) {
                errors.phone = true;
                isValid = false;
            }
            if (!formData.purpose) {
                errors.purpose = true;
                isValid = false;
            }
            if (!formData.populationCount || isNaN(formData.populationCount) || parseInt(formData.populationCount) <= 0) {
                errors.populationCount = true;
                isValid = false;
            }
        } else if (page === 2) {
            // Validate Page 2 fields - Time slot is only required for School Field Trip
            if (formData.purpose === 'School Field Trip' && !formData.selectedTime) {
                errors.selectedTime = true;
                isValid = false;
            }
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleNext = () => {
        if (validatePage(1)) {
            setCurrentPage(2);
        } else {
            showToast('Please fill in all required fields correctly', 'error');
        }
    };

    const handlePrevious = () => {
        setCurrentPage(1);
    };

    const handleSubmit = () => {
        if (!validatePage(2)) {
            showToast('Please fill in all required fields correctly', 'error');
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);

        showToast('Submitting walk-in appointment...', 'info');

        // Time conversion logic (same as Appointment.jsx)
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

        // Payload structure matching Appointment.jsx exactly
        const payload = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            organization: formData.organization,
            province: selectedProvince?.name || '',
            barangay: selectedBarangay?.name || '',
            city_municipality: selectedCity?.name || '',
            street: formData.street,
            purpose_of_visit: formData.purpose,
            population_count: formData.populationCount,
            preferred_date: formData.visitDate,
            preferred_time: formData.selectedTime,
            start_time: startTimeValue,
            end_time: endTimeValue,
            additional_notes: formData.additionalNotes,
            // Walk-in specific flags
            is_walk_in: true,
            status: 'confirmed' // Walk-ins are automatically confirmed
        };

        try {
            const response = await axiosClient.post('/auth/appointment', payload);

            if (response.status === 201) {
                showToast('Walk-in appointment submitted successfully! Visitor has been registered.', 'success');

                // Reset form
                setFormData(initialFormData);
                setFormErrors({});
                setCurrentPage(1);

                // Reset address selections
                setSelectedProvince(null);
                setSelectedCity(null);
                setSelectedBarangay(null);

                // Reset selected date to current date
                setSelectedDate(new Date());

                // Stay on the same page (page 1) for next walk-in entry
                // No navigation - just reset to page 1 for continuous walk-in processing
            }
        } catch (error) {
            console.error('Request failed:', error);

            // Error handling matching Appointment.jsx
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Unknown error occurred';

                if (status === 400) {
                    showToast(`Validation Error: ${message}`, 'error');
                } else if (status === 409) {
                    showToast('Time slot conflict: Please select a different time', 'error');
                } else if (status === 500) {
                    showToast('Server error: Please try again later', 'error');
                } else {
                    showToast(`Error ${status}: ${message}`, 'error');
                }
            } else if (error.request) {
                showToast('Network error: Please check your connection and try again', 'error');
            } else {
                showToast('Failed to submit walk-in appointment. Please try again.', 'error');
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
            setFormData(prev => ({ ...prev, visitDate: dateString }));
        }
    }, [selectedDate, currentPage]);

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
    };

    const handleTimeSelect = (time) => {
        handleInputChange('selectedTime', time);
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
        <div className="w-full max-w-7xl mx-auto p-8">
            {/* About the Visitor Section */}
            <div className="mb-12">
                <div className="grid grid-cols-12 gap-8 mb-6">
                    {/* Left side - Title */}
                    <div className="col-span-3">
                        <h2 className="text-2xl font-semibold text-gray-900">About the Visitor</h2>
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
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className={`w-full px-3 py-2 border ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {formErrors.firstName && (
                                    <p className="mt-1 text-sm text-red-600">First name is required</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className={`w-full px-3 py-2 border ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {formErrors.lastName && (
                                    <p className="mt-1 text-sm text-red-600">Last name is required</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {formErrors.email && (
                                    <p className="mt-1 text-sm text-red-600">Please enter a valid email</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className={`w-full px-3 py-2 border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {formErrors.phone && (
                                    <p className="mt-1 text-sm text-red-600">Please enter a valid phone number</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Province <span className="text-red-500">*</span>
                                </label>
                                <TypedDropdown
                                    placeholder="Type to search..."
                                    options={provinces}
                                    selectedItem={selectedProvince}
                                    onChange={(item) => {
                                        setSelectedProvince(item);
                                        validateField('province', item, item, null, null);
                                    }}
                                    isLoading={isLoadingProvinces}
                                    error={formErrors.province ? 'Please select a province' : null}
                                    filterFunction={getFilteredProvinces}
                                    maxSuggestions={10}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <TypedDropdown
                                    placeholder={selectedProvince ? "Type to search..." : "Select province first"}
                                    options={cities}
                                    selectedItem={selectedCity}
                                    onChange={(item) => {
                                        setSelectedCity(item);
                                        validateField('city', item, null, item, null);
                                    }}
                                    disabled={!selectedProvince}
                                    isLoading={isLoadingCities}
                                    error={formErrors.city ? 'Please select a city' : null}
                                    filterFunction={getFilteredCities}
                                    maxSuggestions={10}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Barangay <span className="text-red-500">*</span>
                                </label>
                                <TypedDropdown
                                    placeholder={selectedCity ? "Type to search..." : "Select city first"}
                                    options={barangays}
                                    selectedItem={selectedBarangay}
                                    onChange={(item) => {
                                        setSelectedBarangay(item);
                                        validateField('barangay', item, null, null, item);
                                    }}
                                    disabled={!selectedCity}
                                    isLoading={isLoadingBarangays}
                                    error={formErrors.barangay ? 'Please select a barangay' : null}
                                    filterFunction={getFilteredBarangays}
                                    maxSuggestions={12}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Street
                                </label>
                                <input
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) => handleInputChange('street', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Organization
                            </label>
                            <input
                                type="text"
                                value={formData.organization}
                                onChange={(e) => handleInputChange('organization', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* About Visit Section */}
            <div className="mb-8">
                <div className="grid grid-cols-12 gap-8">
                    {/* Left side - Title */}
                    <div className="col-span-3">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">About Visit</h2>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Purpose Visits <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.purpose}
                                onChange={(e) => handleInputChange('purpose', e.target.value)}
                                className={`w-full px-3 py-2 border ${formErrors.purpose ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white`}
                            >
                                <option value="">Choose Purpose</option>
                                <option value="Research Paper">Research Paper</option>
                                <option value="School Field Trip">School Field Trip</option>
                                <option value="Museum Group Tour">Museum Group Tour</option>
                                <option value="Interviews">Interviews</option>
                                <option value="Collaboration Meetings">Collaboration Meetings</option>
                                <option value="Photography or Media Projects">Photography or Media Projects</option>
                                <option value="Conservation Consultation">Conservation Consultation</option>
                            </select>
                            {formErrors.purpose && (
                                <p className="mt-1 text-sm text-red-600">Please select a purpose</p>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Population Count <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.populationCount}
                                onChange={(e) => handleInputChange('populationCount', e.target.value)}
                                className={`w-full px-3 py-2 border ${formErrors.populationCount ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                min="1"
                            />
                            {formErrors.populationCount && (
                                <p className="mt-1 text-sm text-red-600">Please enter a valid number of visitors</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Page 2 Component
    const renderPage2 = () => (
        <div className="w-full max-w-7xl mx-auto p-8">
            {/* Date and Time of the Visit Section */}
            <div className="mb-12">
                <div className="grid grid-cols-12 gap-8">
                    {/* Left side - Title */}
                    <div className="col-span-3">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Date and Time of the Visit</h2>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Select preferred date <span className="text-red-500">*</span>
                                </label>
                                <div className="rounded-xl bg-black p-3 shadow-xl">
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
                                        className="p-2 rounded-lg mx-auto text-lg"
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

                            {/* Right side - Time slots */}
                            {formData.purpose === 'School Field Trip' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Select preferred time <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
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
                                                        className={`w-full px-4 py-3 border-2 rounded-lg text-left transition-colors relative
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
                                                            <span className="text-xs text-gray-500 block">
                                                                {slotOverlapCount}/5 slots used
                                                            </span>
                                                        )}
                                                        {isUnavailable && (
                                                            <span className="absolute inset-0 flex items-center justify-center text-red-600">
                                                                <i className="fa-solid fa-times text-xl"></i>
                                                            </span>
                                                        )}
                                                    </button>

                                                    {isUnavailable && (
                                                        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
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
                                    {formErrors.selectedTime && (
                                        <p className="mt-2 text-sm text-red-600">Please select a time slot</p>
                                    )}
                                    {isLoadingTimeSlots && (
                                        <p className="mt-2 text-sm text-gray-500">Checking time slot availability...</p>
                                    )}
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
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">About Visit</h2>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Note
                            </label>
                            <textarea
                                rows="6"
                                value={formData.additionalNotes}
                                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {PromptModal}
            {/* Main Container */}
            <div className="w-full h-full bg-white">
                {/* Header */}
                <div className="border-b border-gray-300 p-6">
                    <h1 className="text-3xl font-bold text-gray-900">New Walk-in Appointment</h1>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {currentPage === 1 ? renderPage1() : renderPage2()}
                </div>

                {/* Footer with buttons */}
                <div className="border-t border-gray-200 p-6">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div>
                            {currentPage === 1 ? (
                                <button
                                    onClick={() => {
                                        navigate('/admin/appointment');
                                    }}
                                    className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                                >
                                    Return
                                </button>
                            ) : (
                                <button
                                    onClick={handlePrevious}
                                    className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                                >
                                    PREV
                                </button>
                            )}
                        </div>

                        <div>
                            {currentPage === 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                                >
                                    NEXT
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                        <p>Are you sure you want to register this walk-in visitor?</p>
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                            <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                            <p><strong>Email:</strong> {formData.email}</p>
                            <p><strong>Purpose:</strong> {formData.purpose}</p>
                            <p><strong>Date:</strong> {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Not selected'}</p>
                            <p><strong>Time:</strong> {formData.selectedTime || 'Not selected'}</p>
                            <p><strong>Population:</strong> {formData.populationCount} visitor(s)</p>
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
