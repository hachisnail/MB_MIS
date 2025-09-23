import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { useSocketClient } from "@/context/authContext";

const ViewLogs = () => {
  const [log, setLog] = useState(null);
  const [logError, setLogError] = useState(null);

  const location = useLocation();
  const socket = useSocketClient();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const encodedId = decodeURIComponent(pathSegments[pathSegments.length - 1]);
  const logId = parseInt(atob(encodedId));

  const fetchLog = async () => {
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
  } catch {}
  try {
    afterState = JSON.parse(log.afterState || "{}");
  } catch {}

  return (
    <div className="w-full min-w-fit h-full pt-5 space-y-6">
      {/* Top Section: Action + Description */}
      <div className="border border-gray-700 rounded-lg p-5 bg-neutral-900 text-white">
        <h2 className="text-2xl font-bold capitalize">{log.action}</h2>
        <p className="mt-2 text-lg">{log.description}</p>
        <p className="mt-1 text-sm text-gray-400">
          {log.details}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Performed by: <span className="font-medium">{log.user?.fname} {log.user?.lname} ({log.user?.username})</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {new Date(log.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Bottom Section: Before / After States */}
      <div className="flex gap-6">
        {/* Before */}
        <div className="flex-1 border border-gray-700 rounded-lg p-4 bg-neutral-800">
          <h3 className="text-xl font-semibold text-red-400">Before</h3>
          <pre className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(beforeState, null, 2)}
          </pre>
        </div>

        {/* After */}
        <div className="flex-1 border border-gray-700 rounded-lg p-4 bg-neutral-800">
          <h3 className="text-xl font-semibold text-green-400">After</h3>
          <pre className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(afterState, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ViewLogs;
