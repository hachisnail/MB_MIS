import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/authContext";
import { RouterFlagProvider } from "@/context/routerFlagProvider";
import { ScrollToTop } from "@/features/ScrollToTop";
import { useEffect } from "react";

import Router from "./router";

function App() {
  // Set font size for certain browsers
  useEffect(() => {
    const userAgent = navigator.userAgent;

    const isOpera = userAgent.includes("OPR") || userAgent.includes("Opera");
    const isBrave = typeof navigator.brave !== "undefined";

    if (isOpera || isBrave) {
      document.documentElement.style.fontSize = "10px";
    } else {
      const isChromium = !!window.chrome || userAgent.includes("Chromium");
      if (isChromium) {
        document.documentElement.style.fontSize = "10px";
      }
    }
  }, []);

  // Disable right-click context menu
  useEffect(() => {
    const disableRightClick = (e) => e.preventDefault();

    document.addEventListener("contextmenu", disableRightClick);
    return () => document.removeEventListener("contextmenu", disableRightClick);
  }, []);

  // Disable Ctrl + scroll zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <RouterFlagProvider>
          <ScrollToTop />
          <Router />
        </RouterFlagProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
