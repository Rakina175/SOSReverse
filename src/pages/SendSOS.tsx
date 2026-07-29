import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSOS, type EmergencyType } from '../context/SOSContext';
import { Radio, AlertTriangle, ArrowRight, ShieldAlert, HeartPulse, Shield, Flame, UserCheck, FlameKindling, Info, Sparkles, MapPin } from 'lucide-react';

export const SendSOS: React.FC = () => {
  const { sendSOS, activeEmergency } = useSOS();
  const navigate = useNavigate();

  // If citizen already has active SOS, push to tracking
  useEffect(() => {
    if (activeEmergency) {
      navigate('/tracking');
    }
  }, [activeEmergency, navigate]);

  // Form parameters
  const [selectedType, setSelectedType] = useState<EmergencyType | ''>('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('Manhattan, New York City (Simulated Coordinates)');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Geolocation trigger
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setAddress('My Verified GPS Coordinates');
        },
        (error) => {
          console.warn('Geolocation permission declined, falling back to simulated Manhattan coordinates:', error);
          // Fallback NYC coordinates
          setCoords({
            latitude: 40.7128,
            longitude: -74.0060,
          });
        }
      );
    } else {
      // Geolocation not supported fallback
      setCoords({
        latitude: 40.7128,
        longitude: -74.0060,
      });
    }
  }, []);

  // Grids of 9 types
  const incidentCategories: Array<{ type: EmergencyType; label: string; icon: React.ReactNode; color: string }> = [
    { type: 'Medical Emergency', label: 'Medical Emergency', icon: <HeartPulse size={24} />, color: 'from-rose-500/20 hover:from-rose-500/30 border-rose-500/30' },
    { type: 'Road Accident', label: 'Road Accident', icon: <Sparkles size={24} />, color: 'from-amber-500/20 hover:from-amber-500/30 border-amber-500/30' },
    { type: 'Fire Emergency', label: 'Fire Emergency', icon: <Flame size={24} />, color: 'from-orange-500/20 hover:from-orange-500/30 border-orange-500/30' },
    { type: 'Crime / Theft', label: 'Crime / Theft', icon: <Shield size={24} />, color: 'from-red-500/20 hover:from-red-500/30 border-red-500/30' },
    { type: 'Women Safety', label: 'Women Safety', icon: <ShieldAlert size={24} />, color: 'from-purple-500/20 hover:from-purple-500/30 border-purple-500/30' },
    { type: 'Natural Disaster', label: 'Natural Disaster', icon: <FlameKindling size={24} />, color: 'from-indigo-500/20 hover:from-indigo-500/30 border-indigo-500/30' },
    { type: 'Child Emergency', label: 'Child Emergency', icon: <UserCheck size={24} />, color: 'from-pink-500/20 hover:from-pink-500/30 border-pink-500/30' },
    { type: 'Elderly Assistance', label: 'Elderly Assistance', icon: <Radio size={24} />, color: 'from-emerald-500/20 hover:from-emerald-500/30 border-emerald-500/30' },
    { type: 'Other', label: 'Other assistance', icon: <Info size={24} />, color: 'from-slate-500/20 hover:from-slate-500/30 border-slate-500/30' }
  ];

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedType) {
      setErrorMsg('Please select an Emergency Type.');
      return;
    }

    if (!coords) {
      setErrorMsg('Resolving GPS coordinates. Please wait or check location permissions.');
      return;
    }

    setLoading(true);
    try {
      await sendSOS(selectedType, description, coords.latitude, coords.longitude, address);
      navigate('/tracking');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch SOS alarm.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      
      {/* Header Panel */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight m-0">Send SOS Emergency Alert</h2>
        <p className="text-xs text-slate-400 mt-1">
          Select an incident category and write details. Nearby volunteers will be alerted immediately.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 flex items-center gap-2">
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleBroadcast} className="flex flex-col gap-6">
        
        {/* Step 1: Selection Grid */}
        <div>
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-2">Step 1: Incident Category *</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {incidentCategories.map((item) => {
              const isSelected = selectedType === item.type;
              return (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setSelectedType(item.type)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between aspect-square md:aspect-video bg-slate-900/50 bg-gradient-to-br ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-md shadow-rose-950/20'
                      : `border-slate-800 hover:border-slate-700/80 text-slate-300 ${item.color}`
                  }`}
                >
                  <span className={isSelected ? 'text-rose-400' : 'text-slate-400'}>{item.icon}</span>
                  <span className="text-xs font-bold leading-tight block mt-3 sm:mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Description Details */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Step 2: Emergency Details / Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Bleeding heavily after falling off stairs, structure filled with smoke, need immediate assistance..."
            className="w-full glass-input p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed"
          />
        </div>

        {/* Coords indicator */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-indigo-400 animate-pulse" />
            <span className="font-semibold">{address}</span>
          </div>
          {coords ? (
            <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
              GPS: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 animate-pulse">Resolving GPS Node...</span>
          )}
        </div>

        {/* Submit dispatch button */}
        <button
          type="submit"
          disabled={loading || !selectedType}
          className="w-full py-4 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
        >
          {loading ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
          ) : (
            <>
              <Radio size={18} className="animate-pulse" />
              DISPATCH SOS EMERGENCY BROADCAST
              <ArrowRight size={16} className="group-hover:translate-x-1 duration-200" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
