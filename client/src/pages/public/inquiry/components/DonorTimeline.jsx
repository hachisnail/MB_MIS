import { useRef, useState, useEffect } from "react";
import { Transition } from "@headlessui/react";

export default function DonorTimeline({
    timelineData = null,
    size = 45,
    lineThickness = 3, // thinner line like the second image
}) {
    const containerRef = useRef(null);
    const stepRefs = useRef([]);
    const [progressWidth, setProgressWidth] = useState(0);

    // Map timeline data to current step
    const mapTimelineStep = (timeline) => {
        if (!timeline) return 0;

        if (timeline.completed_at) return 4;
        if (timeline.on_delivery_at) return 3;
        if (timeline.moa_settled_at) return 2;
        if (timeline.pending_at) return 1;
        if (timeline.approved_at) return 0;
        return 0;
    };

    const currentStep = timelineData ? mapTimelineStep(timelineData) : 0;

    // Outline SVG icons (stroke only, no fills) using currentColor
    const MailIcon = () => (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2.2" />
            <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const ClockIcon = () => (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const EyeIcon = () => (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2.2" />
        </svg>
    );

    const BoxIcon = () => (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M21 7v10l-9 5V12l9-5zM3 7v10l9 5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
    );

    const CheckIcon = () => (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
            <path d="M8 12l3 3 5-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    // Define steps to match the second image's labels/order
    const steps = [
        { label: "Approve", icon: <MailIcon /> },
        { label: "Pending", icon: <ClockIcon /> },
        { label: "Moa Settled", icon: <EyeIcon /> },
        { label: "Transporting", icon: <BoxIcon /> },
        { label: "Completed", icon: <CheckIcon /> },
    ];

    useEffect(() => {
        if (!containerRef.current || !stepRefs.current[currentStep]) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const stepRect = stepRefs.current[currentStep].getBoundingClientRect();

        const containerLeft = containerRect.left;
        const stepCenter = stepRect.left + stepRect.width / 2;

        setProgressWidth(stepCenter - containerLeft);
    }, [currentStep, steps]);

    if (!steps.length) return null;

    return (
        <div className="w-fit flex flex-col items-center justify-center space-y-6">
            <div ref={containerRef} className="relative w-[40rem] flex items-center">
                {/* Background line (light gray) */}
                <div
                    className="absolute z-0 bg-[#c9c9c9]"
                    style={{
                        top: size / 2 - lineThickness / 2,
                        left: size / 2,
                        right: size / 2,
                        height: lineThickness,
                    }}
                />

                {/* Progress line (black) */}
                <div
                    className="absolute bg-black z-0 transition-all duration-700 ease-in-out"
                    style={{
                        top: size / 2 - lineThickness / 2,
                        left: size / 2,
                        height: lineThickness,
                        width: `${progressWidth}px`,
                    }}
                />

                {/* Steps */}
                <div
                    className="w-full relative z-10 grid"
                    style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(6rem, 1fr))` }}
                >
                    {steps.map((step, index) => {
                        const isPast = index < currentStep;
                        const isCurrent = index === currentStep;

                        return (
                            <div
                                key={index}
                                ref={(el) => (stepRefs.current[index] = el)}
                                className="flex flex-col items-center"
                            >
                                <Transition
                                    show
                                    appear
                                    enter="transform transition duration-500 ease-out"
                                    enterFrom="scale-75 opacity-0"
                                    enterTo="scale-100 opacity-100"
                                >
                                    <div
                                        className={`rounded-full border-[3px] flex items-center justify-center transition-all duration-500
                      ${isPast || isCurrent ? "border-black bg-white" : "border-[#bfbfbf] bg-white"}`}
                                        style={{ width: size, height: size }}
                                    >
                                        <div
                                            className={`w-[60%] h-[60%] transition-all duration-500
                        ${isPast || isCurrent ? "text-black" : "text-[#bfbfbf]"}`}
                                        >
                                            {step.icon}
                                        </div>
                                    </div>
                                </Transition>

                                <p className="text-sm md:text-base text-black mt-3 text-center w-[8rem]">
                                    {step.label}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Optional description per step (kept for API parity; add `description` to any step to show) */}
            {steps[currentStep]?.description && (
                <span className="text-black text-base md:text-lg w-[30rem] text-center">
                    {steps[currentStep].description}
                </span>
            )}
        </div>
    );
}
