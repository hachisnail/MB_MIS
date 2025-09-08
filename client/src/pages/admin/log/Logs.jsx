import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { SearchBar, CardDropdownPicker } from "../../../features/Utilities";
import axiosClient from "../../../lib/axiosClient";
import TimelineDatePicker from "../../../features/TimelineDatePicker";
import { useSocketClient } from "../../../context/authContext";
import LogItem from "./components/Logslist";
import ListRenderer from "../../../components/tables/ListRenderer";
import { rolePermissions, actionLabels } from "../../../components/commons";
import { TableHeaderContainer } from "../../../features/Utilities";
import { debounce } from "../../../lib/debounce";

const Logs = () => {
  const location = useLocation();
  const [logs, setLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [selectedDate, setSelectedDate] = useState(""); // UI single-date picker
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Range filters (params only)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const socket = useSocketClient();

  // Accept filter params from navigation (supports both start/end and startDate/endDate)
  useEffect(() => {
    if (location.state) {
      if (location.state.role) setSelectedRole(location.state.role);
      if (location.state.action) setSelectedAction(location.state.action);
      if (location.state.date) setSelectedDate(location.state.date);
      if (location.state.search)
        setSearchQuery(location.state.search.toLowerCase());

      // Accept date range params: prefer explicit start/end, fallback to startDate/endDate
      const s = location.state.start || location.state.startDate;
      const e = location.state.end || location.state.endDate;
      if (s) setStartDate(new Date(s));
      if (e) setEndDate(new Date(e));
    }
  }, [location.state]);

  const buildQueryParams = () => {
    const params = {};
    // search
    if (searchQuery && searchQuery.trim().length > 0) {
      params.q = searchQuery.trim();
    }
    // role filter
    if (selectedRole && selectedRole !== "*" && selectedRole !== "") {
      params.role = selectedRole;
    }
    // action filter
    if (selectedAction && selectedAction !== "*" && selectedAction !== "") {
      params.action = selectedAction;
    }
    // date vs range
    if (startDate && endDate) {
      params.start = startDate.toISOString();
      params.end = endDate.toISOString();
    } else if (selectedDate) {
      params.date = new Date(selectedDate).toISOString();
    }
    return params;
  };

  const fetchLogs = async (params = {}) => {
    try {
      setErrorLogs(null);
      setIsLoading(true);
      const response = await axiosClient.get(`/auth/logs`, {
        params,
        withCredentials: true,
      });
      setLogs(response.data);
    } catch (error) {
      setErrorLogs("Failed to fetch logs!\n" + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced fetcher to minimize client work
  const debouncedFetchRef = useRef(null);
  if (!debouncedFetchRef.current) {
    debouncedFetchRef.current = debounce((params) => {
      fetchLogs(params);
    }, 350);
  }

  // Role dropdown options
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

  // Action dropdown options
  const uniqueActions = Array.from(
    new Set(logs.map((log) => log.action))
  ).filter(Boolean);

  const actionOptions = [
    { value: "*", label: "Filter by action" },
    ...uniqueActions.map((action) => ({
      value: action,
      label: actionLabels[action] || action,
    })),
  ];

  // Initial load
  useEffect(() => {
    const params = buildQueryParams();
    fetchLogs(params);
  }, []);

  // Re-fetch logs on socket events
  useEffect(() => {
    if (!socket) return;

    const handleLogChange = () => {
      const params = buildQueryParams();
      fetchLogs(params);
    };

    socket.onDbChange("Log", "*", handleLogChange);

    return () => {
      socket.offDbChange("Log", "*", handleLogChange);
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
    setStartDate(null); // clear range when UI date is used
    setEndDate(null);
  };

  // Trigger debounced server-side fetch on filter changes
  useEffect(() => {
    const params = buildQueryParams();
    debouncedFetchRef.current(params);
  }, [searchQuery, selectedRole, selectedAction, selectedDate, startDate, endDate]);

  const logHeaders = [
    { label: "Actor", width: 15 },
    { label: "Timestamp", width: 18.5 },
    { label: "Tab", width: 13 },
    { label: "Action", width: 12.5 },
    { label: "Description" },
  ];

  return (
    <div className="w-full min-w-fit h-full 1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
      <div className="w-full h-full flex flex-col gap-y-[2rem]">
        <div className="w-full h-fit flex gap-x-3">
          {/* Controlled Date picker (still works for single-day filter) */}
          <TimelineDatePicker
            value={selectedDate}
            onDateChange={handleDateFilter}
            theme="dark"
          />

          {/* Controlled Searchbar */}
          <SearchBar
            theme="dark"
            value={searchQuery}
            onChange={handleSearch}
          />

          {/* Controlled Role dropdown */}
          <CardDropdownPicker
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Filter by role"
            theme="dark"
            options={roleOptions}
          />

          {/* Controlled Action dropdown */}
          <CardDropdownPicker
            value={selectedAction}
            onChange={setSelectedAction}
            placeholder="Filter by action"
            theme="dark"
            options={actionOptions}
          />
        </div>

        <div className="w-full h-full flex flex-col ">
          {/* Table Header */}
          <TableHeaderContainer headers={logHeaders} theme="dark" />

          <div className="w-full h-[52rem] border-t-1 border-[#373737] flex flex-col overflow-scroll">
            <div className="relative w-full h-full">
              <ListRenderer
                isLoading={isLoading}
                error={errorLogs}
                items={logs}
                emptyMessage="Empty logs"
                renderItem={(log) => (
                  <LogItem
                    key={log.id}
                    log={log}
                    formatCreatedAt={formatCreatedAt}
                    headers={logHeaders}
                    theme="dark"
                  />
                )}
                theme="dark"
                 paginate={true}   
                 itemsPerPage={25} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
