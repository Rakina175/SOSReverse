
import React, { useState, useEffect } from 'react';
import { useAuth, type UserProfile } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import { Users, Radio, Check, ShieldAlert } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  useAuth();
  const { emergencies } = useSOS();

  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);

  // Load volunteers list in local storage simulation or firebase queries
  useEffect(() => {
    const loadUsers = () => {
      const mockUsers = JSON.parse(localStorage.getItem('sos_users') || '[]');
      const vList = mockUsers.filter((u: any) => u.role === 'volunteer');
      setVolunteers(vList);
    };

    loadUsers();
    const interval = setInterval(loadUsers, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyVolunteer = (uid: string, verify: boolean) => {
    // Vetting toggle: set checked state in local storage simulation
    const mockUsers = JSON.parse(localStorage.getItem('sos_users') || '[]');
    const updated = mockUsers.map((u: any) => {
      if (u.uid === uid) {
        // Toggle validation inside profile variables
        return {
          ...u,
          medicalConditions: verify ? 'Verified Responder: Vetted status' : 'Pending verification',
        };
      }
      return u;
    });

    localStorage.setItem('sos_users', JSON.stringify(updated));
    
    // Update local state immediately
    const vList = updated.filter((u: any) => u.role === 'volunteer');
    setVolunteers(vList);
  };

  // Analytics variables
  const totalIncidents = emergencies.length;
  const activeSOS = emergencies.filter(e => e.status !== 'Resolved').length;
  const pendingSOS = emergencies.filter(e => e.status === 'Pending').length;
  const resolvedSOS = emergencies.filter(e => e.status === 'Resolved').length;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-extrabold text-white tracking-tight m-0">Admin Terminal Command Center</h2>
        <p className="text-xs text-slate-400 mt-1">
          Review network coverage statistics, audit active dispatches, and verify volunteer responder credentials.
        </p>
      </div>

      {/* Grid of Analytics widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', val: totalIncidents, sub: 'All-time dispatches' },
          { label: 'Active Alerts', val: activeSOS, sub: 'Currently broadcasted' },
          { label: 'Pending Dispatch', val: pendingSOS, sub: 'Waiting for acceptance' },
          { label: 'Resolved SOS', val: resolvedSOS, sub: 'Success resolution' }
        ].map((widget, i) => (
          <div key={i} className="glass-card p-5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">{widget.label}</span>
            <span className="text-3xl font-extrabold text-white block tracking-tight">{widget.val}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">{widget.sub}</span>
          </div>
        ))}
      </div>

      {/* Global Warning Broadcast widget */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl flex-shrink-0">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">Global Security Broadcaster</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal max-w-xl font-semibold">
              Warning: Click to broadcast regional threats or natural disaster warnings. This sends an automatic override message to all online citizen nodes.
            </p>
          </div>
        </div>

        <button 
          onClick={() => alert('[Admin Simulation] Regional warning override signal broadcasted.')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/10 cursor-pointer w-full sm:w-auto"
        >
          Signal Threat Warning
        </button>
      </div>

      {/* Bottom Main Content split: Left Active SOS lists, Right Volunteer Vetting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: Active emergencies list */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
            Live Active Incidents ({emergencies.filter(e => e.status !== 'Resolved').length})
          </h3>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[22rem] pr-1">
            {emergencies.filter(e => e.status !== 'Resolved').length === 0 ? (
              <div className="my-auto py-10 text-center text-slate-500 italic text-xs">
                No active emergencies currently reported on the grid.
              </div>
            ) : (
              emergencies.filter(e => e.status !== 'Resolved').map((sos) => (
                <div key={sos.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-850 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{sos.type}</span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-rose-400 border border-rose-500/15 uppercase font-bold">
                        {sos.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Citizen: {sos.userName}</p>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">"{sos.description || 'No description notes.'}"</p>
                  </div>

                  {sos.responderName && (
                    <span className="text-[9px] bg-indigo-950/20 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded uppercase font-bold text-right flex-shrink-0">
                      Res: {sos.responderName}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card: Volunteer Vetting Center */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Users size={16} className="text-indigo-400" />
            Volunteer Certification Directory
          </h3>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[22rem] pr-1">
            {volunteers.length === 0 ? (
              <div className="my-auto py-10 text-center text-slate-500 italic text-xs">
                No registered volunteers found on the network.
              </div>
            ) : (
              volunteers.map((v) => {
                const isVerified = v.medicalConditions === 'Verified Responder: Vetted status';
                
                return (
                  <div key={v.uid} className="p-3 bg-slate-900/50 rounded-xl border border-slate-850 flex flex-col gap-2 text-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-white">{v.fullName}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{v.email}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{v.phoneNumber}</p>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase flex-shrink-0 ${
                        isVerified 
                          ? 'bg-emerald-600/10 border-emerald-500/25 text-emerald-400' 
                          : 'bg-amber-600/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-900 text-[10px] text-slate-400 leading-relaxed font-mono">
                      {v.emergencyNotes || 'Skills: CPR certified, EMT certification files uploaded'}
                    </div>

                    <div className="flex items-center gap-1.5 justify-end mt-1 border-t border-slate-900 pt-2">
                      {isVerified ? (
                        <button
                          onClick={() => handleVerifyVolunteer(v.uid, false)}
                          className="py-1.5 px-3 bg-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 rounded font-bold text-[10px] cursor-pointer"
                        >
                          Revoke Verification
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyVolunteer(v.uid, true)}
                          className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow shadow-indigo-600/10"
                        >
                          <Check size={12} />
                          Approve Responder
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
