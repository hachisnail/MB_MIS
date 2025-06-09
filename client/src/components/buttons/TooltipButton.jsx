import { Fragment, useState, useRef, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { createPortal } from "react-dom";

export default function TooltipButton({
  buttonText,
  tooltipText,
  className = "",
  onClick,
  buttonColor = "bg-gray-900",
  hoverColor = "hover:bg-gray-950",
  textColor = "text-white",
  tooltipColor = "bg-gray-800 text-white",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 25, 
        left: rect.left + rect.width / 2,
      });
    }
  }, [isOpen]);

  return (
    <>
      <div
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <button
          ref={buttonRef}
          onClick={(e) => {
            if (onClick) onClick(e);
            setIsOpen(false);
          }}
          className={`px-4 py-2 ${buttonColor} ${hoverColor} ${textColor} text-xl rounded focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer`}
          aria-describedby="tooltip"
        >
          {buttonText}
        </button>
      </div>

      {typeof window !== "undefined" &&
        createPortal(
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
              style={{
                position: "absolute",
                top: coords.top,
                left: coords.left,
                transform: "translateX(-50%)",
                zIndex: 9999,
              }}
              className={`${tooltipColor} text-sm rounded py-1 px-2 whitespace-nowrap pointer-events-none select-none`}
            >
              {tooltipText}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${tooltipColor}`}
              ></div>
            </div>
          </Transition>,
          document.body
        )}
    </>
  );
}
