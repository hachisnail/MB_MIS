import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useState } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function TimelineDatePicker({
  onDateChange,
  defaultValue = "",
  theme = "light",
}) {
  const [selected, setSelected] = useState(
    defaultValue ? new Date(defaultValue) : undefined
  );

  const handleSelect = (date, close) => {
    setSelected(date);
    onDateChange?.(date ? format(date, "yyyy-MM-dd") : "");
    close();
  };

  const clearDate = () => {
    setSelected(undefined);
    onDateChange?.("");
  };

  const isDark = theme === "dark";
  const buttonStyle = isDark
    ? "bg-[#191919] border-[#353535] border hover:bg-gray-700"
    : "bg-white border-[#353535] border hover:bg-gray-200";
  const textStyle = isDark ? "text-white" : "text-black";

  return (
    <Popover className="relative inline-block">
      {({ open, close }) => (
        <>
          {/* Single button that changes icon depending on date selection */}
          {!selected ? (
            <PopoverButton
              className={`p-2 rounded cursor-pointer ${buttonStyle}`}
              title="Pick a date"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-8 h-8 ${textStyle}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.5 21h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v5" />
                <path d="M16 3v4" />
                <path d="M8 3v4" />
                <path d="M4 11h16" />
                <path d="M16 19h6" />
                <path d="M19 16v6" />
              </svg>
            </PopoverButton>
          ) : (
            <button
              className={`p-2 rounded cursor-pointer ${buttonStyle}`}
              onClick={clearDate}
              title="Clear selected date"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-8 h-8 ${textStyle}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 21h-7a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6.5" />
                <path d="M16 3v4" />
                <path d="M8 3v4" />
                <path d="M4 11h16" />
                <path d="M22 22l-5 -5" />
                <path d="M17 22l5 -5" />
              </svg>
            </button>
          )}

          <PopoverPanel
            className={`absolute z-10 mt-2 shadow-lg rounded bg-white dark:bg-[#191919] border ${
              isDark ? "border-[#353535]" : "border-gray-300"
            }`}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(date) => handleSelect(date, close)}
              className="p-3"
            />
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
