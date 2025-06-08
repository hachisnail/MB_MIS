import React, { useState, Fragment } from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import { Transition } from "@headlessui/react";
import ConfirmationModal from "../modals/ConfirmationModal"; // adjust the path if needed

const LogoutButton = ({ isOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shouldShowTooltip = !isOpen && tooltipVisible;

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
        className={`${isOpen ? "w-full" : ""} py-2 bg-gray-600 w-full text-white text-2xl rounded hover:bg-gray-700 cursor-pointer flex gap-x-2 items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500`}
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
          className="stroke-white"
        >
          <path d="M10 8v-2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-2" />
          <path d="M15 12h-12l3 -3" />
          <path d="M6 15l-3 -3" />
        </svg>
        {isOpen && <span>Logout</span>}
      </button>

      {/* Tooltip */}
      <Transition
        as={Fragment}
        show={shouldShowTooltip}
        enter="transition-opacity duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute top-1/2 left-full ml-4 transform -translate-y-1/2 rounded bg-gray-700 px-2 py-1 text-xl text-white whitespace-nowrap select-none pointer-events-none z-50">
          Logout
        </div>
      </Transition>

      {/* Confirmation Modal */}
      <ConfirmationModal
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
