// utils/base64.js

/**
 * Encode a string to Base64 (safe for Unicode)
 * @param {string} str - The string to encode
 * @returns {string} - Base64 encoded string
 */
export function encodeBase64(str) {
  if (!str) return "";
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (err) {
    console.error("Failed to encode Base64:", err);
    return "";
  }
}

/**
 * Decode a Base64 string back to original
 * @param {string} encodedStr - Base64 encoded string
 * @returns {string} - Decoded string
 */
export function decodeBase64(encodedStr) {
  if (!encodedStr) return "";
  try {
    return decodeURIComponent(escape(atob(encodedStr)));
  } catch (err) {
    console.error("Failed to decode Base64:", err);
    return "";
  }
}
