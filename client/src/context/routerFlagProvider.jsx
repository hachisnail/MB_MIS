import React, { createContext, useState, useEffect, useContext } from "react";
import axiosClient from "../lib/axiosClient";
import { useSocketClient } from "./authContext";

const RouterFlagContext = createContext();

export const RouterFlagProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const socket = useSocketClient();
  const POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes


  const fetchFlags = async () => {
    try {
      const res = await axiosClient.get("/auth/router-flags");
      const flagMap = {};
      res.data.forEach((flag) => {
        flagMap[flag.route_key] = flag.is_enabled;
      });
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
