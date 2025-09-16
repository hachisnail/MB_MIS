// QrScanner.jsx
import React, { useState } from "react";
import BarcodeScanner from "react-qr-barcode-scanner";

export default function QrScannerComponent() {
  const [result, setResult] = useState("No result yet");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem" }}>
      <h2>QR / Barcode Scanner</h2>
      <div style={{ width: "300px", height: "300px" }}>
        <BarcodeScanner
          width={300}
          height={300}
          onUpdate={(err, res) => {
            if (res) {
              setResult(res.text);
            } else {
              // optionally handle errors or no result
            }
          }}
          // optionally you can pass props like `facingMode` etc if supported
        />
      </div>
      <p><strong>Scanned Result:</strong> {String(result)}</p>
    </div>
  );
}
