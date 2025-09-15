import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { LoadingSpinner } from "../../../components/commons";
import PinInput from "./components/PinInput";
import Logo from "../../../assets/LOGO.png";
import StyledButton from "../../../components/buttons/StyledButton";
import DocxViewer from "./components/DocxViewer";

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
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Invalid or expired interaction link.");
    } finally {
      setLoading(false);
    }
  };

  // Close session on tab close
  useEffect(() => {
    const handleUnload = () => {
      const url = `${axiosClient.defaults.baseURL}/auth/contributions/session/close`;
      const blob = new Blob([JSON.stringify({ reason: "tab_closed" })], {
        type: "application/json",
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
      setErrorMessage("");
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
      setErrorMessage("");
      const sessionId = sessionData?.session?.session_id;
      const res = await axiosClient.post(
        `/auth/contributions/session/${sessionId}/otp/verify`,
        { code: otpCode }
      );
      if (res.data?.ok) {
        setWriteEnabled(true);
        setRequiresOtp(false);
        await fetchSession(); // refresh
      } else {
        setErrorMessage("That code doesn’t match. Please try again.");
      }
    } catch {
      setErrorMessage("That code doesn’t match. Please try again.");
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

  const sessionId = sessionData?.session?.session_id;
  const contributionType =
    sessionData?.contribution?.contribution_type?.toLowerCase();

  const templateUrl = sessionId
    ? `${axiosClient.defaults.baseURL}/auth/contributions/session/${sessionId}/contract-preview`
    : null;

  return (
    <div className="w-screen h-screen overflow-y-scroll bg-gray-100 flex flex-col items-center justify-center ">
      {!writeEnabled && requiresOtp && (
        <div className="w-[45rem]  h-fit shadow-md shadow-gray-600 flex flex-col items-center px-10 pb-2 pt-10">
          {/* OTP FLOW */}

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

          {/* After OTP: show contribution info + the DOCX viewer */}
        </div>
      )}
      {writeEnabled && !requiresOtp && sessionData?.contribution && (
        <>
          {/* <div className="space-y-3 mb-6 w-full">
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
            </div> */}

          {/* DOCX template preview */}
          <div className="w-fit h-screen pt-20 flex flex-col justify-center overflow-scroll">
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="none" viewBox="0 0 50 50">
              <path fill="url(#a)" d="M0 0h50v50H0z"/>
              <defs>
                <pattern id="a" width="1" height="1" patternContentUnits="objectBoundingBox">
                  <use href="#b" transform="scale(.00195)"/>
                </pattern>
                <image id="b" width="512" height="512" data-name="filling-form.png" href="data:image/png;base64,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" preserveAspectRatio="none"/>
              </defs>
            </svg>

            <div className="h-[90rem] bg-gray-200">
              <DocxViewer url={templateUrl} className="w-full h-fit" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
