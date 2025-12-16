import React, { useState } from "react";
import SubmitButton from "@/features/SubmitButton";

/**
 * EmailDraftBox Component
 * Allows admin to draft and preview email responses to feedback
 */
export default function EmailDraftBox({
    feedback,
    onSendEmail,
    isLoading = false
}) {
    const [message, setMessage] = useState("");
    const [subject, setSubject] = useState("Response from Museo Bulawan");

    const handleSend = async () => {
        if (!message.trim()) {
            alert("Please type a message before sending.");
            return;
        }

        if (window.confirm("Send this email to the visitor?")) {
            try {
                await onSendEmail({ message, subject });
                setMessage("");
                setSubject("Response from Museo Bulawan");
            } catch (error) {
                console.error("Error sending email:", error);
            }
        }
    };

    return (
        <div className="space-y-4 border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900">📧 Send Email Response</h3>

            {/* Subject Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                </label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Subject line"
                />
            </div>

            {/* Message Textarea */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                </label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                    placeholder="Type your response message here. It will be formatted with the Museo Bulawan template."
                />
                <p className="text-xs text-gray-500 mt-2">
                    {message.length} characters
                </p>
            </div>

            {/* Recipient Info */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-gray-700">
                    <strong>Recipient:</strong> {feedback.visitor_email || feedback.visitor_phone || "N/A"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                    <strong>Name:</strong> {feedback.visitor_name || "N/A"}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
                <SubmitButton
                    onClick={handleSend}
                    isLoading={isLoading}
                    loadingText="Sending..."
                    className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 font-medium"
                    disabled={!message.trim()}
                >
                    Send Email
                </SubmitButton>
            </div>
        </div>
    );
}
