import { useState, useEffect, useRef, act } from "react";
import SocketClient from "../../lib/socketClient";
import SearchBar from "../../components/modals/SearchBar";
import axiosClient from "../../lib/axiosClient";

const socketUrl = import.meta.env.VITE_SOCKET_URL;

const Logs = () => {
  const [logs, setLogs] = useState([]);

  const socketRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const response = await axiosClient.get(`/auth/logs`, {
        withCredentials: true,
      });
      setLogs(response.data);
      console.log(response.data);
    } catch (err) {
      // setFlagsError("Failed to ferch users!");
    } finally {
      // setIsLoading(false);
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
      weekday: "short", // e.g., "Tue"
      year: "numeric", // e.g., "2025"
      month: "short", // e.g., "Jun"
      day: "2-digit", // e.g., "24"
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="w-full min-w-fit h-full pt-5 max-w-[137rem]  1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-w-[175rem] 3xl:max-h-[88rem]">
      <div className="w-full h-full flex flex-col gap-y-[2rem]">
        <div className="w-full h-fit flex">
          {/* header with searchbar */}
          <SearchBar theme="dark" />
        </div>

        <div className="w-full h-full flex flex-col justify-between">
          {/* table container */}
          <div className="w-full min-w-fit h-fit grid grid-cols-6">
            {/* table headers */}
            <div className="h-10 min-w-fit border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">ID</span>
            </div>
            <div className="h-10 min-w-fit border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">User</span>
            </div>
            <div className="h-10 min-w-fit border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">Timestamp</span>
            </div>
            <div className="h-10 min-w-fit border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">Tab</span>
            </div>
            <div className="h-10 min-w-fit border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">Action</span>
            </div>
            <div className="h-10 min-w-fit border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">Description</span>
            </div>
          </div>

          <div className="w-full max-h-[61rem] border-t-1 border-gray-600 flex flex-col gap-y-2 overflow-scroll">
            {/* table content */}
            {logs.length > 0 ? (
              logs.map((logs) => {
                const actionMap = {
                  create: "text-green-400",
                  update: "text-blue-400",
                  delete: "text-red-400",
                  "soft-delete": "text-yellow-400",
                  login: "text-emerald-400",
                  logout: "text-gray-400",
                };

                return (
                  <div
                    key={logs.id}
                    className="w-full min-w-fit min-h-15 py-1 border-b border-gray-600 grid-cols-6 grid cursor-pointer hover:bg-gray-900"
                  >
                    <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
                      <span className="text-xl">{logs.id}</span>
                    </div>
                    <div className="col-span-1 flex flex-col justify-center pl-5 border-r border-gray-600">
                      <span className="text-xl flex ">
                        {logs.user.fname + " " + logs.user.lname}
                      </span>
                      <span className="text-xs w-fit px-1 rounded-sm bg-green-500">
                        {logs.user.position}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
                      <span className="text-xl">
                        {formatCreatedAt(logs.createdAt)}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
                      <span className="text-xl">{logs.model}</span>
                    </div>
                    <div className="col-span-1 flex items-center pl-5 border-r border-gray-600">
                      <span
                        className={`text-xl font-semibold ${
                          actionMap[logs.action]
                        }`}
                      >
                        {logs.action.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center px-5 border-r border-gray-600">
                      <span className="text-xl max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
                        {logs.description}
                      </span>
                    </div>
                  </div>
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
