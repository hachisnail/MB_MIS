import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { RouterFlagProvider } from "./context/routerFlagProvider";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterFlagProvider>
      <App />
    </RouterFlagProvider>
  </StrictMode>
);
