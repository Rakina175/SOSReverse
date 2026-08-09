import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from '../firebase/config';
import { validateAndNormalizePhone } from '../utils/validation';
import { getApiUrl } from '../utils/api';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'citizen' | 'volunteer' | 'admin';
  profilePhoto: string;
  createdAt: string;
  lastActive: string;
  isEmailVerified: boolean;
  gender: string;
  dob: string;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  emergencyNotes: string;
  homeAddress: string;
  currentCity: string;
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
  loginUser: (identifier: string, password: string) => Promise<void>;
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

// Global access token for Authorization header
let globalAccessToken: string | null = null;

// Global callback for apiFetch to trigger logout on 401
let logoutUserCallback: (() => Promise<void>) | null = null;

// Centralized response parsing helper that prevents unexpected end of JSON input errors
export const safeParseJson = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || fallbackMessage);
      }
      return data;
    } catch (e: any) {
      if (e.message && e.message !== fallbackMessage) {
        throw e;
      }
      throw new Error(fallbackMessage, { cause: e });
    }
  }
  throw new Error(fallbackMessage);
};

// Centralized fetch wrapper to handle authorization headers & automatic token refresh
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  options.headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (globalAccessToken) {
    (options.headers as any)['Authorization'] = `Bearer ${globalAccessToken}`;
  }
  options.credentials = 'include';

  const resolvedUrl = getApiUrl(url);
  let response = await fetch(resolvedUrl, options);

  if (response.status === 401) {
    globalAccessToken = null;
    localStorage.removeItem('sos_current_user');
    if (logoutUserCallback) {
      logoutUserCallback().catch(err => console.error('Auto logout on 401 failed:', err));
    }
  } else if (response.status === 403) {
    const clone = response.clone();
    const contentType = clone.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await clone.json();
        if (data.code === 'TOKEN_EXPIRED') {
          const refreshResponse = await fetch(getApiUrl('/api/auth/refresh'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (refreshResponse.ok) {
            const refreshContentType = refreshResponse.headers.get('Content-Type');
            if (refreshContentType && refreshContentType.includes('application/json')) {
              const refreshData = await refreshResponse.json();
              globalAccessToken = refreshData.accessToken;
              
              (options.headers as any)['Authorization'] = `Bearer ${globalAccessToken}`;
              response = await fetch(resolvedUrl, options);
              
              if (response.status === 401) {
                globalAccessToken = null;
                localStorage.removeItem('sos_current_user');
                if (logoutUserCallback) {
                  logoutUserCallback().catch(err => console.error('Auto logout on 401 failed:', err));
                }
              }
            }
          } else {
            globalAccessToken = null;
            localStorage.removeItem('sos_current_user');
            if (logoutUserCallback) {
              logoutUserCallback().catch(err => console.error('Auto logout on refresh failure failed:', err));
            }
          }
        }
      } catch (err) {
        console.warn('Token refresh error during apiFetch:', err);
      }
    }
  }

  return response;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const userRef = useRef<UserProfile | null>(null);
  userRef.current = user;

  useEffect(() => {
    logoutUserCallback = logoutUser;
  });

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
              await updateDoc(userDocRef, {
                lastActive: new Date().toISOString()
              });
            } else {
              console.error('User doc not found in Firestore for UID:', firebaseUser.uid);
              try {
                await signOut(auth);
              } catch (_) {}
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
      // Backend auth check on initialization
      const initializeAuth = async () => {
        try {
          const refreshResponse = await fetch(getApiUrl('/api/auth/refresh'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (userRef.current) return;

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (userRef.current) return;
            globalAccessToken = refreshData.accessToken;

            const userRes = await fetch(getApiUrl('/api/auth/me'), {
              headers: { 'Authorization': `Bearer ${globalAccessToken}` }
            });

            if (userRef.current) return;

            if (userRes.ok) {
              const userData = await userRes.json();
              if (userRef.current) return;
              if (userData.isEmailVerified) {
                setUser(userData);
                localStorage.setItem('sos_current_user', JSON.stringify(userData));
              } else {
                setUser(null);
                localStorage.removeItem('sos_current_user');
              }
            } else {
              setUser(null);
              localStorage.removeItem('sos_current_user');
            }
          } else {
            // Server session is invalid or doesn't exist. Clear local storage.
            if (!userRef.current) {
              globalAccessToken = null;
              setUser(null);
              localStorage.removeItem('sos_current_user');
            }
          }
        } catch (e) {
          console.error('API Auth initialization failed:', e);
          if (!userRef.current) {
            setUser(null);
          }
        } finally {
          if (!userRef.current) {
            setLoading(false);
          }
        }
      };

      initializeAuth();
    }
  }, []);

  const registerUser = async (email: string, password: string, fullName: string, phoneNumber: string, role: 'citizen' | 'volunteer' | 'admin') => {
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth && db) {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credentials.user.uid;
        
        // Generate placeholder responder coordinates in NYC
        const lat = role === 'volunteer' ? 40.7128 + (Math.random() - 0.5) * 0.05 : 40.7128;
        const lon = role === 'volunteer' ? -74.0060 + (Math.random() - 0.5) * 0.05 : -74.0060;
        
        const profile: UserProfile = {
          uid,
          fullName,
          email,
          phoneNumber,
          role,
          profilePhoto: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          isEmailVerified: false,
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
          rangeRadius: 3,
          isAvailable: true
        };
        
        await setDoc(doc(db, 'users', uid), {
          ...profile,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        });
        
        setUser(profile);
      } else {
        // Backend secure API call
        const response = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName, phoneNumber, role }),
          credentials: 'include'
        });

        const data = await safeParseJson(response, 'Unable to connect to the registration service. Please try again.');

        // Clean register does not auto login since they need to verify email
        setUser(null);
        localStorage.removeItem('sos_current_user');
        globalAccessToken = null;

        return data;
      }
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (identifier: string, password: string) => {
    setLoading(true);
    // CRITICAL: Clear existing session before attempting a new login to prevent session state pollution on failure!
    setUser(null);
    localStorage.removeItem('sos_current_user');
    globalAccessToken = null;

    try {
      if (isFirebaseEnabled && auth && db) {
        let targetEmail = identifier;
        const phoneCheck = validateAndNormalizePhone(identifier);
        if (phoneCheck.isValid) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('phoneNumber', '==', phoneCheck.normalized));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            targetEmail = userDoc.data().email;
          } else {
            throw new Error('Mobile number is not registered.');
          }
        }
        const credentials = await signInWithEmailAndPassword(auth, targetEmail, password);
        const userDocRef = doc(db, 'users', credentials.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          try {
            await signOut(auth);
          } catch (_) {}
          throw new Error('User profile record not found.');
        }
      } else {
        // Backend secure API call
        const response = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
          credentials: 'include'
        });

        const data = await safeParseJson(response, 'Unable to connect to the authentication service. Please try again.');

        globalAccessToken = data.accessToken;
        setUser(data.user);
        localStorage.setItem('sos_current_user', JSON.stringify(data.user));
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
        await fetch(getApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        globalAccessToken = null;
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
      const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch reset email.');
      }
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No user is currently authenticated');
    
    try {
      if (isFirebaseEnabled && db) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          ...data,
          lastActive: new Date().toISOString()
        });
        setUser({ ...user, ...data, lastActive: new Date().toISOString() });
      } else {
        const response = await apiFetch('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(data)
        });

        const updatedUser = await response.json();
        if (!response.ok) {
          throw new Error(updatedUser.message || 'Failed to update profile');
        }

        setUser(updatedUser);
        localStorage.setItem('sos_current_user', JSON.stringify(updatedUser));
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
