import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState, useRef, useCallback } from "react";
import { FormInput, DropdownInput } from "../../../../features/FormUtilities";
import { useController } from "react-hook-form";

// Custom FileInput component without URL option - matches contribution form size
const RequestLetterFileInput = ({ control, name, className = "" }) => {
  const {
    field: { value = [], onChange },
    fieldState: { error = "" },
  } = useController({ name, control });

  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileList, setFileList] = useState(value || []);

  // Sync local state with form value
  useEffect(() => {
    setFileList(value || []);
    if (!value || value.length === 0) {
      // Reset file input when form is cleared
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [value]);

  const updateValue = (files) => {
    setFileList(files);
    onChange(files);
  };

  const handleFiles = useCallback(
    (files) => {
      if (files && files.length > 0) {
        const newFiles = Array.from(files);
        const updatedFiles = [...fileList, ...newFiles];
        updateValue(updatedFiles);
      }
    },
    [fileList]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index) => {
    const newFiles = [...fileList];
    newFiles.splice(index, 1);
    updateValue(newFiles);
  };

  return (
    <div className={`${className} flex flex-col`}>
      <div className="flex gap-x-5">
        <div
          className={`min-w-[10rem] h-[6rem] border rounded-3xl flex flex-col items-center justify-center cursor-pointer p-4 ${dragging ? "border-blue-500 bg-blue-50" : "border-black"
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-xs">
            Drag or <span className="text-[#6A60FF]">Choose Files</span>
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>

        {fileList.length > 0 && (
          <div className="w-[15rem] h-[6rem] border border-gray-200 rounded-lg">
            <div
              className="h-full overflow-y-scroll p-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#6b7280 #f3f4f6'
              }}
            >
              <ul className="space-y-1 pr-2">
                {fileList.map((f, i) => (
                  <li key={i} className="flex items-center gap-1 p-1 rounded-sm hover:bg-gray-100">
                    <span className="text-xs truncate max-w-[6rem]" title={f.name}>
                      {f.name.length > 12 ? `${f.name.substring(0, 12)}...` : f.name}
                    </span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 flex-shrink-0 p-1"
                      onClick={() => removeFile(i)}
                      title="Remove file"
                    >
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
                        <path d="M4 7l16 0" />
                        <path d="M10 11l0 6" />
                        <path d="M14 11l0 6" />
                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="text-red-600 text-md h-6 pl-2">{error.message}</span>
      )}
    </div>
  );
};

const fileSchema = yup
  .array()
  .of(yup.mixed())
  .test(
    "required-files",
    "Please upload at least one request letter file",
    (value) => {
      return value && value.length > 0;
    }
  );

const schema = yup.object({
  purpose: yup.string().required("Purpose of visit is required"),
  populationCount: yup
    .number()
    .typeError("Population count must be a number")
    .required("Population count is required")
    .positive("Population count must be greater than 0")
    .integer("Population count must be a whole number")
    .max(30, "Population count cannot exceed 30 visitors"),
  requestLetterUpload: yup.mixed().when("purpose", {
    is: (purpose) => purpose === "Research Paper" || purpose === "School Field Trip",
    then: () => fileSchema.required("Request letter is required for this type of visit"),
    otherwise: () => yup.mixed().notRequired(),
  }),
});

const VisitDetailsStep = ({
  initialData,
  onNext,
  onBack,
  setFormData,
  onClearForm,
  markAsInteracted,
}) => {
  const [isDirty, setIsDirty] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: initialData,
    resolver: yupResolver(schema),
  });

  // Watch the purpose field to show/hide request letter upload
  const selectedPurpose = watch("purpose");
  const showRequestLetterUpload = selectedPurpose === "Research Paper" || selectedPurpose === "School Field Trip";

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

  const purposeOptions = [
    { value: "Research Paper", label: "Research Paper" },
    { value: "School Field Trip", label: "School Field Trip" },
    { value: "Museum Group Tour", label: "Museum Group Tour" },
    { value: "Interviews", label: "Interviews" },
    { value: "Collaboration Meetings", label: "Collaboration Meetings" },
    {
      value: "Photography or Media Projects",
      label: "Photography or Media Projects",
    },
    { value: "Conservation Consultation", label: "Conservation Consultation" },
  ];

  const engagements = [
    { label: "School Field Trip:", value: "Educational visits for students" },
    { label: "Museum Group Tour:", value: "Guided tours for visitor groups" },
    { label: "Interviews:", value: "Meeting museum staff" },
    { label: "Collaboration Meetings:", value: "Joint projects" },
    { label: "Photography / Media Projects:", value: "Shoots or filming" },
    { label: "Conservation Consultation:", value: "Advice/services" },
  ];

  return (
    <div className="w-[85rem] h-fit">
      <form
        onSubmit={handleSubmit((data) => onNext(data))}
        className="w-full h-[46rem] flex flex-col items-center justify-between"
      >
        <div className="w-full h-[40rem] flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
          <div className="w-full h-fit pb-5 border-b-1">
            <span className="text-5xl font-hina">Visit Details.</span>
          </div>
          <div className="w-full h-full pt-10 flex gap-x-5">
            <div className={`min-w-[28rem] flex flex-col gap-y-5 font-semibold ${showRequestLetterUpload ? 'pt-10' : 'pt-25'}`}>
              {/* Purpose of Visit */}
              <div className="w-full h-fit flex flex-col gap-y-2">
                <label className="text-2xl">Purpose</label>
                <DropdownInput
                  control={control}
                  name="purpose"
                  error={errors.purpose}
                  className="w-[26rem]"
                  options={purposeOptions}
                />
              </div>

              {/* Population Count */}
              <div className="w-full h-fit flex flex-col gap-y-2">
                <label className="text-2xl">Population</label>
                <FormInput
                  placeholder="Number of visitors"
                  register={register}
                  name="populationCount"
                  error={errors.populationCount}
                  type="number"
                  className="w-[26rem]"
                />
              </div>

              {/* Request Letter Upload - Conditional */}
              {showRequestLetterUpload && (
                <div className="w-full h-fit flex flex-col gap-y-2">
                  <label className="text-2xl">
                    Request Letter <span className="text-red-500">*</span>
                  </label>
                  <RequestLetterFileInput
                    control={control}
                    name="requestLetterUpload"
                    className="w-[70rem]"
                  />
                </div>
              )}
            </div>
            {/* Help guide section */}
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
                <span className="text-2xl font-semibold">
                  Purpose Information
                </span>
              </div>

              <div className="w-full h-fit flex flex-col gap-y-4 mt-4">
                <div>
                  <span className="text-xl font-semibold">
                    Document Access Request
                  </span>
                  <div className="mt-2 flex flex-col gap-y-1">
                    <span className="text-lg text-gray-600">
                      <b className="text-black">Research Paper:</b> Accessing
                      archives or materials for academic research
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xl font-semibold">Engagements</span>
                  <div className="mt-2 flex flex-col gap-y-1">
                    {engagements.map(({ label, value }) => {
                      return (
                        <span key={label} className="text-lg text-gray-600">
                          <b className="text-black">{label}</b> {value}
                        </span>
                      );
                    })}
                  </div>
                </div>
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
              className="w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VisitDetailsStep;
