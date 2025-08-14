import { useState, useMemo } from "react";
import usePrompt from "../../../../hooks/usePrompt";

import NoticeStep from "./NoticeStep";
import DonorsStep from "./DonorsStep";
import TypeStep from "./TypeStep";
import DetailsStep from "./DetailsStep";
import AboutStep from "./AboutStep";
import FilesStep from "./FilesStep";

const Contribution = () => {
  const [formData, setFormData] = useState({
  firstName: "",
  lastName: "",
  birthDate: null, // DateInput expects null or Date
  sex: "",
  email: "",
  contact: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  organization: "",
  artifactTitle: "",
  artifactDescription: "",
  artifactImages: {
    files: [],
    url: "",
  },
  artifactRelatedImages: {
    files: [],
    url: "",
  },
  artifactDocuments: {
    files: [],
    url: "",
  },
  narrative: "",
  acquisitionDetails: "",
  additionalInfo: "",
  type: "",
  lendingReason: "",
  lendDuration: {
    from: null,
    to: null,
  },
  lendConditions: "",
  lendLiabilities: "",
});

  const [step, setStep] = useState(0);

  const handleNext = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev + 1);
  };

  const handleBack = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev - 1);
  };

  const handleSubmitFinal = (data) => {
    const finalData = { ...formData, ...data };
    console.log("Final submission:", finalData);
    // API submission here
  };

  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    Object.keys(formData).length > 0
  );

  const steps = useMemo(() => {
    const baseSteps = [
      <NoticeStep
        key="notice"
        initialData={formData}
        onNext={handleNext}
        setFormData={setFormData} // enable live updates for usePrompt
      />,
      <DonorsStep
        key="donors"
        initialData={formData}
        onNext={handleNext}
        onBack={handleBack}
        setFormData={setFormData} // live updates
      />,
      <TypeStep
        key="type"
        initialData={formData}
        onNext={handleNext}
        onBack={handleBack}
        setFormData={setFormData} // live updates
      />,
    ];

    if (formData.type === "lending") {
      baseSteps.push(
        <DetailsStep
          key="details"
          initialData={formData}
          onNext={handleNext}
          onBack={handleBack}
          setFormData={setFormData} // live updates
        />
      );
    }

    baseSteps.push(
      <AboutStep
        key="about"
        initialData={formData}
        onNext={handleNext}
        onBack={handleBack}
        setFormData={setFormData} // live updates
      />
    );

    baseSteps.push(
      <FilesStep
        key="files"
        initialData={formData}
        onNext={handleSubmitFinal}
        onBack={handleBack}
        setFormData={setFormData} // optional, in case FilesStep has editable fields
      />
    );

    return baseSteps;
  }, [formData]);

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col pt-25">
      {PromptModal} {/* Render the prompt modal */}
      {steps[step]}
    </div>
  );
};

export default Contribution;
