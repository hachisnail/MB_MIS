import { useEffect, useRef } from "react";
import { Transition } from "@headlessui/react";

export default function MultiLineInput({
  id,
  label,
  value = "",
  onChange = () => {},
  placeholder = "",
  rows = 3,
  maxLength,
  autosize = true,
  showCount = false,
  error = null,
  className = "",
  theme = "dark",
  label_size
}) {
  const taRef = useRef(null);

  useEffect(() => {
    if (!autosize) return;
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [value, autosize]);

  const onTextChange = (e) => {
    onChange(e.target.value);
  };

  const inputId = id || `multiline-${Math.random().toString(36).slice(2, 9)}`;

  const themeClasses = {
    dark: {
      label: "text-gray-200",
      textarea: `bg-gray-800 border ${error ? "border-red-500" : "border-gray-700"} 
        focus:ring-${error ? "red-500/40" : "indigo-500/40"} placeholder-gray-400 text-white`,
      counter: "text-gray-400",
      errorText: "text-red-400",
    },
    light: {
      label: "text-gray-700",
      textarea: `bg-white border ${error ? "border-red-500" : "border-gray-300"} 
        focus:ring-${error ? "red-500/40" : "indigo-500/40"} placeholder-gray-500 text-gray-900`,
      counter: "text-gray-500",
      errorText: "text-red-600",
    },
  };

  const styles = themeClasses[theme] || themeClasses.dark;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-${label_size} font-medium mb-1 ${styles.label}`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          id={inputId}
          ref={taRef}
          rows={rows}
          value={value}
          onChange={onTextChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full min-h-[3rem] resize-none rounded-lg px-3 py-2 text-lg leading-5 focus:outline-none focus:ring-gray-400 focus:ring-1 focus:ring-offset-0 ${styles.textarea}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />

        {/* character count */}
        {showCount && maxLength && (
          <div className={`absolute right-4 bottom-4 text-xs ${styles.counter}`}>
            {`${value.length}/${maxLength}`}
          </div>
        )}
      </div>

      <Transition
        show={!!error}
        enter="transition-opacity duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <p id={`${inputId}-error`} className={`mt-1 text-sm ${styles.errorText}`}>
          {error}
        </p>
      </Transition>
    </div>
  );
}
