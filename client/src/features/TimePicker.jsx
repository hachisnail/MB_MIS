import React, { useState, useEffect, useRef } from 'react';

const TimePicker = ({
  value,
  onChange,
  className = '',
  position = null,
  id = '',
  disabled = false,
  minTime = '06:00',
  maxTime = '18:00',
  stepMinutes = 1,
  format12Hour = true,
  placeholder = 'Select time',
  error = '',
  showError = true
}) => {
  const currentValue = value || '';

  // Get current real time
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24) => {
    if (!time24) {
      // Use current time as default for dropdown positioning
      const currentTime = getCurrentTime();
      const [hours, minutes] = currentTime.split(':');
      const hour24 = parseInt(hours, 10);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 >= 12 ? 'PM' : 'AM';

      return {
        hour: hour12.toString(),
        minute: minutes,
        period: period
      };
    }

    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? 'PM' : 'AM';

    return {
      hour: hour12.toString(),
      minute: minutes,
      period: period
    };
  };

  // Convert 12-hour format to 24-hour time
  const convertTo24Hour = (hour, minute, period) => {
    let hour24 = parseInt(hour, 10);

    if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }

    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  // Parse typed input
  const parseTypedTime = (input) => {
    // Remove any spaces and convert to lowercase
    const cleanInput = input.replace(/\s+/g, '').toLowerCase();

    // Try to match various time formats
    const patterns = [
      /^(\d{1,2}):(\d{2})(am|pm)?$/,  // 9:30am, 9:30pm, 9:30
      /^(\d{1,2})(\d{2})(am|pm)$/,    // 930am, 930pm
      /^(\d{1,2})(am|pm)$/,           // 9am, 9pm
      /^(\d{1,2}):(\d{2})$/,          // 9:30 (24-hour)
      /^(\d{1,2})$/                   // 9 (assume current period)
    ];

    for (const pattern of patterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        let hour = parseInt(match[1], 10);
        let minute = match[2] ? parseInt(match[2], 10) : 0;
        let period = match[3] || (hour >= 1 && hour <= 12 ? 'AM' : null);

        // Handle single digit minutes (e.g., "9:5" should be "9:05")
        if (match[2] && match[2].length === 1) {
          minute = parseInt(match[2] + '0', 10);
        }

        // Validate hour and minute
        if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
          continue;
        }

        // If no period specified, try to guess based on current time
        if (!period) {
          const currentTime = getCurrentTime();
          const currentHour = parseInt(currentTime.split(':')[0], 10);
          const currentPeriod = currentHour >= 12 ? 'PM' : 'AM';
          period = currentPeriod;
        }

        return convertTo24Hour(hour.toString(), minute.toString().padStart(2, '0'), period.toUpperCase());
      }
    }

    return null;
  };

  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [displayTime, setDisplayTime] = useState(currentValue);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom'); // 'top' or 'bottom'

  // Initialize state from current value or current time for dropdown positioning
  const initialTime = convertTo12Hour(currentValue);

  const [tempHour, setTempHour] = useState(initialTime.hour);
  const [tempMinute, setTempMinute] = useState(initialTime.minute);
  const [tempPeriod, setTempPeriod] = useState(initialTime.period);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);
  const periodScrollRef = useRef(null);

  // Update display when value prop changes
  useEffect(() => {
    if (value) {
      setDisplayTime(value);
      setInputValue(formatDisplayTime(value));
      const newTime = convertTo12Hour(value);
      setTempHour(newTime.hour);
      setTempMinute(newTime.minute);
      setTempPeriod(newTime.period);
    } else {
      // Completely reset all states when value is cleared
      setDisplayTime('');
      setInputValue('');
      setIsTyping(false);
      // Reset temp values to current time for dropdown positioning
      const currentTime = convertTo12Hour('');
      setTempHour(currentTime.hour);
      setTempMinute(currentTime.minute);
      setTempPeriod(currentTime.period);
    }
  }, [value]);

  // Auto-scroll to current time when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        // Scroll to current hour
        if (hourScrollRef.current) {
          const hourElement = hourScrollRef.current.querySelector(`[data-hour="${tempHour}"]`);
          if (hourElement) {
            hourElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }

        // Scroll to current minute
        if (minuteScrollRef.current) {
          const minuteElement = minuteScrollRef.current.querySelector(`[data-minute="${tempMinute}"]`);
          if (minuteElement) {
            minuteElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }

        // Scroll to current period
        if (periodScrollRef.current) {
          const periodElement = periodScrollRef.current.querySelector(`[data-period="${tempPeriod}"]`);
          if (periodElement) {
            periodElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 100);
    }
  }, [isOpen, tempHour, tempMinute, tempPeriod]);

  // Generate hour options (1-12 for 12-hour format)
  const generateHours = () => {
    const hours = [];
    for (let i = 1; i <= 12; i++) {
      hours.push(i.toString());
    }
    return hours;
  };

  // Generate ALL minute options (00-59)
  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i++) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };

  // Format time for display
  const formatDisplayTime = (time24) => {
    if (!time24) return '';
    const time12 = convertTo12Hour(time24);
    return `${time12.hour}:${time12.minute} ${time12.period}`;
  };

  // Handle OK button - apply temporary selections
  const handleOK = () => {
    const newTime24 = convertTo24Hour(tempHour, tempMinute, tempPeriod);
    setDisplayTime(newTime24);
    setInputValue(formatDisplayTime(newTime24));
    onChange && onChange(newTime24);
    setIsOpen(false);
  };

  // Handle Cancel button - revert to original value
  const handleCancel = () => {
    // Reset temp values to current display time or initial time
    const resetTime = convertTo12Hour(displayTime || currentValue);
    setTempHour(resetTime.hour);
    setTempMinute(resetTime.minute);
    setTempPeriod(resetTime.period);
    setIsOpen(false);
  };

  // Handle typing input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsTyping(true);

    // Try to parse the typed input
    const parsedTime = parseTypedTime(newValue);
    if (parsedTime) {
      setDisplayTime(parsedTime);
      onChange && onChange(parsedTime);

      // Update temp values for dropdown positioning
      const newTime = convertTo12Hour(parsedTime);
      setTempHour(newTime.hour);
      setTempMinute(newTime.minute);
      setTempPeriod(newTime.period);
    }
  };

  // Handle input blur (when user finishes typing)
  const handleInputBlur = () => {
    setIsTyping(false);
    if (displayTime) {
      setInputValue(formatDisplayTime(displayTime));
    } else {
      setInputValue('');
    }
  };

  // Handle input focus
  const handleInputFocus = (e) => {
    e.stopPropagation();
    setIsTyping(true);
  };

  // Handle clear button (X)
  const handleClear = (e) => {
    e.stopPropagation();
    setDisplayTime('');
    setInputValue('');
    onChange && onChange('');
  };

  // Handle input click - either open dropdown or focus for typing
  const handleInputClick = (e) => {
    if (disabled) return;

    // If clicking on the input text area, focus for typing
    if (e.target.tagName === 'INPUT') {
      setIsTyping(true);
      return;
    }

    // Otherwise, toggle dropdown
    setIsOpen(!isOpen);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine dropdown position
  useEffect(() => {
    if (isOpen && inputRef.current && dropdownRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;

      if (position === 'top') {
        setDropdownPosition('top');
      } else {
        // Find the closest relatively positioned ancestor
        let container = inputRef.current.parentNode;
        while (container && window.getComputedStyle(container).position !== 'relative') {
          container = container.parentNode;
        }

        // If no relatively positioned ancestor is found, use the document body
        const containerRect = container ? container.getBoundingClientRect() : document.documentElement.getBoundingClientRect();

        const willOverflow = (inputRect.bottom + dropdownHeight) > containerRect.bottom;

        if (willOverflow) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      }
    }
  }, [isOpen, dropdownRef.current?.offsetHeight, position]);

  const hours = generateHours();
  const minutes = generateMinutes();
  const periods = ['AM', 'PM'];

  return (
    <div className={`flex flex-col ${className}`} id={id}>
      {/* Input Display */}
      <div className="relative">
        <div
          ref={inputRef}
          onClick={handleInputClick}
          className={`
            flex items-center justify-between px-3 py-3 border rounded-2xl 
            bg-white text-xl w-full cursor-pointer
            ${error ? 'border-red-600' : 'border-black'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed border-gray-400' : 'hover:border-gray-400'}
          `}
          style={{
            boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {isTyping ? (
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
                placeholder="Type time (e.g., 9:30am)"
                className="flex-1 outline-none bg-transparent text-xl min-w-0"
                disabled={disabled}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-xl truncate">
                {displayTime ? formatDisplayTime(displayTime) : placeholder}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {displayTime && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className={`absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-2xl shadow-lg z-50 ${dropdownPosition === 'bottom' ? 'top-full' : 'bottom-full mb-1'
              }`}
          >
            {/* Time Picker Columns */}
            <div className="flex p-4 gap-4">
              {/* Hours Column */}
              <div className="flex flex-col items-center flex-1">
                <div className="text-sm text-gray-500 mb-2 font-medium">Hour</div>
                <div ref={hourScrollRef} className="h-40 overflow-y-auto border border-gray-200 rounded-lg w-full">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      data-hour={hour}
                      onClick={() => {
                        setTempHour(hour);
                      }}
                      className={`
                        px-3 py-2 cursor-pointer text-center transition-colors text-lg
                        ${tempHour === hour
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      {hour}
                    </div>
                  ))}
                </div>
              </div>

              {/* Minutes Column */}
              <div className="flex flex-col items-center flex-1">
                <div className="text-sm text-gray-500 mb-2 font-medium">Minute</div>
                <div ref={minuteScrollRef} className="h-40 overflow-y-auto border border-gray-200 rounded-lg w-full">
                  {minutes.map((minute) => (
                    <div
                      key={minute}
                      data-minute={minute}
                      onClick={() => {
                        setTempMinute(minute);
                      }}
                      className={`
                        px-3 py-2 cursor-pointer text-center transition-colors text-lg
                        ${tempMinute === minute
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      {minute}
                    </div>
                  ))}
                </div>
              </div>

              {/* AM/PM Column */}
              {format12Hour && (
                <div className="flex flex-col items-center flex-1">
                  <div className="text-sm text-gray-500 mb-2 font-medium">Period</div>
                  <div ref={periodScrollRef} className="h-40 overflow-y-auto border border-gray-200 rounded-lg w-full">
                    {periods.map((period) => (
                      <div
                        key={period}
                        data-period={period}
                        onClick={() => {
                          setTempPeriod(period);
                        }}
                        className={`
                          px-3 py-2 cursor-pointer text-center transition-colors text-lg
                          ${tempPeriod === period
                            ? 'bg-blue-500 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                          }
                        `}
                      >
                        {period}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cancel and OK Buttons */}
            <div className="flex justify-end gap-3 px-4 pb-4 pt-2 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleOK}
                className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-medium"
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {showError && (
        <span className="text-red-600 text-md h-6 pl-2">
          {error?.message || error || ""}
        </span>
      )}
    </div>
  );
};

export default TimePicker;
