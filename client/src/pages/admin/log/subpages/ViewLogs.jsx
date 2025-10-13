import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { useSocketClient } from "@/context/authContext";

/** ---------- Diff Utilities (no deps) ---------- */
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

const isEqual = (a, b) => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!isEqual(a[i], b[i])) return false;
    return true;
  }

  if (isObject(a) && isObject(b)) {
    const ak = Object.keys(a).sort();
    const bk = Object.keys(b).sort();
    if (ak.length !== bk.length) return false;
    for (let i = 0; i < ak.length; i++) {
      if (ak[i] !== bk[i]) return false;
      if (!isEqual(a[ak[i]], b[ak[i]])) return false;
    }
    return true;
  }

  return false;
};

const diffObjects = (before, after, key = "root") => {
  if (isEqual(before, after)) {
    return { kind: "unchanged", key, before, after };
  }

  const beforeIsObj = isObject(before) || Array.isArray(before);
  const afterIsObj = isObject(after) || Array.isArray(after);

  if (!beforeIsObj && afterIsObj) return { kind: "changed", key, before, after };
  if (beforeIsObj && !afterIsObj) return { kind: "changed", key, before, after };

  // Arrays
  if (Array.isArray(before) || Array.isArray(after)) {
    const maxLen = Math.max((before?.length ?? 0), (after?.length ?? 0));
    const children = [];
    for (let i = 0; i < maxLen; i++) {
      const b = before?.[i];
      const a = after?.[i];
      if (i >= (before?.length ?? 0)) {
        children.push({ kind: "added", key: `[${i}]`, after: a });
      } else if (i >= (after?.length ?? 0)) {
        children.push({ kind: "removed", key: `[${i}]`, before: b });
      } else {
        const child = diffObjects(b, a, `[${i}]`);
        children.push(child);
      }
    }
    return { kind: "nested", key, children };
  }

  // Plain objects
  const beforeKeys = Object.keys(before ?? {});
  const afterKeys = Object.keys(after ?? {});
  const allKeys = Array.from(new Set([...beforeKeys, ...afterKeys])).sort();

  const children = [];
  for (const k of allKeys) {
    if (!(k in (before ?? {}))) {
      children.push({ kind: "added", key: k, after: after[k] });
      continue;
    }
    if (!(k in (after ?? {}))) {
      children.push({ kind: "removed", key: k, before: before[k] });
      continue;
    }

    const b = before[k];
    const a = after[k];

    if (isObject(b) || Array.isArray(b) || isObject(a) || Array.isArray(a)) {
      const child = diffObjects(b, a, k);
      if (child.kind === "unchanged") {
        children.push({ kind: "unchanged", key: k, before: b, after: a });
      } else {
        children.push({ kind: "nested", key: k, children: child.children ?? [child] });
      }
    } else if (isEqual(b, a)) {
      children.push({ kind: "unchanged", key: k, before: b, after: a });
    } else {
      children.push({ kind: "changed", key: k, before: b, after: a });
    }
  }

  return { kind: "nested", key, children };
};

const formatValue = (v) =>
  typeof v === "string" ? JSON.stringify(v) : v === undefined ? "undefined" : JSON.stringify(v, null, 2);

/** ---------- Diff Renderer ---------- */
const DiffLegend = () => (
  <div className="flex flex-wrap gap-3 text-xs">
    <span className="px-2 py-0.5 rounded bg-green-900/40 text-green-300 border border-green-700">Added</span>
    <span className="px-2 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700">Removed</span>
    <span className="px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 border border-yellow-700">Changed</span>
    <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">Unchanged</span>
  </div>
);

const NodeRow = ({ node, hideUnchanged, depth = 0 }) => {
  const pad = { paddingLeft: `${depth * 16}px` };

  if (node.kind === "nested") {
    const allChildrenUnchanged =
      node.children.length > 0 &&
      node.children.every(
        (c) =>
          c.kind === "unchanged" ||
          (c.kind === "nested" && c.children && c.children.every((cc) => cc.kind === "unchanged"))
      );

    if (hideUnchanged && allChildrenUnchanged) return null;

    return (
      <div style={pad}>
        <div className="font-semibold text-blue-300">{node.key}</div>
        <div className="mt-1 border-l border-gray-700 ml-2">
          {node.children.map((c, i) => (
            <NodeRow key={node.key + i} node={c} hideUnchanged={hideUnchanged} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  if (node.kind === "unchanged" && hideUnchanged) return null;

  const baseRow =
    node.kind === "added"
      ? "bg-green-900/30 text-green-200 border border-green-800"
      : node.kind === "removed"
      ? "bg-red-900/30 text-red-200 border border-red-800"
      : node.kind === "changed"
      ? "bg-yellow-900/30 text-yellow-200 border border-yellow-800"
      : "bg-neutral-800 text-gray-300 border border-gray-700";

  return (
    <div style={pad} className={`rounded p-2 my-1 ${baseRow}`}>
      <div className="text-sm">
        <span className="font-medium">{node.key}:</span>
        {node.kind === "changed" ? (
          <div className="mt-1 grid md:grid-cols-2 gap-2">
            <pre className="whitespace-pre-wrap text-xs md:text-sm">
              <span className="opacity-80">before:</span> {formatValue(node.before)}
            </pre>
            <pre className="whitespace-pre-wrap text-xs md:text-sm">
              <span className="opacity-80">after:</span> {formatValue(node.after)}
            </pre>
          </div>
        ) : node.kind === "added" ? (
          <pre className="whitespace-pre-wrap text-xs md:text-sm mt-1">{formatValue(node.after)}</pre>
        ) : node.kind === "removed" ? (
          <pre className="whitespace-pre-wrap text-xs md:text-sm mt-1">{formatValue(node.before)}</pre>
        ) : (
          <pre className="whitespace-pre-wrap text-xs md:text-sm mt-1">{formatValue(node.after)}</pre>
        )}
      </div>
    </div>
  );
};

const JsonDiffView = ({ before, after }) => {
  const [hideUnchanged, setHideUnchanged] = useState(true);
  const diffTree = useMemo(() => diffObjects(before, after), [before, after]);

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-neutral-800">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">Differences</h3>
        <div className="flex items-center gap-4">
          <DiffLegend />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              className="accent-blue-500"
              checked={hideUnchanged}
              onChange={(e) => setHideUnchanged(e.target.checked)}
            />
            Hide unchanged
          </label>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        <span className="mr-2">Before → After</span>
      </div>

      <div className="mt-3">
        {diffTree.kind === "nested"
          ? diffTree.children.map((c, i) => (
              <NodeRow key={`root-${i}`} node={c} hideUnchanged={hideUnchanged} depth={0} />
            ))
          : <NodeRow node={diffTree} hideUnchanged={hideUnchanged} depth={0} />}
      </div>
    </div>
  );
};

/** ---------- Main Component ---------- */
const ViewLogs = () => {
  const [log, setLog] = useState(null);
  const [logError, setLogError] = useState(null);

  const location = useLocation();
  const socket = useSocketClient();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const encodedId = decodeURIComponent(pathSegments[pathSegments.length - 1] || "");
  let logId = null;
  try {
    logId = parseInt(atob(encodedId));
  } catch {
    const maybe = Number(encodedId);
    if (!Number.isNaN(maybe)) logId = maybe;
  }

  const fetchLog = async () => {
    if (logId == null) {
      setLogError("Invalid log id");
      return;
    }
    try {
      setLogError(null);
      const response = await axiosClient.get(`/auth/logs/${logId}`);
      setLog(response.data);
    } catch (error) {
      setLogError("Error fetching logs");
    }
  };

  useEffect(() => {
    fetchLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleLogChange = () => {
      fetchLog();
    };

    socket.onDbChange("Log", "*", handleLogChange);

    return () => {
      socket.offDbChange("Log", "*", handleLogChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  if (logError) {
    return <div className="text-red-500">{logError}</div>;
  }

  if (!log) {
    return <div className="text-gray-400">Loading log...</div>;
  }

  // Parse before/after state safely
  let beforeState = {};
  let afterState = {};
  try {
    beforeState = JSON.parse(log.beforeState || "{}");
  } catch {
    beforeState = log.beforeState ?? {};
  }
  try {
    afterState = JSON.parse(log.afterState || "{}");
  } catch {
    afterState = log.afterState ?? {};
  }

  return (
    <div className="w-full min-w-fit h-full pt-5 space-y-6 overflow-y-scroll border-t border-gray-400 px-4">
      {/* Top Section: Action + Description */}
      <div className="border border-gray-700 rounded-lg p-5 bg-neutral-900 text-white">
        <h2 className="text-2xl font-bold capitalize">{log.action}</h2>
        <p className="mt-2 text-lg">{log.description}</p>
        <p className="mt-1 text-sm text-gray-400">{log.details}</p>
        <p className="mt-1 text-sm text-gray-400">
          Performed by:{" "}
          <span className="font-medium">
            {log.user?.fname} {log.user?.lname} ({log.user?.username})
          </span>
        </p>
        <p className="mt-1 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
      </div>

      {/* Bottom Section: Before / After + Diff */}
      <div className="flex flex-col gap-6">
        <JsonDiffView before={beforeState} after={afterState} />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="border border-gray-700 rounded-lg p-4 bg-neutral-800">
            <h3 className="text-xl font-semibold text-red-400">Before</h3>
            <pre className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
              {typeof beforeState === "string" ? beforeState : JSON.stringify(beforeState, null, 2)}
            </pre>
          </div>

          {/* After */}
          <div className="border border-gray-700 rounded-lg p-4 bg-neutral-800">
            <h3 className="text-xl font-semibold text-green-400">After</h3>
            <pre className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
              {typeof afterState === "string" ? afterState : JSON.stringify(afterState, null, 2)}
            </pre>
          </div>
        </div>

        {/* Diff */}
      </div>
    </div>
  );
};

export default ViewLogs;
