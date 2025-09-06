import { useCallback, useState, useEffect } from "react";
import { useBlocker } from "@/hooks/useBlocker";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

export default function usePrompt(message, when, theme = "dark") {
  const [showModal, setShowModal] = useState(false);
  const [retryNavigation, setRetryNavigation] = useState(null);

  // Existing in-app navigation blocker
  const blocker = useCallback(
    (tx) => {
      setShowModal(true);
      setRetryNavigation(() => () => tx.retry());
    },
    []
  );

  useBlocker(blocker, when);

  // Minimal addition: handle browser back/forward
  useEffect(() => {
    if (!when) return;

    // Push a dummy state so we can intercept Back/Forward
    window.history.pushState({ prompt: true }, "");

    const handlePopState = () => {
      if (!when) return;

      // Show modal
      setShowModal(true);

      setRetryNavigation(() => {
        // If confirmed, move back/forward as intended
        window.history.go(1);
      });

      // Push state back so user stays on current page
      window.history.pushState({ prompt: true }, "");
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [when]);

  // Optional: handle full page refresh / tab close
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [when, message]);

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
