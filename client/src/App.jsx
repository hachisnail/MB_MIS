import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/authContext";
import { useAuth } from "@/context/authContext";
import { useEffect } from "react";
import { RouterFlagProvider } from "@/context/routerFlagProvider";
import { ScrollToTop } from "@/features/ScrollToTop";
import bg from "@/assets/Image-1-1.jpg";

import Router from "./router";

function App() {
  useEffect(() => {
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

  useEffect(() => {
    const disableRightClick = (e) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };
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
