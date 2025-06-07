import React from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";

const LogoutButton = ({ isOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className={`${isOpen ? ('px-4') : ('')}  py-2 bg-gray-600 w-full text-white text-2xl rounded hover:bg-gray-700 cursor-pointer flex gap-x-2 items-center justify-center`}
    >


      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        // stroke="#000000"
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
  );
};

export default LogoutButton;
