import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/authContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Logs from "./pages/admin/Logs";
import User from "./pages/admin/User";
import Inventory from "./pages/admin/Inventory";
import Unauthorized from "./pages/Unauthorized";
import NoMatch from "./pages/NoMatch";
import RequireRole from "./lib/requiredRole";
import Acquisition from "./pages/admin/Acquisition";
import ViewArtifacts from "./components/pages/viewArtifacts";
import Schedule from "./pages/admin/Schedule";
import Article from "./pages/admin/Article";

// sandbox
import FileUploadDownload from "./sandbox/fileUploadDownload";
import FilePreviewer from "./sandbox/FilePreviewer";

import AdminLayout from "./components/layout/AdminLayout";
import Appointments from "./pages/admin/Appointments";

const RequireAuth = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const Router = () => {
  const { login } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login onLogin={login} />} />



      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route path="/admin" element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
            
          <Route path="inventory" element={<Inventory />} />
          {/* sample nested view */}
          <Route path="inventory/view" element={<ViewArtifacts />} />


          <Route path="acquisition" element={<Acquisition />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="article" element={<Article />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="appointment" element={<Appointments />} />




          {/* sandbox for testing */}
          <Route path="sandbox" element={<FileUploadDownload />} />
          <Route path="sandbox/preview/:category/:filename" element={<FilePreviewer />} />


          {/* sandbox for end */}


          {/* Admin-only subroutes */}
          <Route element={<RequireRole role="Admin" />}>
            <Route path="logs" element={<Logs />} />
            <Route path="user" element={<User />} />
          </Route>


        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
};

export default Router;
