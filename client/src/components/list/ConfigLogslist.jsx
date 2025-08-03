import { useNavigate } from "react-router-dom";

const formatRouteKey = (key) => {
  if (!key) return "No key";
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatCreatedAt = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ConfigLogslist = ({ log }) => {
  const beforeRaw = log?.beforeState ? JSON.parse(log.beforeState) : null;
  const afterRaw = log?.afterState ? JSON.parse(log.afterState) : null;
  const navigate = useNavigate();

  const navigateTo = (path, endpoint) => {
    if (path === "user" && endpoint !== "System Account") {
      return navigate(`/admin/user/${btoa(endpoint)}`);
    }
    if (path === "log") {
      return navigate(`/admin/logs/${btoa(endpoint)}`);
    }
  };

  // Determine primary key: from route_key or fallback to 'maintenance'
  const routeKey =
    beforeRaw?.route_key ||
    afterRaw?.route_key || // single-flag case
    (beforeRaw?.maintenance && "maintenance") || // fallback
    "unknown";

  const formattedRouteKey = formatRouteKey(routeKey);

  const before =
    typeof beforeRaw?.is_enabled !== "undefined"
      ? beforeRaw
      : beforeRaw?.[routeKey];

  const after =
    typeof afterRaw?.is_enabled !== "undefined"
      ? afterRaw
      : afterRaw?.[routeKey];

  const status = after?.is_enabled;
  const statusColor =
    status === true
      ? "bg-green-500"
      : status === false
      ? "bg-red-500"
      : "bg-gray-500";

  const statusText =
    status === true ? "Enabled" : status === false ? "Disabled" : "No data";

  return (
    <div
      onClick={() =>
        navigateTo(
          "log",
          `${log?.id} ${log?.action} ${formatCreatedAt(log?.createdAt)}`
        )
      }
      className="cursor-pointer hover:bg-gray-900 w-full border-b border-gray-900 py-3 px-2 grid grid-cols-4 gap-2 items-center"
    >
      {/* Timestamp */}
      <div className="text-white">
        {log?.createdAt ? formatCreatedAt(log.createdAt) : "No date"}
      </div>

      {/* Description + Route Key + Status Summary */}
      <div className="flex flex-col justify-center text-white">
        <span className="font-medium">{formattedRouteKey}</span>
        <span className="text-xs text-gray-400">
          was {before?.is_enabled ? "enabled" : "disabled"} → now{" "}
          {after?.is_enabled ? "enabled" : "disabled"}
        </span>
      </div>

      {/* Status badge */}
      <div className="flex items-center px-2">
        <span
          className={`text-white w-30 rounded-sm flex justify-center py-1 ${statusColor}`}
        >
          {statusText}
        </span>
      </div>

      {/* Username */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          navigateTo("user", log?.user?.fname+" "+ log?.user?.lname);
        }}
        className="text-white flex flex-col w-full h-full hover:text-gray-400"
      >
        <span>{log?.user?.username || "No user info"}</span>
        <span className="text-xs text-gray-400 hover:text-gray-200">
          {log?.user?.fname || "No user info"}{" "}
          {log?.user?.lname || "No user info"}
        </span>
      </div>
    </div>
  );
};

export default ConfigLogslist;
