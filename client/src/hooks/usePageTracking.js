// client/src/hooks/usePageTracking.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startPageTracking, stopPageTracking } from '../lib/analyticsTracker.js';

// Map routes to page names
const getPageNameFromPath = (pathname) => {
  if (pathname === '/' || pathname === '/home') return 'Home';
  if (pathname.startsWith('/articles') || pathname.startsWith('/news-events')) return 'Articles';
  if (pathname.startsWith('/catalogue') || pathname.startsWith('/catalog')) return 'Catalogue';
  if (pathname.startsWith('/about')) return 'About';
  if (pathname.startsWith('/appointments')) return 'Appointments';
  if (pathname.startsWith('/login')) return 'Login';
  if (pathname.startsWith('/recovery')) return 'Recovery';
  
  // Default fallback
  return 'Other';
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const pageName = getPageNameFromPath(location.pathname);
    startPageTracking(pageName);

    // Cleanup function to track page exit
    return () => {
      stopPageTracking();
    };
  }, [location.pathname]);

  // Track page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopPageTracking();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopPageTracking();
    };
  }, []);
};
