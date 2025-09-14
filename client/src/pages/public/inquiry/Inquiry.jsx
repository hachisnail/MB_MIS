import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { LoadingSpinner } from "../../../components/commons";
import PinInput from "./components/PinInput";
import Logo from "../../../assets/LOGO.png";
import StyledButton from "../../../components/buttons/StyledButton";

export default function Inquiry() {
  const { token: tokenFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token");
  const token = tokenFromPath || tokenFromQuery || null;

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [writeEnabled, setWriteEnabled] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(true);

  const [otpInput, setOtpInput] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
  const handleUnload = () => {
    const url = `${axiosClient.defaults.baseURL}/auth/contributions/session/close`;
    const blob = new Blob([JSON.stringify({ reason: "tab_closed" })], {
      type: "application/json"
    });
    navigator.sendBeacon(url, blob);
  };

  window.addEventListener("beforeunload", handleUnload);
  return () => window.removeEventListener("beforeunload", handleUnload);
}, []);

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSendOtp = async () => {
    try {
      setOtpSending(true);
      const sessionId = sessionData?.session?.session_id;
      await axiosClient.post(`/auth/contributions/session/${sessionId}/otp`);
      setOtpInput(false);
    } catch {
      setErrorMessage("Failed to send code. Please try again.");
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
    } catch {
      setErrorMessage("That code doesn’t match. Please try again.");
    }
  };

  // const handlePinComplete = (pin) => {
  //   setOtpCode(pin);
  // };

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

  const PinHeader = () => (
    <div className="w-fit h-fit flex flex-col items-center justify-center mb-10">
      <img src={Logo} alt="Museum Logo" className="h-23 mb-4 mx-auto" />
      <span className="font-bold font-hind text-xl leading-tight">
        MUSEUM ARCHIVES AND SHRINE CURATION DIVISION
      </span>
      <span className="leading-tight text-md font-hind">
        MANAGEMENT INFORMATION SYSTEMS
      </span>
    </div>
  );

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col items-center justify-center ">
      <div className="max-w-[45rem] w-full h-fit shadow-md shadow-gray-600 flex flex-col items-center px-10 pb-2 pt-10">
        {/* OTP FLOW */}
        {!writeEnabled && requiresOtp && (
          <>
            {otpInput ? (
              <>
                <PinHeader />
                <span className="text-6xl font-semibold mb-10">
                  OTP Verification
                </span>
                <span className="text-3xl font-semibold text-center w-[35rem] mb-10">
                  We would like to confirm your identity before you proceed.
                </span>
                <span className="text-center w-[35rem] text-xl mb-10">
                  To continue, please click the button below to send a one-time
                  password (OTP) to your registered email address.
                </span>
                <StyledButton
                  onClick={handleSendOtp}
                  className="w-[35rem] text-2xl shadow-md shadow-gray-500"
                >
                  {otpSending ? "Sending..." : "Send code"}
                </StyledButton>
                <div className="h-15 w-fit my-2 flex justify-center items-center">
                  <span className="text-2xl text-red-500 text-center">
                    {errorMessage}
                  </span>
                </div>
              </>
            ) : (
              <>
                <PinHeader />
                <span className="mb-10 text-6xl font-semibold text-center ">
                  Enter Your OTP Verification
                </span>
                <PinInput length={6} onComplete={(pin) => setOtpCode(pin)} />

                <div className="h-15 w-fit my-2 flex justify-center items-center">
                  <span
                    className={`text-2xl ${
                      errorMessage === "" ? "text-gray-500" : "text-red-500"
                    } text-center`}
                  >
                    {errorMessage ||
                      "Please enter the 6-digit code we sent to your email."}
                  </span>
                </div>
                <div className="flex gap-x-2 mb-10">
                  <StyledButton
                    onClick={() => {
                      setOtpInput(true);
                      setErrorMessage("");
                    }}
                    className="w-[5rem] text-2xl shadow-md shadow-gray-500"
                  >
                    Back
                  </StyledButton>
                  <StyledButton
                    onClick={handleVerifyOtp}
                    className="w-[25rem] text-2xl shadow-md shadow-gray-500"
                  >
                    Verify
                  </StyledButton>
                </div>
              </>
            )}
          </>
        )}

        {writeEnabled && !requiresOtp && sessionData?.contribution && (
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
      </div>
    </div>
  );
}
