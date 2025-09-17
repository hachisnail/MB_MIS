import { useRef, useState, useEffect } from "react";
import { Transition } from "@headlessui/react";

/**
 * Timeline
 * - variant="steps": original stepper timeline
 * - variant="percent": large, full-width progress bar (0..100)
 *    • thick rounded black border, capsule look (like your mock)
 *    • fill color uses hue from red(0%) -> green(100%)
 *    • percentage text on the left inside the bar
 *    • optional inline CTA button on the right, shown only at 100%
 */
export default function Timeline({
  // Steps variant props
  currentStep = 0,
  steps = [],
  size = 45,
  lineThickness = 7,

  // Percent variant props
  variant = "steps",          // "steps" | "percent"
  percent = 0,                // 0..100
  label = "Progress",         // a11y label
  widthClass = "w-full",      // full width by default
  barHeight = 72,             // px height of the big capsule
  roundedPx = 28,             // px corner radius on the capsule
  borderPx = 4,               // px border thickness

  // CTA that pops only at 100%
  showCompleteButton = false, // gate from parent (e.g. step===5 && percent===100)
  completeLabel = "Click to Complete Artifact Data",
  onComplete = () => {},
  completeLoading = false,
  completeDisabled = false,
}) {
  /* ---------------- Percent variant ---------------- */
  if (variant === "percent") {
    const pct = Math.max(0, Math.min(100, Math.round(percent)));

    // 0..100 => 0..120 (red -> green)
    const hue = Math.round((pct * 120) / 100);
    const fillColor = `hsl(${hue} 90% 45%)`;

    // Readable label color across the spectrum
    const labelColor = pct < 60 ? "#FFFFFF" : "#111111";

    const canShowButton = showCompleteButton && pct === 100;

    return (
      <div className="w-fit flex flex-col items-center justify-center space-y-3">
        <div className={`${widthClass}`}>
          <div
            className="relative overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={label}
            style={{
              height: barHeight,
              borderRadius: roundedPx,
              background: "#E6E6E6",         // track
              border: `${borderPx}px solid #111111`,
              boxShadow:
                "0 1px 0 rgba(0,0,0,0.35), inset 0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            {/* Filled portion */}
            <div
              className="absolute left-0 top-0 h-full transition-all duration-700 ease-in-out"
              style={{
                width: `${pct}%`,
                background: fillColor,
              }}
            />

            {/* Left label (80% Complete) */}
            <div
              className="absolute inset-0 flex items-center"
              style={{ paddingLeft: 24, gap: 10 }}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="font-extrabold select-none"
                  style={{
                    color: labelColor,
                    textShadow:
                      "0 1px 2px rgba(0,0,0,0.35), 0 0 2px rgba(0,0,0,0.25)",
                    fontSize: Math.max(20, Math.min(40, barHeight * 0.55)),
                    lineHeight: 1,
                  }}
                >
                  {pct}%
                </span>
                <span
                  className="font-semibold select-none"
                  style={{
                    color: labelColor,
                    textShadow:
                      "0 1px 2px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.15)",
                    fontSize: Math.max(14, Math.min(24, barHeight * 0.33)),
                    lineHeight: 1,
                  }}
                >
                  Complete
                </span>
              </div>
            </div>

            {/* CTA bubble on the right (only at 100%) */}
            {canShowButton && (
              <button
                type="button"
                onClick={onComplete}
                disabled={completeDisabled || completeLoading}
                className={`absolute right-4 md:right-5 top-1/2 -translate-y-1/2
                  px-5 md:px-6 py-2 md:py-2.5 rounded-full bg-white text-[#111] font-semibold
                  shadow-[0_4px_10px_rgba(0,0,0,0.25)]
                  border border-black
                  active:translate-y-[1px]
                  ${completeDisabled || completeLoading ? "opacity-60 cursor-not-allowed" : "hover:shadow-[0_6px_14px_rgba(0,0,0,0.28)]"}
                `}
                style={{ whiteSpace: "nowrap" }}
                aria-label={completeLabel}
              >
                {completeLoading ? "Working..." : completeLabel}
              </button>
            )}
          </div>
        </div>

        {label ? <p className="text-white text-base">{label}</p> : null}
      </div>
    );
  }

  /* ---------------- Steps variant (original) ---------------- */
  if (!steps.length) return null;

  const containerRef = useRef(null);
  const stepRefs = useRef([]);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !stepRefs.current[currentStep]) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const stepRect = stepRefs.current[currentStep].getBoundingClientRect();

    const containerLeft = containerRect.left;
    const stepCenter = stepRect.left + stepRect.width / 2;

    setProgressWidth(stepCenter - containerLeft);
  }, [currentStep, steps]);

  return (
    <div className="w-fit flex flex-col items-center justify-center space-y-8 ">
      <div ref={containerRef} className={`relative ${widthClass} flex items-center`}>
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
