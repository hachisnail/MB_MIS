import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const iconMap = {
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 mr-2" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="8.01" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 mr-2" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 9v2m0 4v.01" />
      <path d="M10 4h4l7 12a1 1 0 0 1 -.87 1.5h-14.26a1 1 0 0 1 -.87 -1.5z" />
    </svg>
  ),
  danger: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 mr-2" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 9v4" />
      <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
      <path d="M12 16h.01" />
    </svg>
  ),
  question: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 mr-2" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 17v.01" />
      <path d="M12 13a2 2 0 1 0 -2 -2" />
    </svg>
  ),
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  showClose = true,
  type = null,
  theme = "light", 
}) {
  const icon = type && iconMap[type];

  return (
    <Transition show={!!isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Background Overlay */}
        <Transition
          show={isOpen}
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={
              theme === "dark"
                ? "fixed inset-0 bg-black/75"
                : "fixed inset-0 bg-black/25"
            }
            aria-hidden="true"
          />
        </Transition>

        {/* Modal Panel */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Transition
            show={isOpen}
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className={
                theme === "dark"
                  ? "w-full max-w-md transform overflow-hidden rounded-md bg-gray-900 p-6 shadow-lg text-gray-300 transition-all"
                  : "w-full max-w-md transform overflow-hidden rounded-md bg-white p-6 shadow-lg text-gray-900 transition-all"
              }
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  {/* Optionally, you could recolor the icon for dark mode */}
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                    }
                  >
                    {icon}
                  </span>
                  <h2 className="text-xl select-none font-semibold">{title}</h2>
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className={
                      theme === "dark"
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon icon-tabler icon-tabler-x w-7 h-7 cursor-pointer"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div>{children}</div>
            </div>
          </Transition>
        </div>
      </Dialog>
    </Transition>
  );
}
