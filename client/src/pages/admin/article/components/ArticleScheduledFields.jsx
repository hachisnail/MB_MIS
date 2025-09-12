import React from "react";

export default function ArticleScheduledFields({
  errors,
  manilaTodayISO,
  uploadPeriodStart,
  uploadPeriodEnd,
  uploadPeriodStartTime,
  uploadPeriodEndTime,
  onStartDate,
  onEndDate,
  onStartTime,
  onEndTime,
  disabled = false,
}) {
  return (
    <>
      <div className="flex-1">
        <label htmlFor="uploadPeriodStart" className="font-bold">Start Date</label>
        <div className="flex gap-2">
          <input
            id="uploadPeriodStart"
            type="date"
            className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
              errors.uploadPeriodStart ? "border-red-600" : "border-black"
            }`}
            value={uploadPeriodStart}
            onChange={(e) => onStartDate(e.target.value)}
            min={manilaTodayISO}
            aria-invalid={!!errors.uploadPeriodStart}
            title={errors.uploadPeriodStart || ""}
            disabled={disabled}
          />
          <input
            id="uploadPeriodStartTime"
            type="time"
            className="w-32 px-2 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black"
            value={uploadPeriodStartTime}
            onChange={(e) => onStartTime(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex-1">
        <label htmlFor="uploadPeriodEnd" className="font-bold">End Date</label>
        <div className="flex gap-2">
          <input
            id="uploadPeriodEnd"
            type="date"
            className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
              errors.uploadPeriodEnd ? "border-red-600" : "border-black"
            }`}
            value={uploadPeriodEnd}
            onChange={(e) => onEndDate(e.target.value)}
            min={uploadPeriodStart || manilaTodayISO}
            aria-invalid={!!errors.uploadPeriodEnd}
            title={errors.uploadPeriodEnd || ""}
            disabled={disabled}
          />
          <input
            id="uploadPeriodEndTime"
            type="time"
            className="w-32 px-2 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black"
            value={uploadPeriodEndTime}
            onChange={(e) => onEndTime(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
}
