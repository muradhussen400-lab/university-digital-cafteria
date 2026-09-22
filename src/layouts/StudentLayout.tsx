import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, ScanLine, History, CalendarDays, UserCircle, LogOut } from 'lucide-react';

export const StudentLayout = () => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={24} /> },
    { name: 'Scan', path: '/student/scan', icon: <ScanLine size={24} /> },
    { name: 'History', path: '/student/history', icon: <History size={24} /> },
    { name: 'Calendar', path: '/student/calendar', icon: <CalendarDays size={24} /> },
  ];

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold text-secondary flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-sm font-black">
              DC
            </span>
            Cafeteria
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-text-muted hover:bg-gray-100 hover:text-text'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
          <NavLink
            to="/student/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-text-muted hover:bg-gray-100 hover:text-text'
              }`
            }
          >
            <UserCircle size={24} />
            Profile
          </NavLink>
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-md text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-border flex-shrink-0 z-10">
          <h1 className="text-lg font-bold text-secondary">Digital Cafeteria</h1>
          <NavLink to="/student/profile" className="text-text-muted">
            <UserCircle size={24} />
          </NavLink>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 relative w-full h-full">
          <div className="p-4 md:p-8 max-w-5xl mx-auto h-full">
            <Outlet />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around z-20 pb-safe">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`
              }
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  );
};
