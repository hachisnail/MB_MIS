// /src/components/AdminSocketsPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSocketClient, useAuth } from "../context/authContext";

export default function AdminSocketsPanel() {
  const socketClient = useSocketClient();
  const { user } = useAuth();

  const [stats, setStats] = useState([]);
  const [query, setQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // NEW: presence state
  const [presenceCounts, setPresenceCounts] = useState({ at: 0, rows: [] });
  const [presenceSnapshot, setPresenceSnapshot] = useState({ at: 0, rows: [] });
  const [presenceQuery, setPresenceQuery] = useState("");

  const refreshTimerRef = useRef(null);

  // ask the server for the latest admin-only stats
  const requestStats = () => {
    socketClient?.emit?.("requestSocketStats");
    socketClient?.socket?.emit?.("requestSocketStats");
  };
  const requestPresenceSnapshot = () => {
    socketClient?.emit?.("requestPresenceSnapshot");
    socketClient?.socket?.emit?.("requestPresenceSnapshot");
  };

  useEffect(() => {
    if (!socketClient) return;

    // receive live admin stats pushes
    const onStats = (payload) => {
      setStats(Array.isArray(payload) ? payload : []);
    };

    // presence live stream
    const onPresenceCounts = (payload) => {
      if (payload && typeof payload === "object") setPresenceCounts(payload);
    };
    const onPresenceSnapshot = (payload) => {
      if (payload && typeof payload === "object") setPresenceSnapshot(payload);
    };

    // pull immediately on leader/real socket connect
    const onConnect = () => {
      requestStats();
      requestPresenceSnapshot();
    };

    // initial pulls
    requestStats();
    requestPresenceSnapshot();

    socketClient.on?.("socketStats", onStats);
    socketClient.on?.("presenceCounts", onPresenceCounts);
    socketClient.on?.("presenceSnapshot", onPresenceSnapshot);
    socketClient.on?.("connect", onConnect);

    const onFocus = () => {
      requestStats();
      requestPresenceSnapshot();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        requestStats();
        requestPresenceSnapshot();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // slow background pull
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        requestStats();
        requestPresenceSnapshot();
      }, 15000);
    }

    return () => {
      socketClient.off?.("socketStats", onStats);
      socketClient.off?.("presenceCounts", onPresenceCounts);
      socketClient.off?.("presenceSnapshot", onPresenceSnapshot);
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

  const presenceFiltered = useMemo(() => {
    const q = presenceQuery.trim().toLowerCase();
    const liveRows = presenceCounts?.rows || [];
    // if we have a snapshot for identities, merge by page
    const snapshotMap = new Map(
      (presenceSnapshot?.rows || []).map((r) => [r.page, r])
    );
    const rows = liveRows.map((r) => ({
      ...r,
      viewers: snapshotMap.get(r.page)?.viewers || [],
    }));
    if (!q) return rows;
    return rows.filter((r) =>
      r.page.toLowerCase().includes(q) ||
      (Array.isArray(r.titles) ? r.titles.join(",").toLowerCase().includes(q) : false) ||
      (Array.isArray(r.viewers) ? r.viewers.some(v =>
        String(v.userId ?? "guest").toLowerCase().includes(q) ||
        String(v.browserId ?? "").toLowerCase().includes(q) ||
        String(v.tabId ?? "").toLowerCase().includes(q)
      ) : false)
    );
  }, [presenceCounts, presenceSnapshot, presenceQuery]);

  if (!user?.roleId || user.roleId !== 1) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
        Unauthorized
      </div>
    );
  }

  return (
    <div className="p-4 h-full space-y-6">
      {/* ===== Presence panel ===== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Presence (Live)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={requestPresenceSnapshot}
              type="button"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Snapshot
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            placeholder="Filter by page / title / user / tab / browser…"
            value={presenceQuery}
            onChange={(e) => setPresenceQuery(e.target.value)}
            className="w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Presence table */}
        <div className="overflow-hidden rounded-lg border border-gray-400">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <Th>Page (URL)</Th>
                <Th>Viewers</Th>
                <Th>Sample Titles</Th>
                <Th>Viewer Identities</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {presenceFiltered.map((row) => {
                const viewers = Array.isArray(row.viewers) ? row.viewers : [];
                const maxShow = 10;
                const shown = viewers.slice(0, maxShow);
                const more = Math.max(0, viewers.length - shown.length);

                return (
                  <tr key={row.page} className="hover:bg-slate-50">
                    <TdWrap>{row.page}</TdWrap>
                    <Td>{row.count}</Td>
                    <TdWrap>{Array.isArray(row.titles) ? row.titles.join(" • ") : ""}</TdWrap>
                    <TdWrap>
                      {shown.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {shown.map((v, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-800"
                              title={`browser:${v.browserId ?? "—"} tab:${v.tabId ?? "—"} at:${new Date(v.at).toLocaleString()}`}
                            >
                              {(v.userId ?? "guest")} | {v.tabId ?? "—"}
                            </span>
                          ))}
                          {more > 0 && (
                            <span className="text-xs text-slate-500">+{more} more…</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TdWrap>
                  </tr>
                );
              })}
              {presenceFiltered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    No active presence rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-600">
          Updated: {presenceCounts?.at ? new Date(presenceCounts.at).toLocaleString() : "—"}
          {presenceSnapshot?.at ? ` • Snapshot: ${new Date(presenceSnapshot.at).toLocaleString()}` : ""}
        </div>
      </section>

      {/* ===== Connected clients (existing) ===== */}
      <section className="space-y-3">
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
                    refreshTimerRef.current = setInterval(() => {
                      requestStats();
                      requestPresenceSnapshot();
                    }, 15000);
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
      </section>
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
  return <td title={children} className="px-3 py-2 align-top text-[13px] text-gray-800 truncate">{children}</td>;
}
function TdMono({ children }) {
  return (
    <td title={children} className="px-3 py-2 align-top text-[12px] text-gray-800 font-mono break-all truncate">
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
