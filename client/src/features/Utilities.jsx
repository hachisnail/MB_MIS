import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { Fragment } from "react";

export function SearchBar({ placeholder = "Search History", onChange, theme }) {
  let outer, inner;
  switch (theme) {
    case "dark":
      outer = "bg-[#191919] border-[#353535]";
      inner = "text-gray-300 placeholder-gray-500";
      break;
    case "light":
      outer = "bg-white border-[#353535]";
      inner = "text-gray-300 placeholder-gray-500";
      break;
    default:
      outer = "bg-white border-[#353535]";
      inner = "text-gray-300 placeholder-gray-500";
      break;
  }

  return (
    <div className="w-full max-w-sm ">
      <div className={`flex items-center ${outer} border rounded-md px-3 py-2`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 14.15z"
          />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          onChange={onChange}
          className={`ml-3 w-full bg-transparent outline-none text-2xl ${inner}`}
        />
      </div>
    </div>
  );
}



export function CardDropdownPicker({
  options = [],
  onChange,
  value = "",
  placeholder = "Select an option",
  theme = "light",
}) {
  const selected = options.find((opt) => opt.value === value);

  let outer, inner, optionStyle;
  switch (theme) {
    case "dark":
      outer = "bg-[#191919] border-[#353535]";
      inner = "text-gray-300 placeholder-gray-500 bg-[#191919]";
      optionStyle = "text-gray-300 hover:bg-[#2c2c2c]";
      break;
    case "light":
      outer = "bg-white border-[#353535]";
      inner = "text-gray-700 placeholder-gray-400 bg-white";
      optionStyle = "text-gray-700 hover:bg-gray-200";
      break;
    default:
      outer = "bg-white border-[#353535]";
      inner = "text-gray-700 placeholder-gray-400 bg-white";
      optionStyle = "text-gray-700 hover:bg-gray-200";
      break;
  }

  return (
    <div className="w-full max-w-sm">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton
            className={`w-full cursor-pointer text-left px-3 py-2 border rounded-md ${outer} ${inner} flex items-center justify-between text-2xl`}
          >
            <span>{selected?.label || placeholder}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </ListboxButton>

          <ListboxOptions
            className={`absolute mt-1 z-10 w-full max-h-60 overflow-auto rounded-md shadow-lg border ${outer}`}
          >
            {options.map((opt) => (
              <ListboxOption key={opt.value} value={opt.value} as={Fragment}>
                {({ active, selected }) => (
                  <li
                    className={`cursor-pointer px-4 py-2 text-lg ${
                      active ? "bg-blue-500 text-white" : optionStyle
                    }`}
                  >
                    {opt.label}
                  </li>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}
