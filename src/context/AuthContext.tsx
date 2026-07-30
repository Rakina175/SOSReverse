import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from '../firebase/config';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'citizen' | 'volunteer' | 'admin';
  profilePhoto: string;
  createdAt: string;
  lastActive: string;
  // Personal Info
  gender: string;
  dob: string;
  // Medical Info
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  emergencyNotes: string;
  // Location Info
  homeAddress: string;
  currentCity: string;
  // Responder Info
  latitude: number;
  longitude: number;
  rangeRadius: 1 | 3 | 5 | 10;
  isAvailable: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isFirebase: boolean;
  registerUser: (email: string, password: string, fullName: string, phoneNumber: string, role: 'citizen' | 'volunteer' | 'admin') => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Default profile generator
const createDefaultProfile = (uid: string, email: string, fullName: string, phoneNumber: string, role: 'citizen' | 'volunteer' | 'admin'): UserProfile => {
  // Generate a random avatar from dicebear or simple UI avatar
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`;
  
  // Simulated initial locations in NYC area
  // Citizen closer to Manhattan, Volunteer in Brooklyn, etc.
  const lat = role === 'volunteer' ? 40.7128 + (Math.random() - 0.5) * 0.05 : 40.7128;
  const lon = role === 'volunteer' ? -74.0060 + (Math.random() - 0.5) * 0.05 : -74.0060;

  return {
    uid,
    fullName,
    email,
    phoneNumber,
    role,
    profilePhoto: avatarUrl,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    gender: '',
    dob: '',
    bloodGroup: '',
    allergies: '',
    medicalConditions: '',
    medications: '',
    emergencyNotes: '',
    homeAddress: '',
    currentCity: 'New York City',
    latitude: lat,
    longitude: lon,
    rangeRadius: 3, // Default 3KM
    isAvailable: true,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync state between firebase and context
  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const data = userDoc.data() as UserProfile;
              setUser(data);
              // Update last active
              await updateDoc(userDocRef, {
                lastActive: new Date().toISOString()
              });
            } else {
              console.error('User doc not found in Firestore for UID:', firebaseUser.uid);
              setUser(null);
            }
          } catch (error) {
            console.error('Error fetching Firestore user profile:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Sandbox Mode: Load active session
      const storedUser = localStorage.getItem('sos_current_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      // Seed default mock users if not already present
      const mockUsers = JSON.parse(localStorage.getItem('sos_users') || '[]');
      const defaultUsers = [
        { email: 'mock_citizen@sos.com', password: 'password123', name: 'Jane Doe (Citizen)', phone: '555-0199', role: 'citizen' },
        { email: 'mock_volunteer@sos.com', password: 'password123', name: 'Officer John (Volunteer)', phone: '555-9111', role: 'volunteer' },
        { email: 'mock_admin@sos.com', password: 'password123', name: 'Super Admin', phone: '555-0000', role: 'admin' }
      ];
      const updatedUsers = [...mockUsers];
      let didUpdate = false;
      for (const du of defaultUsers) {
        if (!mockUsers.some((u: any) => u.email === du.email)) {
          const uid = 'mock_uid_' + Math.random().toString(36).substring(2, 11);
          const profile = createDefaultProfile(uid, du.email, du.name, du.phone, du.role as any);
          updatedUsers.push({ ...profile, password: du.password });
          didUpdate = true;
        }
      }
      if (didUpdate) {
        localStorage.setItem('sos_users', JSON.stringify(updatedUsers));
      }
      
      setLoading(false);
    }
  }, []);

  const registerUser = async (email: string, password: string, fullName: string, phoneNumber: string, role: 'citizen' | 'volunteer' | 'admin') => {
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth && db) {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credentials.user.uid;
        const profile = createDefaultProfile(uid, email, fullName, phoneNumber, role);
        
        await setDoc(doc(db, 'users', uid), {
          ...profile,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        });
        
        setUser(profile);
      } else {
        // Sandbox Simulation
        await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate delay
        
        const mockUsers = JSON.parse(localStorage.getItem('sos_users') || '[]');
        if (mockUsers.some((u: any) => u.email === email)) {
          throw new Error('Email already exists');
        }
        
        const uid = 'mock_uid_' + Math.random().toString(36).substr(2, 9);
        const profile = createDefaultProfile(uid, email, fullName, phoneNumber, role);
        
        mockUsers.push({ ...profile, password }); // Store password for mock login
        localStorage.setItem('sos_users', JSON.stringify(mockUsers));
        
        localStorage.setItem('sos_current_user', JSON.stringify(profile));
        setUser(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth && db) {
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', credentials.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          throw new Error('User profile record not found.');
        }
      } else {
        // Sandbox Simulation
        await new Promise((resolve) => setTimeout(resolve, 600));
        
        const mockUsers = JSON.parse(localStorage.getItem('sos_users') || '[]');
        const matched = mockUsers.find((u: any) => u.email === email && u.password === password);
        
        if (!matched) {
          throw new Error('Invalid email or password');
        }
        
        // Remove password before saving in current session state
        const { password: _, ...profile } = matched;
        const updatedProfile = { ...profile, lastActive: new Date().toISOString() };
        
        // Update lastActive in DB
        const updatedMockUsers = mockUsers.map((u: any) => 
          u.uid === profile.uid ? { ...u, lastActive: updatedProfile.lastActive } : u
        );
        localStorage.setItem('sos_users', JSON.stringify(updatedMockUsers));
        
        localStorage.setItem('sos_current_user', JSON.stringify(updatedProfile));
        setUser(updatedProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        await signOut(auth);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
        localStorage.removeItem('sos_current_user');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseEnabled && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const mockUsers = JSON.parse(localStorage.getItem('sos_users') || '[]');
      if (!mockUsers.some((u: any) => u.email === email)) {
        throw new Error('User with this email does not exist.');
      }
      console.log(`[Simulator] Password reset email link mocked to: ${email}`);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No user is currently authenticated');
    
    const updated = { ...user, ...data, lastActive: new Date().toISOString() };
    
    try {
      if (isFirebaseEnabled && db) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          ...data,
          lastActive: new Date().toISOString()
        });
        setUser(updated);
      } else {
        // Sandbox Simulation
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const mockUsers = JSON.parse(localStorage.getItem('sos_users') || '[]');
        const updatedMockUsers = mockUsers.map((u: any) => 
          u.uid === user.uid ? { ...u, ...data, lastActive: updated.lastActive } : u
        );
        
        localStorage.setItem('sos_users', JSON.stringify(updatedMockUsers));
        localStorage.setItem('sos_current_user', JSON.stringify(updated));
        setUser(updated);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isFirebase: isFirebaseEnabled,
      registerUser,
      loginUser,
      logoutUser,
      resetPassword,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
