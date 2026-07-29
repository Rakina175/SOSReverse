import React, { useState } from 'react';
import { useSOS, type EmergencyContact } from '../context/SOSContext';
import { Shield, Plus, Edit2, Trash2, Phone, User, Users, X, Save } from 'lucide-react';

export const EmergencyContacts: React.FC = () => {
  const { contacts, addContact, editContact, deleteContact, setPrimaryContact } = useSOS();
  
  // Dialog modal visibility
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('');
  const [alternateNumber, setAlternateNumber] = useState('');

  const handleOpenAdd = () => {
    setEditingContact(null);
    setName('');
    setPhoneNumber('');
    setRelationship('');
    setAlternateNumber('');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhoneNumber(contact.phoneNumber);
    setRelationship(contact.relationship);
    setAlternateNumber(contact.alternateNumber);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !phoneNumber || !relationship) {
      setErrorMsg('Please fill in Name, Phone, and Relationship.');
      return;
    }

    setLoading(true);
    try {
      if (editingContact) {
        // Edit existing
        await editContact(editingContact.id, name, phoneNumber, relationship, alternateNumber);
      } else {
        // Add new
        await addContact(name, phoneNumber, relationship, alternateNumber);
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this contact from your safety grid?')) {
      try {
        await deleteContact(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete contact.');
      }
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryContact(id);
    } catch (err: any) {
      alert(err.message || 'Failed to update primary contact.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight m-0">Trusted Safety Circle</h2>
          <p className="text-xs text-slate-400 mt-1">
            Define family members or friends. They are automatically notified with coordinates when you click SOS.
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/10 cursor-pointer w-fit"
        >
          <Plus size={16} />
          Add Trusted Contact
        </button>
      </div>

      {/* Empty State */}
      {contacts.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-850 py-12 px-6 text-center max-w-lg mx-auto flex flex-col items-center">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-full mb-4 text-slate-400">
            <Users size={36} />
          </div>
          <h3 className="text-base font-bold text-white mb-2">No emergency contacts saved</h3>
          <p className="text-xs text-slate-400 leading-normal max-w-sm mb-6">
            Your safety circle is currently empty. Add at least one contact so that our servers can dispatch emergency coordinates to them during broadcast states.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Create First Contact Card
          </button>
        </div>
      ) : (
        /* Contacts Cards list */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              className={`glass-card rounded-2xl border p-5 flex flex-col justify-between ${
                contact.isPrimary 
                  ? 'border-rose-500/25 bg-gradient-to-br from-rose-950/5 to-slate-900/60 shadow-lg shadow-rose-950/5' 
                  : 'border-slate-800/80'
              }`}
            >
              {/* Header: Title Name & Action switches */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg border ${
                    contact.isPrimary ? 'bg-rose-600/20 border-rose-500/30 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {contact.name}
                      {contact.isPrimary && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[8px] font-black uppercase tracking-wider">
                          <Shield size={8} />
                          Primary
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                      {contact.relationship}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(contact)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 transition-colors cursor-pointer"
                    title="Edit Contact"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-1.5 bg-slate-900 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded border border-slate-800 hover:border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Contact"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Numbers Section */}
              <div className="flex flex-col gap-1.5 mb-4 py-2 border-y border-slate-900 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number:</span>
                  <a href={`tel:${contact.phoneNumber}`} className="font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 leading-none">
                    <Phone size={10} />
                    {contact.phoneNumber}
                  </a>
                </div>
                {contact.alternateNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alternate:</span>
                    <span className="font-medium text-slate-300 leading-none">{contact.alternateNumber}</span>
                  </div>
                )}
              </div>

              {/* Primary Toggle Switch */}
              {!contact.isPrimary && (
                <button
                  onClick={() => handleSetPrimary(contact.id)}
                  className="w-full py-1.5 text-center bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-colors"
                >
                  Mark as Primary Notification target
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Form card container */}
          <div className="relative glass-card max-w-md w-full rounded-2xl border border-slate-800 shadow-2xl p-5 sm:p-6 z-10 animate-scale-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-extrabold text-white tracking-tight mb-1">
              {editingContact ? 'Edit Contact Card' : 'Add Trusted Contact'}
            </h3>
            <p className="text-[10px] text-slate-400 mb-4">
              {editingContact ? 'Modify variables of this circle member.' : 'Enroll a new relative or trusted peer to receive alarms.'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Relationship *</label>
                  <input
                    type="text"
                    placeholder="e.g. Father, Spouse"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 555-0199"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Alternate Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 555-0188"
                  value={alternateNumber}
                  onChange={(e) => setAlternateNumber(e.target.value)}
                  className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-rose-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Save size={14} />
                )}
                {editingContact ? 'Save Contact Card' : 'Enroll Contact Card'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
