import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '../../lib/axiosClient';
import useAddressLogic from '../../hooks/useAddressLogic';
import TimelineDatePicker from '../../features/TimelineDatePicker';
import StyledButton from '../../components/buttons/StyledButton';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import PopupModal from '../../components/modals/PopupModal';
import Toast from '../../features/Toast';
import { format } from 'date-fns';

// Enhanced TypedDropdown component for address selection with improved search
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

  // Update input text when selected item changes
  useEffect(() => {
    setInputText(selectedItem?.name || '');
  }, [selectedItem]);

  // Update filtered options when options or input text changes
  useEffect(() => {
    if (filterFunction && typeof filterFunction === 'function') {
      const filtered = filterFunction(inputText);
      setFilteredOptions(filtered.slice(0, maxSuggestions));
    } else {
      // Fallback to basic filtering
      const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(inputText.toLowerCase())
      );
      setFilteredOptions(filtered.slice(0, maxSuggestions));
    }
  }, [options, inputText, filterFunction, maxSuggestions]);

  // Handle click outside to close dropdown
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

      // Call external input change handler if provided
      if (onInputChange) {
        onInputChange(value);
      }

      // Clear selection if input doesn't match selected item
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
        className={`flex border rounded-lg px-4 py-3 transition-colors ${disabled
          ? 'bg-gray-100 cursor-not-allowed border-gray-300'
          : error
            ? 'bg-white border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500'
            : 'bg-white border-gray-300 focus-within:border-[#524433] focus-within:ring-1 focus-within:ring-[#524433]'
          }`}
      >
        <input
          ref={inputRef}
          className="outline-none flex-grow placeholder-gray-400 text-base bg-transparent"
          placeholder={disabled ? 'Please select previous field first' : placeholder}
          value={inputText}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => !disabled && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="ml-2 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#524433]"></div>
          </div>
        )}

        {/* Clear button */}
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

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {showDropdown && !disabled && showSuggestions && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 shadow-lg rounded-md">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#524433] mx-auto mb-2"></div>
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

// Step Components - Moved outside to prevent recreation on each render
function MuseumInfoStep() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center mb-8">Appointment Form</h2>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4 flex flex-col items-center text-center mx-auto max-w-md">
        <div className="flex items-center gap-x-3 justify-center">
          <i className="text-4xl fa-solid fa-clock text-[#524433]"></i>
          <div>
            <h3 className="font-bold text-xl">Museo Bulawan</h3>
            <p className="text-gray-600">Open Daily 9:00am-5:00pm, Monday-Friday</p>
          </div>
        </div>

        <div className="flex items-center gap-x-3 justify-center">
          <i className="text-4xl fa-solid fa-location-dot text-[#524433]"></i>
          <div>
            <h3 className="font-bold text-xl">Museum Location</h3>
            <p className="text-gray-600">Camarines Norte Provincial Capitol Grounds, Daet Philippines</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          Please fill out all required fields in the following steps to complete your appointment request.
        </p>
      </div>
    </div>
  );
}

function PersonalInfoStep({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Tell Us About Yourself</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name {!formData.firstName && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            style={{ textTransform: 'capitalize' }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name {!formData.lastName && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            style={{ textTransform: 'capitalize' }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email {!formData.email && <span className="text-red-500">*</span>}
          </label>
          <input
            type="email"
            placeholder="example@gmail.com"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            placeholder="+639123456789"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            pattern="^(09|\+639)\d{9}$"
            title="Please enter a valid PH phone number starting with 09 or +639"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent"
          />
        </div>

        {/* Organization */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization
          </label>
          <input
            type="text"
            placeholder="School/Institution/etc"
            value={formData.organization}
            onChange={(e) => updateFormData('organization', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function AddressInfoStep({
  provinces,
  cities,
  barangays,
  selectedProvince,
  setSelectedProvince,
  selectedCity,
  setSelectedCity,
  selectedBarangay,
  setSelectedBarangay,
  formData,
  updateFormData,
  // Enhanced address logic props
  getFilteredProvinces,
  getFilteredCities,
  getFilteredBarangays,
  isLoadingProvinces,
  isLoadingCities,
  isLoadingBarangays,
  provincesError,
  citiesError,
  barangaysError
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Address Information</h2>

      {/* Helper text */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-sm text-blue-700">
          <i className="fa-solid fa-info-circle mr-2"></i>
          Start typing to search for your location. The system will show relevant matches as you type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Province */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Province {!selectedProvince && <span className="text-red-500">*</span>}
          </label>
          <TypedDropdown
            placeholder="Type to search provinces..."
            options={provinces}
            selectedItem={selectedProvince}
            onChange={setSelectedProvince}
            isLoading={isLoadingProvinces}
            error={provincesError}
            filterFunction={getFilteredProvinces}
            maxSuggestions={10}
          />
          {selectedProvince && (
            <p className="mt-1 text-sm text-green-600">
              <i className="fa-solid fa-check-circle mr-1"></i>
              Selected: {selectedProvince.name}
            </p>
          )}
        </div>

        {/* City/Municipality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City/Municipality {!selectedCity && <span className="text-red-500">*</span>}
          </label>
          <TypedDropdown
            placeholder={selectedProvince ? "Type to search cities..." : "Select province first"}
            options={cities}
            selectedItem={selectedCity}
            onChange={setSelectedCity}
            disabled={!selectedProvince}
            isLoading={isLoadingCities}
            error={citiesError}
            filterFunction={getFilteredCities}
            maxSuggestions={10}
          />
          {selectedCity && (
            <p className="mt-1 text-sm text-green-600">
              <i className="fa-solid fa-check-circle mr-1"></i>
              Selected: {selectedCity.name}
            </p>
          )}
        </div>

        {/* Barangay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barangay {!selectedBarangay && <span className="text-red-500">*</span>}
          </label>
          <TypedDropdown
            placeholder={selectedCity ? "Type to search barangays..." : "Select city first"}
            options={barangays}
            selectedItem={selectedBarangay}
            onChange={setSelectedBarangay}
            disabled={!selectedCity}
            isLoading={isLoadingBarangays}
            error={barangaysError}
            filterFunction={getFilteredBarangays}
            maxSuggestions={12}
          />
          {selectedBarangay && (
            <p className="mt-1 text-sm text-green-600">
              <i className="fa-solid fa-check-circle mr-1"></i>
              Selected: {selectedBarangay.name}
            </p>
          )}
        </div>

        {/* Street */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address
          </label>
          <input
            type="text"
            placeholder="House number, street name, subdivision, etc."
            value={formData.street}
            onChange={(e) => updateFormData('street', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Provide specific street address for more accurate location
          </p>
        </div>
      </div>

      {/* Address Summary */}
      {(selectedProvince || selectedCity || selectedBarangay || formData.street) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-gray-700 mb-2">Address Summary:</h4>
          <p className="text-sm text-gray-600">
            {[
              formData.street,
              selectedBarangay?.name,
              selectedCity?.name,
              selectedProvince?.name
            ].filter(Boolean).join(', ') || 'No address selected yet'}
          </p>
        </div>
      )}
    </div>
  );
}

function VisitDetailsStep({ formData, updateFormData, showPurposeInfo, setShowPurposeInfo }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Visit Details</h2>
        <button
          onClick={() => setShowPurposeInfo(!showPurposeInfo)}
          className="w-10 h-10 flex items-center justify-center border-2 border-gray-400 rounded-full text-xl font-bold hover:bg-gray-100"
          title="View purpose details"
        >
          ?
        </button>
      </div>

      {/* Purpose Info Modal */}
      <PopupModal
        isOpen={showPurposeInfo}
        onClose={() => setShowPurposeInfo(false)}
        title="Purpose Information"
        message={
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Document Access Request</h4>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Research Paper:</strong> Accessing archives or materials for academic research</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Engagements</h4>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>School Field Trip:</strong> Educational visits for students</li>
                <li><strong>Museum Group Tour:</strong> Guided tours for visitor groups</li>
                <li><strong>Interviews:</strong> Meeting museum staff</li>
                <li><strong>Collaboration Meetings:</strong> Joint projects</li>
                <li><strong>Photography / Media Projects:</strong> Shoots or filming</li>
                <li><strong>Conservation Consultation:</strong> Advice/services</li>
              </ul>
            </div>
          </div>
        }
        buttonText="Close"
        type="info"
        theme="light"
      />

      <div className="space-y-6">
        {/* Purpose of Visit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose of Visit {!formData.purpose && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formData.purpose}
            onChange={(e) => updateFormData('purpose', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent"
            required
          >
            <option value="">Choose Purpose</option>
            <optgroup label="Document Access Request">
              <option>Research Paper</option>
            </optgroup>
            <optgroup label="Engagements">
              <option>School Field Trip</option>
              <option>Museum Group Tour</option>
              <option>Interviews</option>
              <option>Collaboration Meetings</option>
              <option>Photography or Media Projects</option>
              <option>Conservation Consultation</option>
            </optgroup>
          </select>
        </div>

        {/* Population Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Population Count {!formData.populationCount && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            min="1"
            value={formData.populationCount}
            onChange={(e) => updateFormData('populationCount', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent"
            placeholder="Number of visitors"
            required
          />
        </div>
      </div>
    </div>
  );
}

function ScheduleNotesStep({
  formData,
  updateFormData,
  shouldShowTimeOptions,
  isTimeRequired,
  timeSlotExclusive,
  confirmedSlots,
  isLoadingTimeSlots
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Schedule & Additional Information</h2>

      {/* Preferred Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Date {!formData.selectedDate && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-4">
          <TimelineDatePicker
            onDateChange={(dateStr) => {
              const date = dateStr ? new Date(dateStr) : null;
              updateFormData('selectedDate', date);
            }}
            defaultValue={formData.selectedDate ? format(formData.selectedDate, 'yyyy-MM-dd') : ''}
            theme="light"
          />
          {formData.selectedDate && (
            <span className="text-gray-600">
              {format(formData.selectedDate, 'MMMM d, yyyy')}
            </span>
          )}
        </div>
      </div>

      {/* Time Selection */}
      {shouldShowTimeOptions(formData.purpose) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select your preferred Time
            {isTimeRequired(formData.purpose) && <span className="text-red-500"> *</span>}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['09:00-10:29', '10:30-11:59', '01:00-02:29', '02:30-04:00'].map((time) => {
              const isExclusive = timeSlotExclusive[time];
              const hasConfirmedAppointment = confirmedSlots[time];
              const isUnavailable = isExclusive || hasConfirmedAppointment;

              // Additional logic: cross out if fully booked (exclusive or max confirmed)
              const crossOut = isUnavailable;

              return (
                <div key={time} className="relative group">
                  <label
                    className={`cursor-pointer border-2 border-gray-300 px-4 py-2 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors
                      ${formData.selectedTime === time ? 'bg-[#cfdac8] border-[#524433]' : ''} 
                      ${crossOut ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                  >
                    <input
                      type="radio"
                      name="preferredTime"
                      value={time}
                      required={isTimeRequired(formData.purpose)}
                      className="hidden"
                      onChange={() => !crossOut && updateFormData('selectedTime', time)}
                      disabled={crossOut}
                    />
                    <span className="text-sm font-medium">{time}</span>
                    {crossOut && (
                      <span className="absolute inset-0 flex items-center justify-center text-red-600">
                        <i className="fa-solid fa-times text-xl"></i>
                      </span>
                    )}
                  </label>

                  {crossOut && (
                    <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      {isExclusive ? 'This time slot has an exclusive schedule' : 'This time slot already has a confirmed appointment'}
                    </div>
                  )}
                </div>
              );
            })}

          </div>
          {isLoadingTimeSlots && (
            <p className="text-sm text-gray-500 mt-2">Checking availability...</p>
          )}
        </div>
      )}

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          rows="4"
          placeholder="Any extra info or requests"
          value={formData.additionalNotes}
          onChange={(e) => updateFormData('additionalNotes', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#524433] focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}

const Appointment = () => {
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(0);
  const [showPurposeInfo, setShowPurposeInfo] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Toast state management
  const [toast, setToast] = useState({
    type: 'info',
    message: ''
  });
  const toastTimerRef = useRef(null);

  // Enhanced address logic hook
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
    // Enhanced filtering functions
    getFilteredProvinces,
    getFilteredCities,
    getFilteredBarangays,
    // Loading states
    isLoadingProvinces,
    isLoadingCities,
    isLoadingBarangays,
    // Error states
    provincesError,
    citiesError,
    barangaysError
  } = useAddressLogic();

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    street: '',

    // Visit Details
    purpose: '',
    populationCount: '',
    selectedDate: null,
    selectedTime: '',
    additionalNotes: ''
  });

  // Time slot availability state
  const [timeSlotCounts, setTimeSlotCounts] = useState({});
  const [timeSlotExclusive, setTimeSlotExclusive] = useState({});
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [confirmedSlots, setConfirmedSlots] = useState({});

  // Steps configuration
  const steps = [
    { id: 0, title: 'Museum Information' },
    { id: 1, title: 'Personal Information' },
    { id: 2, title: 'Address Information' },
    { id: 3, title: 'Visit Details' },
    { id: 4, title: 'Schedule & Notes' }
  ];

  // Navigation functions
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      showToast(`Step ${currentStep + 2} of ${steps.length}`, 'info', 2000);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      showToast(`Step ${currentStep} of ${steps.length}`, 'info', 2000);
    }
  };

  // Validation for each step
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return true; // Museum info step, no validation needed
      case 1:
        return formData.firstName && formData.lastName && formData.email;
      case 2:
        return selectedProvince && selectedCity && selectedBarangay;
      case 3:
        return formData.purpose && formData.populationCount;
      case 4:
        return formData.selectedDate && (
          !isTimeRequired(formData.purpose) || formData.selectedTime
        );
      default:
        return true;
    }
  };

  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Toast management functions
  const showToast = useCallback((message, type = 'info') => {
    setToast({
      type,
      message
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, message: '' }));
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Helper functions
  const isTimeRequired = (purp) =>
    purp === 'School Field Trip' || purp === 'Workshops or Classes';

  const shouldShowTimeOptions = (purp) =>
    purp === 'School Field Trip' ||
    purp === 'Workshops or Classes' ||
    purp === 'Others';

  // Time slot availability checking
  const checkTimeSlotAvailability = async (date) => {
    if (!date) return;

    setIsLoadingTimeSlots(true);
    showToast('Checking time slot availability...', 'info', 2000);

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

      // Fetch appointments and schedules
      const [appointmentResponse, scheduleResponse] = await Promise.all([
        axiosClient.get('/auth/appointment'),
        axiosClient.get(`/auth/schedules/public/availability?date=${formattedDate}`)
      ]);

      // Process appointments
      const todayAppointments = appointmentResponse.data.filter(appointment => {
        const appointmentDate = appointment.preferred_date.split('T')[0];
        return appointmentDate === formattedDate;
      });

      todayAppointments.forEach(appointment => {
        const status = (appointment.AppointmentStatus?.status || '').toUpperCase();
        if (status === 'CONFIRMED' && appointment.start_time && appointment.end_time) {
          let startTime = appointment.start_time.substring(0, 5);
          let endTime = appointment.end_time.substring(0, 5);

          // Convert to UI format if needed
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

      // Process schedules
      if (scheduleResponse.data && Array.isArray(scheduleResponse.data)) {
        scheduleResponse.data.filter(schedule => schedule.status !== 'COMPLETED').forEach(schedule => {
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

      // Show availability summary
      const availableSlots = timeSlots.filter(slot => !exclusive[slot] && !confirmed[slot]);
      if (availableSlots.length === 0) {
        showToast('No time slots available for this date', 'warning', 4000);
      } else {
        showToast(`${availableSlots.length} time slots available`, 'success', 3000);
      }

    } catch (error) {
      console.error('Error checking time slot availability:', error);
      showToast('Failed to check time slot availability', 'error', 4000);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

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

  useEffect(() => {
    if (formData.selectedDate) {
      checkTimeSlotAvailability(formData.selectedDate);
    }
  }, [formData.selectedDate]);

  // Submit handler
  const handleSubmit = async () => {
    setShowConfirmationModal(false);
    showToast('Submitting appointment...', 'info', 2000);

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
      province: selectedProvince?.name || '',
      barangay: selectedBarangay?.name || '',
      city_municipality: selectedCity?.name || '',
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

    try {
      const response = await axiosClient.post(
        '/auth/appointment',
        payload
      );

      if (response.status === 201) {
        // Show success toast first
        showToast('Appointment submitted successfully! You will receive a confirmation email shortly.', 'success', 5000);

        // Delay form reset to allow toast to be visible
        setTimeout(() => {
          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            organization: '',
            street: '',
            purpose: '',
            populationCount: '',
            selectedDate: null,
            selectedTime: '',
            additionalNotes: ''
          });
          setSelectedProvince(null);
          setSelectedCity(null);
          setSelectedBarangay(null);
          setCurrentStep(0);
        }, 2000); // Wait 2 seconds before resetting
      }
    } catch (error) {
      console.error('Request failed:', error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error occurred';

        if (status === 400) {
          showToast(`Validation Error: ${message}`, 'error', 5000);
        } else if (status === 409) {
          showToast('Time slot conflict: Please select a different time', 'error', 5000);
        } else if (status === 500) {
          showToast('Server error: Please try again later', 'error', 5000);
        } else {
          showToast(`Error ${status}: ${message}`, 'error', 5000);
        }
      } else if (error.request) {
        // Network error
        showToast('Network error: Please check your connection and try again', 'error', 5000);
      } else {
        // Other error
        showToast('Failed to submit appointment. Please try again.', 'error', 5000);
      }
    }
  };


  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <MuseumInfoStep />;
      case 1:
        return (
          <PersonalInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <AddressInfoStep
            provinces={provinces}
            cities={cities}
            barangays={barangays}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            selectedBarangay={selectedBarangay}
            setSelectedBarangay={setSelectedBarangay}
            formData={formData}
            updateFormData={updateFormData}
            // Enhanced address logic props
            getFilteredProvinces={getFilteredProvinces}
            getFilteredCities={getFilteredCities}
            getFilteredBarangays={getFilteredBarangays}
            isLoadingProvinces={isLoadingProvinces}
            isLoadingCities={isLoadingCities}
            isLoadingBarangays={isLoadingBarangays}
            provincesError={provincesError}
            citiesError={citiesError}
            barangaysError={barangaysError}
          />
        );
      case 3:
        return (
          <VisitDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            showPurposeInfo={showPurposeInfo}
            setShowPurposeInfo={setShowPurposeInfo}
          />
        );
      case 4:
        return (
          <ScheduleNotesStep
            formData={formData}
            updateFormData={updateFormData}
            shouldShowTimeOptions={shouldShowTimeOptions}
            isTimeRequired={isTimeRequired}
            timeSlotExclusive={timeSlotExclusive}
            confirmedSlots={confirmedSlots}
            isLoadingTimeSlots={isLoadingTimeSlots}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-screen min-w-fit min-h-screen flex flex-col pt-20 px-4 md:px-20 justify-center">
      <div className="max-w-4xl mx-auto w-full">
        {/* Step content */}
        {renderStepContent()}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <StyledButton
            onClick={handlePrev}
            disabled={currentStep === 0}
            variant="outline"
            size="lg"
          >
            Prev
          </StyledButton>

          {currentStep < steps.length - 1 ? (
            <StyledButton
              onClick={handleNext}
              disabled={!isStepValid()}
              variant="primary"
              size="lg"
            >
              Next
            </StyledButton>
          ) : (
            <StyledButton
              onClick={() => setShowConfirmationModal(true)}
              disabled={!isStepValid()}
              variant="primary"
              size="lg"
            >
              Submit
            </StyledButton>
          )}
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={handleSubmit}
          title="Confirm Submission"
          message="Are you sure you want to submit this appointment?"
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
    </div>
  );
};


export default Appointment;
