import { useNavigate } from "react-router-dom";
import { rolePermissions, roleColorMap, actionMap } from "../../../../components/list/commons";

const LogItem = ({ log, formatCreatedAt }) => {
  const navigate = useNavigate();

  const user = log.user;
  const fname = user?.fname || "Unknown";
  const lname = user?.lname || "";
  const isSystem = fname === "System" && lname === "Account";
  const fullName = `${fname} ${lname}`.trim();
  const roleId = user?.roleId ?? "default";

  const navigateTo = (path, endpoint) => {
    if (path === "user" && endpoint !== "System Account")
      return navigate(`/admin/user/${btoa(endpoint)}`);
    if (path === "log") return navigate(`${btoa(endpoint)}`);
  };

  return (
    <div
      onClick={() =>
        navigateTo(
          "log",
          `${log.id} ${log.action} ${formatCreatedAt(log.createdAt)}`
        )
      }

     
      className="w-full min-w-fit min-h-20 py-1 border-b border-gray-600 grid grid-cols-[15rem_18.5rem_13rem_12.5rem_1fr] cursor-pointer hover:bg-gray-900"
    >
      {/* Actor */}
      <div className="col-span-1 flex flex-col justify-center pl-5 border-gray-600">
        {isSystem ? (
          <>
            <span className="text-xl">System Generated</span>
            <span
              className={`font-semibold text-xs w-27 text-center py-1 px-1 rounded-md ${roleColorMap[roleId]}`}
            >
              System
            </span>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Timestamp */}
      <div className="col-span-1 flex items-center pl-5 border-gray-600">
        <span className="text-xl">{formatCreatedAt(log.createdAt)}</span>
      </div>

      {/* Model */}
      <div className="col-span-1 flex items-center pl-5 border-gray-600">
        <span className="text-xl">{log.model?.toUpperCase() || "N/A"}</span>
      </div>

      {/* Action */}
      <div className="col-span-1 flex items-center pl-5 border-gray-600">
        <span
          className={`text-xl w-40 rounded-md text-center py-1 font-semibold ${
            actionMap[log.action] || ""
          }`}
        >
          {log.action?.toUpperCase() || "UNKNOWN"}
        </span>
      </div>

      {/* Description */}
      <div className="col-span-1 flex items-center px-5 border-gray-600">
        <span className="text-xl max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
          {log.description || "No description"}
        </span>
      </div>
    </div>
  );
};

export default LogItem;
