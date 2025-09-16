import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";

export default function AdminScan() {
  const [searchParams] = useSearchParams();
  const encoded = searchParams.get("data");
  const [status, setStatus] = useState("Checking...");

  // Decoded values
  let sessionId = null;
  let contributionId = null;

  if (encoded) {
    try {
      const decoded = JSON.parse(atob(encoded));
      sessionId = decoded.sessionId;
      contributionId = decoded.contributionId;
    } catch (err) {
      console.error("QR decode failed:", err);
    }
  }

  useEffect(() => {
    const runCheck = async () => {
      try {
        // ✅ Verify admin
        const me = await axiosClient.get("/auth/me");
        const user = me.data.user; // <--- unwrap user object
        if (!user || user.roleId !== 1) {
          setStatus("Admin login required");
          return;
        }

        // ✅ Call backend
        const res = await axiosClient.post(
          `/auth/contributions/${contributionId}/complete-session`,
          { sessionId }
        );

        setStatus("Ok" + res.data.message);
      } catch (err) {
        console.error(err);
        setStatus(
          "Failed: " + (err.response?.data?.message || "Unknown error")
        );
      }
    };

    if (sessionId && contributionId) {
      runCheck();
    } else {
      setStatus("Invalid QR code (missing data)");
    }
  }, [sessionId, contributionId]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">
        Contribution Completion Accessibility
      </h1>
      <p>{status}</p>
    </div>
  );
}
