import { useEffect, useRef } from "react";
import { track, flush } from "../services/engagementTracker";

export default function useEngagement({ articleId, containerRef = null }) {
  const activeMsRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());
  const tickIdRef = useRef(null);

  // user activity events (for time tracking)
  useEffect(() => {
    const bump = () => (lastActivityRef.current = Date.now());
    window.addEventListener("mousemove", bump, { passive: true });
    window.addEventListener("keydown", bump, { passive: true });
    window.addEventListener("scroll", bump, { passive: true });
    window.addEventListener("click", bump, { passive: true });
    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("scroll", bump);
      window.removeEventListener("click", bump);
    };
  }, []);

  // ⛔ click tracking removed
  // useEffect(() => {
  //   if (!containerRef?.current) return;
  //   const onClick = () => {
  //     track({ type: "click", articleId });
  //   };
  //   containerRef.current.addEventListener("click", onClick);
  //   return () => containerRef.current?.removeEventListener("click", onClick);
  // }, [articleId, containerRef]);

  // active time ticker
  useEffect(() => {
    const TICK = 1000;
    const ACTIVE_WINDOW = 15000;
    const isVisible = () => document.visibilityState === "visible";

    const tick = () => {
      const now = Date.now();
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      if (isVisible() && (now - lastActivityRef.current) < ACTIVE_WINDOW) {
        activeMsRef.current += dt;
      }
    };
    tickIdRef.current = setInterval(tick, TICK);

    const onVis = () => { lastTickRef.current = Date.now(); };
    document.addEventListener("visibilitychange", onVis);

    // ⛔ view_start removed
    // track({ type: "view_start", articleId });

    const onBeforeUnload = () => {
      track({ type: "time", articleId, ms: activeMsRef.current });
      // ⛔ view_end removed
      // track({ type: "view_end", articleId });
      flush(true);
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(tickIdRef.current);
      track({ type: "time", articleId, ms: activeMsRef.current });
      // ⛔ view_end removed
      // track({ type: "view_end", articleId });
      flush(true);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [articleId]);
}
