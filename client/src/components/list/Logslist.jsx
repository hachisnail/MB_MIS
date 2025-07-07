import { NavLink } from "react-router-dom";

import { rolePermissions, roleColorMap, actionMap } from "./commons";


const LogItem = ({ log, formatCreatedAt }) => {
  
  const logRoleId = log.user.roleId ?? 'default';

  const encoded = btoa(
    `${log.id} ${log.action} ${formatCreatedAt(log.createdAt)}`
  );

  return (
    <NavLink key={log.id} to={encoded}>
      <div className="w-full min-w-fit min-h-15 py-1 border-b border-gray-600 grid-cols-5 grid cursor-pointer hover:bg-gray-900">
        <div className="col-span-1 flex flex-col justify-center pl-5  border-gray-600">
          <span className="text-xl ">
            {log.user.fname + " " + log.user.lname}
          </span>
          <span
            className={` font-semibold text-xs w-27 text-center py-1  px-1 rounded-md ${
              roleColorMap[logRoleId]
            }`}
          >
            {rolePermissions[logRoleId]}
          </span>
        </div>
        <div className="col-span-1 flex items-center pl-5  border-gray-600">
          <span className="text-xl">{formatCreatedAt(log.createdAt)}</span>
        </div>
        <div className="col-span-1 flex items-center pl-5  border-gray-600">
          <span className="text-xl">{log.model.toUpperCase()}</span>
        </div>
        <div className="col-span-1 flex items-center  pl-5 border-gray-600">
          <span className={`text-xl w-40 rounded-md text-center py-1  font-semibold ${actionMap[log.action]}`}>
            {log.action.toUpperCase()}
          </span>
        </div>
        <div className="col-span-1 flex items-center px-5  border-gray-600">
          <span className="text-xl max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
            {log.description}
          </span>
        </div>
      </div>
    </NavLink>
  );
};

export default LogItem;
