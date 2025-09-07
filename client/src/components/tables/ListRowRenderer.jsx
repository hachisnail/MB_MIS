import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ListRowRenderer = ({
  cameFrom,
  item,
  columns = [],
  headers = [],
  details = [],
  onRowClick,
  rowClassName = "",
  hoverEffect = true,
  rowKey, // pass a unique key for the row
  theme = "light", // default light theme
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // Theme-dependent border color
  const borderColor = theme === "light" ? "border-gray-400" : "border-[#373737]";

  // Generate grid template from headers
  const gridCols = headers
    .map(({ width }) => {
      if (typeof width === "number") return `${width}rem`;
      if (width === "auto") return "auto";
      if (width === "1fr") return "1fr";
      return width || "1fr";
    })
    .join(" ");

  const handleRowClick = () => {
    if (details.length > 0) {
      setIsExpanded((prev) => !prev);
    } else if (onRowClick) {
      if (typeof onRowClick === "string") {
        navigate(onRowClick, { state: { cameFrom } });
      } else if (typeof onRowClick === "function") {
        onRowClick(item);
      }
    }
  };

  return (
    <>
      <div
        key={rowKey || item?.id || Math.random()}
        className={`flex flex-col border-b ${borderColor}`}
      >
        {/* Main Row */}
        <div
          className={`grid text-xl ${
            hoverEffect ? "cursor-pointer hover:bg-gray-200" : ""
          } ${rowClassName}`}
          style={{ gridTemplateColumns: gridCols }}
          onClick={handleRowClick}
        >
          {columns.map(({ key, render, className }) => (
            <div
              key={key}
              className={`px-4 h-13 items-center flex truncate ${className || ""}`}
            >
              {render ? render(item[key], item) : item[key]}
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && details.length > 0 && (
        <div className="flex flex-col items-end">
          <div className="w-5 h-5 rotate-45 relative right-10 top-3 z-0 bg-gray-400" />
          <div className="mb-4 mr-1 rounded-lg overflow-hidden shadow-sm shadow-black w-full max-w-3xl">
            <div className="max-h-[10rem] overflow-y-auto">
              <table className="w-full border-collapse bg-white">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className={`border-b ${borderColor}`}>
                    {Object.keys(details[0]).map((key) => (
                      <th
                        key={key}
                        className="text-center py-3 px-4 font-semibold text-gray-700"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail) => (
                    <tr key={detail.key || Math.random()} className={`border-b ${borderColor}`}>
                      {Object.values(detail).map((val, idx) => (
                        <td
                          key={idx}
                          className="py-3 px-4 text-gray-800 text-center"
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isExpanded && details.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No details available
        </div>
      )}
    </>
  );
};

export default ListRowRenderer;
