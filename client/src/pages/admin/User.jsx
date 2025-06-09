import TooltipButton from "../../components/buttons/TooltipButton";
import { NavLink } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axiosClient from "../../lib/axiosClient";
import SocketClient from "../../lib/socketClient";
import ContextMenu from "../../components/modals/ContextMenu";

const socketUrl = import.meta.env.VITE_SOCKET_URL;


const User = () => {
  const [users, setUsers] = useState([]);
  const [Loading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  

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
      const response = await axiosClient.get("/auth/user");
      setUsers(response.data);
      console.log(response.data);
    } catch (err) {
      setFlagsError("Failed to ferch users!");
    } finally {
      // setIsLoading(false);
    }
  };

useEffect(() => {
  fetchUsers();

  const socket = new SocketClient(socketUrl);
  socketRef.current = socket;

  const handleUserChange = (action, data) => {
    console.log(`Silent refresh triggered from socket: ${action}`, data);
      fetchUsers();

  };

  socket.onDbChange("UserSession", "*", handleUserChange); 

  return () => {
    socket.offDbChange("UserSession", "*", handleUserChange);
    socket.disconnect();
  };
}, []);


  return (
    <div className="w-full h-full p-5 flex flex-col 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem] ">
      <div className="w-full min-h-[33rem] overflow-y-scroll flex-col xl:flex-row py-5 items-center flex border-t-1 border-[#373737]">
        <div className="p-1 w-full xl:min-w-[60rem] h-full max-h-[38rem] flex flex-col">
          {/* Upper Left panel */}
          <span className="w-fit text-2xl font-semibold">Users</span>
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

        <div className="w-full h-full flex flex-col max-h-[38rem] bg-[#1C1B19] border-[#373737] border-1 rounded-md">
          {/* Upper right panel */}
          {users.length > 0 ? (
            users.map((users) => {
              const id = users.id;
              const username = users.username;
              const fname = users.fname;
              const lname = users.lname;
              const email = users.email;
              const position = users.position;
              const role = users.roleId;
              let permission;
              switch (role) {
                case 1:
                  permission = 'Admin';
                  break;
                case 2:
                  permission = 'Content Manager';
                  break;
                case 3:
                  permission = 'Viewer';
                  break;
                case 4:
                  permission = 'Reviewer';
                  break;
                default:
                  permission = 'Unknown';
                  break;
              }

              const isActive = users.UserSessions.length
                ? users.UserSessions.reduce((latest, session) =>
                    new Date(session.loginAt) > new Date(latest.loginAt) ? session : latest
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
                  onClick: () =>
                  alert("open the full details of "+username),

                },
                {
                  label: "Modify",
                  onClick: () =>
                  alert("Modify the some of the details of "+username),


                },
                {
                  label: "Close",
                
                },
              ];

              return (
                <ContextMenu key={id} menuItems={menuItems} theme='dark'>
                <div
                  className="w-full h-20 border-b-1 rounded-sm border-[#373737] flex items-center px-4 justify-between"
                  key={id}
                > 
                  <div className="w-fit h-fit flex items-center gap-x-4">
                      <div className={`rounded-full w-8 h-8  ${isActive ? ("bg-green-600"):("bg-amber-50")}`}></div>
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                        <div className="select-none w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                          <span title={`${fname} ${lname}`} className="text-xl font-semibold text-black">{initials}</span>
                        </div>
                      </div>
                      <div className="w-fit h-full flex flex-col justify-center">
                      <span className="text-xl font-semibold">{`${fname} ${lname}`.toUpperCase()}</span>

                        <span className="text-sm text-[#9C9C9C] font-semibold">{email}</span>

                      </div>
                  </div>

                  <span className="text-xl bg-[#3A3A3A] font-semibold border-1 border-[#A6A6A6] rounded-md text-center w-40 py-1">{permission}</span>
                </div>
                </ContextMenu>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center py-6">
              <span className="text-[#9C9C9C] text-xl">
                No users!
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="w-full min-h-[32rem] py-5 overflow-y-scroll flex-col xl:flex-row border-t-1 items-center border-[#373737] flex">
        <div className="w-full xl:min-w-[60rem] h-full flex flex-col max-h-[35rem]">
          {/* Upper Left panel */}
          <span className="w-fit text-2xl font-semibold">Pendings</span>
          <span className="w-70 text-lg text-[#9C9C9C]">
            View and manage pending user invitations. Approve, resend, or revoke
            invites to control system access.
          </span>
        </div>
        <div className="w-full max-h-[35rem] h-full bg-[#1C1B19] border-[#373737] border-1 rounded-md"></div>
      </div>
    </div>
  );
};

export default User;
