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

// Page tracking utilities
let pageStartTime = Date.now();
let currentPage = null;

export const startPageTracking = (pageName) => {
  // Track previous page exit if exists
  if (currentPage) {
    const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
    trackPageView(currentPage, timeSpent);
  }
  
  // Start tracking new page
  currentPage = pageName;
  pageStartTime = Date.now();
  
  // Track page entry
  trackPageView(pageName, 0);
};

export const stopPageTracking = () => {
  if (currentPage) {
    const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
    trackPageView(currentPage, timeSpent);
    currentPage = null;
  }
};

// Auto-track page visibility changes
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && currentPage) {
      const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
      trackPageView(currentPage, timeSpent);
    } else if (document.visibilityState === 'visible' && currentPage) {
      pageStartTime = Date.now();
    }
  });
}
