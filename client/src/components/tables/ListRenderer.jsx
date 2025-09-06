import { useState, useMemo, useRef, useEffect } from "react";

const LoadingSpinner = ({ theme = "light" }) => {
  const borderColor = theme === "light" ? "border-gray-400" : "border-white";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div
        className={`w-7 h-7 border-2 ${borderColor} border-t-transparent animate-spin rounded-full`}
      />
    </div>
  );
};

const ErrorBox = ({ message }) => (
  <div className="w-full h-full flex items-center justify-center">
    <pre className="text-red-400 text-xl text-center whitespace-pre-line">
      {message}
    </pre>
  </div>
);

const EmptyMessage = ({ message }) => (
  <div className="w-full h-full flex items-center justify-center py-6">
    <span className="text-[#9C9C9C] text-xl">{message}</span>
  </div>
);

const ListRenderer = ({
  isLoading,
  error,
  items,
  renderItem,
  emptyMessage = "No items found!",
  theme = "light",
  paginate = false,
  itemsPerPage = 50,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef(null);

  const totalPages = Math.ceil((items?.length || 0) / itemsPerPage);

  // Decide which items to show
  const displayedItems = useMemo(() => {
    if (!paginate) return items;
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, paginate, currentPage, itemsPerPage]);

  const hasData = displayedItems && displayedItems.length > 0;

  // Scroll to top when currentPage changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Themed button styles
  const buttonBaseClasses =
    "px-3 py-1 rounded disabled:opacity-50 transition-colors";
  const buttonThemeClasses =
    theme === "light"
      ? "bg-gray-200 text-black hover:bg-gray-300 disabled:bg-gray-100"
      : "bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-900";

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Scrollable container inherits parent height */}
      <div ref={containerRef} className="flex-1 overflow-y-auto relative">
        {/* Error */}
        {error && <ErrorBox message={error} />}

        {/* Data */}
        {hasData && displayedItems.map((item, index) => renderItem(item, index))}

        {/* Empty state */}
        {!hasData && !error && !isLoading && (
          <EmptyMessage message={emptyMessage} />
        )}
      </div>

      {/* Overlay spinner */}
      {isLoading && <LoadingSpinner theme={theme} />}

      {/* Pagination controls */}
      {paginate && totalPages > 1 && (
        <div className={`flex justify-center items-center gap-2 pb-2 pt-2 flex-wrap border-t ${theme === "light" ? "border-gray-300" : "border-gray-700"}`}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`${buttonBaseClasses} ${buttonThemeClasses}`}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`${buttonBaseClasses} ${buttonThemeClasses}`}
          >
            Prev
          </button>
          <span className={theme === "light" ? "text-black" : "text-white"}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`${buttonBaseClasses} ${buttonThemeClasses}`}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`${buttonBaseClasses} ${buttonThemeClasses}`}
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
};

export default ListRenderer;
