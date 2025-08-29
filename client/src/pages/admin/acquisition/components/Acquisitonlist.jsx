


import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { formatDateForDisplay } from "@/components/commons";
import ListRowRenderer from "../../../../components/tables/ListRowRenderer";
import { encodeBase64 } from "@/utils/base64";

const acquisitionColumns = [
  {
    key: "submission_date",
    render: (date) => formatDateForDisplay(date),
  },
  {
    key: "Contributor",
    render: (_, item) =>
      `${item.Contributor?.first_name || ""} ${
        item.Contributor?.last_name || ""
      }`,
  },
  {
    key: "ContributionArtifact",
    render: (_, item) => item.ContributionArtifact?.title || "Untitled",
  },
  {
    key: "status",
    render: (value) => (
      <span
        className={`px-3 rounded font-semibold ${
          value === "approved"
            ? "bg-green-100 text-green-700"
            : value === "pending"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {value?.charAt(0).toUpperCase() + value?.slice(1)}
      </span>
    ),
  },
  {
    key: "contribution_type",
    render: (v) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : ""),
  },
  {
    key: "updated_at",
    render: (date) => formatDateForDisplay(date),
  }
];

export function AcquisitionItem({ item, headers }) {
  return (
    <ListRowRenderer
      item={item}
      columns={acquisitionColumns}
      headers={headers}
      // details={sampleDetails} // manually pass expanded data here
      onRowClick={`${item.contribution_type}/${encodeBase64(
        item.contribution_id + " " + item.ContributionArtifact?.title
      )}`}
    />
  );
}

const donorColumns = [
  {
    key: "name",
    render: (_, item) => `${item.first_name} ${item.last_name}`,
  },
  { key: "email" },
  { key: "province" },
  { key: "city" },
  {
    key: "total_contributions",
    render: (_, item) => (item.Contributions ?? []).length,
  },
];

export function DonorRecordsItem({ item, headers }) {
  // Expand contributions in the details table
  const details = (item.Contributions ?? []).map((c, idx) => ({
    // key: `${c.contribution_id}-${idx}`,
    // ID: c.contribution_id,
    Title: c.ContributionArtifact?.title || "Untitled",
    Status: c.status,
    Type: c.contribution_type,
    Date: formatDateForDisplay(new Date(c.submission_date)),
    Action: (
      <NavLink
        to={`${c.contribution_type}/${encodeBase64(
          c.contribution_id + " " + c.ContributionArtifact?.title
        )}`}
        className="text-blue-600 hover:underline"
      >
        View
      </NavLink>
    ),
  }));

  return (
    <ListRowRenderer
      rowKey={item.contributor_id} // unique row key
      item={item}
      headers={headers}
      columns={donorColumns}
      details={details}
    />
  );
}

