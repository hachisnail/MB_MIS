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

  console.log('PublicLayout isMinimalLayout:', isMinimalLayout, location.pathname);

  return (
    <div className="flex flex-col h-fit min-h-screen w-screen overflow-scroll">
      {/* Header */}
      {!isMinimalLayout && (
        <header className="bg-white flex items-center mb-5 justify-between border-b border-gray-300 h-7 min-h-fit shadow-sm">
          <PublicHeader />
        </header>
      )}

      {/* Navigation Bar */}
      {!isMinimalLayout && (
        <nav className="bg-white flex items-center px-8 h-20 min-h-20 max-h-20">
          <PublicNav />
        </nav>
      )}

      {/* Main content */}
      <main className="flex-1 h-auto min-h-fit overflow-y-auto px-4 py-2 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      {!isMinimalLayout && (
        <footer className="flex items-center justify-center bg-white h-fit">
          <PublicFooter />
        </footer>
      )}
    </div>
  );
};

export default PublicLayout;
