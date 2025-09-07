// /src/components/LiveSocketBadge.jsx
import { useEffect, useState } from "react";
import { useSocketClient } from "../context/authContext";

export default function LiveSocketBadge() {
  const socketClient = useSocketClient();
  const [counts, setCounts] = useState({
    total: 0,
    users: 0,
    guests: 0,
    browsers: 0,
  });

  useEffect(() => {
    if (!socketClient) return;

    const handler = (payload) => {
      if (!payload || typeof payload !== "object") return;
      const next = {
        total: Number(payload.total) || 0,
        users: Number(payload.users) || 0,
        guests: Number(payload.guests) || 0,
        browsers: Number(payload.browsers) || 0,
      };
      setCounts((prev) =>
        prev.total === next.total &&
        prev.users === next.users &&
        prev.guests === next.guests &&
        prev.browsers === next.browsers
          ? prev
          : next
      );
    };

    socketClient.on("socketCounts", handler);

    // request initial counts
    socketClient.emit?.("requestSocketCounts");

    // request again on reconnect
    const onConnect = () => socketClient.emit?.("requestSocketCounts");
    socketClient.on?.("connect", onConnect);

    return () => {
      socketClient.off("socketCounts", handler);
      socketClient.off?.("connect", onConnect);
    };
  }, [socketClient]);

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-lg font-semibold whitespace-nowrap"
      title={`browsers: ${counts.browsers}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span>{counts.users} user(s)</span>
      </span>
      <span className="opacity-60">-</span>
      <span className="inline-flex items-center gap-1.5">
        <span>{counts.guests} guest(s)</span>
      </span>
      <span className="opacity-60">-</span>
      <span>{counts.total} online</span>
    </span>
  );
}
