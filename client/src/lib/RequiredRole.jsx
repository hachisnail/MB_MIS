import { useAuth } from "../context/authContext";
import { Navigate, Outlet } from "react-router-dom";

// Map role IDs to role names
const roleMap = {
  1: "Admin",
  2: "ContentManager",
  3: "Viewer", 
  4: "Reviewer",
  5: "Sraff"
};

export default function RequireRole({ role }) {
  const { user } = useAuth();
  // console.log("RequireRole user:", user);

  if (!user) return <Navigate to="/login" replace />;

  const userRoleName = roleMap[user.roleId]; 

  if (userRoleName != role) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <Outlet />;
}
