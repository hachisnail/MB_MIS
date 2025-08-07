import AdminHeader from "../headers/AdminHeader";
import AdminNav from "../navbar/AdminNav";
import { Outlet, useLocation, matchPath } from "react-router-dom";
import Breadcrumb from "../Breadcrumb";
import { useState } from "react";

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const themedRoutes = [
    { path: "/admin/logs", theme: "bg-[#151515] text-white" },
    { path: "/admin/logs/:log", theme: "bg-[#151515] text-white" },
    { path: "/admin/user", theme: "bg-[#151515] text-white" },
    { path: "/admin/user/:user", theme: "bg-[#151515] text-white" },
    { path: "/admin/add-user", theme: "bg-[#151515] text-white" },
    { path: "/admin/config", theme: "bg-[#151515] text-white" },
  ];

  const matchedTheme = themedRoutes.find(({ path }) =>
    matchPath({ path, end: true }, location.pathname)
  );

  const theme = matchedTheme?.theme || "";
  const isDashboard = location.pathname === "/admin/dashboard";
  const isPreview = location.pathname.includes("/preview/");
  const isUnauthorized = location.pathname.includes("/unauthorized");

  return (
    <div
      className={`h-screen w-screen grid grid-cols-[auto_1fr_1fr_1fr_1fr]   grid-rows-[auto_auto_1fr]  overflow-hidden`}
    >
      {/* Header */}
      <div className="col-span-5 h-[4rem]">
        <AdminHeader
          onOpen={() => setSidebarOpen(true)}
          onClose={() => setSidebarOpen(false)}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {/* Sidebar */}
      {!isUnauthorized && (
        <div
          className={`row-span-4 row-start-2 col-start-1  ${
            isSidebarOpen ? "w-75" : "w-23"
          } `}
        >
          <AdminNav isOpen={isSidebarOpen} />
        </div>
      )}

      {/* Breadcrumb */}
      {!isDashboard && !isUnauthorized && (
        <div
          className={`h-[12rem] col-span-4 col-start-2 row-start-2  flex items-center px-15 ${theme}`}
        >
          <div className="flex  h-fit flex-col gap-y-1">
            <Breadcrumb />
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        className={`col-span-4 row-span-3 col-start-2 row-start-3 h-full w-full overflow-auto ${theme} pb-5 px-15`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
