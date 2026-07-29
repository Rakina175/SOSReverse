import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSOS, type Emergency } from '../context/SOSContext';
import { History, ShieldCheck, HeartPulse, User, Calendar, MapPin, Star, ShieldAlert } from 'lucide-react';

export const EmergencyHistory: React.FC = () => {
  const { user } = useAuth();
  const { emergencies } = useSOS();
  
  // Rating states (to mock feedback storage in localStorage)
  const [ratedIds, setRatedIds] = useState<Record<string, number>>(() => {
    return JSON.parse(localStorage.getItem('sos_ratings') || '{}');
  });

  if (!user) return null;

  // Filter history based on role
  let filtered = emergencies;
  if (user.role === 'citizen') {
    filtered = emergencies.filter(e => e.userId === user.uid);
  } else if (user.role === 'volunteer') {
    filtered = emergencies.filter(e => e.responderId === user.uid);
  }

  const handleRate = (id: string, stars: number) => {
    const nextRatings = { ...ratedIds, [id]: stars };
    setRatedIds(nextRatings);
    localStorage.setItem('sos_ratings', JSON.stringify(nextRatings));
    alert(`Thank you! You rated the responder ${stars} stars.`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      
      {/* Header Panel */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight m-0">Emergency Dispatch History</h2>
        <p className="text-xs text-slate-400 mt-1">
          {user.role === 'admin' 
            ? 'Global audit log of all neighborhood SOS alerts on the safety network.' 
            : 'Visual record of your previously triggered or accepted safety broadcasts.'}
        </p>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl border border-slate-805 py-12 px-6 text-center max-w-md mx-auto flex flex-col items-center">
            <div className="p-3 bg-slate-900 border border-slate-800 text-slate-500 rounded-full mb-4">
              <History size={28} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">No incident reports recorded</h3>
            <p className="text-xs text-slate-400 leading-normal max-w-xs">
              Your safety grid timeline is clear. Previous emergency transmissions will populate here.
            </p>
          </div>
        ) : (
          filtered.map((sos) => {
            const isResolved = sos.status === 'Resolved';
            const rating = ratedIds[sos.id];
            
            return (
              <div 
                key={sos.id} 
                className={`glass-card rounded-2xl border p-5 flex flex-col sm:flex-row justify-between gap-6 transition-all ${
                  isResolved ? 'border-slate-800/85 bg-slate-900/10' : 'border-rose-500/20 bg-rose-950/5 animate-glow-red'
                }`}
              >
                
                {/* Details Section */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] bg-rose-600/20 text-rose-400 border border-rose-500/20 font-black tracking-widest px-2 py-0.5 rounded uppercase">
                      {sos.type}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                      isResolved 
                        ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-600/10 border-amber-500/15 text-amber-400'
                    }`}>
                      {sos.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">Incident description:</h4>
                    <p className="text-xs text-slate-300 italic mt-0.5">
                      "{sos.description || 'No additional details noted.'}"
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 mt-1 border-t border-slate-900 pt-2 font-medium">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar size={12} className="text-slate-500" />
                      {new Date(sos.timestamp).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-xs">
                      <MapPin size={12} className="text-slate-500" />
                      {sos.address}
                    </span>
                  </div>
                </div>

                {/* Responders Details & Ratings */}
                <div className="sm:w-52 border-t sm:border-t-0 sm:border-l border-slate-900 pt-4 sm:pt-0 sm:pl-5 flex flex-col justify-between text-xs gap-3">
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      {user.role === 'volunteer' ? 'CITIZEN SENDER' : 'RESPONDER ASSIGNED'}
                    </span>
                    <p className="font-bold text-slate-200 flex items-center gap-1">
                      <User size={12} className="text-indigo-400" />
                      {user.role === 'volunteer' ? sos.userName : (sos.responderName || 'Unassigned')}
                    </p>
                  </div>

                  {/* Rating actions for Citizen */}
                  {isResolved && user.role === 'citizen' && sos.responderId && (
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                        RATE RESPONDER DUTY
                      </span>
                      {rating ? (
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} fill={i < rating ? 'currentColor' : 'none'} />
                          ))}
                          <span className="text-[10px] text-slate-400 ml-1 font-bold">({rating} Stars)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const starVal = i + 1;
                            return (
                              <button
                                key={i}
                                onClick={() => handleRate(sos.id, starVal)}
                                className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                                title={`Rate ${starVal} Star`}
                              >
                                <Star size={12} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rating result for Volunteer */}
                  {isResolved && user.role === 'volunteer' && rating && (
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                        CITIZEN FEEDBACK
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} fill={i < rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
