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
  switch (currentPage){
    case "inventory":
      pageTitle = 'Inventory of Artifact';
    break
    case "acquisition":
      pageTitle = 'Donations/Acquisitions/Lending Management';
    break
    case "logs":
      pageTitle = 'Logging';
    break
    case "view":
      pageTitle = 'View Artifacts';
    break
    case "user":
      pageTitle = 'User Management';
    break
    case "appointment":
      pageTitle = 'Appointments Management';
    break
    case "schedule":
      pageTitle = 'Schedules Management';
    break
    case "article":
      pageTitle = 'Articles Management';
    break



    default:
      pageTitle = 'Sandbox/Unasigned';
    break;

  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <AdminHeader
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex w-full h-full">
        <AdminNav isOpen={isSidebarOpen} />
        <main className="w-full h-full bg-gray-300 flex flex-col p-2 gap-y-2">
          {!isDashboard && (
            <div className="w-fit h-fit flex flex-col">
              <span className="text-2xl font-semibold">{pageTitle}</span>
              <Breadcrumb />
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
