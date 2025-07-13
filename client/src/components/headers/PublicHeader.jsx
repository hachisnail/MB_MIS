import { useState, useEffect } from 'react';
import { NavLink, useLocation  } from 'react-router-dom';

function getHeaderThemeClasses(theme, isScrolled) {
  const bgClass = isScrolled
    ? theme === "dark" ? "bg-black shadow-lg" : "bg-[#1C1B19] shadow-lg"
    : theme === "dark" ? "bg-black shadow-none" : "bg-transparent shadow-none";
  const textClass = theme === "dark" ? "text-white" : "text-black";
  return { bgClass, textClass };
}

const PublicHeader = ({ theme = "light" }) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);


  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    setIsScrolled(currentScrollY > 50);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); 

  const { bgClass, textClass } = getHeaderThemeClasses(theme, isScrolled);

  return   (
      <>
      
      <header className={`w-full fixed z-50 transition-all mb- duration-300 ${bgClass}`}>
      <div className="flex w-auto h-7 justify-between px-5">
        <span className={`${textClass} ${isScrolled ? "text-white":"text-black"} text-[0.65rem] sm:text-xs md:text-md lg:text-md xl:text-md h-fit w-fit my-auto`}>
          Open Daily 9:00am-5:00pm, Monday-Friday, Closed During Holidays
        </span>
        <div className="w-auto flex items-center">
          {isScrolled && (
            <div className="inline-block animate-slide-in-right">
              <NavLink to="/" className="mx-2">
                <span className={`text-xs my-auto cursor-pointer ${textClass}`}>Home</span>
              </NavLink>
              <NavLink to="/content" className="mx-2">
                <span className={`text-xs my-auto cursor-pointer ${textClass}`}>News & Events</span>
              </NavLink>
              <NavLink to="/about" className="mx-2">
                <span className={`text-xs my-auto cursor-pointer ${textClass}`}>About</span>
              </NavLink>
            </div>
          )}
          <NavLink to="/login" className="mx-2 my-auto drop-shadow-[1px_1px_1px_black]">
            <span className={` ${location.pathname === '/login' ? 'hidden' : ''} ${textClass} text-xs my-auto cursor-pointer`}>
              Login
            </span>
          </NavLink>
        </div>
      </div>
    </header>
    </>
    
  )
}

export default PublicHeader
