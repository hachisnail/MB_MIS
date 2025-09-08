import { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from "react";
import StyledButton from "../components/buttons/StyledButton";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const POS_THRESHOLD_PX = 2;
const SCALE_THRESHOLD = 0.01;

const DRAG_THRESHOLD_MOUSE = 5;   // px
const DRAG_THRESHOLD_TOUCH = 10;  // px

// How fast wheel pans vertically (pixels per wheel delta pixel)
const WHEEL_PAN_SPEED_Y = 1;

// How fast zoom changes when ctrl+wheel (smaller = slower)
const WHEEL_ZOOM_SENSITIVITY = 0.0015;

// Tailwind-like defaults (in px)
const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 };

export default function ViewPort({
  children,
  title = "",
  width = 600,
  height = 400,
  /** NEW: responsive sizes per breakpoint. Example:
   *  sizes={{ base:{width:320,height:240}, sm:{width:480,height:320}, md:{width:640,height:400} }}
   */
  sizes, // optional
  containerClassName = "",
  containerStyle = {},
  topPadding = 20,
}) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);

  // Track active breakpoint
  const [bp, setBp] = useState("base");

  // compute active size from sizes or fallback to width/height
  const activeSize = useMemo(() => {
    if (!sizes) return { width, height };
    // determine the best match from current bp
    const order = ["base", "sm", "md", "lg", "xl", "2xl"];
    const bpIndex = order.indexOf(bp);
    // inherit from the closest defined breakpoint <= current
    for (let i = bpIndex; i >= 0; i--) {
      const k = order[i];
      if (sizes[k]) return { width: sizes[k].width ?? width, height: sizes[k].height ?? height };
    }
    // fallback to base props
    return { width, height };
  }, [sizes, bp, width, height]);

  const toCssSize = (v) => (typeof v === "number" ? `${v}px` : v);

  const pxWidth = useMemo(() => toCssSize(activeSize.width), [activeSize.width]);
  const pxHeight = useMemo(() => toCssSize(activeSize.height), [activeSize.height]);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // drag state: "idle" | "press" | "drag"
  const [dragState, setDragState] = useState("idle");

  // baseline for reset/deviation
  const initialPosition = useRef({ x: 0, y: 0 });
  const initialScale = useRef(1);

  // pointer bookkeeping
  const activePointerId = useRef(null);
  const pressClient = useRef({ x: 0, y: 0 });
  const pressOffset = useRef({ x: 0, y: 0 });
  const isCaptured = useRef(false);
  const lastPointerType = useRef("mouse"); // "mouse" | "pen" | "touch"

  // ----- Breakpoint detection -----
  useEffect(() => {
    const computeBp = () => {
      const w = window.innerWidth || 0;
      if (w >= BREAKPOINTS["3xl"]) return "3xl";
      if (w >= BREAKPOINTS["2xl"]) return "2xl";
      if (w >= BREAKPOINTS.xl) return "xl";
      if (w >= BREAKPOINTS.lg) return "lg";
      if (w >= BREAKPOINTS.md) return "md";
      if (w >= BREAKPOINTS.sm) return "sm";
      return "base";
    };
    const apply = () => setBp(computeBp());
    apply();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  /** ---------------- Helpers ---------------- */
  const clampPosition = useCallback((x, y, s) => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return { x, y };

    const innerWidth = inner.offsetWidth * s;
    const innerHeight = inner.offsetHeight * s;

    // keep at least 1/8 of content visible
    const visibleFraction = 1 / 8;

    const maxX = container.offsetWidth - innerWidth * visibleFraction;
    const minX = -(innerWidth - innerWidth * visibleFraction);
    const maxY = container.offsetHeight - innerHeight * visibleFraction;
    const minY = -(innerHeight - innerHeight * visibleFraction);

    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  }, []);

  const hasSignificantDeviation = useCallback(
    (pos, sc) => {
      const dx = Math.abs(pos.x - initialPosition.current.x);
      const dy = Math.abs(pos.y - initialPosition.current.y);
      const ds = Math.abs(sc - initialScale.current);
      return dx > POS_THRESHOLD_PX || dy > POS_THRESHOLD_PX || ds > SCALE_THRESHOLD;
    },
    []
  );

  const showReset = hasSignificantDeviation(position, scale);

  const resetPosition = useCallback(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const centerX = (container.offsetWidth - inner.offsetWidth) / 2;
    const topY = topPadding;

    const nextPos = { x: centerX, y: topY };
    setPosition(nextPos);
    setScale(1);

    initialPosition.current = nextPos;
    initialScale.current = 1;
  }, [topPadding]);

  // Initialize / re-center when size inputs change (includes breakpoint swap)
  useLayoutEffect(() => {
    resetPosition();
  }, [resetPosition, pxWidth, pxHeight]);

  /** ---------------- Wheel: Ctrl+wheel = zoom; wheel = vertical pan ---------------- */
  const handleWheel = useCallback(
    (e) => {
      // Always prevent page scrolling while over the viewport
      e.preventDefault();

      const container = containerRef.current;
      const inner = container && innerRef.current;
      if (!container || !inner) return;

      // Zoom ONLY when Ctrl is held (also true for pinch-zoom on many browsers)
      if (e.ctrlKey) {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const oldScale = scale;
        const desired = scale - e.deltaY * WHEEL_ZOOM_SENSITIVITY;
        const newScale = Math.min(Math.max(desired, MIN_SCALE), MAX_SCALE);

        // keep the point under cursor stable
        const dx = (mouseX - position.x) * (newScale / oldScale - 1);
        const dy = (mouseY - position.y) * (newScale / oldScale - 1);
        const newPos = clampPosition(position.x - dx, position.y - dy, newScale);

        setScale(newScale);
        setPosition(newPos);
        return;
      }

      // Otherwise: vertical pan only (ignore deltaX on purpose)
      const newY = position.y - e.deltaY * WHEEL_PAN_SPEED_Y;
      const newPos = clampPosition(position.x, newY, scale);
      setPosition(newPos);
    },
    [scale, position, clampPosition]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  /** ---------------- Utilities ---------------- */
  const isInteractiveTarget = (el) => {
    if (!el) return false;
    const interactiveSelector =
      'button, a, input, textarea, select, [contenteditable="true"], [role="button"]';
    return !!el.closest(interactiveSelector);
  };

  const pointerDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  /** ---------------- Pan (pointer) on container ---------------- */
  const onPointerDown = useCallback((e) => {
    // only one active pointer for pan
    if (activePointerId.current !== null) return;

    lastPointerType.current = e.pointerType || "mouse";

    // Ignore right/middle click for mouse; allow touch/pen
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // If pressing on interactive child, don't start press for pan
    if (isInteractiveTarget(e.target)) return;

    const container = containerRef.current;
    if (!container) return;

    activePointerId.current = e.pointerId;
    setDragState("press");

    pressClient.current = { x: e.clientX, y: e.clientY };
    pressOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position.x, position.y]);

  const onPointerMove = useCallback((e) => {
    if (activePointerId.current !== e.pointerId) return;

    const threshold =
      (lastPointerType.current === "touch") ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;

    if (dragState === "press") {
      // decide if we should transition to drag
      const d = pointerDistance(pressClient.current.x, pressClient.current.y, e.clientX, e.clientY);
      if (d >= threshold) {
        setDragState("drag");
        // Once we start dragging, capture future events
        containerRef.current?.setPointerCapture?.(e.pointerId);
        isCaptured.current = true;
      } else {
        return; // still click candidate
      }
    }

    if (dragState === "drag") {
      const nextPos = clampPosition(
        e.clientX - pressOffset.current.x,
        e.clientY - pressOffset.current.y,
        scale
      );
      setPosition(nextPos);
      // Prevent page scroll on touch while dragging
      if (e.pointerType === "touch") e.preventDefault?.();
    }
  }, [dragState, clampPosition, scale]);

  const endPointer = useCallback((e) => {
    if (activePointerId.current !== e.pointerId) return;

    if (isCaptured.current) {
      containerRef.current?.releasePointerCapture?.(e.pointerId);
      isCaptured.current = false;
    }
    activePointerId.current = null;
    setDragState("idle");
  }, []);

  /** ---------------- Render ---------------- */
  const dragging = dragState === "drag";

  return (
    <div title="hold ctrl + mousewheel drag for zoom" className="flex w-fit h-fit flex-col items-center rounded-md shadow-md shadow-gray-600 relative">
      {title && (
        <div className="w-full h-20 bg-black flex flex-col rounded-t-md">
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{title}</span>
          </div>
          <div className="rounded-t-md w-full min-h-1 bg-white" />
        </div>
      )}

      <div className={`px-6 pb-6 ${title ? "pt-5" : "pt-6"} relative`}>
        <div
          ref={containerRef}
          className={`rounded-md relative overflow-hidden ${containerClassName} shadow-[inset_0_8px_12px_rgba(0,0,0,0.25),inset_0_-8px_12px_rgba(0,0,0,0.50)] ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ touchAction: "none", width: pxWidth, height: pxHeight, ...containerStyle }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          <div
            ref={innerRef}
            className="absolute"
            style={{
              top: position.y,
              left: position.x,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              userSelect: "none",
            }}
          >
            {children}
          </div>

          <div
            className={`absolute bottom-4 right-4 z-10 transition-opacity duration-300 ${
              showReset ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <StyledButton onClick={resetPosition}>Reset</StyledButton>
          </div>
        </div>
      </div>
    </div>
  );
}
