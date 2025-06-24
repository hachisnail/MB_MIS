import axiosClient from "../../lib/axiosClient";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import PopupModal from "../modals/PopupModal";
import SocketClient from "../../lib/socketClient";

const socketUrl = import.meta.env.VITE_SOCKET_URL;

const ViewUser = () => {
  const [logs, setLogs] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const location = useLocation();
  const socketRef = useRef(null);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const fullName = decodeURIComponent(pathSegments[pathSegments.length - 1]);

  const fetchSessions = async () => {
    try {
      const response = await axiosClient.get(`/auth/user/${fullName}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setLogs([response.data[0]]);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  useEffect(() => {
    fetchSessions();

    const socket = new SocketClient(socketUrl);
    socketRef.current = socket;

    const handleUserChange = (action, data) => {
      fetchSessions();
    };

    socket.onDbChange("UserSession", "*", handleUserChange);

    return () => {
      socket.offDbChange("UserSession", "*", handleUserChange);
      socket.disconnect();
    };
  }, []);

  const renderRole = (roleId) => {
    const mapping = {
      1: "Admin",
      2: "Content Manager",
      3: "Viewer",
      4: "Reviewer",
    };
    return mapping[String(roleId)] || "Unknown";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-US", { dateStyle: "short" });
    const timePart = date.toLocaleTimeString("en-US", { timeStyle: "short" });

    return (
      <div className="flex flex-col leading-tight">
        <span className="text-sm text-gray-300 border-r-1 border-gray-600">{datePart}</span>
        <span className="text-base border-r-1 border-gray-600">{timePart}</span>
      </div>
    );
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return "-";
    const durationMs = new Date(end) - new Date(start);
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return (
      <div className="flex border-r-1 border-gray-600 h-10 items-center">
        <span className="w-7 ">{`${hours}h `}</span>
        <span className="w-7">{`${remainingMinutes}m`}</span>
      </div>
    );
  };

  const formatDateAsString = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const formatDurationAsString = (start, end) => {
    if (!start || !end) return "N/A";
    const durationMs = new Date(end) - new Date(start);
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleDetails = (message) => {
    setPopupMessage(message);
    setIsDetailsOpen(true);
  };

  const user = logs[0];
  const sessions = user?.sessions || [];

  return (
    <>
      <div className="w-full h-full p-5 flex 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
        <div className="flex flex-col lg:flex-row w-full h-full border-t border-[#373737] pt-5 overflow-scroll">
          <div className="w-full h-full flex flex-col pt-4 px-4 gap-y-4">
            {user && (
              <>
                <div className="w-full h-60 text-xl flex items-center gap-x-4">
                  <div className="min-w-50 min-h-50 border-4 border-gray-[#373737] rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="stroke-white w-full h-auto"
                    >
                      <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                    </svg>
                  </div>

                  <div className="w-full h-full flex flex-col  pb-10 gap-y-4">
                    <div className="w-full flex h-40 items-start justify-between">
                      <span className="mt-5 w-fit text-6xl font-semibold ">
                        #{user.username}
                      </span>
                      <span className="text-2xl mt-2 font-bold mr-5 bg-[#373737] text-center w-30 py-2 rounded-sm border-1 border-[#a6a6a6]">
                        {renderRole(user.roleId)}
                      </span>
                    </div>
                    <div className="w-full h-fit flex flex-col gap-y-1">
                      <div className="flex w-full h-fit gap-x-2">
                        <span className="w-25 text-right">First Name</span>
                        <span className="text-2xl font-semibold">{user.fname}</span>
                      </div>
                      <div className="flex w-full h-fit gap-x-2">
                        <span className="w-25 text-right">Last Name</span>
                        <span className="text-2xl font-semibold">{user.lname}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-40 flex flex-col">
                  <span className="text-3xl font-semibold mb-2">Contact Information</span>
                  <div className="flex w-full h-fit gap-x-2">
                    <span className="w-25 text-right text-xl">Email</span>
                    <span className="text-2xl font-semibold">{user.email}</span>
                  </div>
                  <div className="flex w-full h-fit gap-x-2">
                    <span className="w-25 text-right text-xl">Contact</span>
                    <span className="text-2xl font-semibold">{user.contact}</span>
                  </div>
                  <div className="flex w-full h-fit gap-x-2">
                    <span className="w-25 text-right text-xl">Position</span>
                    <span className="text-2xl font-semibold">{user.position || "N/A"}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="border-l select-none border-[#373737] min-w-[60rem] h-full px-4 pt-4 flex flex-col gap-y-4 overflow-scroll">
            <span className="text-2xl font-semibold w-fit">Session Logs</span>
            <div className="w-full min-w-fit min-h-fit grid text-xl grid-cols-4 ">
              <div className="py-2 pl-2 border-r border-gray-600">Last Active</div>
              <div className="py-2 pl-2 border-r border-gray-600">Start</div>
              <div className="py-2 pl-2 border-r border-gray-600">End</div>
              <div className="py-2 pl-2 border-r border-gray-600">Duration</div>
            </div>

            <div className="w-full h-[59rem] overflow-y-auto flex flex-col border-y-1 border-gray-600">
              {sessions.length > 0 ? (
                sessions
                  .sort((a, b) => new Date(b.loginAt) - new Date(a.loginAt))
                  .map((session) => (
                    <div
                      key={session.id}
                      className="w-full select-none grid grid-cols-4 cursor-pointer hover:bg-gray-900 items-center border-b-1 border-gray-600 text-base"
                      onClick={() => {
                        const summary =
                          session.logoutAt != null
                            ? `Session from ${formatDateAsString(session.loginAt)} to ${formatDateAsString(session.logoutAt)} with a duration of ${formatDurationAsString(session.loginAt, session.logoutAt)}.`
                            : `User is still active. Logged in at ${formatDateAsString(session.loginAt)}.`;
                        handleDetails(summary);
                      }}
                    >
                      <div className="py-2 pl-2 ">
                        {session.isOnline ? (
                          <div className="border-r-1 border-gray-600 w-full h-10 flex items-center">
                            <span className="text-green-500">Online</span>
                          </div>
                        ) : (
                          formatDate(session.logoutAt)
                        )}
                      </div>
                      <div className="py-2 pl-2 ">{formatDate(session.loginAt)}</div>
                      <div className="py-2 pl-2">
                        {session.logoutAt ? (
                          formatDate(session.logoutAt)
                        ) : (
                          <div className="h-10 flex items-center border-r-1 border-gray-600"><span>Still Active</span></div>
                        )}
                      </div>
                      <div className="py-2 pl-2">
                        {session.logoutAt ? (
                          formatDuration(session.loginAt, session.logoutAt)
                        ) : (
                          <div className="h-10 flex w-full items-center border-r-1 border-gray-600"><span className="font-semibold">-</span></div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="w-full h-full flex items-center justify-center py-6">
                  <span className="text-[#9C9C9C] text-xl">No sessions found.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PopupModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Session Details"
        message={popupMessage}
        buttonText="Ok"
        type="info"
        theme="dark"
      />
    </>
  );
};

export default ViewUser;
