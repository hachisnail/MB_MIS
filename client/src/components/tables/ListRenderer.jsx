const LoadingSpinner = ({ theme = "light" }) => {
  const borderColor = theme === "light" ? "border-gray-400" : "border-white";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center ">
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
}) => {
  const hasData = items && items.length > 0;

  return (
    <div className="relative h-full w-full">
      {/* Error */}
      {error && <ErrorBox message={error} />}

      {/* Data */}
      {hasData && items.map((item, index) => renderItem(item, index))}

      {/* Empty state */}
      {!hasData && !error && !isLoading && <EmptyMessage message={emptyMessage} />}

      {/* Overlay spinner */}
      {isLoading && <LoadingSpinner theme={theme} />}
    </div>
  );
};

export default ListRenderer;
