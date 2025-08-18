import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import { FormInput } from "../../../../features/FormUtilities";
import { TypedDropdown, useAddressLogic } from "../../../../features/AddressDropdownSystem";

const schema = yup.object({
    province: yup.string().required("Province is required"),
    city: yup.string().required("City is required"),
    barangay: yup.string().required("Barangay is required"),
    street: yup.string().nullable(),
});

const AddressStep = ({
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

    const handleFormSubmit = (data) => {
        // The form data already includes the address values from setValue calls
        onNext(data);
    };

    return (
        <div className="w-[85rem] h-fit">
            <form
                onSubmit={handleSubmit(handleFormSubmit)}
                className="w-full h-[46rem] flex flex-col items-center justify-between"
            >
                <div className="w-full h-[40rem] flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
                    <div className="w-full h-fit pb-5 border-b-1">
                        <span className="text-5xl font-hina">Address Information.</span>
                    </div>
                    <div className="w-full h-full pt-10 flex flex-col justify-evenly">
                        {/* Province & City */}
                        <div className="w-full h-fit flex">
                            <label className="min-w-40 text-2xl font-semibold">Province</label>
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

                        {/* Barangay & Street */}
                        <div className="w-full h-fit flex">
                            <label className="min-w-40 text-2xl font-semibold">Barangay</label>
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
                                    placeholder="House number, street name, etc."
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

export default AddressStep;
