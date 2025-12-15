import { useAuth } from "@/context/authContext";
import { NavLink, useNavigate } from "react-router-dom";
import { useRouterFlags } from "@/context/routerFlagProvider";
import { generateColorFromKey } from "@/components/commons";
import {
  Dashboard,
  Appointment,
  Schedule,
  Acquisition,
  Inventory,
  Article,
  User,
  Config,
  Logs,
  Feedback,
} from "../../utils/AdminNavIcons";
import Logo from "../../assets/LOGO.png";

import LogoutButton from "@/components/buttons/LogoutBtn";

const AdminNav = ({ isOpen, onClose, onOpen, isSidebarOpen }) => {
  const { user } = useAuth();
  const { flags, loading } = useRouterFlags();

  const navigate = useNavigate();

  const firstInitial = user.fname.charAt(0).toUpperCase();
  const lastInitial = user.lname.charAt(0).toUpperCase();

  const initials = user.fname.charAt(0) + user.lname.charAt(0);
  const { bg, text } = generateColorFromKey(initials);

  const alwaysVisible = ["dashboard", "configuration", "feedback"];

  const tabItems = [
    {
      label: "dashboard",
      path: "/admin/dashboard",
      icon: <Dashboard />,
    },
    {
      label: "appointment",
      path: "/admin/appointment",
      icon: <Appointment />,
    },
    {
      label: "feedback",
      path: "/admin/feedback",
      icon: <Feedback />,
    },
    {
      label: "schedule",
      path: "/admin/schedule",
      icon: <Schedule />,
    },
    {
      label: "acquisition",
      path: "/admin/acquisition",
      icon: <Acquisition />,
    },
    {
      label: "inventory",
      path: "/admin/inventory",
      icon: <Inventory />,
    },
    {
      label: "article",
      path: "/admin/article",
      icon: <Article />,
    },
  ];

  if (user.roleId == "1") {
    tabItems.push(
      {
        label: "user",
        path: "/admin/user",
        icon: <User />,
      },
      {
        label: "configuration",
        path: "/admin/config",
        icon: <Config />,
      },
      {
        label: "logs",
        path: "/admin/logs",
        icon: <Logs />,
      }
    );
  }

  return (
    <div
      className={`${isSidebarOpen ? "bg-stone-900" : "bg-[#100E09]"
        } w-full h-full grid grid-cols-1 grid-rows-[4.25rem_1fr_7rem]  `}
    >
      <div
        className={`w-full h-full flex justify-start items-center pl-3 transition-all duration-300 ease-in-out `}
      >
        {isSidebarOpen ? (
          <>
            <svg
              onClick={onClose}
              className="cursor-pointer stroke-gray-500  hover:stroke-gray-400 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
              <path d="M9 4v16" />
              <path d="M15 10l-2 2l2 2" />
            </svg>

            {/* <img
              src={Logo}
              alt="Museo Bulawan Logo"
              className="w-11 h-11 select-none flex-shrink-0"
            /> */}
          </>
        ) : (
          <div className="relative group w-11 h-11 flex-shrink-0 flex items-center">
            {/* Default: Logo */}
            <img
              src={Logo}
              alt="Museo Bulawan Logo"
              className="w-11 h-11 select-none group-hover:hidden"
            />

            {/* On Hover: SVG */}
            <svg
              onClick={onOpen}
              className="absolute left-0 right-0 mx-auto cursor-pointer stroke-white hover:stroke-gray-400 hidden group-hover:block"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
              <path d="M9 4v16" />
              <path d="M14 10l2 2l-2 2" />
            </svg>
          </div>
        )}
      </div>

      <div className="w-full h-full flex flex-col">
        {/* user info container */}
        <div className="w-full h-47 flex justify-start items-center cursor-pointer border-b border-gray-700">
          <div
            className={`flex-shrink-0 transition-all duration-300 ease-in-out flex items-center justify-center ${isSidebarOpen ? "ml-5 w-20 h-20" : "ml-2 w-12 h-12"
              } bg-white rounded-full`}
          >
            <div
              className={`flex-shrink-0 transition-all duration-300 ease-in-out flex items-center justify-center rounded-full ${isSidebarOpen ? "w-[4.5rem] h-[4.5rem]" : "w-11 h-11"
                }`}
              style={{ backgroundColor: bg }}
            >
              <span
                className={`flex items-center justify-center text-center font-semibold transition-all duration-300 ease-in-out ${isSidebarOpen ? "text-4xl" : "text-xl"
                  } ${text}`}
              >
                {firstInitial}
                {lastInitial}
              </span>
            </div>
          </div>

          <div
            className={`w-35 ml-5 transition-all duration-300 ease-in-out transform ${isOpen
                ? "flex opacity-100 translate-y-0"
                : "hidden opacity-0 -translate-y-2"
              } flex-col overflow-hidden`}
          >
            <span className="text-white text-start text-2xl font-semibold">
              {user.fname}
            </span>
            <span className="text-white text-start text-2xl font-semibold">
              {user.lname}
            </span>
            <span className="text-[9px] text-xl text-gray-500 truncate">
              {user.position === "ContentManager"
                ? "Content Manager"
                : user.position}
            </span>
          </div>
        </div>

        {/* nav link renderer */}
        <div
          className={`
          h-fit flex flex-col pt-10 gap-y-3 items-center
          transition-all duration-300 ease-in-out 
          ${isSidebarOpen ? "px-5" : "px-2"}
        `}
          style={{
            width: isSidebarOpen ? "100%" : "4.25rem",
          }}
        >
          {tabItems.map(({ label, icon, path, title }, idx) => {
            const normalizedLabel = label.trim().toLowerCase();
            const isAlwaysVisible = alwaysVisible.includes(normalizedLabel);
            const isFlagEnabled = flags[normalizedLabel] || flags[label];

            if (!isAlwaysVisible && !isFlagEnabled) return null;

            return (
              <NavLink
                key={idx}
                to={path}
                title={label.toUpperCase()}
                className={({ isActive }) =>
                  `w-full h-16 rounded-md flex items-center hover:border ${isSidebarOpen ? "px-3 gap-2" : "px-[0.3rem]"
                  } transition-all duration-300 ease-in-out justify-start overflow-hidden ${isActive
                    ? "bg-[#FEF7FF] text-black stroke-black"
                    : "bg-transparent text-white stroke-white"
                  }`
                }
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                {isSidebarOpen && (
                  <span className="text-xl font-semibold capitalize truncate">
                    {label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div
        className={`
          h-full flex flex-col  items-start justify-center 
          transition-all duration-300 ease-in-out 
          ${isSidebarOpen ? "px-5 py-2" : "px-2"}
        `}
        style={{
          width: isSidebarOpen ? "100%" : "4.25rem",
        }}
      >
        {/* <div className="w-full h-full flex justify-start items-center cursor-pointer rounded-md hover:border-gray-700 hover:border">
          <div
            className={`${
              isSidebarOpen ? "ml-2 w-20 h-20" : " w-12 h-12"
            } bg-white  rounded-full transition-all duration-300 ease-in-out flex items-center justify-center`}
          >
            <div
              className={`${
                isSidebarOpen ? " w-[4.5rem] h-[4.5rem]" : " w-11 h-11"
              }   rounded-full transition-all duration-300 ease-in-out flex items-center justify-center`}
              style={{ backgroundColor: bg }}
            >
              <span
                className={`${
                  isSidebarOpen ? "text-4xl" : "text-xl"
                }  font-semibold flex text-center items-center transition-all duration-300 ease-in-out ${text}`}
              >
                {firstInitial}
                {lastInitial}
              </span>
            </div>
          </div>

          <div
            className={`w-35 ml-5 transition-all duration-300 ease-in-out transform ${
              isOpen
                ? "flex opacity-100 translate-y-0"
                : "hidden opacity-0 -translate-y-2"
            } flex-col overflow-hidden`}
          >
            <span className="text-white text-start text-2xl font-semibold">
              {user.fname}
            </span>

            <span className="text-white text-start text-2xl font-semibold">
              {user.lname}
            </span>

            <span className="text-[9px] text-xl text-gray-500 truncate">
              {user.position === "ContentManager"
                ? "Content Manager"
                : user.position}
            </span>
          </div>
        </div> */}

        <LogoutButton isOpen={isOpen} />
      </div>
    </div>
  );
};

export default AdminNav;
