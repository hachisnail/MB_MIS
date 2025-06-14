import { useLocation, NavLink, matchPath } from "react-router-dom";

const routeMeta = [
  { path: "/admin/inventory", title: "Inventory of Artifact" },
  { path: "/admin/acquisition", title: "Donations/Acquisitions/Lending Management" },
  { path: "/admin/logs", title: "Logging", theme: "text-gray-400" },
  { path: "/admin/view", title: "View Artifacts" },
  { path: "/admin/user", title: "User Management", theme: "text-gray-400" },
  { path: "/admin/user/:user", title: "View User", theme: "text-gray-400" },
  { path: "/admin/add-user", title: "Invite A New User", theme: "text-gray-400" },
  { path: "/admin/appointment", title: "Appointments Management" },
  { path: "/admin/schedule", title: "Schedules Management" },
  { path: "/admin/article", title: "Articles Management" },
];

const Breadcrumb = () => {
  const location = useLocation();
  let currentLink = "";

  const matchedRoute = routeMeta.find(({ path }) =>
    matchPath({ path, end: true }, location.pathname)
  );
  const pageTitle = matchedRoute?.title || "Sandbox/Unassigned";
  const theme = matchedRoute?.theme || "text-gray-700";

  const pathSegments = location.pathname.split("/").filter(Boolean);

  const crumbs = pathSegments
    .map((segment) => {
      currentLink += `/${segment}`;
      if (["admin", "preview", "files", "pictures"].includes(segment)) return null;

      const label = decodeURIComponent(segment)
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
