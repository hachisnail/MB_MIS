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
    "in storage": {
      label: "In Storage",
      cls: "bg-blue-100 text-blue-800 border-blue-300",
    },
  };

  const picked =
    map[s] ||
    (s.includes("display")
      ? map["on display"]
      : s.includes("maint")
      ? map["in maintenance"]
      : s.includes("storage")
      ? map["in storage"]
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
              &lsaquo;
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/70 text-white flex items-center justify-center"
              aria-label="Next"
              title="Next"
            >
              &rsaquo;
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

/* ---------------- LocationChangeModal (Form for location update) ---------------- */
const LocationChangeModal = ({ 
    isOpen, 
    onClose, 
    currentLocationStatus, // Renamed prop to reflect new structure
    onLocationChange // Will accept the structured object
}) => {
    const locationOptions = [
        { value: "On Display", label: "On Display" },
        { value: "In Storage", label: "In Storage" },
        // Add other statuses as needed (e.g., In Maintenance, Restoration)
    ];
    
    // State for the main location category (e.g., "On Display")
    const [selectedLocation, setSelectedLocation] = React.useState(currentLocationStatus || "");
    const [moveReason, setMoveReason] = React.useState("");
    
    // State for the nested, granular location fields
    const [nestedFields, setNestedFields] = React.useState({
        area: "", 
        shelf: "", 
        storageBox: "", 
        locationWithinBox: "", 
    });

    // Options for the new fields
    const areaOptions = [
        { value: "Exhibition 1", label: "Exhibition 1" },
        { value: "Exhibition 2", label: "Exhibition 2" },
    ];
    const shelfOptions = [
        { value: "Upper Part", label: "Upper Part" },
        { value: "Middle Part", label: "Middle Part" },
        { value: "Lower Part", label: "Lower Part" },
    ];

    // Function to handle changes in the nested fields
    const handleNestedChange = (field, value) => {
        setNestedFields(prev => ({ ...prev, [field]: value }));
    };

    // Function to handle the main location dropdown change
    const handleMainLocationChange = (value) => {
        setSelectedLocation(value);
        // Reset nested fields if the category changes and it's not "On Display"
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

    const handleSubmit = () => {
        const trimmedReason = moveReason.trim();

        // 1. Basic checks
        if (!selectedLocation || selectedLocation === currentLocationStatus) {
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

        // 3. Prepare the data to send to the backend (CRITICAL FIX)
        const dataToSend = {
            // Send the high-level status
            status: selectedLocation, 
            
            // Send ALL granular fields, converting empty strings to null for the DB
            area: nestedFields.area || null, 
            shelf: nestedFields.shelf || null, 
            storageBox: nestedFields.storageBox || null,
            locationWithinBox: nestedFields.locationWithinBox || null,
            
            // Send the reason
            moveReason: trimmedReason, 
        };
                
        onLocationChange(dataToSend);
        // onLocationChange closes the modal on success, so we can remove onClose here 
        // if the parent handler takes over closing the modal after successful API call.
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
                            selectedLocation === currentLocationStatus ||
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


/* ---------------- ArtifactLocationHistoryTable (New Component) ---------------- */
const ArtifactLocationHistoryTable = ({ contributionId }) => {
    const [history, setHistory] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Helper to format the history string
    const formatLocation = (item) => {
        const parts = [];
        if (item.new_location_area) parts.push(`Area: ${item.new_location_area}`);
        if (item.new_location_shelf) parts.push(`Shelf: ${item.new_location_shelf}`);
        if (item.new_location_box) parts.push(`Box: ${item.new_location_box}`);
        if (item.new_location_pos) parts.push(`Position: ${item.new_location_pos}`);
        
        return parts.length > 0 ? parts.join(' | ') : 'No specific details recorded.';
    };
    
    // Helper to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };


React.useEffect(() => {
        if (!contributionId) {
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Construct the absolute URL
                const endpoint = `${API_BASE_URL}/auth/artifact/${contributionId}/location/history`;

                // 2. Perform the fetch with credentials
                const response = await fetch(endpoint, { 
                    // 🛑 CRITICAL FIX: Include credentials (e.g., authentication cookies)
                    credentials: 'include', 
                });
                // 🚨 NEW LOGGING BLOCK START 🚨
                // Clone the response so we can read the body (as raw text) for logging
                const responseClone = response.clone();
                const rawText = await responseClone.text();

                // Log the received HTTP status and the raw text body
                // console.log(`[History Fetch Debug] HTTP Status: ${response.status}`);
                // console.log(`[History Fetch Debug] RAW RESPONSE BODY:`, rawText);
                // 🚨 NEW LOGGING BLOCK END 🚨

                // 2. Explicitly check for non-success status codes (e.g., 404, 500)
                if (!response.ok) {
                    let errorMessage = `HTTP error! Status: ${response.status}`;

                    // If the response text looks like JSON, try to extract the message
                    try {
                        const errorData = JSON.parse(rawText);
                        errorMessage += ` - ${errorData.message || response.statusText}`;
                    } catch {
                        // If it's not JSON (like the HTML response previously), append a snippet
                        errorMessage += ` - Server sent non-JSON response snippet: ${rawText.substring(0, 50)}...`;
                    }
                    throw new Error(errorMessage);
                }

                // 3. Only attempt to parse if the response was successful (200-299)
                // If it fails here (as before), it means the status was 200, but the body was junk (like HTML).
                const data = await response.json();
                setHistory(data.history || []);
            } catch (err) {
                console.error("Error fetching location history:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [contributionId]);

    if (loading) {
        return <div className="text-gray-500 italic">Loading location history...</div>;
    }

    if (error) {
        return <div className="text-red-500 italic">Error: {error}</div>;
    }

    return (
        <div className="w-full mt-4">
            <h4 className="text-2xl font-bold text-gray-800 mb-3">Location Move History</h4>
            
            {history.length === 0 ? (
                <div className="text-gray-500 italic p-4 border rounded-lg bg-white">
                    No location move history has been recorded yet for this artifact.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moved By (ID)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {history.map((item, index) => (
                                <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatDate(item.moved_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <StatusPill status={item.new_location_status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {formatLocation(item)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                        {item.move_reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {item.moved_by_user_id || 'System/Unknown'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}


/**
 * ArtifactMaintenanceForm (read-only status + description + carousel + History Table)
 */
export default function ArtifactMaintenanceForm({ 
    value = {}, 
    onChange, 
    contributionId,
    onLocationUpdate 
}) {
    const [isModalOpen, setIsModalOpen] = React.useState(false); 

    // 🚀 FIX: Ensure meta pulls all structured location fields from the value prop
    // This is CRITICAL for displaying the current data on page refresh.
    const meta = {
        status: value.status || "", // Assuming this is artifact status
        maintenanceDescription: value.maintenance_description || "", // Example field name
        damageImages: value.damage_images || [], // Example field name
        
        // These fields must match the snake_case names returned by your backend CatalogArtifact fetch
        currentLocationStatus: value.current_location || "", 
        locationArea: value.location_area || "",
        locationShelf: value.location_shelf || "",
        locationStorageBox: value.location_storage_box || "",
        locationPosInBox: value.location_pos_in_box || "",
        
        ...value,
    };
    
    // Function to handle location change (called by the modal)
    const handleLocationChange = async (newLocation) => {
        if (!contributionId || !onLocationUpdate) return;
        
        try {
            // 1. Perform the API update (delegated to parent)
            // The parent component should re-fetch the main artifact data upon success
            // OR update its own state with the new data.
            await onLocationUpdate(contributionId, newLocation);
            
            // 2. Update local state if onChange is provided (to immediately refresh the display)
            if (onChange) {
                // The structure for onChange should match the expected 'value' structure
                onChange({
                    ...meta,
                    // Use the canonical property names (snake_case) to update the parent's state
                    current_location: newLocation.status,
                    location_area: newLocation.area,
                    location_shelf: newLocation.shelf,
                    location_storage_box: newLocation.storageBox,
                    location_pos_in_box: newLocation.locationWithinBox,
                });
            }
            setIsModalOpen(false); // Close modal on success
            
            // 💡 IMPORTANT: To refresh the history table immediately, 
            // you'd typically pass a state setter down or lift the history state up.
            // For now, relying on the state update inside ArtifactLocationHistoryTable component
            // to automatically trigger a refresh is the simplest approach.
            
        } catch (error) {
            console.error("Failed to update location:", error);
            // Re-throw the error so the parent component can handle UI notifications
            throw error;
        }
    };

    return (
        <div className="w-full min-w-fit h-full flex flex-col gap-8 pl-5">
            
            {/* =================== TOP: Status and Location =================== */}
            <div className="w-full min-h-fit rounded-lg border border-gray-300 p-8 flex flex-col gap-6">
                <span className="text-4xl font-bold">Artifact Status & Location</span>

                {/* High-Level Status Display */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#555555] font-hind font-bold text-2xl">
                        Artifact Status:
                    </span>
                    {meta.status ? (
                        <StatusPill status={meta.status} />
                    ) : (
                        <span className="text-gray-500 italic text-xl">
                            Status hasn&apos;t been set yet
                        </span>
                    )}
                </div>

                {/* Location Display Block (Structured) */}
                <div className="flex flex-col gap-3 mt-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[#555555] font-hind font-bold text-2xl">
                            Current Location:
                        </span>
                        
                        {/* Status Pill for Location */}
                        {meta.currentLocationStatus ? (
                            <StatusPill status={meta.currentLocationStatus} />
                        ) : (
                            <span className="text-gray-500 italic text-xl">
                                Location Status Not Set
                            </span>
                        )}
                        
                        {/* Change Location Button */}
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 text-lg rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
                        >
                            Change Location
                        </button>
                    </div>
                    
                    {/* Detailed Location Path (Conditional Display) */}
                    {meta.currentLocationStatus && (
                        <div className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50 self-start">
                            <span className="text-lg font-bold text-[#1D1911]">Specific Placement:</span>
                            
                            <p className="text-lg text-gray-700">
                                {/* 🚀 FIX: Use an IIFE and join for clean, conditional string building in JSX */}
                                {(() => {
                                    const parts = [];

                                    if (meta.locationArea) {
                                        parts.push(`Area: ${meta.locationArea}`);
                                    }
                                    if (meta.locationShelf) {
                                        parts.push(`Shelf: ${meta.locationShelf}`);
                                    }
                                    if (meta.locationStorageBox) {
                                        parts.push(`Box: ${meta.locationStorageBox}`);
                                    }
                                    if (meta.locationPosInBox) {
                                        parts.push(`Position: ${meta.locationPosInBox}`);
                                    }
                                    
                                    if (parts.length > 0) {
                                        return parts.join(' | ');
                                    }
                                    
                                    // Fallback if high-level status is set but no details are provided
                                    return <span className="text-gray-500 italic">No specific details recorded for this status.</span>;
                                })()}
                            </p>
                        </div>
                    )}
                    
                    {/* 🚀 NEW: Location History Table */}
                    <ArtifactLocationHistoryTable contributionId={contributionId} />
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
                currentLocationStatus={meta.currentLocationStatus} // Pass the status
                onLocationChange={handleLocationChange} // Pass the primary handler
            />
        </div>
    );
}