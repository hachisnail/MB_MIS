import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { SearchBar, CardDropdownPicker } from "../../features/Utilities";
import axiosClient from "../../lib/axiosClient";
import TimelineDatePicker from "../../features/TimelineDatePicker";
import { useSocketClient } from "../../context/authContext";
import LogItem from "../../components/list/Logslist";
import {
  LoadingSpinner,
  ErrorBox,
  EmptyMessage,
} from "../../components/list/commons";
import { rolePermissions, actionLabels } from "../../components/list/commons";


const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const socket = useSocketClient();

  const matchesFilter = (value, filter) => {
    return (
      filter === "*" ||
      filter === "" ||
      value === filter ||
      value === parseInt(filter)
    );
  };

  const fetchLogs = async () => {
    try {
      setErrorLogs(null);
      setIsLoading(true);
      const response = await axiosClient.get(`/auth/logs`, {
        withCredentials: true,
      });
      setLogs(response.data);
    } catch (error) {
      // console.error("Failed to fetch logs!", err);
      setErrorLogs("Failed to fetch logs!\n" + error);
    } finally {
      setIsLoading(false);
    }
  };

    const uniqueRoles = Array.from(
    new Set(logs.map((log) => log.user?.roleId))
  ).filter(Boolean);

  const roleOptions = [
    { value: "*", label: "Filter by role" },
    ...uniqueRoles.map((roleId) => ({
      value: String(roleId),
      label: rolePermissions[roleId] || `Role ${roleId}`,
    })),
  ];

  const uniqueActions = Array.from(
  new Set(logs.map((log) => log.action))
).filter(Boolean);

const actionOptions = [
  { value: "*", label: "*" },
  ...uniqueActions.map((action) => ({
    value: action,
    label: actionLabels[action] || action,
  })),
];

  useEffect(() => {
    fetchLogs();

    const handleLogChange = () => fetchLogs();

    if (socket) {
      socket.onDbChange("Log", "*", handleLogChange);
    }

    return () => {
      if (socket) {
        socket.offDbChange("Log", "*", handleLogChange);
      }
    };
  }, [socket]);

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
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableString.includes(searchQuery);
    const matchesRole = matchesFilter(log.user.roleId, selectedRole);
    const matchesAction = matchesFilter(log.action, selectedAction);
    const matchesDate = selectedDate
      ? new Date(log.createdAt).toDateString() ===
        new Date(selectedDate).toDateString()
      : true;

    return matchesSearch && matchesRole && matchesAction && matchesDate;
  });

  return (
    <div className="w-full min-w-fit h-full pt-5 max-w-[137rem] 1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-w-[175rem] 3xl:max-h-[88rem]">
      <div className="w-full h-full flex flex-col gap-y-[2rem]">
        <div className="w-full h-fit flex gap-x-3">
          {/* searchbar */}
          <SearchBar theme="dark" onChange={handleSearch} />

          <CardDropdownPicker
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Filter by role"
            theme="dark"
            options={roleOptions}
          />

          <CardDropdownPicker
            value={selectedAction}
            onChange={setSelectedAction}
            placeholder="Filter by action"
            theme="dark"
            options={actionOptions}
          />

          <TimelineDatePicker onDateChange={handleDateFilter} theme="dark" />
        </div>

        <div className="w-full h-full flex flex-col ">
          {/* Table Header */}
          <div className="w-full min-w-fit h-12 grid grid-cols-5">
            {["User", "Timestamp", "Tab", "Action", "Description"].map(
              (label) => (
                <div
                  key={label}
                  className="h-10 min-w-fit flex pl-5 items-center col-span-1"
                >
                  <span className="text-2xl font-semibold">{label}</span>
                </div>
              )
            )}
          </div>

          <div className="w-full h-[61rem]  border-t-1 border-gray-600 flex flex-col overflow-scroll">
            {isLoading ? (
              <LoadingSpinner />
            ) : errorLogs ? (
              <ErrorBox message={errorLogs} />
            ) : filtered.length > 0 ? (
              filtered.map((log) => (
                <LogItem key={log.id} log={log} formatCreatedAt={formatCreatedAt} />
              ))
            ) : (
              <EmptyMessage message="Empty logs" />
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
