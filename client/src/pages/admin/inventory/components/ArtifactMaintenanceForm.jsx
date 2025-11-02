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

/* ---------------- DamageCarousel (read-only viewer) ---------------- */
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

const LocationChangeModal = ({ 
    isOpen, 
    onClose, 
    currentLocation, 
    onLocationChange // Will now accept { status: string, detailedLocation: string, moveReason: string }
}) => {
    const locationOptions = [
        { value: "On Display", label: "On Display" },
        { value: "In Storage", label: "In Storage" },
    ];
    
    // State for the main location category (e.g., "On Display")
    const [selectedLocation, setSelectedLocation] = React.useState(currentLocation || "");
    const [moveReason, setMoveReason] = React.useState("");
    // State for the nested, granular location fields
    const [nestedFields, setNestedFields] = React.useState({
        area: "", // Corresponds to area (exhibition 1/2)
        shelf: "", // Corresponds to shelf part (upper/middle/lower)
        storageBox: "", // Corresponds to storage box (ID/name)
        locationWithinBox: "", // Corresponds to location within the box
    });

    // Options for the new fields (omitted for brevity, they are the same)
    const areaOptions = [
        { value: "exhibition1", label: "Exhibition 1" },
        { value: "exhibition2", label: "Exhibition 2" },
    ];
    const shelfOptions = [
        { value: "upper", label: "Upper Part" },
        { value: "middle", label: "Middle Part" },
        { value: "lower", label: "Lower Part" },
    ];

    // Function to handle changes in the nested fields
    const handleNestedChange = (field, value) => {
        setNestedFields(prev => ({ ...prev, [field]: value }));
    };

    // Function to handle the main location dropdown change
    const handleMainLocationChange = (value) => {
        setSelectedLocation(value);
        // Reset nested fields if the category changes
        if (value !== "On Display") {
            setNestedFields({
                area: "",
                shelf: "",
                storageBox: "",
                locationWithinBox: "",
            });
        }
    }


const showNestedFields = selectedLocation === "On Display";

    // --- NEW LOGIC: Create the Detailed Location String ---
    const createDetailedLocationString = (main, fields) => {
        if (main !== "On Display") {
            // If not "On Display," use the selected main location as the detail (e.g., "In Storage")
            return main; 
        }
        
        // Format: exhibition1 | middle | Box: asfasf | Pos: asfasfas
        const parts = [];
        if (fields.area) parts.push(fields.area);
        if (fields.shelf) parts.push(fields.shelf);
        if (fields.storageBox) parts.push(`Box: ${fields.storageBox.trim()}`);
        if (fields.locationWithinBox) parts.push(`Pos: ${fields.locationWithinBox.trim()}`);
        
        // If "On Display" is selected but no nested fields are filled, return the main status
        return parts.join(' | ') || main;
    }

const handleSubmit = () => {
        const trimmedReason = moveReason.trim();

        // 1. Basic checks
        if (!selectedLocation || selectedLocation === currentLocation) {
            return onClose();
        }

        if (!trimmedReason) {
            alert("Please provide a reason for moving the artifact.");
            return;
        }

        // 2. Validation for "On Display" selection (required fields)
        if (showNestedFields && (!nestedFields.area || !nestedFields.shelf)) {
             alert("Please select the Area and Shelf before saving when setting to 'On Display'.");
             return;
        }

        // 3. Prepare the data to send to the backend
        const dataToSend = {
            // HIGH-LEVEL STATUS for catalog_artifacts.current_location
            status: selectedLocation, 
            
            // DETAILED STRING for ArtifactLocationHistory.new_location
            detailedLocation: createDetailedLocationString(selectedLocation, nestedFields),
            
            // REASON for ArtifactLocationHistory.move_reason
            moveReason: trimmedReason, 
        };
              
        onLocationChange(dataToSend);
        onClose();
    };

    if (!isOpen) return null;

    return (
        // Modal Backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
            {/* Modal Content */}
            <div className="bg-white p-8 rounded-lg shadow-2xl w-1/2 max-w-3xl"> 
                <h3 className="text-2xl font-bold mb-4 text-[#1D1911]">Change Artifact Location</h3>

                {/* 1. Main Location Dropdown */}
                <div className="mb-6 border-b pb-4">
                    <label htmlFor="main-location-select" className="block text-lg font-semibold text-gray-700 mb-2">
                        Main Location Category:
                    </label>
                    <select
                        id="main-location-select"
                        value={selectedLocation || ""}
                        onChange={(e) => handleMainLocationChange(e.target.value)}
                        className="px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-full"
                    >
                        <option value="">Select main category...</option>
                        {locationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                

                {/* 2. Nested Fields (Conditional Rendering: Only for "On Display") */}
                {showNestedFields && (
                    <div className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
                        <h4 className="text-xl font-bold text-gray-800">Detailed Placement (On Display):</h4>
                        
                        {/* Area Field */}
                        <div>
                            <label htmlFor="area-select" className="block text-sm font-medium text-gray-700 mb-1">
                                Area (e.g., Exhibition 1 or 2): <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="area-select"
                                value={nestedFields.area}
                                onChange={(e) => handleNestedChange("area", e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                            >
                                <option value="">Select Area...</option>
                                {areaOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Shelf Field */}
                        <div>
                            <label htmlFor="shelf-select" className="block text-sm font-medium text-gray-700 mb-1">
                                Shelf Part: <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="shelf-select"
                                value={nestedFields.shelf}
                                onChange={(e) => handleNestedChange("shelf", e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                            >
                                <option value="">Select Shelf Part...</option>
                                {shelfOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Storage Box Field (Input Text - Optional for display) */}
                        <div>
                            <label htmlFor="storage-box-input" className="block text-sm font-medium text-gray-700 mb-1">
                                Storage Box ID (Optional):
                            </label>
                            <input
                                id="storage-box-input"
                                type="text"
                                value={nestedFields.storageBox}
                                onChange={(e) => handleNestedChange("storageBox", e.target.value)}
                                placeholder="Enter Storage Box ID"
                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                            />
                        </div>

                        {/* Location Within Box Field (Input Text - Optional for display) */}
                        <div>
                            <label htmlFor="location-within-box-input" className="block text-sm font-medium text-gray-700 mb-1">
                                Location Within Box (Optional):
                            </label>
                            <input
                                id="location-within-box-input"
                                type="text"
                                value={nestedFields.locationWithinBox}
                                onChange={(e) => handleNestedChange("locationWithinBox", e.target.value)}
                                placeholder="Enter Position"
                                className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                            />
                        </div>
                    </div>
                )}
                <div className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="text-xl font-bold text-gray-800">Reason for Move: <span className="text-red-500">*</span></h4>
                    <textarea
                        value={moveReason}
                        onChange={(e) => setMoveReason(e.target.value)}
                        placeholder="e.g., Scheduled exhibition rotation, Preparing for conservation, Moving to permanent storage."
                        rows={3}
                        className="px-3 py-2 border border-gray-300 rounded-lg w-full resize-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                {/* 3. Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        // Disable if no location is selected OR if "On Display" is selected but required fields are missing
                        disabled={
                            !selectedLocation || 
                            selectedLocation === currentLocation ||
                            (showNestedFields && (!nestedFields.area || !nestedFields.shelf))
                        }
                        className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Save Location
                    </button>
                </div>
            </div>
        </div>
    );
};


/**
 * ArtifactMaintenanceForm (read-only status + description + carousel)
 */
export default function ArtifactMaintenanceForm({ 
  value = {}, 
  onChange, 
  contributionId,
  onLocationUpdate 
}) {
  const [isModalOpen, setIsModalOpen] = React.useState(false); // New state for modal

  const meta = {
    status: "",
    maintenanceDescription: "",
    damageImages: [],
    currentLocation: "",
    ...value,
  };

  const handleLocationChange = async (newLocation) => {
    if (!contributionId || !onLocationUpdate) return;
    
    try {
      // 1. Perform the API update (delegated to parent)
      await onLocationUpdate(contributionId, newLocation);
      
      // 2. Update local state if onChange is provided
      if (onChange) {
        onChange({
          ...meta,
          currentLocation: newLocation
        });
      }
      setIsModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Failed to update location:", error);
      alert("Failed to update artifact location. Please try again.");
    }
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

        {/* Location Button (replaces Dropdown) */}
        <div className="flex items-center gap-3 flex-wrap mt-4">
          <span className="text-[#555555] font-hind font-bold text-2xl">
            Location:
          </span>
          
          <div className="flex items-center gap-3">
              <span className="px-4 py-2 text-lg border border-gray-300 rounded-lg bg-white min-w-[200px]">
                {meta.currentLocation || "Location Not Set"}
              </span>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 text-lg rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
              >
                Change Location
              </button>
          </div>

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

      {/* Location Change Modal */}
      <LocationChangeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentLocation={meta.currentLocation}
          onLocationChange={handleLocationChange} // Pass the primary handler
      />
    </div>
  );
}