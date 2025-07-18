// src/components/navbar/PublicNav.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import Logo from "@/assets/LOGO.png";
import { useRouterFlags } from "@/context/routerFlagProvider";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const PublicNav = ({ theme = "light" }) => {
  const { flags } = useRouterFlags();
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});

  const bgClass = theme === "dark" ? "bg-transparent border-white" : "bg-transaprent border-black";
  const textClass = theme === "dark" ? "text-white" : "text-black";
  const dividerClass = theme === "dark" ? "bg-white" : "bg-gray-700";

  const carretIcon = (isOpen) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme === "dark" ? "#fff" : "#000"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: isOpen ? "rotate(180deg)" : "rotate(0)",
        transition: "transform 0.2s",
      }}
    >
      <path d="M6 9l6 6l6 -6" />
    </svg>
  );

  // This is only used internally by navigateToAnchor.
  // The global ScrollToTop will call scrollIntoView based on hash.
  const scrollToAnchor = useCallback((anchorId) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);


  const navigateToAnchor = useCallback((targetPage, anchorId) => {
    setOpenDropdown(null);
    const targetPath = `/${targetPage}`;
    const isSamePage = location.pathname === targetPath;

    if (!isSamePage) {
      // If navigating to a different page, append the hash.
      // ScrollToTop will handle the scroll to the specific anchor (or the navbar top).
      navigate(`${targetPath}#${anchorId}`);
    } else {
      // If on the same page, replace the hash directly.
      // ScrollToTop will detect the hash change and scroll.
      navigate(`${location.pathname}${location.search}#${anchorId}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);


  // --- Only dropdown related useEffect remains here ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedOutside = Object.values(dropdownRefs.current).every(
        (ref) => !ref?.contains(e.target)
      );
      if (clickedOutside) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const NavItem = ({ to, label, title, dropdownKey, anchorpoints = [] }) => (
    <div
      className="relative w-fit flex items-center gap-x-1"
      ref={(el) => {
        if (dropdownKey) dropdownRefs.current[dropdownKey] = el;
      }}
    >
      <NavLink
        title={title}
        to={to}
        // When clicking a standard NavLink, just navigate to the path.
        // ScrollToTop will then determine if it needs to scroll to the top (main-navbar-top)
        // or a specific anchor if present.
        className={({ isActive }) =>
          `px-3 py-2 transition-all duration-200 font-semibold text-3xl ${
            isActive
              ? `border-b-2 border-yellow-500 ${theme === "dark" ? "text-white" : "text-black"}`
              : `${textClass}`
          }`
        }
      >
        {label}
      </NavLink>

      {anchorpoints.length > 0 && (
        <>
          <button
            onClick={() =>
              setOpenDropdown((prev) => (prev === dropdownKey ? null : dropdownKey))
            }
            className="text-xl cursor-pointer"
            title="Toggle section dropdown"
          >
            {carretIcon(openDropdown === dropdownKey)}
          </button>

          {openDropdown === dropdownKey && (
            <div className={`absolute top-full mt-2 right-0 backdrop-blur-xs ${theme === 'dark' ? "border-white " : 'border-black '} border rounded shadow z-50 w-40 flex flex-col`}>
              {anchorpoints.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => navigateToAnchor(to.replace("/", ""), value)}
                  className={`cursor-pointer px-4 py-2 text-center ${textClass} hover:bg-gray-500 rounded text-sm w-full`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div
      id="main-navbar-top" 
      className={`w-[95vw] h-full flex items-center justify-between pl-5 pr-15 py-3 border-b-2 ${bgClass}`}
    >
      <div className="flex items-center gap-x-5">
        <NavLink to="/" title="Home">
          <img src={Logo} alt="Museo Bulawan Logo" className="w-20" />
        </NavLink>
        <div className="flex items-center gap-x-2">
          <i className={`h-17 w-1.5 rounded-sm ${dividerClass}`} />
          <NavLink
            to="/"
            className={`flex flex-col text-4xl justify-center ${textClass}`}
          >
            <span className="font-bold leading-7">Museo</span>
            <span className="font-bold leading-7">Bulawan</span>
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-x-4">
        {flags["home"] && (
          <NavItem
            to="/"
            label="Home"
            title="Go to Home Page"
            dropdownKey="home"
            anchorpoints={[
              { label: "Featured Paintings", value: "paintings" },
              { label: "Traditional Textiles", value: "textiles" },
              { label: "Cultural Sculptures", value: "sculptures" },
              { label: "Gold Artifacts", value: "gold" },
            ]}
          />
        )}
        {flags["catalogs"] && (
          <NavItem to="/catalogs" label="Catalogs" title="View Artifacts Catalog" />
        )}
        {flags["article"] && (
          <NavItem to="/articles" label="News & Events" title="View News & Events" />
        )}
        {flags["about"] && (
          <NavItem
            to="/about"
            label="About"
            title="Learn About Museo Bulawan"
            dropdownKey="about"
            anchorpoints={[
              { label: "Latest News", value: "latest" },
              { label: "Upcoming Events", value: "upcoming" },
              { label: "Past Events", value: "past" },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default PublicNav;