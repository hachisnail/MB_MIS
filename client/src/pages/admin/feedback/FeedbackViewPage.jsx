import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import useToast from "@/components/commons";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import PopupModal from "@/components/modals/PopupModal";
import Toast from "@/features/Toast";
import SubmitButton from "@/features/SubmitButton";
import { useSocketClient } from "@/context/authContext";
import {
    FEEDBACK_TYPES,
    getDimensions,
    calculateOverallRating,
    calculateDimensionAvg,
    detectFeedbackType,
} from "./feedbackDimensions";

const statusOptions = ["SUBMITTED", "REVIEWED", "RESPONDED", "RESOLVED"];

function StarDisplay({ rating }) {
    const stars = [];
    for (let i = 0; i < 5; i++) {
        stars.push(i < rating ? "★" : "☆");
    }
    return (
        <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-lg">{stars.join("")}</span>
            <span className="text-sm text-gray-600">({rating}/5)</span>
        </div>
    );
}

export default function FeedbackViewPage({
    showModal = false,
    modalData: propModalData,
    onClose: propOnClose,
    showRespondSection = true,
    showToast: propShowToast
}) {
    // Check if we're being used as a route component
    const { encoded } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocketClient();
    const isRouteComponent = !!encoded;

    // State for when used as route component
    const [routeModalData, setRouteModalData] = useState(null);
    const [loading, setLoading] = useState(isRouteComponent);
    const [toastConfig, setToastConfig] = useState({
        message: '',
        type: 'success'
    });

    // Use prop data or route data
    const modalData = isRouteComponent ? routeModalData : propModalData;

    // Toast functions for route mode
    const showToastMessage = useCallback((message, type = 'success') => {
        if (propShowToast) {
            propShowToast(message, type);
        } else {
            setToastConfig({
                message,
                type
            });
        }
    }, [propShowToast]);

    const hideToast = useCallback(() => {
        setToastConfig(prevConfig => ({
            ...prevConfig,
            message: ''
        }));
    }, []);

    // Fetch feedback details when used as route
    const fetchFeedbackDetails = useCallback(async (feedbackId, feedbackType) => {
        try {
            setLoading(true);
            // Use the feedback type to call the correct endpoint directly
            const endpoint = feedbackType === 'website'
                ? `/feedback/website/detail/${feedbackId}`
                : `/feedback/appointment/detail/${feedbackId}`;

            const response = await axiosClient.get(endpoint);
            setRouteModalData({
                ...response.data,
                showRespond: true,
            });
        } catch (error) {
            console.error('Failed to fetch feedback details:', error);
            showToastMessage('Failed to load feedback details', 'error');
            navigate('/admin/feedback');
        } finally {
            setLoading(false);
        }
    }, [showToastMessage, navigate]);

    // Close handler
    const onClose = useCallback(() => {
        if (propOnClose) {
            propOnClose();
        } else {
            navigate('/admin/feedback');
        }
    }, [propOnClose, navigate]);

    // Fetch data when used as route component
    useEffect(() => {
        if (isRouteComponent && encoded) {
            try {
                const decoded = atob(encoded);
                const parts = decoded.split(' ');
                const feedbackId = parts[0];
                const feedbackType = parts[1];

                if (feedbackId && feedbackType) {
                    fetchFeedbackDetails(feedbackId, feedbackType);
                } else {
                    console.error('Could not extract feedback ID and type from URL');
                    navigate('/admin/feedback');
                }
            } catch (error) {
                console.error('Failed to decode feedback ID and type from URL:', error);
                navigate('/admin/feedback');
            }
        }
    }, [isRouteComponent, encoded, fetchFeedbackDetails, navigate]);

    // Socket listener for real-time updates when used as route
    useEffect(() => {
        if (!isRouteComponent || !routeModalData || !socket) return;

        const handleFeedbackChange = (changedFeedbackId) => {
            if (changedFeedbackId === routeModalData.id) {
                fetchFeedbackDetails(changedFeedbackId, routeModalData.feedback_type);
            }
        };

        socket.onDbChange("Feedback", "*", handleFeedbackChange);

        return () => {
            socket.offDbChange("Feedback", "*", handleFeedbackChange);
        };
    }, [isRouteComponent, routeModalData, fetchFeedbackDetails, socket]);

    // State for managing UI
    const [status, setStatus] = useState("");
    const [message, setMessage] = useState("");
    const [messageError, setMessageError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // State for modals
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [confirmModalTitle, setConfirmModalTitle] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);

    const [showPopupModal, setShowPopupModal] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [popupModalTitle, setPopupModalTitle] = useState('');
    const [popupModalMessage, setPopupModalMessage] = useState('');
    const [popupModalType, setPopupModalType] = useState('info');

    // Auto-transition function
    const handleAutoTransition = useCallback(async (feedbackId, currentStatus, newStatus) => {
        try {
            setIsTransitioning(true);
            const feedbackType = detectFeedbackType(modalData);
            console.log(`[AUTO-TRANSITION] Current status: ${currentStatus}, Target status: ${newStatus}`);

            // Only proceed if status is actually SUBMITTED
            if (currentStatus !== "SUBMITTED") {
                console.log(`[AUTO-TRANSITION] Status is already ${currentStatus}, skipping transition`);
                return;
            }

            // NOTE: Status update is disabled due to database schema issue (feedback_status column too small)
            // The auto-transition will show the acknowledgment without updating the database
            console.log(`[AUTO-TRANSITION] Skipping database update due to known schema issue`);

            // Automatically send acknowledgment email
            console.log(`[AUTO-TRANSITION] Sending acknowledgment email`);
            const emailEndpoint = feedbackType === FEEDBACK_TYPES.WEBSITE
                ? `/feedback/website/${feedbackId}/send-email`
                : `/feedback/appointment/${feedbackId}/send-email`;

            const acknowledgeMessage = "Thank you for your feedback. We have received your submission and will review it carefully. You will receive further communication from us soon.";

            try {
                await axiosClient.post(emailEndpoint, {
                    subject: 'Feedback Received - Museo Bulawan',
                    message: acknowledgeMessage,
                    status: 'SUBMITTED'
                });
                console.log(`[AUTO-TRANSITION] Acknowledgment email sent successfully`);
                showToastMessage("Acknowledgment email sent to visitor", "success");
            } catch (emailError) {
                console.warn("[AUTO-TRANSITION] Email sending failed:", emailError);
                showToastMessage("Feedback received (email sending skipped)", "info");
            }

            // Update local state to show as reviewed
            setStatus("REVIEWED");
        } catch (error) {
            console.error("[AUTO-TRANSITION] Error in auto-transition:", error);
            console.error("[AUTO-TRANSITION] Error response:", error.response?.data);
            showToastMessage("Feedback received", "info");
        } finally {
            setIsTransitioning(false);
        }
    }, [modalData, showToastMessage]);

    // Initialize state when modalData changes and auto-transition SUBMITTED to REVIEWED
    useEffect(() => {
        if (modalData) {
            const normalizedStatus = statusOptions.includes(modalData.feedback_status)
                ? modalData.feedback_status
                : "SUBMITTED";
            setStatus(normalizedStatus);

            // Auto-transition from SUBMITTED to REVIEWED on page load for both appointment and website feedback
            if (normalizedStatus === "SUBMITTED" && isRouteComponent) {
                console.log("[AUTO-TRANSITION] Automatically transitioning SUBMITTED to REVIEWED");
                handleAutoTransition(modalData.id, normalizedStatus, "REVIEWED");
            }
        }
    }, [modalData]);

    // Handle save
    const handleSave = async () => {
        try {
            setIsProcessing(true);
            const feedbackType = detectFeedbackType(modalData);
            const endpoint = feedbackType === FEEDBACK_TYPES.WEBSITE
                ? `/feedback/website/status/${modalData.id}`
                : `/feedback/appointment/status/${modalData.id}`;

            await axiosClient.put(endpoint, { status });
            showToastMessage("Feedback status updated successfully", "success");

            if (isRouteComponent && modalData?.id) {
                await fetchFeedbackDetails(modalData.id, feedbackType);
            }
        } catch (err) {
            console.error("Error updating feedback status:", err);
            showToastMessage(
                err.response?.data?.message || "Failed to update status",
                "error"
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper function to update feedback status
    const updateFeedbackStatus = async (feedbackId, newStatus, feedbackType) => {
        try {
            console.log(`Updating status from ${status} to ${newStatus}`);
            const endpoint = feedbackType === FEEDBACK_TYPES.WEBSITE
                ? `/feedback/website/status/${feedbackId}`
                : `/feedback/appointment/status/${feedbackId}`;

            await axiosClient.put(endpoint, { status: newStatus });
            console.log(`Status updated successfully to: ${newStatus}`);
            setStatus(newStatus);
        } catch (err) {
            console.error("Error updating feedback status:", err);
            throw err;
        }
    };

    // Send email based on feedback type (website or appointment)
    const sendEmailToVisitor = async (emailType, messageContent, newStatus) => {
        if (!modalData?.id) {
            console.warn("Invalid feedback ID for email sending");
            showToastMessage("Invalid feedback ID", "error");
            return false;
        }

        let feedbackType = null;
        try {
            setIsProcessing(true);
            feedbackType = detectFeedbackType(modalData);
            console.log(`[EMAIL] Sending ${emailType} email for feedback type:`, feedbackType);

            // Determine endpoint and email subject based on type
            const isWebsite = feedbackType === FEEDBACK_TYPES.WEBSITE;
            const endpoint = isWebsite
                ? `/feedback/website/${modalData.id}/send-email`
                : `/feedback/appointment/${modalData.id}/send-email`;

            console.log(`[EMAIL] Endpoint: ${endpoint}`);

            // Prepare email subject based on action type
            let subject = '';
            switch (emailType) {
                case 'response':
                    subject = 'Re: Your Feedback - Museo Bulawan';
                    break;
                case 'resolution':
                    subject = 'Feedback Resolved - Museo Bulawan';
                    break;
                default:
                    subject = 'Feedback Update - Museo Bulawan';
            }

            // Step 1: Send email (with status parameter)
            console.log(`[EMAIL] Sending email with subject: ${subject}`);
            const emailResponse = await axiosClient.post(endpoint, {
                subject,
                message: messageContent,
                status: newStatus
            });
            console.log(`[EMAIL] Email sent successfully!`, emailResponse.data);

            // Step 3: Clear message
            setMessage("");

            const successMessage = emailType === 'response'
                ? "Response email sent successfully!"
                : "Resolution email sent successfully!";
            showToastMessage(successMessage, "success");
            console.log(`[EMAIL] Success message shown`);

            return true;
        } catch (err) {
            console.error(`[EMAIL ERROR] Error sending ${emailType} email:`, err);
            const errorMessage = err.response?.data?.message || `Failed to send ${emailType} email`;
            showToastMessage(errorMessage, "error");
            return false;
        } finally {
            setIsProcessing(false);
            console.log(`[EMAIL] Processing complete`);
        }
    };

    // Handle send response email
    const handleSendEmail = () => {
        if (!message.trim()) {
            setMessageError(true);
            return;
        }

        setMessageError(false);
        setConfirmModalTitle('Send Response Email');
        setConfirmModalMessage('Send response email to the visitor?');
        // Create and set the action function
        setConfirmAction(() => async () => {
            console.log("[ACTION] Send response email confirmed");
            const success = await sendEmailToVisitor('response', message, "RESPONDED");
            if (success) {
                console.log("[ACTION] Email sent, closing modal");
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    // Handle resolve feedback
    const handleResolve = () => {
        setConfirmModalTitle('Resolve Feedback');
        setConfirmModalMessage('Send resolution email and mark as resolved?');
        // Create and set the action function
        setConfirmAction(() => async () => {
            try {
                console.log("[ACTION] Resolve feedback confirmed");
                // Generate auto email content if user didn't provide one
                const autoEmailMessage = message.trim()
                    ? message
                    : `Thank you for your feedback. We appreciate your input and will use it to improve our services. Your feedback is invaluable to Museo Bulawan.`;

                const success = await sendEmailToVisitor('resolution', autoEmailMessage, "RESOLVED");

                if (success) {
                    console.log("[ACTION] Resolution sent, closing modal and showing success");
                    setShowConfirmModal(false);
                    setPopupModalTitle('Success');
                    setPopupModalMessage('Feedback marked as resolved and email sent!');
                    setPopupModalType('info');
                    setShowPopupModal(true);
                } else {
                    console.log("[ACTION] Resolution failed");
                    setShowConfirmModal(false);
                    setPopupModalTitle('Error');
                    setPopupModalMessage('Failed to resolve feedback');
                    setPopupModalType('danger');
                    setShowPopupModal(true);
                }
            } catch (err) {
                console.error('[ACTION] Error in resolve action:', err);
                setShowConfirmModal(false);
                setPopupModalTitle('Error');
                setPopupModalMessage('Failed to resolve feedback');
                setPopupModalType('danger');
                setShowPopupModal(true);
            }
        });
        setShowConfirmModal(true);
    };

    // Show loading state when used as route component
    if (isRouteComponent && loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-2xl">Loading feedback details...</div>
            </div>
        );
    }

    // Return null if no data
    if (!isRouteComponent && (!showModal || !modalData)) return null;
    if (isRouteComponent && !modalData) return null;

    const feedbackType = detectFeedbackType(modalData);
    const dimensionGroups = getDimensions(feedbackType);
    const overallRating = calculateOverallRating(modalData, feedbackType);

    const statusColors = {
        SUBMITTED: "bg-blue-100 text-blue-800",
        REVIEWED: "bg-green-100 text-green-800",
        RESPONDED: "bg-purple-100 text-purple-800",
        RESOLVED: "bg-gray-100 text-gray-800",
    };

    const feedbackTypeLabel = feedbackType === FEEDBACK_TYPES.WEBSITE ? "Website Feedback" : "Appointment Feedback";

    // Status checks
    const isSubmitted = status === "SUBMITTED";
    const isReviewed = status === "REVIEWED";
    const isResponded = status === "RESPONDED";
    const isResolved = status === "RESOLVED";

    const renderContent = () => (
        <>
            {/* Header Section - Enlarged text for full page layout */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-6xl font-bold text-gray-900">
                    {modalData.visitor_name || "N/A"}
                </h1>
                <div className="flex items-center gap-x-3">
                    <div className="text-2xl text-gray-600 font-medium">
                        {modalData.submitted_at ? new Date(modalData.submitted_at).toLocaleDateString() : "-"}
                    </div>
                </div>
            </div>

            <hr className="border-gray-400 mb-14" />

            {/* Main Content Grid - 3 Column Layout */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column - Contact Information + Comments */}
                <div className="space-y-6">
                    {/* Contact Information Section */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Email */}
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 mt-1 flex-shrink-0">
                                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 mb-1">Email</div>
                                <div className="text-sm text-blue-600 font-medium break-all">{modalData.visitor_email || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 mt-1 flex-shrink-0">
                                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 mb-1">Phone</div>
                                <div className="text-sm text-blue-600 font-medium">{modalData.visitor_phone || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Type & Overall Rating */}
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-sm font-medium text-gray-900 mb-1">Type</div>
                                <div className="text-sm text-blue-600 font-medium">{feedbackTypeLabel}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900 mb-1">Status</div>
                                <div className={`text-xs font-bold px-2 py-1 rounded w-fit ${statusColors[status] || "bg-gray-100"}`}>
                                    {status}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Overall Rating */}
                    <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">Overall Rating</div>
                        <StarDisplay rating={overallRating !== "N/A" ? Math.round(parseFloat(overallRating) * 2) / 2 : 0} />
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2 uppercase">Comments</h4>
                        <div className="bg-gray-100 p-3 rounded min-h-[100px] text-sm text-gray-700 overflow-y-auto max-h-[200px]">
                            {modalData.comments || "(No comments provided)"}
                        </div>
                    </div>
                </div>

                {/* Middle Column - Feedback Ratings */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase">Ratings</h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {dimensionGroups.map((group) => (
                            <div key={group.name} className="bg-gray-50 p-3 rounded border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase">{group.name}</h4>
                                <div className="space-y-1">
                                    {group.fields.map((field) => (
                                        <div key={field.key} className="flex justify-between items-center text-xs">
                                            <span className="text-gray-600 truncate">{field.label}:</span>
                                            <span className="text-yellow-500 text-xs ml-1">{modalData[field.key] || 0}★</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                                    <span className="font-semibold text-gray-700 text-xs">Avg:</span>
                                    <span className="font-semibold text-gray-900 text-xs">
                                        {calculateDimensionAvg(modalData, group.fields)}/5
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column - Actions Section */}
                <div>
                    <h3 className="text-2xl font-bold mb-8">Actions</h3>

                    {/* Transitioning Loading State */}
                    {isTransitioning && (
                        <div className="flex flex-col items-center justify-center py-12 mb-8 bg-blue-50 rounded border border-blue-200">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">Processing feedback...</div>
                                <div className="text-sm text-gray-600 mt-1">Sending acknowledgment email to visitor</div>
                            </div>
                        </div>
                    )}

                    {/* Response Actions */}
                    {isReviewed && !isTransitioning && (
                        <div className="space-y-6 mb-8">
                            <div>
                                <label className="block text-base font-bold text-gray-900 mb-4">Send Response</label>
                                <textarea
                                    className={`w-full p-4 border ${messageError ? 'border-red-500' : 'border-gray-300'} rounded text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none`}
                                    rows={6}
                                    value={message}
                                    onChange={(e) => {
                                        setMessage(e.target.value);
                                        if (e.target.value.trim()) {
                                            setMessageError(false);
                                        }
                                    }}
                                    placeholder="Enter your response message (optional)"
                                />
                                {messageError && (
                                    <div className="text-base text-red-500 mt-3">
                                        Please enter a message
                                    </div>
                                )}
                                <div className="text-sm text-gray-600 mt-3">
                                    Email will be sent to{' '}
                                    <span className="text-blue-600 font-bold">{modalData.visitor_email || 'the visitor'}</span>
                                </div>
                            </div>

                            <SubmitButton
                                onClick={handleSendEmail}
                                isLoading={isProcessing}
                                loadingText="Sending..."
                                className="w-full px-6 py-3 text-base font-bold bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Send Response
                            </SubmitButton>
                        </div>
                    )}

                    {isResponded && !isTransitioning && (
                        <div className="space-y-6 mb-8 bg-blue-50 p-6 rounded border border-blue-200">
                            <div>
                                <label className="block text-base font-bold text-gray-900 mb-4">Send Resolution</label>
                                <textarea
                                    className="w-full p-4 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                                    rows={5}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Optional: Add a personal message (or auto-generated message will be sent)"
                                />
                            </div>

                            <SubmitButton
                                onClick={handleResolve}
                                isLoading={isProcessing}
                                loadingText="Processing..."
                                className="w-full px-6 py-3 text-base font-bold bg-green-600 text-white hover:bg-green-700"
                            >
                                Mark as Resolved
                            </SubmitButton>
                        </div>
                    )}

                    {isResolved && !isTransitioning && (
                        <div className="mb-8 text-center bg-green-50 p-6 rounded border border-green-200">
                            <div className="text-lg text-green-700 font-bold">
                                ✓ Feedback has been resolved
                            </div>
                        </div>
                    )}

                    {isSubmitted && !isTransitioning && (
                        <div className="mb-6 text-center bg-yellow-50 p-4 rounded border border-yellow-200">
                            <div className="text-sm text-gray-600">
                                <div className="text-lg font-bold text-amber-700 mb-2">✓ Feedback Received</div>
                                <p>Acknowledgment email has been sent to the visitor</p>
                                <p className="text-xs mt-2">Ready for review and response</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t pt-4 flex gap-2 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    // Render as full page layout
    return (
        <>
            <div className="w-full h-fit bg-white flex flex-col overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {renderContent()}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmAction}
                title={confirmModalTitle}
                message={confirmModalMessage}
                type="question"
                theme="light"
            />

            {/* Popup Modal */}
            <PopupModal
                isOpen={showPopupModal}
                onClose={() => setShowPopupModal(false)}
                title={popupModalTitle}
                message={popupModalMessage}
                type={popupModalType}
                theme="light"
            />

            {/* Toast */}
            {isRouteComponent && (
                <Toast
                    message={toastConfig.message}
                    type={toastConfig.type}
                    onClose={hideToast}
                />
            )}
        </>
    );
}
