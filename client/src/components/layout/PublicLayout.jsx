import { Outlet, useLocation, matchPath } from 'react-router-dom';
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

  // Define themes for overall layout
  const themeRoutes = [
    { path: '/', theme: 'dark' },
    { path: '/home', theme: 'dark' },
    { path: '/catalogs', theme: 'dark' },
    { path: '/article/:id', theme: 'dark' },
    { path: '/articles', theme: 'dark' },
    { path: '/about', theme: 'dark' },
    { path: '/login', theme: 'light' },
  ];

  // Define themes specifically for the navigation bar
  const themeNavs = [
    { path: '/', theme: 'dark' },
    { path: '/home', theme: 'dark' },
    { path: '/catalogs', theme: 'dark' },
    { path: '/article/:id', theme: 'light' },
    { path: '/articles', theme: 'dark' },
    { path: '/about', theme: 'dark' },
    { path: '/login', theme: 'light' },
  ];

  const defaultTheme = 'light';

  const getMatchedTheme = (routesArray) =>
    routesArray.find(route =>
      matchPath({ path: route.path, end: true }, location.pathname)
    )?.theme || defaultTheme;

  const theme = getMatchedTheme(themeRoutes);      // Layout theme
  const navTheme = getMatchedTheme(themeNavs);     // Nav-specific theme

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
          } z-40 flex items-center justify-between h-10 min-h-fit`}
        >
          <PublicHeader theme={theme} />
        </header>
      )}

      {!isMinimalLayout && (
        <nav
          className={`
            z-25 px-8 pt-5 flex items-center h-35 min-h-20 bg-transparent
            w-full absolute top-0 left-0 shadow-md mt-10 justify-center
          `}
        >
          <PublicNav theme={navTheme} />
        </nav>
      )}

      <main className="flex-1 z-10 h-auto flex flex-col items-center min-h-fit overflow-y-auto  w-full">
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
