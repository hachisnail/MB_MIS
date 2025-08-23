const LoadingSpinner = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-7 h-7 mx-auto border-2 border-white border-t-transparent animate-spin rounded-full" />
  </div>
);
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
}) => {
  if (isLoading) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorBox message={error} />;
  }

  if (!items || items.length === 0) {
    return <EmptyMessage message={emptyMessage} />;
  }

  return <>{items.map((item, index) => renderItem(item, index))}</>;
};

export default ListRenderer;
