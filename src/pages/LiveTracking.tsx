import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSOS } from '../context/SOSContext';
import { GoogleMapWrapper } from '../components/GoogleMapWrapper';
import { Radio, Map, MessageSquare, User } from 'lucide-react';

export const LiveTracking: React.FC = () => {
  const { activeEmergency, cancelSOS, getDistanceKm } = useSOS();
  const navigate = useNavigate();

  // If responderaccepted we look for it in global emergencies too
  const currentSOS = activeEmergency;

  const handleCancel = async () => {
    if (!currentSOS) return;
    if (confirm('Are you sure you want to mark this emergency as Resolved / Safe?')) {
      try {
        await cancelSOS(currentSOS.id);
        navigate('/dashboard');
      } catch (err: any) {
        alert(err.message || 'Failed to cancel SOS.');
      }
    }
  };

  // If no active emergency, show clean empty state
  if (!currentSOS) {
    return (
      <div className="glass-card rounded-2xl border border-slate-800 p-8 text-center max-w-md mx-auto my-10 flex flex-col items-center">
        <div className="p-3 bg-slate-900 border border-slate-800 text-slate-500 rounded-full mb-4">
          <Map size={32} />
        </div>
        <h3 className="text-base font-bold text-white mb-2">No Active SOS Broadcast</h3>
        <p className="text-xs text-slate-400 leading-normal max-w-sm mb-6">
          You do not have any active emergency dispatches right now. Go to the Control Center to send an SOS.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all"
        >
          Return to Control Center
        </Link>
      </div>
    );
  }

  // Calculate distance & ETA
  let distanceStr = '--';
  let etaStr = '--';

  if (currentSOS.responderLatitude && currentSOS.responderLongitude) {
    const dist = getDistanceKm(
      currentSOS.responderLatitude,
      currentSOS.responderLongitude,
      currentSOS.latitude,
      currentSOS.longitude
    );
    distanceStr = `${dist.toFixed(2)} KM`;
    
    // Average 40km/h speed for vehicle responder.
    // Time = Distance / Speed
    // Minutes = (Dist / 40) * 60 = Dist * 1.5
    const minsTotal = dist * 1.5;
    const mins = Math.floor(minsTotal);
    const secs = Math.floor((minsTotal - mins) * 60);
    
    if (mins === 0 && secs === 0) {
      etaStr = 'Arrived';
    } else {
      etaStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      
      {/* LEFT COLUMN: Map Viewport (Takes 2/3 cols on desktop) */}
      <div className="lg:col-span-2 relative h-96 lg:h-full rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl">
        <GoogleMapWrapper
          victimLat={currentSOS.latitude}
          victimLon={currentSOS.longitude}
          responderLat={currentSOS.responderLatitude}
          responderLon={currentSOS.responderLongitude}
        />
      </div>

      {/* RIGHT COLUMN: Control panel, responder profile, timeline */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        
        {/* Incident Info Header */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[9px] bg-rose-600/25 text-rose-400 border border-rose-500/20 font-black tracking-widest px-2 py-0.5 rounded uppercase">
              {currentSOS.type}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              currentSOS.status === 'Pending' 
                ? 'bg-amber-600/10 border-amber-500/20 text-amber-400' 
                : 'bg-emerald-600/15 border-emerald-500/25 text-emerald-400 animate-pulse'
            }`}>
              {currentSOS.status}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-rose-500/50 pl-3">
            "{currentSOS.description || 'No additional incident description notes provided.'}"
          </p>
        </div>

        {/* Responder Stats Card */}
        {currentSOS.status === 'Pending' ? (
          /* Searching Radar View */
          <div className="glass-card p-6 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center flex-1 min-h-[12rem]">
            <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-rose-500/20 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border border-rose-500/10 animate-ping" style={{ animationDelay: '0.6s' }}></div>
              <div className="w-10 h-10 bg-rose-600/10 border border-rose-500/30 rounded-full flex items-center justify-center text-rose-500">
                <Radio size={20} className="animate-pulse" />
              </div>
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5 animate-pulse">Broadcasting emergency beacon...</h4>
            <p className="text-[10px] text-slate-400 leading-normal max-w-xs">
              Pinging verified volunteer responders within your safety radius range. Please remain in a secure location.
            </p>
          </div>
        ) : (
          /* Assigned Responder Profile */
          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                <User size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{currentSOS.responderName}</h4>
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Verified Responder</span>
              </div>
            </div>

            {/* Geodesics overlay */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold block mb-0.5 uppercase tracking-wider">Distance</span>
                <span className="text-sm font-extrabold text-white">{distanceStr}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold block mb-0.5 uppercase tracking-wider">Est. Arrival</span>
                <span className="text-sm font-extrabold text-indigo-400">{etaStr}</span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Status tracker */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Incident Progress Timeline</h4>
          
          <div className="flex flex-col gap-5 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {[
              {
                label: 'SOS Broadcasted',
                sub: 'Emergency signal registered on network',
                done: true
              },
              {
                label: 'Responder Dispatched',
                sub: currentSOS.responderName ? `Accepted by ${currentSOS.responderName}` : 'Finding accredited responder...',
                done: currentSOS.status !== 'Pending'
              },
              {
                label: 'En Route',
                sub: 'Responder heading towards coordinates',
                done: currentSOS.status === 'En Route' || currentSOS.status === 'Arrived' || currentSOS.status === 'Resolved'
              },
              {
                label: 'Arrived at Site',
                sub: 'Responder arrived to assist',
                done: currentSOS.status === 'Arrived' || currentSOS.status === 'Resolved'
              }
            ].map((step, idx) => (
              <div key={idx} className="relative text-xs">
                {/* Node icon dot */}
                <div className={`absolute -left-5.5 top-1 w-3.5 h-3.5 rounded-full border-2 transition-colors flex items-center justify-center ${
                  step.done 
                    ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/25 text-white' 
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  {step.done && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
                
                <h5 className={`font-bold ${step.done ? 'text-slate-100' : 'text-slate-500'}`}>{step.label}</h5>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{step.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick controls panel */}
        <div className="flex items-center gap-2">
          <Link
            to="/chat"
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
              currentSOS.status === 'Pending'
                ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white'
            }`}
            onClick={(e) => {
              if (currentSOS.status === 'Pending') e.preventDefault();
            }}
          >
            <MessageSquare size={14} />
            Chat Responder
          </Link>
          
          <button
            onClick={handleCancel}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-rose-950/20 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
          >
            I am Safe / Resolve
          </button>
        </div>

      </div>
    </div>
  );
};
