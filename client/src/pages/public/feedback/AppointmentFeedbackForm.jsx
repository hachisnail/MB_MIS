import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import NoticeStep from "./NoticeStep";
import PersonalInfoStep from "./PersonalInfoStep";
import RatingsStep from "./RatingsStep";
import ReviewStep from "./ReviewStep";
import Toast from "@/features/Toast";
import SubmitButton from "@/features/SubmitButton";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

const AppointmentFeedbackForm = ({ appointmentId, appointmentInfo, onSuccess, isWalkIn = false }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "info", message: "" });

  const [formData, setFormData] = useState({
    visitor_name: "",
    visitor_email: "",
    visitor_phone: "",
    accessibility_booking: 0,
    accessibility_availability: 0,
    staff_helpfulness: 0,
    staff_communication: 0,
    facility_cleanliness: 0,
    facility_comfort: 0,
    process_clarity: 0,
    process_timeliness: 0,
    service_expectations: 0,
    service_quality: 0,
    comments: "",
  });

  const [comments, setComments] = useState("");
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const handleNext = (data) => {
    if (currentStep === 0) {
      // NoticeStep - no data
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 1) {
      // PersonalInfoStep - save visitor info
      setFormData({ ...formData, ...data });
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      // RatingsStep Part 1 - save ratings
      setFormData({ ...formData, ...data });
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      // RatingsStep Part 2 - save ratings and show confirmation
      setFormData({ ...formData, ...data });
      setShowConfirmSubmit(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmSubmit(false);
    await submitFeedback();
  };

  const handleCancelSubmit = () => {
    setShowConfirmSubmit(false);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitFeedback = async () => {
    setIsSubmitting(true);
    try {
      // Validate email or phone is provided
      if (!formData.visitor_email?.trim() && !formData.visitor_phone?.trim()) {
        setToast({
          type: "error",
          message: "Either email or phone number is required"
        });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        comments: comments,
        appointment_id: appointmentId || null
      };

      const endpoint = appointmentId
        ? "feedback/appointment/submit"
        : "feedback/walk-in/submit";

      const response = await axiosClient.post(
        endpoint,
        payload
      );

      setToast({
        type: "success",
        message: "Thank you! Your feedback has been submitted successfully.",
      });

      // Call onSuccess callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Error submitting feedback. Please try again.";
      console.error("Full error response:", err.response?.data);
      setToast({ type: "error", message: errorMsg });
      console.error("Error submitting feedback:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-10">
      {toast.message && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, message: "" })}
        />
      )}

      <div className="w-full flex flex-col items-center justify-between">
        {currentStep === 0 && (
          <NoticeStep onNext={handleNext} />
        )}

        {currentStep === 1 && (
          <PersonalInfoStep
            initialData={{
              visitor_name: formData.visitor_name,
              visitor_email: formData.visitor_email,
              visitor_phone: formData.visitor_phone,
            }}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 2 && (
          <RatingsStep
            initialData={formData}
            ratings={formData}
            onNext={handleNext}
            onBack={handleBack}
            part={1}
          />
        )}

        {currentStep === 3 && (
          <RatingsStep
            initialData={formData}
            ratings={formData}
            onNext={handleNext}
            onBack={handleBack}
            part={2}
            comments={comments}
            setComments={setComments}
          />
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmSubmit}
        onClose={handleCancelSubmit}
        onConfirm={handleConfirmSubmit}
        title="Submit Feedback?"
        message="Are you sure you want to submit your feedback? Once submitted, you won't be able to make any changes."
        type="question"
        theme="light"
      />

      {/* Toast Notifications */}
      {toast.message && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ ...toast, message: "" })}
        />
      )}
    </div>
  );
};

export default AppointmentFeedbackForm;
