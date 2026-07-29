import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import { Radio, ShieldAlert, Heart, Users, Map, MessageSquare, ShieldCheck, HeartPulse, Flame } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeEmergency, contacts } = useSOS();

  if (!user) return null;

  // Find primary contact
  const primaryContact = contacts.find(c => c.isPrimary);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Welcome header widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-panel rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/60 via-slate-900/30 to-transparent">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight m-0">
            Welcome to Grid, <span className="text-rose-500">{user.fullName}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Reverse SOS is monitoring your area. Coordinates sync: <span className="text-indigo-400 font-mono">NY-GRID-02</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck size={12} />
            Secure Node Online
          </span>
        </div>
      </div>

      {/* ACTIVE EMERGENCY BANNER PANEL */}
      {activeEmergency ? (
        <div className="p-6 rounded-3xl bg-rose-600/10 border border-rose-500/35 bg-gradient-to-br from-rose-950/10 to-slate-900/60 shadow-lg shadow-rose-950/15 animate-glow-red flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-rose-600/20 border border-rose-500/30 text-rose-400 rounded-2xl animate-pulse flex-shrink-0">
              <Radio size={28} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-600/25 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase tracking-widest mb-1.5">
                ACTIVE SOS BROADCAST
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">
                Incident: {activeEmergency.type}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                Status is currently <span className="font-bold text-rose-400">{activeEmergency.status}</span>. {
                  activeEmergency.status === 'Pending' 
                    ? 'Waiting for nearby volunteers to pick up your dispatch.' 
                    : `Assigned Responder: ${activeEmergency.responderName} is approaching your location.`
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <Link
              to="/tracking"
              className="w-full sm:w-auto text-center flex items-center justify-center gap-1.5 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
            >
              <Map size={14} />
              Open Real-Time Map
            </Link>
            <Link
              to="/chat"
              className="w-full sm:w-auto text-center flex items-center justify-center gap-1.5 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <MessageSquare size={14} />
              Incident Chat Room
            </Link>
          </div>
        </div>
      ) : (
        /* TRIGGER SOS SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Giant Alarm trigger */}
          <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-950/60">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-600/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

            <div className="mb-6 relative flex items-center justify-center">
              {/* Pulse rings */}
              <div className="absolute w-24 h-24 rounded-full border border-rose-500/25 bg-rose-600/5 animate-pulse-ring"></div>
              <div className="absolute w-32 h-32 rounded-full border border-rose-500/10 bg-rose-600/5 animate-pulse-ring" style={{ animationDelay: '0.8s' }}></div>
              
              <Link
                to="/send-sos"
                className="w-20 h-20 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-600/45 cursor-pointer relative z-10 transition-transform duration-300 hover:scale-105 active:scale-95 group border-2 border-rose-400/20"
              >
                <ShieldAlert size={36} className="text-white group-hover:scale-110 duration-200" />
              </Link>
            </div>

            <h3 className="text-lg font-bold text-white">Broadcast Emergency SOS</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
              Facing immediate danger or require critical assistance? Click the trigger to broadcast your location and medical ID to accredited nearby responders.
            </p>
          </div>

          {/* Right Status Widgets Column */}
          <div className="flex flex-col gap-6">
            {/* Responders Count Card */}
            <div className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col justify-between h-full bg-gradient-to-br from-indigo-950/10 to-slate-900/40">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">SAFETY RANGE SHIELD</span>
                <h4 className="text-sm font-bold text-white">Active Responders in NYC</h4>
              </div>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white tracking-tight animate-float" style={{ animationDuration: '3s' }}>18</span>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ready on standby</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-normal flex items-start gap-2">
                <ShieldCheck size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>All responders carry verified credentials checked by Reverse SOS administration.</span>
              </div>
            </div>

            {/* Trusted Circle Quick List Card */}
            <div className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col justify-between h-full">
              <div>
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-1">TRUSTED CIRCLE</span>
                <h4 className="text-sm font-bold text-white">Emergency Contacts</h4>
              </div>
              
              <div className="my-3">
                {primaryContact ? (
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-slate-850">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{primaryContact.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">{primaryContact.relationship} (Primary)</p>
                    </div>
                    <span className="text-xs font-mono text-rose-400 font-semibold">{primaryContact.phoneNumber}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No primary contact defined.</p>
                )}
              </div>

              <Link
                to="/contacts"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850 rounded-xl text-[10px] font-bold tracking-wider uppercase text-center flex items-center justify-center gap-1 transition-colors"
              >
                <Users size={12} />
                Manage Circle Contacts
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* BOTTOM SECTION: GUIDANCE & TIPS */}
      <div className="mt-2">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">First-Aid Emergency Guidance</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Medical Distress',
              desc: 'Stay calm. If breathing is obstructed, check airways. Ensure chest compressions start if patient is unresponsive. Responders will check medical ID.',
              icon: <HeartPulse className="text-rose-500" size={18} />
            },
            {
              title: 'Severe Injury / Bleeding',
              desc: 'Apply direct, high pressure to the wound with sterile dressings or clean cloth. Elevate injured limbs. Do not remove saturated cloths.',
              icon: <Heart className="text-indigo-400" size={18} />
            },
            {
              title: 'Structure Fire Hazard',
              desc: 'Drop low to the ground to avoid inhaling toxic smoke. Cover mouth with a damp cloth if possible. Evacuate immediately and trigger SOS.',
              icon: <Flame className="text-amber-500" size={18} />
            }
          ].map((tip, idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800/80">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg inline-block mb-3">
                {tip.icon}
              </div>
              <h4 className="text-xs font-bold text-white mb-1.5">{tip.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
