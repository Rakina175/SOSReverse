import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import { Navigation } from './Navigation';
import { Radio, HeartHandshake, ArrowRight } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { activeEmergency, emergencies } = useSOS();
  const location = useLocation();

  // If user is not logged in, just render children directly (clean canvas for login/register/landing)
  if (!user) {
    return <div className="min-h-screen bg-brand-dark">{children}</div>;
  }

  // Check if volunteer has active accepted incident
  const activeVolunteerMission = user.role === 'volunteer'
    ? emergencies.find(e => e.responderId === user.uid && e.status !== 'Resolved')
    : null;

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <Navigation />

      {/* Main View Container */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 pt-16 lg:pt-0">
        
        {/* Dynamic Global Emergency Banner */}
        {activeEmergency && location.pathname !== '/tracking' && location.pathname !== '/chat' && (
          <div className="w-full bg-rose-950/80 backdrop-blur border-b border-rose-900/60 px-4 py-2 flex items-center justify-between text-xs sm:text-sm animate-glow-red z-10 sticky top-16 lg:top-0">
            <div className="flex items-center gap-2 text-rose-300">
              <Radio size={16} className="animate-pulse" />
              <span className="font-bold">Active SOS Broadcast:</span>
              <span className="text-rose-400 font-semibold truncate hidden sm:inline">
                {activeEmergency.type} - Emergency dispatch en route
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/tracking"
                className="flex items-center gap-1 font-bold text-white hover:text-rose-300 transition-colors bg-rose-600/40 px-2 py-1 rounded border border-rose-500/20"
              >
                Track Live
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {activeVolunteerMission && location.pathname !== '/tracking' && location.pathname !== '/chat' && (
          <div className="w-full bg-indigo-950/80 backdrop-blur border-b border-indigo-900/60 px-4 py-2 flex items-center justify-between text-xs sm:text-sm z-10 sticky top-16 lg:top-0">
            <div className="flex items-center gap-2 text-indigo-300">
              <HeartHandshake size={16} className="animate-bounce" />
              <span className="font-bold">Active Mission Assigned:</span>
              <span className="text-indigo-400 font-semibold truncate hidden sm:inline">
                Assist {activeVolunteerMission.userName} ({activeVolunteerMission.type})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/tracking"
                className="flex items-center gap-1 font-bold text-white hover:text-indigo-300 transition-colors bg-indigo-600/40 px-2 py-1 rounded border border-indigo-500/20"
              >
                Navigate Route
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* Dynamic page content wrapper */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
