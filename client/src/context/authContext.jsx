import { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../lib/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

const login = async (credentials) => {
  try {
    const res = await axiosClient.post("/auth/login", credentials);
    setUser(res.data.user);
    return { success: true };
  } catch (err) {
    const message = err.response?.data?.message || "Login failed";
    console.error("Login failed:", message);
    return { success: false, message };
  }
};


  const logout = async () => {
    try {
      await axiosClient.post("/auth/logout");
      setUser(null);
      localStorage.setItem("logout-event", Date.now());
    } catch (err) {
      console.error("Logout failed");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleStorage = (event) => {
      if (event.key === "logout-event") {
        setUser(null); 
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
