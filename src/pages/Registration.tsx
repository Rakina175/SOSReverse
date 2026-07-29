import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, User, HeartHandshake, AlertCircle, ArrowRight, Phone, Mail, Lock, Check } from 'lucide-react';

export const Registration: React.FC = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected role tab ('citizen' | 'volunteer')
  const [role, setRole] = useState<'citizen' | 'volunteer'>('citizen');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Volunteer specific fields (mocked files/status)
  const [skills, setSkills] = useState('');
  const [hasCert, setHasCert] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync role choice from landing page query param (?role=citizen / ?role=volunteer)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'citizen' || roleParam === 'volunteer') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !phoneNumber || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await registerUser(email, password, fullName, phoneNumber, role);
      
      // If volunteer, save their mock details
      if (role === 'volunteer') {
        const currentUser = JSON.parse(localStorage.getItem('sos_current_user') || '{}');
        const updated = {
          ...currentUser,
          medicalConditions: 'Verified Responder: Vetted status',
          emergencyNotes: `Skills: ${skills || 'First Aid Response'}. Certificate verified: ${hasCert}`,
        };
        localStorage.setItem('sos_current_user', JSON.stringify(updated));
        
        // Also update list
        const list = JSON.parse(localStorage.getItem('sos_users') || '[]');
        const updatedList = list.map((u: any) => u.uid === currentUser.uid ? updated : u);
        localStorage.setItem('sos_users', JSON.stringify(updatedList));
      }

      navigate(role === 'volunteer' ? '/volunteer' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register account. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-float"></div>

      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 bg-rose-600/10 border border-rose-500/20 px-3 py-1.5 rounded-full text-white cursor-pointer hover:scale-105 duration-200">
          <ShieldAlert className="text-rose-500" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Reverse SOS Home</span>
        </Link>
      </div>

      <div className="glass-card max-w-lg w-full rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Safety Identity</h2>
          <p className="text-slate-400 text-xs mt-1">Select your account profile role below to begin registration.</p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900 mb-6">
          <button
            type="button"
            onClick={() => { setRole('citizen'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              role === 'citizen'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={14} />
            Citizen / Resident
          </button>
          <button
            type="button"
            onClick={() => { setRole('volunteer'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              role === 'volunteer'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartHandshake size={14} />
            Volunteer Responder
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-400">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type="tel"
                  placeholder="+1 (555) 012-3456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Volunteer specific fields */}
          {role === 'volunteer' && (
            <div className="mt-2 p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl flex flex-col gap-3 animate-fade-in">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Volunteer Vetting Information</p>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Medical/Response Skills</label>
                <input
                  type="text"
                  placeholder="e.g. Certified EMT, CPR Instructor, General First Aid"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHasCert(!hasCert)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                    hasCert ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-800 bg-slate-900/60 text-transparent'
                  }`}
                >
                  <Check size={12} />
                </button>
                <span className="text-[11px] text-slate-400">
                  I upload mock Certifications (Approval required by system Admins before dispatch)
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 mt-2 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              role === 'volunteer' 
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/15' 
                : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/15'
            }`}
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            ) : (
              <>
                Register Account Profile
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-900 pt-4">
          Already part of the safety grid?{' '}
          <Link to="/login" className={`font-semibold ${role === 'volunteer' ? 'text-indigo-400 hover:text-indigo-300' : 'text-rose-400 hover:text-rose-300'}`}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
