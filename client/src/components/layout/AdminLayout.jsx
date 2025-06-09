import AdminHeader from "../headers/AdminHeader";
import AdminNav from "../navbar/adminNav";
import { Outlet, useLocation } from "react-router-dom";
import Breadcrumb from "../Breadcrumb";
import { useState } from "react";

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const currentPage = location.pathname.split("/").filter(Boolean).pop();
  const isDashboard = currentPage === "dashboard";

  let pageTitle = '';
  let theme = '';

  switch (currentPage) {
    case "inventory":
      pageTitle = 'Inventory of Artifact';
      break;
    case "acquisition":
      pageTitle = 'Donations/Acquisitions/Lending Management';
      break;
    case "logs":
      pageTitle = 'Logging';
      theme = "bg-[#151515] text-white";
      break;
    case "view":
      pageTitle = 'View Artifacts';
      break;
    case "user":
      pageTitle = 'User Management';
      theme = "bg-[#151515] text-white";
      break;
    case "appointment":
      pageTitle = 'Appointments Management';
      break;
    case "schedule":
      pageTitle = 'Schedules Management';
      break;
    case "article":
      pageTitle = 'Articles Management';
      break;
    default:
      pageTitle = 'Sandbox/Unassigned';
      break;
  }

  return (
    <div className="h-screen w-screen grid grid-rows-[auto_1fr] ">
      {/* Header */}
      <AdminHeader
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Sidebar + Main Content */}
      <div className="grid grid-cols-[auto_1fr] h-full ">
        {/* Sidebar */}
        <AdminNav isOpen={isSidebarOpen} />

        {/* Main Content */}
        <main className={`h-full w-full flex flex-col overflow-visible  overflow-x-scroll overflow-y-scroll ${theme} p-4`}>
          {!isDashboard && (
            <div className={`w-full mb-4 ${theme}`}>
              <div className="flex flex-col gap-y-1">
                <span className="text-4xl font-semibold">{pageTitle}</span>
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
