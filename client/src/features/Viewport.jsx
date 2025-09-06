import { useState, useRef, useEffect, useCallback } from "react";
import StyledButton from "../components/buttons/StyledButton";

export default function ViewPort({
  children,
  title = "",
  width = 600,
  height = 400,
  containerClassName = "",
  containerStyle = {},
  topPadding = 20,
}) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showReset, setShowReset] = useState(false);

  // Store the initial state to compare deviations
  const initialPosition = useRef({ x: 0, y: 0 });
  const initialScale = useRef(1);

const clampPosition = (x, y, s = scale) => {
  const container = containerRef.current;
  const inner = innerRef.current;
  if (!container || !inner) return { x, y };

  const innerWidth = inner.offsetWidth * s;
  const innerHeight = inner.offsetHeight * s;

  // Allow most of the document to overflow: only 1/8 visible
  const visibleFraction = 1 / 8;

  const maxX = container.offsetWidth - innerWidth * visibleFraction;
  const minX = -(innerWidth - innerWidth * visibleFraction);
  const maxY = container.offsetHeight - innerHeight * visibleFraction;
  const minY = -(innerHeight - innerHeight * visibleFraction);

  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
};


  const resetPosition = useCallback(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const centerX = (container.offsetWidth - inner.offsetWidth) / 2;
    const topY = topPadding;

    setPosition({ x: centerX, y: topY });
    setScale(1);
    setShowReset(false);

    // Update initial values
    initialPosition.current = { x: centerX, y: topY };
    initialScale.current = 1;
  }, [topPadding]);

  useEffect(() => resetPosition(), [resetPosition]);

  // Helper to check if deviation is significant
  const hasSignificantDeviation = (pos, sc) => {
    const thresholdPos = 2; // pixels
    const thresholdScale = 0.01; // scale
    const dx = Math.abs(pos.x - initialPosition.current.x);
    const dy = Math.abs(pos.y - initialPosition.current.y);
    const ds = Math.abs(sc - initialScale.current);
    return dx > thresholdPos || dy > thresholdPos || ds > thresholdScale;
  };

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const container = containerRef.current;
      const inner = innerRef.current;
      if (!container || !inner) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldScale = scale;
      const newScale = Math.min(Math.max(scale - e.deltaY * 0.0015, 0.5), 3);

      const dx = (mouseX - position.x) * (newScale / oldScale - 1);
      const dy = (mouseY - position.y) * (newScale / oldScale - 1);

      const newPos = clampPosition(position.x - dx, position.y - dy, newScale);

      setScale(newScale);
      setPosition(newPos);

      if (hasSignificantDeviation(newPos, newScale)) {
        setShowReset(true);
      }
    },
    [scale, position]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    const newPos = clampPosition(e.clientX - startPos.x, e.clientY - startPos.y);
    setPosition(newPos);

    if (hasSignificantDeviation(newPos, scale)) {
      setShowReset(true);
    }
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div className="flex w-fit h-fit flex-col items-center rounded-md shadow-md shadow-gray-600 relative">
      {title && (
        <div className="w-full h-20 bg-black flex flex-col rounded-t-md">
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{title}</span>
          </div>
          <div className="rounded-t-md w-full min-h-1 bg-white"></div>
        </div>
      )}

      <div className={` px-6 pb-6 ${title ? "pt-5": "pt-6"}  relative`}>
        <div
          ref={containerRef}
          className={`rounded-md relative overflow-hidden ${containerClassName} shadow-[inset_0_8px_12px_rgba(0,0,0,0.25),inset_0_-8px_12px_rgba(0,0,0,0.50)]`}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            ...containerStyle,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={innerRef}
            onMouseDown={handleMouseDown}
            className={`absolute cursor-${dragging ? "grabbing" : "grab"}`}
            style={{
              top: position.y,
              left: position.x,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
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
