import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { LoadingSpinner } from "../../../components/commons";
import PinInput from "./components/PinInput";
import Logo from "../../../assets/LOGO.png";
import StyledButton from "../../../components/buttons/StyledButton";
import DocxViewer from "./components/DocxViewer";
import DonorTimeline from "./components/DonorTimeline";
import ContractIcon from "../../../assets/contract.svg";
import { getSocketClient } from "../../../lib/socketSingleton";
import ConversationTimeline from "../../admin/acquisition/subpages/ConversationTimeline";
import { mapMessageToLane } from "../../../utils/messageUtils";

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

  // Stable socket instance
  const socketRef = useRef(null);
  if (!socketRef.current) socketRef.current = getSocketClient();
  const socket = socketRef.current;

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  /* ===================== Message normalization & dedupe ===================== */

  const normalizeMessage = (raw) => ({
    message_id: raw.message_id ?? raw.id ?? null,
    conversation_id: raw.conversation_id ?? raw.conversationId ?? null,
    sender_user_id: raw.sender_user_id ?? raw.sender?.userId ?? null,
    sender_guest_id: raw.sender_guest_id ?? raw.sender?.guestId ?? null,
    message: raw.message ?? raw.text ?? "",
    status: raw.status ?? "sent",
    created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  });

  const msgKey = (m) =>
    m.message_id ??
    `${m.conversation_id ?? ""}-${m.sender_guest_id ?? m.sender_user_id ?? ""}-${m.created_at ?? ""}-${m.message ?? ""}`;

  /* ===================== Bootstrapping conversation ===================== */

  const setupConversation = async (session) => {
    try {
      const cid = session.contribution.contribution_id;

      const { data: convo } = await axiosClient.get(
        `/auth/conversations/by-contribution/${cid}`
      );
      setConversationId(convo.conversation_id);

      const { data: history } = await axiosClient.get(
        `/auth/conversations/${convo.conversation_id}/messages`
      );
      setMessages(history.map(normalizeMessage));

      return convo.conversation_id;
    } catch (err) {
      console.error("Guest socket setup failed:", err);
    }
  };

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

      if (
        res.data?.contribution?.contribution_id &&
        res.data?.session?.guest_identity?.guest_id
      ) {
        const convoId = await setupConversation(res.data);
        setConversationId(convoId);
      }
    } catch (err) {
      console.error(err);
      setError("Invalid or expired interaction link.");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== Socket (re)join + live updates ===================== */

  useEffect(() => {
    if (!conversationId || !sessionData?.session?.guest_identity?.guest_id) return;

    const s = socket;
    const room = `conversation:${conversationId}`;
    const guestId = sessionData.session.guest_identity.guest_id;
    const cid = sessionData.contribution.contribution_id;

    let joined = false;

    const join = () => {
      if (joined) return;
      try {
        s.joinRoom(room, { guestId, contributionId: cid });
        joined = true;
      } catch (e) {
        console.warn("joinRoom failed (will retry on connect):", e);
      }
    };

    const leave = () => {
      if (!joined) return;
      try {
        s.leaveRoom(room);
      } finally {
        joined = false;
      }
    };

    // Live message handler – only append if not already present
    const handler = (raw) => {
      const msg = normalizeMessage(raw);

      setMessages((prev) => {
        const key = msgKey(msg);
        if (prev.some((p) => msgKey(p) === key)) return prev;
        const next = [...prev, msg];
        next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return next;
      });
    };

    // Join immediately if already connected
    const isConnected =
      s.connected ||
      (s.socket && s.socket.connected) ||
      (s.io && s.io.connected) ||
      false;
    if (isConnected) join();

    // Join on future connect/reconnects
    const on = s.on?.bind(s);
    const off = s.off?.bind(s);
    const onConnect = (cb) =>
      s.onConnect ? s.onConnect(cb) : on && on("connect", cb);
    const offConnect = (cb) =>
      s.offConnect ? s.offConnect(cb) : off && off("connect", cb);
    const onReconnect = (cb) =>
      s.onReconnect
        ? s.onReconnect(cb)
        : (s.io && s.io.on && s.io.on("reconnect", cb)) ||
          (on && on("reconnect", cb));
    const offReconnect = (cb) =>
      s.offReconnect
        ? s.offReconnect(cb)
        : (s.io && s.io.off && s.io.off("reconnect", cb)) ||
          (off && off("reconnect", cb));

    onConnect(join);
    onReconnect(join);

    s.onMessage(handler);

    return () => {
      s.offMessage(handler);
      offConnect(join);
      offReconnect(join);
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, sessionData?.session?.guest_identity?.guest_id]);

  /* ===================== Lifecycle ===================== */

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ===================== OTP handlers ===================== */

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
        await fetchSession(); 
      } else {
        setErrorMessage("That code doesn’t match. Please try again.");
      }
    } catch {
      setErrorMessage("That code doesn’t match. Please try again.");
    }
  };

  /* ===================== Send message (NO optimistic) ===================== */

  const sendGuestMessage = (text) => {
    if (!conversationId || !text.trim()) return;
    const s = socketRef.current;
    const guestId = sessionData?.session?.guest_identity?.guest_id;

    s.emit("message", {
      room: `conversation:${conversationId}`,
      text: text.trim(),
      senderUserId: null,
      senderGuestId: guestId,
    });
  };

  /* ===================== Rendering ===================== */

  const userLike = sessionData?.session?.guest_identity
    ? { id: sessionData.session.guest_identity.guest_id, role: "guest" }
    : null;

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
        </div>
      )}

      {writeEnabled && !requiresOtp && sessionData?.contribution && (
        <>
          {/* DOCX template preview */}
          {showView === "document" && (
            <div className="w-fit h-screen pt-20 flex flex-col items-center overflow-y-scroll px-1 gap-y-5 pb-5">
              <div className="w-fit h-fit flex flex-col items-center">
                <img src={ContractIcon} alt="Contract Icon" className="h-16 mb-4" />
                <span className="text-5xl font-semibold my-2">Contract</span>
                <span className="text-center text-xl">
                  Please review the Memorandum of Agreement. <br />
                  The MOA will be signed when the the donor has delivered the artifact.
                </span>
              </div>

              <div className="h-[135rem] shadow-md shadow-gray-600">
                <DocxViewer url={templateUrl} className="w-full h-fit" />
              </div>

              <div className="min-h-fit w-full flex justify-end">
                <StyledButton
                  onClick={() => setShowView("timeline")}
                  className="h-fit"
                >
                  Next
                </StyledButton>
              </div>
            </div>
          )}

          {showView === "timeline" && (
            <div className="min-w-[50rem] h-full flex flex-col items-center justify-center px-2">
              <div className="w-full max-w-5xl flex flex-col items-center gap-y-10 py-10">
                {/* Heading */}
                <div className="flex flex-col items-center justify-center text-center h-fit">
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
                  timelineData={
                    sessionData?.contribution?.ContributionTimeline ||
                    sessionData?.contribution?.contributiontimeline
                  }
                />

                {/* Card with questions */}
                <div className="w-full flex bg-white shadow-md shadow-gray-500 rounded-xl p-8 gap-x-5">
                  <div className="flex flex-col items-start gap-4 w-[20rem]">
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
                                setShowInputs(false);
                                setQ2Answer("");
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
                                setCurrentQuestion(1);
                                setQ2Answer("");
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
                                setShowInputs(false);
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
                          <label className="block font-medium text-sm mb-2">Reason:</label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                            rows="3"
                            placeholder="Please provide your reason..."
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-sm mb-2">Any Suggestion:</label>
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
                  <StyledButton
                    onClick={() => setShowView("document")}
                    className="h-fit"
                  >
                    Back
                  </StyledButton>
                  <StyledButton
                    onClick={() => setShowView("conversation")}
                    className="h-fit"
                  >
                    Accept
                  </StyledButton>
                </div>
              </div>
            </div>
          )}

          {showView === "conversation" && (
            <div className="w-full max-w-4xl justify-center h-full flex flex-col">
              {/* Timeline */}
              <div className="w-full h-fit border">
                <ConversationTimeline
                  items={messages.map((m) => mapMessageToLane(m, userLike)).filter(Boolean)}
                  height="33rem"
                />
                </div>

              {/* Input Box */}
              <div className="flex mt-2">
                <input
                  className="flex-1 border rounded-l px-3 py-2"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (suggestion.trim()) {
                        sendGuestMessage(suggestion.trim());
                        setSuggestion("");
                      }
                    }
                  }}
                />
                <StyledButton
                  className="rounded-l-none"
                  onClick={() => {
                    if (suggestion.trim()) {
                      sendGuestMessage(suggestion.trim());
                      setSuggestion("");
                    }
                  }}
                >
                  Send
                </StyledButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// qr handler usage
// import QRHandler from "./components/QRHandler";
// <QRHandler
//   sessionId={sessionId}
//   contributionId={sessionData?.contribution?.contribution_id}
//   triggerGenerate={true}
// />
