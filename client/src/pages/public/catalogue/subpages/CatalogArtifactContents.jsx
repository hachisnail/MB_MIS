import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL?.replace(/\/api$/, "");
const UPLOAD_PUBLIC = `${SERVER_ORIGIN}/uploads/pictures/`;
const UPLOAD_PRIVATE = `${SERVER_ORIGIN}/uploads/private/pictures/`;

const decodeId = (encoded) => {
  try {
    const decoded = atob(encoded);
    const [decId, decName] = decoded.split("::");
    return { id: decId, name: decName };
  } catch {
    return { id: null, name: null };
  }
};

const getPrimaryImage = (row) => {
  if (Array.isArray(row?.image_urls) && row.image_urls.length) return row.image_urls[0];
  if (Array.isArray(row?.related_image_urls) && row.related_image_urls.length) return row.related_image_urls[0];

  const firstImage =
    Array.isArray(row?.images) ? row.images[0] :
    row?.images ? row.images :
    Array.isArray(row?.related_images) ? row.related_images[0] : null;

  if (!firstImage) return null;
  const looksLikeUrl = typeof firstImage === "string" && /^https?:\/\//i.test(firstImage);
  if (looksLikeUrl) return firstImage;
  return `${UPLOAD_PUBLIC}${firstImage}`;
};

const prettyDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
};

export default function CatalogArtifactContents() {
  const { id: encoded } = useParams();
  const { id: contributionId, name: encodedName } = decodeId(encoded);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!contributionId) return;
    const run = async () => {
      try {
        setLoading(true);
        setErr("");

        // ✅ This calls your server controller: previewCatalogRecord(req,res)
        // GET /api/catalog/preview/:id   (id = contribution_id)
        const res = await fetch(`${SERVER_ORIGIN}/api/catalog/preview/${contributionId}`);
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to fetch catalog artifact");
        }
        const data = await res.json();
        setRow(data);
      } catch (e) {
        console.error(e);
        setErr("Unable to load artifact.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [contributionId]);

  const img = useMemo(() => getPrimaryImage(row || {}), [row]);

  if (!contributionId) {
    return <div className="w-full h-screen flex items-center justify-center">Invalid link.</div>;
  }
  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading…</div>;
  }
  if (err || !row) {
    return <div className="w-full h-screen flex items-center justify-center">{err || "Not found."}</div>;
  }

  return (
    <div className="w-screen min-h-screen pt-36 pb-24">
      <div className="max-w-[120rem] mx-auto px-6">
        {/* Title + hero */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <h1 className="text-6xl font-bold text-white leading-tight">{row.title || encodedName || "Artifact"}</h1>
            <div className="mt-3 text-gray-300 text-2xl flex flex-wrap gap-x-6 gap-y-2">
              {row.collection_number && <span>Collection No: <strong className="text-white">#{row.collection_number}</strong></span>}
              {row.culture && <span>Culture: <strong className="text-white">{row.culture}</strong></span>}
              {row.date_of_creation && <span>Date: <strong className="text-white">{row.date_of_creation}</strong></span>}
              {row.current_location && <span>Location: <strong className="text-white">{row.current_location}</strong></span>}
            </div>
            <div className="mt-2 text-gray-400">
              Updated: {prettyDate(row.metadata_updated_at || row.updated_at || row.created_at)}
            </div>
          </div>

          <div className="w-full md:w-[40rem] aspect-square overflow-hidden bg-gray-700 rounded">
            {img ? (
              <img
                src={img}
                className="w-full h-full object-cover"
                alt={row.title || "Artifact"}
                onError={(e) => {
                  const src = e.currentTarget.getAttribute("src") || "";
                  if (!/^https?:\/\//i.test(src) && src.startsWith(UPLOAD_PUBLIC)) {
                    e.currentTarget.src = src.replace(UPLOAD_PUBLIC, UPLOAD_PRIVATE);
                  } else {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center text-gray-300 text-xl">No Image</div>';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">No Image</div>
            )}
          </div>
        </div>

        {/* Descriptions */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-[#1D1911] rounded-xl p-6 border border-gray-700">
            <h2 className="text-white text-3xl font-bold mb-4">About</h2>
            <div className="text-gray-200 space-y-4 text-xl leading-relaxed">
              {row.display_description && <p>{row.display_description}</p>}
              {!row.display_description && row.donor_description && <p>{row.donor_description}</p>}
              {!row.display_description && !row.donor_description && row.narrative && <p>{row.narrative}</p>}
              {!row.display_description && !row.donor_description && !row.narrative && (
                <p className="text-gray-400 italic">No description available.</p>
              )}
            </div>
          </div>

          <div className="bg-[#1D1911] rounded-xl p-6 border border-gray-700">
            <h2 className="text-white text-3xl font-bold mb-4">Details</h2>
            <div className="text-gray-200 text-xl leading-relaxed space-y-2">
              {row.provenance && <p><span className="text-gray-400">Provenance:</span> {row.provenance}</p>}
              {row.discovery_details && <p><span className="text-gray-400">Discovery:</span> {row.discovery_details}</p>}
              {row.excavation_site && <p><span className="text-gray-400">Excavation site:</span> {row.excavation_site}</p>}
              {row.acquisition_history && <p><span className="text-gray-400">Acquisition:</span> {row.acquisition_history}</p>}
              {row.curatorial_description && (
                <p className="mt-4"><span className="text-gray-400">Curatorial notes:</span> {row.curatorial_description}</p>
              )}
              {!row.provenance && !row.discovery_details && !row.excavation_site && !row.acquisition_history && !row.curatorial_description && (
                <p className="text-gray-400 italic">No additional details.</p>
              )}
            </div>
          </div>
        </div>

        {/* (Optional) Related media grid could go here using row.related_image_urls / related_images */}
      </div>
    </div>
  );
}
