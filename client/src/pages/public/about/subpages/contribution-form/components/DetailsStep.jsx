import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import { FormInput, DateInput } from "../../../../../../features/FormUtilities";

const schema = yup.object({
  lendDuration: yup
    .object({
      from: yup
        .date()
        .nullable()
        .typeError("Please select a start date")
        .required("Please select a start date")
        .test(
          "start-not-in-past",
          "Start date cannot be in the past",
          (value) => {
            if (!value) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return value >= today;
          }
        ),
      to: yup
        .date()
        .nullable()
        .typeError("Please select an end date")
        .required("Please select an end date")
        .test(
          "end-after-start",
          "End date must be after start date",
          function (value) {
            const { from } = this.parent;
            if (!value || !from) return false;
            return value > from;
          }
        )
        .max(new Date(2100, 0, 1), "End date cannot be beyond year 2100"),
    })
    .nullable()
    .test(
      "both-dates-required",
      "Please select a lend duration",
      (value) => !!(value?.from && value?.to)
    ),
  lendConditions: yup.string().trim().nullable().notRequired(),
  lendLiabilities: yup.string().trim().nullable().notRequired(),
  lendingReason: yup.string().trim().nullable().notRequired(),
});

const DetailsStep = ({ initialData, onNext, onBack, setFormData }) => {
  const {
    handleSubmit,
    register,
    control,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: initialData,
    resolver: yupResolver(schema),
  });

  // Live update formData on any field change
  useEffect(() => {
    const subscription = watch((values) => {
      setFormData((prev) => {
        let changed = false;
        const updated = { ...prev };
        for (const key in values) {
          if (JSON.stringify(values[key]) !== JSON.stringify(prev[key])) {
            updated[key] = values[key];
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, setFormData]);

  return (
    <div className="w-[85rem] h-fit ">
      <form
        onSubmit={handleSubmit((data) => onNext(data))}
        className="w-full min-h-[48rem] flex flex-col items-center justify-between"
      >
        <div className="w-full h-auto min-h-[40rem] flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
          <div className="w-full h-fit pb-5 border-b-1 ">
            <span className="text-5xl font-hina">Lending Details</span>
          </div>
          <div className="w-full h-full pt-10 flex gap-y-2 flex-col">
            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                Proposed duration of the loan?
              </span>
              <DateInput
                control={control}
                name="lendDuration"
                mode="range"
                placeholder="Select lend duration"
                minDate={new Date()}
                maxDate={new Date(2100, 0, 1)}
                openToDate={getValues("lendDuration")?.from || new Date()}
                error={errors.lendDuration}
                className="w-[70rem]"
              />
            </div>

            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                Specific conditions or requirements for the display or handling
                of the artifact?
              </span>
              <FormInput
                placeholder="Lending conditions"
                register={register}
                name="lendConditions"
                error={errors.lendConditions}
                className="w-[70rem]"
              />
            </div>

            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                Specific liability concerns or requirements you have regarding the artifact?
              </span>
              <FormInput
                placeholder="Lending liabilities"
                register={register}
                name="lendLiabilities"
                error={errors.lendLiabilities}
                className="w-[70rem]"
              />
            </div>

            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                Reason for lending.
              </span>
              <FormInput
                placeholder="Lending reason"
                register={register}
                name="lendingReason"
                error={errors.lendingReason}
                className="w-[70rem]"
              />
            </div>
          </div>
        </div>

        <div className="w-full h-15 flex justify-between">
          <button
            type="button"
            onClick={() => {
              const values = getValues();
              onBack(values);
            }}
            className="w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800"
          >
            Previous
          </button>

          <button
            type="submit"
            className="w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default DetailsStep;
