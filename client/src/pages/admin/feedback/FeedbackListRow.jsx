import React from "react";
import { formatDateForDisplay } from "@/components/commons";
import { calculateOverallRating, detectFeedbackType } from "./feedbackDimensions";

function StarRating({ rating, size = "sm" }) {
  const filled = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < filled) {
      stars.push("★");
    } else if (i === filled && hasHalf) {
      stars.push("⭐");
    } else {
      stars.push("☆");
    }
  }

  const sizeClass = size === "lg" ? "text-lg" : "text-sm";
  return (
    <div className={`flex items-center gap-1 ${sizeClass}`}>
      <span className="text-yellow-500">{stars.join("")}</span>
      <span className="text-gray-600 ml-1">({rating.toFixed(1)})</span>
    </div>
  );
}

export default function FeedbackListRow({ feedback, headers }) {
  // Detect feedback type and calculate rating
  const feedbackType = detectFeedbackType(feedback);
  const ratingValue = parseFloat(calculateOverallRating(feedback, feedbackType));
  const rating = isNaN(ratingValue) ? 0 : ratingValue;

  const statusColor = {
    SUBMITTED: "bg-blue-100 text-blue-800",
    REVIEWED: "bg-green-100 text-green-800",
    RESPONDED: "bg-purple-100 text-purple-800",
    RESOLVED: "bg-gray-100 text-gray-800",
  };

  const feedbackTypeColor = {
    appointment: "bg-amber-100 text-amber-800",
    website: "bg-cyan-100 text-cyan-800",
  };

  // Create grid template based on headers widths - use rem for consistency
  const gridStyle = {
    gridTemplateColumns: headers.map(h => {
      if (typeof h.width === 'number') {
        return `${h.width}rem`;
      }
      return h.width;
    }).join(' ')
  };

  return (
    <div className="grid py-4 px-3 items-center border-b border-gray-200 hover:bg-gray-50" style={gridStyle}>
      {/* Visitor Name */}
      <div className="min-w-0 pr-3">
        <div className="font-semibold text-gray-900 truncate">{feedback.visitor_name || "-"}</div>
        <div className="text-xs text-gray-500 truncate">{feedback.visitor_email || feedback.visitor_phone || "-"}</div>
      </div>

      {/* Feedback Type */}
      <div className="pr-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap inline-block ${feedbackTypeColor[feedback.feedback_type] || "bg-gray-100"}`}>
          {feedback.feedback_type === "website" ? "Website" : "Appointment"}
        </span>
      </div>

      {/* Overall Rating */}
      <div className="flex items-center pr-3">
        <StarRating rating={rating} />
      </div>

      {/* Status */}
      <div className="pr-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap inline-block ${statusColor[feedback.feedback_status] || "bg-gray-100"}`}>
          {feedback.feedback_status || "Unknown"}
        </span>
      </div>

      {/* Submitted Date */}
      <div className="text-sm text-gray-600">
        {feedback.submitted_at ? formatDateForDisplay(feedback.submitted_at) : "-"}
      </div>
    </div>
  );
}

