const FlagItem = ({
  route_key,
  is_enabled,
  is_public,
  updatingFlag,
  handleToggle,
  disabled = false,
  onDisabledClick = () => {},
}) => {
  if (
    route_key === "login" ||
    route_key === "down" ||
    route_key === "nomatch" ||
    route_key === "maintenance"
  )
    return null;

  const isButtonDisabled = updatingFlag === route_key;

  const handleClick = () => {
    if (disabled) {
      onDisabledClick(route_key);
      return;
    }
    handleToggle(route_key, is_enabled);
  };

  const flagDescriptions = {
    login: "Enables the login and password recovery system.",
    catalogs: "Public access to the artifact catalog.",
    home: "Landing page for the public site.",
    inventory: "Allows management of the artifact inventory.",
    acquisition: "Controls acquisition requests and processing.",
    schedule: "Handles exhibition schedules and timelines.",
    article: "Manages publishing of museum-related articles.",
    appointment: "Allows booking and handling of appointments.",
    files: "Enables file preview and management features.",
    sandbox: "Experimental features and testing tools.",
    logs: "Shows user activity logs and system events.",
    user: "Manage system users and roles.",
    down: "Force all routes to redirect to maintenance page.",
  };

  const flagIcons = {
    login: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M10 16l4-4m0 0l-4-4m4 4H3m13-4v1a4 4 0 004 4h0a4 4 0 01-4 4v1" />
      </svg>
    ),
    catalogs: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M5 4v16l7-3 7 3V4L12 7z" />
      </svg>
    ),
    home: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M3 9.75L12 3l9 6.75V21a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 21V9.75z" />
      </svg>
    ),
    inventory: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M4 6h16M4 10h16M4 14h10" />
      </svg>
    ),
    acquisition: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 12h6M12 9v6M5 20h14a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    schedule: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M8 7V3M16 7V3M4 11h16M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
      </svg>
    ),
    article: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M4 4h16v16H4z M8 8h8M8 12h8M8 16h4" />
      </svg>
    ),
    appointment: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M8 7V3M16 7V3M4 11h16M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
      </svg>
    ),
    files: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2h-1" />
      </svg>
    ),
    sandbox: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    logs: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 17v-2a4 4 0 013-3.87M15 17v-2a4 4 0 00-3-3.87M12 12V8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    user: (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 21v-2a4 4 0 00-3-3.87M9 21v-2a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
  };

  const icon = flagIcons[route_key.toLowerCase()];
  const description =
    flagDescriptions[route_key.toLowerCase()] || "System feature toggle.";

  return (
    <div
      className={`hover:border-1 border-gray-500 flex-shrink-0 min-w-fit min-h-fit h-[15.5rem] w-[20rem] p-5 rounded-sm shadow-2xl transition flex flex-col justify-between ${
        is_enabled ? "bg-neutral-800" : "bg-neutral-900"
      }`}
    >
      <div className="flex flex-col items-center space-y-2 text-center">
        <span
          className={`px-2 py-1 rounded-md font-semibold text-xs ${
            !is_enabled ? "bg-zinc-300 text-black" : "bg-[#151515] text-white"
          }`}
        >
          {is_enabled ? "Active" : "Inactive"}
        </span>

        <div className="my-2">{icon}</div>

        <p className="text-lg font-semibold text-white truncate uppercase">
          {route_key}
          {is_public ? (
            <span className="text-sm text-gray-400"> (Public)</span>
          ) : (
            <span className="text-sm text-gray-600"> (Private)</span>
          )}
        </p>

        <p className="text-sm text-zinc-400 w-50">{description}</p>
      </div>

      <button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={`mt-6 py-2 rounded-md font-semibold text-white transition ${
          is_enabled
            ? "bg-stone-600 hover:bg-stone-700"
            : "bg-gray-500 hover:bg-gray-600"
        } disabled:bg-gray-300 disabled:text-gray-600 ${
          disabled ? "cursor-help" : "cursor-pointer"
        }`}
      >
        {isButtonDisabled ? "Updating..." : is_enabled ? "Disable" : "Enable"}
      </button>
    </div>
  );
};

export default FlagItem;
