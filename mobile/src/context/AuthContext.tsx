import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { validateAndNormalizePhone } from '../utils/validation';

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
  registerUser: (email: string, password: string, fullName: string, phoneNumber: string, role: 'citizen' | 'volunteer' | 'admin') => Promise<any>;
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

// Centralized response parsing helper
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
      throw new Error(fallbackMessage);
    }
  }
  throw new Error(fallbackMessage);
};

// Centralized fetch wrapper to handle authorization headers
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  options.headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (globalAccessToken) {
    (options.headers as any)['Authorization'] = `Bearer ${globalAccessToken}`;
  }

  let response = await fetch(url, options);

  if (response.status === 401) {
    globalAccessToken = null;
    await AsyncStorage.removeItem('sos_current_user');
    await AsyncStorage.removeItem('sos_access_token');
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
          const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            globalAccessToken = refreshData.accessToken;
            await AsyncStorage.setItem('sos_access_token', refreshData.accessToken);
            
            (options.headers as any)['Authorization'] = `Bearer ${globalAccessToken}`;
            response = await fetch(url, options);
          } else {
            globalAccessToken = null;
            await AsyncStorage.removeItem('sos_current_user');
            await AsyncStorage.removeItem('sos_access_token');
            if (logoutUserCallback) {
              logoutUserCallback().catch(err => console.error('Auto logout failed:', err));
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
    const initializeAuth = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('sos_current_user');
        const cachedToken = await AsyncStorage.getItem('sos_access_token');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
        if (cachedToken) {
          globalAccessToken = cachedToken;
        }

        if (cachedToken) {
          const userRes = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${cachedToken}` }
          });

          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.isEmailVerified) {
              setUser(userData);
              await AsyncStorage.setItem('sos_current_user', JSON.stringify(userData));
            } else {
              setUser(null);
              await AsyncStorage.removeItem('sos_current_user');
              await AsyncStorage.removeItem('sos_access_token');
            }
          } else if (userRes.status === 401 || userRes.status === 403) {
            // Try token refresh
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              globalAccessToken = refreshData.accessToken;
              await AsyncStorage.setItem('sos_access_token', refreshData.accessToken);
              const userRes2 = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${globalAccessToken}` }
              });
              if (userRes2.ok) {
                const userData2 = await userRes2.json();
                setUser(userData2);
                await AsyncStorage.setItem('sos_current_user', JSON.stringify(userData2));
              }
            } else {
              setUser(null);
              await AsyncStorage.removeItem('sos_current_user');
              await AsyncStorage.removeItem('sos_access_token');
            }
          }
        }
      } catch (e) {
        console.error('API Auth initialization failed:', e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const registerUser = async (email: string, password: string, fullName: string, phoneNumber: string, role: 'citizen' | 'volunteer' | 'admin') => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phoneNumber, role }),
      });

      const data = await safeParseJson(response, 'Unable to connect to registration. Please try again.');
      
      setUser(null);
      await AsyncStorage.removeItem('sos_current_user');
      await AsyncStorage.removeItem('sos_access_token');
      globalAccessToken = null;

      return data;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (identifier: string, password: string) => {
    setLoading(true);
    setUser(null);
    await AsyncStorage.removeItem('sos_current_user');
    await AsyncStorage.removeItem('sos_access_token');
    globalAccessToken = null;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await safeParseJson(response, 'Unable to connect to authentication. Please try again.');

      globalAccessToken = data.accessToken;
      setUser(data.user);
      await AsyncStorage.setItem('sos_current_user', JSON.stringify(data.user));
      await AsyncStorage.setItem('sos_access_token', data.accessToken);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.warn('Backend logout failed or offline:', e);
    } finally {
      globalAccessToken = null;
      await AsyncStorage.removeItem('sos_current_user');
      await AsyncStorage.removeItem('sos_access_token');
      setUser(null);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to dispatch reset email.');
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No user is currently authenticated');
    
    try {
      const response = await apiFetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      const updatedUser = await response.json();
      if (!response.ok) {
        throw new Error(updatedUser.message || 'Failed to update profile');
      }

      setUser(updatedUser);
      await AsyncStorage.setItem('sos_current_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isFirebase: false,
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
