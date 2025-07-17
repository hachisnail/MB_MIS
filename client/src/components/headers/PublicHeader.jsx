import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

function getHeaderThemeClasses(theme, isScrolled) {
  const bgClass = isScrolled
    ? "bg-[#1C1B19] shadow-md "
    : theme === "dark"
    ? "bg-[#1C1B19] shadow-md"
    : "bg-transparent shadow-md";

  const textClass = isScrolled
    ? "text-white"
    : theme === "dark"
    ? "text-white"
    : "text-black";

  return { bgClass, textClass };
}

const PublicHeader = ({ theme = "light" }) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    setIsScrolled(currentScrollY > 5);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { bgClass } = getHeaderThemeClasses(theme, isScrolled);
  let { textClass } = getHeaderThemeClasses(theme, isScrolled);

  return (
    <header
      className={`w-full shadow-md fixed z-50 transition-all h-10 duration-300 ${bgClass}`}
    >
      <div className="flex w-auto h-full justify-between px-5">
        <span
          className={`${textClass} text-[0.65rem] sm:text-xs md:text-md lg:text-md xl:text-md h-fit w-fit my-auto`}
        >
          Open Daily 9:00am-5:00pm, Monday-Friday, Closed During Holidays
        </span>
        <div className="w-auto flex items-center">
          {isScrolled && (
            <div className="inline-block animate-slide-in-right">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `mx-2 text-xs my-auto cursor-pointer ${
                    isActive
                      ? `underline underline-offset-4 decoration-1 ${textClass}`
                      : textClass
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/articles"
                className={({ isActive }) =>
                  `mx-2 text-xs my-auto cursor-pointer ${
                    isActive
                      ? `underline underline-offset-4 decoration-1 ${textClass}`
                      : textClass
                  }`
                }
              >
                News & Events
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `mx-2 text-xs my-auto cursor-pointer ${
                    isActive
                      ? `underline underline-offset-4 decoration-1 ${textClass}`
                      : textClass
                  }`
                }
              >
                About
              </NavLink>
            </div>
          )}

          <NavLink to="/login" className="mx-2 my-auto ">
            <span
              className={`${
                location.pathname === "/login" ? "hidden" : ""
              } ${textClass} px-1 hover:text-gray-400 border border-gray-700 font-semibold rounded-sm text-xs my-auto cursor-pointer`}
            >
              Login
            </span>
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
