// =============================================
// components/ConversationTimeline.jsx (v2.6)
// - Center line never touches dots (hard gap)
// - Uses real dot centers for math (not row height)
// - Scrollable + responsive + robust reflow handling
// =============================================
import React, { useRef, useLayoutEffect, useEffect } from "react";

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

  const laneKey = (v) => (v === "admin" ? "admin" : "donor");

  // refs
  const scrollRef = useRef(null);
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const dotRefs = useRef([]);
  dotRefs.current = [];

  // helper: parse CSS custom property to px
  const toPx = (raw) => {
    if (!raw) return 0;
    const v = String(raw).trim();
    if (v.endsWith("px")) return parseFloat(v);
    if (v.endsWith("rem")) {
      const base = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return parseFloat(v) * base;
    }
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  // auto-scroll to bottom on new items
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items.length]);

  // position/size the track so it STOPS before dots (with a gap)
  const layoutTrack = () => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    const dotCols = dotRefs.current.filter(Boolean);

    if (!wrap || !track || dotCols.length === 0) {
      if (track) track.style.display = "none";
      return;
    }

    const wrapRect = wrap.getBoundingClientRect();

    // locate the actual DOT span inside the column
    const getDotRect = (col) => {
      const dotEl = col.querySelector('[data-role="dot"]');
      return (dotEl || col).getBoundingClientRect();
    };

    const firstRect = getDotRect(dotCols[0]);
    const lastRect = getDotRect(dotCols[dotCols.length - 1]);

    // centers relative to wrapper
    const firstCenterY = firstRect.top - wrapRect.top + firstRect.height / 2;
    const lastCenterY = lastRect.top - wrapRect.top + lastRect.height / 2;

    // how far the line should stay away from the dot edge
    const gapVar = getComputedStyle(scrollRef.current).getPropertyValue("--gapFromDot");
    const GAP = toPx(gapVar) || 8; // px fallback if var missing

    // Start *below* the bottom edge of the first dot, end *above* the top edge of the last dot
    const top = firstCenterY + firstRect.height / 2 + GAP;
    const bottom = lastCenterY - lastRect.height / 2 - GAP;
    const height = Math.max(0, bottom - top);

    if (height <= 0) {
      track.style.display = "none";
      return;
    }

    track.style.display = "block";
    track.style.top = `${top}px`;
    track.style.height = `${height}px`;
  };

  useLayoutEffect(() => {
    layoutTrack();
  }, [items]);

  // Recompute on resize and any content reflow
  useEffect(() => {
    const onResize = () => layoutTrack();
    window.addEventListener("resize", onResize);

    // observe size changes of the scroll area & wrapper
    const ro = new ResizeObserver(() => layoutTrack());
    if (scrollRef.current) ro.observe(scrollRef.current);
    if (wrapRef.current) ro.observe(wrapRef.current);

    // microtask after layout
    const id = setTimeout(layoutTrack, 0);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      clearTimeout(id);
    };
  }, []);

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <div
        ref={scrollRef}
        className="
          absolute inset-0 overflow-y-auto overflow-x-hidden px-6 py-6
          [--label:11rem] [--dotCol:3rem] [--gapX:1.5rem]
          [--trackW:0.4rem] [--cutout:0.75rem] [--gapFromDot:0.5rem]
          [--bubbleMax:40rem]
          sm:[--label:9rem]  sm:[--dotCol:3rem]  sm:[--gapX:1.25rem] sm:[--bubbleMax:34rem]
          md:[--label:10rem] md:[--dotCol:3rem]  md:[--gapX:1.5rem]  md:[--bubbleMax:38rem]
          3xl:[--label:13rem] 3xl:[--dotCol:3.5rem] 3xl:[--gapX:1.75rem] 3xl:[--bubbleMax:52rem]
        "
      >
        <div ref={wrapRef} className="relative flex flex-col gap-8">
          {/* Center track (height set in JS to stop before dots) */}
          <div
            ref={trackRef}
            className="pointer-events-none absolute rounded-full bg-[#1D1911]/80"
            style={{
              width: "var(--trackW)",
              left: `calc(var(--label) + var(--gapX) + (var(--dotCol) / 2))`,
              transform: "translateX(-50%)",
              zIndex: 0,
              top: 0,
              height: 0,
              display: "none",
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
                  <div
                    ref={(el) => (dotRefs.current[idx] = el)}
                    className="w-[var(--dotCol)] flex justify-center relative shrink-0"
                    style={{ height: "3rem" }} // ensure stable row height ~= dot size
                  >
                    {/* HALO (cuts the line behind the dot edge) */}
                    <span
                      className="absolute z-[5] rounded-full bg-white"
                      style={{
                        width: "calc(var(--dotCol) + var(--cutout))",
                        height: "calc(var(--dotCol) + var(--cutout))",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                      aria-hidden
                    />
                    {/* Dot (mark with data-role for precise rect) */}
                    <span
                      data-role="dot"
                      className={`relative z-10 rounded-full bg-white border-4 ${ringStyles[k]}`}
                      style={{
                        width: "3rem",
                        height: "3rem",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                      aria-hidden
                    />
                    {/* Badge (optional) */}
                    {it.badge ? (
                      <div
                        className={`absolute whitespace-nowrap px-4 py-2 text-base font-semibold rounded-lg shadow-sm ${bubble}`}
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

                  {/* RIGHT: message bubble */}
                  <div className="flex-1 min-w-0">
                    {it.message ? (
                      <div
                        className={`relative inline-block align-top rounded-xl border shadow-[inset_0_-3px_0_rgba(0,0,0,0.15)] ${bubble}`}
                        style={{ maxWidth: "var(--bubbleMax)" }}
                      >
                        <div
                          className="px-6 py-4 text-lg font-semibold leading-snug whitespace-pre-wrap break-words"
                          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
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

// helpers
export function mapConversationToTimelineItems(conversation = []) {
  return conversation.map((e, i) => ({
    id: e.id ?? i,
    laneLabel: e.actionLabel ?? "",
    laneVariant: e.variant ?? "donor",
    badge: e.badge ?? null,
    message: e.message ?? null,
    author: e.author ?? null,
    size: e.size ?? "md",
  }));
}
