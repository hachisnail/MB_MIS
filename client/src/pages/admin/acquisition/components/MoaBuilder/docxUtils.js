import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const DEFAULT_TEMPLATES = {
  donation: `${SERVER_URL}/uploads/private/templates/DONATION-FORM.docx`,
  lending: `${SERVER_URL}/uploads/private/templates/LEND-FORM.docx`,
};

export const FIXED_DELIMS = { start: "[[", end: "]]" };

export const ALWAYS_EDITABLE_KEYS = ["name", "province", "city", "artifact"];

export const DATE_ALIASES = {
  start: ["start", "start_date", "duration_from", "from", "date_from"],
  end: ["end", "end_date", "duration_to", "to", "date_to"],
};

// ---- date utils ----
export const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

export const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (!isValidDate(d)) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const onlyDate = (val) => {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (!isValidDate(d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

export const diffHuman = (startISO, endISO) => {
  if (!startISO || !endISO) return "";
  const s = new Date(startISO);
  const e = new Date(endISO);
  const ms = e - s;
  if (!isValidDate(s) || !isValidDate(e) || ms < 0) return "";
  const days = Math.round(ms / 86400000);
  if (days < 31) return `${days} day(s)`;
  const months = Math.round(days / 30.4375);
  if (months < 24) return `${months} month(s)`;
  const years = Math.round(months / 12);
  return `${years} year(s)`;
};

// ---- text helpers ----
export const trimJoin = (...parts) =>
  parts.map((s) => (s || "").trim()).filter(Boolean).join(" ");

export const pickTemplate = (root) => {
  const type = (
    root?.contribution_type ||
    root?.Contribution?.contribution_type ||
    ""
  ).toLowerCase();
  return type === "lending" ? "lending" : "donation";
};

// ---- filename helpers ----
export const buildFileName = ({ templateKey, payload, data }) => {
  const now = new Date();
  const yyyy = now.getFullYear();

  const prefix = templateKey === "lending" ? "MOA-LEN" : "DON";
  const cid = payload?.contribution_id ?? "";
  const uid = payload?.contributor_id ?? "";
  const aid = data?.artifact_id ?? "";

  const comboId = `${cid}${uid}${aid}${yyyy}`;

  const randLetters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("");

  const randNumbers = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

  return `${prefix}${comboId}-${randLetters}${randNumbers}`;
};

// ---- data shaping ----
export const toDocxData = (root) => {
  const a = root?.ContributionArtifact || root?.ontributionArtifact || {}; // tolerate typo
  const c = root?.Contributor || {};
  const lend = root?.LendingDetail || {};

  const name = trimJoin(c.first_name, c.last_name);
  const barangay = c.barangay || c.city || "";
  const province = c.province || "";

  const artifact = a.title || a.description || "";
  const artifact_id = a.artifact_id ?? "";
  const acquisition_details = a.acquisition_details || "";

  const submission_date = fmtDate(root?.submission_date || root?.created_at);

  const base = {
    name,
    barangay,
    province,
    city: c.city || "",
    artifact,
    acquisition_details,
  };

  if (pickTemplate(root) === "lending") {
    const s = onlyDate(lend.duration_from || root?.submission_date || "");
    const e = onlyDate(lend.duration_to || root?.submission_date || "");
    const formattedStart = fmtDate(s);
    const formattedEnd = fmtDate(e);

    return {
      ...base,
      start_raw: s,
      end_raw: e,
      start: formattedStart,
      end: formattedEnd,
      total: diffHuman(s, e),
      start_date: formattedStart,
      end_date: formattedEnd,
      duration_from: formattedStart,
      duration_to: formattedEnd,
    };
  }

  return { ...base, donation_date: submission_date };
};

// ---- docx helpers ----
export const buildDocxBlob = (templateAB, data) => {
  const zip = new PizZip(templateAB);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: FIXED_DELIMS,
  });
  doc.render(data);
  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

export const extractFieldsFromTemplate = (ab) => {
  try {
    const zip = new PizZip(ab);
    const read = (p) => (zip.file(p) ? zip.file(p).asText() : "");
    const docs = [
      read("word/document.xml"),
      ...Array.from({ length: 9 }, (_, i) => read(`word/header${i + 1}.xml`)),
      ...Array.from({ length: 9 }, (_, i) => read(`word/footer${i + 1}.xml`)),
    ].join("\n");

    const re = /\[\[([\s\S]{0,400}?)\]\]/g;
    const normalize = (x = "") =>
      x
        .replace(/<[^>]*>/g, "")
        .replace(/&[^;]+;/g, " ")
        .replace(/[^\w.-]+/g, "")
        .trim()
        .toLowerCase();

    const set = new Set();
    let m;
    while ((m = re.exec(docs)) !== null) {
      const key = normalize(m[1]);
      if (key) set.add(key);
    }
    return Array.from(set);
  } catch {
    return [];
  }
};
