import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import { FormInput } from "../../../../../../features/FormUtilities";

const schema = yup.object({
  artifactTitle: yup
    .string()
    .required("Please provide the title or name of the artifact"),
  artifactDescription: yup
    .string()
    .required("Please provide a description of the artifact"),
  acquisitionDetails: yup.string().nullable(),
  additionalInfo: yup.string().nullable(),
  narrative: yup.string().nullable(),
});

const AboutStep = ({ initialData, onNext, onBack, setFormData }) => {
  const {
    handleSubmit,
    register,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: initialData,
    resolver: yupResolver(schema),
  });

  // Live update formData on any input change
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
    <div className="w-[85rem] h-fit">
      <form
        onSubmit={handleSubmit((data) => onNext(data))}
        className="w-full min-h-[56rem] flex flex-col items-center justify-between"
      >
        <div className="w-full h-auto min-h-[42rem] flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
          <div className="w-full h-fit pb-5 border-b-1">
            <span className="text-5xl font-hina">About the artifact</span>
          </div>

          <div className="w-full h-full pt-10 flex gap-y-2 flex-col">
            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                Title/Name of the Artifact
              </span>
              <FormInput
                placeholder="Artifact Title"
                register={register}
                name="artifactTitle"
                error={errors.artifactTitle}
                className="w-[70rem]"
              />
            </div>

            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                Artifact Description
              </span>
              <FormInput
                placeholder="Artifact Description"
                register={register}
                name="artifactDescription"
                error={errors.artifactDescription}
                className="w-[70rem]"
              />
            </div>

            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                How and where did you acquire the artifact?
              </span>
              <FormInput
                placeholder="Acquisition Details"
                register={register}
                name="acquisitionDetails"
                error={errors.acquisitionDetails}
                className="w-[70rem]"
              />
            </div>

            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                Is there any other information about the artifact that the museum should know?
              </span>
              <FormInput
                placeholder="Additional Information"
                register={register}
                name="additionalInfo"
                error={errors.additionalInfo}
                className="w-[70rem]"
              />
            </div>

            <div className="w-full h-fit flex flex-col gap-y-3 items-end">
              <span className="w-full text-2xl font-semibold">
                Would you like to provide a brief narrative or story related to the artifact?
              </span>
              <FormInput
                placeholder="Narrative/Story"
                register={register}
                name="narrative"
                error={errors.narrative}
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

export default AboutStep;
