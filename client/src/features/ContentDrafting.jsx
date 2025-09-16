import { useEffect, useRef } from "react";

export const stableStringify = (obj) =>
  JSON.stringify(obj, Object.keys(obj || {}).sort());

export const hashString = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
};

export const hashState = (state) => hashString(stableStringify(state));
const dismissedKey = (key) => `${key}::dismissedHash`;
const storageAvailable = () => typeof Storage !== "undefined";

export const saveDraft = (key, data) => {
  try {
    if (!storageAvailable()) {
      console.warn("localStorage is not supported in this browser");
      return false;
    }

    const payload = {
      data,
      hash: hashState(data),
      _savedAt: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error("Failed to save draft to local storage:", error);
    if (error?.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Consider clearing old drafts.");
    }
    return false;
  }
};

export const loadDraft = (key) => {
  try {
    if (!storageAvailable()) {
      console.warn("localStorage is not supported in this browser");
      return null;
    }

    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && "data" in parsed && "hash" in parsed) {
      return parsed;
    }

    const legacyData = parsed || {};
    const converted = {
      data: legacyData,
      hash: hashState(legacyData),
      _savedAt: legacyData?._savedAt || new Date().toISOString(),
    };
    return converted;
  } catch (error) {
    console.error("Failed to parse draft from local storage:", error);
    try {
      localStorage.removeItem(key);
      console.log("Corrupted draft removed for key:", key);
    } catch (removeError) {
      console.error("Failed to remove corrupted draft:", removeError);
    }
    return null;
  }
};

export const clearDraft = (key) => {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(dismissedKey(key));
    return true;
  } catch (error) {
    console.error("Failed to clear draft from local storage:", error);
    return false;
  }
};

export const hasDraft = (key) => {
  try {
    return storageAvailable() && localStorage.getItem(key) !== null;
  } catch (error) {
    console.error("Failed to check for draft:", error);
    return false;
  }
};

export const getDraftAge = (key) => {
  const draft = loadDraft(key);
  const savedAt = draft?._savedAt || draft?.data?._savedAt;
  if (savedAt) {
    const savedTime = new Date(savedAt);
    const now = new Date();
    return Math.floor((now - savedTime) / (1000 * 60));
  }
  return null;
};

export const setDismissedDraftHash = (key, hash) => {
  try {
    if (!storageAvailable()) return;
    localStorage.setItem(dismissedKey(key), hash || "");
  } catch (e) {
    console.error("Failed to save dismissed draft hash:", e);
  }
};

export const getDismissedDraftHash = (key) => {
  try {
    if (!storageAvailable()) return "";
    return localStorage.getItem(dismissedKey(key)) || "";
  } catch (e) {
    console.error("Failed to read dismissed draft hash:", e);
    return "";
  }
};

export const clearDismissedDraftHash = (key) => {
  try {
    if (!storageAvailable()) return;
    localStorage.removeItem(dismissedKey(key));
  } catch (e) {
    console.error("Failed to clear dismissed draft hash:", e);
  }
};

export const shouldPromptForDraft = ({ draft, baseHash, dismissedHash }) => {
  if (!draft?.hash) return false;
  if (draft.hash === baseHash) return false;
  if (draft.hash === dismissedHash) return false;
  return true;
};

/** Compute "dirty" by comparing current snapshot hash to baseline hash */
export const isDirtyAgainstBase = (currentHash, baseHash) => currentHash !== baseHash;

const useAutosave = (data, key, debounceDelay = 1000, enabled = true) => {
  const timeoutRef = useRef(null);
  const lastSavedHashRef = useRef("");

  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!data) return;

    const nextHash = hashState(data);

    if (nextHash === lastSavedHashRef.current) return;

    timeoutRef.current = setTimeout(() => {
      const success = saveDraft(key, data);
      if (success) {
        lastSavedHashRef.current = nextHash;
      }
    }, debounceDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, debounceDelay, enabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};

export default useAutosave;
