import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axiosClient from "../../lib/axiosClient";
import { useSocketClient } from "../../context/authContext";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import FlagItem from "../../components/list/Flagslist";
import Toast from "../../features/Toast";
import StyledToggleSwitch from "../../components/buttons/StyledToggleSwitch";
import PopupModal from "../../components/modals/PopupModal";
import TooltipButton from "../../components/buttons/TooltipButton";
import {
  LoadingSpinner,
  ErrorBox,
  EmptyMessage,
} from "../../components/list/commons";

const Configuration = () => {
  const socket = useSocketClient();
  const publicFlags = ["home", "catalogs", "recover", "parser"];

  const [availableFlags, setAvailableFlags] = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagsError, setFlagsError] = useState("");
  const [updatingFlag, setUpdatingFlag] = useState(null);
  const [message, setMessage] = useState("");

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
      const { data } = await axiosClient.get("/auth/router-flags");
      setAvailableFlags(data || []);
    } catch {
      setFlagsError("Failed to load flags");
    } finally {
      setFlagsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleFlagChange = () => fetchFlags();
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

  return (
    <>
      <div className="w-full min-w-fit h-full p-5 max-w-[137rem] 1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-w-[175rem] 3xl:max-h-[88rem]">
        <div className="w-full h-full justify-between  pt-5 flex border-t border-[#373737] gap-y-[2rem]">
          <div className="w-[81.5rem] space-y-5 h-full pt-1">
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

            <div className="w-full min-w-fit min-h-fit h-[63rem] flex flex-wrap gap-x-2 gap-y-2  items-start content-start">
              {flagsLoading ? (
                <LoadingSpinner />
              ) : flagsError ? (
                <ErrorBox message={flagsError} />
              ) : availableFlags.length > 0 ? (
                availableFlags.map(({ route_key, is_enabled, is_public }) => {
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
              ) : (
                <EmptyMessage message="Empty flags!" />
              )}
            </div>
          </div>

          <div className="w-[40rem] border-[#373737] border rounded-sm items-center justify-center h-full flex flex-col gap-y-5">
            <span className="text-2xl font-semibold">Logs spcific to flags will bre displayed here</span>

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
