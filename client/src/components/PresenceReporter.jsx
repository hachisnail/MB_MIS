// /src/components/PresenceReporter.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSocketClient } from "@/context/authContext";

export default function PresenceReporter() {
  const socketClient = useSocketClient();
  const location = useLocation();

  const sendPresence = () => {
    socketClient?.updatePresence?.({
      page: window.location.pathname + window.location.search,
      title: document?.title || null,
      meta: {
        hash: window.location.hash || null,
      },
    });
  };

  // 1) On socket connect (including reconnects), send current page once
  useEffect(() => {
    if (!socketClient) return;
    const onConnect = () => sendPresence();
    socketClient.on?.("connect", onConnect);
    if (socketClient.socket?.connected) sendPresence();
    return () => socketClient.off?.("connect", onConnect);
  }, [socketClient]);

  // 2) On route change, send once
  useEffect(() => {
    if (!socketClient) return;
    sendPresence();
  }, [socketClient, location.pathname, location.search, location.hash]);

  // 3) When tab becomes hidden/visible
  useEffect(() => {
    if (!socketClient) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        socketClient.clearPresence?.({ silent: false });
      } else {
        sendPresence();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [socketClient]);

  // 4) On unload (tab close / hard refresh), send presence:leave
  useEffect(() => {
    const onBeforeUnload = () => {
      try {
        socketClient?.clearPresence?.({ silent: false });
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [socketClient]);

  return null;
}
