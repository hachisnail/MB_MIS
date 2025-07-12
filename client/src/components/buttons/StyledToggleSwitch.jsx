import { Switch } from "@headlessui/react";

export default function StyledToggleSwitch({
  enabled,
  onChange,
  className = "",
  label = "",
  toggleColor = {
    on: "bg-green-600",
    off: "bg-gray-400",
  },
  knobColor = {
    on: "translate-x-6 bg-white",
    off: "translate-x-1 bg-white",
  },
  labelColor = "text-white",
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && <span className={`text-lg font-medium ${labelColor}`}>{label}</span>}
      <Switch
        checked={enabled}
        onChange={onChange}
        className={`${
          enabled ? toggleColor.on : toggleColor.off
        } relative inline-flex cursor-pointer h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500`}
      >
        <span
          className={`${
            enabled ? knobColor.on : knobColor.off
          } inline-block h-4 w-4 transform rounded-full transition`}
        />
      </Switch>
    </div>
  );
}
