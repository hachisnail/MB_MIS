import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import {   DateInput,
  FormInput,
  DropdownInput,
  ContactNumberInput,
  EmailInput, } from "../../../../../../features/FormUtilities";
import { TypedDropdown, useAddressLogic } from "@/features/AddressDropdownSystem";

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
    setValue,
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
    getFilteredProvinces,
    getFilteredCities,
    getFilteredBarangays,
    isLoadingProvinces,
    isLoadingCities,
    isLoadingBarangays,
    provincesError,
    citiesError,
    barangaysError
  } = useAddressLogic();

  // Handle address changes and sync with form
  const handleProvinceChange = (province) => {
    setSelectedProvince(province);
    const provinceName = province?.name || '';
    setValue('province', provinceName, { shouldValidate: true });
    setValue('city', '', { shouldValidate: false });
    setValue('barangay', '', { shouldValidate: false });
    setFormData(prev => ({ ...prev, province: provinceName, city: '', barangay: '' }));
    setIsDirty(true);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    const cityName = city?.name || '';
    setValue('city', cityName, { shouldValidate: true });
    setValue('barangay', '', { shouldValidate: false });
    setFormData(prev => ({ ...prev, city: cityName, barangay: '' }));
    setIsDirty(true);
  };

  const handleBarangayChange = (barangay) => {
    setSelectedBarangay(barangay);
    const barangayName = barangay?.name || '';
    setValue('barangay', barangayName, { shouldValidate: true });
    setFormData(prev => ({ ...prev, barangay: barangayName }));
    setIsDirty(true);
  };

  // Initialize address selections from form data
  useEffect(() => {
    if (initialData.province && provinces.length > 0) {
      const prov = provinces.find((p) => p.name === initialData.province);
      if (prov) setSelectedProvince(prov);
    }
  }, [initialData.province, provinces]);

  useEffect(() => {
    if (initialData.city && cities.length > 0) {
      const city = cities.find((c) => c.name === initialData.city);
      if (city) setSelectedCity(city);
    }
  }, [initialData.city, cities]);

  useEffect(() => {
    if (initialData.barangay && barangays.length > 0) {
      const barangay = barangays.find((b) => b.name === initialData.barangay);
      if (barangay) setSelectedBarangay(barangay);
    }
  }, [initialData.barangay, barangays]);

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

  const handleFormSubmit = (data) => {
    // The form data already includes the address values from setValue calls
    onNext(data);
  };

  return (
    <div className="w-[85rem] h-fit ">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
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
                <div className="w-[32rem]">
                  {/* Hidden input for province */}
                  <input type="hidden" {...register("province")} />
                  <TypedDropdown
                    placeholder="Type to search provinces..."
                    options={provinces}
                    selectedItem={selectedProvince}
                    onChange={handleProvinceChange}
                    isLoading={isLoadingProvinces}
                    error={errors.province?.message || provincesError}
                    filterFunction={getFilteredProvinces}
                    maxSuggestions={10}
                    variant="rounded"
                    size="medium"
                  />
                </div>
                <div className="w-[32rem]">
                  {/* Hidden input for city */}
                  <input type="hidden" {...register("city")} />
                  <TypedDropdown
                    placeholder={selectedProvince ? "Type to search cities..." : "Select province first"}
                    options={cities}
                    selectedItem={selectedCity}
                    onChange={handleCityChange}
                    disabled={!selectedProvince}
                    isLoading={isLoadingCities}
                    error={errors.city?.message || citiesError}
                    filterFunction={getFilteredCities}
                    maxSuggestions={10}
                    variant="rounded"
                    size="medium"
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
                <div className="w-[32rem]">
                  {/* Hidden input for barangay */}
                  <input type="hidden" {...register("barangay")} />
                  <TypedDropdown
                    placeholder={selectedCity ? "Type to search barangays..." : "Select city first"}
                    options={barangays}
                    selectedItem={selectedBarangay}
                    onChange={handleBarangayChange}
                    disabled={!selectedCity}
                    isLoading={isLoadingBarangays}
                    error={errors.barangay?.message || barangaysError}
                    filterFunction={getFilteredBarangays}
                    maxSuggestions={12}
                    variant="rounded"
                    size="medium"
                  />
                </div>
                <FormInput
                  placeholder="Street"
                  register={register}
                  name="street"
                  error={errors.street}
                  className="w-[32rem]"
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
                onClick={() => { onClearForm() }}
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
