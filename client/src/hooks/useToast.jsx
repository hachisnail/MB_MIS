import { useCallback, useState } from "react";

export default function useToast() {
  const [toastConfig, setToastConfig] = useState({
    message: "",
    type: "success",
  });

  const showToast = useCallback((message, type = "success") => {
    setToastConfig({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig((prevConfig) => ({ ...prevConfig, message: "" }));
  }, []);

  return { toastConfig, showToast, hideToast };
}