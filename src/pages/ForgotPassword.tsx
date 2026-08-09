import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getApiUrl } from '../utils/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data: any = {};
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Blur background ornament */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-rose-600/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div className="mb-6 flex items-center gap-3">
        <Link to="/login" className="flex items-center gap-2 bg-rose-600/10 border border-rose-500/20 px-3 py-1.5 rounded-full text-white cursor-pointer hover:scale-105 duration-200">
          <ShieldAlert className="text-rose-500" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Login</span>
        </Link>
      </div>

      <div className="glass-card max-w-md w-full rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Forgot Password?</h2>
          <p className="text-slate-400 text-xs mt-1">Provide your registered email to receive a recovery link.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-400">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="leading-tight">{error}</p>
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Request Processed</h3>
            <p className="text-xs text-slate-400 leading-relaxed px-2">
              If an account exists for this email, a password reset link has been sent.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-rose-500 hover:text-rose-400 text-xs font-semibold transition-colors duration-200"
            >
              <ArrowLeft size={14} />
              Return to Login Screen
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200 disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-rose-600/20 active:scale-[0.98] transition duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
