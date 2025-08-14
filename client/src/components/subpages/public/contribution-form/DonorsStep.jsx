import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import {
  DateInput,
  FormInput,
  DropdownInput,
  ContactNumberInput,
  EmailInput,
} from "../../../../features/FormUtilities";
import useAddressLogic from "@/hooks/useAddressLogic";

const schema = yup.object({
  firstName: yup.string().required("First Name is required"),
  lastName: yup.string().required("Last Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  birthDate: yup
    .date()
    .typeError("Please select a valid date")
    .required("Birth date is required")
    .max(new Date(), "Birth date cannot be in the future")
    .min(new Date(1900, 0, 1), "Birth date is too far in the past"),
  sex: yup.string().required("Sex is required"),
  contact: yup
    .string()
    .required("Contact number is required")
    .matches(/^\d{10,15}$/, "Invalid contact number"),
  organization: yup.string().nullable(),
  province: yup.string().required("Province is required"),
  city: yup.string().required("City is required"),
  barangay: yup.string().required("Barangay is required"),
  street: yup.string().nullable(),
});

const DonorsStep = ({
  initialData,
  onNext,
  onBack,
  setFormData,
  onClearForm,
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

  const {
    provinces,
    cities,
    barangays,
    selectedProvince,
    selectedCity,
    selectedBarangay,
    setSelectedProvince,
    setSelectedCity,
    setSelectedBarangay,
  } = useAddressLogic();

  const watchProvince = watch("province");
  const watchCity = watch("city");

  useEffect(() => {
    if (watchProvince) {
      const prov = provinces.find((p) => p.name === watchProvince);
      setSelectedProvince(prov || null);
    }
  }, [watchProvince, provinces]);

  useEffect(() => {
    if (watchCity) {
      const c = cities.find((c) => c.name === watchCity);
      setSelectedCity(c || null);
    }
  }, [watchCity, cities]);

  useEffect(() => {
    const subscription = watch((values) => {
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
            <span className="text-5xl font-hina">Tell us about yourself.</span>
          </div>
          <div className="w-full h-full pt-10 flex flex-col justify-between">
            {/* Name */}
            <div className="w-full h-fit flex ">
              <label className="min-w-40 text-2xl font-semibold">
                Name
                <span className="text-red-700"> *</span>
              </label>
              <div className="w-full h-fit flex justify-between">
                <FormInput
                  placeholder="First Name"
                  register={register}
                  name="firstName"
                  error={errors.firstName}
                  className="w-[32rem]"
                />
                <FormInput
                  placeholder="Last Name"
                  register={register}
                  name="lastName"
                  error={errors.lastName}
                  className="w-[32rem]"
                />
              </div>
            </div>

            {/* Birthdate & Sex */}
            <div className="w-full h-fit flex">
              <label className="min-w-40 text-2xl font-semibold">
                Birthdate
                <span className="text-red-700"> *</span>
              </label>
              <div className="w-full h-fit flex justify-between">
                <div className="w-[32rem] flex justify-end">
                  <DateInput
                    control={control}
                    name="birthDate"
                    mode="single"
                    placeholder="Select your birthdate"
                    maxDate={new Date()}
                    minDate={new Date(1900, 0, 1)}
                    defaultMonth={new Date()}
                    error={errors.birthDate}
                    className="w-[26rem]"
                  />
                </div>
                <div className="w-[32rem] flex">
                  <div className="flex w-full items-between">
                    <label className="min-w-25 text-2xl font-semibold">
                      Sex
                      <span className="text-red-700"> *</span>
                    </label>
                    <DropdownInput
                      control={control}
                      name="sex"
                      error={errors.sex}
                      className="w-[26rem]"
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Email */}
            <div className="w-full h-fit flex">
              <label className="min-w-40 text-2xl font-semibold">
                Contact
                <span className="text-red-700"> *</span>
              </label>
              <div className="w-full flex justify-between">
                <div className="w-[32rem] flex justify-end">
                  <ContactNumberInput
                    control={control}
                    name="contact"
                    error={errors.contact}
                    className="w-[26rem]"
                  />
                </div>
                <div className="w-[32rem] flex">
                  <div className="flex w-full items-between">
                    <label className="min-w-25 text-2xl font-semibold">
                      Email
                      <span className="text-red-700"> *</span>
                    </label>
                    <div className="w-full h-fit flex justify-end">
                      <EmailInput
                        control={control}
                        name="email"
                        error={errors.email}
                        className="w-[26rem]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="w-full flex">
              <label className="min-w-40 text-2xl font-semibold">
                Organization
              </label>
              <div className="w-full h-fit flex justify-between">
                <FormInput
                  placeholder="Organization"
                  register={register}
                  name="organization"
                  error={errors.organization}
                  className="w-full"
                />
              </div>
            </div>

            {/* Address */}
            <div className="w-full h-fit flex">
              <label className="min-w-40 text-2xl font-semibold">
                Province
                <span className="text-red-700"> *</span>
              </label>
              <div className="w-full h-fit flex justify-between">
                <div className="w-[32rem] flex justify-end">
                  <DropdownInput
                    control={control}
                    name="province"
                    className="w-[26rem]"
                    options={provinces.map((p) => ({
                      value: p.name,
                      label: p.name,
                    }))}
                    error={errors.province}
                  />
                </div>
                <div className="w-[32rem] flex justify-end">
                  <span className="text-2xl min-w-25 font-semibold">
                    City
                    <span className="text-red-700"> *</span>
                  </span>
                  <DropdownInput
                    control={control}
                    name="city"
                    className="w-[26rem]"
                    options={cities.map((c) => ({
                      value: c.name,
                      label: c.name,
                    }))}
                    error={errors.city}
                    disabled={!selectedProvince}
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-fit flex">
              <label className="min-w-40 text-2xl font-semibold">
                Barangay
                                <span className="text-red-700"> *</span>

              </label>
              <div className="w-full h-fit flex justify-between">
                <div className="w-[32rem] flex justify-end">
                  <DropdownInput
                    control={control}
                    name="barangay"
                    options={barangays.map((b) => ({
                      value: b.name,
                      label: b.name,
                    }))}
                    error={errors.barangay}
                    disabled={!selectedCity}
                    className="w-[26rem]"
                  />
                </div>
                <div className="w-[32rem] flex justify-end">
                  <span className="text-2xl min-w-25 font-semibold">
                    Street
                  </span>
                  <FormInput
                    placeholder="Street"
                    register={register}
                    name="street"
                    error={errors.street}
                    className="w-[26rem]"
                    disabled={!selectedCity}
                  />
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
                onClick={() => {
                  onClearForm();
                }}
                className=" w-40 hover:bg-black rounded-md text-2xl bg-gray-900 text-white"
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

export default DonorsStep;
