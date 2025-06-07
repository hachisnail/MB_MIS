// App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { useAuth } from "./context/authContext";

import Router from "./router";

function App() {
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
