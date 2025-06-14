import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import axiosClient from "../lib/axiosClient";
import SocketClient from "../lib/socketClient";

const RouterFlagContext = createContext();

export const RouterFlagProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);

  // Ref to debounce updates from socket
  const debounceTimerRef = useRef(null);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/auth/router-flags");
      const flagMap = {};
      res.data.forEach((flag) => {
        flagMap[flag.route_key] = flag.is_enabled;
      });
      setFlags(flagMap);
          

    } catch (error) {
      console.error("Failed to fetch router flags", error);
      const flagMap = { down: true };
      setFlags(flagMap);

    }
    finally{
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlags();

    const socketClient = new SocketClient(import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:3000");

    // Handle socket events with debounce to avoid rapid UI flicker
    socketClient.onDbChange("RouterFlag", "*", (action, data) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        // Update only the changed flag instead of full refetch
        setFlags((prevFlags) => ({
          ...prevFlags,
          [data.route_key]: data.is_enabled,
        }));

        debounceTimerRef.current = null;
      }, 200); // 200ms debounce, adjust as needed
    });

    return () => {
      socketClient.disconnect();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <RouterFlagContext.Provider value={{ flags, loading, fetchFlags }}>
      {children}
    </RouterFlagContext.Provider>
  );
};

export const useRouterFlags = () => useContext(RouterFlagContext);
