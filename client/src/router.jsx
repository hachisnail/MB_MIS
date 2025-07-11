import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/authContext";
import Unauthorized from "./pages/Unauthorized";
import ServerDown from "./pages/ServerDown";
import { useRouterFlags } from "./context/routerFlagProvider";

// landing pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Catalogue from "./pages/Catalogue";
import RecoverAccount from "./pages/RecoverAccount";


import CompleteRegistrationPage from "./components/subpages/CompleteRegistrationPage";
import RegistrationSuccess from "./components/subpages/RegistrationSuccessPage";

import ElectionResultParser from "./pages/ElectionRParser";

// admin pages
import Dashboard from "./pages/admin/Dashboard";
import Logs from "./pages/admin/Logs";
import ViewLogs from "./components/subpages/ViewLogs";
import User from "./pages/admin/User";
import CreateUser from "./components/subpages/CreateUsers";
import Inventory from "./pages/admin/Inventory";
import NoMatch from "./pages/NoMatch";
import RequireRole from "./lib/requiredRole";
import Acquisition from "./pages/admin/Acquisition";
import ViewArtifacts from "./components/subpages/ViewArtifacts";
import Schedule from "./pages/admin/Schedule";
import Article from "./pages/admin/Article";
import Appointments from "./pages/admin/Appointments";
import UserView from "./components/subpages/ViewUser";
import Configuration from "./pages/admin/Configuration";
import ArticleModal from "./components/subpages/ArticleModal";
import CreateArticle from "./components/subpages/CreateArticle";

// sandbox
import FileUploadDownload from "./sandbox/fileUploadDownload";
import FilePreviewer from "./features/FilePreviewer";
import ModalsTest from "./sandbox/ModalsTest";
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

      {flags["login"] && (
        <Route path="/login" element={<Login onLogin={login} />} />
      )}
  
      {flags["login"] && (
        <Route path="/forgot-password" element={<RecoverAccount/>} />
      )}

      <Route path="/recover" element={<RecoverAccount />} />
      <Route path="/recover/:token" element={<RecoverAccount />} />
      <Route path="/recover/success" element={<RecoverAccount />} />


      
      {flags["catalogs"] && <Route path="/catalogs" element={<Catalogue />} />}
      {flags["home"] && <Route path="/" element={<Home />} />}

      <Route
        path="/complete-registration/:token"
        element={<CompleteRegistrationPage />}
      />
      <Route path="/registration-success" element={<RegistrationSuccess />} />
      <Route path="/parser" element={<ElectionResultParser />} />

      {/* Protected routes */}
      <Route path="/admin" element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

   
          <Route path="dashboard" element={<Dashboard />} />
          {flags["inventory"] && (
            <Route path="inventory" element={<Inventory />} />
          )}
          {flags["inventory"] && (
            <Route path="inventory/view" element={<ViewArtifacts />} />
          )}
          {flags["acquisition"] && (
            <Route path="acquisition" element={<Acquisition />} />
          )}
          {flags["schedule"] && (
            <Route path="schedule" element={<Schedule />} />
          )}
          {flags["article"] && <Route path="article" element={<Article />} />}
          {flags["article"] && <Route path="article/add-article" element={<CreateArticle />} />}
          {flags["article"] && <Route path="article/edit-article" element={<ArticleModal />} />}




          {flags["appointment"] && (
            <Route path="appointment" element={<Appointments />} />
          )}

          {flags["files"] && (
            <Route
              path="preview/:encoded"
              element={<FilePreviewer />}
            />
          )}

          {/* sandbox for testing */}
          {flags["sandbox"] && (
            <Route path="sandbox" element={<FileUploadDownload />} />
          )}

          {flags["sandbox"] && (
            <Route path="sandbox/modal" element={<ModalsTest />} />
          )}
          {flags["sandbox"] && (
            <Route path="sandbox/router-flag" element={<RouteFlagToggle />} />
          )}

          {/* Admin-only subroutes */}
          <Route element={<RequireRole role="Admin" />}>
            {flags["logs"] && <Route path="logs" element={<Logs />} />}
            {flags["logs"] && <Route path="logs/:encoded" element={<ViewLogs />} />}
            {flags["user"] && <Route path="user" element={<User />} />}
            {flags["user"] && (
              <Route path="user/:encoded" element={<UserView />} />
            )}
             <Route path="config" element={<Configuration />} />

            {flags["user"] && (
              <Route path="user/add-user" element={<CreateUser />} />
            )}
          </Route>

          <Route path="unauthorized" element={<Unauthorized />} />

        </Route>
      </Route>

      {/* Catch-all & unauthorized */}

      {flags["down"] && <Route path="*" element={<ServerDown />} />}

      {flags["home"] && <Route path="*" element={<NoMatch />} />}
    </Routes>
  );
};

export default Router;
