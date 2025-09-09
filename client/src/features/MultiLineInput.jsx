import { useEffect, useRef, useMemo } from "react";
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
  label_size,

  /** NEW (optional): cap/force via rows */
  minRows,              // defaults to `rows`
  maxRows,              // optional cap by rows

  /** NEW (optional): cap/force via CSS sizes (number=px or CSS string like "240px") */
  minHeight,            // e.g. 120 or "120px"
  maxHeight,            // e.g. 320 or "40vh"

  /** NEW (optional): allow manual resize handle */
  allowManualResize = false,
}) {
  const taRef = useRef(null);

  // ---------- theme ----------
  const themeClasses = useMemo(() => ({
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
  }), [error]);

  const styles = themeClasses[theme] || themeClasses.dark;

  // ---------- helpers ----------
  const toPx = (v, fallback) => {
    if (v == null) return fallback;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const s = v.trim();
      if (s.endsWith("px")) {
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : fallback;
      }
      // simple bare-number case
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : fallback;
    }
    return fallback;
  };

  const measureAndResize = () => {
    if (!autosize) return;
    const ta = taRef.current;
    if (!ta) return;

    // Read computed metrics
    const cs = getComputedStyle(ta);
    let lineHeight = parseFloat(cs.lineHeight);
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
      // Fallback: ~1.2 * font-size
      const fs = parseFloat(cs.fontSize) || 16;
      lineHeight = fs * 1.2;
    }
    const padTop = parseFloat(cs.paddingTop) || 0;
    const padBottom = parseFloat(cs.paddingBottom) || 0;
    const borderTop = parseFloat(cs.borderTopWidth) || 0;
    const borderBottom = parseFloat(cs.borderBottomWidth) || 0;
    const boxExtra = padTop + padBottom + borderTop + borderBottom;

    const _minRows = Math.max(1, Number.isFinite(minRows) ? minRows : rows);
    const minHpx = toPx(minHeight, _minRows * lineHeight + boxExtra);
    const maxHpx = (() => {
      if (maxHeight != null) return toPx(maxHeight, Infinity);
      if (Number.isFinite(maxRows)) return Math.max(minHpx, maxRows * lineHeight + boxExtra);
      return Infinity;
    })();

    // Let it shrink first, then measure
    ta.style.height = "auto";

    // scrollHeight already includes padding but not borders
    const contentH = ta.scrollHeight + borderTop + borderBottom;
    const next = Math.max(minHpx, Math.min(contentH, maxHpx));

    // Apply
    ta.style.minHeight = Number.isFinite(minHpx) ? `${minHpx}px` : "";
    ta.style.maxHeight = Number.isFinite(maxHpx) && maxHpx !== Infinity ? `${maxHpx}px` : "";
    ta.style.overflowY = contentH > maxHpx ? "auto" : "hidden";
    ta.style.height = `${next}px`;
  };

  // Resize on value & constraint changes
  useEffect(() => {
    measureAndResize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, autosize, rows, minRows, maxRows, minHeight, maxHeight]);

  // Resize on width changes (wrapping affects scrollHeight)
  useEffect(() => {
    if (!autosize || typeof ResizeObserver === "undefined") return;
    const ta = taRef.current;
    if (!ta) return;
    const ro = new ResizeObserver(() => measureAndResize());
    ro.observe(ta);
    // observe parent width changes too (optional but helpful)
    ta.parentElement && ro.observe(ta.parentElement);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosize]);

  const onTextChange = (e) => {
    onChange(e.target.value);
  };

  const inputId = useMemo(
    () => id || `multiline-${Math.random().toString(36).slice(2, 9)}`,
    [id]
  );

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block ${label_size ? `text-${label_size}` : "text-sm"} font-medium mb-1 ${styles.label}`}
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
          className={`w-full ${allowManualResize ? "resize-y" : "resize-none"} rounded-lg px-3 py-2 text-lg leading-5 focus:outline-none focus:ring-gray-400 focus:ring-1 focus:ring-offset-0 ${styles.textarea}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          // Let JS control height; no fixed Tailwind height utilities here.
          style={{ overflowY: "hidden" }}
        />

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
