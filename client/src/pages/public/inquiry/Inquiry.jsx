// src/pages/public/inquiry/Inquiry.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { LoadingSpinner } from "../../../components/commons";
import PinInput from "./components/PinInput";
import Logo from "../../../assets/LOGO.png";
import StyledButton from "../../../components/buttons/StyledButton";
import DocxViewer from "./components/DocxViewer";
import DonorTimeline from "./components/DonorTimeline";
import ContractIcon from "../../../assets/contract.svg";
import ConversationTimeline from "../../admin/acquisition/subpages/ConversationTimeline";
import { FormInput } from "../../../features/FormUtilities";
import { DateInput } from "../../../features/FormUtilities";
import { useForm, FormProvider } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { getMessagingClient, toTimelineItem } from "@/lib/messagingClient";
import QRHandler from "./components/QRHandler"; 

/* ===================== Validation Schema ===================== */
/* Step 1 required, Step 2 optional,
   deliveryReason required only when accept_delivery === "no" */
const schema = yup.object({
  accept_moa: yup
    .string()
    .oneOf(["yes", "no"])
    .required("Please select Yes or No for accepting MOA"),
  satisfied_moa: yup
    .string()
    .oneOf(["yes", "no"])
    .when("accept_moa", {
      is: "yes",
      then: (s) => s.required("Please select Yes or No for MOA errors"),
      otherwise: (s) => s.notRequired(),
    }),
  reason: yup.string().when("accept_moa", {
    is: "no",
    then: (s) => s.trim().required("Reason is required"),
    otherwise: (s) => s.notRequired(),
  }),
  // Step 2 (optional)
  name: yup.string().trim().notRequired(),
  title: yup.string().trim().notRequired(),
  loanStart: yup
    .date()
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .notRequired(),
  loanEnd: yup
    .date()
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .notRequired(),
  // Delivery section
  accept_delivery: yup.string().oneOf(["yes", "no"]).notRequired(), // validated only when that section is shown
  deliveryReason: yup
    .string()
    .trim()
    .when("accept_delivery", {
      is: "no",
      then: (s) => s.required("Please provide a reason."),
      otherwise: (s) => s.notRequired(),
    }),
  deliverySuggestions: yup.string().trim().notRequired(),
});

export default function Inquiry() {
  const { token: tokenFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token");
  const token = tokenFromPath || tokenFromQuery || null;

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  // OTP-gate UI
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(true);
  const [writeEnabled, setWriteEnabled] = useState(false);
  const [otpInput, setOtpInput] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Views & steps
  const [showView, setShowView] = useState("document");
  const [formStep, setFormStep] = useState(1);

  // Messaging
  const messaging = useRef(getMessagingClient()).current;
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [suggestion, setSuggestion] = useState("");

  const [isCompleted, setIsCompleted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  // RHF
  const methods = useForm({
    defaultValues: {
      accept_moa: "",
      satisfied_moa: "",
      reason: "",
      // Step 2 (optional)
      name: "",
      title: "",
      loanStart: null,
      loanEnd: null,
      // Delivery section
      accept_delivery: "",
      deliveryReason: "",
      deliverySuggestions: "",
    },
    resolver: yupResolver(schema),
    mode: "onSubmit",
  });
  const {
    register,
    formState: { errors },
    watch,
    control,
    trigger,
    getValues,
  } = methods;

  const acceptDelivery = watch("accept_delivery");

  const hasDelivery = useMemo(
    () =>
      messages.some((m) =>
        (m?.message ?? "")
          .toLowerCase()
          .startsWith("delivery details submitted")
      ),
    [messages]
  );

  /* ===================== Conversation bootstrap ===================== */
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
      setMessages(
        history.map((raw) => ({
          message_id: raw.message_id ?? raw.id ?? null,
          conversation_id: raw.conversation_id ?? raw.conversationId ?? null,
          sender_user_id: raw.sender_user_id ?? raw.sender?.userId ?? null,
          sender_guest_id: raw.sender_guest_id ?? raw.sender?.guestId ?? null,
          message: raw.message ?? raw.text ?? "",
          type: raw.type || null,
          status: raw.status ?? "sent",
          created_at:
            raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
        }))
      );

      return convo.conversation_id;
    } catch (err) {
      console.error("Guest socket setup failed:", err);
    }
  };

  const refreshMessages = async (cid = conversationId) => {
    if (!cid) return;
    try {
      const { data: history } = await axiosClient.get(
        `/auth/conversations/${cid}/messages`
      );
      setMessages(
        history.map((raw) => ({
          message_id: raw.message_id ?? raw.id ?? null,
          conversation_id: raw.conversation_id ?? raw.conversationId ?? null,
          sender_user_id: raw.sender_user_id ?? raw.sender?.userId ?? null,
          sender_guest_id: raw.sender_guest_id ?? raw.sender?.guestId ?? null,
          message: raw.message ?? raw.text ?? "",
          type: raw.type || null,
          status: raw.status ?? "sent",
          created_at:
            raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
        }))
      );
    } catch (e) {
      console.error("Failed to refresh messages:", e);
    }
  };

    const hasTransportingAt =
    !!sessionData?.contribution?.ContributionTimeline?.on_delivery_at;


  /* ===================== Session fetch (race-proof) ===================== */
  const fetchSeq = useRef(0);
  const fetchSession = async () => {
    try {
      const seq = ++fetchSeq.current;
      if (!token) throw new Error("Missing token");
      setLoading(true);

      const res = await axiosClient.get(`/auth/contributions/session/open`, {
        params: { token },
      });

      // Ignore stale results
      if (seq !== fetchSeq.current) return;

      setSessionData(res.data);

const contrib = res?.data?.contribution;
const sess = res?.data?.session;

// default to "active" if backend doesn't send it yet
const sessionActive = (sess?.is_active ?? true);

const statusCompleted = contrib?.status === "completed";
const statusRejected = contrib?.status === "rejected";
const timelineCompleted = !!contrib?.ContributionTimeline?.completed_at;

// Only completed if status is completed OR (timeline shows completed AND session is inactive)
const completed = statusCompleted || (timelineCompleted && !sessionActive);
setIsRejected(!!statusRejected);

setIsCompleted(completed);

const serverRequiresOtp = !!res.data?.requires_otp;

if (completed || statusRejected) {
  // read-only display: skip OTP & disable writes
  setRequiresOtp(false);
  setWriteEnabled(false);
  setShowView("completed");
  setShowView(statusRejected ? "rejected" : "completed");
} else {
  setRequiresOtp(serverRequiresOtp);
  setWriteEnabled(!serverRequiresOtp);
}

if (serverRequiresOtp) {
  setOtpInput(true);
  setOtpCode("");
  setErrorMessage("");
}

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

  /* ===================== Effects ===================== */
  // Fetch on mount / token change
useEffect(() => {
  fetchSession();
  // Setup polling interval (e.g., every 10 seconds)
  const interval = setInterval(() => {
    fetchSession();
  }, 5000);
  return () => clearInterval(interval); // cleanup on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);


  // Reset OTP gate UI on token change
  useEffect(() => {
    setWriteEnabled(false);
    setRequiresOtp(true);
    setOtpInput(true);
    setOtpCode("");
    setErrorMessage("");
  }, [token]);

  // Join conversation only after OTP is verified
  useEffect(() => {
    if (!writeEnabled) return; // gate until OTP verified
    if (!conversationId || !sessionData?.session?.guest_identity?.guest_id)
      return;

    const guestId = sessionData.session.guest_identity.guest_id;
    const cid = sessionData.contribution.contribution_id;

    messaging.joinConversation(conversationId, {
      guestId,
      contributionId: cid,
    });

    const off = messaging.onMessage((msg) => {
      setMessages((prev) => {
        const key = `${msg.message_id ?? ""}-${msg.created_at ?? ""}-${
          msg.message ?? ""
        }`;
        if (
          prev.some(
            (p) =>
              `${p.message_id ?? ""}-${p.created_at ?? ""}-${
                p.message ?? ""
              }` === key
          )
        )
          return prev;
        const next = [...prev, msg];
        next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return next;
      });
    });

    return () => {
      off();
      messaging.leaveConversation(conversationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    writeEnabled,
    conversationId,
    sessionData?.session?.guest_identity?.guest_id,
  ]);

  // If user lands on delivery view and it's already submitted, move on
useEffect(() => {
  if (showView === "delivery" && hasDelivery) {
    setShowView(hasTransportingAt ? "onDelivery" : "conversation");
  }
}, [showView, hasDelivery, hasTransportingAt]);
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
        // Open the gate immediately, then refresh session data
        setRequiresOtp(false);
        setWriteEnabled(true);
        await fetchSession();
      } else {
        setErrorMessage("That code doesn’t match. Please try again.");
      }
    } catch {
      setErrorMessage("That code doesn’t match. Please try again.");
    }
  };

  /* ===================== Messaging ===================== */
  const sendGuestMessage = (text) => {
    if (!writeEnabled || requiresOtp) return;
    if (!conversationId || !text.trim()) return;
    messaging.sendUserMessage(conversationId, text.trim());
  };

  /* ===================== UI helpers ===================== */
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

  const TimelineHeader = () => (
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
        Revisit the same link to see updates on the review.
      </p>
    </div>
  );

  const RadioQuestion = ({ question, name, options, register, error }) => (
    <div>
      <p className="font-medium text-sm mb-2 mt-4">{question}</p>
      <div className="flex flex-col gap-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer"
          >
            <input
              type="radio"
              value={opt.value}
              {...register(name)}
              className="peer hidden"
            />
            <span className="text-black peer-checked:font-bold">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );

  /* ===================== Timeline updates / submits ===================== */
  const moaSettledAt = async () => {
    if (!writeEnabled || requiresOtp) return;
    try {
      const contribution_id = sessionData?.contribution?.contribution_id;
      if (!contribution_id) return;
      const step = 4;
      await axiosClient.put("/auth/update-step", { contribution_id, step });
      await fetchSession();
    } catch (error) {
      console.error("Failed to update timeline:", error);
    }
  };

  const postDeliveryAt = async () => {
    if (!writeEnabled || requiresOtp) return;
    try {
      const contribution_id = sessionData?.contribution?.contribution_id;
      if (!contribution_id) return;
      const step = 5;
      await axiosClient.put("/auth/update-step", { contribution_id, step });
      await fetchSession();
    } catch (error) {
      console.error("Failed to update delivery:", error);
    }
  };

  const postPendingAt = async (data) => {
    if (!writeEnabled || requiresOtp) return;
    try {
      const contribution_id = sessionData?.contribution?.contribution_id;
      if (!contribution_id) return;

      const step = 3; // pending
      await axiosClient.put("/auth/update-step", { contribution_id, step });
      await fetchSession();

      if (conversationId) {
        const includeStep2 = !!(
          data.name?.trim() ||
          data.title?.trim() ||
          data.loanStart ||
          data.loanEnd
        );

        const lines = [
          "Donor response submitted:",
          `• Accept MOA: ${data.accept_moa === "yes" ? "Yes" : "No"}`,
          ...(data.accept_moa === "yes"
            ? [`• MOA errors: ${data.satisfied_moa === "yes" ? "Yes" : "No"}`]
            : []),
        ];

        if (data.accept_moa === "no" && data.reason?.trim()) {
          lines.push(`• Reason: ${data.reason.trim()}`);
        }

        if (includeStep2) {
          lines.push(
            `• Donor: ${data.name?.trim() || "-"}`,
            `• Artifact: ${data.title?.trim() || "-"}`,
            `• Loan Start: ${
              data.loanStart
                ? new Date(data.loanStart).toLocaleDateString()
                : "-"
            }`,
            `• Loan End: ${
              data.loanEnd ? new Date(data.loanEnd).toLocaleDateString() : "-"
            }`
          );
        }

        try {
          if (messaging.sendClientSystemNote) {
            messaging.sendClientSystemNote(conversationId, lines.join("\n"));
          } else {
            messaging.sendUserMessage(conversationId, lines.join("\n"));
          }
        } catch (sendErr) {
          console.error("Failed to send postPendingAt message:", sendErr);
        }
      }
    } catch (error) {
      console.error("Failed to update timeline:", error);
    }
  };

  /* ===================== Navigation handlers ===================== */
  const handleNext = async () => {
    if (formStep === 1) {
      const acceptMoa = getValues("accept_moa");
      const fields = ["accept_moa", "reason"];
      if (acceptMoa === "yes") fields.push("satisfied_moa");

      const ok = await trigger(fields);
      if (!ok) return;

      const satisfied = getValues("satisfied_moa"); // answers "Are there any errors?"
      const hasErrors = satisfied === "yes"; // yes => there ARE errors

      if (acceptMoa === "yes" && !hasErrors) {
        // Accept + NO errors -> MOA is settled now
        await moaSettledAt();
        setShowView("moasettle");
        return;
      }

      if (acceptMoa === "yes" && hasErrors) {
        // Accept + has errors -> capture additional info
        setFormStep(2);
        return;
      }

      // accept_moa === "no" -> mark pending and show waiting screen
      await postPendingAt(getValues());
      setShowView("moasettle");
      return;
    }

    if (formStep === 2) {
      // Step 2 optional -> submit now (still pending until admins resolve)
      await postPendingAt(getValues());
      setShowView("moasettle");
      return;
    }
  };

  const postDeliverySection = async (data) => {
    if (!writeEnabled || requiresOtp) return;
    try {
      if (!conversationId) return;

      const lines = [
        "Delivery details submitted:",
        `• Will donor deliver artifact: ${
          data.accept_delivery === "yes" ? "Yes" : "No"
        }`,
        ...(data.accept_delivery === "no" && data.deliveryReason
          ? [`• Delivery reason: ${data.deliveryReason}`]
          : []),
        ...(data.deliverySuggestions
          ? [`• Suggestions: ${data.deliverySuggestions}`]
          : []),
      ];
      const text = lines.join("\n");

      if (messaging.sendClientSystemNote) {
        messaging.sendClientSystemNote(conversationId, text);
      } else {
        messaging.sendUserMessage(conversationId, text);
      }

      await refreshMessages(conversationId);
    } catch (e) {
      console.error("Failed to send delivery section:", e);
    }
  };

// Replace your current handleSubmitStep3 with:
const handleSubmitStep3 = async () => {
  const ok = await trigger([
    "accept_delivery",
    "deliveryReason",
    "deliverySuggestions",
  ]);
  if (!ok) return;

  const values = getValues();
  await postDeliverySection(values);

  if (values.accept_delivery === "yes") {
    await postDeliveryAt();          
    setShowView("onDelivery");       
  } else {
    setShowView("conversation");     
  }
};


  /* ===================== Early returns ===================== */
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

  /* ===================== Derived flags ===================== */
  const hasPendingAt =
    !!sessionData?.contribution?.ContributionTimeline?.pending_at;
  const hasMoasSetteledAt =
    !!sessionData?.contribution?.ContributionTimeline?.moa_settled_at;

  const userLike = sessionData?.session?.guest_identity
    ? { id: sessionData.session.guest_identity.guest_id, role: "guest" }
    : null;

  const sessionId = sessionData?.session?.session_id;
  const templateUrl = sessionId
    ? `${axiosClient.defaults.baseURL}/auth/contributions/session/${sessionId}/contract-preview`
    : null;

  /* ===================== Render ===================== */
  return (
    <div className="w-screen h-screen overflow-y-scroll flex flex-col items-center justify-center ">
      {/* OTP Gate */}
      {!isCompleted && !isRejected && !writeEnabled && requiresOtp && (
        <div className="w-[45rem] h-fit shadow-md shadow-gray-600 flex flex-col items-center px-10 pb-2 pt-10">
          <>
            {otpInput ? (
              <>
                <PinHeader />
                <span className="text-6xl font-semibold mb-10">
                  OTP Verification
                </span>
                <span className="text-3xl font-semibold text-center w-[35rem] mb-10">
                  We’d like to confirm your identity before you proceed.
                </span>
                <span className="text-center w-[35rem] text-xl mb-10">
                  Click the button below to send a one-time password (OTP) to
                  your registered email address.
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
                    Previous
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

      {/* Everything below is fully gated by OTP */}
       {(((writeEnabled && !requiresOtp) || isCompleted || isRejected) && sessionData?.contribution) && (
        <>
          {/* Contract preview */}
          {showView === "document" && (
            <div className="w-fit h-screen pt-20 flex flex-col items-center overflow-y-scroll px-1 gap-y-5 pb-5">
              <div className="w-fit h-fit flex flex-col items-center">
                <img
                  src={ContractIcon}
                  alt="Contract Icon"
                  className="h-16 mb-4"
                />
                <span className="text-5xl font-semibold my-2">Contract</span>
                <span className="text-center text-xl">
                  Please review the Memorandum of Agreement. <br />
                  The MOA will be signed when the donor has delivered the
                  artifact.
                </span>
              </div>

              <div className="h-[135rem] shadow-md shadow-gray-600">
                <DocxViewer url={templateUrl} className="w-full h-fit" />
              </div>

              <div className="min-h-fit w-full flex justify-end">
                <div className="min-h-fit w-full flex justify-end">
                  <StyledButton
                    onClick={() =>
                      setShowView(
                        isCompleted
                          ? "completed" 
                          : isRejected
                          ? "rejected"
                       : hasPendingAt
                          ? "moasettle"
                          : hasMoasSetteledAt
                          ? hasTransportingAt
                            ? "onDelivery"
                            : hasDelivery
                            ? "conversation"
                            : "delivery"
                          : "timeline"
                      )
                    }
                    className="h-fit"
                  >
                    Next
                  </StyledButton>
                </div>
              </div>
            </div>
          )}

          {/* Step 1/2 Flow (only if not yet settled/pending) */}
          {showView === "timeline" && !hasPendingAt && !hasMoasSetteledAt && (
            <div className="min-w-[50rem] h-full flex flex-col items-center justify-center px-2">
              <div className="w-full max-w-5xl flex flex-col items-center gap-y-10">
                <FormProvider {...methods}>
                  <TimelineHeader />

                  <DonorTimeline
                    timelineData={
                      sessionData?.contribution?.ContributionTimeline ||
                      sessionData?.contribution?.contributiontimeline
                    }
                  />

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
                        {formStep === 1 ? (
                          <>
                            <h2 className="text-lg font-bold">
                              What are your thoughts?
                            </h2>
                            <p className="text-gray-600 text-sm">
                              Please answer the questions below. Your responses
                              are important in determining the final outcome of
                              the transaction.
                            </p>
                          </>
                        ) : (
                          <>
                            <h2 className="text-lg font-bold">
                              Official Notice
                            </h2>
                            <p className="text-gray-600 text-sm">
                              Please be advised that only the following sections
                              of the Memorandum of Agreement (MOA) are subject
                              to modification:
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <form className="mt-8 w-full" noValidate>
                      {formStep === 1 && (
                        <>
                          <RadioQuestion
                            question="Do you accept all conditions in the MOA?"
                            name="accept_moa"
                            options={[
                              { value: "yes", label: "Yes" },
                              { value: "no", label: "No" },
                            ]}
                            register={register}
                            error={errors.accept_moa}
                          />

                          {watch("accept_moa") === "no" && (
                            <FormInput
                              placeholder="State your reason"
                              register={register}
                              name="reason"
                              error={errors.reason}
                              className="w-full mt-2"
                            />
                          )}

                          {watch("accept_moa") === "yes" && (
                            <RadioQuestion
                              question="Are there any errors in the current MOA?"
                              name="satisfied_moa"
                              options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                              ]}
                              register={register}
                              error={errors.satisfied_moa}
                            />
                          )}
                        </>
                      )}

                      {formStep === 2 && (
                        <>
                          <span className="text-sm font-medium">
                            Name of the Donor:
                          </span>
                          <FormInput
                            placeholder="Complete Name (optional)"
                            register={register}
                            name="name"
                            error={errors.name}
                            className="w-full mt-2"
                          />

                          <span className="text-sm font-medium">
                            Title of the Artifact:
                          </span>
                          <FormInput
                            placeholder="Title of the Artifact (optional)"
                            register={register}
                            name="title"
                            error={errors.title}
                            className="w-full mt-2"
                          />

                          <span className="text-sm font-medium">
                            Starting date of the loan:
                          </span>
                          <DateInput
                            name="loanStart"
                            control={control}
                            placeholder="Start date (optional)"
                            minDate={new Date()}
                            maxDate={new Date(2100, 0, 1)}
                            error={errors.loanStart}
                            className="w-full mt-2"
                          />

                          <span className="text-sm font-medium">
                            Ending date of the loan:
                          </span>
                          <DateInput
                            name="loanEnd"
                            control={control}
                            placeholder="End date (optional)"
                            minDate={new Date()}
                            maxDate={new Date(2100, 0, 1)}
                            error={errors.loanEnd}
                            className="w-full mt-2"
                          />
                        </>
                      )}
                    </form>
                  </div>

                  <div className="min-h-fit w-full flex justify-between">
                    <StyledButton
                      onClick={() => {
                        if (formStep === 1) setShowView("document");
                        else if (formStep === 2) setFormStep(1);
                      }}
                      className="h-fit"
                    >
                      Previous
                    </StyledButton>

                    <StyledButton onClick={handleNext} className="h-fit">
                      {formStep < 2 ? "Next" : "Submit"}
                    </StyledButton>
                  </div>
                </FormProvider>
              </div>
            </div>
          )}

          {/* Waiting / settled screen */}
          {showView === "moasettle" && (
            <div className="w-full max-w-4xl gap-y-10 justify-center h-full flex flex-col items-center px-2">
              <TimelineHeader />

              <DonorTimeline
                timelineData={
                  sessionData?.contribution?.ContributionTimeline ||
                  sessionData?.contribution?.contributiontimeline
                }
              />

              <div className="w-full flex bg-white shadow-md shadow-gray-500 rounded-xl p-8 gap-x-5 items-center">
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
                <span className="font-semibold">
                  {hasMoasSetteledAt
                    ? "You can now proceed to the transportation step."
                    : "We’ll email you once the admins have reviewed your concern, and then you’ll be able to continue with the transaction."}
                </span>
              </div>

              <div className="min-h-fit w-full flex justify-between">
                <StyledButton
                  onClick={() => setShowView("document")}
                  className="h-fit"
                >
                  Document
                </StyledButton>
                {hasMoasSetteledAt && (
                  <StyledButton
                    onClick={() =>
                      setShowView(
                        hasTransportingAt ? "conversation" : "delivery"
                      )
                    }
                    className="h-fit"
                  >
                    Next
                  </StyledButton>
                )}
              </div>
            </div>
          )}

          {/* Delivery section (pre-transport) */}
          {showView === "delivery" && !hasTransportingAt && (
            <div className="w-full max-w-4xl gap-y-10 justify-center h-full flex flex-col items-center px-2">
              <TimelineHeader />

              <DonorTimeline
                timelineData={
                  sessionData?.contribution?.ContributionTimeline ||
                  sessionData?.contribution?.contributiontimeline
                }
              />

              <div className="w-full bg-white shadow-md shadow-gray-500 rounded-xl p-8 mt-6">
                <h2 className="text-lg font-bold">Delivery</h2>
                <p className="text-gray-600 text-sm">
                  Please confirm delivery details for the artifact.
                </p>

                <form className="space-y-6 mt-6" noValidate>
                  <RadioQuestion
                    question="Do you confirm that you will be the one to deliver the artifact?"
                    name="accept_delivery"
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    register={register}
                    error={errors.accept_delivery}
                  />

                  {watch("accept_delivery") === "no" && (
                    <FormInput
                      placeholder="Reason (required)"
                      register={register}
                      name="deliveryReason"
                      error={errors.deliveryReason}
                      className="w-full"
                    />
                  )}

                  <FormInput
                    placeholder="Any suggestions? (optional)"
                    register={register}
                    name="deliverySuggestions"
                    error={errors.deliverySuggestions}
                    className="w-full"
                  />

                  <div className="flex justify-between">
                    <StyledButton
                      onClick={() => setShowView("document")}
                      className="h-fit"
                    >
                      Document
                    </StyledButton>
                    <StyledButton onClick={handleSubmitStep3}>
                      Submit delivery info
                    </StyledButton>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Conversation after delivery info (pre-transport) */}
          {showView === "conversation" && !hasTransportingAt && (
            <div className="w-full max-w-4xl justify-center h-full flex flex-col items-center gap-y-10">
              <TimelineHeader />

              <DonorTimeline
                timelineData={
                  sessionData?.contribution?.ContributionTimeline ||
                  sessionData?.contribution?.contributiontimeline
                }
              />

              <div className="w-full h-fit rounded-xl shadow-md shadow-gray-500 flex flex-col p-2">
                <ConversationTimeline
                  items={messages
                    .map((m) => toTimelineItem(m, userLike))
                    .filter(Boolean)}
                  height="33rem"
                />
                <div className="flex gap-2">
                  <input
                    className="flex w-full border rounded-xl px-3 py-2"
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
                    className="rounded-xl"
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

              <div className="flex mt-2 justify-between w-full">
                <StyledButton
                  onClick={() => setShowView("document")}
                  className="h-fit"
                >
                  Document
                </StyledButton>

                <StyledButton
                  onClick={() => {
                    postDeliveryAt();
                    setShowView("onDelivery");
                  }}
                  className="h-fit"
                >
                  Confirm Delivery
                </StyledButton>
              </div>
            </div>
          )}

          {showView === "onDelivery" && (
            <div className="w-full max-w-6xl justify-center h-full flex flex-col items-center gap-y-6">
              <TimelineHeader />
              <DonorTimeline
                timelineData={
                  sessionData?.contribution?.ContributionTimeline ||
                  sessionData?.contribution?.contributiontimeline
                }
              />
              <div className="bg-white shadow-md shadow-gray-500 rounded-xl flex flex-col py-6 px-20 w-full items-center">
                <div className="w-full  mb-3">
                  <span className="text-xl">Delivery Instructions:</span>
                </div>
                <div className="w-[55rem]">
                <span className="text-2xl flex flex-col">
                  • The Museum is open 8:00am to 5:00pm,  Monday to Friday,
                  and close during holidays.
                </span>
                <span className="text-2xl">
                  • To complete the transaction, please present this unique QR code to a museum staff member. They will scan it to finalize and record the transaction.
                </span>
                </div>
                <div className="w-full flex h-80 justify-end">
                  <QRHandler 
                  sessionId={sessionId} 
                  contributionId={sessionData?.contribution?.contribution_id}  
                  triggerGenerate={hasTransportingAt} 
                  />
                </div>
              </div>
              <div className="w-full flex justify-start">
                <StyledButton
                  onClick={() => setShowView("document")}
                  className="h-fit"
                >
                  Document
                </StyledButton>

              </div>
            </div>
          )}

          {/* Completed (read-only) */}
          {showView === "completed" && (
            <div className="w-full max-w-4xl gap-y-10 justify-center h-full flex flex-col items-center px-2">
              <TimelineHeader />
              <DonorTimeline
                timelineData={
                  sessionData?.contribution?.ContributionTimeline ||
                  sessionData?.contribution?.contributiontimeline
                }
              />
              <div className="w-full flex bg-white shadow-md shadow-gray-500 rounded-xl p-8 gap-x-5 items-center">
                <div className="shrink-0 mt-1">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 33L12 25L9 28L20 39L41 18L38 15L20 33Z" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-semibold">
                  This transaction is <b>completed</b>. Thank you for your contribution.
                </span>
              </div>

            </div>
          )}

          {showView === "rejected" && (
          <div className="w-full max-w-4xl gap-y-10 justify-center h-full flex flex-col items-center px-2">
            <TimelineHeader />
            <DonorTimeline
              timelineData={
                sessionData?.contribution?.ContributionTimeline ||
                sessionData?.contribution?.contributiontimeline
              }
            />
            <div className="w-full flex bg-white shadow-md shadow-gray-500 rounded-xl p-8 gap-x-5 items-center">
              <div className="shrink-0 mt-1">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 9L39 39M39 9L9 39" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-semibold">
                This transaction was <b>cancelled</b>. Your contribution attempt was cancelled. The timeline remains visible for your reference.
              </span>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}


