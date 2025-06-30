import StyledButton from "../buttons/StyledButton";
// import ContextMenu from "../modals/ContextMenu";
import { NavLink } from "react-router-dom";

import { rolePermissions, generateColorFromKey } from "./commons";

export const UserItem = ({ user, handleOpen }) => {
  const fname = user.fname.replace(/\s+/g, "");
  const lname = user.lname.replace(/\s+/g, "");
  const email = user.email;

  const initials = `${user.fname.charAt(0)}${user.lname.charAt(0)}`;
  const { bg, text } = generateColorFromKey(initials);

  const sessions = user.sessions || [];
  const isActive = sessions.length
    ? sessions.reduce((latest, session) =>
        new Date(session.loginAt) > new Date(latest.loginAt) ? session : latest
      ).isOnline === true
    : false;

  function encodeUserName(fname, lname) {
    const cleanFname = fname.trim();
    const cleanLname = lname.trim();
    return btoa(`${cleanFname} ${cleanLname}`);
  }

  // const menuItems = [
  //   {
  //     label: "Open",
  //     onClick: () => handleOpen(fname + " " + lname),
  //   },
  //   {
  //     label: "Modify",
  //     onClick: () => alert("Modify the details of " + username),
  //   },
  //   { label: "Close" },
  // ];

  return (
    <NavLink to={`${encodeUserName(user.fname, user.lname)}`}>
      {/* <ContextMenu key={id} menuItems={menuItems} theme="dark">  */}
      <div className="w-full min-w-100 h-20 border-b-1 hover:bg-gray-900 rounded-sm border-[#373737] flex items-center px-4 justify-between">
        <div className="w-fit h-fit flex items-center gap-x-4">
          <div
            className={`rounded-full w-8 h-8 ${
              isActive ? "bg-green-600" : "bg-amber-50"
            }`}
          ></div>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <div
              className="select-none w-11 h-11 rounded-full border border-black flex items-center justify-center"
              style={{ backgroundColor: bg }}
            >
              <span className={`text-xl font-semibold ${text}`}>
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
        <span className="text-xs lg:text-md lg:text-xl bg-[#3A3A3A] font-semibold border-1 border-[#A6A6A6] rounded-md text-center w-25 lg:w-46 py-1">
          {rolePermissions[user.roleId] || "Not Available"}
        </span>
      </div>
      {/* </ContextMenu>  */}
    </NavLink>
  );
};

export const PendingInviteItem = ({
  invite,
  onResend,
  onRevoke,
  processingId,
  action,
  setViewInvite,
}) => {
  const id = invite.id;
  const fname = invite.first_name;
  const lname = invite.last_name;
  const email = invite.email;
  const initials = fname.charAt(0) + lname.charAt(0);
  const bgColor = colorMap[fname.charAt(0)] || "#FFFFFF";

  return (
    <div
      className="w-full gap-x-4 min-w-100 h-20 border-b-1 rounded-sm border-[#373737] hover:bg-gray-900 flex items-center px-4 justify-between"
      key={id}
    >
      <div
        className="w-full cursor-pointer h-fit items-center flex gap-x-4"
        onClick={() => setViewInvite({ isOpen: true, invite })}
      >
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
          <div
            className="select-none w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-xl font-semibold text-black">{initials}</span>
          </div>
        </div>
        <div className="w-fit h-full flex flex-col justify-center">
          <span className="text-sm lg:text-xl w-fit font-semibold">
            {`${fname} ${lname}`.toUpperCase()}
          </span>
          <span className="text-[6px] lg:text-sm text-[#9C9C9C] font-semibold">
            {email}
          </span>
        </div>
      </div>
      <div className="w-fit h-fit flex gap-x-4">
        <StyledButton
          onClick={() => onResend(id)}
          buttonColor="w-40 flex justify-center bg-gray-600 border-white border"
          hoverColor="hover:bg-gray-700"
          textColor="text-white"
          disabled={processingId === id && action === "resend"}
        >
          {processingId === id && action === "resend" ? (
            <LoadingSpinner />
          ) : (
            "Resend Invite"
          )}
        </StyledButton>
        <StyledButton
          onClick={() => onRevoke(id)}
          buttonColor="w-40 flex items-center border-red-300 border"
          hoverColor="hover:bg-red-600"
          textColor="text-red-300"
          disabled={processingId === id && action === "revoke"}
        >
          {processingId === id && action === "revoke" ? (
            <LoadingSpinner />
          ) : (
            "Revoke Invite"
          )}
        </StyledButton>
      </div>
    </div>
  );
};
