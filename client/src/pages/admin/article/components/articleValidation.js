// Returns an errors object: { field: "message" }
export const validateForm = (d) => {
  const errors = {};

  if (!d.title?.trim()) errors.title = "Title is required";
  if (!d.selectedDate) errors.selectedDate = "Date is required";
  if (!d.author?.trim()) errors.author = "Author is required";
  if (!d.category) errors.category = "Category is required";
  if (!d.contentType) errors.content_type = "Type is required";
  if (!d.status) errors.status = "Status is required";
  if (!d.editorHTML || d.editorHTML === "<p></p>") errors.description = "Body content is required";

  if (d.status === "scheduled") {
    if (!d.uploadPeriodStart) errors.uploadPeriodStart = "Start date is required for scheduled.";
    if (!d.uploadPeriodEnd) errors.uploadPeriodEnd = "End date is required for scheduled.";
    if (d.uploadPeriodStart && d.uploadPeriodEnd) {
      const start = new Date(`${d.uploadPeriodStart}T${(d.uploadPeriodStartTime || "00:00").slice(0, 5)}:00+08:00`);
      const end = new Date(`${d.uploadPeriodEnd}T${(d.uploadPeriodEndTime || "23:59").slice(0, 5)}:00+08:00`);
      if (end <= start) errors.uploadPeriodEnd = "End must be after Start.";
    }
  }

  return errors;
};
