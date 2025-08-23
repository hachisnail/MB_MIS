import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { getSocketClient } from "@/lib/socketSingleton";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forcedLogoutReason, setForcedLogoutReason] = useState(null);
  const [socketReady, setSocketReady] = useState(false);

  const socketRef = useRef(null);
  const userRef = useRef(null);
  const isMountedRef = useRef(true);

  const resetForcedLogoutReason = () => setForcedLogoutReason(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetUser = (newUser) => {
    userRef.current = newUser;
    if (isMountedRef.current) setUser(newUser);
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      safeSetUser(res.data.user);
      return res.data.user;
    } catch {
      safeSetUser(null);
      return null;
    }
  };

  const initializeSocket = (userId = null) => {
    const socketClient = getSocketClient();
    socketRef.current = socketClient;
    socketClient.registerUser(userId);
  };

  useEffect(() => {
    const socketClient = getSocketClient();
    socketRef.current = socketClient;

    const handleReady = () => {
      if (isMountedRef.current) setSocketReady(true);
    };

    const handleForceLogout = (data) => {
      setForcedLogoutReason(data.reason || "You have been logged out.");
      safeSetUser(null);
      setSocketReady(false);
      localStorage.setItem("logout-event", Date.now());
      console.log("[Socket] Forced logout. Switching to guest mode...");
      socketClient.registerUser(null);

      // Redirect on forced logout
      navigate("/", { replace: true });
    };

    socketClient.onReady(handleReady);
    socketClient.onForceLogout(handleForceLogout);

    return () => {
      socketClient.offReady(handleReady);
      socketClient.offForceLogout(handleForceLogout);
    };
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      const currentUser = await fetchCurrentUser();

      if (currentUser?.id) {
        console.log("[Init] Logged in user detected:", currentUser.id);
        initializeSocket(currentUser.id);
      } else {
        console.log("[Init] No user, registering guest");
        initializeSocket(null);
      }
    };

    init();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      await axiosClient.post("/auth/login", credentials);
      const loggedInUser = await fetchCurrentUser();

      if (loggedInUser?.id) {
        socketRef.current?.registerUser(loggedInUser.id);
        console.log("[Auth] User logged in:", loggedInUser.username || loggedInUser.id);

        // Redirect after login
        navigate("/admin", { replace: true });
      }

      return { success: true, user: loggedInUser };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      console.log("[Auth] Login failed:", message);
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
      safeSetUser(null);
      localStorage.setItem("logout-event", Date.now());

      if (socketRef.current) {
        socketRef.current.leaveAllRooms?.();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (isMountedRef.current) setSocketReady(false);

      console.log("[Auth] Logged out successfully. Reinitializing as guest...");
      initializeSocket(null);

      // Redirect after logout
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "logout-event") {
        safeSetUser(null);
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        if (isMountedRef.current) setSocketReady(false);

        // Redirect when another tab logs out
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        forcedLogoutReason,
        resetForcedLogoutReason,
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
