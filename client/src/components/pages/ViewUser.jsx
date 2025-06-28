import axiosClient from "../../lib/axiosClient";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import PopupModal from "../modals/PopupModal";
import { useSocketClient } from "../../context/authContext";
import {
  EmptyMessage,
  ErrorBox,
  LoadingSpinner,
  rolePermissions,
} from "../list/commons";
import {ViewUserItem, ViewUserSessionItem} from "../list/ViewUserlist";

const ViewUser = () => {
  const [userData, setUserData] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const socket = useSocketClient();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const codedFullName = decodeURIComponent(pathSegments[pathSegments.length - 1]);
  const fullName = atob(codedFullName);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setSessionError(null);

      const { data } = await axiosClient.get(`/auth/user/${fullName}`);
      if (Array.isArray(data) && data.length > 0) {
        setUserData(data[0]);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      setSessionError("Failed to load sessions.");
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const handleUserChange = () => fetchSessions();

    if (socket) {
      socket.onDbChange("UserSession", "*", handleUserChange);
    }

    return () => {
      if (socket) {
        socket.offDbChange("UserSession", "*", handleUserChange);
      }
    };
  }, [socket]);

  const user = useMemo(() => userData, [userData]);
  const sessions = useMemo(() => user?.sessions || [], [user]);


  const handleDetails = (message) => {
    setPopupMessage(message);
    setIsDetailsOpen(true);
  };

  return (
    <>
      <div className="w-full h-full p-5 flex 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
        <div className="flex flex-col lg:flex-row w-full h-full border-t border-[#373737] pt-5 overflow-scroll">
          <div className="w-full h-full border-b border-[#373737] flex flex-col pt-4 px-10 gap-y-10">
            {sessionError ? (
              <ErrorBox message={sessionError}/>
            ) : (
              <>
                {!user ? (<EmptyMessage message="N/A"/>):(
                  // <>
                  //   <div className="w-[50rem] border-b border-[#373737] min-h-fit pb-10 text-xl flex items-center gap-x-4">
                  //     <div className="min-w-50 min-h-50 border-4 rounded-lg">
                  //       <svg
                  //         xmlns="http://www.w3.org/2000/svg"
                  //         width="32"
                  //         height="32"
                  //         viewBox="0 0 24 24"
                  //         fill="none"
                  //         strokeWidth="1"
                  //         strokeLinecap="round"
                  //         strokeLinejoin="round"
                  //         className="stroke-white w-full h-auto"
                  //       >
                  //         <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                  //         <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                  //         <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  //         <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                  //       </svg>
                  //     </div>

                  //     <div className="w-full h-full flex flex-col justify-center">
                  //       <span className="mt-5 w-fit text-4xl font-semibold">
                  //         #{user.username}
                  //       </span>
                  //       <div className="flex w-full h-fit gap-x-2">
                  //         <span className="text-6xl font-semibold">
                  //           {user.fname} {user.lname}
                  //         </span>
                  //       </div>
                  //     </div>
                  //   </div>

                  //   <div className="w-[50rem] border-b gap-y-4 pb-10 border-[#373737] min-h-fit flex flex-col">
                  //     <div className="flex flex-col">
                  //       <span className="text-[#949494] text-lg">Position</span>
                  //       <span className="text-3xl font-semibold">
                  //         {user.position || "N/A"}
                  //       </span>
                  //     </div>

                  //     <div className="flex flex-col">
                  //       <span className="text-[#949494] text-lg">Email</span>
                  //       <span className="text-3xl font-semibold">
                  //         {user.email || "N/A"}
                  //       </span>
                  //     </div>

                  //     <div className="flex flex-col">
                  //       <span className="text-[#949494] text-lg">Contact</span>
                  //       <span className="text-3xl font-semibold">
                  //         {user.contact || "N/A"}
                  //       </span>
                  //     </div>

                  //     <div className="flex flex-col">
                  //       <span className="text-[#949494] text-lg">Role</span>
                  //       <span className="text-3xl font-semibold">
                  //         {renderRole(user.roleId)}
                  //       </span>
                  //     </div>
                  //   </div>

                  //   <div className="w-[50rem] pb-10 min-h-fit flex flex-col">
                  //     <div className="flex gap-y-3 flex-col">
                  //       <span className="text-4xl font-semibold">
                  //         Session Logs
                  //       </span>
                  //       <span className="w-[30rem] leading-tight text-xl text-[#9c9c9c]">
                  //         The session log table records user login sessions,
                  //         including last login timestamp, session start/end
                  //         times, and duration.
                  //       </span>
                  //     </div>
                  //   </div>
                  // </>
                  <ViewUserItem user={user}/>
                )}
              </>
            )}
          </div>

          <div className="select-none border-[#373737] border-b min-w-[60rem] h-full px-4 pt-4 flex flex-col gap-y-4 overflow-scroll">
            <span className="text-2xl font-semibold w-fit">Session Logs</span>
            <div className="w-full min-w-fit min-h-fit grid text-xl grid-cols-4">
              <div className="py-2 pl-2 border-gray-600">Last Active</div>
              <div className="py-2 pl-2 border-gray-600">Start</div>
              <div className="py-2 pl-2 border-gray-600">End</div>
              <div className="py-2 pl-2 border-gray-600">Duration</div>
            </div>

            <div className="w-full h-[59rem] overflow-y-auto flex flex-col border-t-1 border-gray-600">
              {isLoading ? (
                <LoadingSpinner />
              ) : sessionError ? (
                <ErrorBox message={sessionError} />
              ) : sessions.length > 0 ? (
                sessions
                  .sort((a, b) => new Date(b.loginAt) - new Date(a.loginAt))
                  .map((session) => (
                    <ViewUserSessionItem
                      key={session.id}
                      session={session}
                      onClick={handleDetails}
                    />
                  ))
              ) : (
                <EmptyMessage message="Empty user sessions!" />
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
