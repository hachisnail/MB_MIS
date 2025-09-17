import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ListRowRenderer from "../../../../components/tables/ListRowRenderer";

const prettyDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
};

const InventortyList = ({ item, headers, variant = "artifacts" }) => {
  const navigate = useNavigate();

  const colsArtifacts = useMemo(() => ([
    { key: "title", render: () => item.title || "Untitled Artifact" },
    { key: "donor", render: () => item.donor_name || item.contributor_name || "—" },
    { key: "origin", render: () => item.current_location || item.provenance || "—" },
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
    { key: "display", render: () => item.display_status || (item.on_display ? "On Display" : "—") },
    { key: "last_maint", render: () => prettyDate(item.last_maintenance_at) },
    { key: "contract_exp", render: () => prettyDate(item.contract_expires_at) },
  ]), [item]);

  const colsAcquired = useMemo(() => ([
    { key: "title", render: () => item.title || "Untitled Artifact" },
    { key: "donor", render: () => item.donor_name || item.contributor_name || "—" },
    { key: "origin", render: () => item.current_location || item.provenance || "—" },
    { key: "acq", render: () => prettyDate(item.acquisition_date || item.updated_at || item.created_at) },
    { key: "display", render: () => item.display_status || (item.on_display ? "On Display" : "—") },
    { key: "last_maint", render: () => prettyDate(item.last_maintenance_at) },
  ]), [item]);

  const colsBorrowing = useMemo(() => ([
    { key: "title", render: () => item.title || "Untitled Artifact" },
    { key: "donor", render: () => item.donor_name || item.contributor_name || "—" },
    { key: "origin", render: () => item.current_location || item.provenance || "—" },
    { key: "acq", render: () => prettyDate(item.acquisition_date || item.updated_at || item.created_at) },
    { key: "display", render: () => item.display_status || (item.on_display ? "On Display" : "—") },
    { key: "last_maint", render: () => prettyDate(item.last_maintenance_at) },
    { key: "contract_info", render: () => prettyDate(item.contract_expires_at) },
  ]), [item]);

  const columns =
    variant === "acquired" ? colsAcquired :
    variant === "borrowing" ? colsBorrowing :
    colsArtifacts;

  const handleRowClick = () => {
    const encoded = btoa(`${item.contribution_id ?? item.artifact_id ?? item.catalog_id} ${item.title ?? ""}`);
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
