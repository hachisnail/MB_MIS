import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import { DateInput } from "../../../../features/FormUtilities";

// Helper function to get today's date at midnight (start of day)
const getTodayAtMidnight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
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
    additionalNotes: yup.string().nullable(),
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
}) => {
    const [isDirty, setIsDirty] = useState(false);
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
        defaultValues: initialData,
        resolver: yupResolver(schema),
    });

    const watchedDate = watch('selectedDate');

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
                        }
                    }
                    return changed ? updated : prev;
                });
            });
        });
        return () => subscription.unsubscribe();
    }, [watch, setFormData]);

    const timeSlots = ['09:00-10:29', '10:30-11:59', '01:00-02:29', '02:30-04:00'];

    return (
        <div className="w-[85rem] h-fit">
            <form
                onSubmit={handleSubmit((data) => onNext(data))}
                className="w-full h-[46rem] flex flex-col items-center justify-between"
            >
                <div className="w-full h-[40rem] flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
                    <div className="w-full h-fit pb-5 border-b-1">
                        <span className="text-5xl font-hina">Schedule & Additional Information.</span>
                    </div>
                    <div className="w-full h-full pt-10 flex flex-col justify-evenly">
                        {/* Preferred Date */}
                        <div className="w-full h-fit flex">
                            <label className="min-w-40 text-2xl font-semibold">Date</label>
                            <div className="w-full h-fit flex justify-between">
                                <DateInput
                                    control={control}
                                    name="selectedDate"
                                    mode="single"
                                    placeholder="Select preferred date"
                                    minDate={(() => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return today;
                                    })()}
                                    maxDate={new Date(2030, 11, 31)}
                                    error={errors.selectedDate}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Time Selection */}
                        {shouldShowTimeOptions && (
                            <div className="w-full h-fit flex">
                                <label className="min-w-40 text-2xl font-semibold">
                                    Time {isTimeRequired && <span className="text-red-500">*</span>}
                                </label>
                                <div className="w-full h-fit flex flex-col">
                                    <Controller
                                        name="selectedTime"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                                                {timeSlots.map((time) => {
                                                    const isExclusive = timeSlotExclusive[time];
                                                    const hasConfirmedAppointment = confirmedSlots[time];
                                                    const slotOverlapCount = timeSlotCounts[time] || 0;
                                                    const isOverLimit = slotOverlapCount >= 5;
                                                    const isUnavailable = isExclusive || hasConfirmedAppointment || isOverLimit;
                                                    const crossOut = isUnavailable;

                                                    return (
                                                        <div key={time} className="relative group">
                                                            <label
                                                                className={`cursor-pointer border-2 border-gray-300 px-4 py-2 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-lg
                                                                    ${field.value === time ? 'bg-[#f0b001] border-[#f0b001]' : ''} 
                                                                    ${crossOut ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="selectedTime"
                                                                    value={time}
                                                                    className="hidden"
                                                                    onChange={() => {
                                                                        if (!crossOut) {
                                                                            field.onChange(time);
                                                                        }
                                                                    }}
                                                                    disabled={crossOut}
                                                                />
                                                                <span className="font-medium">{time}</span>
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
                                        )}
                                    />
                                    {isLoadingTimeSlots && (
                                        <p className="text-lg text-gray-500 mt-2">Checking availability...</p>
                                    )}
                                    {errors.selectedTime && (
                                        <p className="mt-1 text-lg text-red-600">{errors.selectedTime.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Additional Notes */}
                        <div className="w-full h-fit flex">
                            <label className="min-w-40 text-2xl font-semibold">Notes</label>
                            <div className="w-full h-fit flex justify-between">
                                <textarea
                                    {...register("additionalNotes")}
                                    rows="4"
                                    placeholder="Any extra info or requests"
                                    className="w-full px-4 py-2 border border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none text-xl"
                                    style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-15 flex justify-between">
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
                                className="w-40 hover:bg-black rounded-md text-2xl bg-gray-900 text-white"
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
