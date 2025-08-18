import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import { FormInput, DropdownInput } from "../../../../features/FormUtilities";

const schema = yup.object({
    purpose: yup.string().required("Purpose of visit is required"),
    populationCount: yup
        .number()
        .typeError("Population count must be a number")
        .required("Population count is required")
        .positive("Population count must be greater than 0")
        .integer("Population count must be a whole number"),
});

const VisitDetailsStep = ({
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

    const purposeOptions = [
        { value: "Research Paper", label: "Research Paper" },
        { value: "School Field Trip", label: "School Field Trip" },
        { value: "Museum Group Tour", label: "Museum Group Tour" },
        { value: "Interviews", label: "Interviews" },
        { value: "Collaboration Meetings", label: "Collaboration Meetings" },
        { value: "Photography or Media Projects", label: "Photography or Media Projects" },
        { value: "Conservation Consultation", label: "Conservation Consultation" },
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
                        <div className="min-w-[28rem] flex flex-col gap-y-5 pt-25 font-semibold">
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
                                <span className="text-2xl font-semibold">Purpose Information</span>
                            </div>

                            <div className="w-full h-fit flex flex-col gap-y-4 mt-4">
                                <div>
                                    <span className="text-xl font-semibold">Document Access Request</span>
                                    <div className="mt-2">
                                        <span className="text-lg text-gray-600">
                                            <b className="text-black">Research Paper:</b> Accessing archives or materials for academic research
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xl font-semibold">Engagements</span>
                                    <div className="mt-2 flex flex-col gap-y-1">
                                        <span className="text-lg text-gray-600">
                                            <b className="text-black">School Field Trip:</b> Educational visits for students
                                        </span>
                                        <span className="text-lg text-gray-600">
                                            <b className="text-black">Museum Group Tour:</b> Guided tours for visitor groups
                                        </span>
                                        <span className="text-lg text-gray-600">
                                            <b className="text-black">Interviews:</b> Meeting museum staff
                                        </span>
                                        <span className="text-lg text-gray-600">
                                            <b className="text-black">Collaboration Meetings:</b> Joint projects
                                        </span>
                                        <span className="text-lg text-gray-600">
                                            <b className="text-black">Photography / Media Projects:</b> Shoots or filming
                                        </span>
                                        <span className="text-lg text-gray-600">
                                            <b className="text-black">Conservation Consultation:</b> Advice/services
                                        </span>
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
