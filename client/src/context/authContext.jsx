import { createContext, useContext, useState, useEffect, useRef } from "react";
import axiosClient from "@/lib/axiosClient";
import SocketClient from "@/lib/socketClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); 
  const [forcedLogoutReason, setForcedLogoutReason] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef(null);

  const fetchCurrentUser = async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  };

const initializeSocket = (userId = null) => {
  const socketClient = new SocketClient(import.meta.env.VITE_SERVER_URL);
  socketRef.current = socketClient;

  socketClient.onReady(() => {
    socketClient.registerUser(userId); // null means guest
    setSocketReady(true);
  });

  socketClient.onForceLogout(async (data) => {
    console.warn("[Socket] Forced logout received:", data);
    setForcedLogoutReason(data.reason || "You have been logged out.");

    // Disconnect and destroy current socket
    if (socketRef.current) {
      socketRef.current.leaveAllRooms?.();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocketReady(false);
    setUser(null);
    localStorage.setItem("logout-event", Date.now());

    // Reinitialize as guest
    const guestSocket = new SocketClient(import.meta.env.VITE_SERVER_URL);
    socketRef.current = guestSocket;

    guestSocket.onReady(() => {
      guestSocket.registerUser(null); // guest mode
      setSocketReady(true);
    });
  });
};


  useEffect(() => {
    initializeSocket();

    const init = async () => {
      await fetchCurrentUser();
      if (user?.id) {
        socketRef.current?.registerUser(user.id);
      }
    };
    init();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/login", credentials);
      await fetchCurrentUser();
      socketRef.current?.registerUser(res.data.user?.id);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (skipServer = false) => {
    try {
      if (!skipServer) {
        await axiosClient.post("/auth/logout");
      }
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setUser(null);
      localStorage.setItem("logout-event", Date.now());

      if (socketRef.current) {
        socketRef.current.leaveAllRooms?.();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setSocketReady(false);

      // Initialize guest socket after logout
      if (skipServer) {
        initializeSocket(null); // guest mode
      }
    }
  };

  // Cross-tab logout sync
  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "logout-event") {
        setUser(null);
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketReady(false);
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        forcedLogoutReason,
        socketClient: socketRef.current,
        socketReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useSocketClient() {
  const { socketClient } = useContext(AuthContext);
  return socketClient;
}
