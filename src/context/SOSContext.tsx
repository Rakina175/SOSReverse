import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  getDoc
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../firebase/config';
import { useAuth, apiFetch } from './AuthContext';

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  alternateNumber: string;
  isPrimary: boolean;
}

export type EmergencyType = 
  | 'Medical Emergency'
  | 'Road Accident'
  | 'Fire Emergency'
  | 'Crime / Theft'
  | 'Women Safety'
  | 'Natural Disaster'
  | 'Child Emergency'
  | 'Elderly Assistance'
  | 'Other';

export type EmergencyStatus = 'Pending' | 'Accepted' | 'En Route' | 'Arrived' | 'Resolved';

export interface Emergency {
  id: string;
  userId: string;
  userName: string;
  type: EmergencyType;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  status: EmergencyStatus;
  responderId: string | null;
  responderName: string | null;
  responderLatitude: number | null;
  responderLongitude: number | null;
  resolvedAt: string | null;
}

export interface ChatMessage {
  id: string;
  emergencyId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface SOSContextType {
  contacts: EmergencyContact[];
  emergencies: Emergency[];
  activeEmergency: Emergency | null;
  chatMessages: ChatMessage[];
  addContact: (name: string, phoneNumber: string, relationship: string, alternateNumber: string) => Promise<void>;
  editContact: (id: string, name: string, phoneNumber: string, relationship: string, alternateNumber: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  setPrimaryContact: (id: string) => Promise<void>;
  sendSOS: (type: EmergencyType, description: string, latitude: number, longitude: number, address: string) => Promise<void>;
  cancelSOS: (id: string) => Promise<void>;
  acceptEmergency: (id: string) => Promise<void>;
  updateEmergencyStatus: (id: string, status: EmergencyStatus) => Promise<void>;
  sendChatMessage: (emergencyId: string, text: string) => Promise<void>;
  startTrackingSimulation: (emergencyId: string) => void;
  stopTrackingSimulation: () => void;
  getDistanceKm: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export const useSOS = () => {
  const context = useContext(SOSContext);
  if (!context) throw new Error('useSOS must be used within an SOSProvider');
  return context;
};

// Haversine formula calculation helper
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of Earth in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  const simulationIntervalRef = useRef<any>(null);

  // 1. Sync Contacts
  useEffect(() => {
    if (!user || !user.isEmailVerified) {
      setContacts([]);
      return;
    }

    if (isFirebaseEnabled && db) {
      const q = query(collection(db, 'contacts'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: EmergencyContact[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as EmergencyContact);
        });
        setContacts(list);
      });
      return unsubscribe;
    } else {
      const loadContacts = async () => {
        try {
          const res = await apiFetch('/api/contacts');
          if (res.ok) {
            const list = await res.json();
            setContacts(list);
          }
        } catch (e) {
          console.error('Failed to load contacts:', e);
        }
      };
      
      loadContacts();
      const interval = setInterval(loadContacts, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 2. Sync Emergencies (Global list for Volunteers/Admins, active check for citizens)
  useEffect(() => {
    if (!user || !user.isEmailVerified) {
      setEmergencies([]);
      setActiveEmergency(null);
      return;
    }

    if (isFirebaseEnabled && db) {
      const q = query(collection(db, 'emergencies'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Emergency[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Emergency);
        });
        setEmergencies(list);

        const active = list.find(e => e.userId === user.uid && e.status !== 'Resolved');
        setActiveEmergency(active || null);
      });
      return unsubscribe;
    } else {
      const loadEmergencies = async () => {
        try {
          const res = await apiFetch('/api/emergencies');
          if (res.ok) {
            const list = await res.json();
            setEmergencies(list);

            const active = list.find((e: any) => e.userId === user.uid && e.status !== 'Resolved');
            setActiveEmergency(active || null);
          }
        } catch (e) {
          console.error('Failed to load emergencies:', e);
        }
      };

      loadEmergencies();
      const interval = setInterval(loadEmergencies, 1500);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 3. Sync Active Chat Messages
  useEffect(() => {
    if (!user || !user.isEmailVerified) {
      setChatMessages([]);
      return;
    }

    const activeId = activeEmergency?.id || emergencies.find(e => (e.responderId === user.uid || e.userId === user.uid) && e.status !== 'Resolved')?.id;
    
    if (!activeId) {
      setChatMessages([]);
      return;
    }

    if (isFirebaseEnabled && db) {
      const q = query(
        collection(db, 'chats'), 
        where('emergencyId', '==', activeId),
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        setChatMessages(list);
      });
      return unsubscribe;
    } else {
      const loadMessages = async () => {
        try {
          const res = await apiFetch(`/api/chats/${activeId}`);
          if (res.ok) {
            const list = await res.json();
            setChatMessages(list);
          }
        } catch (e) {
          console.error('Failed to load messages:', e);
        }
      };

      loadMessages();
      const interval = setInterval(loadMessages, 1000);
      return () => clearInterval(interval);
    }
  }, [activeEmergency, emergencies, user]);

  // ----------------------------------------------------
  // Emergency Contacts Functions
  // ----------------------------------------------------
  const addContact = async (name: string, phoneNumber: string, relationship: string, alternateNumber: string) => {
    if (!user) return;
    
    if (isFirebaseEnabled && db) {
      const isFirst = contacts.length === 0;
      const contactData = {
        userId: user.uid,
        name,
        phoneNumber,
        relationship,
        alternateNumber,
        isPrimary: isFirst,
      };
      await addDoc(collection(db, 'contacts'), contactData);
    } else {
      await apiFetch('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ name, phoneNumber, relationship, alternateNumber })
      });
    }
  };

  const editContact = async (id: string, name: string, phoneNumber: string, relationship: string, alternateNumber: string) => {
    if (isFirebaseEnabled && db) {
      const docRef = doc(db, 'contacts', id);
      await updateDoc(docRef, { name, phoneNumber, relationship, alternateNumber });
    } else {
      await apiFetch(`/api/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, phoneNumber, relationship, alternateNumber })
      });
    }
  };

  const deleteContact = async (id: string) => {
    if (isFirebaseEnabled && db) {
      const contactToDelete = contacts.find(c => c.id === id);
      await deleteDoc(doc(db, 'contacts', id));
      
      if (contactToDelete?.isPrimary && contacts.length > 1) {
        const remaining = contacts.filter(c => c.id !== id);
        await updateDoc(doc(db, 'contacts', remaining[0].id), { isPrimary: true });
      }
    } else {
      await apiFetch(`/api/contacts/${id}`, {
        method: 'DELETE'
      });
    }
  };

  const setPrimaryContact = async (id: string) => {
    if (isFirebaseEnabled && db) {
      const updates = contacts.map(async (c) => {
        const ref = doc(db, 'contacts', c.id);
        return updateDoc(ref, { isPrimary: c.id === id });
      });
      await Promise.all(updates);
    } else {
      await apiFetch(`/api/contacts/${id}/primary`, {
        method: 'POST'
      });
    }
  };

  // ----------------------------------------------------
  // SOS Functions
  // ----------------------------------------------------
  const sendSOS = async (type: EmergencyType, description: string, latitude: number, longitude: number, address: string) => {
    if (!user) return;
    
    if (isFirebaseEnabled && db) {
      const sosData = {
        userId: user.uid,
        userName: user.fullName,
        type,
        description,
        latitude,
        longitude,
        address,
        timestamp: new Date().toISOString(),
        status: 'Pending' as EmergencyStatus,
        responderId: null,
        responderName: null,
        responderLatitude: null,
        responderLongitude: null,
        resolvedAt: null
      };
      await addDoc(collection(db, 'emergencies'), sosData);
    } else {
      const res = await apiFetch('/api/emergencies', {
        method: 'POST',
        body: JSON.stringify({ type, description, latitude, longitude, address })
      });
      if (res.ok) {
        const newSOS = await res.json();
        setActiveEmergency(newSOS);
      }
    }
  };

  const cancelSOS = async (id: string) => {
    if (isFirebaseEnabled && db) {
      await updateDoc(doc(db, 'emergencies', id), {
        status: 'Resolved',
        resolvedAt: new Date().toISOString()
      });
    } else {
      await apiFetch(`/api/emergencies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Resolved', resolvedAt: new Date().toISOString() })
      });
    }
  };

  const acceptEmergency = async (id: string) => {
    if (!user) return;

    const updates = {
      status: 'Accepted' as EmergencyStatus,
      responderId: user.uid,
      responderName: user.fullName,
      responderLatitude: user.latitude || 40.7128 + (Math.random() - 0.5) * 0.03,
      responderLongitude: user.longitude || -74.0060 + (Math.random() - 0.5) * 0.03,
    };

    if (isFirebaseEnabled && db) {
      await updateDoc(doc(db, 'emergencies', id), updates);
    } else {
      await apiFetch(`/api/emergencies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    }
  };

  const updateEmergencyStatus = async (id: string, status: EmergencyStatus) => {
    const isResolved = status === 'Resolved';
    const updates: any = { status };
    if (isResolved) {
      updates.resolvedAt = new Date().toISOString();
    }

    if (isFirebaseEnabled && db) {
      await updateDoc(doc(db, 'emergencies', id), updates);
    } else {
      await apiFetch(`/api/emergencies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    }
  };

  const sendChatMessage = async (emergencyId: string, text: string) => {
    if (!user) return;

    if (isFirebaseEnabled && db) {
      const messageData = {
        emergencyId,
        senderId: user.uid,
        senderName: user.fullName,
        text,
        timestamp: new Date().toISOString()
      };
      await addDoc(collection(db, 'chats'), messageData);
    } else {
      await apiFetch('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ emergencyId, text })
      });
    }
  };

  // Responder live tracking GPS interpolation simulation loops
  const startTrackingSimulation = (emergencyId: string) => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

    simulationIntervalRef.current = setInterval(async () => {
      let emergency: Emergency | undefined;
      
      if (isFirebaseEnabled && db) {
        const docRef = doc(db, 'emergencies', emergencyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          emergency = { id: docSnap.id, ...docSnap.data() } as Emergency;
        }
      } else {
        const res = await apiFetch(`/api/emergencies`);
        if (res.ok) {
          const list = await res.json();
          emergency = list.find((e: any) => e.id === emergencyId);
        }
      }

      if (!emergency || !emergency.responderLatitude || !emergency.responderLongitude || emergency.status === 'Resolved') {
        stopTrackingSimulation();
        return;
      }

      const victimLat = emergency.latitude;
      const victimLon = emergency.longitude;
      const respLat = emergency.responderLatitude;
      const respLon = emergency.responderLongitude;

      const dist = calculateDistance(respLat, respLon, victimLat, victimLon);
      
      const nextStatus: EmergencyStatus = dist <= 0.05 ? 'Arrived' : 'En Route';
      const nextLat = dist <= 0.05 ? victimLat : respLat + (victimLat - respLat) * 0.22;
      const nextLon = dist <= 0.05 ? victimLon : respLon + (victimLon - respLon) * 0.22;

      if (dist <= 0.05) {
        stopTrackingSimulation();
      }

      const updates = {
        responderLatitude: nextLat,
        responderLongitude: nextLon,
        status: nextStatus
      };

      if (isFirebaseEnabled && db) {
        await updateDoc(doc(db, 'emergencies', emergencyId), updates);
      } else {
        await apiFetch(`/api/emergencies/${emergencyId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
      }

      if (nextStatus === 'Arrived') {
        sendChatMessage(emergencyId, "I have arrived at your location. Please let me know where you are or look out for me!");
      }
    }, 4000);
  };

  const stopTrackingSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  return (
    <SOSContext.Provider value={{
      contacts,
      emergencies,
      activeEmergency,
      chatMessages,
      addContact,
      editContact,
      deleteContact,
      setPrimaryContact,
      sendSOS,
      cancelSOS,
      acceptEmergency,
      updateEmergencyStatus,
      sendChatMessage,
      startTrackingSimulation,
      stopTrackingSimulation,
      getDistanceKm: calculateDistance
    }}>
      {children}
    </SOSContext.Provider>
  );
};
