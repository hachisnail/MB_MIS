import Modal from "./Modal";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "",
  type = "question",
  theme = "light", // users can set this when using <ConfirmationModal />
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} theme={theme}>
      <p
        className={
          theme === "dark"
            ? "text-lg text-gray-300 mb-6"
            : "text-lg text-gray-900 mb-6"
        }
      >
        {message}
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className={
            theme === "dark"
              ? "px-4 py-2 text-gray-300 cursor-pointer border border-gray-300 hover:text-white bg-gray-800 rounded-sm transition-colors"
              : "px-4 py-2 text-gray-700 cursor-pointer border border-gray-700 hover:text-black bg-gray-100 rounded-sm transition-colors"
          }
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={
            theme === "dark"
              ? "px-4 py-2 cursor-pointer bg-blue-700 text-white rounded-sm hover:bg-blue-800 transition-colors"
              : "px-4 py-2 cursor-pointer bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition-colors"
          }
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
