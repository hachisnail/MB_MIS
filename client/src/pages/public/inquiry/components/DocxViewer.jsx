import { useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";

export default function DocxViewer({ url, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        if (!cancelled) {
          await renderAsync(buf, containerRef.current, undefined, {
            inWrapper: false,
            ignoreWidth: false,
            breakPages: true,
          });
        }
      } catch (e) {
        console.error("Failed to render DOCX", e);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `Failed to render DOCX (${e.message}).`;
        }
      }
    })();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [url]);

  return <div ref={containerRef} className={className} />;
}
