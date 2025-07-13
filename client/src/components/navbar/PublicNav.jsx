import Logo from '../../assets/LOGO.png';
import { useRouterFlags } from '../../context/routerFlagProvider';
import { NavLink } from 'react-router-dom';

const PublicNav = ({ theme = "light" }) => {
  const { flags, loading } = useRouterFlags();
    
  const bgClass = theme === "dark" ? "bg-black" : "bg-white";
  const textClass = theme === "dark" ? "text-white" : "text-black";
  const dividerClass = theme === "dark" ? "bg-white" : "bg-black";

  return (
    <div className={`w-full h-full flex items-center gap-x-4 px-10 ${bgClass}`}>
        <div className='flex gap-x-7 items-center'>
            <NavLink to="/">
                <img src={Logo} alt="Museo Bulawan Logo" className='w-18' />
            </NavLink>
            <div className='flex gap-x-2'>        
            <i className={`h-15 w-1.5 ${dividerClass}`}></i>
            <NavLink className={`flex flex-col text-3xl justify-center ${textClass}`} to="/">
                <span className={`font-bold leading-6 ${textClass}`}>Museo </span>
                <span className={`font-bold leading-6 ${textClass}`}>Bulawan</span>
            </NavLink>
            </div>
                {flags["catalogs"] && 
            <NavLink to='/catalogs'>Catalogs</NavLink>
            }
        </div>
    </div>
  )
}

export default PublicNav
