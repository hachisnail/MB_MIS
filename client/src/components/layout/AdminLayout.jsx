import AdminHeader from "../headers/AdminHeader";
import AdminNav from "../navbar/adminNav";
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

  return (
    <div className="h-screen w-screen grid grid-rows-[auto_1fr] overflow-hidden">
      {/* Header */}
      <AdminHeader
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Sidebar + Main Content */}
      <div className="grid grid-cols-[auto_1fr] min-h-full overflow-hidden">
        {/* Sidebar */}
        <AdminNav isOpen={isSidebarOpen} />

        {/* Main Content */}
        <main className={`h-full w-full flex flex-col overflow-hidden overflow-x-scroll overflow-y-scroll ${theme} p-4`}>
          {!isDashboard && (
            <div className={`w-full mb-4 ${theme}`}>
              <div className="flex flex-col gap-y-1">
                <Breadcrumb />
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
