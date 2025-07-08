import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { useAuth } from "./context/authContext";
import { useEffect } from "react";

import Router from "./router";

function App() {
  useEffect(() => {
    // fonts override
    const userAgent = navigator.userAgent;

    const isOpera = userAgent.includes("OPR") || userAgent.includes("Opera");

    const isBrave = typeof navigator.brave !== "undefined";

    if (isOpera) {
      document.documentElement.style.fontSize = "10px";
    } else if (isBrave) {
      document.documentElement.style.fontSize = "10px";
    } else {
      const isChromium = !!window.chrome || userAgent.includes("Chromium");
      if (isChromium) {
        document.documentElement.style.fontSize = "10px";
      }
    }
  }, []);

  // useEffect(() => {
  //   const disableRightClick = (e) => {
  //     e.preventDefault();
  //   };

  //   document.addEventListener("contextmenu", disableRightClick);

  //   return () => {
  //     document.removeEventListener("contextmenu", disableRightClick);
  //   };
  // }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-black border-opacity-75"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
