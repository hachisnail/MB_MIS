import { useState } from "react";
import StyledButton from "../components/buttons/StyledButton";

/**
 * @param {Array} options - Array of { value, label, activeStyle?, inactiveStyle? }
 * Example:
 * [
 *   { value: "arrive", label: "Arrive", activeStyle: "bg-green-600 hover:bg-green-700 text-white" },
 *   { value: "cancel", label: "Cancel", activeStyle: "bg-red-600 hover:bg-red-700 text-white" },
 *   { value: "maybe", label: "Maybe", activeStyle: "bg-yellow-500 hover:bg-yellow-600 text-white" }
 * ]
 */
const ButtonSelector = ({ 
  options = [
    { value: "arrive", label: "Arrive", activeStyle: "bg-green-600 hover:bg-green-700 text-white" },
    { value: "cancel", label: "Cancel", activeStyle: "bg-red-600 hover:bg-red-700 text-white" }
  ], 
  onChange 
}) => {
  const [active, setActive] = useState(null);

  const handleClick = (value) => {
    setActive(value);
    onChange?.(value);
  };

  return (
    <div className="w-fit h-fit flex gap-x-5">
      {options.map((opt) => {
        const isActive = active === opt.value;

        // Use custom style if provided, otherwise fallback
        const activeStyle =
          opt.activeStyle || "bg-blue-600 hover:bg-blue-700 text-white";
        const inactiveStyle =
          opt.inactiveStyle || "bg-gray-200 hover:bg-gray-300 text-gray-800";

        return (
          <StyledButton
            key={opt.value}
            className={`px-10 py-3 text-lg ${isActive ? activeStyle : inactiveStyle}`}
            onClick={() => handleClick(opt.value)}
          >
            {opt.label}
          </StyledButton>
        );
      })}
    </div>
  );
};

export default ButtonSelector;
