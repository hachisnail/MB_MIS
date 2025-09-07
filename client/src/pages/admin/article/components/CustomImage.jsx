// CustomImage.jsx (percent width version)
import React, { useRef } from "react";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";

/** Inline, resizable image node-view that stores width as % of container */
const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const { src, widthPct } = node.attrs;
  const wrapperRef = useRef(null);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isTouch = e.type === "touchstart";
    const moveEvt = isTouch ? "touchmove" : "mousemove";
    const endEvt = isTouch ? "touchend" : "mouseup";
    const getClientX = (ev) => (isTouch ? ev.touches?.[0]?.clientX ?? 0 : ev.clientX);

    const onMove = (ev) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      // container is the inline-block wrapper's offsetParent width
      const container = wrapper.parentElement || wrapper;
      const containerRect = container.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const clientX = getClientX(ev);

      const newPx = Math.max(50, Math.round(clientX - wrapperRect.left));
      const containerWidth = Math.max(1, containerRect.width);
      const pct = Math.min(100, Math.max(5, (newPx / containerWidth) * 100)); // clamp 5%..100%
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
      <img
        src={src}
        alt=""
        style={{
          width: widthPct ? `${widthPct}%` : "auto",
          height: "auto",
          maxWidth: "100%",
          display: "inline-block",
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
          }}
        />
      )}
    </NodeViewWrapper>
  );
};

const CustomImage = Image.extend({
  // inline so images don't occupy the whole row
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

      // store width as container-relative percent
      widthPct: {
        default: null,
        parseHTML: (element) => {
          // read style="width: NN%" or data-width-pct="NN"
          const styleW = element.style?.width || "";
          const dataPct = element.getAttribute("data-width-pct") || "";
          const raw =
            styleW.trim().endsWith("%")
              ? styleW.trim().slice(0, -1)
              : dataPct;
          const n = parseFloat(raw);
          return Number.isFinite(n) ? n : null;
        },
        renderHTML: (attrs) => {
          if (!attrs.widthPct) return {};
          const n = parseFloat(attrs.widthPct);
          const safe = Number.isFinite(n) ? Math.min(100, Math.max(5, n)) : null;
          if (safe == null) return {};
          return {
            style: `width: ${safe}%; height: auto;`,
            "data-width-pct": String(safe),
            "data-inline": "true",
          };
        },
      },

      // keep height auto to preserve aspect ratio
      height: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default CustomImage;
