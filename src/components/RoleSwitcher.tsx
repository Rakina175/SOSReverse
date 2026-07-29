import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import { Shield, User, HeartHandshake, EyeOff, Cpu, HelpCircle } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { user, registerUser, loginUser, logoutUser, isFirebase } = useAuth();
  const { emergencies, activeEmergency, startTrackingSimulation, stopTrackingSimulation } = useSOS();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // If no user is logged in, we can provide a quick register/login helper
  const handleQuickLogin = async (role: 'citizen' | 'volunteer' | 'admin') => {
    setLoading(true);
    try {
      // First, log out current
      if (user) {
        await logoutUser();
      }

      // Check if user already exists in simulator
      const email = `mock_${role}@sos.com`;
      const pass = 'password123';

      try {
        await loginUser(email, pass);
      } catch (err) {
        // If fail, register
        const name = role === 'citizen' ? 'Jane Doe (Citizen)' 
                   : role === 'volunteer' ? 'Officer John (Volunteer)' 
                   : 'Super Admin';
        const phone = role === 'citizen' ? '555-0199' : role === 'volunteer' ? '555-9111' : '555-0000';
        await registerUser(email, pass, name, phone, role);
      }
    } catch (e) {
      console.error('Quick login failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGPS = () => {
    const active = activeEmergency || emergencies.find(e => e.status === 'Accepted' || e.status === 'En Route');
    if (active) {
      startTrackingSimulation(active.id);
      alert('Volunteer GPS simulation started. The responder will update position every 4 seconds.');
    } else {
      alert('No active emergency has been accepted yet. Please send an SOS as Citizen, switch to Volunteer, accept it, and then simulate GPS!');
    }
  };

  const handleStopGPS = () => {
    stopTrackingSimulation();
    alert('GPS simulation stopped.');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg border border-indigo-400 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 duration-200"
        title="Open Simulator Controls"
      >
        <Cpu size={20} className="animate-spin-slow" />
        <span className="text-xs font-semibold pr-1">Developer Sandbox</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-80 glass-panel rounded-2xl border border-slate-700 shadow-2xl p-4 transition-all duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="text-indigo-400 animate-pulse" size={18} />
          <span className="text-sm font-bold tracking-wide text-indigo-100">SIMULATOR CONTROLS</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <EyeOff size={16} />
        </button>
      </div>

      {/* Connection Mode */}
      <div className="flex items-center justify-between text-xs mb-3 px-2 py-1 bg-slate-900/60 rounded border border-slate-800">
        <span className="text-slate-400">Database Engine:</span>
        <span className={`font-semibold ${isFirebase ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
          {isFirebase ? 'Cloud Firebase' : 'Sandbox (LocalStorage)'}
        </span>
      </div>

      {/* Active Identity Details */}
      <div className="mb-4 text-xs">
        <p className="text-slate-400 mb-1 font-semibold">Active User Session:</p>
        {user ? (
          <div className="p-2 bg-slate-800/40 rounded border border-slate-800">
            <p className="font-semibold text-slate-200">{user.fullName}</p>
            <p className="text-slate-400 text-[10px]">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {user.role === 'admin' ? <Shield size={12} className="text-emerald-400" /> :
               user.role === 'volunteer' ? <HeartHandshake size={12} className="text-indigo-400" /> :
               <User size={12} className="text-rose-400" />}
              <span className="uppercase text-[9px] font-bold text-slate-300 tracking-wider">
                {user.role}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-2 bg-slate-900/40 text-slate-400 text-center italic rounded border border-slate-800">
            No active session detected.
          </div>
        )}
      </div>

      {/* Role Quick Toggle */}
      <div className="mb-4">
        <p className="text-xs text-slate-400 mb-1.5 font-semibold">Switch Persona / Login Role:</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickLogin('citizen')}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              user?.role === 'citizen'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-slate-800/30 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <User size={16} />
            <span className="text-[9px] font-bold mt-1">Citizen</span>
          </button>

          <button
            onClick={() => handleQuickLogin('volunteer')}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              user?.role === 'volunteer'
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-800/30 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <HeartHandshake size={16} />
            <span className="text-[9px] font-bold mt-1">Volunteer</span>
          </button>

          <button
            onClick={() => handleQuickLogin('admin')}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              user?.role === 'admin'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800/30 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shield size={16} />
            <span className="text-[9px] font-bold mt-1">Admin</span>
          </button>
        </div>
      </div>

      {/* Scenario Simulations */}
      <div>
        <p className="text-xs text-slate-400 mb-1.5 font-semibold">Incident Simulations:</p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleSimulateGPS}
            className="w-full text-left py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer justify-center"
          >
            <Cpu size={12} />
            Simulate Active Responder Movement
          </button>
          
          <button
            onClick={handleStopGPS}
            className="w-full text-left py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer justify-center"
          >
            Stop GPS Simulation
          </button>
        </div>
      </div>

      {/* Simulator Help Alert */}
      <div className="mt-3 flex items-start gap-1 p-2 bg-indigo-950/20 rounded border border-indigo-900/30 text-[10px] text-slate-400">
        <HelpCircle size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
        <p>
          Tip: Open multiple browser tabs! One as a Citizen (to send SOS) and another as a Volunteer (to accept SOS). You will see real-time updates!
        </p>
      </div>
    </div>
  );
};
