import axiosClient from "@/lib/axiosClient";
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PopupModal from "@/components/modals/PopupModal";
import { useSocketClient } from "@/context/authContext";
import BackButton from "@/components/buttons/BackButton";
import { EmptyMessage, ErrorBox, LoadingSpinner } from "@/components/list/commons";
import { ViewUserItem, ViewUserSessionItem } from "@/components/list/ViewUserlist";

const ViewUser = () => {
  const [userData, setUserData] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocketClient();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const codedFullName = decodeURIComponent(
    pathSegments[pathSegments.length - 1]
  );
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
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUserChange = () => {
      // console.log("[Socket] UserSession dbChange received – fetching sessions");
      fetchSessions();
    };

    socket.onDbChange("UserSession", "*", handleUserChange);

    return () => {
      socket.offDbChange("UserSession", "*", handleUserChange);
    };
  }, [socket]);

  const user = useMemo(() => userData, [userData]);
  const sessions = useMemo(() => user?.sessions || [], [user]);

  const handleDetails = (session) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
  };

  const handleSessionFilter = () => {
    if (selectedSession) {
      navigate("/admin/logs", {
        state: {
          date: selectedSession.loginAt,
          search: user.username,
          role: user.roleId,
        },
      });
      setIsDetailsOpen(false);
      setSelectedSession(null);
    }
  };

  const handleCancelConfirm = () => {
    setIsDetailsOpen(false);
    setSelectedSession(null);
  };

  return (
    <>
      <div className="w-full h-full flex 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
        <div className="flex flex-col lg:flex-row w-full h-full border-t border-[#373737] pt-5 overflow-scroll">
          <div className="p-1 w-full min-w-fit h-full border-b border-[#373737] flex flex-col pt-4  gap-y-10">
            <BackButton />
            {sessionError ? (
              <ErrorBox message={sessionError} />
            ) : (
              <>
                {!user ? (
                  <EmptyMessage message="N/A" />
                ) : (
                  <ViewUserItem user={user} />
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
              <div className="relative w-full h-full">
                {/* Overlayed Spinner */}
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center ">
                    <LoadingSpinner />
                  </div>
                )}

                {/* Error State */}
                {sessionError ? (
                  <ErrorBox message={sessionError} />
                ) : sessions.length > 0 ? (
                  sessions
                    .sort((a, b) => new Date(b.loginAt) - new Date(a.loginAt))
                    .map((session) => (
                      <ViewUserSessionItem
                        key={session.id}
                        session={session}
                        onClick={() => handleDetails(session)}
                      />
                    ))
                ) : !isLoading && sessions.length === 0 ? (
                  <EmptyMessage message="Empty user sessions!" />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PopupModal
        isOpen={isDetailsOpen}
        onClose={handleSessionFilter}
        title="Session Details"
        message={
          selectedSession
            ? `Session #${selectedSession.id ?? "N/A"}` +
              `\nStart: ${
                selectedSession.loginAt
                  ? new Date(selectedSession.loginAt).toLocaleString()
                  : "N/A"
              }` +
              `\nEnd: ${
                selectedSession.logoutAt
                  ? new Date(selectedSession.logoutAt).toLocaleString()
                  : "Active"
              }` +
              `\nTotal Duration: ${
                selectedSession.logoutAt && selectedSession.loginAt
                  ? `${Math.round(
                      (new Date(selectedSession.logoutAt) -
                        new Date(selectedSession.loginAt)) /
                        60000
                    )} min`
                  : selectedSession.loginAt
                  ? "Ongoing"
                  : "N/A"
              }`
            : "Select a session to view details."
        }
        buttonText="View Logs for this Session"
        type="info"
        theme="dark"
      />
    </>
  );
};

export default ViewUser;
