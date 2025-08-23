import { format } from "date-fns";

// Status → color map
const statusColorMap = {
  confirmed: "bg-green-500 text-white",
  rejected: "bg-red-600 text-white",
  failed: "bg-orange-600 text-white",
  "to review": "bg-purple-200 text-black",
  completed: "bg-blue-600 text-white",
  default: "bg-gray-200 text-gray-800",
};

// Standardize status → Title Case
export const standardizeStatus = (status) => {
  if (!status) return "To Review";

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Colored badge component
export const getStatusLabel = (status) => {
  const standardized = standardizeStatus(status);
  const colorClass =
    statusColorMap[standardized.toLowerCase()] || statusColorMap.default;

  return (
    <span
      className={`${colorClass} h-9 w-29 py-1 rounded inline-flex items-center justify-center`}
    >
      {standardized}
    </span>
  );
};

// Optional: format date inside status utils if you want
export const formatUpdatedAt = (dateStr) => {
  if (!dateStr) return "N/A";
  const parsed = new Date(dateStr);
  return isNaN(parsed) ? "Invalid Date" : format(parsed, "PPpp");
};
