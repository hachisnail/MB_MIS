import React from "react";

/* ---------------- StatusPill (visual status) ---------------- */
const StatusPill = ({ status }) => {
  const s = (status || "").toLowerCase().trim();

  const map = {
    "on display": {
      label: "On Display",
      cls: "bg-green-100 text-green-800 border-green-300",
    },
    "in maintenance": {
      label: "In Maintenance",
      cls: "bg-amber-100 text-amber-800 border-amber-300",
    },
    on_display: {
      label: "On Display",
      cls: "bg-green-100 text-green-800 border-green-300",
    },
    in_maintenance: {
      label: "In Maintenance",
      cls: "bg-amber-100 text-amber-800 border-amber-300",
    },
  };

  const picked =
    map[s] ||
    (s.includes("display")
      ? map["on display"]
      : s.includes("maint")
      ? map["in maintenance"]
      : { label: status || "—", cls: "bg-gray-100 text-gray-700 border-gray-300" });

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 h-10 rounded-full border text-sm font-semibold ${picked.cls}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-current opacity-70" />
      {picked.label}
    </span>
  );
};

/* ---------------- DamageCarousel (read-only viewer) ----------------
   Expects items from the DB, each like:
   {
     src: "https://.../image.jpg"  // or full path you already built from the DB file name
     name: "Crack on rim",
     description: "Hairline crack approx. 3cm."
   }

   If your DB returns a different shape (e.g. {file, title, desc}),
   map it in the parent before passing to this component.
-------------------------------------------------------------------*/
const DamageCarousel = ({ items = [] }) => {
  const data = Array.isArray(items) ? items.filter((d) => !!d?.src) : [];
  const [idx, setIdx] = React.useState(0);

  if (data.length === 0) {
    return <div className="text-gray-500 italic">No damage images.</div>;
  }

  const prev = () => setIdx((i) => (i - 1 + data.length) % data.length);
  const next = () => setIdx((i) => (i + 1) % data.length);
  const current = data[idx];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Image */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-white">
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img
          src={current.src}
          alt={current.name || `Damage ${idx + 1}`}
          className="w-full h-full object-cover"
        />

        {/* View-only controls */}
        {data.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/70 text-white flex items-center justify-center"
              aria-label="Previous"
              title="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/70 text-white flex items-center justify-center"
              aria-label="Next"
              title="Next"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
              {data.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-2 w-2 rounded-full ${
                    i === idx ? "bg-white" : "bg-white/60"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                  title={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Caption */}
      <div className="w-full rounded-xl border border-gray-200 bg-white p-4">
        <div className="text-xl font-bold text-[#1D1911]">
          {current.name || `Damage ${idx + 1}`}
        </div>
        <div className="mt-1 text-[#444] whitespace-pre-wrap">
          {current.description?.trim()
            ? current.description
            : "No description provided."}
        </div>
      </div>
    </div>
  );
};

/**
 * ArtifactMaintenanceForm (read-only status + description + carousel)
 *
 * Props (from DB via parent):
 *  value: {
 *    status?: string,
 *    maintenanceDescription?: string,
 *    damageImages?: Array<{ src: string, name?: string, description?: string }>
 *  }
 */
export default function ArtifactMaintenanceForm({ value = {} }) {
  const meta = {
    status: "",
    maintenanceDescription: "",
    damageImages: [],
    ...value,
  };

  return (
    <div className="w-full min-w-fit h-full flex flex-col gap-8 pl-5">
      {/* =================== TOP: Status =================== */}
      <div className="w-full min-h-fit rounded-lg border border-gray-300 p-8 flex flex-col gap-6">
        <span className="text-4xl font-bold">Artifact Status</span>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[#555555] font-hind font-bold text-2xl">
            This artifact is currently:
          </span>
          {meta.status ? (
            <StatusPill status={meta.status} />
          ) : (
            <span className="text-gray-500 italic text-xl">
              Status hasn&apos;t been set yet
            </span>
          )}
        </div>
      </div>

      {/* ================= MIDDLE: Maintenance Description (read-only) ================= */}
      <div className="w-full h-[25rem] rounded-lg border border-gray-300 p-8 flex flex-col gap-4">
        <span className="text-4xl font-bold">Maintenance Description</span>
        <div className="rounded-xl border border-gray-200 bg-white p-4 min-h-[10rem]">
          {meta.maintenanceDescription && meta.maintenanceDescription.trim() ? (
            <p className="whitespace-pre-wrap text-lg text-[#1D1911]">
              {meta.maintenanceDescription}
            </p>
          ) : (
            <span className="text-gray-500 italic">No description yet</span>
          )}
        </div>
      </div>

      {/* ================= BOTTOM: Damage Gallery (Carousel) ================= */}
      <div className="w-full h-[25rem] rounded-lg border border-gray-300 p-8 flex flex-col gap-6">
        <span className="text-4xl font-bold">Artifact Damage Images</span>
        <DamageCarousel items={meta.damageImages} />
      </div>
    </div>
  );
}
