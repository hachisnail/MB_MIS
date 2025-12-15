import React, { useEffect, useState } from "react";
import Modal from "@/components/modals/Modal";
import axiosClient from "@/lib/axiosClient";
import useToast from "@/components/commons";

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

const dimensionGroups = [
  {
    name: "Accessibility & Scheduling",
    fields: [
      { key: "accessibility_booking", label: "Ease of booking" },
      { key: "accessibility_availability", label: "Availability" },
    ],
  },
  {
    name: "Staff Performance",
    fields: [
      { key: "staff_helpfulness", label: "Helpfulness & professionalism" },
      { key: "staff_communication", label: "Communication clarity" },
    ],
  },
  {
    name: "Facility & Environment",
    fields: [
      { key: "facility_cleanliness", label: "Cleanliness" },
      { key: "facility_comfort", label: "Comfort" },
    ],
  },
  {
    name: "Process Efficiency",
    fields: [
      { key: "process_clarity", label: "Process clarity" },
      { key: "process_timeliness", label: "On-time start" },
    ],
  },
  {
    name: "Service Quality",
    fields: [
      { key: "service_expectations", label: "Met expectations" },
      { key: "service_quality", label: "Service quality" },
    ],
  },
];

export default function FeedbackDetailModal({ feedbackId, isOpen, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen || !feedbackId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/feedback/${feedbackId}`);
        setFeedback(res.data.data);
        setStatus(res.data.data.feedback_status || "");
      } catch (err) {
        console.error("Error loading feedback detail", err);
        showToast("Failed to load feedback details", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, feedbackId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await axiosClient.patch(`/feedback/${feedbackId}/status`, { status, admin_notes: adminNotes });
      showToast("Feedback status updated", "success");
      onUpdated && onUpdated();
      onClose();
    } catch (err) {
      console.error("Error updating feedback status", err);
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallRating = () => {
    if (!feedback) return 0;
    const fields = dimensionGroups.flatMap(g => g.fields.map(f => f.key));
    const values = fields.map(f => feedback[f]).filter(v => v);
    return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
  };

  const calculateDimensionAvg = (fields) => {
    const values = fields.map(f => feedback[f.key]).filter(v => v);
    return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Feedback Details #${feedbackId}`}
      showClose
      theme="light"
    >
      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : feedback ? (
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Visitor Info */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Visitor Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <div className="font-medium">{feedback.visitor_name || "-"}</div>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <div className="font-medium text-blue-600">{feedback.visitor_email || "-"}</div>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <div className="font-medium">{feedback.visitor_phone || "-"}</div>
              </div>
              <div>
                <span className="text-gray-600">Appointment:</span>
                <div className="font-medium">
                  {feedback.Appointment ? `${feedback.Appointment.purpose}` : "Walk-in"}
                </div>
              </div>
            </div>
          </div>

          {/* Dimension Ratings */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Feedback Ratings</h3>
            <div className="space-y-4">
              {dimensionGroups.map((group) => (
                <div key={group.name} className="bg-gray-50 p-3 rounded">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">{group.name}</h4>
                  <div className="space-y-2">
                    {group.fields.map((field) => (
                      <div key={field.key} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{field.label}:</span>
                        <StarDisplay rating={feedback[field.key] || 0} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-700">Dimension Avg:</span>
                    <span className="text-sm font-semibold">{calculateDimensionAvg(group.fields)}/5.0</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Satisfaction */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Overall Satisfaction</h3>
            <div className="bg-blue-50 p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Overall Score:</span>
                <span className="text-lg font-bold">{calculateOverallRating()}/5.0</span>
              </div>
              <div className="mt-2">
                <StarDisplay rating={Math.round(calculateOverallRating() * 2) / 2} />
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Visitor Comments</h3>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
              {feedback.comments || "(No comments provided)"}
            </div>
          </div>

          {/* Status & Admin Notes */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded text-sm"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-900">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add response or notes..."
                className="w-full mt-1 p-2 border border-gray-300 rounded text-sm"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-3 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
