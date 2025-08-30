import { useState, Fragment } from "react";
import { useAuth } from "@/context/authContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Transition } from "@headlessui/react";
import ConfirmationModal from "@/components/modals/ConfirmationModal"; 

const LogoutButton = ({ isOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  const shouldShowTooltip = !isOpen && tooltipVisible;
  const darkThemePaths = ["user", "logs", "config"];
  const isDarkTheme = darkThemePaths.some(path => location.pathname.includes(path));

  const handleConfirmLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        aria-label="Logout"
        className={`
          flex items-center gap-x-2 cursor-pointer 
          rounded py-2  text-2xl text-white 
          bg-gray-600 hover:bg-gray-700 
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500
          transition-all duration-300 ease-in-out 
          ${isOpen ? "w-full justify-start px-3" : "w-[3.2rem] justify-start pl-1"}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-white flex-shrink-0"
        >
          <path d="M10 8v-2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-2" />
          <path d="M15 12h-12l3 -3" />
          <path d="M6 15l-3 -3" />
        </svg>

        {/* Smooth text transition */}
        <span
          className={`
            transition-all duration-300 ease-in-out 
            overflow-hidden whitespace-nowrap 
            ${isOpen ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}
          `}
        >
          Logout
        </span>
      </button>

      {/* Tooltip (only when collapsed) */}
      <Transition
        as={Fragment}
        show={shouldShowTooltip}
        enter="transition-opacity duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute top-1/2 left-full ml-3 transform -translate-y-1/2 rounded bg-gray-700 px-2 py-1 text-base text-white whitespace-nowrap select-none pointer-events-none z-50 shadow-lg">
          Logout
        </div>
      </Transition>

      {/* Confirmation Modal */}
      <ConfirmationModal
        theme={isDarkTheme ? "dark" : "light"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        type="warning"
      />
    </div>
  );
};

export default LogoutButton;
