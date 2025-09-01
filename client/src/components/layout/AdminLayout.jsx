import AdminHeader from "@/components/headers/AdminHeader";
import AdminNav from "@/components/navbar/AdminNav";
import { Outlet, useLocation, matchPath } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
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

  const itemRoutes = [
    "/admin/acquisition/lending/:encoded",
    "/admin/acquisition/donation/:encoded",
    "/admin/inventory/:encoded",
  ];

  const isItemView = itemRoutes.some((path) =>
    matchPath({ path }, location.pathname)
  );

  const theme = matchedTheme?.theme || "";
  const isDashboard = location.pathname === "/admin/dashboard";
  const isUnauthorized = location.pathname.includes("/unauthorized");

  return (
    <div className="h-screen w-screen grid grid-cols-[auto_1fr_1fr_1fr] grid-rows-[auto_auto_1fr_1fr] overflow-hidden">
      {/* Header */}
      <div className="col-span-3 col-start-2 row-start-1 h-[4rem]">
        <AdminHeader
          onOpen={() => setSidebarOpen(true)}
          onClose={() => setSidebarOpen(false)}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {/* Sidebar */}
      {!isUnauthorized && (
        <div
          className={`row-span-4 row-start-1 col-start-1 transition-all duration-300 ease-in-out  shadow-2xl shadow-black ${
            isSidebarOpen ? "w-75" : "w-17"
          }`}
        >
          <AdminNav
            isOpen={isSidebarOpen}
            onOpen={() => setSidebarOpen(true)}
            onClose={() => setSidebarOpen(false)}
            isSidebarOpen={isSidebarOpen}
          />
        </div>
      )}

      {/* Breadcrumb */}
      {!isDashboard && !isUnauthorized && (
        <div
          className={`col-span-3 col-start-2 row-start-2 flex items-center px-15 h-[12rem] ${theme}`}
        >
          <div className="flex h-fit flex-col gap-y-1">
            <Breadcrumb />
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        className={`col-span-3 row-span-2 col-start-2 row-start-3 h-full w-full overflow-auto ${theme} pb-5 ${
          isItemView ? "pl-15" : "px-15"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
