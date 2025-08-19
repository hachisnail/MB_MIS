import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";
import React, { useState } from "react";

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const { src, width, height } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);

  const handleResize = (event) => {
    const newWidth = Math.max(50, event.clientX - event.target.getBoundingClientRect().left);
    updateAttributes({ width: newWidth });
  };

 return (
    <NodeViewWrapper
      className="resizable-image"
      style={{ display: "inline-block", position: "relative" }}
      data-drag-handle // This is an important attribute for Tiptap to know what part of the node to grab for dragging
    >
      <img
        src={src}
        style={{
          width: width || "auto",
          height: height || "auto",
          maxWidth: "100%",
          display: "block",
          userSelect: "none",
        }}
        // The image is now draggable, but the resize handle is not
      />
      {selected && (
        <div
          contentEditable={false}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "12px",
            height: "12px",
            background: "blue",
            cursor: "se-resize",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation(); // 👈 prevent the drag event from starting
            setIsResizing(true);
            const moveHandler = (ev) => handleResize(ev);
            const upHandler = () => {
              setIsResizing(false);
              document.removeEventListener("mousemove", moveHandler);
              document.removeEventListener("mouseup", upHandler);
            };
            document.addEventListener("mousemove", moveHandler);
            document.addEventListener("mouseup", upHandler);
          }}
        />
      )}
    </NodeViewWrapper>
  );
};

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default CustomImage;
