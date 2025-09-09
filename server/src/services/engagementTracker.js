const BUF_MAX = 20;
let buffer = [];
let serverUrl = "/api/engagement";
let browserId = null;

function getBrowserId() {
  if (browserId) return browserId;
  try {
    const k = "br_id";
    browserId = localStorage.getItem(k);
    if (!browserId) {
      browserId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(k, browserId);
    }
  } catch {
    browserId = "anon_" + Math.random().toString(36).slice(2);
  }
  return browserId;
}

export function setEngagementEndpoint(url) {
  serverUrl = url;
}

export function track(evt) {
  buffer.push({ ...evt, t: Date.now(), br: getBrowserId() });
  if (buffer.length >= BUF_MAX) flush();
}

export function flush(sync = false) {
  if (!buffer.length) return;
  const payload = JSON.stringify({ events: buffer });
  const toSend = buffer;
  buffer = [];
  const endpoint = `${serverUrl}/events`;

  try {
    if (sync && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        endpoint,
        new Blob([payload], { type: "application/json" })
      );
      if (!ok) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      }
    } else {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
    }
  } catch {
    buffer = toSend.concat(buffer);
  }
}

// ⛔ userId removed from payload
export function trackTransition(fromId, toId) {
  track({ type: "transition", fromId, toId });
}
