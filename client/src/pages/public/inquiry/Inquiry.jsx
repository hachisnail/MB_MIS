import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { LoadingSpinner } from "../../../components/commons";
import PinInput from "./components/PinInput";
import Logo from "../../../assets/LOGO.png";
import StyledButton from "../../../components/buttons/StyledButton";
import DocxViewer from "./components/DocxViewer";
import DonorTimeline from "./components/DonorTimeline";
import ContractIcon from "../../../assets/contract.svg";

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

  const [showView, setShowView] = useState("document");

  // Question flow state
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [q1Answer, setQ1Answer] = useState("");
  const [q2Answer, setQ2Answer] = useState("");
  const [showInputs, setShowInputs] = useState(false);
  const [reason, setReason] = useState("");
  const [suggestion, setSuggestion] = useState("");

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

  // // Close session on tab close
  // useEffect(() => {
  //   const handleUnload = () => {
  //     const url = `${axiosClient.defaults.baseURL}/auth/contributions/session/close`;
  //     const blob = new Blob([JSON.stringify({ reason: "tab_closed" })], {
  //       type: "application/json",
  //     });
  //     navigator.sendBeacon(url, blob);
  //   };
  //   window.addEventListener("beforeunload", handleUnload);
  //   return () => window.removeEventListener("beforeunload", handleUnload);
  // }, []);

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
    <div className="w-screen h-screen overflow-y-scroll flex flex-col items-center justify-center ">
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
                    className={`text-2xl ${errorMessage === "" ? "text-gray-500" : "text-red-500"
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

          {showView === "document" && (
            <div className="w-fit h-screen pt-20 flex flex-col items-center overflow-y-scroll px-1 gap-y-5 pb-5">
              <div className="w-fit h-fit flex flex-col items-center">
                <img src={ContractIcon} alt="Contract Icon" className="h-16 mb-4" />
                <span className="text-5xl font-semibold my-2">Contract</span>
                <span className="text-center text-xl">Please review the Memorandum of Agreement. <br />The MOA will be signed when the the donor has delivered the artifact.</span>
              </div>

              <div className="h-[135rem] shadow-md shadow-gray-600">
                <DocxViewer url={templateUrl} className="w-full h-fit" />
              </div>

              <div className="min-h-fit w-full flex justify-end">
                <StyledButton onClick={() => setShowView("timeline")} className="h-fit">Next</StyledButton>
              </div>
            </div>
          )}
          {showView === "timeline" && (
            <div className="min-w-[50rem] h-full flex flex-col items-center justify-center">
              {/* === START: timeline content === */}
              <div className="w-full max-w-5xl flex flex-col items-center gap-y-10 py-10">

                {/* Heading */}
                <div className="flex flex-col items-center justify-center text-center h-full">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-4"
                  >
                    <path
                      d="M24 12V24L32 28M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z"
                      stroke="black"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <h1 className="text-2xl font-semibold">Please wait for the response</h1>
                  <p className="text-gray-600">
                    Revisit the same link to see the update about the review
                  </p>
                </div>


                {/* Timeline */}
                <DonorTimeline
                  timelineData={sessionData?.contribution?.ContributionTimeline || sessionData?.contribution?.contributiontimeline}
                />





                {/* Card with questions */}
                <div className="w-full flex bg-white shadow-md shadow-gray-500/30 rounded-xl p-8 gap-x-5">
                  <div className="flex flex-col items-start gap-4 w-[20rem]">
                    {/* pen tip icon */}
                    <div className="shrink-0 mt-1">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 4L33 11L36 26L26 36L11 33L4 4ZM4 4L19.172 19.172M24 38L38 24L44 30L30 44L24 38ZM26 22C26 24.2091 24.2091 26 22 26C19.7909 26 18 24.2091 18 22C18 19.7909 19.7909 18 22 18C24.2091 18 26 19.7909 26 22Z"
                          stroke="black"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold">What are your thoughts?</h2>
                      <p className="text-gray-600 text-sm">
                        Please answer the questions below. Your responses are important in
                        determining the final outcome of the transaction.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-8">
                    {/* Q1 */}
                    {currentQuestion >= 1 && (
                      <div>
                        <p className="font-medium text-sm mb-2">
                          Do you accept all conditions in the MOA (Memorandum of Agreement)?
                        </p>
                        <div className="flex flex-col gap-4">
                          <label className="flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer has-[input:checked]:border-green-500">
                            <input
                              type="radio"
                              name="accept_moa"
                              value="yes"
                              className="peer hidden"
                              checked={q1Answer === "yes"}
                              onChange={(e) => {
                                setQ1Answer(e.target.value);
                                setCurrentQuestion(2);
                                setShowInputs(false); // Hide inputs when switching to Yes
                                setQ2Answer(""); // Reset Q2 answer
                              }}
                            />
                            <span className="text-black peer-checked:text-green-600">Yes</span>
                          </label>

                          <label className="flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer has-[input:checked]:border-red-500">
                            <input
                              type="radio"
                              name="accept_moa"
                              value="no"
                              className="peer hidden"
                              checked={q1Answer === "no"}
                              onChange={(e) => {
                                setQ1Answer(e.target.value);
                                setShowInputs(true);
                                setCurrentQuestion(1); // Stay on Q1, don't show Q2
                                setQ2Answer(""); // Reset Q2 answer
                              }}
                            />
                            <span className="text-black peer-checked:text-red-600">No</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Q2 */}
                    {currentQuestion === 2 && (
                      <div>
                        <p className="font-medium text-sm mb-2">
                          Are there any errors in the current MOA (Memorandum of Agreement)?
                        </p>
                        <div className="flex flex-col gap-4">
                          <label className="flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer has-[input:checked]:border-green-500">
                            <input
                              type="radio"
                              name="satisfied_moa"
                              value="yes"
                              className="peer hidden"
                              checked={q2Answer === "yes"}
                              onChange={(e) => {
                                setQ2Answer(e.target.value);
                                setShowInputs(true);
                              }}
                            />
                            <span className="text-black peer-checked:text-green-600">Yes</span>
                          </label>

                          <label className="flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer has-[input:checked]:border-red-500">
                            <input
                              type="radio"
                              name="satisfied_moa"
                              value="no"
                              className="peer hidden"
                              checked={q2Answer === "no"}
                              onChange={(e) => {
                                setQ2Answer(e.target.value);
                                setShowInputs(false); // Hide inputs for No
                              }}
                            />
                            <span className="text-black peer-checked:text-red-600">No</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Reason and Suggestion Inputs */}
                    {showInputs && (
                      <div className="space-y-4">
                        <div>
                          <label className="block font-medium text-sm mb-2">
                            Reason:
                          </label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                            rows="3"
                            placeholder="Please provide your reason..."
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-sm mb-2">
                            Any Suggestion:
                          </label>
                          <textarea
                            value={suggestion}
                            onChange={(e) => setSuggestion(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                            rows="3"
                            placeholder="Please provide any suggestions..."
                          />
                        </div>
                      </div>
                    )}
                  </div>


                </div>



                {/* Bottom buttons */}
                <div className="min-h-fit w-full flex justify-between">
                  <StyledButton onClick={() => setShowView("document")} className="h-fit">Back</StyledButton>
                  <StyledButton onClick={() => alert(`accepted`)} className="h-fit">Accept</StyledButton>
                </div>
              </div>
              {/* === END: timeline content === */}
            </div>
          )}

        </>
      )}
    </div>
  );
}

// qr hadnler usage
// import QRHandler from "./components/QRHandler";

//       <QRHandler
//         sessionId={sessionId}
//         contributionId={sessionData?.contribution?.contribution_id}
//         triggerGenerate={true}
//       />