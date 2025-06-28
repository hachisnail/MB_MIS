const ViewUserItem = ({ session, onClick }) => {
  const formatFullDate = (date) =>
    date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-sm text-[#E9E9E9] border-gray-600">{formatFullDate(date)}</span>
        <span className="text-base">{formatTime(date)}</span>
      </div>
    );
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return "-";
    const ms = new Date(end) - new Date(start);
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    return `${hours} hours and ${minutes % 60} minute(s)`;
  };

  return (
    <div
      className="w-full select-none grid grid-cols-4 cursor-pointer hover:bg-gray-900 items-center border-b-1 border-gray-600 text-base"
      onClick={() => {
        const summary =
          session.logoutAt != null
            ? `Session from ${formatFullDate(new Date(session.loginAt))} to ${formatFullDate(
                new Date(session.logoutAt)
              )} with a duration of ${formatDuration(session.loginAt, session.logoutAt)}.`
            : `User is still active. Logged in at ${formatFullDate(new Date(session.loginAt))}.`;
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
          <span className="text-[#9A75FF]">{formatDuration(session.loginAt, session.logoutAt)}</span>
        ) : (
          <span className="font-bold text-[#FF474A]">-</span>
        )}
      </div>
    </div>
  );
};

export default ViewUserItem;
