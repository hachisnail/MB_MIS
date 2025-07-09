import TooltipButton from "../../components/buttons/TooltipButton";
// import StyledButton from "../../components/buttons/StyledButton";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axiosClient from "../../lib/axiosClient";

// import ContextMenu from "../../components/modals/ContextMenu";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import PopupModal from "../../components/modals/PopupModal";
import {
  UserItem,
  PendingInviteItem,
} from "../../components/list/UsersInviteslist";
import {
  LoadingSpinner,
  ErrorBox,
  EmptyMessage,
} from "../../components/list/commons";

import { useSocketClient } from "../../context/authContext";

const User = () => {
  const [users, setUsers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [inviteError, setInviteError] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoading, setIsUserLoading] = useState(false);
  const [inviteLoading, setIsInviteLoading] = useState(false);

  const [processingInviteId, setProcessingInviteId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null); // 'resend' or 'revoke'

  const [selectedInviteId, setSelectedInviteId] = useState(null);
  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);
  const [showConfirmResend, setShowConfirmResend] = useState(false);

  const [popup, setPopup] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const [viewInvite, setViewInvite] = useState({
    isOpen: false,
    invite: null,
  });

  const navigate = useNavigate();
  const socket = useSocketClient();

  const closeViewInvite = () => {
    setViewInvite({ isOpen: false, invite: null });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const fetchUsers = async () => {
    try {
      setIsUserLoading(true);
      setUserError(null);
      const response = await axiosClient.get(`/auth/users`, {
        withCredentials: true,
      });
      setUsers(response.data);
      console.log(response.data);
    } catch (error) {
      // setFlagsError("Failed to ferch users!");
      setUserError("Failed to fetch users!\n" + error);
    } finally {
      setIsUserLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      setIsInviteLoading(true);
      setInviteError(null);
      const response = await axiosClient.get(`/auth/invitations`, {
        withCredentials: true,
      });
      setPendingInvitations(response.data || []);
    } catch (error) {
      console.error(
        "Error fetching invitations:",
        error.response?.data || error
      );
      setInviteError("Failed to load pending invitations!\n" + error);
    } finally {
      setIsInviteLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingInvitations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUserChange = () => {
      console.log("[Socket] UserSession change → refetching...");
      fetchUsers();
      fetchPendingInvitations();
    };

    socket.onDbChange("UserSession", "*", handleUserChange);

    return () => {
      socket.offDbChange("UserSession", "*", handleUserChange);
    };
  }, [socket]);

  const showPopup = (title, message, type = "info") => {
    setPopup({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOpen = (user) => {
    // not in use
    const coded = btoa(user);
    navigate(`${coded}`);
  };

  const handleResend = async (id) => {
    try {
      setProcessingInviteId(id);
      setProcessingAction("resend");
      const response = await axiosClient.post(
        `/auth/invitation/${id}/resend`,
        {},
        { withCredentials: true }
      );
      showPopup("Success", response.data.message || "Invitation resent!");
      fetchPendingInvitations(); // refresh the list
    } catch (error) {
      console.error("Resend Error:", error.response?.data || error);
      showPopup(
        "Resend Failed",
        error.response?.data?.message || "Failed to resend invitation",
        "error"
      );
    } finally {
      setProcessingInviteId(null);
      setProcessingAction(null);
    }
  };

  const handleRevoke = async (id) => {
    try {
      setProcessingInviteId(id);
      setProcessingAction("revoke");
      const response = await axiosClient.delete(
        `/auth/invitation/${id}/revoke`,
        { withCredentials: true }
      );
      showPopup("Success", response.data.message || "Invitation revoked!");
      fetchPendingInvitations();
    } catch (error) {
      console.error("Revoke Error:", error.response?.data || error);
      showPopup(
        "Revoke Failed",
        error.response?.data?.message || "Failed to revoke invitation",
        "error"
      );
    } finally {
      setProcessingInviteId(null);
      setProcessingAction(null);
    }
  };

  const confirmResend = () => {
    handleResend(selectedInviteId);
    setShowConfirmResend(false);
  };

  const confirmRevoke = () => {
    handleRevoke(selectedInviteId);
    setShowConfirmRevoke(false);
  };

  const cancelModal = () => {
    setShowConfirmRevoke(false);
    setShowConfirmResend(false);
    setSelectedInviteId(null);
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirmResend}
        onClose={cancelModal}
        onConfirm={confirmResend}
        title="Resend Invitation?"
        message="Are you sure you want to resend the invitation?"
        type="question"
        theme="dark"
      />

      <ConfirmationModal
        isOpen={showConfirmRevoke}
        onClose={cancelModal}
        onConfirm={confirmRevoke}
        title="Revoke Invitation?"
        message="Are you sure you want to revoke the invitation?"
        type="question"
        theme="dark"
      />
      <PopupModal
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        theme="dark"
      />

      {viewInvite.isOpen && viewInvite.invite && (
        <PopupModal
          isOpen={viewInvite.isOpen}
          onClose={closeViewInvite}
          title={`Invitation Details`}
          message={
            <div className="text-left">
              <div className="grid grid-cols-3 gap-2 mb-2 p-4">
                <span className="font-semibold text-right">Name:</span>

                <span className="col-span-2">
                  {viewInvite.invite.first_name} {viewInvite.invite.last_name}
                </span>

                <span className="font-semibold text-right">Email:</span>
                <span className="col-span-2">{viewInvite.invite.email}</span>

                <span className="font-semibold text-right">Contact:</span>
                <span className="col-span-2">
                  {viewInvite.invite.contact_number || "N/A"}
                </span>

                <span className="font-semibold text-right">Role:</span>
                <span className="col-span-2 ">{viewInvite.invite.role}</span>

                <span className="font-semibold text-right">Status:</span>
                <span className="col-span-2">
                  {viewInvite.invite.isUsed ? (
                    <span className="text-green-400">Used</span>
                  ) : (
                    <span className="text-yellow-400">Pending</span>
                  )}
                </span>

                <span className="font-semibold text-right">Created At:</span>
                <span className="col-span-2">
                  {formatDate(viewInvite.invite.createdAt)}
                </span>

                <span className="font-semibold text-right">Expires At:</span>
                <span className="col-span-2">
                  {formatDate(viewInvite.invite.expiresAt)}
                  {!viewInvite.invite.isUsed && (
                    <span
                      className={`ml-2 ${
                        new Date(viewInvite.invite.expiresAt) < new Date()
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      (
                      {new Date(viewInvite.invite.expiresAt) < new Date()
                        ? "Expired"
                        : "Active"}
                      )
                    </span>
                  )}
                </span>
              </div>
            </div>
          }
          type="info"
          theme="dark"
        />
      )}

      <div className="select-none w-full h-full p-5 flex flex-col 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem] ">
        <div className="w-full min-h-[33rem] overflow-y-scroll flex-col xl:flex-row py-5 items-center flex border-t-1 border-[#373737]">
          <div className="p-1 w-full xl:min-w-[60rem] h-full max-h-[38rem] flex flex-col">
            {/* Upper Left panel */}
            <span className="w-fit text-2xl font-semibold mb-2">Users</span>
            <span className="w-70 text-lg text-[#9C9C9C]">
              Manage system users by assigning roles, updating account details,
              and controlling access levels.
            </span>

            <NavLink to="add-user" className=" mt-5 w-fit h-fit">
              <TooltipButton
                buttonText="Invite People"
                tooltipText="Click to open the form page."
                buttonColor="bg-[#6F3FFF]"
                hoverColor="hover:bg-violet-700"
                textColor="text-white"
                tooltipColor="bg-violet-800 text-white"
                className="w-fit"
                // onClick={() => setInfoPopupOpen(true)}
              />
            </NavLink>
          </div>

          <div className="w-full h-full overflow-x-scroll flex flex-col min-w-fit max-h-[38rem] bg-[#1C1B19] border-[#373737] border-1 rounded-md">
            {/* Upper right panel */}
            {userLoading ? (
              <LoadingSpinner />
            ) : userError ? (
              <ErrorBox message={userError} />
            ) : (
              <>
                {users.length > 0 ? (
                  users.map((user) => (
                    <UserItem
                      key={user.id}
                      user={user}
                      handleOpen={handleOpen}
                    />
                  ))
                ) : (
                  <EmptyMessage message="No users!" />
                )}
              </>
            )}
          </div>
        </div>
        <div className="w-full min-h-[32rem] py-5 overflow-y-scroll flex-col xl:flex-row border-t-1 items-center border-[#373737] flex">
          <div className="w-full xl:min-w-[60rem] h-full flex flex-col max-h-[35rem]">
            {/* Upper Left panel */}
            <span className="w-fit text-2xl font-semibold mb-2">Pendings</span>
            <span className="w-70 text-lg text-[#9C9C9C]">
              View and manage pending user invitations. Approve, resend, or
              revoke invites to control system access.
            </span>
          </div>
          <div className="w-full max-h-[35rem] min-w-fit flex flex-col h-full bg-[#1C1B19] border-[#373737] border-1 rounded-md">
            {inviteLoading ? (
              <LoadingSpinner />
            ) : inviteError ? (
              <ErrorBox message={inviteError} />
            ) : (
              <>
                {pendingInvitations.length > 0 ? (
                  pendingInvitations.map((invite) => (
                    <PendingInviteItem
                      key={invite.id}
                      invite={invite}
                      onResend={(id) => {
                        setSelectedInviteId(id);
                        setShowConfirmResend(true);
                      }}
                      onRevoke={(id) => {
                        setSelectedInviteId(id);
                        setShowConfirmRevoke(true);
                      }}
                      processingId={processingInviteId}
                      action={processingAction}
                      setViewInvite={setViewInvite}
                    />
                  ))
                ) : (
                  <EmptyMessage message="No pending invitations!" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default User;
