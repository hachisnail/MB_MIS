import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import axios from "axios";

// --- tabs ---
const tabs = ["Latest", "Temporary", "All"];

// --- env + paths ---
const BASE_URL = import.meta.env.VITE_API_BASE_URL;                  // e.g. http://localhost:5000/api
const SERVER_ORIGIN = BASE_URL?.replace(/\/api$/, "");               // -> http://localhost:5000
const UPLOAD_PUBLIC = `${SERVER_ORIGIN}/uploads/pictures/`;          // public images
const UPLOAD_PRIVATE = `${SERVER_ORIGIN}/uploads/private/pictures/`; // fallback if needed

// Encode (ID :: Title) into base64 for routes
const encodeForRoute = (id, title) => btoa(`${id}::${title ?? ""}`);

/** Coerce a value into an array of strings.
 * Handles: real arrays, JSON-stringified arrays, comma-separated strings.
 */
const coerceList = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") {
    const s = val.trim();
    // Try JSON parse first
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    // Fallback: split by comma
    return s
      .replace(/^\[|\]$/g, "") // strip brackets if someone sent them
      .split(",")
      .map((x) => x.trim().replace(/^"|"$/g, "")) // strip quotes
      .filter(Boolean);
  }
  return [];
};

/** Build a safe absolute URL for a filename-like path. */
const toAbsoluteUploadUrl = (name) => {
  if (!name) return null;
  // already a full URL?
  if (/^https?:\/\//i.test(name)) return name;
  // avoid accidental double slashes
  const clean = name.replace(/^[/\\]+/, "");
  return `${UPLOAD_PUBLIC}${clean}`;
};

// Safe primary image picker (prefers absolute URLs if present)
const getPrimaryImage = (row) => {
  // Prefer absolute URL arrays if present
  const urls = coerceList(row?.image_urls);
  if (urls.length) return urls[0];

  const relUrls = coerceList(row?.related_image_urls);
  if (relUrls.length) {
    const u = relUrls[0];
    return /^https?:\/\//i.test(u) ? u : toAbsoluteUploadUrl(u);
  }

  // images/related_images may be arrays or stringified arrays or single filenames
  const images = coerceList(row?.images);
  if (images.length) return toAbsoluteUploadUrl(images[0]);

  const relImages = coerceList(row?.related_images);
  if (relImages.length) return toAbsoluteUploadUrl(relImages[0]);

  return null;
};

const prettyDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
};

const Catalogue = () => {
  const [activeTab, setActiveTab] = useState("Latest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // search/filter (optional)
  const [keyword, setKeyword] = useState("");
  const [culture, setCulture] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Data straight from catalog_artifacts
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        setError("");

        // using /api/auth/public-artifacts per your router
        const { data } = await axios.get(`${SERVER_ORIGIN}/api/auth/public-artifacts`, {
          params: { hasImages: "1", limit: 400 },
        });

        setArtifacts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load catalog artifacts:", err);
        setError("Failed to load catalog. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // Simple filters
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const cul = culture.trim().toLowerCase();
    const loc = locationFilter.trim().toLowerCase();

    return artifacts.filter((a) => {
      const matchKW =
        !kw ||
        a.title?.toLowerCase().includes(kw) ||
        a.donor_description?.toLowerCase().includes(kw) ||
        a.curatorial_description?.toLowerCase().includes(kw) ||
        a.display_description?.toLowerCase().includes(kw) ||
        a.provenance?.toLowerCase().includes(kw);

      const matchCulture = !cul || (a.culture || "").toLowerCase() === cul;
      const matchLocation = !loc || (a.current_location || "").toLowerCase().includes(loc);

      return matchKW && matchCulture && matchLocation;
    });
  }, [artifacts, keyword, culture, locationFilter]);

  // Tabs
  const visible = useMemo(() => {
    if (activeTab === "All") {
      return filtered.slice().sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    }

    if (activeTab === "Temporary") {
      // Heuristic: show likely loans/temporary exhibits
      const temp = filtered.filter((a) => {
        const txt = `${a.acquisition_history || ""} ${a.provenance || ""}`.toLowerCase();
        return txt.includes("loan") || txt.includes("temporary");
      });
      return temp.slice().sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    }

    // Latest (default) — top N by updated_at
    return filtered
      .slice()
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      .slice(0, 12);
  }, [filtered, activeTab]);

  return (
    <div className="w-screen min-w-fit pt-40 min-h-screen flex flex-col">
      <div className="w-[84vw] mt-40 space-y-10 h-fit flex flex-col self-center">
        {/* Header row */}
        <div className="w-full h-fit flex items-center justify-between">
          <div className="w-fit h-fit min-w-fit flex space-x-5 items-center">
            <i className="h-40 w-2 rounded-sm bg-white" />
            <div className="flex flex-col text-7xl h-fit justify-center text-white">
              <span className="font-semibold leading-18">Museo</span>
              <span className="font-semibold leading-18">Bulawan</span>
            </div>
          </div>

          <NavLink to="/appointment">
            <button className="w-70 h-16 bg-transparent hover:outline-1 hover:outline-black flex items-center justify-center outline-1 outline-white text-2xl font-medium text-white transition duration-300 hover:bg-white hover:text-black cursor-pointer">
              BOOK A VISIT
            </button>
          </NavLink>
        </div>

        <div className="w-full">
          <span className="text-white text-8xl font-semibold">Current Collections</span>
        </div>

        {/* Filters (optional) */}
        <div className="flex gap-3 flex-wrap">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by title, description, provenance…"
            className="px-4 py-2 rounded border border-gray-400 bg-white/95 text-black w-[30rem] max-w-full"
          />
          <input
            value={culture}
            onChange={(e) => setCulture(e.target.value)}
            placeholder="Culture"
            className="px-4 py-2 rounded border border-gray-400 bg-white/95 text-black w-[18rem] max-w-full"
          />
          <input
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Location"
            className="px-4 py-2 rounded border border-gray-400 bg-white/95 text-black w-[18rem] max-w-full"
          />
        </div>

        {/* Tabs */}
        <div className="flex mt-6 items-center space-x-5 mb-4">
          {tabs.map((label) => (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={`text-2xl text-white font-semibold pb-2 cursor-pointer focus:outline-none ${
                activeTab === label ? "border-b-2" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-2">
          {loading && <div className="text-white">Loading catalog…</div>}
          {error && <div className="text-red-400">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-10 gap-x-20">
              {visible.map((row) => {
                const img = getPrimaryImage(row);
                const dateShow =
                  row.metadata_updated_at || row.updated_at || row.created_at || row.date_of_creation;
                const encoded = encodeForRoute(
                  row.contribution_id ?? row.artifact_id ?? row.catalog_id,
                  row.title
                );

                return (
                  <Link
                    key={row.catalog_id ?? `${row.contribution_id}-${row.artifact_id}`}
                    to={`/catalog/${encoded}`}
                    className="flex flex-col items-center text-center hover:opacity-90 transition overflow-hidden"
                  >
                    <div className="w-full aspect-square overflow-hidden bg-gray-700 flex items-center justify-center rounded">
                      {img ? (
                        <img
                          src={img}
                          alt={row.title || "Artifact"}
                          className="w-full h-full object-cover duration-300 hover:scale-105 transition-transform"
                          onError={(e) => {
                            // try the private path as a fallback if filename
                            const src = e.currentTarget.getAttribute("src") || "";
                            if (!/^https?:\/\//i.test(src) && src.startsWith(UPLOAD_PUBLIC)) {
                              e.currentTarget.src = src.replace(UPLOAD_PUBLIC, UPLOAD_PRIVATE);
                            } else {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement.innerHTML =
                                '<div class="text-gray-300 text-xl">No Image</div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="text-gray-300 text-xl">No Image</div>
                      )}
                    </div>

                    {/* Meta */}
                    <p className="text-[#F05454] text-base uppercase mt-2">
                      {row.culture || row.provenance || "—"}
                    </p>
                    <h2 className="text-[#E5D2AC] italic text-[3rem] font-semibold mt-1 line-clamp-2">
                      {row.title || "Untitled Artifact"}
                    </h2>
                    <p className="text-gray-400 text-base mt-1">
                      {row.collection_number ? `#${row.collection_number}` : "\u00A0"}
                    </p>
                    <p className="text-gray-500 text-base mt-1">{prettyDate(dateShow)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalogue;
