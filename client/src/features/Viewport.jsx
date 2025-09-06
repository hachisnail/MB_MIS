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

  const clampPosition = (x, y, s = scale) => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return { x, y };

    const halfWidth = (inner.offsetWidth * s) / 2;
    const halfHeight = (inner.offsetHeight * s) / 2;

    const maxX = container.offsetWidth - halfWidth;
    const minX = -halfWidth;
    const maxY = container.offsetHeight - halfHeight;
    const minY = -halfHeight;

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
  }, [topPadding]);

  useEffect(() => resetPosition(), [resetPosition]);

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

      setScale(newScale);
      setPosition(clampPosition(position.x - dx, position.y - dy, newScale));
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
    setPosition(clampPosition(e.clientX - startPos.x, e.clientY - startPos.y));
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

      <div className="px-6 pb-6 pt-5 relative">
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

          <StyledButton
            onClick={resetPosition}
            className="absolute bottom-4 right-4 z-10"
          >
            Reset
          </StyledButton>
        </div>
      </div>
    </div>
  );
}
