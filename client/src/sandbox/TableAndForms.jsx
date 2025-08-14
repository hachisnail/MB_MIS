import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Schemas for each step
const step1Schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
});

const step2Schema = yup.object().shape({
  type: yup.string().required("Type is required"),
  file: yup
    .mixed()
    .required("File is required")
    .test(
      "fileSize",
      "File too large",
      (value) => value && value[0]?.size <= 5_000_000
    )
    .test(
      "fileType",
      "Unsupported file type",
      (value) =>
        value && ["image/jpeg", "image/png", "application/pdf"].includes(value[0]?.type)
    ),
});

export default function TableAndForms() {
  const [step, setStep] = useState(1);

  // Use single form state across all steps
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm({
    mode: "onBlur",
    resolver: yupResolver(step === 1 ? step1Schema : step2Schema),
  });

  const nextStep = async () => {
    const valid = await trigger(); // validate current step
    if (valid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

const onSubmit = (data) => {
  console.log("Final form data:", data);

  // Convert file to Base64 string
  const file = data.file[0];
  const reader = new FileReader();
  reader.onloadend = () => {
    const storedData = {
      name: data.name,
      email: data.email,
      type: data.type,
      fileName: file.name,
      fileData: reader.result, // Base64 encoded string
    };

    // Store in localStorage
    localStorage.setItem("multiStepFormData", JSON.stringify(storedData));
    console.log("Form data saved to localStorage!");
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    // If no file (just in case)
    const storedData = {
      name: data.name,
      email: data.email,
      type: data.type,
      fileName: null,
      fileData: null,
    };
    localStorage.setItem("multiStepFormData", JSON.stringify(storedData));
    console.log("Form data saved to localStorage!");
  }
};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 max-w-md mx-auto">
      {step === 1 && (
        <>
          <div>
            <label className="block font-semibold">Name</label>
            <input {...register("name")} className="border p-2 rounded w-full" />
            <p className="text-red-500 text-sm">{errors.name?.message}</p>
          </div>

          <div>
            <label className="block font-semibold">Email</label>
            <input {...register("email")} className="border p-2 rounded w-full" />
            <p className="text-red-500 text-sm">{errors.email?.message}</p>
          </div>

          <button type="button" onClick={nextStep} className="bg-blue-500 text-white px-4 py-2 rounded">
            Next
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <label className="block font-semibold">Type</label>
            <input {...register("type")} className="border p-2 rounded w-full" />
            <p className="text-red-500 text-sm">{errors.type?.message}</p>
          </div>

          <div>
            <label className="block font-semibold">File Upload</label>
            <input type="file" {...register("file")} className="border p-2 rounded w-full" />
            <p className="text-red-500 text-sm">{errors.file?.message}</p>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="bg-gray-500 text-white px-4 py-2 rounded">
              Previous
            </button>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
              Submit
            </button>
          </div>
        </>
      )}
    </form>
  );
}
