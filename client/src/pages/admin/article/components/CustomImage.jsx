// src/components/tiptap/CustomImage.jsx
import React, { useRef, useState } from "react";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";

const HANDLE = { size: 12, inset: 2 }; // tweak if you want a bigger handle

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const { src, widthPct, alt = "" } = node.attrs;

  const wrapperRef = useRef(null);
  const boxRef = useRef(null);  // <-- new: we size this during drag
  const imgRef = useRef(null);
  const lastPctRef = useRef(null);
  const lastCommitTsRef = useRef(0);

  const [isResizing, setIsResizing] = useState(false);

  // Throttle attribute commits so preview updates live without spamming transactions
  const commitThrottled = (pct) => {
    const now = performance.now();
    if (now - lastCommitTsRef.current > 80) { // ~12 commits/sec
      lastCommitTsRef.current = now;
      updateAttributes({ widthPct: pct });
    }
  };

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);

    const isTouch = e.type === "touchstart";
    const moveEvt = isTouch ? "touchmove" : "mousemove";
    const endEvt = isTouch ? "touchend" : "mouseup";
    const getClientX = (ev) =>
      isTouch ? ev.touches?.[0]?.clientX ?? 0 : ev.clientX;

    // set initial live styles so the handle tracks the image corner immediately
    if (boxRef.current && Number.isFinite(+widthPct)) {
      boxRef.current.style.width = `${widthPct}%`;
    }
    if (imgRef.current && Number.isFinite(+widthPct)) {
      imgRef.current.style.width = "100%";
    }

    const onMove = (ev) => {
      const wrapper = wrapperRef.current;
      const box = boxRef.current;
      if (!wrapper || !box) return;

      const container = wrapper.parentElement || wrapper;
      const containerRect = container.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const clientX = getClientX(ev);

      const containerWidth = Math.max(1, containerRect.width);
      const dx = clientX - boxRect.left; // how far from the left edge of the box
      let pct = (dx / containerWidth) * 100;

      // clamp 5–100 and round to 2 decimals for stability
      pct = Math.min(100, Math.max(5, pct));
      pct = Math.round(pct * 100) / 100;
      lastPctRef.current = pct;

      // Live DOM sizing (smooth, no flicker)
      box.style.width = `${pct}%`;
      if (imgRef.current) imgRef.current.style.width = "100%";

      // Throttled attribute update → TipTap onUpdate fires → your preview updates live
      commitThrottled(pct);
    };

    const onEnd = () => {
      // Final commit (ensures the very last value is saved even if throttle skipped it)
      const finalPct = lastPctRef.current ?? (Number.isFinite(+widthPct) ? +widthPct : 100);
      updateAttributes({ widthPct: finalPct });

      // Cleanup temporary styles
      if (boxRef.current) boxRef.current.style.width = "";
      if (imgRef.current) imgRef.current.style.width = "";

      lastPctRef.current = null;
      setIsResizing(false);

      document.removeEventListener(moveEvt, onMove);
      document.removeEventListener(endEvt, onEnd);
    };

    document.addEventListener(moveEvt, onMove);
    document.addEventListener(endEvt, onEnd);
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
      {/* Box we size live; handle is positioned inside this box */}
      <div
        ref={boxRef}
        style={{
          display: "inline-block",
          position: "relative",
          lineHeight: 0,
          maxWidth: "100%",
          width: Number.isFinite(+widthPct) ? `${+widthPct}%` : undefined, // initial width (so handle is correct before drag)
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{
            width: Number.isFinite(+widthPct) ? "100%" : "auto", // fill the box if widthPct set
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
              // no transform here — we keep it INSIDE the image
            }}
            title="Drag to resize"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

const CustomImage = Image.extend({
  inline() {
    return true;
  },
  group() {
    return "inline";
  },
  draggable: true,

  addAttributes() {
    return {
      // keep base attrs (includes `src`)
      ...this.parent?.(),
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
          const safe = Number.isFinite(n)
            ? Math.min(100, Math.max(5, n))
            : null;
          if (safe == null) return {};
          return {
            style: `width:${safe}%; height:auto; max-width:100%;`,
            "data-width-pct": String(safe),
            "data-inline": "true",
          };
        },
      },
      alt: { default: "" },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default CustomImage;
