import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/authContext";
import { useAuth } from "@/context/authContext";
import { useEffect } from "react";
import { RouterFlagProvider } from "@/context/routerFlagProvider";
import { ScrollToTop } from "@/lib/ScrollToTop";
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
    <RouterFlagProvider>

      <AppContent />
    </RouterFlagProvider>

    </AuthProvider>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div 
      
      className="flex flex-col items-center justify-center h-screen">
            <div className="w-7 h-7 mx-auto border-2 border-black border-t-transparent animate-spin rounded-full" />
            <span>Checking Server!</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop/>

      <Router />
    </BrowserRouter>
  );
}

export default App;
