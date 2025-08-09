import { Button } from '@headlessui/react';

export default function StyledButton({
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
  buttonColor = "bg-gray-900",
  hoverColor = "hover:bg-gray-950",
  textColor = "text-white",
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded text-xl 
        focus:outline-none focus:ring-2 focus:ring-gray-400
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${buttonColor} ${hoverColor} ${textColor} ${className}
      `}
    >
      {children}
    </Button>
  );
}
