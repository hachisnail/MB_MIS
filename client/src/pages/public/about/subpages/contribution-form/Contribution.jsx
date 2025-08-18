import { useState, useRef, useMemo } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import axiosClient from "../../../../../lib/axiosClient";
import ConfirmationModal from "../../../../../components/modals/ConfirmationModal";
import PopupModal from "../../../../../components/modals/PopupModal";
import NoticeStep from "./components/NoticeStep";
import DonorsStep from "./components/DonorsStep";
import TypeStep from "./components/TypeStep";
import DetailsStep from "./components/DetailsStep";
import AboutStep from "./components/AboutStep";
import FilesStep from "./components/FilesStep";

const initialFormData = {
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
};

const ContributionForm = ({ user }) => {
  const [formData, setFormData] = useState({
    ...initialFormData,
    userLoggedIn: !!user,
  });

  const [step, setStep] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const recaptchaRef = useRef(null);

  // Clear Form functions are now managed here
  const handleClear = () => setShowClearConfirm(true);
  const cancelClear = () => setShowClearConfirm(false);
  const confirmClear = () => {
    setFormData({
      ...initialFormData,
      userLoggedIn: !!user,
    });
    setStep(0);
    setShowClearConfirm(false);
  };

  const handleNext = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev + 1);
  };

  const handleBack = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev - 1);
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

      const form = new FormData();
      if (captchaToken) form.append("captchaToken", captchaToken);
      form.append("category", "private");
      formData.artifactImages.files.forEach((f) => form.append("files", f));
      formData.artifactRelatedImages.files.forEach((f) =>
        form.append("files", f)
      );
      formData.artifactDocuments.files.forEach((f) => form.append("files", f));

      const uploadRes = await axiosClient.post(
        "/auth/contribution/files",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const uploadedFiles = uploadRes.data.files;
      const artifactImages = uploadedFiles.slice(
        0,
        formData.artifactImages.files.length
      );
      const relatedImages = uploadedFiles.slice(
        formData.artifactImages.files.length,
        formData.artifactImages.files.length +
          formData.artifactRelatedImages.files.length
      );
      const artifactDocuments = uploadedFiles.slice(
        formData.artifactImages.files.length +
          formData.artifactRelatedImages.files.length
      );

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
      setShowSuccessModal(true);
    } catch (err) {
      setApiError(err.response?.data?.message || err.message);
      setShowSubmitConfirm(false);
    }
  };

  const steps = useMemo(() => {
    const baseSteps = [
      <NoticeStep
        key="notice"
        initialData={formData}
        onNext={handleNext}
        setFormData={setFormData}
        // onClearForm={handleClear}
      />,
      <DonorsStep
        key="donors"
        initialData={formData}
        onNext={handleNext}
        onBack={handleBack}
        setFormData={setFormData}
        onClearForm={handleClear}
      />,
      <TypeStep
        key="type"
        initialData={formData}
        onNext={handleNext}
        onBack={handleBack}
        setFormData={setFormData}
        onClearForm={handleClear}
      />,
    ];

    if (formData.type === "lending") {
      baseSteps.push(
        <DetailsStep
          key="details"
          initialData={formData}
          onNext={handleNext}
          onBack={handleBack}
          setFormData={setFormData}
          onClearForm={handleClear}
        />
      );
    }

    baseSteps.push(
      <AboutStep
        key="about"
        initialData={formData}
        onNext={handleNext}
        onBack={handleBack}
        setFormData={setFormData}
        onClearForm={handleClear}
      />
    );
    baseSteps.push(
      <FilesStep
        key="files"
        initialData={formData}
        onNext={() => setShowSubmitConfirm(true)}
        onBack={handleBack}
        setFormData={setFormData}
        onClearForm={handleClear}
      />
    );

    return baseSteps;
  }, [formData]);

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col pt-25">
      {steps[step]}

      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        size="invisible"
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

      <PopupModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Submission Successful!"
        message="Your contribution has been successfully submitted and is awaiting review."
        buttonText="OK"
        type="success"
        theme="light"
      />
    </div>
  );
};

export default ContributionForm;
