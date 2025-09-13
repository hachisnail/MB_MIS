import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { LoadingSpinner } from "../../../components/commons";

export default function Inquiry() {
  const { token: tokenFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token");
  const token = tokenFromPath || tokenFromQuery || null;
  // const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [writeEnabled, setWriteEnabled] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(true);

  const fetchSession = async () => {
    try {
      if (!token) throw new Error("Missing token");
      setLoading(true);
      const res = await axiosClient.get(`/auth/contributions/session/open`, {
        params: { token },
      });
      setSessionData(res.data);
      setRequiresOtp(!!res.data?.requires_otp);
      setWriteEnabled(!!res.data?.session?.write_enabled);
    } catch (err) {
      setError("Invalid or expired interaction link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSendOtp = async () => {
    try {
      setOtpSending(true);
      const sessionId = sessionData?.session?.session_id;
      await axiosClient.post(`/auth/contributions/session/${sessionId}/otp`);
      alert("We sent a code to your email.");
    } catch {
      // modal for failed otp send attemp
      alert("Failed to send code.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const sessionId = sessionData?.session?.session_id;
      const res = await axiosClient.post(
        `/auth/contributions/session/${sessionId}/otp/verify`,
        { code: otpCode }
      );
      if (res.data?.ok) {
        setWriteEnabled(true);
        setRequiresOtp(false);
        await fetchSession();
      }
    } catch (e) {
      // error modal
      alert(e?.response?.data?.message || "Invalid code");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 text-xl">
        {error}
      </div>
    );
  }

  const emailHint = sessionData?.session?.guest_identity?.email_hint;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Contribution Inquiry
        </h1>
        <p className="mb-2 text-gray-700 text-center">
          This is your dedicated interaction space with Museo Bulawan staff.
        </p>
        {requiresOtp && emailHint && (
          <p className="mb-6 text-gray-500 text-center">
            We sent the code to <b>{emailHint}</b>.
          </p>
        )}

        {/* condition to render information */}
        {!requiresOtp && sessionData?.contribution && (
          <div className="space-y-3 mb-6">
            <p>
              <b>Artifact:</b>{" "}
              {sessionData.contribution.ContributionArtifact?.title}
            </p>
            <p>
              <b>Status:</b> {sessionData.contribution.status}
            </p>
            <p>
              <b>Type:</b> {sessionData.contribution.contribution_type}
            </p>
          </div>
        )}

        <div className="border-t pt-5 space-y-4">
          <h2 className="text-xl font-semibold">Messages</h2>

          {!requiresOtp ? (
            // condition that request is verified
            <div className="h-40 border rounded-md p-3 overflow-y-auto bg-gray-50">
              <p className="text-gray-500">No messages yet.</p>
            </div>
          ) : (
            // condition that request

            <div className="h-40 border rounded-md p-3 bg-gray-50 flex items-center justify-center text-gray-500">
              Content locked — verify with the code sent to your email.
            </div>
          )}

          {/* display requires otp */}
          {requiresOtp ? (
            <div className="rounded-md border p-3 bg-yellow-50">
              <p className="text-sm mb-2">
                To view and send messages, verify your email with a one-time
                code.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  disabled={otpSending}
                  onClick={handleSendOtp}
                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
                >
                  {otpSending ? "Sending..." : "Send code"}
                </button>
                <input
                  className="border rounded px-2 flex-1"
                  placeholder="Enter code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
                <button
                  onClick={handleVerifyOtp}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Verify
                </button>
              </div>
            </div>
          ) : !writeEnabled ? (
            <div className="rounded-md border p-3 bg-yellow-50">
              <p className="text-sm mb-2">
                Your view is unlocked, but messaging is limited. Re-verify if
                prompted.
              </p>
              <div className="flex gap-2">
                <button
                  disabled={otpSending}
                  onClick={handleSendOtp}
                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
                >
                  {otpSending ? "Sending..." : "Send code"}
                </button>
                <input
                  className="border rounded px-2"
                  placeholder="Enter code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
                <button
                  onClick={handleVerifyOtp}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Verify
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* staff message */}
              <textarea
                placeholder="Write a message to the staff..."
                className="w-full border rounded-md p-2 h-20 focus:ring focus:ring-indigo-500 focus:outline-none"
              />
              <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Send
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
