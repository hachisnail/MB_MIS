// AuthProvider.jsx
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
  const listenersInitialized = useRef(false); // prevent multiple listener registration

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
    if (!socketRef.current) {
      const socketClient = getSocketClient();
      socketRef.current = socketClient;

      if (!listenersInitialized.current) {
        // Socket ready listener
        socketClient.onReady(() => {
          if (isMountedRef.current) setSocketReady(true);
        });

        // Forced logout listener
        socketClient.onForceLogout((data) => {
          setForcedLogoutReason(data.reason || "You have been logged out.");
          safeSetUser(null);
          setSocketReady(false);
          localStorage.setItem("logout-event", Date.now());

          // Switch to guest user instead of disconnecting
          socketClient.registerUser(null);
          navigate("/", { replace: true });
        });

        listenersInitialized.current = true;
      }
    }

    // Always register the current user (or guest)
    socketRef.current.registerUser(userId);
  };

  useEffect(() => {
    const init = async () => {
      const currentUser = await fetchCurrentUser();
      initializeSocket(currentUser?.id || null);
    };
    init();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      await axiosClient.post("/auth/login", credentials);
      const loggedInUser = await fetchCurrentUser();

      if (loggedInUser?.id) {
        socketRef.current?.registerUser(loggedInUser.id); // switch socket to logged-in user
        navigate("/admin", { replace: true });
      }

      return { success: true, user: loggedInUser };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (skipServer = false) => {
    try {
      if (!skipServer) await axiosClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      safeSetUser(null);
      localStorage.setItem("logout-event", Date.now());

      // Switch socket to guest user instead of disconnecting
      socketRef.current?.registerUser(null);

      setSocketReady(false);
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "logout-event") {
        safeSetUser(null);
        // Switch socket to guest on multi-tab logout
        socketRef.current?.registerUser(null);

        setSocketReady(false);
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
        resetForcedLogoutReason: () => setForcedLogoutReason(null),
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
