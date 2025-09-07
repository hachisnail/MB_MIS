// src/components/tiptap/CustomImage.jsx
import React, { useRef } from "react";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const { src, widthPct, alt = "" } = node.attrs;
  const wrapperRef = useRef(null);
  const imgRef = useRef(null);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isTouch = e.type === "touchstart";
    const moveEvt = isTouch ? "touchmove" : "mousemove";
    const endEvt = isTouch ? "touchend" : "mouseup";
    const getClientX = (ev) =>
      isTouch ? ev.touches?.[0]?.clientX ?? 0 : ev.clientX;

    const onMove = (ev) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const container = wrapper.parentElement || wrapper;
      const containerRect = container.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const clientX = getClientX(ev);

      const newPx = Math.max(50, Math.round(clientX - wrapperRect.left));
      const containerWidth = Math.max(1, containerRect.width);
      const pct = Math.min(
        100,
        Math.max(5, (newPx / containerWidth) * 100)
      );
      updateAttributes({ widthPct: Math.round(pct * 100) / 100 });
    };

    const onEnd = () => {
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
      <div style={{ display: "inline-block", position: "relative" }}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{
            width: widthPct ? `${widthPct}%` : "auto",
            height: "auto",
            maxWidth: "100%",
            display: "block",
            userSelect: "none",
          }}
          data-inline="true"
          data-resizable="true"
          draggable={false}
        />

        {selected && (
          <div
            contentEditable={false}
            onMouseDown={startResize}
            onTouchStart={startResize}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 12,
              height: 12,
              background: "blue",
              borderRadius: 2,
              cursor: "se-resize",
              transform: "translate(50%, 50%)", // <-- exactly on image’s bottom-right
              boxShadow: "0 0 0 1px #fff",
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
            style: `width: ${safe}%; height: auto;`,
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
