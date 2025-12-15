import { useState, useEffect } from "react";

const appointmentQuestions = [
  {
    name: "accessibility_booking",
    label: "How easy was it to book your appointment?",
    dimension: "Accessibility & Scheduling",
  },
  {
    name: "accessibility_availability",
    label: "Was your preferred date/time available?",
    dimension: "Accessibility & Scheduling",
  },
  {
    name: "staff_helpfulness",
    label: "Were the staff members helpful and professional?",
    dimension: "Staff Performance",
  },
  {
    name: "staff_communication",
    label: "Was the staff communication clear?",
    dimension: "Staff Performance",
  },
  {
    name: "facility_cleanliness",
    label: "Were the facilities clean and well-maintained?",
    dimension: "Facility/Environment Quality",
  },
  {
    name: "facility_comfort",
    label: "Was the environment comfortable?",
    dimension: "Facility/Environment Quality",
  },
  {
    name: "process_clarity",
    label: "Was the appointment process clear?",
    dimension: "Process Efficiency",
  },
  {
    name: "process_timeliness",
    label: "Did the appointment start on time?",
    dimension: "Process Efficiency",
  },
  {
    name: "service_expectations",
    label: "Did the appointment meet your expectations?",
    dimension: "Service Quality & Outcome",
  },
  {
    name: "service_quality",
    label: "Was the quality of service satisfactory?",
    dimension: "Service Quality & Outcome",
  },
];

const websiteQuestions = [
  {
    name: "website_usability",
    label: "How easy is it to navigate and use the website?",
    dimension: "Usability & Navigation",
  },
  {
    name: "website_design",
    label: "How visually appealing is the website design?",
    dimension: "Design & Aesthetics",
  },
  {
    name: "content_quality",
    label: "How informative and engaging is the content?",
    dimension: "Content Quality",
  },
  {
    name: "loading_speed",
    label: "How fast does the website load?",
    dimension: "Performance",
  },
  {
    name: "mobile_responsiveness",
    label: "How well does the website work on mobile devices?",
    dimension: "Mobile Experience",
  },
  {
    name: "navigation_ease",
    label: "How intuitive is the website navigation?",
    dimension: "Usability & Navigation",
  },
  {
    name: "accessibility_features",
    label: "How accessible is the website for users with disabilities?",
    dimension: "Accessibility",
  },
  {
    name: "information_accuracy",
    label: "How accurate and up-to-date is the information provided?",
    dimension: "Content Quality",
  },
  {
    name: "overall_satisfaction",
    label: "Overall, how satisfied are you with the website?",
    dimension: "Overall Experience",
  },
  {
    name: "recommendation_likelihood",
    label: "How likely are you to recommend this website to others?",
    dimension: "Overall Experience",
  },
];

const StarRating = ({ value, onChange }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className="transition-all duration-150 focus:outline-none"
          aria-label={`Rate ${star} stars`}
        >
          <span
            className={`text-3xl ${star <= (hoverValue || value)
              ? "text-yellow-400"
              : "text-gray-300"
              } transition-colors duration-150`}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

const RatingsStep = ({ initialData, onNext, onBack, ratings = {}, part = 1, comments = "", setComments, isWebsiteFeedback = false }) => {
  const [localRatings, setLocalRatings] = useState(ratings);
  const [localComments, setLocalComments] = useState(comments || "");
  const [showCommentModal, setShowCommentModal] = useState(false);

  // Sync with parent ratings on mount
  useEffect(() => {
    setLocalRatings(ratings);
  }, [ratings]);

  // Get questions for this part
  const questions = isWebsiteFeedback ? websiteQuestions : appointmentQuestions;
  const startIdx = part === 1 ? 0 : 5;
  const endIdx = part === 1 ? 5 : 10;
  const partQuestions = questions.slice(startIdx, endIdx);

  // Check if all questions in this part are answered
  const allQuestionsAnswered = partQuestions.every((q) => localRatings[q.name] > 0);

  const handleRatingChange = (fieldName, value) => {
    setLocalRatings((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleContinue = () => {
    if (!allQuestionsAnswered) {
      alert("Please rate all questions before continuing.");
      return;
    }
    if (part === 2 && setComments) {
      setComments(localComments);
    }
    onNext(localRatings);
  };

  return (
    <div className="w-[85rem] h-fit flex flex-col">
      <div className="w-full flex flex-col shadow-md rounded-lg shadow-gray-500 px-20 py-10">

        {/* Header */}
        <div className="w-full pb-5 border-b mb-10">
          <span className="text-6xl font-hina">Rate Your Experience {part === 1 ? "(Part 1)" : "(Part 2)"}</span>
        </div>

        {/* Feedback Questions */}
        <div className="w-full">
          <h3 className="text-3xl font-semibold mb-8">Please rate your experience (1 = Poor, 5 = Excellent)</h3>

          <div className="space-y-8">
            {partQuestions.map((q, idx) => (
              <div key={q.name} className="pb-8 border-b last:border-b-0">
                <div className="mb-4">
                  <p className="text-sm font-medium text-blue-600 uppercase mb-2 tracking-widest">
                    {q.dimension}
                  </p>
                  <label className="block text-2xl font-semibold text-gray-800">
                    {startIdx + idx + 1}. {q.label}
                  </label>
                </div>
                <div className="flex items-center gap-6">
                  <StarRating
                    value={localRatings[q.name] || 0}
                    onChange={(val) => {
                      handleRatingChange(q.name, val);
                    }}
                  />
                  <span className="text-2xl font-semibold text-gray-600 w-12">
                    {localRatings[q.name] || "-"}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Feedback Section (Part 2) */}
        {part === 2 && (
          <>
            <hr className="border-gray-300 my-8" />

            <div className="w-full mt-8">
              <h3 className="text-2xl font-semibold mb-4">Additional Feedback</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <textarea
                  value={localComments}
                  onChange={(e) => setLocalComments(e.target.value)}
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl resize-none"
                  placeholder="Please share any additional thoughts or suggestions..."
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex justify-between mt-12 gap-4">
        <button
          type="button"
          onClick={() => onBack()}
          className="w-44 h-15 rounded-md bg-black text-white text-3xl hover:bg-gray-800"
        >
          Previous
        </button>
        <div className="flex gap-x-5 w-fit h-fit items-center">
          <span className="text-3xl font-semibold">
            {allQuestionsAnswered ? (part === 1 ? "Continue to Part 2." : "Submit your feedback.") : "Complete all ratings"}
          </span>
          <button
            onClick={handleContinue}
            disabled={!allQuestionsAnswered}
            className={`w-30 h-15 flex items-center justify-center rounded-md text-white text-3xl ${allQuestionsAnswered
              ? "bg-black hover:bg-gray-800"
              : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 12l-10 0" />
              <path d="M20 12l-4 4" />
              <path d="M20 12l-4 -4" />
              <path d="M4 4l0 16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingsStep;
