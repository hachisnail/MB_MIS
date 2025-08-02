import React, { createContext, useState, useEffect, useContext } from "react";
import axiosClient from "../lib/axiosClient";
import { useSocketClient } from "./authContext";

const RouterFlagContext = createContext();

export const RouterFlagProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const socket = useSocketClient();
  const POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes


function xorDecode(encoded, key) {
  const buffer = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const decoded = buffer.map((b, i) => b ^ key.charCodeAt(i % key.length));
  return JSON.parse(new TextDecoder().decode(decoded));
}

const fetchFlags = async () => {
  try {
    const res = await axiosClient.get("/auth/router-flags");

    const rawFlags = xorDecode(res.data.encoded, "museo");
    const rawKeyMap = xorDecode(res.data.keys, "museo");

    // Reverse the key map
    const reverseMap = Object.entries(rawKeyMap).reduce((acc, [original, alias]) => {
      acc[alias] = original;
      return acc;
    }, {});

    const flagMap = {};
    for (const alias in rawFlags) {
      const realKey = reverseMap[alias];
      flagMap[realKey] = rawFlags[alias];
    }

    setFlags(flagMap);
  } catch (error) {
    console.error("Failed to fetch router flags", error);
    setFlags({ down: true });
  } finally {
    setLoading(false);
  }
};




  useEffect(() => {
    fetchFlags();
  }, []);

  useEffect(() => {
    let pollInterval;

    if (socket) {
      // console.debug("[RouterFlagProvider] WebSocket available. Using real-time updates.");
      const handleRouterFlagChange = () => fetchFlags();
      socket.onDbChange("RouterFlag", "*", handleRouterFlagChange);

      return () => {
        socket.offDbChange("RouterFlag", "*", handleRouterFlagChange);
      };
    } else {
      // console.debug("[RouterFlagProvider] WebSocket NOT available. Using polling fallback.");
      pollInterval = setInterval(() => {
        fetchFlags();
      }, POLLING_INTERVAL);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [socket]);

  return (
    <RouterFlagContext.Provider value={{ flags, loading, fetchFlags }}>
      {children}
    </RouterFlagContext.Provider>
  );
};

export const useRouterFlags = () => useContext(RouterFlagContext);
