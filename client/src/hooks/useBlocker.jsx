import { useContext, useEffect } from "react";
import {
  UNSAFE_NavigationContext as NavigationContext
} from "react-router-dom";

export function useBlocker(blocker, when = true) {
  const { navigator } = useContext(NavigationContext);

  useEffect(() => {
    if (!when) return;

    const push = navigator.push;
    const replace = navigator.replace;
    const go = navigator.go;

    navigator.push = (...args) => {
      blocker({
        retry() {
          navigator.push = push;
          navigator.push(...args);
        },
      });
    };
    navigator.replace = (...args) => {
      blocker({
        retry() {
          navigator.replace = replace;
          navigator.replace(...args);
        },
      });
    };
    navigator.go = (...args) => {
      blocker({
        retry() {
          navigator.go = go;
          navigator.go(...args);
        },
      });
    };

    return () => {
      navigator.push = push;
      navigator.replace = replace;
      navigator.go = go;
    };
  }, [navigator, blocker, when]);
}
