import { useEffect } from "react";
import Logo from '../../assets/LOGO.png';

const AdminHeader = ({ onClose, onOpen, isSidebarOpen }) => {
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isSidebarOpen) {
        onClose();
      }
      else if (window.innerWidth > 768) {
        onOpen();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen, onClose]);

  return (
    <header className="select-none relative z-50 w-full h-17 bg-[#1C1B19] drop-shadow-sm">
      <div className="flex w-full h-full items-center px-2   gap-x-2">
        <div className="w-15 h-fit flex justify-center">
            {isSidebarOpen ? (
            <svg
                onClick={onClose}
                className="cursor-pointer stroke-white hover:stroke-gray-400"
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
            ) : (
            <svg
                onClick={onOpen}
                className="cursor-pointer stroke-white hover:stroke-gray-400"
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
            )}
        </div>

        <div className="w-70 h-10 flex gap-x-2 items-center">
            {/* <img src={Logo} className="h-10 w-auto" alt="Museo Bulawan Logo" /> */}
            <div className="w-[1px] h-9 rounded-md bg-white">
            
            </div>
           
                <span className=" text-white text-2xl font-semibold">Museo Bulawan MIS</span>

        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
