// src/components/tiptap/EditorCropBridge.jsx
import React, { useEffect, useState } from "react";
import ImageCropModal from "../modals/ImageCropModal";

/**
 * Wrap your editor with this component so the CustomImage node-view
 * can trigger the global crop modal via `window.dispatchEvent(...)`.
 *
 * Usage:
 * <EditorCropBridge>
 *   <RichTextEditor ... />
 * </EditorCropBridge>
 */
const EditorCropBridge = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [applyCallback, setApplyCallback] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const { src, update } = e.detail || {};
      setCropSrc(src);
      setApplyCallback(() => update);
      setOpen(true);
    };
    window.addEventListener("tiptap-image-crop", handler);
    return () => window.removeEventListener("tiptap-image-crop", handler);
  }, []);

  return (
    <>
      {children}
      <ImageCropModal
        open={open}
        src={cropSrc}
        onClose={() => setOpen(false)}
        onApply={(dataUrl) => {
          applyCallback?.(dataUrl);
          setOpen(false);
        }}
      />
    </>
  );
};

export default EditorCropBridge;
