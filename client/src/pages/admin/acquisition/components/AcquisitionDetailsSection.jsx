import { InfoSection } from "./ViewPageRenderer";
import Timeline from "./Timeline"

export default function AcquisitionDetailsSection({
  acquisitionType = "lending",
  lendingReason = [],
  step,
  steps = [],
}) {
  const isLending = acquisitionType === "lending";

  return (
    <div
      className={`w-full min-h-[32rem] bg-[#1D1911] ${
        isLending && "rounded-r-4xl pb-8"
      }`}
    >
      {isLending ? (
        <InfoSection
          title="Reason For Lending"
          items={lendingReason}
          titleClassName="mb-2 text-white"
          labelClassName="font-hind font-medium text-xl 3xl:text-3xl text-[#CDC469]"
          valueClassName="block 3xl:text-4xl w-[calc(100%-2rem)] text-white text-2xl font-medium font-hind break-words"
          itemHeight="h-22"
          containerClassName="justify-end"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-fit h-fit flex flex-col items-center justify-center space-y-8">
            <span className="text-4xl font-bold text-white">Timeline</span>
            <Timeline currentStep={step} steps={steps} />
          </div>
        </div>
      )}
    </div>
  );
}
