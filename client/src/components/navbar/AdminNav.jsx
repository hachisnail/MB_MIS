import { useAuth } from "../../context/authContext";
import { NavLink } from "react-router-dom";

import LogoutButton from "../buttons/LogoutBtn";

const AdminNav = ({ isOpen }) => {
  const { user } = useAuth();
  const firstInitial = user.fname.charAt(0).toUpperCase();
  const lastInitial = user.lname.charAt(0).toUpperCase();
  const position = user.position.charAt(0).toUpperCase();

  const colorMap = {
    A: "#FF6666",
    B: "#FF9933",
    C: "#FFD700",
    D: "#66CC66",
    E: "#0099CC",
    F: "#9933CC",
    G: "#FF3399",
    H: "#6666FF",
    I: "#00CC99",
    J: "#FF6600",
    K: "#3399FF",
    L: "#FF3366",
    M: "#33CC33",
    N: "#FFCC00",
    O: "#336699",
    P: "#990000",
    Q: "#FF6699",
    R: "#666600",
    S: "#669900",
    T: "#009999",
    U: "#6600CC",
    V: "#CC3300",
    W: "#99CC00",
    X: "#9966FF",
    Y: "#FF0000",
    Z: "#33CCCC",
  };
  const bgColor = colorMap[firstInitial] || "#FFFFFF";

  return (
    <div
      className={`
        h-full bg-[#1C1B19] flex flex-col items-center justify-between py-7
        transition-all duration-300 ease-in-out select-none
        ${isOpen ? "w-52 3xl:w-65" : "w-16"}
      `}
    >
      <div className="w-full p-2 border-b border-gray-700 flex flex-col  gap-y-2">
        <div className="flex h-20 items-center gap-x-2">
          <div className="min-w-10 min-h-10 3xl:min-w-15 3xl:min-h-15 rounded-full bg-white flex items-center justify-center">
            <div
              className="min-w-8.5 min-h-8.5 3xl:min-w-13 3xl:min-h-13 rounded-full border-1 flex items-center justify-center"
              style={{ backgroundColor: bgColor }}
            >
              <span className="text-xl 3xl:text-2xl font-semibold flex text-center items-center">
                {firstInitial}
                {lastInitial}
              </span>
            </div>
          </div>

          <div
            className={`transition-all duration-300 ease-in-out transform ${isOpen ? "flex opacity-100 translate-y-0" : "hidden opacity-0 -translate-y-2"
              } flex-col`}
          >
            <span className="text-white text-sm text-center 3xl:text-2xl font-semibold">
              {user.fname}
            </span>

            <span className="text-white text-xs text-center 3xl:text-2xl font-semibold">
              {user.lname}
            </span>

            <span className="text-[8px] lg:text-sm text-gray-500">{user.position}</span>
          </div>

        </div>
        {/* <div
          className={`flex flex-col  transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'
          }`}
        >
          <span className="text-[8px] lg:text-xs text-gray-500">{user.position}</span>
          <span className="text-white text-xs lg:text-xl font-semibold">{user.fname} {user.lname}</span>
        </div> */}
      </div>
      <div className="w-full h-full mt-4 3xl:mt-10">
        <div className="flex-1 w-full  flex flex-col items-center px-3 gap-y-1 text-sm 3xl:text-xl 3xl:gap-y-2 font-semibold">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `
              rounded w-full h-10 3xl:h-15 flex items-center gap-x-2 hover:border-1
              ${isOpen ? "pl-0 sm:pl-4 " : "justify-center"}
              ${isActive
                ? "bg-[#FEF7FF] text-black stroke-black"
                : "bg-transparent text-white stroke-white"
              }
          `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon"
            >
              <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
              <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
              <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
            </svg>
            {isOpen && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/admin/appointment"
            className={({ isActive }) => `
              rounded w-full h-10 3xl:h-15 flex items-center gap-x-2 hover:border-1
              ${isOpen ? "pl-0 sm:pl-4" : "justify-center"}
              ${isActive
                ? "bg-[#FEF7FF] text-black stroke-black"
                : "bg-transparent text-white stroke-white"
              }
          `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon"
            >
              <path d="M10.5 21h-4.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M4 11h10" />
              <path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
              <path d="M18 16.5v1.5l.5 .5" />
            </svg>
            {isOpen && <span>Appointment</span>}
          </NavLink>



          <NavLink
            to="/admin/inventory"
            className={({ isActive }) => `
              rounded w-full h-10 3xl:h-15 flex items-center gap-x-2 hover:border-1
              ${isOpen ? "pl-0 sm:pl-4" : "justify-center"}
              ${isActive
                ? "bg-[#FEF7FF] text-black stroke-black"
                : "bg-transparent text-white stroke-white"
              }
          `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon"
            >
              <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
              <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
              <path d="M9 17v-4" />
              <path d="M12 17v-1" />
              <path d="M15 17v-2" />
              <path d="M12 17v-1" />
            </svg>
            {isOpen && <span>Inventory</span>}
          </NavLink>


          <NavLink
            to="/admin/acquisition"
            className={({ isActive }) => `
              rounded w-full h-10 3xl:h-15 flex items-center gap-x-2 hover:border-1
              ${isOpen ? "pl-0 sm:pl-4" : "justify-center"}
              ${isActive
                ? "bg-[#FEF7FF] text-black stroke-black"
                : "bg-transparent text-white stroke-white"
              }
          `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon"
            >
              <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
              <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" />
              <path d="M10 14h4" />
              <path d="M12 12v4" />
            </svg>
            {isOpen && <span>Acquisition</span>}
          </NavLink>

          <NavLink
            to="/admin/schedule"
            className={({ isActive }) => `
              rounded w-full h-10 3xl:h-15 flex items-center gap-x-2 hover:border-1
              ${isOpen ? "pl-0 sm:pl-4" : "justify-center"}
              ${isActive
                ? "bg-[#FEF7FF] text-black stroke-black"
                : "bg-transparent text-white stroke-white"
              }
          `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon"
            >
              <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M4 11h16" />
              <path d="M7 14h.013" />
              <path d="M10.01 14h.005" />
              <path d="M13.01 14h.005" />
              <path d="M16.015 14h.005" />
              <path d="M13.015 17h.005" />
              <path d="M7.01 17h.005" />
              <path d="M10.01 17h.005" />
            </svg>
            {isOpen && <span>Schedule</span>}
          </NavLink>





          <NavLink
            to="/admin/article"
            className={({ isActive }) => `
              rounded w-full h-10 3xl:h-15 flex items-center gap-x-2 hover:border-1
              ${isOpen ? "pl-0 sm:pl-4" : "justify-center"}
              ${isActive
                ? "bg-[#FEF7FF] text-black stroke-black"
                : "bg-transparent text-white stroke-white"
              }
          `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon"
            >
              <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
              <path d="M7 8h10" />
              <path d="M7 12h10" />
              <path d="M7 16h10" />
            </svg>
            {isOpen && <span>Article</span>}
          </NavLink>





        </div>

        {user.roleId == "1" ? (<>
          <div className="pt-4 3xl:pt-10 flex-1 w-full mt-4 border-t-1 border-gray-700 flex flex-col items-center px-3 gap-y-1 text-sm 3xl:text-xl 3xl:gap-y-2 font-semibold">

            <NavLink
              to="/admin/user"
              className={({ isActive }) => `
              rounded w-full h-10 3xl:h-15 flex items-center gap-x-2 hover:border-1
              ${isOpen ? "pl-0 sm:pl-4" : "justify-center"}
              ${isActive
                  ? "bg-[#FEF7FF] text-black stroke-black"
                  : "bg-transparent text-white stroke-white"
                }
          `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon"
              >
                <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
              </svg>
              {isOpen && <span>User</span>}





            </NavLink>


            <NavLink
              to="/admin/logs"
              className={({ isActive }) => `
                rounded w-full h-10 3xl:h-15 flex items-center gap-x-2 hover:border-1
                ${isOpen ? "pl-0 sm:pl-4" : "justify-center"}
                ${isActive
                  ? "bg-[#FEF7FF] text-black stroke-black"
                  : "bg-transparent text-white stroke-white"
                }
            `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon"
              >
                <path d="M4 12h.01" />
                <path d="M4 6h.01" />
                <path d="M4 18h.01" />
                <path d="M8 18h2" />
                <path d="M8 12h2" />
                <path d="M8 6h2" />
                <path d="M14 6h6" />
                <path d="M14 12h6" />
                <path d="M14 18h6" />
              </svg>
              {isOpen && <span>Logs</span>}
            </NavLink>
          </div>
        </>) : null}

      </div>
      {/* Footer */}
      <div className="w-full flex justify-center px-2">
        <LogoutButton isOpen={isOpen} />
      </div>
    </div>
  );
};

export default AdminNav;


