import { useState } from "react";

const questions = [
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
            className={`text-2xl ${star <= (hoverValue || value)
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

const ReviewStep = ({ visitorInfo, ratings, comments, onNext, onBack, onChangeComment, setComments }) => {
  const [showCommentModal, setShowCommentModal] = useState(false);

  return (
    <div className="w-[85rem] h-fit">
      <div className="w-full flex flex-col shadow-md rounded-lg shadow-gray-500 px-20 py-10">

        {/* Header */}
        <div className="w-full pb-5 border-b mb-10">
          <span className="text-6xl font-hina">Review Your Feedback</span>
        </div>

        {/* Visitor Information Summary */}
        <div className="w-[50rem] bg-gray-50 rounded-lg p-6 mb-10">
          <h3 className="text-2xl font-semibold mb-4">Your Information</h3>
          <div className="space-y-2">
            <p className="text-lg"><span className="font-medium">Name:</span> {visitorInfo.visitor_name}</p>
            <p className="text-lg"><span className="font-medium">Email:</span> {visitorInfo.visitor_email || "Not provided"}</p>
            <p className="text-lg"><span className="font-medium">Phone:</span> {visitorInfo.visitor_phone || "Not provided"}</p>
          </div>
        </div>

        <hr className="border-gray-300 my-8" />

        {/* Ratings Summary */}
        <div className="w-full mb-10">
          <h3 className="text-2xl font-semibold mb-6">Your Ratings Summary</h3>

          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.name} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600 uppercase mb-1 tracking-widest">
                    {q.dimension}
                  </p>
                  <p className="text-lg text-gray-700">{q.label}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${star <= (ratings[q.name] || 0)
                            ? "text-yellow-400"
                            : "text-gray-300"
                          }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xl font-semibold text-gray-600 w-10">
                    {ratings[q.name]}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-300 my-8" />

        {/* Comments Summary */}
        <div className="w-full mb-10">
          <h3 className="text-2xl font-semibold mb-4">Additional Feedback</h3>
          <div className="w-[50rem] bg-gray-50 rounded-lg p-6">
            <p className="text-lg text-gray-700 min-h-[80px]">
              {comments ? comments : <span className="text-gray-400 italic">No additional feedback provided</span>}
            </p>
            <button
              type="button"
              onClick={() => setShowCommentModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 underline text-lg font-semibold"
            >
              Edit feedback
            </button>
          </div>
        </div>

        {/* Comment Edit Modal */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[50rem]">
              <h4 className="text-2xl font-semibold mb-4">Edit Additional Feedback</h4>
              <textarea
                value={comments || ""}
                onChange={(e) => setComments(e.target.value)}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl resize-none"
                placeholder="Please share any additional thoughts or suggestions..."
              />
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="w-32 h-12 rounded-md bg-gray-300 text-black text-xl hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentModal(false)}
                  className="w-32 h-12 rounded-md bg-black text-white text-xl hover:bg-gray-800 font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex justify-between mt-8 gap-4">
        <button
          type="button"
          onClick={() => onBack()}
          className="w-44 h-15 rounded-md bg-black text-white text-3xl hover:bg-gray-800"
        >
          Previous
        </button>
        <div className="flex gap-x-5 w-fit h-fit items-center">
          <span className="text-3xl font-semibold">Submit feedback.</span>
          <button
            onClick={() => onNext()}
            className="w-30 h-15 flex items-center justify-center rounded-md bg-black text-white text-3xl hover:bg-gray-800"
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

export default ReviewStep;
