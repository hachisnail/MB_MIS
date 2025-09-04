// src/features/ContentDrafting.jsx

import { useEffect, useRef } from 'react';

export const saveDraft = (key, data) => {
  try {
    // Check if localStorage is available
    if (typeof Storage === "undefined") {
      console.warn("localStorage is not supported in this browser");
      return false;
    }
    
    // Add timestamp to track when draft was saved
    const draftWithTimestamp = {
      ...data,
      _savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(draftWithTimestamp));
    console.log("Draft saved for key:", key, "at", draftWithTimestamp._savedAt);
    return true;
  } catch (error) {
    console.error("Failed to save draft to local storage:", error);
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.warn("localStorage quota exceeded. Consider clearing old drafts.");
    }
    return false;
  }
};

export const loadDraft = (key) => {
  try {
    // Check if localStorage is available
    if (typeof Storage === "undefined") {
      console.warn("localStorage is not supported in this browser");
      return null;
    }
    
    const savedDraft = localStorage.getItem(key);
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      console.log(`Draft found for key: ${key}`, draft._savedAt ? `saved at ${draft._savedAt}` : '');
      return draft;
    }
  } catch (error) {
    console.error('Failed to parse draft from local storage:', error);
    // If draft is corrupted, remove it
    try {
      localStorage.removeItem(key);
      console.log('Corrupted draft removed for key:', key);
    } catch (removeError) {
      console.error('Failed to remove corrupted draft:', removeError);
    }
  }
  return null;
};

export const clearDraft = (key) => {
  try {
    localStorage.removeItem(key);
    console.log(`Draft cleared from local storage for key: ${key}`);
    return true;
  } catch (error) {
    console.error("Failed to clear draft from local storage:", error);
    return false;
  }
};

// Helper function to check if a draft exists
export const hasDraft = (key) => {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error("Failed to check for draft:", error);
    return false;
  }
};

// Helper function to get draft age in minutes
export const getDraftAge = (key) => {
  const draft = loadDraft(key);
  if (draft && draft._savedAt) {
    const savedTime = new Date(draft._savedAt);
    const now = new Date();
    return Math.floor((now - savedTime) / (1000 * 60)); // minutes
  }
  return null;
};

const useAutosave = (data, key, debounceDelay = 1000) => {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if no data or if data hasn't changed
    if (!data || JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return;
    }

    // Set up new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      const success = saveDraft(key, data);
      if (success) {
        lastSavedRef.current = data;
      }
    }, debounceDelay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, debounceDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};

export default useAutosave;
