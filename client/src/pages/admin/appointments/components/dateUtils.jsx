import { format, parse, parseISO, isValid } from "date-fns";

export const convertTo12Hour = (timeStr) => {
  if (!timeStr) return "";
  const parsed = parse(timeStr, "HH:mm", new Date());
  return isValid(parsed) ? format(parsed, "h:mm a") : "";
};

export const formatTimeDisplay = (start_time, end_time) => {
  // If both times are missing, return default
  if (!start_time && !end_time) return "Flexible";

  // If only one time is missing, still return default to avoid showing just a dash
  if (!start_time || !end_time) return "Flexible";

  // Convert both times
  const startConverted = convertTo12Hour(start_time);
  const endConverted = convertTo12Hour(end_time);

  // If conversion failed for either time, return default
  if (!startConverted || !endConverted) return "Flexible";

  return `${startConverted} - ${endConverted}`;
};

export const formatDate = (dateStr, pattern = "MM-dd-yyyy") => {
  if (!dateStr) return "N/A";
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? format(parsed, pattern) : "Invalid Date";
};
