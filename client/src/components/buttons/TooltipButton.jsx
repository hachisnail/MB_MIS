import { Fragment, useState } from "react";
import { Transition } from "@headlessui/react";

export default function TooltipButton({
  buttonText,
  tooltipText,
  className = "",
  onClick,  // accept onClick prop
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        onClick={(e) => {
          if (onClick) onClick(e);
          setIsOpen(false);  // Close tooltip right after click
        }}
        className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-950 focus:outline-none focus:ring-2 cursor-pointer focus:ring-gray-400"
        aria-describedby="tooltip"
      >
        {buttonText}
      </button>

      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div
          id="tooltip"
          role="tooltip"
          className="absolute bottom-full mb-2 left-1/2 z-50 transform -translate-x-1/2
                     bg-gray-800 text-white text-sm rounded py-1 px-2 whitespace-nowrap
                     pointer-events-none select-none"
        >
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      </Transition>
    </div>
  );
}
