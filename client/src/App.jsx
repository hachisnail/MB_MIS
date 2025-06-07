// App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { useAuth } from "./context/authContext";
import { useEffect } from "react";

import Router from "./router";

function App() {


   useEffect(() => {
        const userAgent = navigator.userAgent;

        const isOpera = userAgent.includes("OPR") || userAgent.includes("Opera");

        const isBrave = typeof navigator.brave !== 'undefined';

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

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // or your spinner
  }

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
