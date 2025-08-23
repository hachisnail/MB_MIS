import { format, parse, parseISO, isValid } from "date-fns";

export const convertTo12Hour = (timeStr) => {
  if (!timeStr) return "";
  const parsed = parse(timeStr, "HH:mm", new Date());
  return isValid(parsed) ? format(parsed, "h:mm a") : "";
};

export const formatTimeDisplay = (start_time, end_time) => {
  if (!start_time || !end_time) return "Flexible";
  return `${convertTo12Hour(start_time)} - ${convertTo12Hour(end_time)}`;
};

export const formatDate = (dateStr, pattern = "MM-dd-yyyy") => {
  if (!dateStr) return "N/A";
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? format(parsed, pattern) : "Invalid Date";
};
