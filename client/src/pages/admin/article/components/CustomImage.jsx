// src/components/tiptap/CustomImage.jsx
import React, { useEffect, useRef, useState } from "react";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";

const HANDLE = { size: 12, inset: 2 };

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const { src, widthPct, alt = "" } = node.attrs;

  const wrapperRef = useRef(null);
  const boxRef = useRef(null);
  const imgRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthPxRef = useRef(0);
  const containerWidthPxRef = useRef(1);
  const isDraggingRef = useRef(false);

  const [isResizing, setIsResizing] = useState(false);

  // Keep DOM width in sync with current attr
  useEffect(() => {
    const box = boxRef.current;
    const img = imgRef.current;
    if (!box || !img) return;

    if (Number.isFinite(+widthPct)) {
      box.style.width = `${+widthPct}%`;
      img.style.width = "100%";
    } else {
      box.style.width = "";
      img.style.width = "auto";
    }
  }, [widthPct]);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isTouch = e.type === "touchstart";
    const point = isTouch ? e.touches?.[0] : e;
    if (!point) return;

    const wrapper = wrapperRef.current;
    const box = boxRef.current;
    const img = imgRef.current;
    if (!wrapper || !box || !img) return;

    const container = wrapper.parentElement || wrapper;
    const crect = container.getBoundingClientRect();

    containerWidthPxRef.current = Math.max(1, crect.width);
    startWidthPxRef.current = box.getBoundingClientRect().width;
    startXRef.current = point.clientX;
    isDraggingRef.current = true;
    setIsResizing(true);

    img.style.width = "100%";

    const onMove = (ev) => {
      if (!isDraggingRef.current) return;
      const p = isTouch ? ev.touches?.[0] : ev;
      if (!p) return;

      const dx = p.clientX - startXRef.current;
      const nextPx = Math.max(1, startWidthPxRef.current + dx);
      let pct = (nextPx / containerWidthPxRef.current) * 100;
      pct = Math.max(5, Math.min(100, pct)); // clamp 5–100

      // Pure DOM update during drag: no transactions → no flicker
      box.style.width = `${pct}%`;
    };

    const onEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      // Commit exactly once
      const box = boxRef.current;
      if (box) {
        const rect = box.getBoundingClientRect();
        const pct = Math.max(
          5,
          Math.min(100, (rect.width / containerWidthPxRef.current) * 100)
        );
        updateAttributes({ widthPct: Math.round(pct * 100) / 100 });
      }

      setIsResizing(false);
      window.removeEventListener(isTouch ? "touchmove" : "mousemove", onMove);
      window.removeEventListener(isTouch ? "touchend" : "mouseup", onEnd);
    };

    window.addEventListener(isTouch ? "touchmove" : "mousemove", onMove, { passive: false });
    window.addEventListener(isTouch ? "touchend" : "mouseup", onEnd, { passive: true });
  };

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="resizable-image"
      style={{
        display: "inline-block",
        position: "relative",
        verticalAlign: "middle",
        lineHeight: 0,
      }}
      data-drag-handle
    >
      <div
        ref={boxRef}
        style={{
          display: "inline-block",
          position: "relative",
          lineHeight: 0,
          maxWidth: "100%",
          minWidth: 1,
          // width managed via useEffect / drag
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{
            width: Number.isFinite(+widthPct) ? "100%" : "auto",
            height: "auto",
            maxWidth: "100%",
            display: "block",
            userSelect: "none",
          }}
          data-inline="true"
          data-resizable="true"
          draggable={false}
        />

        {(selected || isResizing) && (
          <div
            contentEditable={false}
            onMouseDown={startResize}
            onTouchStart={startResize}
            style={{
              position: "absolute",
              right: HANDLE.inset,
              bottom: HANDLE.inset,
              width: HANDLE.size,
              height: HANDLE.size,
              background: "blue",
              borderRadius: 2,
              cursor: "se-resize",
              boxShadow: "0 0 0 1px #fff",
              touchAction: "none",
            }}
            title="Drag to resize"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

const CustomImage = Image.extend({
  inline() { return true; },
  group() { return "inline"; },
  draggable: true,
  priority: 1000, // prefer our nodeview if others exist

  // Minimal + reliable attrs (explicit src is the key)
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => el.getAttribute("src") || null,
        renderHTML: (attrs) => ({ src: attrs.src }),
      },
      alt: {
        default: "",
        parseHTML: (el) => el.getAttribute("alt") || "",
        renderHTML: (attrs) => (attrs.alt ? { alt: attrs.alt } : {}),
      },
      title: {
        default: null,
        parseHTML: (el) => el.getAttribute("title") || null,
        renderHTML: (attrs) => (attrs.title ? { title: attrs.title } : {}),
      },
      widthPct: {
        default: null,
        parseHTML: (element) => {
          const styleW = element.style?.width || "";
          const dataPct = element.getAttribute("data-width-pct") || "";
          const raw = styleW.trim().endsWith("%")
            ? styleW.trim().slice(0, -1)
            : dataPct;
          const n = parseFloat(raw);
          return Number.isFinite(n) ? n : null;
        },
        renderHTML: (attrs) => {
          if (!attrs.widthPct) return {};
          const n = parseFloat(attrs.widthPct);
          const safe = Number.isFinite(n) ? Math.max(5, Math.min(100, n)) : null;
          if (safe == null) return {};
          return {
            style: `width:${safe}%; height:auto; max-width:100%;`,
            "data-width-pct": String(safe),
            "data-inline": "true",
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default CustomImage;
