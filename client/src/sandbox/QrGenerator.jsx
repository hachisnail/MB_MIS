// QrGenerator.jsx
import React, { useState } from "react";
import QRCode from "react-qr-code";

export default function QrGenerator() {
  const [text, setText] = useState("https://example.com");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem" }}>
      <h2>QR Code Generator</h2>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text or URL"
        style={{ padding: "0.5rem", width: "300px" }}
      />
      <div style={{ background: "white", padding: "1rem" }}>
        <QRCode value={text} size={256} />
      </div>
    </div>
  );
}
