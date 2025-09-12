import React from "react";
import { Categories, municipalitiesWithBarangays } from "./articleConstants";

export default function ArticleDetailsForm({
  errors,
  values,
  onChange,
  statusOptions,
  statusLabels,
}) {
  const {
    title,
    selectedDate,
    author,
    category,
    contentType,
    municipality,
    barangay,
    status,
  } = values;

  return (
    <div className="p-4 space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="title" className={`font-bold ${errors.title ? "text-red-600" : ""}`}>
            Title {errors.title && "*"}
          </label>
          <input
            id="title"
            className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
              errors.title ? "border-red-600" : "border-black"
            }`}
            type="text"
            value={title}
            onChange={(e) => onChange.title(e.target.value)}
            placeholder={`Title${errors.title ? " *" : ""}`}
          />
        </div>
      </div>

      {/* Date, Author */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="selectedDate" className={`font-bold ${errors.selectedDate ? "text-red-600" : ""}`}>
            Date {errors.selectedDate && "*"}
          </label>
          <input
            id="selectedDate"
            className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
              errors.selectedDate ? "border-red-600" : "border-black"
            }`}
            type="date"
            value={selectedDate}
            onChange={(e) => onChange.selectedDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="author" className={`font-bold ${errors.author ? "text-red-600" : ""}`}>
            Author {errors.author && "*"}
          </label>
          <input
            id="author"
            className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
              errors.author ? "border-red-600" : "border-black"
            }`}
            type="text"
            value={author}
            onChange={(e) => onChange.author(e.target.value)}
            placeholder={`Author${errors.author ? " *" : ""}`}
          />
        </div>
      </div>

      {/* Category + Type */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="category" className={`font-bold ${errors.category ? "text-red-600" : ""}`}>
            Category {errors.category && "*"}
          </label>
          <select
            id="category"
            className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
              errors.category ? "border-red-600" : "border-black"
            }`}
            value={category}
            onChange={(e) => onChange.category(e.target.value)}
          >
            <option value="" disabled={category !== ""}>
              {`Category${errors.category ? " *" : ""}`}
            </option>
            {Categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="contentType" className={`font-bold ${errors.content_type ? "text-red-600" : ""}`}>
            Type {errors.content_type && "*"}
          </label>
          <select
            id="contentType"
            className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
              errors.content_type ? "border-red-600" : "border-black"
            }`}
            value={contentType}
            onChange={(e) => onChange.contentType(e.target.value)}
          >
            <option value="" disabled={contentType !== ""}>Type</option>
            <option value="article">Article</option>
            <option value="event">Event</option>
          </select>
        </div>
      </div>

      {/* Municipality/Barangay when Event */}
      {contentType === "event" && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="municipality" className={`font-bold ${errors.municipality ? "text-red-600" : ""}`}>
              Municipality
            </label>
            <select
              id="municipality"
              className={`w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 ${
                errors.municipality ? "border-red-600" : "border-black"
              }`}
              value={municipality}
              onChange={(e) => onChange.municipality(e.target.value)}
            >
              <option value="" disabled={municipality !== ""}>Municipality</option>
              {Object.keys(municipalitiesWithBarangays).map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="barangay" className="font-bold">Barangay</label>
            <select
              id="barangay"
              className="w-full px-4 py-3 border-2 rounded-2xl text-base md:text-lg outline-none focus:ring-0 border-black disabled:bg-gray-100 disabled:text-gray-500"
              value={barangay}
              onChange={(e) => onChange.barangay(e.target.value)}
              disabled={!municipality || (municipalitiesWithBarangays[municipality]?.length ?? 0) === 0}
            >
              <option value="" disabled>
                {municipality ? "Select Barangay" : "Select Municipality first"}
              </option>
              {(municipalitiesWithBarangays[municipality] || [])
                .slice()
                .sort((a, b) => a.localeCompare(b))
                .map((bgy) => (
                  <option key={bgy} value={bgy}>{bgy}</option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex-1">
        <label htmlFor="status" className="font-bold">Status</label>
        <select
          id="status"
          className="w-full px-4 py-3 border-2 border-black rounded-2xl text-base md:text-lg outline-none"
          value={status}
          onChange={(e) => onChange.status(e.target.value)}
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {statusLabels?.[s.value] ?? s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
