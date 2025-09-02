export function formatDateRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Duration calculation
  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let duration;
  if (diffDays < 30) {
    duration = `${diffDays + 1} day${diffDays > 0 ? "s" : ""}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    duration = `${months} month${months > 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(diffDays / 365);
    duration = `${years} year${years > 1 ? "s" : ""}`;
  }

  // Format dates nicely
  const options = { year: "numeric", month: "long", day: "numeric" };
  const startFormatted = start.toLocaleDateString("en-US", options);
  const endFormatted = end.toLocaleDateString("en-US", options);

  return `${duration}, ${startFormatted} - ${endFormatted}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}