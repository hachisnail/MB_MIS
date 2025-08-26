import { useNavigate } from "react-router-dom";
import { rolePermissions, roleColorMap, actionMap } from "../../../../components/commons";
import ListRowRenderer from "../../../../components/tables/ListRowRenderer";

const LogItem = ({ log, formatCreatedAt, headers }) => {
  const navigate = useNavigate();

  const user = log.user;
  const fname = user?.fname || "Unknown";
  const lname = user?.lname || "";
  const isSystem = fname === "System" && lname === "Account";
  const fullName = `${fname} ${lname}`.trim();
  const roleId = user?.roleId ?? "default";

  const navigateTo = (path, endpoint) => {
    if (path === "user" && endpoint !== "System Account") {
      navigate(`/admin/user/${btoa(endpoint)}`);
    }
    if (path === "log") {
      navigate(`${btoa(endpoint)}`);
    }
  };

  const columns = [
    {
      key: "actor",
      render: () =>
        isSystem ? (
          <div className="flex flex-col">
            <span className="text-xl">System Generated</span>
            <span className={`font-semibold text-xs w-27 text-center py-1 px-1 rounded-md ${roleColorMap[roleId]}`}>
              System
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigateTo("user", fullName);
              }}
              className="text-xl z-5 w-fit hover:text-gray-400"
            >
              {fullName}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigateTo("user", fullName);
              }}
              className={`font-semibold text-xs w-27 text-center py-1 px-1 rounded-md ${roleColorMap[roleId]}`}
            >
              {rolePermissions[roleId] || "Unknown Role"}
            </span>
          </div>
        ),
    },
    {
      key: "timestamp",
      render: () => <span className="text-xl">{formatCreatedAt(log.createdAt)}</span>,
    },
    {
      key: "model",
      render: () => <span className="text-xl">{log.model?.toUpperCase() || "N/A"}</span>,
    },
    {
      key: "action",
      render: () => (
        <span
          className={`text-xl w-40 rounded-md text-center py-1 font-semibold ${actionMap[log.action] || ""}`}
        >
          {log.action?.toUpperCase() || "UNKNOWN"}
        </span>
      ),
    },
    {
      key: "description",
      render: () => (
        <span className="text-xl max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
          {log.description || "No description"}
        </span>
      ),
    },
  ];


  const handleRowClick = () => {
    navigateTo("log", `${log.id} ${log.action} ${formatCreatedAt(log.createdAt)}`);
  };

  return (
    <ListRowRenderer
      item={log}
      columns={columns}
      headers={headers}
      onRowClick={handleRowClick}
      rowClassName="w-full min-w-fit h-18 flex items-center cursor-pointer hover:bg-gray-900"
    />
  );
};

export default LogItem;
