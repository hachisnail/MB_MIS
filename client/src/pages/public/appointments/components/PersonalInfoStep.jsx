import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
    FormInput,
    EmailInput,
    ContactNumberInput,
} from "../../../../features/FormUtilities";

const schema = yup.object({
    firstName: yup.string().required("First Name is required"),
    lastName: yup.string().required("Last Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    phone: yup
        .string()
        .nullable()
        .matches(/^(09|\+639)\d{9}$/, "Invalid phone number format"),
    organization: yup.string().nullable(),
});

const PersonalInfoStep = ({
    initialData,
    onNext,
    onBack,
    onClearForm,
}) => {
    const {
        register,
        handleSubmit,
        control,
        getValues,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: initialData,
        resolver: yupResolver(schema),
    });

    return (
        <div className="w-[85rem] h-fit">
            <form
                onSubmit={handleSubmit((data) => onNext(data))}
                className="w-full h-[46rem] flex flex-col items-center justify-between"
            >
                <div className="w-full h-[40rem] flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
                    <div className="w-full h-fit pb-5 border-b-1">
                        <span className="text-5xl font-hina">Tell us about yourself.</span>
                    </div>
                    <div className="w-full h-full pt-10 flex flex-col justify-evenly">
                        {/* Name */}
                        <div className="w-full h-fit flex">
                            <label className="min-w-40 text-2xl font-semibold">Name</label>
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

                        {/* Email & Phone */}
                        <div className="w-full h-fit flex">
                            <label className="min-w-40 text-2xl font-semibold">Contact</label>
                            <div className="w-full flex justify-between">
                                <div className="w-[32rem] flex justify-end">
                                    <EmailInput
                                        control={control}
                                        name="email"
                                        error={errors.email}
                                        className="w-[26rem]"
                                    />
                                </div>
                                <div className="w-[32rem] flex">
                                    <div className="flex w-full items-between">
                                        <label className="min-w-25 text-2xl font-semibold">
                                            Phone
                                        </label>
                                        <div className="w-full h-fit flex justify-end">
                                            <ContactNumberInput
                                                control={control}
                                                name="phone"
                                                error={errors.phone}
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
                                    placeholder="School/Institution/etc"
                                    register={register}
                                    name="organization"
                                    error={errors.organization}
                                    className="w-full"
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

export default PersonalInfoStep;
