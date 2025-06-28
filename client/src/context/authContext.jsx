// context/authContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import axiosClient from "../lib/axiosClient";
import SocketClient from "../lib/socketClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const login = async (credentials) => {
    try {
      const res = await axiosClient.post("/auth/login", credentials);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      return { success: false, message };
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
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const syncLogout = (event) => {
      if (event.key === "logout-event") {
        setUser(null);
      }
    };
    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, []);

  useEffect(() => {
    if (user) {
      if (!socketRef.current) {
        socketRef.current = new SocketClient(import.meta.env.VITE_SOCKET_URL);

        socketRef.current.socket.on("forceLogout", (data) => {
          console.warn("Force logout received:", data?.reason);
          logout();
          window.location.reload();
        });
      }

      socketRef.current.registerUser(user.id);
    } else if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        socketClient: socketRef.current,
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
