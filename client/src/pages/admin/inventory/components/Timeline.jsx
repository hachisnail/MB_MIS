import { useRef, useState, useEffect } from "react";
import { Transition } from "@headlessui/react";

export default function Timeline({
  currentStep = 0,
  steps = [],
  size = 45, // circle diameter in px (instead of rem for pixel precision)
  lineThickness = 7, // thickness in px
}) {
  if (!steps.length) return null;

  const containerRef = useRef(null);
  const stepRefs = useRef([]);
  const [progressWidth, setProgressWidth] = useState(0);

  // Recalculate progress line whenever currentStep or layout changes
  useEffect(() => {
    if (!containerRef.current || !stepRefs.current[currentStep]) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const stepRect = stepRefs.current[currentStep].getBoundingClientRect();

    const containerLeft = containerRect.left;
    const stepCenter = stepRect.left + stepRect.width / 2;

    // progress = distance from container left to current step center
    setProgressWidth(stepCenter - containerLeft);
  }, [currentStep, steps]);

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-8">
      <div ref={containerRef} className="relative w-[40rem] flex items-center">
        {/* Background line */}
        <div
          className="absolute z-0 bg-[#777570]"
          style={{
            top: size / 2 - lineThickness / 2,
            left: size / 2,
            right: size / 2,
            height: lineThickness,
          }}
        />

        {/* Progress line */}
        <div
          className="absolute bg-white z-0 transition-all duration-700 ease-in-out"
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
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(6rem, 1fr))`,
          }}
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
                    className={`rounded-full border-[8px] flex items-center justify-center transition-all duration-500 ${
                      isPast
                        ? "bg-[#1D1911] border-white"
                        : isCurrent
                        ? "bg-yellow-400 border-white"
                        : "bg-[#1D1911] border-[#777570]"
                    }`}
                    style={{
                      width: size,
                      height: size,
                    }}
                  />
                </Transition>
                <p className="text-lg text-white mt-3 text-center w-[8rem]">
                  {typeof step === "string" ? step : step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step description */}
      {steps[currentStep]?.description && (
        <span className="text-white text-xl w-[30rem] text-center">
          {steps[currentStep].description}
        </span>
      )}
    </div>
  );
}
