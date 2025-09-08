// /src/components/AdminSocketsPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSocketClient, useAuth } from "../context/authContext";

export default function AdminSocketsPanel() {
  const socketClient = useSocketClient();
  const { user } = useAuth();

  const [stats, setStats] = useState([]);
  const [query, setQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshTimerRef = useRef(null);

  // ask the server for the latest admin-only stats
  const requestStats = () => {
    socketClient?.emit?.("requestSocketStats");
    socketClient?.socket?.emit?.("requestSocketStats"); // in case a component calls underlying
  };

  useEffect(() => {
    if (!socketClient) return;

    // receive live admin stats pushes
    const onStats = (payload) => {
      setStats(Array.isArray(payload) ? payload : []);
    };

    // pull immediately on leader/real socket connect
    const onConnect = () => requestStats();

    // fast pulls: on mount, on connect, on focus/visibility
    requestStats();
    socketClient.on?.("socketStats", onStats);
    socketClient.on?.("connect", onConnect);

    const onFocus = () => requestStats();
    const onVisibility = () => {
      if (document.visibilityState === "visible") requestStats();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // slow background pull
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(requestStats, 15000);
    }

    return () => {
      socketClient.off?.("socketStats", onStats);
      socketClient.off?.("connect", onConnect);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [socketClient, autoRefresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stats;
    return stats.filter(({ socketId, userId, isGuest, rooms, browserId, tabId }) => {
      const roomsStr = Array.isArray(rooms) ? rooms.join(",") : "";
      return (
        String(socketId).toLowerCase().includes(q) ||
        String(userId ?? "").toLowerCase().includes(q) ||
        String(isGuest).toLowerCase().includes(q) ||
        String(browserId ?? "").toLowerCase().includes(q) ||
        String(tabId ?? "").toLowerCase().includes(q) ||
        roomsStr.toLowerCase().includes(q)
      );
    });
  }, [stats, query]);

  if (!user?.roleId || user.roleId !== 1) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
        Unauthorized
      </div>
    );
  }

  return (
    <div className="p-4 h-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Connected Clients</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={requestStats}
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={autoRefresh}
              onChange={(e) => {
                setAutoRefresh(e.target.checked);
                if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
                if (e.target.checked) {
                  refreshTimerRef.current = setInterval(requestStats, 15000);
                }
              }}
            />
            Auto-refresh
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          placeholder="Search socketId / userId / browserId / tabId / room"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="h-[calc(100%-10rem)] overflow-hidden rounded-lg border border-gray-400">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <Th>Socket ID</Th>
              <Th>User ID</Th>
              <Th>Guest?</Th>
              <Th>Browser ID</Th>
              <Th>Tab ID</Th>
              <Th>Rooms (count)</Th>
              <Th>Rooms (list)</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <tr key={row.socketId} className="hover:bg-slate-50">
                <TdMono>{row.socketId}</TdMono>
                <TdMono>{row.userId ?? "—"}</TdMono>
                <Td>{row.isGuest ? "Yes" : "No"}</Td>
                <TdMono>{row.browserId ?? "—"}</TdMono>
                <TdMono>{row.tabId ?? "—"}</TdMono>
                <Td>{row.rooms?.length ?? 0}</Td>
                <TdWrap>{Array.isArray(row.rooms) ? row.rooms.join(", ") : ""}</TdWrap>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No sockets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-600">
        Total: {stats.length} • Showing: {filtered.length}
      </div>
    </div>
  );
}

/* ---- tiny presentational helpers ---- */
function Th({ children }) {
  return (
    <th className="px-3 py-2 text-left text-[13px] font-semibold text-gray-700">
      {children}
    </th>
  );
}
function Td({ children }) {
  return <td title={children}  className="px-3 py-2 align-top text-[13px] text-gray-800 truncate">{children}</td>;
}
function TdMono({ children }) {
  return (
    <td title={children}  className="px-3 py-2 align-top text-[12px] text-gray-800 font-mono break-all truncate">
      {children}
    </td>
  );
}
function TdWrap({ children }) {
  return (
    <td title={children} className="px-3 py-2 align-top text-[13px] text-gray-800 break-words truncate">
      {children}
    </td>
  );
}
