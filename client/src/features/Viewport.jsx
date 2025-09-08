import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import StyledButton from "../components/buttons/StyledButton";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const POS_THRESHOLD_PX = 2;
const SCALE_THRESHOLD = 0.01;

const DRAG_THRESHOLD_MOUSE = 5; // px
const DRAG_THRESHOLD_TOUCH = 10; // px

// How fast wheel pans vertically (pixels per wheel delta pixel)
const WHEEL_PAN_SPEED_Y = 1;

// How fast zoom changes when ctrl+wheel (smaller = slower)
const WHEEL_ZOOM_SENSITIVITY = 0.0015;

// Built-in defaults (no CSS var yet)
const DEFAULT_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,
};

// ---- CSS var helpers ----
function getRootComputedStyle() {
  if (typeof window === "undefined") return null;
  return getComputedStyle(document.documentElement);
}
function parseCssSizeToPx(val, basePx = 16) {
  if (val == null) return NaN;
  if (typeof val === "number") return val;
  const s = String(val).trim();
  if (!s) return NaN;
  if (s.endsWith("px")) return parseFloat(s);
  if (s.endsWith("rem")) return parseFloat(s) * (getRootFontSizePx() || basePx);
  if (s.endsWith("em")) return parseFloat(s) * (getBodyFontSizePx() || basePx);
  // bare number string
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}
function getRootFontSizePx() {
  const cs = getRootComputedStyle();
  if (!cs) return 16;
  const fs = cs.fontSize || "16px";
  return parseCssSizeToPx(fs, 16);
}
function getBodyFontSizePx() {
  if (typeof window === "undefined") return 16;
  const cs = getComputedStyle(document.body || document.documentElement);
  const fs = cs.fontSize || "16px";
  return parseCssSizeToPx(fs, 16);
}
function readCssVarPx(varName) {
  const cs = getRootComputedStyle();
  if (!cs) return NaN;
  const raw = cs.getPropertyValue(varName);
  return parseCssSizeToPx(raw);
}

export default function ViewPort({
  children,
  title = "",
  width = 600,
  height = 400,

  /** Responsive sizes per breakpoint. Example:
   * sizes={{
   *   base:{width:320,height:240}, sm:{width:480,height:320}, md:{width:640,height:400},
   *   lg:{width:800,height:500}, xl:{width:1000,height:600}, "2xl":{width:1200,height:700},
   *   "3xl":{width:1400,height:800}
   * }}
   */
  sizes, // optional

  /** Where to measure width from: "window" (default) or "container" */
  bpSource = "window",

  /** Optional manual override for breakpoints (wins over CSS var) */
  breakpoints,

  containerClassName = "",
  containerStyle = {},
  topPadding = 20,
}) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);

  // Merge breakpoints: defaults -> CSS var for 3xl -> prop override
  const effectiveBreakpoints = useMemo(() => {
    const base = { ...DEFAULT_BREAKPOINTS };
    // If prop already defines 3xl, don't touch it; else try CSS var
    if (!breakpoints || breakpoints["3xl"] == null) {
      const css3xl = readCssVarPx("--breakpoint-3xl");
      if (Number.isFinite(css3xl) && css3xl > 0) {
        base["3xl"] = css3xl;
      }
    }
    // finally, overlay any user overrides
    return { ...base, ...(breakpoints || {}) };
  }, [breakpoints]);

  // Build a stable, sorted breakpoint order from effectiveBreakpoints
  const bpOrder = useMemo(() => {
    const entries = Object.entries(effectiveBreakpoints)
      .filter(([k]) => k !== "base")
      .map(([k, v]) => [k, Number(v)])
      .filter(([, v]) => Number.isFinite(v))
      .sort((a, b) => a[1] - b[1])
      .map(([k]) => k);
    return ["base", ...entries];
  }, [effectiveBreakpoints]);

  const computeBpForWidth = useCallback(
    (w) => {
      let current = "base";
      for (const key of bpOrder) {
        if (key === "base") continue;
        const min = Number(effectiveBreakpoints[key]);
        if (Number.isFinite(min) && w >= min) current = key;
      }
      return current;
    },
    [bpOrder, effectiveBreakpoints]
  );

  // Track active breakpoint
  const [bp, setBp] = useState("base");

  // Detect breakpoint from window or container
  useEffect(() => {
    let ro;
    let raf = 0;

    const applyFromWindow = () =>
      setBp(computeBpForWidth(window.innerWidth || 0));
    const applyFromContainer = () => {
      const el = containerRef.current;
      if (!el) return;
      setBp(computeBpForWidth(el.clientWidth || 0));
    };

    const schedule = (fn) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fn);
    };

    if (bpSource === "container" && typeof ResizeObserver !== "undefined") {
      applyFromContainer();
      ro = new ResizeObserver(() => schedule(applyFromContainer));
      if (containerRef.current) ro.observe(containerRef.current);
      const onOrient = () => schedule(applyFromContainer);
      window.addEventListener("orientationchange", onOrient);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("orientationchange", onOrient);
        ro && ro.disconnect();
      };
    } else {
      applyFromWindow();
      const onResize = () => schedule(applyFromWindow);
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
      };
    }
  }, [bpSource, computeBpForWidth]);

  // Compute active size (inherit from closest defined <= current bp)
  const activeSize = useMemo(() => {
    if (!sizes) return { width, height };
    const idx = bpOrder.indexOf(bp);
    for (let i = idx; i >= 0; i--) {
      const k = bpOrder[i];
      if (sizes[k])
        return {
          width: sizes[k].width ?? width,
          height: sizes[k].height ?? height,
        };
    }
    return { width, height };
  }, [sizes, bp, bpOrder, width, height]);

  const toCssSize = (v) => (typeof v === "number" ? `${v}px` : v);
  const pxWidth = useMemo(
    () => toCssSize(activeSize.width),
    [activeSize.width]
  );
  const pxHeight = useMemo(
    () => toCssSize(activeSize.height),
    [activeSize.height]
  );

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

  const hasSignificantDeviation = useCallback((pos, sc) => {
    const dx = Math.abs(pos.x - initialPosition.current.x);
    const dy = Math.abs(pos.y - initialPosition.current.y);
    const ds = Math.abs(sc - initialScale.current);
    return (
      dx > POS_THRESHOLD_PX || dy > POS_THRESHOLD_PX || ds > SCALE_THRESHOLD
    );
  }, []);

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
        const newPos = clampPosition(
          position.x - dx,
          position.y - dy,
          newScale
        );

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
  const onPointerDown = useCallback(
    (e) => {
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
      pressOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position.x, position.y]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (activePointerId.current !== e.pointerId) return;

      const threshold =
        lastPointerType.current === "touch"
          ? DRAG_THRESHOLD_TOUCH
          : DRAG_THRESHOLD_MOUSE;

      if (dragState === "press") {
        // decide if we should transition to drag
        const d = pointerDistance(
          pressClient.current.x,
          pressClient.current.y,
          e.clientX,
          e.clientY
        );
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
    },
    [dragState, clampPosition, scale]
  );

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
    <div
      title="hold ctrl + mousewheel drag for zoom"
      className="flex w-fit h-fit flex-col items-center rounded-md shadow-md shadow-gray-600 relative"
    >
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
          className={`rounded-md relative overflow-hidden ${containerClassName} shadow-[inset_0_8px_12px_rgba(0,0,0,0.25),inset_0_-8px_12px_rgba(0,0,0,0.50)] ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            touchAction: "none",
            width: pxWidth,
            height: pxHeight,
            ...containerStyle,
          }}
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
