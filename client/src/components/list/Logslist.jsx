import { useNavigate } from "react-router-dom";
import { rolePermissions, roleColorMap, actionMap } from "./commons";

const LogItem = ({ log, formatCreatedAt }) => {
  const logRoleId = log.user.roleId ?? "default";
  const navigate = useNavigate();

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
      className="w-full min-w-fit min-h-15 py-1 border-b border-gray-600 grid-cols-5 grid cursor-pointer hover:bg-gray-900"
    >
      <div className="col-span-1 flex flex-col justify-center pl-5 border-gray-600">
        {log.user.fname === "System" && log.user.lname === "Account" ? (
          <>
            <span className="text-xl">System Generated</span>
            <span
              className={`font-semibold text-xs w-27 text-center py-1 px-1 rounded-md ${roleColorMap[logRoleId]}`}
            >
              System
            </span>
          </>
        ) : (
          <>
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigateTo("user", log.user.fname + " " + log.user.lname);
              }}
              className="text-xl z-100 w-fit hover:text-gray-400"
            >
              {log.user.fname + " " + log.user.lname}
            </span>

            <span
              onClick={(e) => {
                e.stopPropagation();
                navigateTo("user", log.user.fname + " " + log.user.lname);
              }}
              className={`font-semibold text-xs w-27 text-center py-1 px-1 rounded-md ${roleColorMap[logRoleId]}`}
            >
              {rolePermissions[logRoleId]}
            </span>
          </>
        )}
      </div>

      <div className="col-span-1 flex items-center pl-5 border-gray-600">
        <span className="text-xl">{formatCreatedAt(log.createdAt)}</span>
      </div>

      <div className="col-span-1 flex items-center pl-5 border-gray-600">
        <span className="text-xl">{log.model.toUpperCase()}</span>
      </div>

      <div className="col-span-1 flex items-center pl-5 border-gray-600">
        <span
          className={`text-xl w-40 rounded-md text-center py-1 font-semibold ${
            actionMap[log.action]
          }`}
        >
          {log.action.toUpperCase()}
        </span>
      </div>

      <div className="col-span-1 flex items-center px-5 border-gray-600">
        <span className="text-xl max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
          {log.description}
        </span>
      </div>
    </div>
  );
};

export default LogItem;
