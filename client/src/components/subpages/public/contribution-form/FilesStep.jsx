import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import { FileInput } from "../../../../features/FormUtilities";

const fileOrUrlSchema = yup
  .object({
    files: yup.array().of(yup.mixed()).default([]),
    url: yup.string().url("Must be a valid URL").default(""),
  })
  .test(
    "file-or-url",
    "Please upload at least one file or provide a URL",
    (value) => {
      return value?.files?.length > 0 || Boolean(value?.url);
    }
  );

const schema = yup.object({
  artifactImages: fileOrUrlSchema,
  artifactDocuments: fileOrUrlSchema,
  artifactRelatedImages: fileOrUrlSchema,
});

const FilesStep = ({ initialData, onNext, onBack, setFormData }) => {
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

  // Live update formData on any file or URL change
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
        className="w-full h-[63rem] flex flex-col items-center justify-between"
      >
        <div className="w-full h-[57rem] flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
          <div className="w-full h-fit pb-5 border-b-1">
            <span className="text-5xl font-hina">Attach some files</span>
          </div>

          <div className="w-full h-full pt-10 flex flex-col gap-y-3">
            <div className="flex flex-col w-full h-fit items-end gap-y-3">
              <label className="w-full text-2xl font-semibold">
                Images of the artifact
              </label>

              <FileInput
                control={control}
                name="artifactImages"
                className="w-[70rem]"
              />
            </div>

            <div className="flex flex-col w-full h-fit items-end gap-y-3">
              <div className="flex flex-col w-full h-fit">
                <label className="w-full text-2xl font-semibold">
                  Is there any relevant documentation or research about the
                  artifact?
                </label>
                <span className="text-sm">
                  Such as Provenance Documents, Historical Records, Research
                  Papers, Certificates of Authenticity, Catalogs or Inventories.
                </span>
              </div>
              <FileInput
                control={control}
                name="artifactDocuments"
                className="w-[70rem]"
              />
            </div>

            <div className="flex flex-col w-full h-fit items-end gap-y-3">
              <div className="flex flex-col w-full h-fit">
                <label className="w-full text-2xl font-semibold">
                Any related images about the artifact.
                </label>
                <span className="text-sm">
                For example an image of your grandfather wearing the clothes, of image of an artifact while being used.
                </span>
              </div>
              <FileInput
                control={control}
                name="artifactRelatedImages"
                className="w-[70rem]"
              />
            </div>
          </div>
        </div>

        <div className="w-full h-15 flex justify-between mt-5">
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
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilesStep;
