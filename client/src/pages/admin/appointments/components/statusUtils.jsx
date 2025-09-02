import { format } from "date-fns";

// Normalize status to uppercase backend format
export const normalizeStatus = (status) => {
  if (!status) return "PENDING";
  return status.toString().toUpperCase();
};

// Status → color map (using uppercase keys to match backend)
const statusColorMap = {
  APPROVED: "bg-green-500 text-white",
  REJECTED: "bg-red-600 text-white",
  FAILED: "bg-orange-600 text-white",
  PENDING: "bg-purple-200 text-black",
  COMPLETED: "bg-blue-600 text-white",
  default: "bg-gray-200 text-gray-800",
};

// Standardize status → Title Case for display
export const standardizeStatus = (status) => {
  if (!status) return "Pending";

  // First normalize to uppercase, then convert to title case for display
  const normalized = normalizeStatus(status);
  return normalized
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Colored badge component
export const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  const standardized = standardizeStatus(status);
  const colorClass = statusColorMap[normalized] || statusColorMap.default;

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
