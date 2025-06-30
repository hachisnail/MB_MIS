import { rolePermissions, generateColorFromKey } from "./commons";

export const ViewUserSessionItem = ({ session, onClick }) => {
  const formatFullDate = (date) =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-sm text-[#E9E9E9] border-gray-600">
          {formatFullDate(date)}
        </span>
        <span className="text-base">{formatTime(date)}</span>
      </div>
    );
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return "-";
    const ms = new Date(end) - new Date(start);
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    return `${hours} hours and \n${minutes % 60} minute(s)`;
  };

  return (
    <div
      className="w-full select-none grid grid-cols-4 cursor-pointer hover:bg-gray-900 items-center border-b-1 border-gray-600 text-base"
      onClick={() => {
        const summary =
          session.logoutAt != null
            ? `Session from ${formatFullDate(
                new Date(session.loginAt)
              )} to ${formatFullDate(
                new Date(session.logoutAt)
              )} with a duration of ${formatDuration(
                session.loginAt,
                session.logoutAt
              )}.`
            : `User is still active. Logged in at ${formatFullDate(
                new Date(session.loginAt)
              )}.`;
        onClick(summary);
      }}
    >
      <div className="py-2 pl-2">
        {session.isOnline ? (
          <span className="text-green-500">Online</span>
        ) : (
          <span className="text-[#9A75FF]">{formatDate(session.logoutAt)}</span>
        )}
      </div>
      <div className="py-2 pl-2">
        <span className="text-[#9A75FF]">{formatDate(session.loginAt)}</span>
      </div>
      <div className="py-2 pl-2">
        {session.logoutAt ? (
          <span className="text-[#FF474A]">{formatDate(session.logoutAt)}</span>
        ) : (
          <span className="font-bold text-[#FF474A]">Still Active</span>
        )}
      </div>
      <div className="py-2 pl-2">
        {session.logoutAt ? (
          <pre className="text-[#9A75FF] leading-tight">
            {formatDuration(session.loginAt, session.logoutAt)}
          </pre>
        ) : (
          <span className="font-bold text-4xl text-[#FF474A]">-</span>
        )}
      </div>
    </div>
  );
};

export const ViewUserItem = ({ user }) => {
  const renderRole = (roleId) => rolePermissions[String(roleId)] || "N/A";
  const initials = user.fname.charAt(0) + user.lname.charAt(0);
  const { bg, text } = generateColorFromKey(initials);
  return (
    <>
      <div className="w-[50rem] border-b border-[#373737] min-h-fit pb-10 text-xl flex items-center gap-x-4">
        <div className="min-w-50 min-h-50 rounded-full flex items-center justify-center bg-white">
          <div
            className="select-none w-48 h-48  border-2 border-black rounded-full flex items-center justify-center"
            style={{ backgroundColor: bg }}
          >
            <span className={`text-8xl font-semibold ${text}`}>{`${user.fname.charAt(
              0
            )}${user.lname.charAt(0)}`}</span>
          </div>
          {/* <svg
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
          </svg> */}
        </div>

        <div className="w-full h-full flex flex-col justify-center">
          <span className="mt-5 w-fit text-4xl font-semibold">
            <span className="select-none text-[#9c9c9c]">#</span>{user.username}
          </span>
          <div className="flex w-full h-fit gap-x-2">
            <span className="text-6xl font-semibold select-none">
              {user.fname} {user.lname}
            </span>
          </div>
        </div>
      </div>

      <div className="w-[50rem] border-b gap-y-4 pb-10 border-[#373737] min-h-fit flex flex-col">
        <div className="flex flex-col">
          <span className="text-[#949494] select-none text-lg">Position</span>
          <span className="text-3xl font-semibold">
            {user.position || "N/A"}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[#949494] select-none text-lg">Email</span>
          <span className="text-3xl font-semibold">{user.email || "N/A"}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[#949494] select-none text-lg">Contact</span>
          <span className="text-3xl font-semibold">
            {user.contact || "N/A"}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[#949494] select-none text-lg">Role</span>
          <span className="text-3xl font-semibold">
            {renderRole(user.roleId)}
          </span>
        </div>
      </div>

      <div className="w-[50rem] pb-10 min-h-fit select-none flex flex-col">
        <div className="flex gap-y-3 flex-col">
          <span className="text-4xl font-semibold">Session Logs</span>
          <span className="w-[30rem] leading-tight text-xl text-[#9c9c9c]">
            The session log table records user login sessions, including last
            login timestamp, session start/end times, and duration.
          </span>
        </div>
      </div>
    </>
  );
};
