import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldAlert, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { getApiUrl } from '../utils/api';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    const doVerify = async () => {
      if (!token) {
        setStatus('error');
        setErrorMsg('Verification token is missing from the link.');
        return;
      }

      try {
        const response = await fetch(getApiUrl('/api/auth/verify-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        let data: any = {};
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        }
        if (!response.ok) {
          throw new Error(data.message || 'Email verification failed.');
        }

        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Failed to verify email address.');
      }
    };

    doVerify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMsg('');
    setErrorMsg('');

    try {
      const response = await fetch(getApiUrl('/api/auth/resend-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      let data: any = {};
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email.');
      }

      setResendMsg('If this email is registered, a new verification link has been sent.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request new verification link.');
    } finally {
      setResendLoading(false);
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
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Email Verification</h2>
          <p className="text-slate-400 text-xs mt-1">Activating your emergency responder profile.</p>
        </div>

        {status === 'loading' && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
            <p className="text-sm text-slate-300">Verifying your email address, please hold...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Email Verification Successful</h3>
            <p className="text-xs text-slate-400 leading-relaxed px-2 mb-6">
              Your email verification was successful. You can now login.
            </p>
            <Link
              to="/login"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-rose-600/20 active:scale-[0.98] transition duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              Log In <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-400">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold block mb-0.5">Verification Failed</span>
                <p className="leading-tight">{errorMsg}</p>
              </div>
            </div>

            <hr className="border-slate-800/80" />

            {/* Resend Verification Form */}
            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <span className="block text-2xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                  Need a new verification link?
                </span>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={resendLoading}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition duration-200"
                  required
                />
              </div>

              {resendMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 text-center">
                  {resendMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 text-sm font-bold active:scale-[0.98] transition duration-200 disabled:opacity-50 cursor-pointer"
              >
                {resendLoading ? 'Requesting Link...' : 'Resend Verification Email'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
