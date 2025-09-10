import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MultiLineInputField
 * - Tailwind styled
 * - Auto-resize
 * - Hard or soft *character* limit
 * - Works controlled (value/onChange) or uncontrolled (defaultValue)
 */
export default function MultiLineInputField({
  label,
  placeholder = "Type your text…",
  maxChars = 280,        // << character limit (not words)
  mode = "hard",         // "hard" | "soft"
  value,                 // if provided => controlled
  defaultValue = "",
  onChange,
  id,
  name,
  helperText,
  disabled = false,
  readOnly = false,
  className = "",
  autoResize = true,
  minRows = 3,
  heightClass = "h-90"
}) {
  const isControlled = value != null;
  const [text, setText] = useState(defaultValue);
  const val = isControlled ? value : text;
  const taRef = useRef(null);

  // Count characters by Unicode code points (handles most emojis correctly)
  const toCodePoints = (s) => Array.from(s || "");
  const charCount = useMemo(() => toCodePoints(val).length, [val]);

  const over = maxChars ? Math.max(0, charCount - maxChars) : 0;
  const isOver = over > 0;

  // Auto-resize on input/value changes
  useEffect(() => {
    if (!autoResize || !taRef.current) return;
    const el = taRef.current;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [val, autoResize]);

  const rows = Math.max(1, minRows);

  const applyHardLimit = (raw) => {
    if (!maxChars) return raw;
    const cps = toCodePoints(raw);
    if (cps.length <= maxChars) return raw;
    return cps.slice(0, maxChars).join("");
  };

  const handleChange = (e) => {
    const incoming = e.target.value;
    const next = mode === "hard" && maxChars ? applyHardLimit(incoming) : incoming;

    if (!isControlled) setText(next);
    onChange && onChange(next);
  };

const baseField =
  "w-full rounded-xl border px-3 py-2 text-base leading-relaxed shadow-sm " +
  "bg-white placeholder:text-neutral-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
  "border-neutral-300 disabled:opacity-60 disabled:cursor-not-allowed " +
  "read-only:bg-neutral-50";

  const warnRing =
    mode === "soft" && isOver
      ? " ring-2 ring-red-400 border-red-400 focus:ring-red-500 focus:border-red-500"
      : "";

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-neutral-800"
        >
          {label}
        </label>
      )}

        <textarea
        id={id}
        name={name}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        rows={minRows}
        className={
            baseField +
            warnRing +
            " resize-none overflow-y-auto " +
            heightClass // fixed height, scrollable
        }
        value={val}
        onChange={handleChange}
        />


      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-neutral-500 text-xl font-semibold">
          {helperText ?? `Max ${maxChars} characters.`}
        </span>
        {maxChars ? (
          <span
            className={
              "tabular-nums text-md font-semibold" +
              (mode === "soft" && isOver ? "text-red-600 font-medium" : "text-neutral-500")
            }
            title={
              isOver && mode === "soft"
                ? `Over the limit by ${over} character${over !== 1 ? "s" : ""}`
                : undefined
            }
          >
            {charCount} / {maxChars}
          </span>
        ) : null}
      </div>
    </div>
  );
}
