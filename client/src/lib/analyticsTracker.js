// client/src/lib/analyticsTracker.js
import axiosClient from "./axiosClient.jsx";

// Generate a simple session ID for tracking
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};


// Track page view
export const trackPageView = async (pageName, timeSpent = 0) => {
  try {
    const sessionId = getSessionId();
    
    await axiosClient.post('/auth/analytics/track', {
      pageName,
      sessionId,
      timeSpent
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
};

/* Page tracking utilities and guards to avoid duplicate counts */
let pageStartTime = Date.now();
let currentPage = null;

// In-flight guard to prevent duplicate initial entries (e.g., StrictMode double effect)
const inflightEntries = new Set();

// Throttle guards
let lastStopAt = 0;
let lastHiddenLogAt = 0;

const ENTRY_COOLDOWN_MS = 2000;
// Helper to generate a unique key per page
const getEntryKey = (pageName) => (pageName || '').toLowerCase();

// Track last successful entry timestamp per page (in this tab)
const lastEntryAt = new Map();

export const startPageTracking = (pageName) => {
  if (!pageName) return;

  // Track previous page exit if exists (but don't count it)
  if (currentPage && currentPage !== pageName) {
    const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
    if (timeSpent > 0) {
      trackPageView(currentPage, timeSpent); // timeSpent > 0 won't increment counters on server
    }
  }

  // Start tracking new page
  currentPage = pageName;
  pageStartTime = Date.now();

  // Collapse duplicate entry calls by guarding with an in-flight key and a short cooldown
  const key = getEntryKey(pageName);
  if (inflightEntries.has(key)) {
    // Another start call is already sending the increment – skip this one
    return;
  }

  const now = Date.now();
  const last = lastEntryAt.get(key) || 0;
  if (now - last < ENTRY_COOLDOWN_MS) {
    // Within cooldown window; skip to avoid duplicate counting
    return;
  }

  inflightEntries.add(key);

  // Send entry increment; on success, record last entry timestamp
  trackPageView(pageName, 0)
    .then(() => {
      lastEntryAt.set(key, Date.now());
    })
    .catch(() => {
      // If the request fails, allow a retry by clearing in-flight
      // Do not set lastEntryAt to ensure a later retry can count
    })
    .finally(() => {
      inflightEntries.delete(key);
    });
};

export const stopPageTracking = () => {
  if (!currentPage) return;

  // Debounce rapid double-invocations (route change cleanup + beforeunload, StrictMode, etc.)
  const now = Date.now();
  if (now - lastStopAt < 750) {
    return;
  }
  lastStopAt = now;

  const timeSpent = Math.round((now - pageStartTime) / 1000);
  if (timeSpent > 0) {
    trackPageView(currentPage, timeSpent); // timeSpent > 0 won't increment counters on server
  }
  currentPage = null;
};

/* Auto-track page visibility changes (but don't count these) with throttling */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!currentPage) return;

    if (document.visibilityState === 'hidden') {
      const now = Date.now();
      // Throttle hidden events to avoid rapid duplicate logs
      if (now - lastHiddenLogAt < 1000) {
        return;
      }
      lastHiddenLogAt = now;

      const timeSpent = Math.round((now - pageStartTime) / 1000);
      if (timeSpent > 0) {
        trackPageView(currentPage, timeSpent); // This won't increment counters due to timeSpent > 0
      }
    } else if (document.visibilityState === 'visible') {
      pageStartTime = Date.now();
    }
  });
}
