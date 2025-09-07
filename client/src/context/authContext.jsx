// /src/context/authContext.jsx
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
  const mountedRef = useRef(false);
  const socketInitializedRef = useRef(false);
  const listenersInitializedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        socketRef.current?.disconnect?.();
      } catch {}
      socketInitializedRef.current = false;
      listenersInitializedRef.current = false;
    };
  }, []);

  const safeSetUser = (nextUser) => {
    if (mountedRef.current) setUser(nextUser);
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
    if (socketInitializedRef.current && socketRef.current) {
      // Update identity + force a re-handshake so server sees new cookie
      socketRef.current.registerUser(userId ?? null);
      socketRef.current.rehandshake?.();
      return;
    }

    const client = getSocketClient();
    socketRef.current = client;
    socketInitializedRef.current = true;

    if (!listenersInitializedRef.current) {
      client.onReady?.(() => {
        if (mountedRef.current) setSocketReady(true);
      });

      client.onForceLogout?.((data) => {
        setForcedLogoutReason(data?.reason || "You have been logged out.");
        safeSetUser(null);
        setSocketReady(false);
        localStorage.setItem("logout-event", Date.now());
        client.registerUser(null);
        client.rehandshake?.(); // 🔧 ensure downgrade to guest on server immediately
        navigate("/login", { replace: true });
      });

      listenersInitializedRef.current = true;
    }

    client.registerUser(userId ?? null);
    client.rehandshake?.(); // 🔧 first mount: align server with current cookie
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const currentUser = await fetchCurrentUser();
      if (cancelled) return;
      initializeSocket(currentUser?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      await axiosClient.post("/auth/login", credentials); // sets new cookie
      const loggedInUser = await fetchCurrentUser(); // confirms who we are
      if (loggedInUser?.id) {
        // update identity + force a NEW socket handshake so middleware reads the new cookie
        socketRef.current?.registerUser?.(loggedInUser.id);
        socketRef.current?.rehandshake?.(); // 🔧 key line
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
      if (!skipServer) await axiosClient.post("/auth/logout"); // clears cookie
    } catch (err) {
      console.error("Logout failed:", err?.message || err);
    } finally {
      safeSetUser(null);
      localStorage.setItem("logout-event", Date.now());
      socketRef.current?.registerUser?.(null); // become guest locally
      socketRef.current?.rehandshake?.(); // 🔧 force server to see guest immediately
      setSocketReady(false);
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "logout-event") {
        safeSetUser(null);
        socketRef.current?.registerUser?.(null);
        socketRef.current?.rehandshake?.(); // 🔧 keep other tabs in sync
        setSocketReady(false);
        navigate("/login", { replace: true });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
