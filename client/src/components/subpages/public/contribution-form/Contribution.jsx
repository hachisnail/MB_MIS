import { useState, useRef, useMemo } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import axiosClient from "../../../../lib/axiosClient";
import ConfirmationModal from "../../../modals/ConfirmationModal";
import PopupModal from "../../../modals/PopupModal";
import NoticeStep from "./NoticeStep";
import DonorsStep from "./DonorsStep";
import TypeStep from "./TypeStep";
import DetailsStep from "./DetailsStep";
import AboutStep from "./AboutStep";
import FilesStep from "./FilesStep";

const ContributionForm = ({ user }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: null,
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
    artifactImages: { files: [], url: "" },
    artifactRelatedImages: { files: [], url: "" },
    artifactDocuments: { files: [], url: "" },
    narrative: "",
    acquisitionDetails: "",
    additionalInfo: "",
    type: "",
    lendingReason: "",
    lendDuration: { from: null, to: null },
    lendConditions: "",
    lendLiabilities: "",
    userLoggedIn: !!user, // new flag
  });

  const [step, setStep] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [apiError, setApiError] = useState(null);

  const recaptchaRef = useRef(null);

  const handleNext = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev + 1);
  };

  const handleBack = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev - 1);
  };

  const handleClear = () => setShowClearConfirm(true);
  const cancelClear = () => setShowClearConfirm(false);
  const confirmClear = () => {
    setFormData({
      firstName: "",
      lastName: "",
      birthDate: null,
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
      artifactImages: { files: [], url: "" },
      artifactRelatedImages: { files: [], url: "" },
      artifactDocuments: { files: [], url: "" },
      narrative: "",
      acquisitionDetails: "",
      additionalInfo: "",
      type: "",
      lendingReason: "",
      lendDuration: { from: null, to: null },
      lendConditions: "",
      lendLiabilities: "",
      userLoggedIn: !!user,
    });
    setStep(0);
    setShowClearConfirm(false);
  };

  const handleSubmitFinal = async () => {
    try {
      let captchaToken = null;

      const hasPrivateFiles =
        formData.artifactImages.files.length ||
        formData.artifactRelatedImages.files.length ||
        formData.artifactDocuments.files.length;

      if (!formData.userLoggedIn && hasPrivateFiles) {
        if (!recaptchaRef.current) throw new Error("Captcha not ready");
        captchaToken = await recaptchaRef.current.executeAsync();
        recaptchaRef.current.reset();
      }

      // Upload files first
      const form = new FormData();
      if (captchaToken) form.append("captchaToken", captchaToken);
      form.append("category", "private");
      formData.artifactImages.files.forEach((f) => form.append("files", f));
      formData.artifactRelatedImages.files.forEach((f) => form.append("files", f));
      formData.artifactDocuments.files.forEach((f) => form.append("files", f));

      const uploadRes = await axiosClient.post("/auth/contribution/files", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFiles = uploadRes.data.files;

      // Map uploaded files back to fields
      const artifactImages = uploadedFiles.slice(0, formData.artifactImages.files.length);
      const relatedImages = uploadedFiles.slice(
        formData.artifactImages.files.length,
        formData.artifactImages.files.length + formData.artifactRelatedImages.files.length
      );
      const artifactDocuments = uploadedFiles.slice(
        formData.artifactImages.files.length + formData.artifactRelatedImages.files.length
      );

      // Submit contribution data
      await axiosClient.post("/auth/contribution", {
        ...formData,
        artifactImages,
        artifactRelatedImages: relatedImages,
        artifactDocuments,
        captchaToken,
        category: "private",
      });

      confirmClear();
      setShowSubmitConfirm(false);
    } catch (err) {
      setApiError(err.response?.data?.message || err.message);
      setShowSubmitConfirm(false);
    }
  };

  const steps = useMemo(() => {
    const baseSteps = [
      <NoticeStep key="notice" initialData={formData} onNext={handleNext} setFormData={setFormData} />,
      <DonorsStep key="donors" initialData={formData} onNext={handleNext} onBack={handleBack} setFormData={setFormData} />,
      <TypeStep key="type" initialData={formData} onNext={handleNext} onBack={handleBack} setFormData={setFormData} />,
    ];

    if (formData.type === "lending") {
      baseSteps.push(<DetailsStep key="details" initialData={formData} onNext={handleNext} onBack={handleBack} setFormData={setFormData} />);
    }

    baseSteps.push(<AboutStep key="about" initialData={formData} onNext={handleNext} onBack={handleBack} setFormData={setFormData} />);
    baseSteps.push(<FilesStep key="files" initialData={formData} onNext={() => setShowSubmitConfirm(true)} onBack={handleBack} setFormData={setFormData} />);

    return baseSteps;
  }, [formData]);

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col pt-25">
      {steps[step]}

      <button
        onClick={handleClear}
        className="absolute top-5 right-5 p-2 bg-red-600 text-white rounded"
      >
        Clear Form
      </button>

      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        size="normal"
        ref={recaptchaRef}
      />

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={cancelClear}
        onConfirm={confirmClear}
        title="Clear Form?"
        message="You have unsaved changes. Are you sure you want to clear the form?"
        type="question"
        theme="light"
      />

      <ConfirmationModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmitFinal}
        title="Confirm Submission?"
        message="Are you sure you want to submit this contribution?"
        type="question"
        theme="light"
      />

      <PopupModal
        isOpen={!!apiError}
        onClose={() => setApiError(null)}
        title="Submission Error"
        message={apiError}
        buttonText="Close"
        type="error"
        theme="light"
      />
    </div>
  );
};

export default ContributionForm;
