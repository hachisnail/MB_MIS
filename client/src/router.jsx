import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/authContext";
import Unauthorized from "./pages/Unauthorized";
import { useRouterFlags  } from "./context/routerFlagProvider";

// landing pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Catalogue from "./pages/Catalogue";


// admin pages
import Dashboard from "./pages/admin/Dashboard";
import Logs from "./pages/admin/Logs";
import User from "./pages/admin/User";
import Inventory from "./pages/admin/Inventory";
import NoMatch from "./pages/NoMatch";
import RequireRole from "./lib/requiredRole";
import Acquisition from "./pages/admin/Acquisition";
import ViewArtifacts from "./components/pages/viewArtifacts";
import Schedule from "./pages/admin/Schedule";
import Article from "./pages/admin/Article";
import Appointments from "./pages/admin/Appointments";


// sandbox
import FileUploadDownload from "./sandbox/fileUploadDownload";
import FilePreviewer from "./sandbox/FilePreviewer";
import ModalsTest from "./sandbox/ModalsTest"
import RouteFlagToggle from "./sandbox/RouteFlagToggle";


import AdminLayout from "./components/layout/AdminLayout";

const RequireAuth = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const Router = () => {
  const { login } = useAuth();
  const { flags, loading } = useRouterFlags();

  if (loading) return <div>Loading routes...</div>;
  return (
    <Routes>
      {/* Public routes */}

      {flags['login'] && <Route path="/login" element={<Login onLogin={login} />} />}
      {flags['catalogs'] && <Route path="/catalogs" element={<Catalogue />} />}
      {flags['home'] && <Route path="/" element={<Home />} />}


      {/* Protected routes */}
      <Route path="/admin" element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          {flags['dashboard'] && <Route path="dashboard" element={<Dashboard />} />}
          {flags['inventory'] && <Route path="inventory" element={<Inventory />} />}
          {/* sample nested view */}

          {flags['inventory'] && <Route path="inventory/view" element={<ViewArtifacts />} />}
        
          {flags['acquisition'] && <Route path="acquisition" element={<Acquisition />} />}
          {flags['schedule'] && <Route path="schedule" element={<Schedule />} />}
          {flags['article'] && <Route path="article" element={<Article />} />}
          {flags['schedule'] && <Route path="schedule" element={<Schedule />} />}
          {flags['appointment'] && <Route path="appointment" element={<Appointments />} />}
          






          {/* sandbox for testing */}
          {flags['sandbox'] && <Route path="sandbox" element={<FileUploadDownload />} />}
          {flags['sandbox'] && <Route path="sandbox/preview/:category/:filename" element={<FilePreviewer />} />}
          {flags['sandbox'] && <Route path="sandbox/modal" element={<ModalsTest />} />}
          {flags['sandbox'] && <Route path="sandbox/router-flag" element={<RouteFlagToggle />} />}

          
          {/* sandbox for end */}


          {/* Admin-only subroutes */}
          <Route element={<RequireRole role="Admin" />}>
          {flags['logs'] && <Route path="logs" element={<Logs />} />}
          {flags['user'] && <Route path="user" element={<User />} />}
          </Route>


        </Route>
      </Route>

      {/* Catch-all & unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
};

export default Router;
