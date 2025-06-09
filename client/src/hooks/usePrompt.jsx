// hooks/usePrompt.jsx
import { useCallback, useState } from "react";
import { useBlocker } from "./useBlocker";
import ConfirmationModal from "../components/modals/ConfirmationModal";
export default function usePrompt(message, when, theme = "dark") {
  const [showModal, setShowModal] = useState(false);
  const [retryNavigation, setRetryNavigation] = useState(null);

  const blocker = useCallback(
    (tx) => {
      setShowModal(true);
      setRetryNavigation(() => () => tx.retry());
    },
    []
  );

  useBlocker(blocker, when);

  const cancelNavigation = () => {
    setShowModal(false);
    setRetryNavigation(null);
  };

  const confirmNavigation = () => {
    setShowModal(false);
    if (retryNavigation) retryNavigation();
  };

  const PromptModal = (
    <ConfirmationModal
      isOpen={showModal}
      onClose={cancelNavigation}
      onConfirm={confirmNavigation}
      title="Unsaved Changes"
      message={message}
      type="question"
      theme={theme} 
    />
  );

  return { PromptModal };
}
