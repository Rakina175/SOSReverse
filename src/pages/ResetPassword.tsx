import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Lock, AlertCircle, CheckCircle2, Info, Check, X } from 'lucide-react';
import { getApiUrl } from '../utils/api';

const Requirement: React.FC<{ label: string; met: boolean }> = ({ label, met }) => (
  <div className={`flex items-center gap-1.5 text-2xs ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
    {met ? <Check size={11} className="stroke-[3]" /> : <X size={11} className="stroke-[3]" />}
    <span>{label}</span>
  </div>
);

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const lengthValid = password.length >= 12;
  const upperValid = /[A-Z]/.test(password);
  const lowerValid = /[a-z]/.test(password);
  const digitValid = /[0-9]/.test(password);
  const specialValid = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid reset link or missing security token.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!lengthValid || !upperValid || !lowerValid || !digitValid || !specialValid) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      let data: any = {};
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while resetting your password.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-rose-600/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div className="mb-6 flex items-center gap-3">
        <Link to="/login" className="flex items-center gap-2 bg-rose-600/10 border border-rose-500/20 px-3 py-1.5 rounded-full text-white cursor-pointer hover:scale-105 duration-200">
          <ShieldAlert className="text-rose-500" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Login</span>
        </Link>
      </div>

      <div className="glass-card max-w-md w-full rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create New Password</h2>
          <p className="text-slate-400 text-xs mt-1">Configure a strong, production-safe password for your account.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-400">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="leading-tight">{error}</p>
          </div>
        )}

        {!token && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-400">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <p className="leading-tight">Warning: No valid reset token was detected in the URL. Reset will fail.</p>
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Password Reset Successful</h3>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              Password reset successful. Please log in with your new password.
            </p>
            <Link
              to="/login"
              className="mt-6 w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-rose-600/20 active:scale-[0.98] transition duration-200 cursor-pointer flex items-center justify-center"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-pass" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  id="new-pass"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-pass" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  id="confirm-pass"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Strength Requirements Panel */}
            <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl space-y-1.5">
              <span className="block text-3xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Password Security Checklist:
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <Requirement label="At least 12 characters" met={lengthValid} />
                <Requirement label="Uppercase letter" met={upperValid} />
                <Requirement label="Lowercase letter" met={lowerValid} />
                <Requirement label="Numerical digit" met={digitValid} />
                <Requirement label="Special character" met={specialValid} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-rose-600/20 active:scale-[0.98] transition duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
