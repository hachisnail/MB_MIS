// ImageCropModal.jsx
import React, { useRef } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";

const ImageCropModal = ({ open, src, onClose, onApply }) => {
  const cropperRef = useRef(null);
  if (!open) return null;

  const apply = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ imageSmoothingQuality: "high" });
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92); // or 'image/png'
    onApply(dataUrl);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ background: "#fff", padding: 12, borderRadius: 8, width: "80vw", height: "80vh" }}>
        <div style={{ height: "calc(100% - 48px)" }}>
          <Cropper
            src={src}
            style={{ height: "100%", width: "100%" }}
            initialAspectRatio={NaN} // free crop
            guides={true}
            movable={true}
            zoomable={true}
            rotatable={true}
            viewMode={1}
            background={false}
            ref={cropperRef}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={apply} style={{ background: "#2563eb", color: "#fff", padding: "6px 10px", borderRadius: 6 }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
