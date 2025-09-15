// =============================================
// components/ConversationTimeline.jsx (v2.4)
// - Message bubble auto-fit to content
// - Max width + multiline wrapping
// - Aggressive wrapping for long unbroken strings (URLs, hashes)
// - Keeps centered track + dot halo behavior from v2.3
// =============================================
import React, { useRef, useEffect } from "react";
import { conversationSample } from "./conversationSample";

export default function ConversationTimeline({
  items = [],
  height = "34rem",
  className = "",
}) {
  const laneStyles = {
    donor: "bg-[#8B7E52] text-white border-[#736945]",
    admin: "bg-[#fff299] text-[#1D1911] border-[#c6b462]",
  };

  const bubbleStyles = {
    donor: "bg-[#BE9758] border-[#7d6239] text-[#1D1911]",
    admin: "bg-[#FFF07A] border-[#C3B567] text-[#1D1911]",
    default: "bg-white border-gray-300 text-[#1D1911]",
  };

  const ringStyles = {
    donor: "border-[#8b7e52]",
    admin: "border-[#c6b462]",
  };

  // keep lane key util
  const laneKey = (v) => (v === "admin" ? "admin" : "donor");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items.length]);

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      {/* Scrollable area */}
      <div
        ref={scrollRef}
        className="
          absolute inset-0 overflow-y-auto overflow-x-hidden px-6 py-6
          [--label:11rem] [--dotCol:3rem] [--gapX:1.5rem]
          [--trackW:0.4rem] [--cutout:0.5rem]
          [--bubbleMax:40rem]                  /* default max bubble width */

          sm:[--label:9rem]  sm:[--dotCol:3rem]  sm:[--gapX:1.25rem] sm:[--bubbleMax:34rem]
          md:[--label:10rem] md:[--dotCol:3rem]  md:[--gapX:1.5rem]  md:[--bubbleMax:38rem]
          3xl:[--label:13rem] 3xl:[--dotCol:3.5rem] 3xl:[--gapX:1.75rem] 3xl:[--bubbleMax:52rem]
        "
      >
        <div className="relative flex flex-col gap-8">
          {/* Center track */}
          <div
            className="pointer-events-none absolute rounded-full bg-[#1D1911]/80"
            style={{
              width: "var(--trackW)",
              left: `calc(var(--label) + var(--gapX) + (var(--dotCol) / 2))`,
              transform: "translateX(-50%)",
              zIndex: "0",
              top: "calc(1.5rem + 2rem)", // Start below the dot
              bottom: "0"
            }}
          />

          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-lg">
              No conversation yet
            </div>
          ) : (
            items.map((it, idx) => {
              const k = laneKey(it.laneVariant);
              const role = (it.author || "Donor").toLowerCase().includes("admin")
                ? "admin"
                : "donor";
              const bubble = bubbleStyles[role] || bubbleStyles.default;

              return (
                <div
                  key={it.id ?? idx}
                  className="flex items-start shrink-0"
                  style={{ columnGap: "var(--gapX)" }}
                >
                  {/* LEFT: label */}
                  <div className="w-[var(--label)] flex justify-end shrink-0">
                    <div
                      className={`px-6 py-3 rounded-lg border text-base font-semibold shadow-sm ${laneStyles[k]}`}
                      style={{ minWidth: "8rem", textAlign: "center" }}
                    >
                      {it.laneLabel || ""}
                    </div>
                  </div>

                  {/* CENTER: dot + halo */}
                  <div className="w-[var(--dotCol)] flex justify-center relative shrink-0">
                    {/* HALO */}
                    <span
                      className="absolute z-[5] rounded-full bg-white"
                      style={{
                        width: "calc(var(--dotCol) + var(--cutout))",
                        height: "calc(var(--dotCol) + var(--cutout))",
                        top: "0",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                      aria-hidden
                    />
                    {/* Dot */}
                    <span
                      className={`relative z-10 rounded-full bg-white border-4 ${ringStyles[k]}`}
                      style={{
                        width: "3rem",
                        height: "3rem",
                        position: "absolute",
                        top: "0",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                      aria-hidden
                    />
                    {/* Badge */}
                    {it.badge ? (
                      <div
                        className={`absolute whitespace-nowrap px-4 py-2 text-base font-semibold rounded-lg shadow-sm ${bubbleStyles[role]}`}
                        style={{
                          top: "1.5rem",
                          right: "-0.5rem",
                          transform: "translate(100%, -50%)",
                        }}
                      >
                        {it.badge}
                      </div>
                    ) : null}
                  </div>

                  {/* RIGHT: message column */}
                  <div className="flex-1 min-w-0">
                    {it.message ? (
                      <div
                        className={`relative inline-block align-top rounded-xl border shadow-[inset_0_-3px_0_rgba(0,0,0,0.15)] ${bubble}`}
                        style={{
                          maxWidth: "var(--bubbleMax)",  // cap width so text wraps
                        }}
                      >
                        <div
                          className="
                            px-6 py-4 text-lg font-semibold leading-snug
                            whitespace-pre-wrap break-words
                          "
                          style={{
                            overflowWrap: "anywhere", // handle ultra-long tokens/URLs
                            wordBreak: "break-word",
                          }}
                        >
                          {it.message}
                        </div>

                        {it.author ? (
                          <div className="absolute -bottom-6 right-1 text-sm text-[#6b6142] select-none">
                            {it.author}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="h-8" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* helpers (unchanged) */
export function mapConversationToTimelineItems(conversation = []) {
  return conversation.map((e, i) => ({
    id: e.id ?? i,
    laneLabel: e.actionLabel ?? "",
    laneVariant: e.variant ?? "donor",
    badge: e.badge ?? null,
    message: e.message ?? null,
    author: e.author ?? null,
    size: e.size ?? "md", // kept for backward compat (not used by bubble sizing now)
  }));
}

export function ConversationTimelineDemo() {
  return (
    <div className="w-full h-full p-2 bg-white shadow-[inset_0_6px_6px_rgba(0,0,0,0.8),inset_0_-6px_6px_rgba(0,0,0,0.3)] rounded-xl">
      <ConversationTimeline items={conversationSample} />
    </div>
  );
}
