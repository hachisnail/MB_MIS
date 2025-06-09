import Modal from "./Modal";

export default function PopupModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Okay",
  type = "info",
  theme = "light",
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type}>
      <p
        className={
          theme === "dark"
            ? "text-sm text-gray-300 mb-6"
            : "text-sm text-gray-600 mb-6"
        }
      >
        {message}
      </p>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className={
            theme === "dark"
              ? "px-4 py-2 bg-gray-800 cursor-pointer text-gray-300 rounded hover:bg-gray-700 transition-colors"
              : "px-4 py-2 bg-gray-600 cursor-pointer text-white rounded hover:bg-gray-700 transition-colors"
          }
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}
