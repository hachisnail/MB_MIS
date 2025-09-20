import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import { format } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Helper function to get today's date at midnight (start of day)
const getTodayAtMidnight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// Helper function to get local date string
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const createSchema = (isTimeRequired) => yup.object({
    selectedDate: yup
        .date()
        .typeError("Please select a valid date")
        .required("Preferred date is required")
        .min(getTodayAtMidnight(), "Date cannot be before today"),
    selectedTime: isTimeRequired
        ? yup.string().required("Time selection is required for this purpose")
        : yup.string().nullable(),
    additionalNotes: yup.string()
        .max(500, 'Notes cannot exceed 500 characters')
        .nullable(),
});

const ScheduleStep = ({
    initialData,
    onNext,
    onBack,
    setFormData,
    onClearForm,
    // Schedule-related props
    shouldShowTimeOptions,
    isTimeRequired,
    timeSlotExclusive,
    confirmedSlots,
    isLoadingTimeSlots,
    timeSlotCounts,
    disabledDates,
    isLoadingDateAvailability,
    onAvailabilityRefresh,
    calendarEvents = [],
    markAsInteracted,
}) => {
    const [isDirty, setIsDirty] = useState(false);
    const [selectedDate, setSelectedDate] = useState(initialData?.selectedDate || new Date());
    const schema = createSchema(isTimeRequired);

    const {
        register,
        handleSubmit,
        control,
        watch,
        getValues,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            ...initialData,
            selectedDate: initialData?.selectedDate || new Date(),
        },
        resolver: yupResolver(schema),
    });

    const watchedNotes = watch('additionalNotes');

    useEffect(() => {
        const subscription = watch((values) => {
            queueMicrotask(() => {
                setFormData((prev) => {
                    let changed = false;
                    const updated = { ...prev };
                    for (const key in values) {
                        if (values[key] !== prev[key]) {
                            updated[key] = values[key];
                            changed = true;
                            setIsDirty(true);
                            if (markAsInteracted) markAsInteracted();
                        }
                    }
                    return changed ? updated : prev;
                });
            });
        });
        return () => subscription.unsubscribe();
    }, [watch, setFormData, markAsInteracted]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setValue('selectedDate', date, { shouldValidate: true });
        if (markAsInteracted) markAsInteracted();
        // Trigger form change event
        window.dispatchEvent(new Event('formChanged'));
    };

    const timeSlots = ['09:00-10:29', '10:30-11:59', '01:00-02:29', '02:30-04:00'];

    return (
        <div className="w-[85rem] h-fit">
            <form
                onSubmit={handleSubmit((data) => onNext(data))}
                className="w-full h-[46rem] flex flex-col items-center justify-between"
            >
                <div className="w-full h-[40rem] flex flex-col shadow-md rounded-lg shadow-gray-500 px-12 py-8">
                    <div className="w-full h-fit pb-5 border-b-1 mb-8">
                        <span className="text-5xl font-hina">Schedule & Additional Information</span>
                    </div>

                    {/* Grid layout for calendar and time slots */}
                    <div className="grid grid-cols-2 gap-12 h-full">
                        {/* Left side - Calendar */}
                        <div>
                            <label className="block text-xl font-semibold text-gray-700 mb-4">
                                Select preferred date <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-xl bg-black p-3 shadow-xl inline-block">
                                <Calendar
                                    onChange={handleDateSelect}
                                    value={selectedDate}
                                    tileClassName={({ date, view }) => {
                                        if (view === 'month') {
                                            const ds = getLocalDateString(date);
                                            const isDisabled = disabledDates?.includes(ds);
                                            return isDisabled ? 'relative group' : 'relative';
                                        }
                                        return 'relative';
                                    }}
                                    tileContent={({ date, view }) => {
                                        if (view === 'month') {
                                            const ds = getLocalDateString(date);

                                            // Check if date is disabled (fully booked)
                                            const isDisabled = disabledDates?.includes(ds);

                                            // Show cross mark for fully booked dates
                                            if (isDisabled) {
                                                return (
                                                    <>
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <span className="text-red-500 text-3xl font-bold">×</span>
                                                        </div>
                                                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                            No available time slots on this date
                                                        </div>
                                                    </>
                                                );
                                            }
                                        }
                                        return null;
                                    }}
                                    tileDisabled={({ date }) => {
                                        const dateString = getLocalDateString(date);
                                        return disabledDates?.includes(dateString) || false;
                                    }}
                                    showNeighboringMonth={false}
                                    minDate={getTodayAtMidnight()}
                                    maxDate={new Date(2030, 11, 31)}
                                    className="p-2 rounded-lg text-base"
                                />
                            </div>
                            {selectedDate && (
                                <div className="mt-3 text-base text-gray-600">
                                    Selected: <span className="font-semibold">{format(selectedDate, 'MMMM d, yyyy')}</span>
                                </div>
                            )}
                            {isLoadingDateAvailability && (
                                <p className="mt-2 text-sm text-gray-500">Checking available dates...</p>
                            )}
                            {errors.selectedDate && (
                                <p className="mt-2 text-base text-red-600">{errors.selectedDate.message}</p>
                            )}
                        </div>

                        {/* Right side - Time slots and Notes */}
                        <div className="space-y-6">
                            {/* Time Selection */}
                            {shouldShowTimeOptions && (
                                <div>
                                    <label className="block text-xl font-semibold text-gray-700 mb-4">
                                        Select preferred time {isTimeRequired && <span className="text-red-500">*</span>}
                                    </label>
                                    <Controller
                                        name="selectedTime"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="grid grid-cols-2 gap-3">
                                                {timeSlots.map((time) => {
                                                    const isExclusive = timeSlotExclusive[time];
                                                    const hasConfirmedAppointment = confirmedSlots[time];
                                                    const slotOverlapCount = timeSlotCounts[time] || 0;
                                                    const isOverLimit = slotOverlapCount >= 1;
                                                    const isUnavailable = isExclusive || hasConfirmedAppointment || isOverLimit;
                                                    const isSelected = field.value === time;

                                                    return (
                                                        <div key={time} className="relative group">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (!isUnavailable) {
                                                                        field.onChange(time);
                                                                        if (markAsInteracted) markAsInteracted();
                                                                    }
                                                                }}
                                                                disabled={isUnavailable}
                                                                className={`w-full px-5 py-3 border-2 rounded-lg text-left transition-colors relative text-lg
                                                                ${isSelected
                                                                        ? 'bg-[#f0b001] border-[#f0b001] text-white'
                                                                        : isUnavailable
                                                                            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                                                            : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                                    }
                                                            `}
                                                            >
                                                                <span className={`font-medium ${isUnavailable ? 'line-through' : ''}`}>
                                                                    {time}
                                                                </span>
                                                                {isUnavailable && (
                                                                    <span className="absolute inset-0 flex items-center justify-center text-red-600">
                                                                        <i className="fa-solid fa-times text-2xl"></i>
                                                                    </span>
                                                                )}
                                                            </button>

                                                            {isUnavailable && (
                                                                <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-3 bg-gray-800 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                                    {isExclusive ? 'This time slot is reserved for a special event' :
                                                                        hasConfirmedAppointment ? 'This time slot is already taken' :
                                                                            isOverLimit ? 'This time slot is already booked' :
                                                                                'This time slot is not available'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    />
                                    {isLoadingTimeSlots && (
                                        <p className="mt-3 text-base text-gray-500">Checking available time slots...</p>
                                    )}
                                    {errors.selectedTime && (
                                        <p className="mt-2 text-base text-red-600">{errors.selectedTime.message}</p>
                                    )}
                                </div>
                            )}

                            {/* Notes Section */}
                            <div>
                                <label className="block text-xl font-semibold text-gray-700 mb-3">
                                    Note
                                </label>
                                <div className="relative">
                                    <textarea
                                        {...register("additionalNotes")}
                                        rows="6"
                                        maxLength="500"
                                        placeholder="Additional notes (optional)"
                                        className={`w-full px-4 py-3 border text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none ${errors.additionalNotes
                                            ? "border-red-600"
                                            : "border-black"
                                            }`}
                                        style={{
                                            boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
                                        }}
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-red-600 text-sm h-5 pl-1">
                                            {errors.additionalNotes?.message || ""}
                                        </span>
                                        <span className="text-sm text-gray-500 pr-1">
                                            {watchedNotes?.length || 0}/500
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="w-full flex justify-between">
                    <button
                        type="button"
                        onClick={() => onBack(getValues())}
                        className="w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800"
                    >
                        Previous
                    </button>
                    <div className="w-fit h-fit flex gap-x-5">
                        {isDirty && (
                            <button
                                type="button"
                                onClick={() => onClearForm()}
                                className="w-40 h-15 hover:bg-black rounded-md text-2xl bg-gray-900 text-white"
                            >
                                Clear Form
                            </button>
                        )}
                        <button
                            type="submit"
                            className="w-44 h-15 rounded-md bg-green-700 text-white text-2xl hover:bg-green-800"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ScheduleStep;
