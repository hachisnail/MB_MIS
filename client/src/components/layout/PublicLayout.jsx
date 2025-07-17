import { Outlet, useLocation } from 'react-router-dom';
import PublicNav from '../navbar/PublicNav';
import PublicHeader from '../headers/PublicHeader';
import PublicFooter from '../footers/PublicFooter';

const PublicLayout = () => {

  const location = useLocation();


  const hiddenPaths = [
    '/login',
    '/login/forgot-password',
    '/recover',
    '/recover/success',
  ];

  const isMinimalLayout =
    hiddenPaths.includes(location.pathname) ||
    /^\/recover\/[^/]+$/.test(location.pathname);

  const themeRoutes = {
    '/': 'dark',
    '/home': 'dark',
    '/catalogs': 'light',
    '/articles': 'dark',
    '/about': 'dark',
    '/login': 'light',
  };

  const defaultTheme = 'light';
  const theme = themeRoutes[location.pathname] || defaultTheme;

  return (
    <div
      className={`${
        theme === 'dark' ? 'bg-[#1C1B19]' : 'bg-white'
      } flex flex-col h-fit min-h-screen w-screen overflow-scroll relative`}
    >
      {!isMinimalLayout && (
        <header
          className={`${
            theme === 'dark' ? 'bg-[#1C1B19]' : 'bg-white'
          } z-50 flex items-center justify-between h-10 min-h-fit`}
        >
          <PublicHeader theme={theme} />
        </header>
      )}

      {!isMinimalLayout && (
        <nav
          className={`
            ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}
            z-25 px-8 pt-5 flex items-center h-35 
            w-full absolute top-0 left-0 shadow-md mt-10 justify-center
          `}
        >
          <PublicNav theme={theme} />
        </nav>
      )}

      <main className="flex-1 z-10 h-auto flex flex-col items-center min-h-fit overflow-y-auto pb-5 w-full">
        <Outlet />
      </main>

      {!isMinimalLayout && (
        <footer className="flex items-center justify-center bg-white h-fit">
          <PublicFooter />
        </footer>
      )}
    </div>
  );
};

export default PublicLayout;
