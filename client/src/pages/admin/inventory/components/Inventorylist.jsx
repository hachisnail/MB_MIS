// client/src/pages/admin/Inventory/components/InventoryList.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ListRowRenderer from "../../../../components/tables/ListRowRenderer";

const prettyDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
};

// Derive a friendly whereabouts string without adding a new column
const prettyWhereabouts = (item) => {
  const status = (item.display_status || "").trim();
  if (status) return status;

  // Fallback from current_location if display_status isn't present
  const loc = (item.current_location || "").toLowerCase();
  if (loc.includes("display") || loc.includes("gallery") || loc.includes("exhibit")) return "On Display";
  if (loc.includes("storage")) return "In Storage";

  // Optional older flag fallback
  if (item.on_display) return "On Display";

  return "—";
};

const InventortyList = ({ item, headers, variant = "artifacts" }) => {
  const navigate = useNavigate();

  const colsArtifacts = useMemo(
    () => [
      { key: "title", render: () => item.title || "Untitled Artifact" },
      { key: "donor", render: () => item.donor_name || item.contributor_name || "—" },
      { key: "origin", render: () => item.provenance || "—" },
      { key: "acq", render: () => prettyDate(item.acquisition_date || item.updated_at || item.created_at) },
      {
        key: "type",
        render: () =>
          item.contribution_type === "lending"
            ? "Borrowed"
            : item.contribution_type === "donation"
            ? "Acquired"
            : "—",
      },
      // ✅ Keep the same "display" column key, but make it smart
      { key: "display", render: () => prettyWhereabouts(item) },
      { key: "last_maint", render: () => prettyDate(item.last_maintenance_at) },
      {
        key: "contract_exp",
        render: () =>
          item.contribution_type === "lending" ? prettyDate(item.contract_expires_at) : "—",
      },
    ],
    [item]
  );

  const colsAcquired = useMemo(
    () => [
      { key: "title", render: () => item.title || "Untitled Artifact" },
      { key: "donor", render: () => item.donor_name || item.contributor_name || "—" },
      { key: "origin", render: () => item.provenance || "—" },
      { key: "acq", render: () => prettyDate(item.acquisition_date || item.updated_at || item.created_at) },
      { key: "display", render: () => prettyWhereabouts(item) }, // ✅ no extra column
      { key: "last_maint", render: () => prettyDate(item.last_maintenance_at) },
    ],
    [item]
  );

  const colsBorrowing = useMemo(
    () => [
      { key: "title", render: () => item.title || "Untitled Artifact" },
      { key: "donor", render: () => item.donor_name || item.contributor_name || "—" },
      { key: "origin", render: () => item.provenance || "—" },
      { key: "acq", render: () => prettyDate(item.acquisition_date || item.updated_at || item.created_at) },
      { key: "display", render: () => prettyWhereabouts(item) }, // ✅ no extra column
      { key: "last_maint", render: () => prettyDate(item.last_maintenance_at) },
      {
        key: "contract_info",
        render: () =>
          item.contribution_type === "lending" ? prettyDate(item.contract_expires_at) : "—",
      },
    ],
    [item]
  );

  const columns =
    variant === "acquired" ? colsAcquired : variant === "borrowing" ? colsBorrowing : colsArtifacts;

  const handleRowClick = () => {
    const encoded = btoa(
      `${item.contribution_id ?? item.artifact_id ?? item.catalog_id} ${item.title ?? ""}`
    );
    navigate(`/admin/inventory/${encoded}`);
  };

  return (
    <ListRowRenderer
      item={item}
      columns={columns}
      headers={headers}
      onRowClick={handleRowClick}
      hoverEffect
    />
  );
};

export default InventortyList;
