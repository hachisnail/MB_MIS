import { NavLink } from "react-router-dom";
import Logo from "../assets/LOGO.png";

const MaintenanceMode = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <div className="w-fit h-fit flex flex-col items-center gap-y-10 px-10 pt-10 pb-24 rounded-xl shadow-2xl">
        <div className="flex gap-x-2 items-center">
          <img src={Logo} className="w-20" alt="Museo Bulawan Logo" />
          <i className="w-1 h-16 rounded-4xl bg-gray-600"></i>
          <div className="flex flex-col justify-center">
            <span className="text-4xl font-bold">Museo Bulawan</span>
            <span className="text-lg text-gray-600 font-semibold leading-3">
              Management Information System
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="w-fit text-4xl font-semibold text-red-600">
            Maintenance Mode Active
          </span>
          <span className="w-fit text-xl text-gray-500 mt-2">
            The system is currently undergoing maintenance.<br />
            Please check back later or contact an administrator.
          </span>
        </div>

        <NavLink
          to="/login"
          className="px-6 py-3 bg-gray-800 text-white font-semibold rounded hover:bg-gray-700 transition-colors"
        >
          Go to Login
        </NavLink>
      </div>
    </div>
  );
};

export default MaintenanceMode;
