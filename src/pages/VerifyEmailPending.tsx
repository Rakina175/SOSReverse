import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Mail, ArrowRight } from 'lucide-react';

export const VerifyEmailPending: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-rose-600/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-float"></div>

      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 bg-rose-600/10 border border-rose-500/20 px-3 py-1.5 rounded-full text-white cursor-pointer hover:scale-105 duration-200">
          <ShieldAlert className="text-rose-500" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Reverse SOS Home</span>
        </Link>
      </div>

      <div className="glass-card max-w-md w-full rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-5 text-indigo-400">
          <Mail size={30} />
        </div>

        <h2 className="text-xl font-bold text-white mb-3">Verification Required</h2>
        
        <p className="text-xs text-slate-350 leading-relaxed mb-6 px-2">
          Registration successful. A verification link has been sent to your email. Please verify your email address to activate your account.
        </p>

        <div className="space-y-3">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-3 px-6 text-sm font-bold shadow-lg shadow-rose-600/20 active:scale-[0.98] transition duration-200 cursor-pointer"
          >
            Go to Login
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
