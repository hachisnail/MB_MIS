import QRCode from "react-qr-code";

const QRHandler = ({ sessionId, contributionId, triggerGenerate = false }) => {
  if (!triggerGenerate || !sessionId || !contributionId) {
    return null;
  }

  // Build payload object
  const payload = { sessionId, contributionId };

  // Encode as base64 JSON
  const encoded = btoa(JSON.stringify(payload));

  // URL now carries only one encoded param
  const frontendUrl = `${window.location.origin}/admin/scan?data=${encoded}`;

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow">
      <h2 className="text-lg font-semibold">Scan this QR Code</h2>
      <QRCode value={frontendUrl} size={180} />
      <p className="text-sm text-gray-600 text-center">
        Encoded QR links to:
        <br />
        <code className="text-xs break-all">{frontendUrl}</code>
      </p>
    </div>
  );
};

export default QRHandler;