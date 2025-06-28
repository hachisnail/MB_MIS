import { NavLink } from "react-router-dom";

import { rolePermissions, roleColorMap, actionMap } from "./commons";


const LogItem = ({ log, formatCreatedAt }) => {
  const encoded = btoa(
    `${log.id} ${log.action} ${formatCreatedAt(log.createdAt)}`
  );

  return (
    <NavLink key={log.id} to={encoded}>
      <div className="w-full min-w-fit min-h-15 py-1 border-b border-gray-600 grid-cols-5 grid cursor-pointer hover:bg-gray-900">
        <div className="col-span-1 flex flex-col justify-center pl-5 border-r border-gray-600">
          <span className="text-xl">
            {log.user.fname + " " + log.user.lname}
          </span>
          <span
            className={`text-xs w-fit px-1 rounded-sm ${
              roleColorMap[log.user.roleId]
            }`}
          >
            {rolePermissions[log.user.roleId]}
          </span>
        </div>
        <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
          <span className="text-xl">{formatCreatedAt(log.createdAt)}</span>
        </div>
        <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
          <span className="text-xl">{log.model}</span>
        </div>
        <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
          <span className={`text-xl font-semibold ${actionMap[log.action]}`}>
            {log.action.toUpperCase()}
          </span>
        </div>
        <div className="col-span-1 flex items-center px-5 border-r border-gray-600">
          <span className="text-xl max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
            {log.description}
          </span>
        </div>
      </div>
    </NavLink>
  );
};

export default LogItem;
