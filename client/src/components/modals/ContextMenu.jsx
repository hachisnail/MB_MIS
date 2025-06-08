import React, { useState, useEffect, useRef } from "react";
import { Transition } from "@headlessui/react";

const MENU_WIDTH = 160;
const MENU_ITEM_HEIGHT = 36;

// Simple unique ID generator (not cryptographically safe, but enough)
const generateId = () => Math.random().toString(36).substr(2, 9);

export const ContextMenu = ({ children, menuItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const idRef = useRef(generateId());

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const onOtherMenuOpen = (e) => {
      const openedMenuId = e.detail;
      if (openedMenuId !== idRef.current) {
        closeMenu();
      }
    };

    window.addEventListener("contextMenuOpen", onOtherMenuOpen);

    return () => {
      window.removeEventListener("contextMenuOpen", onOtherMenuOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("click", closeMenu);
      window.addEventListener("scroll", closeMenu);
      window.addEventListener("resize", closeMenu);
    }
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu);
      window.removeEventListener("resize", closeMenu);
    };
  }, [isOpen]);

  const onContextMenu = (event) => {
    event.preventDefault();
    const clickX = event.clientX;
    const clickY = event.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const menuHeight = menuItems.length * MENU_ITEM_HEIGHT;

    let x = clickX;
    let y = clickY;

    if (clickX + MENU_WIDTH > screenW) {
      x = screenW - MENU_WIDTH - 10;
    }
    if (clickY + menuHeight > screenH) {
      y = screenH - menuHeight - 10;
    }

    setPosition({ x, y });
    setIsOpen(true);

    // Notify others that this menu is open, sending its unique id
    window.dispatchEvent(
      new CustomEvent("contextMenuOpen", { detail: idRef.current })
    );
  };

  return (
    <div onContextMenu={onContextMenu} style={{ display: "inline-block" }}>
      {children}

      <Transition
        show={isOpen}
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          className="fixed z-50 bg-white rounded-sm shadow-lg ring-1 ring-black ring-opacity-5"
          style={{
            top: `${position.y}px`,
            left: `${position.x}px`,
            width: MENU_WIDTH,
          }}
        >
          {menuItems.map(({ label, onClick, disabled }, index) => (
            <button
              key={index}
              onClick={() => {
                if (!disabled) {
                  onClick?.();
                  setIsOpen(false);
                }
              }}
              disabled={disabled}
              className={`w-full text-left px-4 py-2 text-sm cursor-pointer ${
                disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-800 hover:bg-gray-600 hover:text-white"
              }`}
              style={{ height: MENU_ITEM_HEIGHT }}
            >
              {label}
            </button>
          ))}
        </div>
      </Transition>
    </div>
  );
};

export default ContextMenu;
