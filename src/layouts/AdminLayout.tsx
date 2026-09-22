import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  Activity, 
  ShieldAlert, 
  FileBarChart, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  QrCode
} from 'lucide-react';
import { cn } from '../utils/cn';
import { apiClient } from '../services/api/apiClient';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/admin/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Students', path: '/admin/students', icon: <Users size={20} /> },
    { name: 'Meal Sessions', path: '/admin/meals', icon: <UtensilsCrossed size={20} /> },
    { name: 'QR Display', path: '/admin/qr-display', icon: <QrCode size={20} /> },
    { name: 'Live Scans', path: '/admin/scans', icon: <Activity size={20} /> },
    { name: 'Security Alerts', path: '/admin/alerts', icon: <ShieldAlert size={20} /> },
    { name: 'Reports', path: '/admin/reports', icon: <FileBarChart size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#0D2B45] text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 bg-[#092033] border-b border-white/10 shrink-0">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white text-sm font-black">
              DC
            </div>
            Admin Portal
          </h1>
          <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-white font-medium shadow-sm' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#092033]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold">{user?.name.charAt(0)}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-white/50 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-text-muted hover:text-text"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-text hidden sm:block">
              University System Administration
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <p className="text-sm text-text-muted hidden md:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-text-muted hover:bg-surface rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
                )}
              </button>
              
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-border overflow-hidden z-50">
                  <div className="p-3 border-b border-border bg-surface flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-text-muted">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-border/50 hover:bg-surface/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm text-secondary">{n.title}</h4>
                            <span className="text-xs text-text-muted whitespace-nowrap ml-2">
                              {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-1">{n.message}</p>
                          {n.link && (
                            <Link to={n.link} className="text-xs text-primary mt-2 inline-block hover:underline" onClick={() => setIsNotifOpen(false)}>
                              View Details
                            </Link>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-border bg-surface text-center">
                    <button 
                      onClick={async () => {
                        try {
                          await apiClient.post('/admin/notifications/mark-all-read');
                          setNotifications(notifications.map(n => ({...n, is_read: true})));
                        } catch (err) {
                          console.error('Failed to mark as read', err);
                        }
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
