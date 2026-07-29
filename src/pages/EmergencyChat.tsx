import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import { Send, MessageSquare, ShieldAlert, ArrowLeft, Radio } from 'lucide-react';

export const EmergencyChat: React.FC = () => {
  const { user } = useAuth();
  const { chatMessages, sendChatMessage, activeEmergency, emergencies } = useSOS();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  // Identify active emergency we are talking in
  const activeSOS = activeEmergency || emergencies.find(
    (e) => (e.responderId === user.uid || e.userId === user.uid) && e.status !== 'Resolved'
  );

  // Auto-scroll chat area
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !activeSOS) return;

    try {
      await sendChatMessage(activeSOS.id, text);
      setText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Quick action shortcut messages based on role
  const citizenShortcuts = [
    "I am safe inside.",
    "Bleeding heavily, need dressings.",
    "Trap door stuck, smoke in room.",
    "Hurry, please!",
  ];

  const volunteerShortcuts = [
    "I am en route, hold on!",
    "Arriving in 1 minute.",
    "Where exactly are you located?",
    "Paramedics have been notified.",
  ];

  const shortcuts = user.role === 'volunteer' ? volunteerShortcuts : citizenShortcuts;

  const handleShortcutClick = async (shortcutText: string) => {
    if (!activeSOS) return;
    try {
      await sendChatMessage(activeSOS.id, shortcutText);
    } catch (err) {
      console.error('Failed to send shortcut:', err);
    }
  };

  // Empty state if no active emergency is linked
  if (!activeSOS) {
    return (
      <div className="glass-card rounded-2xl border border-slate-800 p-8 text-center max-w-md mx-auto my-10 flex flex-col items-center">
        <div className="p-3 bg-slate-900 border border-slate-800 text-slate-500 rounded-full mb-4">
          <MessageSquare size={32} />
        </div>
        <h3 className="text-base font-bold text-white mb-2">No Active Chat Session</h3>
        <p className="text-xs text-slate-400 leading-normal max-w-sm mb-6">
          Chat is only active when there is a live SOS broadcast currently accepted by a responder.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all"
        >
          Return to Control Center
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)] max-w-4xl mx-auto glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      
      {/* Chat header bar */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-lg">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white leading-none">
              Incident Channel: {activeSOS.type}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 block">
              {user.role === 'volunteer' ? `Citizen: ${activeSOS.userName}` : `Responder: ${activeSOS.responderName || 'Assigning...'}`}
            </span>
          </div>
        </div>

        <Link
          to={user.role === 'volunteer' ? '/volunteer' : '/tracking'}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 rounded-lg text-[10px] font-bold tracking-wider uppercase cursor-pointer"
        >
          <ArrowLeft size={12} />
          Back to Tracking
        </Link>
      </div>

      {/* Message logs area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
        {chatMessages.length === 0 ? (
          <div className="my-auto text-center flex flex-col items-center justify-center p-6 text-slate-500 italic text-xs">
            <MessageSquare size={24} className="mb-2 opacity-50" />
            No chat messages exchanged yet.
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <span className="text-[8px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed border ${
                  isMe
                    ? 'bg-rose-600/10 border-rose-500/20 text-rose-200 rounded-tr-none'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Shortcuts grid panel */}
      <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/40 flex flex-wrap gap-1.5 justify-start">
        {shortcuts.map((shortcut, i) => (
          <button
            key={i}
            onClick={() => handleShortcutClick(shortcut)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850 rounded-full text-[9px] font-bold tracking-wide cursor-pointer transition-colors"
          >
            {shortcut}
          </button>
        ))}
      </div>

      {/* Input textbox footer */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-900/20 flex gap-2">
        <input
          type="text"
          placeholder="Enter message details..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 glass-input py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium"
          required
        />
        <button
          type="submit"
          className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </form>

    </div>
  );
};
