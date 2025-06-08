import Modal from "./Modal";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "",
  type = "question", // default type for confirmation
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type}>
      <p className="text-lg text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 cursor-pointer border-1 border-gray-700 hover:text-black bg-gray-100 rounded-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 cursor-pointer bg-gray-600 text-white rounded-sm hover:bg-gray-700"
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
