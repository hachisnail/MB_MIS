import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import styles from "./DocxViewer.module.css";

export default function DocxViewer({ url, className = "" }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true); // show spinner
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
      } finally {
        if (!cancelled) setLoading(false); // hide spinner
      }
    })();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [url]);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {loading && (
        <div className="flex items-center justify-center h-full w-full absolute top-0 left-0 bg-white bg-opacity-70 z-10">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
