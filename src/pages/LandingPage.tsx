import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, HeartHandshake, Zap, ShieldCheck, MapPin, ArrowRight, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col text-slate-100 selection:bg-rose-600 selection:text-white">
      {/* Header Navigation */}
      <header className="w-full h-20 glass-panel border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-600/20 border border-rose-500/30 rounded-xl">
            <ShieldAlert className="text-rose-500 animate-pulse" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wider leading-none m-0">
              REVERSE <span className="text-rose-500">SOS</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 block">
              Emergency Network
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Login
          </Link>
          {user ? (
            <Link 
              to={user.role === 'volunteer' ? '/volunteer' : user.role === 'admin' ? '/admin' : '/dashboard'}
              className="text-sm font-semibold bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-xl text-white shadow-lg shadow-rose-600/20 transition-all hover:-translate-y-0.5 duration-200"
            >
              Go to App
            </Link>
          ) : (
            <Link 
              to="/register" 
              className="text-sm font-semibold bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-xl text-white shadow-lg shadow-rose-600/20 transition-all hover:-translate-y-0.5 duration-200"
            >
              Join Network
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 sm:pb-24 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Glow ambient spots */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-rose-600/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 left-1/3 w-[25rem] h-[25rem] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-float"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
          <Zap size={12} />
          Community-Powered Emergency Response
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none max-w-4xl">
          Help is Closer Than You Think. <br />
          <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
            Introducing Reverse SOS.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          A decentralized, neighborhood-first safety network. Broadcast immediate emergency alerts to accredited volunteer responders nearby, and get help in minutes.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register?role=citizen"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-600/25 transition-all hover:-translate-y-0.5 duration-200 text-base"
          >
            I Need Protection (Citizen)
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/register?role=volunteer"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 rounded-2xl transition-all hover:-translate-y-0.5 duration-200 text-base"
          >
            <HeartHandshake size={18} className="text-indigo-400" />
            Join as Responder (Volunteer)
          </Link>
        </div>

        {/* Live Network Metrics */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          {[
            { label: 'Active Responders', val: '2,480+', sub: 'Verified locally' },
            { label: 'Avg. Response Time', val: '2.8 Min', sub: 'Faster than 911' },
            { label: 'Safeguarded Cities', val: '45+', sub: 'Globally deployed' },
            { label: 'Incidents Resolved', val: '14,290+', sub: 'Life-saving actions' },
          ].map((stat, idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl text-center border border-slate-800/80">
              <span className="text-2xl sm:text-3xl font-extrabold text-white block tracking-tight">
                {stat.val}
              </span>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide mt-1 block">
                {stat.label}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{stat.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-slate-950/40 border-y border-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-white tracking-tight mb-4">
            How Reverse SOS Works
          </h2>
          <p className="text-slate-400 text-center max-w-xl mx-auto text-sm sm:text-base mb-12">
            Connecting local emergencies with vetted nearby responders to bypass traditional dispatch latency.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Broadcast Alarm',
                desc: 'Select your emergency type (Medical, Road Accident, Fire, Crime, Women Safety, etc.) and hit broadcast. The system captures your live GPS coordinates.',
                icon: <Radio className="text-rose-500" size={24} />
              },
              {
                step: '02',
                title: 'Nearby Alerting',
                desc: 'Volunteers within your configured radius (1, 3, 5, or 10 KM) receive instant notifications on their radar and can accept the request immediately.',
                icon: <ShieldCheck className="text-indigo-400" size={24} />
              },
              {
                step: '03',
                title: 'Live Coordination',
                desc: 'Track the volunteer coming to you on Google Maps, check their real-time ETA, and use the direct chat to share descriptions or medical notes.',
                icon: <MapPin className="text-emerald-400" size={24} />
              }
            ].map((step, idx) => (
              <div key={idx} className="glass-card p-8 rounded-2xl border border-slate-800/60 relative overflow-hidden">
                <span className="absolute top-4 right-6 text-5xl font-black text-slate-800/30 font-mono">
                  {step.step}
                </span>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl inline-block mb-4">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grids */}
      <section className="py-20 px-4 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Safety Redefined: <br />
              Vetted Responders in Your Pocket.
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed text-sm sm:text-base">
              Traditional responders are bogged down by administrative routing. Reverse SOS connects you directly with neighbors who are EMTs, firefighters, security personnel, or simply compassionate citizens, saving critical minutes when they matter most.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {[
                { title: 'Trusted Circles', desc: 'Add trusted emergency contacts. They will be alerted automatically with your location when you trigger an SOS.' },
                { title: 'Real-time Tracking', desc: 'See your responder move on Google Maps in real-time, matching details to ensure safety.' },
                { title: 'Medical ID Badges', desc: 'Responders see critical data like blood group, allergies, or medications to deliver accurate care.' }
              ].map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{f.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between aspect-video bg-gradient-to-br from-indigo-950/20 to-slate-900/60 overflow-hidden shadow-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
            
            {/* Mock Chat / Dashboard Widget */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Active Tracking</span>
              </div>
              <span className="text-[10px] text-slate-500">Incident #SOS-4299</span>
            </div>

            <div className="my-4 flex flex-col gap-2.5">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Assigned Responder</p>
                  <p className="text-sm font-bold text-white">Officer Marcus (EMT)</p>
                </div>
                <span className="text-[10px] bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                  EN ROUTE
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/85">
                  <p className="text-[10px] text-slate-500">Live Distance</p>
                  <p className="text-sm font-extrabold text-white">1.2 KM</p>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/85">
                  <p className="text-[10px] text-slate-500">Estimated Arrival</p>
                  <p className="text-sm font-extrabold text-indigo-400">1m 48s</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="flex-1 py-2 text-center rounded-xl bg-rose-600/15 border border-rose-500/20 text-[10px] text-rose-400 font-bold">
                CANCEL REQUEST
              </span>
              <span className="flex-1 py-2 text-center rounded-xl bg-slate-800 text-[10px] text-slate-300 border border-slate-700 font-bold">
                OPEN DIRECT CHAT
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center">
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Reverse SOS Safety Network. Vetted under local community charters. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
