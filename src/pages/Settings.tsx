import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Trash2, Database, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, isFirebase } = useAuth();
  const showSandbox = false;

  // Notification configs states (mocked/local storage)
  const [sounds, setSounds] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [radiusNotifs, setRadiusNotifs] = useState(true);

  if (!user) return null;

  const handleClearSimulator = () => {
    if (confirm('CAUTION: This will erase all registered accounts, contacts, and emergency reports stored in your local storage sandbox database. Proceed?')) {
      localStorage.clear();
      alert('Sandbox database wiped. Reloading session.');
      window.location.reload();
    }
  };

  const handleSeedContacts = () => {
    const mockContacts = [
      {
        id: 'mock_c1',
        userId: user.uid,
        name: 'Doctor Robert (Family Physician)',
        phoneNumber: '555-0144',
        relationship: 'Doctor / Medical Advisor',
        alternateNumber: '555-0155',
        isPrimary: true
      },
      {
        id: 'mock_c2',
        userId: user.uid,
        name: 'Marcus Vance',
        phoneNumber: '555-0199',
        relationship: 'Spouse',
        alternateNumber: '',
        isPrimary: false
      },
      {
        id: 'mock_c3',
        userId: user.uid,
        name: 'Alice Vance',
        phoneNumber: '555-0188',
        relationship: 'Sister',
        alternateNumber: '',
        isPrimary: false
      }
    ];

    localStorage.setItem('sos_contacts', JSON.stringify(mockContacts));
    alert('Mock emergency contacts injected into your profile!');
    window.location.reload();
  };

  const handleSeedHistory = () => {
    const mockHistory = [
      {
        id: 'mock_h1',
        userId: user.role === 'citizen' ? user.uid : 'mock_citizen_user',
        userName: user.role === 'citizen' ? user.fullName : 'Jane Doe (Citizen)',
        type: 'Medical Emergency',
        description: 'Severe asthma attack, inhaler missing. Difficulty breathing.',
        latitude: 40.7128 + 0.002,
        longitude: -74.0060 - 0.002,
        address: 'W 4th St, Greenwich Village, NYC',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
        status: 'Resolved',
        responderId: user.role === 'volunteer' ? user.uid : 'mock_volunteer_user',
        responderName: user.role === 'volunteer' ? user.fullName : 'Officer John (Volunteer)',
        responderLatitude: 40.7128 + 0.002,
        responderLongitude: -74.0060 - 0.002,
        resolvedAt: new Date(Date.now() - 3600000 * 24 * 2 + 600000).toISOString()
      },
      {
        id: 'mock_h2',
        userId: user.role === 'citizen' ? user.uid : 'mock_citizen_user',
        userName: user.role === 'citizen' ? user.fullName : 'Jane Doe (Citizen)',
        type: 'Fire Emergency',
        description: 'Kitchen stove fire. Heavy smoke in apartment.',
        latitude: 40.7128 - 0.004,
        longitude: -74.0060 + 0.005,
        address: 'Bleecker St, SoHo, NYC',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
        status: 'Resolved',
        responderId: user.role === 'volunteer' ? user.uid : 'mock_volunteer_user',
        responderName: user.role === 'volunteer' ? user.fullName : 'Officer John (Volunteer)',
        responderLatitude: 40.7128 - 0.004,
        responderLongitude: -74.0060 + 0.005,
        resolvedAt: new Date(Date.now() - 3600000 * 12 + 450000).toISOString()
      }
    ];

    const current = JSON.parse(localStorage.getItem('sos_emergencies') || '[]');
    // Filter out mock duplicates if seeded before
    const filtered = current.filter((e: any) => !e.id.startsWith('mock_h'));
    localStorage.setItem('sos_emergencies', JSON.stringify([...filtered, ...mockHistory]));
    alert('Mock historical resolved reports injected into database!');
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">

      {/* Page Title */}
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight m-0">System Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust alert notifications and manage your local database simulation credentials.
        </p>
      </div>

      <div className="flex flex-col gap-6">

        {/* Card: Notification Preferences */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Bell size={16} className="text-indigo-400" />
            Alert Notification Preferences
          </h3>

          <div className="flex flex-col gap-4 text-xs font-semibold text-slate-300">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between py-2 border-b border-slate-900">
              <div>
                <p className="text-white">Emergency Warning Sounds</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Play heavy pitch siren alert ringtones when receiving SOS alerts.</p>
              </div>
              <button
                onClick={() => setSounds(!sounds)}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${sounds ? 'bg-rose-600' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${sounds ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between py-2 border-b border-slate-900">
              <div>
                <p className="text-white">Browser Push Notifications</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Show desktop notifications overlay during minimized states.</p>
              </div>
              <button
                onClick={() => setPushNotifs(!pushNotifs)}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${pushNotifs ? 'bg-rose-600' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${pushNotifs ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Toggle 3 */}
            {user.role === 'volunteer' && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white">Proximity Range Alerts</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Only prompt sound rings for incidents within your current active radius range.</p>
                </div>
                <button
                  onClick={() => setRadiusNotifs(!radiusNotifs)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${radiusNotifs ? 'bg-rose-600' : 'bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${radiusNotifs ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card: Developer Sandbox Controls */}
        {showSandbox && !isFirebase && (
          <div className="glass-card rounded-2xl border border-indigo-500/10 bg-gradient-to-br from-indigo-950/5 to-slate-900/60 p-5">
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-indigo-900/30 pb-2">
              <Database size={16} className="text-indigo-400" />
              Developer Sandbox Tools (Local Storage)
            </h3>

            <p className="text-[10px] text-slate-400 mb-4 leading-normal">
              These commands allow you to manipulate local database credentials instantly, aiding reviews, testing and evaluation.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleSeedContacts}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-indigo-600/10"
                >
                  <RefreshCw size={14} />
                  Inject 3 Mock Contacts
                </button>

                <button
                  onClick={handleSeedHistory}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-indigo-600/10"
                >
                  <Database size={14} />
                  Inject Past SOS History
                </button>
              </div>

              <button
                onClick={handleClearSimulator}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-rose-950/25 border border-slate-800 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                Clear Sandbox Database (Full Reset)
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
