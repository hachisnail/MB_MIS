import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import SocketClient from "../../lib/socketClient";
import { SearchBar, CardDropdownPicker } from "../../features/Utilities";
import axiosClient from "../../lib/axiosClient";
import TimelineDatePicker from "../../features/TimelineDatePicker";

const socketUrl = import.meta.env.VITE_SOCKET_URL;

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const socketRef = useRef(null);

  const matchesFilter = (value, filter) => {
    return filter === "*" || filter === "" || value === filter || value === parseInt(filter);
  };

  const fetchLogs = async () => {
    try {
      const response = await axiosClient.get(`/auth/logs`, {
        withCredentials: true,
      });
      setLogs(response.data);
    } catch (err) {
      console.error("Failed to fetch logs!", err);
    }
  };

  useEffect(() => {
    fetchLogs();

    const socket = new SocketClient(socketUrl);
    socketRef.current = socket;

    const handleUserChange = (action, data) => {
      console.log(`Silent refresh triggered from socket: ${action}`, data);
      fetchLogs();
    };

    socket.onDbChange("Log", "*", handleUserChange);

    return () => {
      socket.offDbChange("Log", "*", handleUserChange);
      socket.disconnect();
    };
  }, []);

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

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleDateFilter = (date) => {
    setSelectedDate(date);
  };

const filtered = logs.filter((log) => {
  const searchableString = [
    log.user.fname,
    log.user.lname,
    log.model,
    log.action,
    log.description,
    formatCreatedAt(log.createdAt),
  ].join(" ").toLowerCase();

  const matchesSearch = searchableString.includes(searchQuery);
  const matchesRole = matchesFilter(log.user.roleId, selectedRole);
  const matchesAction = matchesFilter(log.action, selectedAction);
  const matchesDate = selectedDate
    ? new Date(log.createdAt).toDateString() === new Date(selectedDate).toDateString()
    : true;

  return matchesSearch && matchesRole && matchesAction && matchesDate;
});



  return (
    <div className="w-full min-w-fit h-full pt-5 max-w-[137rem] 1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-w-[175rem] 3xl:max-h-[88rem]">
      <div className="w-full h-full flex flex-col gap-y-[2rem]">
        <div className="w-full h-fit flex gap-x-3">
          <SearchBar theme="dark" onChange={handleSearch} />
          <CardDropdownPicker
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Filter by role"
            theme="dark"
            options={[
              { value: "*", label: "Filter by role" },
              { value: "1", label: "Admin" },
              { value: "2", label: "Content Manager" },
              { value: "3", label: "Viewer" },
              { value: "4", label: "Reviewer" },
            ]}
          />
          <CardDropdownPicker
            value={selectedAction}
            onChange={setSelectedAction}
            placeholder="Filter by action"
            theme="dark"
            options={[
              { value: "*", label: "Filter by action" },
              { value: "login", label: "Login" },
              { value: "logout", label: "Logout" },
              { value: "create", label: "Create" },
              { value: "update", label: "Update" },
              { value: "soft-delete", label: "Soft Delete" },
              { value: "delete", label: "Delete" },
            ]}
          />
          <TimelineDatePicker onDateChange={handleDateFilter} theme="dark" />

        </div>

        <div className="w-full h-full flex flex-col ">
          {/* Table Header */}
          <div className="w-full min-w-fit h-12 grid grid-cols-5">
            {["User", "Timestamp", "Tab", "Action", "Description"].map((label) => (
              <div
                key={label}
                className="h-10 min-w-fit border-gray-600 flex pl-5 items-center border-r-1 col-span-1"
              >
                <span className="text-2xl">{label}</span>
              </div>
            ))}
          </div>

          <div className="w-full h-[61rem] pt-2 border-t-1 border-gray-600 flex flex-col gap-y-2 overflow-scroll">
            {filtered.length > 0 ? (
              filtered.map((logs) => {
                const roleColorMap = {
                  1: "bg-[#6F3FFF]",
                  2: "bg-blue-500",
                  3: "bg-gray-400",
                  4: "bg-[#FF6666]",
                };

                const rolePermissions = {
                  1: "Admin",
                  2: "Content Manager",
                  3: "Viewer",
                  4: "Reviewer",
                };

                const actionMap = {
                  create: "text-green-400",
                  update: "text-blue-400",
                  delete: "text-red-400",
                  "soft-delete": "text-yellow-400",
                  login: "text-emerald-400",
                  logout: "text-gray-400",
                };

                const encoded = btoa(
                  logs.id + " " + logs.action + " " + formatCreatedAt(logs.createdAt)
                );

                return (
                  <NavLink key={logs.id} to={`${encoded}`}>
                    <div className="w-full min-w-fit min-h-15 py-1 border-b border-gray-600 grid-cols-5 grid cursor-pointer hover:bg-gray-900">
                      <div className="col-span-1 flex flex-col justify-center pl-5 border-r border-gray-600">
                        <span className="text-xl">
                          {logs.user.fname + " " + logs.user.lname}
                        </span>
                        <span
                          className={`text-xs w-fit px-1 rounded-sm ${
                            roleColorMap[logs.user.roleId]
                          }`}
                        >
                          {rolePermissions[logs.user.roleId]}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
                        <span className="text-xl">{formatCreatedAt(logs.createdAt)}</span>
                      </div>
                      <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
                        <span className="text-xl">{logs.model}</span>
                      </div>
                      <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
                        <span className={`text-xl font-semibold ${actionMap[logs.action]}`}>
                          {logs.action.toUpperCase()}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center px-5 border-r border-gray-600">
                        <span className="text-xl max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
                          {logs.description}
                        </span>
                      </div>
                    </div>
                  </NavLink>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center py-6">
                <span className="text-[#9C9C9C] text-xl">No activities!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
