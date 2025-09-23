import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import Unauthorized from "@/pages/Unauthorized";
import ServerDown from "@/pages/ServerDown";
import { useRouterFlags } from "@/context/routerFlagProvider";
import PresenceReporter from "./components/PresenceReporter";

// public pages

// inquiry
import Inquiry from "./pages/public/inquiry/Inquiry";

// home
import Home from "./pages/public/home/Home";

// catalogue
import Catalogue from "./pages/public/catalogue/Catalogue";
import CatalogArtifactContents from "./pages/public/catalogue/subpages/CatalogArtifactContents";


// login
import Login from "./pages/public/login/Login";

// appointment
import Appointment from "./pages/public/appointments/Appointment";


// article
import Articles from "./pages/public/article/Articles";
import Articlecontents from "./pages/public/article/subpages/Articlecontents"



// about
import About from "./pages/public/about/About";
import Support from "./pages/public/about/subpages/Support";
import Contribution from "./pages/public/about/subpages/contribution-form/Contribution";

// forgot password
import RecoverAccount from "./pages/public/recover-account/RecoverAccount";
import CompleteRegistrationPage from "./pages/public/recover-account/subpages/CompleteRegistrationPage";
import RegistrationSuccess from "./pages/public/recover-account/subpages/RegistrationSuccessPage";




// admin pages

// dahsboard
import Dashboard from "./pages/admin/dashboard/Dashboard";

// logs
import Logs from "@/pages/admin/log/Logs";
import ViewLogs from "@/pages/admin/log/subpages/ViewLogs";

// acquisition
import Acquisition from "@/pages/admin/acquisition/Acquisition";
import AcquisitionViewPage from "./pages/admin/acquisition/subpages/AcquisitionViewPage";
import AddArtifact from "./pages/admin/acquisition/subpages/AddArtifact";

// apointments
import Appointments from "@/pages/admin/appointments/Appointments";
import { AppointmentViewPage } from "./pages/admin/appointments/subpages/AppointmentViewPage";
import WalkInsPage from "./pages/admin/appointments/subpages/WalkInsPage";

// articles
import Article from "@/pages/admin/article/Article";
import ManageArticle from "./pages/admin/article/subpages/ManageArticle";



// schedules
import Schedule from "./pages/admin/schedule/Schedule";
import AddSchedulePage from "./pages/admin/schedule/subpages/AddSchedulePage";

// configurations
import Configuration from "./pages/admin/configuration/Configuration";

// inventory
import Inventory from "./pages/admin/inventory/Inventory";
import ViewArtifacts from "./pages/admin/inventory/subpages/ViewArtifacts";

// user
import User from "./pages/admin/user/User";
import CreateUser from "./pages/admin/user/subpages/CreateUsers";
import UserView from "./pages/admin/user/subpages/ViewUser";


// system
import AdminScan from "./pages/admin/AdminScan";

import FilePreviewer from "@/features/FilePreviewer";

import NoMatch from "@/pages/NoMatch";
import RequireRole from "@/lib/RequiredRole";
import MaintenanceMode from "@/pages/MaintenanceMode";





// import ArticleModal from "./components/subpages/ArticleModal";

// sandbox
import FileUploadDownload from "@/sandbox/FileUploadDownload";
import AdminSocketsPanel from "./sandbox/AdminSocketsPanel";
import QrGenerator from "./sandbox/QrGenerator";
import QrScannerComponent from "./sandbox/QrScannerComponent";

import ModalsTest from "@/sandbox/ModalsTest";
import RouteFlagToggle from "@/sandbox/RouteFlagToggle";
import SocketMonitor from "./sandbox/SocketMonitor";
import Sandbox from "./sandbox/sandbox";
import ElectionResultParser from "@/pages/ElectionRParser";

// Layouts
import AdminLayout from "@/components/layout/AdminLayout";
import PublicLayout from "@/components/layout/PublicLayout";

const RequireAuth = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <Outlet />;
};

const Router = () => {
  const { login } = useAuth();
  const { flags, loading } = useRouterFlags();



  if (loading)
    return (
      <div className="w-screen h-screen flex items-center justify-center fkex-col">
        <div className="flex flex-col">
          <div className="w-7 h-7 mx-auto border-2 border-black border-t-transparent animate-spin rounded-full" />
          <span> Loading routes... </span>
        </div>
      </div>
    );
  return (
    <>
    <PresenceReporter />
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
            <>
              <Route path="/catalogs" element={<Catalogue />} />
              {/* NEW: single artifact view (expects base64 id in :id) */}
              <Route path="/catalog/:id" element={<CatalogArtifactContents />} />
            </>
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
        <Route path="/acquisition/inquiry/:token" element={<Inquiry />} />



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
      <Route path="/admin/scan" element={<AdminScan />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          {flags["inventory"] && (
            <>
              <Route path="inventory" element={<Inventory />} />
              <Route path="inventory/:encoded" element={<ViewArtifacts />} />
                            <Route
                path="inventory/:encoded/view"
                element={<FilePreviewer />}
              />
            </>
          )}

          {flags["acquisition"] && (
            <>
              <Route path="acquisition" element={<Acquisition />} />
              <Route
                path="acquisition/lending/:encoded"
                element={<AcquisitionViewPage />}
              />
              <Route
                path="acquisition/donation/:encoded"
                element={<AcquisitionViewPage />}
              />
              {/* acquisition/donation/don1/dW5kZWZpbmVk/preview/dW5kZWZpbmVk/ */}
              <Route
                path="acquisition/lending/:encoded/view"
                element={<FilePreviewer />}
              />
              <Route
                path="acquisition/donation/:encoded/view"
                element={<FilePreviewer />}
              />

              <Route
                path="acquisition/add-artifact"
                element={<AddArtifact />}
              />
            </>
          )}
          {flags["schedule"] && (
            <>
              <Route path="schedule" element={<Schedule />} />
              <Route path="schedule/add" element={<AddSchedulePage />} />
            </>
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
              <Route
                path="appointment/:encoded/view"
                element={<FilePreviewer />}
              />
              <Route
                path="appointment/walk-ins/"
                element={<WalkInsPage />}
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


              <Route path="dashboard/sandbox/scokets-panel" element={<AdminSocketsPanel />} />
              <Route path="dashboard/sandbox" element={<FileUploadDownload />} />
              <Route
                path="dashboard/sandbox/preview/:encoded"
                element={<FilePreviewer />}
              />
              <Route path="dashboard/sandbox/modal" element={<ModalsTest />} />
              <Route path="dashboard/sandbox/router-flag" element={<RouteFlagToggle />} />
              <Route
                path="dashboard/sandbox/socket-monitor"
                element={<SocketMonitor />}
              />
              <Route path="dashboard/sandbox/playground" element={<Sandbox />} />
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
              <Route path="qr-generate" element={<QrGenerator />} />
              <Route path="qr-scanner" element={<QrScannerComponent />} />
      {/* Catch-all & unauthorized */}
      {flags["down"] && <Route path="*" element={<ServerDown />} />}

      {flags["maintenance"] && <Route path="*" element={<MaintenanceMode />} />}
      {flags["nomatch"] && <Route path="*" element={<NoMatch />} />}
    </Routes>
    </>
  );
};

export default Router;
