import { useState, useEffect } from "react";
import Modal from "@/components/modals/Modal";

export default function CountdownConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "",
    type = "question",
    theme = "light",
    countdown = 5, // default 5 seconds
}) {
    const [timeLeft, setTimeLeft] = useState(countdown);
    const [canConfirm, setCanConfirm] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setTimeLeft(countdown);
            setCanConfirm(false);
            return;
        }

        if (timeLeft <= 0) {
            setCanConfirm(true);
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [isOpen, timeLeft, countdown]);

    const handleConfirm = () => {
        if (canConfirm) {
            onConfirm();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} theme={theme}>
            <div
                className={
                    theme === "dark"
                        ? "text-lg text-gray-300 mb-6"
                        : "text-lg text-gray-900 mb-6"
                }
            >
                {message}
            </div>

            {!canConfirm && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-yellow-800 font-semibold">
                        Please wait {timeLeft} second{timeLeft !== 1 ? 's' : ''} before confirming...
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-yellow-400 h-2.5 rounded-full transition-all duration-1000"
                            style={{ width: `${((countdown - timeLeft) / countdown) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {canConfirm && (
                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
                    <p className="text-green-800 font-semibold">
                        ✓ You can now confirm this action
                    </p>
                </div>
            )}

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
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className={
                        !canConfirm
                            ? "px-4 py-2 cursor-not-allowed bg-gray-400 text-white rounded-sm opacity-60"
                            : theme === "dark"
                                ? "px-4 py-2 cursor-pointer bg-red-700 text-white rounded-sm hover:bg-red-800 transition-colors"
                                : "px-4 py-2 cursor-pointer bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors"
                    }
                >
                    Confirm Rejection
                </button>
            </div>
        </Modal>
    );
}

