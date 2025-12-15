import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WebsiteFeedbackForm from "./WebsiteFeedbackForm";
import PopupModal from "@/components/modals/PopupModal";

const WebsiteFeedbackPage = () => {
    const navigate = useNavigate();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSuccess = () => {
        setIsSubmitted(true);
        setTimeout(() => {
            navigate("/");
        }, 3000);
    };

    if (isSubmitted) {
        return (
            <PopupModal
                isOpen={isSubmitted}
                onClose={() => navigate("/")}
                title="Thank You!"
                message="Your website feedback has been successfully submitted. We truly appreciate your valuable input. It helps us improve our website continuously."
                buttonText="OK"
                type="success"
                theme="light"
            />
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-25 px-4">
            <div className="w-full flex flex-col items-center">
                {/* Header */}
                <div className="text-center mb-8">


                </div>

                {/* Feedback Form */}
                <div>
                    <WebsiteFeedbackForm onSuccess={handleSuccess} />
                </div>

                {/* Footer with Feedback Type */}
                <footer className="mt-12 text-center text-sm text-gray-500">
                    <p>Feedback Type: <strong>Website Feedback</strong></p>
                    <p>This form collects general feedback about our website's usability, design, and content.</p>
                    <p>ISO Standards Compliance: This feedback process adheres to ISO 9241 for user-friendly design and ISO 27001 for data privacy.</p>
                </footer>
            </div>
        </div>
    );
};

export default WebsiteFeedbackPage;
