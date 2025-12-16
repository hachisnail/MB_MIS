import React, { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import useToast from "@/components/commons";
import EmailDraftBox from "./EmailDraftBox";
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

export default function FeedbackDetailPanel({ feedback, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const { showToast } = useToast();

    // Detect feedback type
    const feedbackType = feedback ? detectFeedbackType(feedback) : FEEDBACK_TYPES.APPOINTMENT;
    const dimensionGroups = getDimensions(feedbackType);

    useEffect(() => {
        if (feedback) {
            const normalizedStatus = statusOptions.includes(feedback.feedback_status)
                ? feedback.feedback_status
                : "SUBMITTED";
            setStatus(normalizedStatus);
            setAdminNotes(feedback.admin_notes || "");
        }
    }, [feedback]);

    const handleSave = async () => {
        try {
            setLoading(true);

            // Determine the correct endpoint based on feedback type
            const endpoint = feedbackType === FEEDBACK_TYPES.WEBSITE
                ? `/feedback/website/status/${feedback.id}`
                : `/feedback/appointment/status/${feedback.id}`;

            await axiosClient.put(endpoint, {
                status,
                admin_notes: adminNotes,
            });
            showToast("Feedback status updated", "success");
            onSave && onSave();
        } catch (err) {
            console.error("Error updating feedback status", err);
            showToast(
                err.response?.data?.message || "Failed to update status",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async (emailData) => {
        try {
            setEmailLoading(true);

            // Call feedback email endpoint
            await axiosClient.post(
                `/feedback/appointment/${feedback.id}/send-email`,
                emailData
            );

            showToast("Email sent successfully and logged!", "success");

            // Refresh feedback to show updated status and notes
            onSave && onSave();
        } catch (err) {
            console.error("Error sending email:", err);
            showToast(
                err.response?.data?.message || "Failed to send email",
                "error"
            );
        } finally {
            setEmailLoading(false);
        }
    };

    const overallRating = calculateOverallRating(feedback, feedbackType);

    if (!feedback) {
        return <div className="text-sm text-gray-600">Loading...</div>;
    }

    const statusColors = {
        SUBMITTED: "bg-blue-100 text-blue-800",
        REVIEWED: "bg-green-100 text-green-800",
        RESPONDED: "bg-purple-100 text-purple-800",
        RESOLVED: "bg-gray-100 text-gray-800",
    };

    const feedbackTypeLabel = feedbackType === FEEDBACK_TYPES.WEBSITE ? "Website Feedback" : "Appointment Feedback";

    return (
        <div className="space-y-4">
            {/* Header with Name and Date */}
            <div className="pb-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{feedback.visitor_name || "N/A"}</h2>
                    <span className="text-sm text-gray-500">
                        {feedback.submitted_at ? new Date(feedback.submitted_at).toLocaleDateString() : "-"}
                    </span>
                </div>
            </div>

            {/* Contact Information */}
            <div>
                <div className="mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Email</span>
                    <p className="text-sm text-blue-600 font-medium">{feedback.visitor_email || "-"}</p>
                </div>
                <div className="mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Phone Number</span>
                    <p className="text-sm text-blue-600 font-medium">{feedback.visitor_phone || "-"}</p>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            {/* Feedback Type & Overall Rating */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Feedback Type</span>
                    <p className="text-sm font-medium text-gray-900">{feedbackTypeLabel}</p>
                </div>
                <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Overall Rating</span>
                    <div className="mt-1">
                        <StarDisplay rating={overallRating !== "N/A" ? Math.round(parseFloat(overallRating) * 2) / 2 : 0} />
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            {/* Feedback Ratings by Dimension */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase">Feedback Ratings</h3>
                <div className="space-y-3">
                    {dimensionGroups.map((group) => (
                        <div key={group.name} className="bg-gray-50 p-3 rounded border border-gray-200">
                            <h4 className="text-xs font-semibold text-gray-800 mb-2 uppercase">{group.name}</h4>
                            <div className="space-y-2">
                                {group.fields.map((field) => (
                                    <div key={field.key} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-600">{field.label}:</span>
                                        <StarDisplay rating={feedback[field.key] || 0} />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                                <span className="font-semibold text-gray-700">Avg:</span>
                                <span className="font-semibold text-gray-900">
                                    {calculateDimensionAvg(feedback, group.fields)}/5
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            {/* Comments Section */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Comments</h3>
                <div className="bg-gray-100 p-3 rounded min-h-[80px] text-sm text-gray-700">
                    {feedback.comments || "(No comments provided)"}
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4"></div>

            {/* Status & Admin Notes Section */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase">Status & Notes</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Current Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className={`w-full px-3 py-2 rounded text-sm font-medium ${statusColors[status] || "bg-gray-100"}`}
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Admin Notes</label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Internal notes about this feedback..."
                        />
                    </div>
                </div>
            </div>

            {/* Email Draft Box - Only show if feedback has email */}
            {feedback.visitor_email && (
                <>
                    <EmailDraftBox
                        feedback={feedback}
                        onSendEmail={handleSendEmail}
                        isLoading={emailLoading}
                    />
                </>
            )}

            {/* Action Buttons */}
            <div className="border-t pt-4 flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                    Close
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 font-medium"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
