import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSOS, type EmergencyStatus } from '../context/SOSContext';
import { GoogleMapWrapper } from '../components/GoogleMapWrapper';
import { ShieldCheck, Play, CheckCircle, Navigation, MessageSquare, AlertTriangle, Radio } from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { 
    emergencies, 
    acceptEmergency, 
    updateEmergencyStatus, 
    startTrackingSimulation, 
    stopTrackingSimulation, 
    getDistanceKm 
  } = useSOS();

  const [declinedIds, setDeclinedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'radar' | 'mission'>('radar');
  const [showAllRanges, setShowAllRanges] = useState(false);

  // States to track resolved notification
  const activeMissionIdRef = useRef<string | null>(null);
  const [localResolvingId, setLocalResolvingId] = useState<string | null>(null);
  const [showResolvedModal, setShowResolvedModal] = useState(false);
  const [resolvedMissionInfo, setResolvedMissionInfo] = useState<any>(null);

  // Identify active mission for current volunteer
  const activeMission = user ? emergencies.find(
    (e) => e.responderId === user.uid && e.status !== 'Resolved'
  ) : undefined;

  // Auto-switch tabs to active mission if one exists, and track external resolution
  useEffect(() => {
    if (activeMission) {
      setActiveTab('mission');
      activeMissionIdRef.current = activeMission.id;
    } else {
      setActiveTab('radar');
      
      // If we had an active mission, check if it was resolved by the citizen
      if (activeMissionIdRef.current) {
        const prevId = activeMissionIdRef.current;
        const found = emergencies.find(e => e.id === prevId);
        if (found && found.status === 'Resolved' && prevId !== localResolvingId) {
          setResolvedMissionInfo(found);
          setShowResolvedModal(true);
        }
        activeMissionIdRef.current = null;
      }
    }
  }, [activeMission, emergencies, localResolvingId]);

  // Geolocation trigger to update volunteer coordinates in database
  useEffect(() => {
    if (!user) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateProfile({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }).catch(err => console.error('Failed to update responder location:', err));
        },
        (error) => {
          console.warn('Geolocation permission declined or failed for responder:', error);
        }
      );
    }
  }, [user?.isAvailable]);

  // Toggle availability
  const handleToggleAvailable = async () => {
    if (!user) return;
    try {
      await updateProfile({ isAvailable: !user.isAvailable });
    } catch (err) {
      alert('Failed to update availability.');
    }
  };

  // Change search range radius
  const handleRangeChange = async (radius: 1 | 3 | 5 | 10) => {
    if (!user) return;
    try {
      await updateProfile({ rangeRadius: radius });
    } catch (err) {
      alert('Failed to update search range.');
    }
  };

  // Decline incident locally
  const handleDecline = (id: string) => {
    setDeclinedIds([...declinedIds, id]);
  };

  // Accept incident
  const handleAccept = async (id: string) => {
    try {
      await acceptEmergency(id);
      setActiveTab('mission');
    } catch (err: any) {
      alert(err.message || 'Failed to accept emergency.');
    }
  };

  // Update status (e.g. En Route, Arrived, Resolved)
  const handleStatusChange = async (status: EmergencyStatus) => {
    if (!activeMission) return;
    try {
      if (status === 'Resolved') {
        setLocalResolvingId(activeMission.id);
      }
      await updateEmergencyStatus(activeMission.id, status);
      
      if (status === 'En Route') {
        // Start GPS movements simulation loop
        startTrackingSimulation(activeMission.id);
      } else if (status === 'Arrived' || status === 'Resolved') {
        // Halt GPS tracking loop
        stopTrackingSimulation();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
      setLocalResolvingId(null);
    }
  };

  // Compute pending emergencies within range
  const pendingInRange = user ? emergencies.filter((e) => {
    if (e.status !== 'Pending') return false;
    if (declinedIds.includes(e.id)) return false;

    if (showAllRanges) return true; // Skip distance check

    // Calculate distance with Manhattan coords fallback
    const valLat = user.latitude ?? 40.7128;
    const valLon = user.longitude ?? -74.0060;
    const dist = getDistanceKm(valLat, valLon, e.latitude, e.longitude);
    return dist <= user.rangeRadius;
  }) : [];

  // Compute pending emergencies globally (excluding declined ones)
  const totalPendingGlobal = user ? emergencies.filter((e) => {
    if (e.status !== 'Pending') return false;
    if (declinedIds.includes(e.id)) return false;
    return true;
  }).length : 0;

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Citizen Resolved Notification Modal */}
      {showResolvedModal && resolvedMissionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full border border-slate-800 p-6 rounded-3xl shadow-2xl relative flex flex-col items-center text-center">
            {/* Icon with radial glow */}
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 rounded-full border border-emerald-500/10 animate-ping"></div>
              <CheckCircle size={32} />
            </div>
            
            <h3 className="text-lg font-extrabold text-white mb-2">
              SOS Alert Resolved
            </h3>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Citizen <strong className="text-white">{resolvedMissionInfo.userName}</strong> has marked themselves as <strong className="text-emerald-400">Safe</strong>. The emergency alert is resolved and you have been returned to active searching.
            </p>

            <button
              onClick={() => {
                setShowResolvedModal(false);
                setResolvedMissionInfo(null);
                setLocalResolvingId(null);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
            >
              Acknowledge & Back to Radar
            </button>
          </div>
        </div>
      )}
      
      {/* Top Header Controls bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 glass-panel rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/60 to-transparent">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight m-0 flex items-center gap-2">
            Responder Terminal: <span className="text-indigo-400">{user.fullName}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Status: {user.isAvailable ? 'Monitoring emergency frequencies' : 'Offline'} // Radius: {user.rangeRadius} KM
          </p>
        </div>

        {/* Availability Switch & Radius Select */}
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-900">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1.5">Radius:</span>
            {([1, 3, 5, 10] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setShowAllRanges(false);
                  handleRangeChange(r);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                  user.rangeRadius === r && !showAllRanges
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}k
              </button>
            ))}
            <button
              onClick={() => setShowAllRanges(true)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                showAllRanges 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
          </div>

          <button
            onClick={handleToggleAvailable}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
              user.isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {user.isAvailable ? 'Duty: ONLINE' : 'Duty: OFFLINE'}
          </button>
        </div>
      </div>

      {/* Tabs Switcher (Only visible if active mission exists, otherwise radar is locked active) */}
      {activeMission && (
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-900">
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'radar' ? 'bg-slate-800 text-white border border-slate-750' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Alerts Radar ({pendingInRange.length})
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'mission' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            Assigned Mission
          </button>
        </div>
      )}

      {/* TAB CONTENT: RADAR */}
      {activeTab === 'radar' && (
        <div className="flex flex-col gap-5">
          {!user.isAvailable ? (
            <div className="glass-card rounded-2xl border border-slate-800 p-8 text-center max-w-lg mx-auto flex flex-col items-center">
              <div className="p-3 bg-slate-900 border border-slate-800 text-slate-500 rounded-full mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Duty Mode Offline</h3>
              <p className="text-xs text-slate-400 leading-normal max-w-xs mb-6">
                You are currently set to Offline. Switch to Online Duty to display active emergency alerts broadcasted in your Manhattan grid.
              </p>
              <button
                onClick={handleToggleAvailable}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Go Online Duty
              </button>
            </div>
          ) : pendingInRange.length === 0 ? (
            <div className="glass-card rounded-2xl border border-slate-850 p-10 text-center max-w-lg mx-auto flex flex-col items-center">
              <div className="p-3 bg-slate-900 border border-slate-800 text-slate-500 rounded-full mb-4 animate-pulse">
                <Radio size={32} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Emergency Radar Clear</h3>
              <p className="text-xs text-slate-400 leading-normal max-w-xs mb-4">
                No active SOS signals detected {showAllRanges ? 'on the network' : `within your ${user.rangeRadius} KM safety radius`} right now. Remaining on high alert.
              </p>
              {!showAllRanges && totalPendingGlobal > 0 && (
                <div className="mt-2 p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl max-w-sm">
                  <p className="text-2xs font-extrabold text-indigo-400 uppercase tracking-widest mb-1.5">
                    🚨 Out of Range Alert
                  </p>
                  <p className="text-[10px] text-slate-300 leading-normal mb-3">
                    There {totalPendingGlobal === 1 ? 'is 1 active SOS signal' : `are ${totalPendingGlobal} active SOS signals`} currently broadcasted outside your safety radius.
                  </p>
                  <button
                    onClick={() => setShowAllRanges(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Switch to Global Radar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingInRange.map((sos) => {
                const valLat = user.latitude ?? 40.7128;
                const valLon = user.longitude ?? -74.0060;
                const dist = getDistanceKm(valLat, valLon, sos.latitude, sos.longitude);
                return (
                  <div key={sos.id} className="glass-card rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between hover:border-indigo-500/25 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] bg-rose-600/20 text-rose-400 border border-rose-500/20 font-black tracking-widest px-2 py-0.5 rounded uppercase">
                          {sos.type}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-900/30">
                          {dist.toFixed(2)} KM Away
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-white mb-1">Victim: {sos.userName}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mb-3">Dispatched: {new Date(sos.timestamp).toLocaleTimeString()}</p>
                      
                      <p className="text-xs text-slate-300 leading-relaxed font-semibold italic bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                        "{sos.description || 'No additional incident description notes provided.'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-5">
                      <button
                        onClick={() => handleAccept(sos.id)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Accept Incident
                      </button>
                      <button
                        onClick={() => handleDecline(sos.id)}
                        className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ACTIVE MISSION */}
      {activeTab === 'mission' && activeMission && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-11rem)] lg:h-[calc(100vh-8rem)]">
          {/* Map Section */}
          <div className="lg:col-span-2 relative h-80 lg:h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <GoogleMapWrapper
              victimLat={activeMission.latitude}
              victimLon={activeMission.longitude}
              responderLat={activeMission.responderLatitude}
              responderLon={activeMission.responderLongitude}
            />
          </div>

          {/* Mission Details Section */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <span className="text-[9px] bg-rose-600/20 text-rose-400 border border-rose-500/25 font-black tracking-widest px-2 py-0.5 rounded uppercase">
                Active Duty Task
              </span>
              
              <h3 className="text-base font-extrabold text-white mt-3 mb-1">Assist Citizen: {activeMission.userName}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                Incident Location: <span className="text-slate-300 font-mono text-[9px]">{activeMission.address}</span>
              </p>

              <div className="p-3 bg-slate-950/70 border border-slate-900 rounded-xl mt-3 text-xs leading-relaxed text-slate-300 italic">
                "{activeMission.description || 'No additional details provided by sender.'}"
              </div>
            </div>

            {/* Actions Timeline panel for Volunteer */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Rescue Stage Actions</h4>
                
                <div className="flex flex-col gap-4">
                  {/* Status: Accepted */}
                  <div className="flex items-start gap-3 text-xs">
                    <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mt-0.5">
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-200">1. Accept Incident (Complete)</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Incident assigned. Target details synchronized.</p>
                    </div>
                  </div>

                  {/* Status: En Route */}
                  <div className="flex items-start gap-3 text-xs">
                    <button
                      onClick={() => handleStatusChange('En Route')}
                      disabled={activeMission.status !== 'Accepted'}
                      className={`p-1 rounded mt-0.5 transition-colors ${
                        activeMission.status === 'En Route' || activeMission.status === 'Arrived'
                          ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                          : activeMission.status === 'Accepted'
                            ? 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500'
                            : 'bg-slate-900 border border-slate-850 text-slate-600'
                      }`}
                    >
                      <Play size={14} />
                    </button>
                    <div>
                      <h5 className={`font-bold ${activeMission.status !== 'Accepted' ? 'text-slate-200' : 'text-slate-500'}`}>
                        2. Start Dispatch (En Route)
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Activate GPS simulator tracking loop to draw route.</p>
                    </div>
                  </div>

                  {/* Status: Arrived */}
                  <div className="flex items-start gap-3 text-xs">
                    <button
                      onClick={() => handleStatusChange('Arrived')}
                      disabled={activeMission.status !== 'En Route'}
                      className={`p-1 rounded mt-0.5 transition-colors ${
                        activeMission.status === 'Arrived'
                          ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                          : activeMission.status === 'En Route'
                            ? 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500'
                            : 'bg-slate-900 border border-slate-850 text-slate-600'
                      }`}
                    >
                      <Navigation size={14} />
                    </button>
                    <div>
                      <h5 className={`font-bold ${activeMission.status === 'En Route' ? 'text-slate-100' : 'text-slate-500'}`}>
                        3. Arrive on Scene (Arrived)
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Confirm physical location. Deliver local care support.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Resolve Action & Chat */}
              <div className="flex flex-col gap-2 mt-6">
                <Link
                  to="/chat"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  Open Duty Chat Room
                </Link>
                
                <button
                  onClick={() => handleStatusChange('Resolved')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <ShieldCheck size={14} />
                  Mark as Resolved / Safe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
