import { useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '../../lib/axiosClient';
import useAddressLogic from '../../hooks/useAddressLogic';
import TimelineDatePicker from '../../features/TimelineDatePicker';
import AppointmentDatePicker from '../../components/appointment/AppointmentDatePicker';
import StyledButton from '../../components/buttons/StyledButton';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import PopupModal from '../../components/modals/PopupModal';
import Toast from '../../features/Toast';
import usePrompt from '../../hooks/usePrompt';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  StyledInput,
  LabeledInput,
  StyledSelect,
} from '../../features/Utilities';
import {
  timeStringToMinutes,
  countOverlappingEvents
} from '../../utils/scheduleUtils';
import { useSocketClient } from '../../context/authContext';

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
        className={`flex border rounded-full px-4 py-1 transition-colors ${disabled
          ? 'bg-gray-100 cursor-not-allowed border-gray-300'
          : error
            ? 'bg-white border-red-500 focus-within:ring-2 focus-within:ring-gray-300'
            : 'bg-white border-black focus-within:ring-2 focus-within:ring-gray-300'
          }`}
        style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}
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
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#524433]"></div>
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

const Notice = () => {
  return (
    <div className="w-[35rem] h-fit flex flex-col justify-center gap-y-5">
      <span className="text-6xl font-hina font-extralight">NOTICE</span>
      <span className="text-xl font-hind font-medium text-justify">
        &nbsp; &nbsp; &nbsp; &nbsp; Welcome to our online booking system! Scheduling your
        appointment is quick and easy. Simply fill out the form ahead with your
        details and preferred date/time, and we'll confirm your appointment
        shortly. Please ensure all required information is provided for a smooth booking process.
      </span>

      <div className="space-y-4">
        <div className="flex items-start gap-x-3">
          <i className="text-2xl fa-solid fa-clock text-[#524433] mt-1"></i>
          <div>
            <h3 className="font-bold text-lg">Museum Hours</h3>
            <p className="text-gray-600">Open Daily 9:00am-5:00pm, Monday-Friday</p>
          </div>
        </div>

        <div className="flex items-start gap-x-3">
          <i className="text-2xl fa-solid fa-location-dot text-[#524433] mt-1"></i>
          <div>
            <h3 className="font-bold text-lg">Location</h3>
            <p className="text-gray-600">Camarines Norte Provincial Capitol Grounds, Daet Philippines</p>
          </div>
        </div>
      </div>

      <span className="text-2xl font-hina font-light text-right">
        "Welcome to Museo Bulawan"
      </span>
    </div>
  );
};

const PersonalInfo = ({ value, onChange, errors, validateField }) => {
  const handleChange = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  const handleBlur = (field) => () => {
    validateField("personalInfo", field, value[field]);
  };

  return (
    <div className="w-[50rem] h-fit flex flex-col justify-center gap-y-5">
      <div className="w-full h-fit pb-4 border-b">
        <span className="text-5xl font-hina font-extralight">
          Tell us about yourself.
        </span>
      </div>

      {/* First Row: First Name and Last Name */}
      <div className="w-full h-fit flex justify-between gap-x-5">
        <div className="w-[28.5rem] flex flex-col h-fit gap-y-5">
          <LabeledInput
            placeholder="Juan"
            label="First Name"
            value={value.firstName}
            onChange={handleChange("firstName")}
            onBlur={handleBlur("firstName")}
            error={errors.firstName}
            isRequired={true}
          />
        </div>

        <div className="w-[28.5rem] h-fit gap-y-5 flex flex-col">
          <LabeledInput
            placeholder="Dela Cruz"
            label="Last Name"
            value={value.lastName}
            onChange={handleChange("lastName")}
            onBlur={handleBlur("lastName")}
            error={errors.lastName}
            isRequired={true}
          />
        </div>
      </div>

      {/* Second Row: Email and Phone Number */}
      <div className="w-full h-fit flex justify-between gap-x-5">
        <div className="w-[28.5rem] flex flex-col h-fit gap-y-5">
          <LabeledInput
            label="Email"
            placeholder="example@gmail.com"
            value={value.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            error={errors.email}
            isRequired={true}
          />
        </div>

        <div className="w-[28.5rem] h-fit gap-y-5 flex flex-col">
          <LabeledInput
            label="Phone Number"
            placeholder="+639123456789"
            value={value.phone}
            onChange={handleChange("phone")}
            onBlur={handleBlur("phone")}
            error={errors.phone}
            isRequired={false}
          />
        </div>
      </div>

      {/* Third Row: Organization */}
      <LabeledInput
        label="Organization"
        placeholder="School/Institution/etc"
        value={value.organization}
        onChange={handleChange("organization")}
        onBlur={handleBlur("organization")}
        error={errors.organization}
        width="w-[41.25rem]"
        isRequired={false}
      />
    </div>
  );
};

const AddressInfo = ({
  value,
  onChange,
  errors,
  validateField,
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
}) => {
  const handleChange = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  const handleBlur = (field) => () => {
    validateField("addressInfo", field, value[field]);
  };

  return (
    <div className="w-[50rem] h-fit flex flex-col justify-center gap-y-5">
      <div className="w-full h-fit pb-4 border-b">
        <span className="text-5xl font-hina font-extralight">
          Address Information.
        </span>
      </div>

      <div className="w-full h-fit flex justify-between gap-x-5">
        <div className="w-[28.5rem] flex flex-col h-fit gap-y-5">
          <div className="flex w-full items-center justify-between">
            <span className="text-md font-medium">
              Province<span className="text-red-500 ml-1">*</span>
            </span>
            <div className="w-60">
              <TypedDropdown
                placeholder="Type to search..."
                options={provinces}
                selectedItem={selectedProvince}
                onChange={setSelectedProvince}
                isLoading={isLoadingProvinces}
                error={errors.province}
                filterFunction={getFilteredProvinces}
                maxSuggestions={10}
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <span className="text-md font-medium">
              Barangay<span className="text-red-500 ml-1">*</span>
            </span>
            <div className="w-60">
              <TypedDropdown
                placeholder={selectedCity ? "Type to search..." : "Select city first"}
                options={barangays}
                selectedItem={selectedBarangay}
                onChange={setSelectedBarangay}
                disabled={!selectedCity}
                isLoading={isLoadingBarangays}
                error={errors.barangay}
                filterFunction={getFilteredBarangays}
                maxSuggestions={12}
              />
            </div>
          </div>
        </div>

        <div className="w-[28.5rem] h-fit gap-y-5 flex flex-col">
          <div className="flex w-full items-center justify-between">
            <span className="text-md font-medium">
              City/Municipality<span className="text-red-500 ml-1">*</span>
            </span>
            <div className="w-60">
              <TypedDropdown
                placeholder={selectedProvince ? "Type to search..." : "Select province first"}
                options={cities}
                selectedItem={selectedCity}
                onChange={setSelectedCity}
                disabled={!selectedProvince}
                isLoading={isLoadingCities}
                error={errors.city}
                filterFunction={getFilteredCities}
                maxSuggestions={10}
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <span className="text-md font-medium">
              Street
            </span>
            <div className="w-60">
              <StyledInput
                placeholder="House number, street name, etc."
                value={value.street}
                onChange={handleChange("street")}
                onBlur={handleBlur("street")}
                error={errors.street}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VisitDetails = ({ value, onChange, errors, validateField, showPurposeInfo, setShowPurposeInfo }) => {
  const handleChange = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  const handleBlur = (field) => () => {
    validateField("visitDetails", field, value[field]);
  };

  return (
    <div className="w-[50rem] h-fit flex flex-col justify-center gap-y-3">
      <div className="w-full h-fit pb-4 border-b flex justify-between">
        <span className="text-5xl font-hina font-extralight">
          Visit Details.
        </span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="cursor-pointer"
          onClick={() => setShowPurposeInfo(!showPurposeInfo)}
        >
          <path d="M12 9h.01" />
          <path d="M11 12h1v4h1" />
          <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
        </svg>
      </div>

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

      <div className="flex flex-col w-full gap-y-3 items-end justify-between">
        <div className="w-full">
          <span className="text-md font-medium">
            Purpose of Visit<span className="text-red-500 ml-1">*</span>
          </span>
        </div>
        <div className="w-180">
          <StyledSelect
            value={value.purpose}
            onChange={(selectedValue) => {
              onChange({ ...value, purpose: selectedValue });
              validateField("visitDetails", "purpose", selectedValue);
            }}
            onBlur={() => validateField("visitDetails", "purpose", value.purpose)}
            error={errors.purpose}
            placeholder="Choose Purpose"
            options={[
              { label: "-- Document Access Request --", value: "", disabled: true },
              { label: "Research Paper", value: "Research Paper" },
              { label: "-- Engagements --", value: "", disabled: true },
              { label: "School Field Trip", value: "School Field Trip" },
              { label: "Museum Group Tour", value: "Museum Group Tour" },
              { label: "Interviews", value: "Interviews" },
              { label: "Collaboration Meetings", value: "Collaboration Meetings" },
              { label: "Photography or Media Projects", value: "Photography or Media Projects" },
              { label: "Conservation Consultation", value: "Conservation Consultation" },
            ].filter(opt => !opt.disabled)}
          />
        </div>
      </div>

      <LabeledInput
        width="w-180"
        style="2"
        label="Population Count"
        value={value.populationCount}
        onChange={handleChange("populationCount")}
        onBlur={handleBlur("populationCount")}
        error={errors.populationCount}
        placeholder="Number of visitors"
        isRequired={true}
      />
    </div>
  );
};

const ScheduleNotes = ({
  value,
  onChange,
  errors,
  validateField,
  shouldShowTimeOptions,
  isTimeRequired,
  timeSlotExclusive,
  confirmedSlots,
  isLoadingTimeSlots,
  timeSlotCounts,
  disabledDates,
  isLoadingDateAvailability,
  onAvailabilityRefresh
}) => {
  const handleChange = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  const handleBlur = (field) => () => {
    validateField("scheduleNotes", field, value[field]);
  };

  return (
    <div className="w-[50rem] h-fit flex flex-col justify-center gap-y-3">
      <div className="w-full h-fit pb-4 border-b">
        <span className="text-5xl font-hina font-extralight">
          Schedule & Additional Information.
        </span>
      </div>

      <div className="flex flex-col w-full gap-y-3 items-end justify-between">
        <div className="w-full">
          <span className="text-md font-medium">
            Preferred Date<span className="text-red-500 ml-1">*</span>
          </span>
          {value.selectedDate && (
            <div className="mt-1 text-sm text-gray-600">
              Selected: <span className="font-semibold">{format(value.selectedDate, 'MMMM d, yyyy')}</span>
            </div>
          )}
        </div>
        <div className="w-180">
          <AppointmentDatePicker
            onDateChange={(dateStr) => {
              const date = dateStr ? new Date(dateStr) : null;
              onChange({ ...value, selectedDate: date });
              validateField("scheduleNotes", "selectedDate", date);
            }}
            defaultValue={value.selectedDate ? format(value.selectedDate, 'yyyy-MM-dd') : ''}
            theme="light"
            disabledDates={disabledDates}
            isLoadingAvailability={isLoadingDateAvailability}
            onAvailabilityRefresh={onAvailabilityRefresh}
          />
          {errors.selectedDate && (
            <p className="mt-1 text-sm text-red-600">Please select a date</p>
          )}
        </div>
      </div>

      {shouldShowTimeOptions && (
        <>
          <div className="w-full mt-4">
            <span className="text-md font-medium">
              Select your preferred Time
              {isTimeRequired && <span className="text-red-500 ml-1">*</span>}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {['09:00-10:29', '10:30-11:59', '01:00-02:29', '02:30-04:00'].map((time) => {
              const isExclusive = timeSlotExclusive[time];
              const hasConfirmedAppointment = confirmedSlots[time];
              const slotOverlapCount = timeSlotCounts[time] || 0;
              const isOverLimit = slotOverlapCount >= 5;
              const isUnavailable = isExclusive || hasConfirmedAppointment || isOverLimit;
              const crossOut = isUnavailable;

              return (
                <div key={time} className="relative group">
                  <label
                    className={`cursor-pointer border-2 border-gray-300 px-4 py-2 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors
                      ${value.selectedTime === time ? 'bg-[#f0b001] border-[#f0b001]' : ''} 
                      ${crossOut ? 'opacity-50 cursor-not-allowed line-through' : ''}`}

                  >
                    <input
                      type="radio"
                      name="preferredTime"
                      value={time}
                      required={isTimeRequired}
                      className="hidden"
                      onChange={() => {
                        if (!crossOut) {
                          onChange({ ...value, selectedTime: time });
                          validateField("scheduleNotes", "selectedTime", time);
                        }
                      }}
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
          {isLoadingTimeSlots && (
            <p className="text-sm text-gray-500 mt-2">Checking availability...</p>
          )}
        </>
      )}

      <div className="flex flex-col w-full gap-y-3 items-end justify-between">
        <div className="w-full">
          <span className="text-md font-medium">
            Additional Notes (Optional)
          </span>
        </div>
        <div className="w-180">
          <textarea
            rows="4"
            placeholder="Any extra info or requests"
            value={value.additionalNotes}
            onChange={handleChange("additionalNotes")}
            onBlur={handleBlur("additionalNotes")}
            className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}
          />
          {errors.additionalNotes && (
            <p className="mt-1 text-sm text-red-600">{errors.additionalNotes}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Appointment = () => {
  const [step, setStep] = useState(0);
  const [showPurposeInfo, setShowPurposeInfo] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();

  const socket = useSocketClient();

  const [toast, setToast] = useState({
    type: 'info',
    message: ''
  });

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

  const initialFormData = {
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organization: '',
    },
    addressInfo: {
      street: '',
    },
    visitDetails: {
      purpose: '',
      populationCount: '',
    },
    scheduleNotes: {
      selectedDate: null,
      selectedTime: '',
      additionalNotes: ''
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  const [timeSlotCounts, setTimeSlotCounts] = useState({});
  const [timeSlotExclusive, setTimeSlotExclusive] = useState({});
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [confirmedSlots, setConfirmedSlots] = useState({});

  // New state for date availability
  const [disabledDates, setDisabledDates] = useState([]);
  const [dateAvailability, setDateAvailability] = useState({});
  const [isLoadingDateAvailability, setIsLoadingDateAvailability] = useState(false);
  const [monthlySchedules, setMonthlySchedules] = useState([]);
  const [monthlyAppointments, setMonthlyAppointments] = useState([]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData) ||
    selectedProvince || selectedCity || selectedBarangay;

  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty,
    "light"
  );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(09|\+639)\d{9}$/;

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


  const isTimeRequired = (purp) =>
    purp === 'School Field Trip' || purp === 'Workshops or Classes';

  const shouldShowTimeOptions = (purp) =>
    purp === 'School Field Trip' ||
    purp === 'Workshops or Classes' ||
    purp === 'Others';

  const checkTimeSlotAvailability = async (date) => {
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

      // Process schedules for this date using the same logic as Schedule.jsx
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

  // Function to check if a specific date should be disabled
  const checkDateAvailability = async (date) => {
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

  // Function to check multiple dates and update disabled dates
  const checkMonthlyAvailability = async (year, month) => {
    setIsLoadingDateAvailability(true);
    const unavailableDates = [];

    try {
      // Fetch all appointments once for the month
      const appointmentResponse = await axiosClient.get('/auth/appointment');
      setMonthlyAppointments(appointmentResponse.data);

      // Get first and last day of the month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Check each day of the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, month, day);
        const formattedDate = format(currentDate, 'yyyy-MM-dd');

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
              // Check schedules for this slot using the same logic as checkTimeSlotAvailability
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

  useEffect(() => {
    if (formData.scheduleNotes.selectedDate) {
      checkTimeSlotAvailability(formData.scheduleNotes.selectedDate);
    }
  }, [formData.scheduleNotes.selectedDate]);

  // Check monthly availability when component mounts or when month changes
  useEffect(() => {
    const currentDate = new Date();
    checkMonthlyAvailability(currentDate.getFullYear(), currentDate.getMonth());
  }, []);

  // Create a proper callback function for availability refresh
  const handleAvailabilityRefresh = useCallback(() => {
    // Refresh time slot availability for selected date
    if (formData.scheduleNotes.selectedDate) {
      checkTimeSlotAvailability(formData.scheduleNotes.selectedDate);
    }

    // Refresh monthly availability when socket events occur
    const currentDate = new Date();
    checkMonthlyAvailability(currentDate.getFullYear(), currentDate.getMonth());
  }, [formData.scheduleNotes.selectedDate]);

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

    // Listen for database changes
    socket.onDbChange("Appointment", "*", handleAppointmentChange);
    socket.onDbChange("AppointmentStatus", "*", handleAppointmentChange);
    socket.onDbChange("Schedule", "*", handleScheduleChange);

    return () => {
      socket.offDbChange("Appointment", "*", handleAppointmentChange);
      socket.offDbChange("AppointmentStatus", "*", handleAppointmentChange);
      socket.offDbChange("Schedule", "*", handleScheduleChange);
    };
  }, [socket, handleAvailabilityRefresh, showToast]);

  const validateField = useCallback(
    (section, fieldName, valueToValidate) => {
      setFormErrors((prev) => {
        const errors = { ...prev };

        switch (section) {
          case "personalInfo":
            const personalValue = valueToValidate != null ? String(valueToValidate) : "";
            let isPersonalFieldInvalid = false;

            if (["firstName", "lastName"].includes(fieldName) && !personalValue.trim()) {
              isPersonalFieldInvalid = true;
            } else if (fieldName === "email" && (!personalValue || !emailRegex.test(personalValue))) {
              isPersonalFieldInvalid = true;
            } else if (fieldName === "phone" && personalValue && !phoneRegex.test(personalValue)) {
              isPersonalFieldInvalid = true;
            }

            if (isPersonalFieldInvalid) {
              errors[fieldName] = true;
            } else {
              delete errors[fieldName];
            }
            break;

          case "addressInfo":
            if (fieldName === "province" && !selectedProvince) {
              errors.province = true;
            } else if (fieldName === "city" && !selectedCity) {
              errors.city = true;
            } else if (fieldName === "barangay" && !selectedBarangay) {
              errors.barangay = true;
            } else {
              delete errors[fieldName];
            }
            break;

          case "visitDetails":
            const visitValue = valueToValidate != null ? String(valueToValidate) : "";
            let isVisitFieldInvalid = false;

            if (fieldName === "purpose" && !visitValue) {
              isVisitFieldInvalid = true;
            } else if (fieldName === "populationCount" && (!visitValue || isNaN(visitValue) || parseInt(visitValue) <= 0)) {
              isVisitFieldInvalid = true;
            }

            if (isVisitFieldInvalid) {
              errors[fieldName] = true;
            } else {
              delete errors[fieldName];
            }
            break;

          case "scheduleNotes":
            if (fieldName === "selectedDate" && !valueToValidate) {
              errors.selectedDate = true;
            } else if (fieldName === "selectedTime" && isTimeRequired(formData.visitDetails.purpose) && !valueToValidate) {
              errors.selectedTime = true;
            } else {
              delete errors[fieldName];
            }
            break;

          default:
            break;
        }
        return errors;
      });
    },
    [formData.visitDetails.purpose, selectedProvince, selectedCity, selectedBarangay, emailRegex, phoneRegex]
  );

  const validateCurrentStep = useCallback(() => {
    let currentStepErrors = {};
    let hasErrors = false;

    if (step === 1) {
      // Personal Info
      const personalFields = ["firstName", "lastName", "email"];
      personalFields.forEach((field) => {
        const valueToCheck = formData.personalInfo[field] != null ? String(formData.personalInfo[field]) : "";
        let isFieldInvalid = false;

        if (field === "email" && (!valueToCheck || !emailRegex.test(valueToCheck))) {
          isFieldInvalid = true;
        } else if (valueToCheck.trim() === "") {
          isFieldInvalid = true;
        }

        if (isFieldInvalid) {
          currentStepErrors[field] = true;
          hasErrors = true;
        }
      });

      // Optional phone validation
      if (formData.personalInfo.phone && !phoneRegex.test(formData.personalInfo.phone)) {
        currentStepErrors.phone = true;
        hasErrors = true;
      }
    } else if (step === 2) {
      // Address Info
      if (!selectedProvince) {
        currentStepErrors.province = true;
        hasErrors = true;
      }
      if (!selectedCity) {
        currentStepErrors.city = true;
        hasErrors = true;
      }
      if (!selectedBarangay) {
        currentStepErrors.barangay = true;
        hasErrors = true;
      }
    } else if (step === 3) {
      // Visit Details
      if (!formData.visitDetails.purpose) {
        currentStepErrors.purpose = true;
        hasErrors = true;
      }
      if (!formData.visitDetails.populationCount || parseInt(formData.visitDetails.populationCount) <= 0) {
        currentStepErrors.populationCount = true;
        hasErrors = true;
      }
    } else if (step === 4) {
      // Schedule & Notes
      if (!formData.scheduleNotes.selectedDate) {
        currentStepErrors.selectedDate = true;
        hasErrors = true;
      }
      if (isTimeRequired(formData.visitDetails.purpose) && !formData.scheduleNotes.selectedTime) {
        currentStepErrors.selectedTime = true;
        hasErrors = true;
      }
    }

    setFormErrors((prev) => ({ ...prev, ...currentStepErrors }));
    return !hasErrors;
  }, [step, formData, selectedProvince, selectedCity, selectedBarangay]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      setShowConfirmationModal(true);
    }
  };

  const confirmSubmit = async () => {
    setShowConfirmationModal(false);
    showToast('Submitting appointment...', 'info');

    let startTimeValue = null;
    let endTimeValue = null;

    if (formData.scheduleNotes.selectedTime) {
      const [startTime, endTime] = formData.scheduleNotes.selectedTime.split('-');
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
      first_name: formData.personalInfo.firstName,
      last_name: formData.personalInfo.lastName,
      email: formData.personalInfo.email,
      phone: formData.personalInfo.phone,
      organization: formData.personalInfo.organization,
      province: selectedProvince?.name || '',
      barangay: selectedBarangay?.name || '',
      city_municipality: selectedCity?.name || '',
      street: formData.addressInfo.street,
      purpose_of_visit: formData.visitDetails.purpose,
      population_count: formData.visitDetails.populationCount,
      preferred_date: formData.scheduleNotes.selectedDate
        ? format(formData.scheduleNotes.selectedDate, 'yyyy-MM-dd')
        : null,
      preferred_time: formData.scheduleNotes.selectedTime,
      start_time: startTimeValue,
      end_time: endTimeValue,
      additional_notes: formData.scheduleNotes.additionalNotes
    };

    try {
      const response = await axiosClient.post('/auth/appointment', payload);

      if (response.status === 201) {
        showToast('Appointment submitted successfully! You will receive a confirmation email shortly.', 'success');
        resetForm();
        setStep(0);
      }
    } catch (error) {
      console.error('Request failed:', error);

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
        showToast('Failed to submit appointment. Please try again.', 'error');
      }
    }
  };

  const cancelSubmit = () => setShowConfirmationModal(false);

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedBarangay(null);
  };

  const clearInputs = () => {
    isDirty ? setShowClearConfirm(true) : resetForm();
  };

  const confirmClear = () => {
    resetForm();
    setShowClearConfirm(false);
  };

  const cancelClear = () => setShowClearConfirm(false);

  const steps = [
    {
      name: "notice",
      component: <Notice />,
    },
    {
      name: "personalInfo",
      component: (
        <PersonalInfo
          value={formData.personalInfo}
          onChange={(val) => setFormData((prev) => ({ ...prev, personalInfo: val }))}
          errors={formErrors}
          validateField={validateField}
        />
      ),
    },
    {
      name: "addressInfo",
      component: (
        <AddressInfo
          value={formData.addressInfo}
          onChange={(val) => setFormData((prev) => ({ ...prev, addressInfo: val }))}
          errors={formErrors}
          validateField={validateField}
          provinces={provinces}
          cities={cities}
          barangays={barangays}
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          selectedBarangay={selectedBarangay}
          setSelectedBarangay={setSelectedBarangay}
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
      ),
    },
    {
      name: "visitDetails",
      component: (
        <VisitDetails
          value={formData.visitDetails}
          onChange={(val) => setFormData((prev) => ({ ...prev, visitDetails: val }))}
          errors={formErrors}
          validateField={validateField}
          showPurposeInfo={showPurposeInfo}
          setShowPurposeInfo={setShowPurposeInfo}
        />
      ),
    },
    {
      name: "scheduleNotes",
      component: (
        <ScheduleNotes
          value={formData.scheduleNotes}
          onChange={(val) => setFormData((prev) => ({ ...prev, scheduleNotes: val }))}
          errors={formErrors}
          validateField={validateField}
          shouldShowTimeOptions={shouldShowTimeOptions(formData.visitDetails.purpose)}
          isTimeRequired={isTimeRequired(formData.visitDetails.purpose)}
          timeSlotExclusive={timeSlotExclusive}
          confirmedSlots={confirmedSlots}
          isLoadingTimeSlots={isLoadingTimeSlots}
          timeSlotCounts={timeSlotCounts}
          disabledDates={disabledDates}
          isLoadingDateAvailability={isLoadingDateAvailability}
          onAvailabilityRefresh={handleAvailabilityRefresh}
        />
      ),
    },
  ];

  const isLastStep = step === steps.length - 1;
  const isNoticeStep = step === 0;

  return (
    <>
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
        isOpen={showConfirmationModal}
        onClose={cancelSubmit}
        onConfirm={confirmSubmit}
        title="Confirm Submission?"
        message="Are you sure you want to submit this appointment?"
        type="question"
        theme="light"
      />
      {PromptModal}
      <div className="w-screen min-w-fit items-center justify-center min-h-screen flex flex-col">
        <div className="min-w-[30rem] w-fit h-fit flex gap-y-5 flex-col">
          <div className="min-w-[30rem] p-10 min-h-[15rem] bg-white rounded-lg shadow-2xl shadow-black/80 flex flex-col items-center justify-center">
            {steps[step].component}
          </div>
          <div className="flex justify-between">
            {isNoticeStep ? (
              <StyledButton
                onClick={() => {
                  navigate(-1);
                }}
                buttonColor="bg-black"
                hoverColor="hover:bg-gray-900"
                textColor="text-white"
              >
                Return
              </StyledButton>
            ) : (
              <StyledButton
                onClick={handlePrevious}
                buttonColor="bg-black"
                hoverColor="hover:bg-gray-900"
                textColor="text-white"
                disabled={step === 0}
              >
                Previous
              </StyledButton>
            )}

            <div className="flex gap-x-3">
              {isNoticeStep ? (
                <div className="h-full w-fit flex items-center">
                  <span className="text-xl font-semibold">Proceed to the form.</span>
                </div>
              ) : null}
              {isDirty && !isNoticeStep && (
                <StyledButton
                  onClick={clearInputs}
                  buttonColor="bg-gray-600"
                  hoverColor="hover:bg-gray-700"
                  textColor="text-white"
                >
                  Clear Inputs
                </StyledButton>
              )}

              {isLastStep ? (
                <StyledButton
                  onClick={handleSubmit}
                  buttonColor="bg-green-700"
                  hoverColor="hover:bg-green-800"
                  textColor="text-white"
                >
                  Submit
                </StyledButton>
              ) : (
                <StyledButton
                  onClick={handleNext}
                  buttonColor="bg-black"
                  hoverColor="hover:bg-gray-900"
                  textColor="text-white"
                >
                  {isNoticeStep ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 12l-10 0" />
                      <path d="M20 12l-4 4" />
                      <path d="M20 12l-4 -4" />
                      <path d="M4 4l0 16" />
                    </svg>
                  ) : (
                    "Next"
                  )}
                </StyledButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast
        type={toast.type}
        message={toast.message}
        duration={3000}
        onClose={hideToast}
      />
    </>
  );
};

export default Appointment;
