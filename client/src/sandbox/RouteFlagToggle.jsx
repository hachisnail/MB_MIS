import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../lib/axiosClient";
import SocketClient from "../lib/socketClient";

const socketUrl = import.meta.env.VITE_SOCKET_URL;

function RouteFlagToggle() {
  const [availableFlags, setAvailableFlags] = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState("");
  const [updatingFlag, setUpdatingFlag] = useState(null);
  const [message, setMessage] = useState("");

  const socketRef = useRef(null);
  const skipNextSocketRefreshRef = useRef(false); // Prevent flicker from self-triggered socket event

  const fetchFlags = async () => {
    try {
      const { data } = await axiosClient.get("/auth/router-flags");
      setAvailableFlags(data || []);
    } catch (err) {
      setFlagsError("Failed to load flags");
    } finally {
      setFlagsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();

    const socket = new SocketClient(socketUrl);
    socketRef.current = socket;

    socket.onDbChange("RouterFlag", "*", (action, data) => {
      if (skipNextSocketRefreshRef.current) {
        skipNextSocketRefreshRef.current = false;
        return;
      }
      console.log(`Silent refresh triggered from socket: ${action}`, data);
      fetchFlags();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleToggle = async (route_key, currentValue) => {
    setUpdatingFlag(route_key);
    setMessage("");
    skipNextSocketRefreshRef.current = true; // prevent socket refresh flicker

    try {
      const { data } = await axiosClient.post("/auth/router-flags", {
        route_key,
        is_enabled: !currentValue,
      });

      setAvailableFlags((prevFlags) =>
        prevFlags.map((flag) =>
          flag.route_key === route_key ? data.flag : flag
        )
      );

      setMessage(
        `Flag for '${route_key}' updated to ${!currentValue ? "enabled" : "disabled"}`
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to update flag";
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setUpdatingFlag(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 p-6 bg-gray-50 rounded-lg shadow-md min-h-[40rem]">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">
        Toggle Route Flags
      </h2>

      {flagsLoading ? (
        <p className="text-gray-600">Loading flags...</p>
      ) : flagsError ? (
        <p className="text-red-600">{flagsError}</p>
      ) : availableFlags.length === 0 ? (
        <p className="text-gray-600">No flags available.</p>
      ) : (
        <>
          {message && (
            <p
              className={`mb-6 h-10 text-lg font-medium ${
                message.startsWith("Error")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}

          {/* Flex container for cards */}
          <div className="flex flex-wrap gap-6">
            {availableFlags.map(({ route_key, is_enabled }) => (
              <div
                key={route_key}
                className="flex-shrink-0 w-full sm:w-[48%] md:w-[31%] lg:w-[23%] bg-white p-5 rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {route_key}
                  </p>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      is_enabled ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {is_enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(route_key, is_enabled)}
                  disabled={updatingFlag === route_key}
                  className={`mt-6 py-2 rounded-md font-semibold text-white cursor-pointer ${
                    is_enabled
                      ? "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
                      : "bg-green-600 hover:bg-green-700 disabled:bg-green-300"
                  } transition disabled:cursor-not-allowed`}
                >
                  {updatingFlag === route_key
                    ? "Updating..."
                    : is_enabled
                    ? "Disable"
                    : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RouteFlagToggle;
