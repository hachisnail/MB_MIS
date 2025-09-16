import React from "react";

/**
 * ReviewerScheduleControls (no defaults, no helper)
 *
 * Keeps schedule fields EMPTY by default when there’s no existing schedule.
 * Only shows/uses the exact values passed in props.
 *
 * Props:
 * - manilaTodayISO: YYYY-MM-DD string for PH "today"
 * - errors: { uploadPeriodStart?, uploadPeriodEnd? }
 * - uploadPeriodStart, uploadPeriodEnd: YYYY-MM-DD strings or ""
 * - uploadPeriodStartTime, uploadPeriodEndTime: "HH:mm" strings or ""
 * - onStartDate(val), onEndDate(val), onStartTime(val), onEndTime(val)
 * - disabled: boolean (viewer/read-only)
 */
export default function ReviewerScheduleControls({
  manilaTodayISO,
  errors = {},
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
    <div className="flex flex-col gap-4">
      {/* Start row */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1">
          <label htmlFor="uploadPeriodStart" className="font-bold">
            Start Date
          </label>
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
        </div>
        <div className="flex-1">
          <label htmlFor="uploadPeriodStartTime" className="font-bold">
            Start Time
          </label>
          <input
            id="uploadPeriodStartTime"
            type="time"
            className="w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black"
            value={uploadPeriodStartTime}
            onChange={(e) => onStartTime(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* End row */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1">
          <label htmlFor="uploadPeriodEnd" className="font-bold">
            End Date
          </label>
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
        </div>
        <div className="flex-1">
          <label htmlFor="uploadPeriodEndTime" className="font-bold">
            End Time
          </label>
          <input
            id="uploadPeriodEndTime"
            type="time"
            className="w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black"
            value={uploadPeriodEndTime}
            onChange={(e) => onEndTime(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
