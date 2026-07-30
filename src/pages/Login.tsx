import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, AlertCircle, ArrowRight, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginUser, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      await loginUser(email, password);
      // AuthProvider useEffect will set the user and ProtectedRoute will push them to correct dashboard,
      // but let's do a soft redirect based on the role to speed up routing
      const userSession = JSON.parse(localStorage.getItem('sos_current_user') || 'null');
      if (userSession) {
        if (userSession.role === 'admin') navigate('/admin');
        else if (userSession.role === 'volunteer') navigate('/volunteer');
        else navigate('/dashboard');
      } else {
        // Fallback to reload/redirect
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      await resetPassword(email);
      setInfoMessage('A password reset link has been dispatched to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts helper
  const handleAutofill = (demoRole: 'citizen' | 'volunteer' | 'admin') => {
    setEmail(`mock_${demoRole}@sos.com`);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background abstract layout */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-rose-600/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      {/* Home branding */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 bg-rose-600/10 border border-rose-500/20 px-3 py-1.5 rounded-full text-white cursor-pointer hover:scale-105 duration-200">
          <ShieldAlert className="text-rose-500" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Reverse SOS Home</span>
        </Link>
      </div>

      <div className="glass-card max-w-md w-full rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Access Emergency Desk</h2>
          <p className="text-slate-400 text-xs mt-1">Provide your credentials to access your safety dashboard.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-400">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="leading-tight">{error}</p>
          </div>
        )}

        {/* Info/Success Message */}
        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-start gap-2.5 text-xs text-indigo-400">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <p className="leading-tight">{infoMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input py-3 pl-10 pr-4 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-600/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            ) : (
              <>
                Sign In to Account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-900 pt-4">
          Need protective monitoring?{' '}
          <Link to="/register" className="font-semibold text-rose-400 hover:text-rose-300">
            Create an Account
          </Link>
        </div>
      </div>

      {/* Demo Credentials Drawer */}
      <div className="glass-card max-w-sm w-full mt-6 rounded-2xl border border-slate-800/80 p-4 text-xs">
        <p className="font-bold text-indigo-200 text-center mb-2 uppercase tracking-wide flex items-center justify-center gap-1.5">
          <Info size={14} className="text-indigo-400" />
          Test Account Autofills (Sandbox)
        </p>
        <p className="text-[10px] text-slate-400 text-center mb-3">
          Click any button to populate credentials for immediate login.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAutofill('citizen')}
            className="py-2 bg-slate-900 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-500/20 rounded-lg font-semibold text-rose-300 cursor-pointer text-[10px]"
          >
            Citizen
          </button>
          <button
            onClick={() => handleAutofill('volunteer')}
            className="py-2 bg-slate-900 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/20 rounded-lg font-semibold text-indigo-300 cursor-pointer text-[10px]"
          >
            Volunteer
          </button>
          <button
            onClick={() => handleAutofill('admin')}
            className="py-2 bg-slate-900 hover:bg-emerald-950/20 border border-slate-800 hover:border-emerald-500/20 rounded-lg font-semibold text-emerald-300 cursor-pointer text-[10px]"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
};
