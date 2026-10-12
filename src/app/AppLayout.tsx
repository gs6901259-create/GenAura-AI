import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNav } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-navy-950">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <MobileNav />

        {/* Page content */}
        <main
          className="flex-1 p-4 lg:p-6 overflow-y-auto"
          id="main-content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
