import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Phone, Lock, AlertCircle, ArrowRight, Info, Eye, EyeOff } from 'lucide-react';
import { validateAndNormalizeEmail, validateAndNormalizePhone } from '../utils/validation';

export const Login: React.FC = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Resend verification email configurations
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess('');
    setError('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail || email })
      });
      let data: any = {};
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email.');
      }
      setResendSuccess(data.message || 'If this email is registered, a new verification link has been sent.');
    } catch (resendErr: any) {
      setError(resendErr.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const getIdentifierIcon = () => {
    const val = email.trim();
    if (!val) return <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />;
    if (/^[0-9+]/.test(val) || !val.includes('@')) {
      return <Phone className="absolute left-3.5 top-3.5 text-slate-500" size={16} />;
    }
    return <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={16} />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const trimmedInput = email.trim();
    const emailCheck = validateAndNormalizeEmail(trimmedInput);
    const phoneCheck = validateAndNormalizePhone(trimmedInput);

    if (!emailCheck.isValid && !phoneCheck.isValid) {
      setError('Please enter a valid email address or mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');
    setShowResend(false);
    setResendSuccess('');

    try {
      await loginUser(trimmedInput, password);
      const userSession = JSON.parse(localStorage.getItem('sos_current_user') || 'null');
      if (userSession) {
        if (userSession.role === 'admin') navigate('/admin');
        else if (userSession.role === 'volunteer') navigate('/volunteer');
        else navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify credentials.');
      if (err.message && err.message.toLowerCase().includes('verify your email')) {
        setShowResend(true);
        setResendEmail(trimmedInput);
      }
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

        {/* Resend Verification Widget */}
        {showResend && (
          <div className="mb-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2 text-xs">
            <p className="text-slate-350 leading-tight">
              Didn't receive the verification email or it expired? Click below to request a new link.
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-2xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {resendLoading ? 'Requesting New Link...' : 'Resend Verification Link'}
            </button>
            {resendSuccess && (
              <p className="text-emerald-400 text-3xs font-bold mt-1">{resendSuccess}</p>
            )}
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
            <label className="text-xs font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Email or Mobile Number</label>
            <div className="relative">
              {getIdentifierIcon()}
              <input
                type="email"
                placeholder="name@email.com or +919876543210"
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
              <Link
                to="/forgot-password"
                className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input py-3 pl-10 pr-10 rounded-xl text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
      {import.meta.env.DEV && (
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
              type="button"
              onClick={() => handleAutofill('citizen')}
              className="py-2 bg-slate-900 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-500/20 rounded-lg font-semibold text-rose-300 cursor-pointer text-[10px]"
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('volunteer')}
              className="py-2 bg-slate-900 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/20 rounded-lg font-semibold text-indigo-300 cursor-pointer text-[10px]"
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('admin')}
              className="py-2 bg-slate-900 hover:bg-emerald-950/20 border border-slate-800 hover:border-emerald-500/20 rounded-lg font-semibold text-emerald-300 cursor-pointer text-[10px]"
            >
              Admin
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
