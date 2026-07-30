import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Radio, 
  Users, 
  Map, 
  MessageSquare, 
  History, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ShieldAlert as AdminShield,
  Activity
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  disabled?: boolean;
  tooltip?: string;
  badge?: string | null;
  badgeColor?: string;
}

export const Navigation: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const { activeEmergency, emergencies } = useSOS();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  // If not logged in, don't show navigation sidebar (landing page uses standard landing header)
  if (!user) return null;

  // Check if user has active volunteer duty en-route
  const activeVolunteerMission = user.role === 'volunteer' 
    ? emergencies.find(e => e.responderId === user.uid && e.status !== 'Resolved') 
    : null;

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  // Sidebar items definition
  const citizenItems: NavItem[] = [
    { label: 'Control Center', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { 
      label: 'Broadcast SOS', 
      path: '/send-sos', 
      icon: <Radio size={20} className={activeEmergency ? 'text-rose-500 animate-pulse' : ''} />,
      badge: activeEmergency ? 'ACTIVE' : null,
      badgeColor: 'bg-rose-600/30 text-rose-400 border border-rose-500/30'
    },
    { label: 'Trusted Contacts', path: '/contacts', icon: <Users size={20} /> },
    { 
      label: 'Live Tracking', 
      path: '/tracking', 
      icon: <Map size={20} />, 
      disabled: !activeEmergency,
      tooltip: 'Available during active SOS' 
    },
    { 
      label: 'Emergency Chat', 
      path: '/chat', 
      icon: <MessageSquare size={20} />, 
      disabled: !activeEmergency,
      tooltip: 'Available during active SOS' 
    },
    { label: 'Emergency History', path: '/history', icon: <History size={20} /> },
    { label: 'Medical Profile', path: '/profile', icon: <User size={20} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const volunteerItems: NavItem[] = [
    { label: 'Volunteer Radar', path: '/volunteer', icon: <Activity size={20} /> },
    { 
      label: 'Active Tracking', 
      path: '/tracking', 
      icon: <Map size={20} />, 
      disabled: !activeVolunteerMission,
      tooltip: 'Available when incident accepted' 
    },
    { 
      label: 'Incident Chat', 
      path: '/chat', 
      icon: <MessageSquare size={20} />, 
      disabled: !activeVolunteerMission,
      tooltip: 'Available when incident accepted' 
    },
    { label: 'Duty History', path: '/history', icon: <History size={20} /> },
    { label: 'Responder Profile', path: '/profile', icon: <User size={20} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const adminItems: NavItem[] = [
    { label: 'Admin Terminal', path: '/admin', icon: <AdminShield size={20} /> },
    { label: 'System History', path: '/history', icon: <History size={20} /> },
    { label: 'My Profile', path: '/profile', icon: <User size={20} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const items = user.role === 'admin' ? adminItems 
              : user.role === 'volunteer' ? volunteerItems 
              : citizenItems;

  const renderNavContent = () => (
    <div className="flex flex-col h-full p-4 justify-between">
      {/* Brand logo header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-4 border-b border-slate-800 mb-6">
          <div className="p-2.5 bg-rose-600/20 border border-rose-500/30 rounded-xl">
            <ShieldAlert className="text-rose-500 animate-pulse" size={24} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wider m-0 leading-none">
              REVERSE <span className="text-rose-500">SOS</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 block">
              RESPONDER SYSTEM
            </span>
          </div>
        </div>

        {/* Navigation links list */}
        <nav className="flex flex-col gap-1.5">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            
            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl text-slate-600 border border-transparent cursor-not-allowed select-none transition-all group"
                  title={item.tooltip}
                >
                  <div className="flex items-center gap-3.5 opacity-40">
                    {item.icon}
                    <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 opacity-60">
                    LOCKED
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-semibold'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 hover:border-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={isActive ? 'text-rose-400' : 'text-slate-500 group-hover:text-slate-300'}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Account actions logout */}
      <div className="border-t border-slate-800 pt-4">
        {/* Simple card detailing profile */}
        <div className="flex items-center gap-3 px-2 py-2 mb-4 bg-slate-900/40 rounded-xl border border-slate-800">
          <img
            src={user.profilePhoto}
            alt="Profile Avatar"
            className="w-9 h-9 rounded-lg border border-slate-800 bg-slate-950"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate m-0 leading-tight">
              {user.fullName}
            </p>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-rose-600/15 border border-slate-800 hover:border-rose-600/30 text-slate-400 hover:text-rose-400 font-semibold rounded-xl text-sm transition-all cursor-pointer"
        >
          <LogOut size={16} />
          Logout Session
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop view navigation (sidebar) */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed top-0 left-0 glass-panel border-r border-slate-800/80 z-20">
        {renderNavContent()}
      </aside>

      {/* Mobile viewport header bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-panel border-b border-slate-800 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-rose-500 animate-pulse" size={20} />
          <h1 className="text-sm font-extrabold text-white tracking-wider uppercase m-0 leading-none">
            REVERSE <span className="text-rose-500">SOS</span>
          </h1>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white cursor-pointer"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer layout */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <aside className="relative flex flex-col w-64 h-full bg-brand-dark/95 border-r border-slate-800 z-50 animate-slide-in">
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
