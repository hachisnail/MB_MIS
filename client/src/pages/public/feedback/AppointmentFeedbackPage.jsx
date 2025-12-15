import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import PopupModal from "@/components/modals/PopupModal";
import AppointmentFeedbackForm from "./AppointmentFeedbackForm";
import { decodeBase64 } from "@/utils/base64";

const AppointmentFeedbackPage = () => {
    const { appointmentId: encodedId } = useParams();
    const navigate = useNavigate();
    const [feedbackData, setFeedbackData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isWalkIn, setIsWalkIn] = useState(false);
    const [appointmentId, setAppointmentId] = useState(null);

    useEffect(() => {
        const validateAppointment = async () => {
            try {
                // If no encodedId, allow walk-in feedback
                if (!encodedId) {
                    setIsWalkIn(true);
                    setIsLoading(false);
                    return;
                }

                // Decode the appointment ID from base64
                const decodedId = decodeBase64(encodedId);
                const id = parseInt(decodedId);

                if (isNaN(id)) {
                    throw new Error('Invalid appointment ID');
                }

                setAppointmentId(id);

                // Get appointment details
                const response = await axiosClient.get(
                    `/auth/appointment-feedback/${id}`
                );

                if (response.data) {
                    setFeedbackData(response.data);
                    setIsWalkIn(false);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Error loading appointment:", err);
                // If appointmentId provided but not found, show error
                if (encodedId) {
                    const errorMsg =
                        err.response?.data?.message ||
                        "Appointment not found.";
                    setError(errorMsg);
                }
                setIsLoading(false);
            }
        };

        validateAppointment();
    }, [encodedId]);

    const handleSuccess = () => {
        setIsSubmitted(true);
        setTimeout(() => {
            navigate("/");
        }, 3000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading feedback form...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <div className="mb-4">
                        <svg
                            className="w-16 h-16 text-red-500 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Invalid Feedback Link
                    </h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <PopupModal
                isOpen={isSubmitted}
                onClose={() => navigate("/")}
                title="Thank You!"
                message="Your feedback has been successfully submitted. We truly appreciate your valuable input. It helps us improve our services continuously."
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



                    {feedbackData?.appointmentInfo && (
                        <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
                            <p>
                                <span className="font-semibold">Appointment:</span>{" "}
                                {feedbackData.appointmentInfo.purpose} on{" "}
                                {new Date(
                                    feedbackData.appointmentInfo.preferred_date
                                ).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Feedback Form */}
                <div>
                    <AppointmentFeedbackForm
                        appointmentId={appointmentId}
                        appointmentInfo={feedbackData?.appointmentInfo}
                        onSuccess={handleSuccess}
                        isWalkIn={isWalkIn}
                    />
                </div>

                {/* Footer with Feedback Type */}
                <footer className="mt-12 text-center text-sm text-gray-500">
                    <p>Feedback Type: <strong>Appointment Feedback</strong></p>
                    <p>This form collects feedback about your museum appointment experience, helping us understand your visit and identify areas for improvement.</p>
                    <p>ISO Standards Compliance: This feedback process adheres to ISO 9241 for user-friendly design and ISO 27001 for data privacy.</p>
                </footer>
            </div>
        </div>
    );
};

export default AppointmentFeedbackPage;
