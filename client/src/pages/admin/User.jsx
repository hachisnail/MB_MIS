import TooltipButton from "../../components/buttons/TooltipButton";
import StyledButton from "../../components/buttons/StyledButton";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axiosClient from "../../lib/axiosClient";
import SocketClient from "../../lib/socketClient";
import ContextMenu from "../../components/modals/ContextMenu";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import PopupModal from "../../components/modals/PopupModal";

const socketUrl = import.meta.env.VITE_SOCKET_URL;

const User = () => {
  const [users, setUsers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [inviteError, setInviteError] = useState([]);
  const [Loading, setIsLoading] = useState(false);

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
    invite: null
  });

  const navigate = useNavigate();
  const socketRef = useRef(null);

  const closeViewInvite = () => {
    setViewInvite({ isOpen: false, invite: null });
  };

    const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };


  const colorMap = {
    A: "#FF6666",
    B: "#FF9933",
    C: "#FFD700",
    D: "#66CC66",
    E: "#0099CC",
    F: "#9933CC",
    G: "#FF3399",
    H: "#6666FF",
    I: "#00CC99",
    J: "#FF6600",
    K: "#3399FF",
    L: "#FF3366",
    M: "#33CC33",
    N: "#FFCC00",
    O: "#336699",
    P: "#990000",
    Q: "#FF6699",
    R: "#666600",
    S: "#669900",
    T: "#009999",
    U: "#6600CC",
    V: "#CC3300",
    W: "#99CC00",
    X: "#9966FF",
    Y: "#FF0000",
    Z: "#33CCCC",
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosClient.get(`/auth/users`, {
        withCredentials: true,
      });
      setUsers(response.data);
      // console.log(response.data);
    } catch (err) {
      // setFlagsError("Failed to ferch users!");
    } finally {
      // setIsLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    setInviteError(null);
    await axiosClient
      .get(`/auth/invitations`, { withCredentials: true })
      .then((response) => {
        setPendingInvitations(response.data || []);
        console.log(response.data);
      })
      .catch((error) => {
        console.error(
          "Error fetching invitations:",
          error.response?.data || error
        );
        setInviteError("Failed to load pending invitations");
      });
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingInvitations();

    const socket = new SocketClient(socketUrl);
    socketRef.current = socket;

    const handleUserChange = (action, data) => {
      console.log(`Silent refresh triggered from socket: ${action}`, data);
      fetchPendingInvitations();
      fetchUsers();
    };

    socket.onDbChange("UserSession", "*", handleUserChange);

    return () => {
      socket.offDbChange("UserSession", "*", handleUserChange);
      socket.disconnect();
    };
  }, []);

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
    navigate(`${user}`);
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

                <span className="col-span-2">{viewInvite.invite.first_name} {viewInvite.invite.last_name}</span>

                <span className="font-semibold text-right">Email:</span>
                <span className="col-span-2">{viewInvite.invite.email}</span>
                
                <span className="font-semibold text-right">Contact:</span>
                <span className="col-span-2">{viewInvite.invite.contact_number || "N/A"}</span>
                
                
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
                <span className="col-span-2">{formatDate(viewInvite.invite.createdAt)}</span>
                
                <span className="font-semibold text-right">Expires At:</span>
                <span className="col-span-2">
                  {formatDate(viewInvite.invite.expiresAt)} 
                  {!viewInvite.invite.isUsed && (
                    <span className={`ml-2 ${new Date(viewInvite.invite.expiresAt) < new Date() ? "text-red-400" : "text-green-400"}`}>
                      ({new Date(viewInvite.invite.expiresAt) < new Date() ? "Expired" : "Active"})
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
            {users.length > 0 ? (
              users.map((users) => {
                const id = users.id;
                const username = users.username;
                const fname = users.fname;
                const lname = users.lname;
                const email = users.email;
                // const position = users.position;
                const rolePermissions = {
                  1: "Admin",
                  2: "Content Manager",
                  3: "Viewer",
                  4: "Reviewer",
                };

                const isActive = users.UserSessions.length
                  ? users.UserSessions.reduce((latest, session) =>
                      new Date(session.loginAt) > new Date(latest.loginAt)
                        ? session
                        : latest
                    ).isOnline === true
                  : false;

                const initials = `${users.fname.charAt(0)}${users.lname.charAt(
                  0
                )}`;
                const firstInitial = initials.charAt(0);
                const bgColor = colorMap[firstInitial] || "#FFFFFF";

                const menuItems = [
                  {
                    label: "Open",
                    onClick: () => handleOpen(fname+" "+lname),
                  },
                  {
                    label: "Modify",
                    onClick: () =>
                      alert("Modify the some of the details of " + username),
                  },
                  {
                    label: "Close",
                  },
                ];

                return (
                  <ContextMenu key={id} menuItems={menuItems} theme="dark">
                    <div
                      className="w-full min-w-100 h-20 border-b-1 hover:bg-gray-900 rounded-sm border-[#373737] flex items-center px-4 justify-between"
                      key={id}
                    >
                      <div className="w-fit h-fit flex items-center gap-x-4">
                        <div
                          className={`rounded-full w-8 h-8  ${
                            isActive ? "bg-green-600" : "bg-amber-50"
                          }`}
                        ></div>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                          <div
                            className="select-none w-11 h-11  rounded-full flex items-center justify-center"
                            style={{ backgroundColor: bgColor }}
                          >
                            <span
                              title={`${fname} ${lname}`}
                              className=" text-xl  font-semibold text-black"
                            >
                              {initials}
                            </span>
                          </div>
                        </div>
                        <div className="w-fit h-full flex flex-col justify-center">
                          <span className="text-sm lg:text-xl font-semibold">
                            {`${fname} ${lname}`.toUpperCase()}
                          </span>

                          <span className="text-[6px] lg:text-sm text-[#9C9C9C] font-semibold">
                            {email}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs lg:text-md lg:text-xl bg-[#3A3A3A] font-semibold border-1 border-[#A6A6A6] rounded-md text-center w-20 lg:w-40 py-1">
                        {rolePermissions[users.roleId] || "Not Available"}
                      </span>
                    </div>
                  </ContextMenu>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center py-6">
                <span className="text-[#9C9C9C] text-xl">No users!</span>
              </div>
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
            {pendingInvitations.length > 0 ? (
              pendingInvitations.map((pendingInvitations) => {
                const id = pendingInvitations.id;
                const fname = pendingInvitations.first_name;
                const lname = pendingInvitations.last_name;
                const initials = fname.charAt(0) + lname.charAt(0);
                const firstInitial = fname.charAt(0);
                const bgColor = colorMap[firstInitial] || "#FFFFFF";
                const email = pendingInvitations.email;

                

                return (
                  <div
                    className="w-full gap-x-4 min-w-100 h-20 border-b-1   rounded-sm border-[#373737] hover:bg-gray-900 flex items-center px-4 justify-between"
                    key={id}
                    
                  >
                    <div className="w-full cursor-pointer h-fit items-center flex gap-x-4" onClick={() => setViewInvite({
                      isOpen: true,
                      invite: pendingInvitations})}>
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                        <div
                          className="select-none w-11 h-11  rounded-full flex items-center justify-center"
                          style={{ backgroundColor: bgColor }}
                        >
                          <span
                            title={`${fname} ${lname}`}
                            className=" text-xl  font-semibold text-black"
                          >
                            {initials}
                          </span>
                        </div>
                      </div>
                      <div className="w-fit h-full flex flex-col justify-center">
                        <span className="text-sm lg:text-xl w-fit font-semibold ">
                          {`${fname} ${lname}`.toUpperCase()}
                        </span>

                        <span className="text-[6px] lg:text-sm text-[#9C9C9C] font-semibold">
                          {email}
                        </span>
                      </div>
                    </div>
                    <div className="w-fit h-fit flex gap-x-4">
                      <StyledButton
                        onClick={() => {
                          setSelectedInviteId(id);
                          setShowConfirmResend(true);
                        }}
                        buttonColor="w-40 flex justify-center bg-gray-600 border-white border"
                        hoverColor="hover:bg-gray-700"
                        textColor="text-white"
                        disabled={processingInviteId === id}
                      >
                        {processingInviteId === id &&
                        processingAction === "resend" ? (
                          <div className="w-7 h-7 mx-auto border-2 border-white border-t-transparent animate-spin rounded-full" />
                        ) : (
                          "Resend Invite"
                        )}
                      </StyledButton>

                      <StyledButton
                        onClick={() => {
                          setSelectedInviteId(id);
                          setShowConfirmRevoke(true);
                        }}
                        buttonColor="w-40 flex items-center border-red-300 border"
                        hoverColor="hover:bg-red-600"
                        textColor="text-red-300"
                        disabled={processingInviteId === id}
                      >
                        {processingInviteId === id &&
                        processingAction === "revoke" ? (
                          <div className="w-7 h-7 mx-auto border-2 border-white border-t-transparent animate-spin rounded-full" />
                        ) : (
                          "Revoke Invite"
                        )}
                      </StyledButton>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center py-6">
                <span className="text-[#9C9C9C] text-xl">
                  No pending invitiations!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default User;
