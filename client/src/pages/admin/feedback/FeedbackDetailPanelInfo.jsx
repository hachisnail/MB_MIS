import React from "react";
import {
    FEEDBACK_TYPES,
    getDimensions,
    calculateOverallRating,
    calculateDimensionAvg,
    detectFeedbackType,
} from "./feedbackDimensions";

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

export default function FeedbackDetailPanelInfo({ feedback }) {
    if (!feedback) {
        return <div className="text-sm text-gray-600">Loading...</div>;
    }

    const feedbackType = detectFeedbackType(feedback);
    const dimensionGroups = getDimensions(feedbackType);
    const overallRating = calculateOverallRating(feedback, feedbackType);
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
        </div>
    );
}
