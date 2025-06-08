import Modal from "./Modal";

export default function PopupModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Okay",
  type = "info", // default type for popup
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type}>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 cursor-pointer text-white rounded hover:bg-gray-700"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}
