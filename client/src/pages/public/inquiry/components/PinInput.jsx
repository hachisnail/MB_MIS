import { useState, useRef, useEffect } from "react";

export default function PinInput({ length = 6, onComplete, className = "" }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputsRef = useRef([]);

  const handleChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newValues = [...values];
      newValues[index] = value;
      setValues(newValues);

      // Move to next input
      if (value && index < length - 1) {
        inputsRef.current[index + 1].focus();
      }

      // Call onComplete when filled
      if (newValues.every((v) => v !== "")) {
        onComplete && onComplete(newValues.join(""));
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  // 🔑 Listen for number keys globally
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key >= "0" && e.key <= "9") {
        const nextIndex = values.findIndex((v) => v === "");
        if (nextIndex !== -1) {
          handleChange(e.key, nextIndex);
          inputsRef.current[nextIndex].focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [values]); // re-run when values change

  return (
    <div className={`flex gap-3 ${className}`}>
      {values.map((val, idx) => (
        <input
          key={idx}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(e.target.value, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          ref={(el) => (inputsRef.current[idx] = el)}
          className="w-12 h-12 text-center text-xl border-2 shadow-md shadow-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ))}
    </div>
  );
}
