import { useLocation, NavLink, matchPath } from "react-router-dom";

const routeMeta = [
  { path: "/admin/inventory", title: "Inventory of Artifact" },
  { path: "/admin/inventory/:encoded", title: "Artifact Name" },
  {
    path: "/admin/acquisition",
    title: "Donations/Acquisitions/Lending Management",
  },
  {
    path: "/admin/acquisition/add-artifact",
    title: "Manually add a new Artifact",
  },
  { path: "/admin/acquisition/lending/:encoded", title: "Lending Form" },
  { path: "/admin/acquisition/donation/:encoded", title: "Donation Form" },
  { path: "/admin/logs", title: "Activities", theme: "text-gray-400" },
  { path: "/admin/logs/:encoded", title: "Activity", theme: "text-gray-400" },
  { path: "/admin/view", title: "View Artifacts" },
  { path: "/admin/user", title: "User Management", theme: "text-gray-400" },
  {
    path: "/admin/user/add-user",
    title: "Invite a New User",
    theme: "text-gray-400",
  },
  { path: "/admin/user/:user", title: "View User", theme: "text-gray-400" },
  {
    path: "/admin/config",
    title: "System Configuration",
    theme: "text-gray-400",
  },
  { path: "/admin/sandbox/preview/:encoded", title: "File Preview" },
  { path: "/admin/appointment", title: "Appointments Management" },
  {
    path: "/admin/appointment/:encoded",
    title: "View Appointment",
    theme: "text-gray-800",
  },
  {
    path: "/admin/appointment/walk-ins/:encoded",
    title: "New Appointment",
    theme: "text-gray-800",
  },
  { path: "/admin/schedule", title: "Schedules Management" },
  {
    path: "/admin/schedule/:encoded",
    title: "View Appointment from Schedule",
    theme: "text-gray-800",
  },
  { path: "/admin/article", title: "Articles Management" },
  { path: "/admin/article/add-article", title: "Create a new Article" },
  { path: "/admin/article/edit-article/:encoded", title: "Edit Article" },
];

function decodeLabelWithoutId(encoded) {
  try {
    const decoded = atob(encoded); // decode Base64
    return decoded.replace(/^\d+\s+/, "");
  } catch {
    return encoded;
  }
}

function safeDecodeBase64(str) {
  if (typeof str !== "string" || str.length < 8 || str.length % 4 !== 0)
    return str;

  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Regex.test(str)) return str;

  try {
    const decoded = atob(str);
    if (btoa(decoded) === str && /^[\x20-\x7E\s]+$/.test(decoded))
      return decoded;
    return str;
  } catch {
    return str;
  }
}

const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Detect if URL ends with /preview/:encoded
  let isPreview = false;
  let encodedParam = null;
  if (
    pathSegments.length >= 2 &&
    pathSegments[pathSegments.length - 2] === "preview"
  ) {
    isPreview = true;
    encodedParam = pathSegments[pathSegments.length - 1];
  }

  // Find route metadata for page title
  let pageTitle = "Sandbox/Unassigned";
  const matchedRoute = routeMeta.find(({ path }) =>
    matchPath({ path, end: true }, location.pathname)
  );
  if (matchedRoute?.title) {
    pageTitle = matchedRoute.title;
  }

  const theme = matchedRoute?.theme || "text-gray-700";
  let currentLink = "";

  const crumbs = pathSegments
    .map((segment, index, arr) => {
      currentLink += `/${segment}`;

      // Skip segments in breadcrumb display
      if (
        [
          "admin",
          "preview",
          "files",
          "pictures",
          "edit-article",
          "lending",
          "donation",
          "walk-ins",
        ].includes(segment)
      ) {
        return null;
      }

      let label = decodeURIComponent(segment);

      // For preview or any :encoded route, remove leading numeric ID
      if (
        (isPreview || matchedRoute?.path.includes(":encoded")) &&
        index === arr.length - 1
      ) {
        label = decodeLabelWithoutId(segment);
      }

      // Format label nicely
      label = label
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return { path: currentLink, label };
    })
    .filter(Boolean);

  return (
    <>
      <span className="text-4xl font-semibold select-none">{pageTitle}</span>
      <div className="flex select-none items-center gap-x-2 text-xl text-gray-600">
        {crumbs.map((crumb, index) => (
          <div className="flex items-center gap-x-2" key={crumb.path}>
            {index !== 0 && <span className="font-semibold">/</span>}
            <NavLink to={crumb.path} className={`${theme} hover:underline`}>
              <span>{crumb.label}</span>
            </NavLink>
          </div>
        ))}
      </div>
    </>
  );
};

export default Breadcrumb;
