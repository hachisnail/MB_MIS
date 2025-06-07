import { useEffect } from "react";

const WebSocketListener = ({ onRefresh }) => {
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_SERVER_URL;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "REFRESH_DATA") {
          console.log("REFRESH_DATA received");
          if (onRefresh) onRefresh();
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [onRefresh]);

  return null;
};

export default WebSocketListener;
