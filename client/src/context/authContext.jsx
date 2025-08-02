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

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/login", credentials);
      await fetchCurrentUser();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setUser(null);
      localStorage.setItem("logout-event", Date.now());
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    }
  };

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

  useEffect(() => {
    if (!user) return;

    if (!socketRef.current) {
      const socketClient = new SocketClient(import.meta.env.VITE_SOCKET_URL);
      socketRef.current = socketClient;

      socketClient.onReady(() => {
        setSocketReady(true);
      });

      socketClient.onMessage((data) => {
        if (data.type === "forceLogout") {
          console.warn("[Socket] Forced logout received:", data);
          setForcedLogoutReason(data.reason || "You have been logged out.");
          logout();
        }
      });
    }

    socketRef.current.registerUser(user.id);
  }, [user]);

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
