import { useAuth } from "@/context/authContext";
import { Navigate, useLocation } from "react-router-dom";

const RedirectIfLoggedIn = ({ children, to = "/admin/dashboard" }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isLoginPath = location.pathname === "/login";

  if (user && isLoginPath) {
    return <Navigate to={to} replace />;
  }

  return children;
};

export default RedirectIfLoggedIn;
