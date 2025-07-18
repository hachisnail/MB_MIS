import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const NAVBAR_OFFSET = -50; 

export const ScrollToTop = () => {
  const location = useLocation();
  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    const performScroll = (targetId, isNavbarScroll = false) => {
      const element = document.getElementById(targetId);
      if (element) {
        if (isNavbarScroll) {
          const targetScrollY = element.getBoundingClientRect().top + window.scrollY + NAVBAR_OFFSET;
          window.scrollTo({ top: targetScrollY, behavior: "smooth" });
        } else {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else if (targetId === "main-navbar-top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    // Scenario 1: Navigating to a new page (pathname changes)
    if (location.pathname !== prevPathname.current) {
      // Always try to scroll to the top of the new page using the navbar ID, with its specific offset.
      performScroll("main-navbar-top", true); // Pass 'true' to apply the navbar offset

      // After scrolling, ensure the URL doesn't have a hash, unless it was meant to be there
      // for a specific content anchor. This handles cleaning up old hashes from previous pages.
      if (window.location.hash && location.hash === "") {
        window.history.replaceState(null, "", location.pathname + location.search);
      }
    }
    prevPathname.current = location.pathname; // Update ref for next comparison

    // Scenario 2: Navigating to an anchor (hash is present) on the same page OR initial load with hash
    if (location.hash) {
      const id = location.hash.substring(1); // Get anchor ID without '#'
      // We add a short delay to ensure the target element is rendered and the initial
      // page-top scroll (if it was a pathname change) has completed.
      const timer = setTimeout(() => {
        performScroll(id, false); // Pass 'false' so it does NOT use the navbar offset

        // Crucial: Clear the hash from the URL after successfully scrolling to it.
        // This prevents the hash from "sticking" in the browser's history for subsequent navigations.
        window.history.replaceState(null, "", location.pathname + location.search);
      }, 100); // Small delay, adjust if needed

      return () => clearTimeout(timer); // Cleanup timeout on unmount or re-run
    } else {
      // If there's no hash in `location` but one might be lingering in the actual URL bar,
      // ensure it's removed. This acts as a more aggressive cleanup for edge cases.
      if (window.location.hash) {
          window.history.replaceState(null, "", location.pathname + location.search);
      }
    }

  }, [location.pathname, location.hash, location.search]); // Dependencies: pathname for page changes, hash for anchors

  return null;
};