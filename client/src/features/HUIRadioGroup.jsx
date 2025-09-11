// HUIRadioGroup.jsx (Headless UI v2)
import React, { useState } from "react";
import { RadioGroup, Radio, Field, Label, Description } from "@headlessui/react";

function cx(...cls) { return cls.filter(Boolean).join(" "); }

/**
 * Props:
 * - name?: string            // v2 auto-renders a hidden input when provided
 * - label?: string
 * - options: [{ value, label, description?, disabled? }]
 * - value?: string           // controlled
 * - defaultValue?: string    // uncontrolled
 * - onChange?: (v) => void
 * - orientation?: 'vertical' | 'horizontal'
 * - className?: string
 * - required?: boolean
 */
export default function HUIRadioGroup({
  name,
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  orientation = "vertical",
  className = "",
  required = false,
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(
    defaultValue ?? (options[0] ? options[0].value : "")
  );
  const current = isControlled ? value : internal;

  const setValue = (v) => {
    if (!isControlled) setInternal(v);
    onChange && onChange(v);
  };

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 text-sm font-medium text-neutral-700">
          {label} {required && <span className="text-red-600">*</span>}
        </div>
      )}

      <RadioGroup
        name={name}
        value={current}
        onChange={setValue}
        aria-label={label || name || "Options"}
        className={orientation === "horizontal" ? "flex gap-3" : "space-y-2"}
      >
        {options.map((opt) => (
          <Field
            key={opt.value}
            disabled={opt.disabled}
            className="flex items-start gap-2 border mb-2 p-1 rounded-md bg-gray-400"
          >
            {/* Circle radio using data-* attributes */}
            <Radio
              value={opt.value}
              className={cx(
                "group  border flex h-7 w-7 items-center justify-center rounded-sm  bg-white",
                "data-checked:border-blue-600 data-checked:bg-blue-600",
                "data-disabled:bg-gray-100 data-disabled:border-gray-300"
              )}
            >
              <span className="invisible h-4 w-4 rounded-sm bg-white group-data-checked:visible" />
            </Radio>

            <div className="flex-1">
              <Label className="font-medium leading-6 data-disabled:opacity-60">
                {opt.label}
              </Label>
              {opt.description && (
                <Description className="text-sm text-neutral-500">
                  {opt.description}
                </Description>
              )}
            </div>
          </Field>
        ))}
      </RadioGroup>
    </div>
  );
}
