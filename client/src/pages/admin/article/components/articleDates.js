// Manila timezone helpers
export const getManilaTodayISO = () => {
  const now = new Date();
  const manilaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  manilaNow.setHours(0, 0, 0, 0);
  const y = manilaNow.getFullYear();
  const m = String(manilaNow.getMonth() + 1).padStart(2, "0");
  const d = String(manilaNow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const toISOZFromManila = (datePart, timePart, fallbackHHmm = "00:00") => {
  if (!datePart) return "";
  const hhmm = (timePart && timePart.length ? timePart : fallbackHHmm).slice(0, 5);
  const isoWithOffset = `${datePart}T${hhmm}:00+08:00`;
  return new Date(isoWithOffset).toISOString();
};

export const isDateDisabledForSchedule = (isoDate, manilaTodayISO) => {
  if (!isoDate) return false;
  const selected = new Date(`${isoDate}T00:00:00+08:00`);
  const today = new Date(`${manilaTodayISO}T00:00:00+08:00`);
  return selected < today;
};

export const toManilaParts = (iso) => {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "Asia/Manila",
    }),
    time: d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Manila",
    }),
  };
};
