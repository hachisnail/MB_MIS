import { Fragment, useEffect } from "react";
import { Transition } from "@headlessui/react";

const Toast = ({ type = "info", message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-600 text-white",
  };

  return (
    <Transition
      appear
      show={!!message}
      as={Fragment}
      enter="transform transition ease-out duration-300"
      enterFrom="translate-y-2 opacity-0 scale-95"
      enterTo="translate-y-0 opacity-100 scale-100"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <div className={`fixed top-20 right-5 z-50 shadow-lg rounded-md px-4 py-3 w-fit min-w-[16rem] ${typeStyles[type]}`}>
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">{message}</p>
          <button
            onClick={onClose}
            className="ml-3 text-lg font-bold focus:outline-none"
          >
            ×
          </button>
        </div>
      </div>
    </Transition>
  );
};

export default Toast;
