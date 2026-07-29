import React, { useState } from 'react';
import { useAuth, type UserProfile as UserProfileType } from '../context/AuthContext';
import { User, Phone, Mail, Calendar, Droplet, AlertTriangle, ShieldCheck, HeartPulse, MapPin, Building, Edit3, Save, X } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states (pre-populated from auth user context)
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [dob, setDob] = useState(user?.dob || '');
  
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [medicalConditions, setMedicalConditions] = useState(user?.medicalConditions || '');
  const [medications, setMedications] = useState(user?.medications || '');
  const [emergencyNotes, setEmergencyNotes] = useState(user?.emergencyNotes || '');
  
  const [homeAddress, setHomeAddress] = useState(user?.homeAddress || '');
  const [currentCity, setCurrentCity] = useState(user?.currentCity || '');

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const updatedData: Partial<UserProfileType> = {
      fullName,
      phoneNumber,
      gender,
      dob,
      bloodGroup,
      allergies,
      medicalConditions,
      medications,
      emergencyNotes,
      homeAddress,
      currentCity
    };

    try {
      await updateProfile(updatedData);
      setSuccessMsg('Your security profile has been updated successfully.');
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset states back to user context values
    setFullName(user.fullName);
    setPhoneNumber(user.phoneNumber);
    setGender(user.gender);
    setDob(user.dob);
    setBloodGroup(user.bloodGroup);
    setAllergies(user.allergies);
    setMedicalConditions(user.medicalConditions);
    setMedications(user.medications);
    setEmergencyNotes(user.emergencyNotes);
    setHomeAddress(user.homeAddress);
    setCurrentCity(user.currentCity);
    setIsEditing(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white m-0">My Security Profile</h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain accurate personal, medical, and location info. Responders access this during emergencies.
          </p>
        </div>
        
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Save size={14} />
                )}
                Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              <Edit3 size={14} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <ShieldCheck size={16} />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Main Profile Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Personal Info & Location */}
        <div className="flex flex-col gap-6">
          
          {/* Card: Personal Details */}
          <div className="glass-card rounded-2xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
              <User size={16} className="text-indigo-400" />
              Personal Information
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    required
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-100">{fullName || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-500" />
                  <p className="text-sm text-slate-300 font-medium">{user.email}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 block">Authentication email cannot be altered.</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-500" />
                    <p className="text-sm text-slate-100 font-semibold">{phoneNumber || 'Not specified'}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gender</label>
                  {isEditing ? (
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-200 font-medium">{gender || 'Unspecified'}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-500" />
                      <p className="text-sm text-slate-200 font-medium">{dob || 'Unspecified'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Location Details */}
          <div className="glass-card rounded-2xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin size={16} className="text-indigo-400" />
              Location Details
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Current City</label>
                {isEditing ? (
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                    <input
                      type="text"
                      value={currentCity}
                      onChange={(e) => setCurrentCity(e.target.value)}
                      className="w-full glass-input py-2 pl-8 pr-3 rounded-lg text-xs"
                      required
                    />
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-100">{currentCity || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Home Address</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    placeholder="123 Safety Ave, Building A"
                  />
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {homeAddress || 'No home address stored.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Medical Information (Highlighted for Responders) */}
        <div className="flex flex-col">
          <div className="glass-card rounded-2xl border border-rose-500/10 bg-gradient-to-br from-rose-950/5 to-slate-900/60 p-5 h-full">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-rose-950/40 pb-2">
              <HeartPulse size={16} className="text-rose-500 animate-pulse" />
              Emergency Medical Record ID
            </h3>
            
            <p className="text-[10px] text-slate-400 leading-normal mb-5">
              Warning: This block contains critical parameters. If you trigger an SOS, this card is immediately shown on responders' mapping screens to aid diagnosis and triage.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                  <Droplet size={12} className="text-rose-500" />
                  Blood Group
                </label>
                {isEditing ? (
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs border-rose-900/20"
                  >
                    <option value="">Select blood type...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p className={`text-sm font-extrabold px-3 py-1 bg-rose-600/10 border border-rose-500/20 rounded inline-block ${bloodGroup ? 'text-rose-400' : 'text-slate-500'}`}>
                    {bloodGroup || 'Blood type not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block mb-1">Allergies</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    placeholder="e.g. Penicillin, Peanuts, Latex (or None)"
                  />
                ) : (
                  <div className={`p-3 rounded-lg text-xs font-semibold leading-relaxed border ${allergies ? 'bg-rose-950/20 border-rose-900/30 text-rose-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    {allergies || 'No allergies recorded.'}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block mb-1">Medical Conditions</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    placeholder="e.g. Asthma, Diabetes Type 2, Hypertension, Pacemaker"
                  />
                ) : (
                  <div className={`p-3 rounded-lg text-xs font-semibold leading-relaxed border ${medicalConditions ? 'bg-rose-950/20 border-rose-900/30 text-rose-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    {medicalConditions || 'No pre-existing conditions recorded.'}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block mb-1">Active Medications</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs"
                    placeholder="e.g. Albuterol inhaler, Metformin daily, Aspirin"
                  />
                ) : (
                  <div className={`p-3 rounded-lg text-xs font-semibold leading-relaxed border ${medications ? 'bg-rose-950/20 border-rose-900/30 text-rose-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    {medications || 'No current medications recorded.'}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block mb-1">Critical Responding Notes</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={emergencyNotes}
                    onChange={(e) => setEmergencyNotes(e.target.value)}
                    className="w-full glass-input py-2 px-3 rounded-lg text-xs border-rose-900/25"
                    placeholder="Any specific emergency instruction for volunteers or paramedics..."
                  />
                ) : (
                  <div className={`p-3 rounded-lg text-xs leading-relaxed border font-medium ${emergencyNotes ? 'bg-rose-900/10 border-rose-500/20 text-rose-300' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    {emergencyNotes || 'No specific emergency responder notes provided.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
