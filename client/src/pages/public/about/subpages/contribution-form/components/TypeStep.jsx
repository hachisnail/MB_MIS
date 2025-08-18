import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import { DropdownInput } from "../../../../../../features/FormUtilities";

const schema = yup.object({
  type: yup.string().required("Please select a type of arrangement"),
});

const TypeStep = ({ initialData, onNext, onBack, setFormData }) => {
  const {
    handleSubmit,
    control,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: initialData,
    resolver: yupResolver(schema),
  });

  // Watch all form fields for live updates
  useEffect(() => {
    const subscription = watch((values) => {
      setFormData((prev) => {
        let changed = false;
        const updated = { ...prev };
        for (const key in values) {
          if (values[key] !== prev[key]) {
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
        className="w-full h-[46rem] flex flex-col items-center justify-between"
      >
        <div className="w-full h-[40rem] flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
          <div className="w-full h-fit pb-5 border-b-1 ">
            <span className="text-5xl font-hina">Donate or Lend?</span>
          </div>
          <div className="w-full h-full pt-10 flex gap-x-5">
            <div className="min-w-[28rem] flex flex-col gap-y-5 pt-25 font-semibold">
              <label className="text-2xl w-90">
                Choose between the two types of arrangement.
              </label>
              <DropdownInput
                control={control}
                name="type"
                error={errors.type}
                className="w-[26rem]"
                options={[
                  { value: "lending", label: "Lending" },
                  { value: "donation", label: "Donation" },
                ]}
              />
            </div>
            {/* Help guide section remains unchanged */}
            <div className="w-full h-full flex flex-col px-10 justify-center gap-y-2 rounded-2xl border-2 bg-[#FEFEFE]">
              <div className="w-full h-fit flex gap-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.802 2.165l5.575 2.389c.48 .206 .863 .589 1.07 1.07l2.388 5.574c.22 .512 .22 1.092 0 1.604l-2.389 5.575c-.206 .48 -.589 .863 -1.07 1.07l-5.574 2.388c-.512 .22 -1.092 .22 -1.604 0l-5.575 -2.389a2.036 2.036 0 0 1 -1.07 -1.07l-2.388 -5.574a2.036 2.036 0 0 1 0 -1.604l2.389 -5.575c.206 -.48 .589 -.863 1.07 -1.07l5.574 -2.388a2.036 2.036 0 0 1 1.604 0z" />
                  <path d="M12 16v.01" />
                  <path d="M12 13a2 2 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
                </svg>
                <span className="text-2xl font-semibold ">Help Guide</span>
              </div>
              <span className="text-xl text-gray-600">
                What could be the difference between <b className="text-black">DONATION</b> and{" "}
                <b className="text-black">LENDING?</b>
              </span>
              <div className="w-full h-fit flex flex-col gap-y-2 mt-4">
                <span className="text-2xl font-semibold">DONATION:</span>
                <span className="text-xl text-justify text-gray-600">
                  &nbsp;&nbsp;&nbsp;&nbsp;The First party agrees that they will transfer the rights of
                  the artifact to the Second Party and have it displayed along
                  with other paintings and artifacts collected from other
                  individuals.
                </span>
              </div>
              <div className="w-full h-fit flex flex-col gap-y-2 mt-4">
                <span className="text-2xl font-semibold">LENDING:</span>
                <span className="text-xl text-justify text-gray-600">
                  &nbsp;&nbsp;&nbsp;&nbsp;The First Party agrees that he will allow the artifact
                  to be borrowed and shown as an addition to the Second Party's
                  displays along with other Banknotes collected from other
                  individuals.
                </span>
              </div>
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

export default TypeStep;
