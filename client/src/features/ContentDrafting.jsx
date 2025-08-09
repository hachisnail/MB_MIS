// src/features/ContentDrafting.jsx

import { useEffect, useRef } from 'react';

export const saveDraft = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log("Draft saved for key:", key);
  } catch (error) {
    console.error("Failed to save draft to local storage:", error);
  }
};

export const loadDraft = (key) => {
  const savedDraft = localStorage.getItem(key);
  if (savedDraft) {
    try {
      const draft = JSON.parse(savedDraft);
      console.log(`Draft found for key: ${key}`);
      return draft;
    } catch (error) {
      console.error('Failed to parse draft from local storage:', error);
      return null;
    }
  }
  return null;
};

export const clearDraft = (key) => {
  localStorage.removeItem(key);
  console.log(`Draft cleared from local storage for key: ${key}`);
};

const useAutosave = (data, key, debounceDelay) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!data) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveDraft(key, data);
    }, debounceDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, debounceDelay]);
};

export default useAutosave;