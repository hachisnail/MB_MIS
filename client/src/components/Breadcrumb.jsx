import { useLocation, NavLink } from "react-router-dom";

const Breadcrumb = () => {
  const location = useLocation();
  let currentLink = "";

  const pathSegments = location.pathname
    .split("/")
    .filter((crumb) => crumb !== "");
  // console.log(location.pathname);
  const theme = ["/admin/user", "/admin/logs", "/admin/user/add-user"].includes(
    location.pathname
  )
    ? "text-gray-400"
    : "text-gray-700";

  const crumbs = pathSegments
    .map((crumb, index) => {
      currentLink += `/${crumb}`;

      if (["admin", "preview", "files", "pictures"].includes(crumb))
        return null;

      const decoded = decodeURIComponent(crumb);

      const label = decoded
        .replace(/-/g, " ") // Replace hyphens with spaces
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()
        .split(" ") // Split into words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(" ");

      return {
        path: currentLink,
        label,
      };
    })
    .filter(Boolean);

  return (
    <div className="flex items-center gap-x-2 text-xl text-gray-600">
      {crumbs.map((crumb, index) => (
        <div className="flex items-center gap-x-2" key={crumb.path}>
          {index !== 0 && <span className="font-semibold">/</span>}
          <NavLink to={crumb.path} className={` ${theme} hover:underline`}>
            <span>{crumb.label}</span>
          </NavLink>
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
