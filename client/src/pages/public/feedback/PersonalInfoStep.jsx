import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import { FormInput, ContactNumberInput } from "@/features/FormUtilities";

const schema = yup.object({
  visitor_name: yup
    .string()
    .required("Name is required"),
  visitor_email: yup
    .string()
    .email("Invalid email")
    .nullable(),
  visitor_phone: yup
    .string()
    .nullable()
    .matches(/^(09|\+639)\d{9}$|^$/, "Invalid phone number format"),
}).test(
  'email-or-phone-required',
  'Either email or phone number is required',
  function (values) {
    return (values.visitor_email && values.visitor_email.trim()) ||
      (values.visitor_phone && values.visitor_phone.trim());
  }
);

const PersonalInfoStep = ({ initialData, onNext, onBack, visitorData = {} }) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: initialData,
    resolver: yupResolver(schema),
  });

  // Pre-fill with visitor data from token if available
  useEffect(() => {
    if (visitorData.visitor_name) {
      setValue("visitor_name", visitorData.visitor_name);
    }
    if (visitorData.visitor_email) {
      setValue("visitor_email", visitorData.visitor_email);
    }
  }, [visitorData, setValue]);

  const handleFormSubmit = (data) => {
    onNext(data);
  };

  return (
    <div className="w-[85rem] h-fit flex flex-col">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full flex flex-col shadow-md rounded-lg shadow-gray-500 px-20 py-10">

        {/* Header */}
        <div className="w-full pb-5 border-b mb-10">
          <span className="text-6xl font-hina">Your Information</span>
        </div>

        {/* Visitor Information */}
        <div className="w-full mb-10">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-base uppercase tracking-wide text-gray-500 block mb-3 font-semibold">
                Full Name <span className="text-red-500">*</span>
              </label>
              <FormInput
                register={register}
                name="visitor_name"
                placeholder="Enter your full name"
                error={errors.visitor_name}
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-base uppercase tracking-wide text-gray-500 block mb-3 font-semibold">
                  Email
                </label>
                <FormInput
                  register={register}
                  name="visitor_email"
                  type="email"
                  placeholder="your@email.com"
                  error={errors.visitor_email}
                />
              </div>

              <div>
                <label className="text-base uppercase tracking-wide text-gray-500 block mb-3 font-semibold">
                  Phone Number
                </label>
                <ContactNumberInput
                  control={control}
                  name="visitor_phone"
                  error={errors.visitor_phone}
                />
              </div>
            </div>
            <p className="text-base text-gray-500">
              * Either email or phone number is required for us to respond to your feedback
            </p>
          </div>
        </div>
      </form>

      {/* Action Buttons */}
      <div className="w-full flex justify-between mt-12 gap-4">
        <button
          type="button"
          onClick={() => onBack()}
          className="w-44 h-15 rounded-md bg-black text-white text-3xl hover:bg-gray-800"
        >
          Previous
        </button>
        <div className="flex gap-x-5 w-fit h-fit items-center">
          <span className="text-3xl font-semibold">Continue to ratings.</span>
          <button
            onClick={handleSubmit(handleFormSubmit)}
            className="w-30 h-15 flex items-center justify-center rounded-md bg-black text-white text-3xl hover:bg-gray-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 12l-10 0" />
              <path d="M20 12l-4 4" />
              <path d="M20 12l-4 -4" />
              <path d="M4 4l0 16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
