import { useLocation, NavLink } from "react-router-dom";

const Breadcrumb = () => {
  const location = useLocation();
  let currentLink = "";

  const pathSegments = location.pathname.split("/").filter(crumb => crumb !== "");

  const crumbs = pathSegments.map((crumb, index) => {
    currentLink += `/${crumb}`;

    if (["admin", "preview", "files", "pictures"].includes(crumb)) return null;

    const decoded = decodeURIComponent(crumb);

    const label = decoded
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const formatted = label.charAt(0).toUpperCase() + label.slice(1);

    return {
      path: currentLink,
      label: formatted,
    };
  }).filter(Boolean);

  return (
    <div className="flex items-center gap-x-2 text-sm 3xl:text-2xl text-gray-600">
      {crumbs.map((crumb, index) => (
        <div className="flex items-center gap-x-2" key={crumb.path}>
          {index !== 0 && <span className="font-semibold">/</span>}
          <NavLink to={crumb.path} className="text-gray-700 hover:underline">
            <span>{crumb.label}</span>
          </NavLink>
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
