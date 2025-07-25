import React from 'react';


const ConfirmDialog = ({
  visible = false,
  title = "Confirm",
  message = "Are you sure?",
  onConfirm,
  onCancel
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="border border-gray-400 px-4 py-2 rounded hover:bg-gray-100"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Yes
          </button>
        </div>
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 font-bold text-xl text-gray-600 hover:text-black"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ConfirmDialog;
