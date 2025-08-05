import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useSocketClient } from "../../context/authContext";

// This is a special date picker for the Appointment page that supports crossing out fully booked dates
export default function AppointmentDatePicker({
    onDateChange,
    defaultValue = "",
    theme = "light",
    disabledDates = [],
    isLoadingAvailability = false,
    onAvailabilityRefresh = null, // Callback to refresh availability data
}) {
    const [selected, setSelected] = useState(
        defaultValue ? new Date(defaultValue) : undefined
    );
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [popupTimeout, setPopupTimeout] = useState(null);

    const socket = useSocketClient();

    const handleSelect = (date, close) => {
        setSelected(date);
        onDateChange?.(date ? format(date, "yyyy-MM-dd") : "");
        close();
    };

    const clearDate = () => {
        setSelected(undefined);
        onDateChange?.("");
    };

    // Handle click on disabled dates
    const handleDisabledDateClick = (e) => {
        const target = e.target.closest('.rdp-day_disabled');
        if (target) {
            e.preventDefault();
            e.stopPropagation();

            const rect = target.getBoundingClientRect();
            setPopupPosition({
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
            setShowPopup(true);

            // Clear any existing timeout
            if (popupTimeout) {
                clearTimeout(popupTimeout);
            }

            // Hide popup after 3 seconds
            const timeout = setTimeout(() => {
                setShowPopup(false);
            }, 3000);
            setPopupTimeout(timeout);
        }
    };

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (popupTimeout) {
                clearTimeout(popupTimeout);
            }
        };
    }, [popupTimeout]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket || !onAvailabilityRefresh) return;

        const handleDataChange = () => {
            // Call the parent component's refresh function
            onAvailabilityRefresh();
        };

        // Listen for database changes that affect availability
        socket.onDbChange("Appointment", "*", handleDataChange);
        socket.onDbChange("AppointmentStatus", "*", handleDataChange);
        socket.onDbChange("Schedule", "*", handleDataChange);

        return () => {
            socket.offDbChange("Appointment", "*", handleDataChange);
            socket.offDbChange("AppointmentStatus", "*", handleDataChange);
            socket.offDbChange("Schedule", "*", handleDataChange);
        };
    }, [socket, onAvailabilityRefresh]);

    const isDark = theme === "dark";
    const buttonStyle = isDark
        ? "bg-[#191919] border-[#353535] border hover:bg-gray-700"
        : "bg-white border-[#353535] border hover:bg-gray-200";
    const textStyle = isDark ? "text-white" : "text-black";

    // Convert disabled dates to Date objects
    const disabledDateObjects = disabledDates.map(dateStr => new Date(dateStr));

    // Custom modifiers for styling
    const modifiers = {
        disabled: disabledDateObjects,
        booked: disabledDateObjects,
    };

    const modifiersStyles = {
        booked: {
            textDecoration: 'line-through',
            color: '#ef4444',
            position: 'relative',
            fontWeight: '500',
        },
    };

    // Custom CSS for crossed out dates with red color
    const customStyles = `
    .rdp-day_disabled {
      text-decoration: line-through !important;
      text-decoration-thickness: 2px !important;
      color: #ef4444 !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      position: relative;
      opacity: 0.8;
      pointer-events: auto !important;
    }
    .rdp-day_disabled:hover {
      background-color: #fee2e2 !important;
      opacity: 1;
    }
    .rdp-day_disabled button {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    .rdp-day_booked {
      text-decoration: line-through !important;
      text-decoration-thickness: 2px !important;
      color: #ef4444 !important;
      font-weight: 500 !important;
      position: relative;
      cursor: pointer !important;
    }
    .rdp-day_booked button {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    /* Legend indicator */
    .legend-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .legend-box {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .legend-box.fully-booked {
      color: #ef4444;
      text-decoration: line-through;
      text-decoration-thickness: 2px;
      background-color: #fee2e2;
    }
  `;

    return (
        <>
            {/* Popup Message for fully booked dates */}
            {showPopup && (
                <div
                    className="fixed z-[10000] pointer-events-none"
                    style={{
                        left: `${popupPosition.x}px`,
                        top: `${popupPosition.y}px`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className={`
                        px-4 py-3 rounded-lg shadow-xl pointer-events-auto
                        ${isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'}
                        animate-fadeIn
                    `}>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">
                                This date is fully booked
                            </p>
                        </div>
                        <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                            No available time slots
                        </p>
                        <div className={`
                            absolute left-1/2 transform -translate-x-1/2 top-full
                            w-0 h-0 border-l-[6px] border-l-transparent
                            border-r-[6px] border-r-transparent
                            ${isDark ? 'border-t-[6px] border-t-gray-800' : 'border-t-[6px] border-t-white'}
                        `}></div>
                    </div>
                </div>
            )}

            <Popover className="relative inline-block">
                {({ open, close }) => (
                    <>
                        <style>{customStyles}</style>
                        <style>{`
                            @keyframes fadeIn {
                                from {
                                    opacity: 0;
                                    transform: translate(-50%, -100%) translateY(-4px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translate(-50%, -100%) translateY(0);
                                }
                            }
                            .animate-fadeIn {
                                animation: fadeIn 0.2s ease-out;
                            }
                        `}</style>
                        {/* Single button that changes icon depending on date selection */}
                        {!selected ? (
                            <PopoverButton
                                className={`p-2 rounded cursor-pointer ${buttonStyle}`}
                                title="Pick a date"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`w-8 h-8 ${textStyle}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12.5 21h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v5" />
                                    <path d="M16 3v4" />
                                    <path d="M8 3v4" />
                                    <path d="M4 11h16" />
                                    <path d="M16 19h6" />
                                    <path d="M19 16v6" />
                                </svg>
                            </PopoverButton>
                        ) : (
                            <button
                                className={`p-2 rounded cursor-pointer ${buttonStyle}`}
                                onClick={clearDate}
                                title="Clear selected date"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`w-8 h-8 ${textStyle}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M13 21h-7a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6.5" />
                                    <path d="M16 3v4" />
                                    <path d="M8 3v4" />
                                    <path d="M4 11h16" />
                                    <path d="M22 22l-5 -5" />
                                    <path d="M17 22l5 -5" />
                                </svg>
                            </button>
                        )}

                        <PopoverPanel
                            className={`absolute z-10 mt-2 shadow-lg rounded border ${isDark
                                ? "bg-[#191919] border-[#353535] text-white"
                                : "bg-white border-gray-300 text-black"
                                }`}
                        >
                            <div className={isDark ? "dark" : ""}>
                                {isLoadingAvailability && (
                                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-20 rounded">
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                                            <p className="mt-2 text-sm">Checking availability...</p>
                                        </div>
                                    </div>
                                )}
                                <DayPicker
                                    mode="single"
                                    selected={selected}
                                    onSelect={(date) => handleSelect(date, close)}
                                    disabled={[
                                        ...disabledDateObjects,
                                        { before: new Date() } // Also disable past dates
                                    ]}
                                    modifiers={modifiers}
                                    modifiersStyles={modifiersStyles}
                                    className="p-3"
                                    onDayClick={(date, modifiers, e) => {
                                        // Check if the clicked date is disabled/booked
                                        const isDisabled = disabledDateObjects.some(
                                            disabledDate =>
                                                date.toDateString() === disabledDate.toDateString()
                                        );

                                        if (isDisabled) {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setPopupPosition({
                                                x: rect.left + rect.width / 2,
                                                y: rect.top - 10
                                            });
                                            setShowPopup(true);

                                            // Clear any existing timeout
                                            if (popupTimeout) {
                                                clearTimeout(popupTimeout);
                                            }

                                            // Hide popup after 3 seconds
                                            const timeout = setTimeout(() => {
                                                setShowPopup(false);
                                            }, 3000);
                                            setPopupTimeout(timeout);
                                        }
                                    }}
                                />
                                {disabledDates.length > 0 && (
                                    <div className="px-3 pb-3 border-t">
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="legend-indicator">
                                                <span className="legend-box fully-booked">15</span>
                                                <span className="text-gray-600 dark:text-gray-400">= Fully booked (no available time slots)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </PopoverPanel>
                    </>
                )}
            </Popover>
        </>
    );
}
