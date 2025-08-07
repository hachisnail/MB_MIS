import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import Unauthorized from "@/pages/Unauthorized";
import ServerDown from "@/pages/ServerDown";
import { useRouterFlags } from "@/context/routerFlagProvider";
import logo from "../src/assets/LOGO.png"


import Home from "@/pages/public/Home";
import Login from "@/pages/public/Login";
import Catalogue from "@/pages/public/Catalogue";
import Appointment from "@/pages/public/Appointment";
import Articles from "@/pages/public/Articles";
import About from "@/pages/public/About";
import Articlecontents from "@/pages/public/Articlecontents";
import Contribution from "@/components/subpages/public/Contribution";
import Support from "@/components/subpages/public/Support";

import RecoverAccount from "@/components/subpages/public/RecoverAccount";

import MaintenanceMode from "@/pages/MaintenanceMode";

import CompleteRegistrationPage from "@/components/subpages/public/CompleteRegistrationPage";
import RegistrationSuccess from "@/components/subpages/public/RegistrationSuccessPage";

import ElectionResultParser from "@/pages/ElectionRParser";

// admin pages
import Dashboard from "@/pages/admin/Dashboard";
import Logs from "@/pages/admin/Logs";
import ViewLogs from "@/components/subpages/private/ViewLogs";
import User from "@/pages/admin/User";
import CreateUser from "@/components/subpages/private/CreateUsers";
import Inventory from "@/pages/admin/Inventory";
import NoMatch from "@/pages/NoMatch";
import RequireRole from "@/lib/RequiredRole";
import Acquisition from "@/pages/admin/Acquisition";
import AddArtifact from "@/components/subpages/private/AddArtifact"
import ViewArtifacts from "@/components/subpages/private/ViewArtifacts";
import Schedule from "@/pages/admin/Schedule";
import Article from "@/pages/admin/Article";
import Appointments from "@/pages/admin/Appointments";
import { AppointmentViewPage } from "@/components/subpages/private/AppointmentViewPage";
import UserView from "@/components/subpages/private/ViewUser";
import Configuration from "@/pages/admin/Configuration";
import ManageArticle from "@/components/subpages/private/ManageArticle";

// import ArticleModal from "./components/subpages/ArticleModal";

// sandbox
import FileUploadDownload from "@/sandbox/FileUploadDownload";
import FilePreviewer from "@/features/FilePreviewer";
import ModalsTest from "@/sandbox/ModalsTest";
import RouteFlagToggle from "@/sandbox/RouteFlagToggle";
import SocketMonitor from "./sandbox/SocketMonitor";

import AdminLayout from "@/components/layout/AdminLayout";
import PublicLayout from "@/components/layout/PublicLayout";

const RequireAuth = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const Router = () => {
  const { login } = useAuth();
  const { flags, loading } = useRouterFlags();

  if (loading)
    return (
      <div className="w-screen h-screen flex items-center justify-center fkex-col">
        <div className="flex flex-col">
        {/* <img src={logo} alt="MSB" className="w-20" /> */}

          <div className="w-7 h-7 mx-auto border-2 border-black border-t-transparent animate-spin rounded-full" />
          <span> Loading routes... </span>
        </div>
      </div>
    );
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        {flags["login"] && (
          <>
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="/login/forgot-password" element={<RecoverAccount />} />
          </>
        )}

        {flags["catalogs_public"] && (
          <Route path="/catalogs" element={<Catalogue />} />
        )}

        {flags["home"] && (
          <>
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Home />} />
          </>
        )}

        {flags["appointment_public"] && (
          <Route path="/appointment" element={<Appointment />} />
        )}

        {flags["articles_public"] && (
          <>
            <Route path="/article/:id" element={<Articlecontents />} />
            <Route path="/articles" element={<Articles />} />
          </>
        )}

        {flags["about"] && (
          <>
            <Route path="/about" element={<About />} />
            <Route path="/about/support" element={<Support />} />
          </>
        )}
        {flags["acquisition_public"] && (
          <Route
            path="/about/support/contribution-form"
            element={<Contribution />}
          />
        )}

        {/* flags to be defined */}
        <Route path="/recover" element={<RecoverAccount />} />
        <Route path="/recover/:token" element={<RecoverAccount />} />
        <Route path="/recover/success" element={<RecoverAccount />} />

        <Route
          path="/complete-registration/:token"
          element={<CompleteRegistrationPage />}
        />
        <Route path="/registration-success" element={<RegistrationSuccess />} />

        {/* meh lmao */}
        <Route path="/parser" element={<ElectionResultParser />} />
      </Route>

      {/* Protected routes */}
      <Route path="/admin" element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          {flags["inventory"] && (
            <>
              <Route path="inventory" element={<Inventory />} />
              <Route path="inventory/view" element={<ViewArtifacts />} />
            </>
          )}

          {flags["acquisition"] && (
            <>
              <Route path="acquisition" element={<Acquisition />} />
              <Route path="acquisition/add-artifact" element={<AddArtifact />} />
            </>
          )}
          {flags["schedule"] && (
            <Route path="schedule" element={<Schedule />} />
          )}
          {flags["article"] && (
            <>
              <Route path="article" element={<Article />} />
              <Route path="article/add-article" element={<ManageArticle />} />
              <Route
                path="article/edit-article/:encoded"
                element={<ManageArticle />}
              />

              <Route path="article/add-article" element={<ManageArticle />} />
              <Route path="article/edit-article" element={<ManageArticle />} />
            </>
          )}

          {flags["appointment"] && (
            <>
              <Route path="appointment" element={<Appointments />} />
              <Route
                path="appointment/:encoded"
                element={<AppointmentViewPage />}
              />
            </>
          )}

          {flags["schedule"] && (
            <Route path="schedule/:encoded" element={<AppointmentViewPage />} />
          )}

          {flags["files"] && (
            <Route path="preview/:encoded" element={<FilePreviewer />} />
          )}

          {/* sandbox for testing */}
          {flags["sandbox"] && (
            <>
              <Route path="sandbox" element={<FileUploadDownload />} />
              <Route
                path="sandbox/preview/:encoded"
                element={<FilePreviewer />}
              />
              <Route path="sandbox/modal" element={<ModalsTest />} />
              <Route path="sandbox/router-flag" element={<RouteFlagToggle />} />
              <Route
                path="sandbox/socket-monitor"
                element={<SocketMonitor />}
              />
            </>
          )}

          {/* Admin-only subroutes */}
          <Route element={<RequireRole role="Admin" />}>
            {flags["logs"] && (
              <>
                <Route path="logs/:encoded" element={<ViewLogs />} />
                <Route path="logs" element={<Logs />} />
              </>
            )}
            {flags["user"] && (
              <>
                <Route path="user/:encoded" element={<UserView />} />
                <Route path="user" element={<User />} />
                <Route path="user/add-user" element={<CreateUser />} />
              </>
            )}
            <Route path="config" element={<Configuration />} />
          </Route>

          <Route path="unauthorized" element={<Unauthorized />} />
        </Route>
      </Route>

      {/* Catch-all & unauthorized */}
      {flags["down"] && <Route path="*" element={<ServerDown />} />}

      {flags["maintenance"] && <Route path="*" element={<MaintenanceMode />} />}
      {flags["nomatch"] && <Route path="*" element={<NoMatch />} />}
    </Routes>
  );
};

export default Router;
