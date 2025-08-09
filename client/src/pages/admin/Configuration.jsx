import { useState, useEffect } from "react";
import ConfigLogslist from "../../components/list/ConfigLogslist";
import axiosClient from "../../lib/axiosClient";
import { useSocketClient } from "../../context/authContext";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import FlagItem from "../../components/list/Flagslist";
import Toast from "../../features/Toast";
import StyledToggleSwitch from "../../components/buttons/StyledToggleSwitch";
import PopupModal from "../../components/modals/PopupModal";
import StyledButton from "../../components/buttons/StyledButton";
import {
  LoadingSpinner,
  ErrorBox,
  EmptyMessage,
} from "../../components/list/commons";
import { TableHeaderContainer } from "../../features/Utilities";

const Configuration = () => {
  const socket = useSocketClient();
  const [availableFlags, setAvailableFlags] = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagsError, setFlagsError] = useState("");
  const [updatingFlag, setUpdatingFlag] = useState(null);
  const [message, setMessage] = useState("");
  const [availableLogs, setLogs] = useState([]);
  const [logsLoading, setLogLoading] = useState();
  const [logsError, setLogsError] = useState();

  const [maintenanceConfirm, setMaintenanceConfirm] = useState({
    isOpen: false,
    isEnabling: false,
  });

  const [popupError, setPopupError] = useState({
    isOpen: false,
    title: "Operation Failed",
    message: "",
  });

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: "question",
    route_key: null,
    currentValue: null,
    title: "",
    message: "",
  });

  const [disabledClickInfo, setDisabledClickInfo] = useState({
    isOpen: false,
    route_key: "",
  });

  const getErrorMessage = (err) =>
    err.response?.data?.message || err.message || "Unexpected error occurred";

  const fetchFlags = async () => {
    try {
      setFlagsLoading(true);
      const { data } = await axiosClient.get("/auth/admin-flags");

      if (!data || !data.flags || data.flags.length === 0) {
        setFlagsError("No flags found.");
        return;
      }

      setAvailableFlags(data.flags);
    } catch (err) {
      console.error("Failed to load flags", err);
      setFlagsError("Failed to load flags");
    } finally {
      setFlagsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsError(null);
      setLogLoading(true);
      const response = await axiosClient.get(`/auth/logs?model=RouterFlag`, {
        withCredentials: true,
      });
      setLogs(response.data);
      // console.log(response.data);
    } catch (error) {
      // console.error("Failed to fetch logs!", error);
      setLogsError("Failed to fetch logs!\n" + error);
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleFlagChange = () => {
      fetchFlags();
      fetchLogs();
    };
    socket.onDbChange("Log", "*", handleFlagChange);
    return () => socket.offDbChange("Log", "*", handleFlagChange);
  }, [socket]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleToggle = async (route_key, currentValue) => {
    setUpdatingFlag(route_key);
    setMessage("");

    try {
      const { data } = await axiosClient.post("/auth/router-flags", {
        route_key,
        is_enabled: !currentValue,
      });

      setAvailableFlags((prev) =>
        prev.map((flag) => (flag.route_key === route_key ? data.flag : flag))
      );

      setMessage(
        `Flag '${route_key}' is now ${!currentValue ? "enabled" : "disabled"}`
      );
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setUpdatingFlag(null);
    }
  };

  const handleDisabledClick = (route_key) => {
    setDisabledClickInfo({ isOpen: true, route_key });
  };

  const handleFlagClick = (route_key, currentValue) => {
    const isMaintenanceOn = availableFlags.find(
      (f) => f.route_key === "maintenance"
    )?.is_enabled;

    if (isMaintenanceOn && route_key !== "maintenance") return;

    const isEnabling = !currentValue;
    setConfirmationModal({
      isOpen: true,
      type: isEnabling ? "question" : "warning",
      route_key,
      currentValue,
      title: isEnabling ? "Enable Feature" : "Disable Feature",
      message: isEnabling
        ? `Are you sure you want to enable the '${route_key}' feature?`
        : `Disabling '${route_key}' may impact system functionality. Proceed?`,
    });
  };

  const confirmToggle = () => {
    const { route_key, currentValue } = confirmationModal;
    handleToggle(route_key, currentValue);
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleMaintenanceConfirm = () => {
    const isMaintenanceOn = availableFlags.find(
      (f) => f.route_key === "maintenance"
    )?.is_enabled;
    setMaintenanceConfirm({ isOpen: true, isEnabling: !isMaintenanceOn });
  };

  const handleMaintenanceToggle = async () => {
    const isMaintenanceOn = availableFlags.find(
      (f) => f.route_key === "maintenance"
    )?.is_enabled;
    setMessage("");
    setUpdatingFlag("maintenance");

    try {
      const { data } = await axiosClient.post(
        "/auth/router-flags/maintenance",
        {
          enable: !isMaintenanceOn,
        }
      );

      await fetchFlags();
      setMessage(data.message || "Maintenance mode updated.");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setMessage(`Error: ${errorMsg}`);
      setPopupError({
        isOpen: true,
        title: "Maintenance Mode Error",
        message: errorMsg,
      });
    } finally {
      setUpdatingFlag(null);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 flags per page

  // Filter out the unwanted flags before pagination (like 'login', 'down', 'nomatch', 'maintenance')
  const filteredFlags = availableFlags.filter(
    ({ route_key }) =>
      !["login", "down", "nomatch", "maintenance"].includes(route_key)
  );

  // Slice the available flags based on pagination
  const currentFlags = filteredFlags.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle Next Page
  const handleNextPage = () => {
    if (currentPage * itemsPerPage < filteredFlags.length) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  // Handle Previous Page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const logHeaders = [
    {label:"TimeStamp"},
    {label:"Flag"},
    {label:"Status"},
    {label:"Actor"},
  ]

  return (
    <>
      <div className="w-full min-w-fit h-full  1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
        <div className="w-full h-full justify-center gap-x-5   flex  gap-y-[2rem]">
          <div className="w-[82rem] flex flex-col justify-between space-y-5 h-full ">
            <div className="h-15 border border-[#373737] flex items-center justify-center">
              <span className="text-xl">
                Some Buttons for editong about and other misc.
              </span>
            </div>
            <div className="flex justify-between items-center w-full border-b border-[#373737] pb-5">
              <div className="flex flex-col">
                <span className="text-2xl font-semibold mb-2">
                  Feature Flags
                </span>
                <span className="text-lg text-[#9C9C9C]">
                  Manage system features by configuring flags and controlling
                  access to pages.
                </span>
              </div>
              <div className="flex flex-col">
                <StyledToggleSwitch
                  enabled={
                    availableFlags.find((f) => f.route_key === "maintenance")
                      ?.is_enabled || false
                  }
                  onChange={handleMaintenanceConfirm}
                  label="Maintenance Mode"
                  toggleColor={{ on: "bg-red-600", off: "bg-zinc-600" }}
                  knobColor={{
                    on: "translate-x-6 bg-white",
                    off: "translate-x-1 bg-white",
                  }}
                />
                <span className="text-lg text-[#9C9C9C]">
                  Disables public pages.
                </span>
              </div>
            </div>

            <div className="w-full min-w-fit min-h-fit h-[49rem] flex  items-start justify-center">
              <div className="relative w-full h-full flex flex-wrap gap-2 justify-center">
                {/* Overlayed Spinner */}
                {flagsLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center ">
                    <LoadingSpinner />
                  </div>
                )}

                {/* Error State */}
                {flagsError ? (
                  <ErrorBox message={flagsError} />
                ) : currentFlags.length > 0 ? (
                  currentFlags
                    .sort((a, b) => b.is_public - a.is_public)
                    .map(({ route_key, is_enabled, is_public }) => {
                      const isMaintenanceOn = availableFlags.find(
                        (f) => f.route_key === "maintenance"
                      )?.is_enabled;
                      const isToggleable = route_key !== "maintenance";

                      return (
                        <FlagItem
                          key={route_key}
                          route_key={route_key}
                          is_enabled={is_enabled}
                          is_public={is_public}
                          updatingFlag={updatingFlag}
                          handleToggle={handleFlagClick}
                          disabled={isMaintenanceOn && isToggleable}
                          onDisabledClick={handleDisabledClick}
                        />
                      );
                    })
                ) : !flagsLoading && currentFlags.length === 0 ? (
                  <EmptyMessage message="Empty flags!" />
                ) : null}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between px-5 w-full mt-4 pt-2 border-t border-[#373737]">
              <StyledButton
                buttonColor="bg-gray-600"
                hoverColor="hover:bg-gray-800"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12l10 0" />
                  <path d="M4 12l4 4" />
                  <path d="M4 12l4 -4" />
                  <path d="M20 4l0 16" />
                </svg>
              </StyledButton>

              <span className="text-xl font-semibold text-gray-400">
                Page <span className="text-white">{currentPage}</span> of{" "}
                {Math.ceil(filteredFlags.length / itemsPerPage)}
              </span>

              <StyledButton
                buttonColor="bg-gray-600"
                hoverColor="hover:bg-gray-800"
                onClick={handleNextPage}
                disabled={currentPage * itemsPerPage >= filteredFlags.length}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 12l-10 0" />
                  <path d="M20 12l-4 4" />
                  <path d="M20 12l-4 -4" />
                  <path d="M4 4l0 16" />
                </svg>
              </StyledButton>
            </div>
          </div>

          <div className="w-[44rem]  rounded-sm items-start justify-start h-full flex flex-col  border-r border-[#373737]">
            {/* <span className="text-2xl font-semibold">
              Logs spcific to flags will bre displayed here
            </span> */}

            <span className="text-2xl font-semibold w-fit mb-[2rem]">Logs</span>

            <TableHeaderContainer headers={logHeaders} theme="dark" className="w-full" />


            <div className="w-full h-[58rem] overflow-y-scroll border-y border-gray-700">
              <div className="relative w-full h-full">
                {/* Overlayed Spinner */}
                {logsLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center ">
                    <LoadingSpinner />
                  </div>
                )}

                {/* Error State */}
                {logsError ? (
                  <ErrorBox message={logsError} />
                ) : availableLogs.length > 0 ? (
                  availableLogs.map((log, index) => (
                    <ConfigLogslist key={index} log={log} />
                  ))
                ) : !logsLoading && availableLogs.length === 0 ? (
                  <EmptyMessage message="Empty logs!" />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() =>
            setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
          }
          onConfirm={confirmToggle}
          title={confirmationModal.title}
          message={confirmationModal.message}
          type={confirmationModal.type}
          theme="dark"
        />
      )}

      {/* Maintenance Confirm Modal */}
      {maintenanceConfirm.isOpen && (
        <ConfirmationModal
          isOpen={true}
          onClose={() =>
            setMaintenanceConfirm({ isOpen: false, isEnabling: false })
          }
          onConfirm={() => {
            handleMaintenanceToggle();
            setMaintenanceConfirm({ isOpen: false, isEnabling: false });
          }}
          title={
            maintenanceConfirm.isEnabling
              ? "Enable Maintenance Mode"
              : "Disable Maintenance Mode"
          }
          message={
            maintenanceConfirm.isEnabling
              ? "Are you sure you want to enable Maintenance Mode? Public users will be blocked."
              : "Are you sure you want to disable Maintenance Mode and restore access to public pages?"
          }
          type={maintenanceConfirm.isEnabling ? "warning" : "question"}
          theme="dark"
        />
      )}

      {disabledClickInfo.isOpen && (
        <PopupModal
          isOpen={true}
          onClose={() => setDisabledClickInfo({ isOpen: false, route_key: "" })}
          title="Maintenance Mode Active"
          message={`'${disabledClickInfo.route_key}' is locked during maintenance. Disable maintenance mode to update flags.`}
          buttonText="Okay"
          type="info"
          theme="dark"
        />
      )}

      {/* Popup Error Modal */}
      {popupError.isOpen && (
        <PopupModal
          isOpen={popupError.isOpen}
          onClose={() => setPopupError({ ...popupError, isOpen: false })}
          title={popupError.title}
          message={popupError.message}
          buttonText="Dismiss"
          type="error"
          theme="dark"
        />
      )}

      {/* Toast Message */}
      {message && (
        <Toast
          message={message}
          type={message.startsWith("Error") ? "error" : "success"}
          duration={3000}
          onClose={() => setMessage("")}
        />
      )}
    </>
  );
};

export default Configuration;
