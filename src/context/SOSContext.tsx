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
import { useAuth } from './AuthContext';

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
    if (!user) {
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
      // Sandbox Simulator
      const loadLocalContacts = () => {
        const local = JSON.parse(localStorage.getItem('sos_contacts') || '[]');
        const filtered = local.filter((c: any) => c.userId === user.uid);
        setContacts(filtered);
      };
      
      loadLocalContacts();
      window.addEventListener('storage', loadLocalContacts);
      return () => window.removeEventListener('storage', loadLocalContacts);
    }
  }, [user]);

  // 2. Sync Emergencies (Global list for Volunteers/Admins, active check for citizens)
  useEffect(() => {
    if (isFirebaseEnabled && db) {
      // Fetch all non-resolved or resolved within 24h
      const q = query(collection(db, 'emergencies'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Emergency[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Emergency);
        });
        setEmergencies(list);

        // Find active emergency for logged-in citizen
        if (user) {
          const active = list.find(e => e.userId === user.uid && e.status !== 'Resolved');
          setActiveEmergency(active || null);
        }
      });
      return unsubscribe;
    } else {
      // Sandbox Simulator
      const loadLocalEmergencies = () => {
        const local = JSON.parse(localStorage.getItem('sos_emergencies') || '[]');
        setEmergencies(local);

        if (user) {
          const active = local.find((e: any) => e.userId === user.uid && e.status !== 'Resolved');
          setActiveEmergency(active || null);
        }
      };

      loadLocalEmergencies();
      const interval = setInterval(loadLocalEmergencies, 1500); // Polling backup for sandbox tabs
      return () => clearInterval(interval);
    }
  }, [user]);

  // 3. Sync Active Chat Messages
  useEffect(() => {
    const activeId = activeEmergency?.id || emergencies.find(e => (e.responderId === user?.uid || e.userId === user?.uid) && e.status !== 'Resolved')?.id;
    
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
      // Sandbox simulator
      const loadLocalMessages = () => {
        const local = JSON.parse(localStorage.getItem('sos_messages') || '[]');
        const filtered = local.filter((m: any) => m.emergencyId === activeId);
        setChatMessages(filtered.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      };

      loadLocalMessages();
      const interval = setInterval(loadLocalMessages, 1000);
      return () => clearInterval(interval);
    }
  }, [activeEmergency, emergencies, user]);

  // ----------------------------------------------------
  // Emergency Contacts Functions
  // ----------------------------------------------------
  const addContact = async (name: string, phoneNumber: string, relationship: string, alternateNumber: string) => {
    if (!user) return;
    const isFirst = contacts.length === 0;
    
    const contactData = {
      userId: user.uid,
      name,
      phoneNumber,
      relationship,
      alternateNumber,
      isPrimary: isFirst,
    };

    if (isFirebaseEnabled && db) {
      await addDoc(collection(db, 'contacts'), contactData);
    } else {
      const local = JSON.parse(localStorage.getItem('sos_contacts') || '[]');
      const newContact = { id: 'contact_' + Math.random().toString(36).substr(2, 9), ...contactData };
      local.push(newContact);
      localStorage.setItem('sos_contacts', JSON.stringify(local));
      // Dispatch event to refresh local listeners
      window.dispatchEvent(new Event('storage'));
    }
  };

  const editContact = async (id: string, name: string, phoneNumber: string, relationship: string, alternateNumber: string) => {
    if (isFirebaseEnabled && db) {
      const docRef = doc(db, 'contacts', id);
      await updateDoc(docRef, { name, phoneNumber, relationship, alternateNumber });
    } else {
      const local = JSON.parse(localStorage.getItem('sos_contacts') || '[]');
      const updated = local.map((c: any) => 
        c.id === id ? { ...c, name, phoneNumber, relationship, alternateNumber } : c
      );
      localStorage.setItem('sos_contacts', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const deleteContact = async (id: string) => {
    const contactToDelete = contacts.find(c => c.id === id);
    
    if (isFirebaseEnabled && db) {
      await deleteDoc(doc(db, 'contacts', id));
      
      // If we deleted the primary contact and have others left, assign a new primary
      if (contactToDelete?.isPrimary && contacts.length > 1) {
        const remaining = contacts.filter(c => c.id !== id);
        await updateDoc(doc(db, 'contacts', remaining[0].id), { isPrimary: true });
      }
    } else {
      const local = JSON.parse(localStorage.getItem('sos_contacts') || '[]');
      const filtered = local.filter((c: any) => c.id !== id);
      
      if (contactToDelete?.isPrimary && filtered.length > 0) {
        // Find first one matching user and mark primary
        const userContactIdx = filtered.findIndex((c: any) => c.userId === user?.uid);
        if (userContactIdx !== -1) {
          filtered[userContactIdx].isPrimary = true;
        }
      }
      
      localStorage.setItem('sos_contacts', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const setPrimaryContact = async (id: string) => {
    if (isFirebaseEnabled && db) {
      // Clear previous primary
      const updates = contacts.map(async (c) => {
        const ref = doc(db, 'contacts', c.id);
        return updateDoc(ref, { isPrimary: c.id === id });
      });
      await Promise.all(updates);
    } else {
      const local = JSON.parse(localStorage.getItem('sos_contacts') || '[]');
      const updated = local.map((c: any) => {
        if (c.userId === user?.uid) {
          return { ...c, isPrimary: c.id === id };
        }
        return c;
      });
      localStorage.setItem('sos_contacts', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // ----------------------------------------------------
  // SOS Incident Functions
  // ----------------------------------------------------
  const sendSOS = async (type: EmergencyType, description: string, latitude: number, longitude: number, address: string) => {
    if (!user) return;

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

    if (isFirebaseEnabled && db) {
      await addDoc(collection(db, 'emergencies'), sosData);
    } else {
      const local = JSON.parse(localStorage.getItem('sos_emergencies') || '[]');
      const newSOS = { id: 'sos_' + Math.random().toString(36).substr(2, 9), ...sosData };
      local.push(newSOS);
      localStorage.setItem('sos_emergencies', JSON.stringify(local));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const cancelSOS = async (id: string) => {
    if (isFirebaseEnabled && db) {
      await updateDoc(doc(db, 'emergencies', id), {
        status: 'Resolved',
        resolvedAt: new Date().toISOString()
      });
    } else {
      const local = JSON.parse(localStorage.getItem('sos_emergencies') || '[]');
      const updated = local.map((e: any) => 
        e.id === id ? { ...e, status: 'Resolved', resolvedAt: new Date().toISOString() } : e
      );
      localStorage.setItem('sos_emergencies', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const acceptEmergency = async (id: string) => {
    if (!user) return;

    // A volunteer responder accepts the emergency
    const updates = {
      status: 'Accepted' as EmergencyStatus,
      responderId: user.uid,
      responderName: user.fullName,
      // Initialize responder location slightly offset from the target for visual tracking route
      responderLatitude: user.latitude || 40.7128 + (Math.random() - 0.5) * 0.03,
      responderLongitude: user.longitude || -74.0060 + (Math.random() - 0.5) * 0.03,
    };

    if (isFirebaseEnabled && db) {
      await updateDoc(doc(db, 'emergencies', id), updates);
    } else {
      const local = JSON.parse(localStorage.getItem('sos_emergencies') || '[]');
      const updated = local.map((e: any) => 
        e.id === id ? { ...e, ...updates } : e
      );
      localStorage.setItem('sos_emergencies', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
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
      const local = JSON.parse(localStorage.getItem('sos_emergencies') || '[]');
      const updated = local.map((e: any) => 
        e.id === id ? { ...e, ...updates } : e
      );
      localStorage.setItem('sos_emergencies', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Chat message support
  const sendChatMessage = async (emergencyId: string, text: string) => {
    if (!user) return;

    const messageData = {
      emergencyId,
      senderId: user.uid,
      senderName: user.fullName,
      text,
      timestamp: new Date().toISOString()
    };

    if (isFirebaseEnabled && db) {
      await addDoc(collection(db, 'chats'), messageData);
    } else {
      const local = JSON.parse(localStorage.getItem('sos_messages') || '[]');
      const newMessage = { id: 'msg_' + Math.random().toString(36).substr(2, 9), ...messageData };
      local.push(newMessage);
      localStorage.setItem('sos_messages', JSON.stringify(local));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Responder live tracking GPS interpolation simulation loops
  const startTrackingSimulation = (emergencyId: string) => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

    simulationIntervalRef.current = setInterval(async () => {
      // Find current emergency
      let emergency: Emergency | undefined;
      
      if (isFirebaseEnabled && db) {
        const docRef = doc(db, 'emergencies', emergencyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          emergency = { id: docSnap.id, ...docSnap.data() } as Emergency;
        }
      } else {
        const local = JSON.parse(localStorage.getItem('sos_emergencies') || '[]');
        emergency = local.find((e: any) => e.id === emergencyId);
      }

      if (!emergency || !emergency.responderLatitude || !emergency.responderLongitude || emergency.status === 'Resolved') {
        stopTrackingSimulation();
        return;
      }

      const victimLat = emergency.latitude;
      const victimLon = emergency.longitude;
      const respLat = emergency.responderLatitude;
      const respLon = emergency.responderLongitude;

      // Distance checking
      const dist = calculateDistance(respLat, respLon, victimLat, victimLon);
      
      let nextStatus: EmergencyStatus = emergency.status;
      let nextLat = respLat;
      let nextLon = respLon;

      if (dist <= 0.05) {
        // Less than 50 meters, we have arrived
        nextStatus = 'Arrived';
        nextLat = victimLat;
        nextLon = victimLon;
        stopTrackingSimulation();
      } else {
        // Interpolate: step 25% closer to victim coordinates each loop iteration
        nextStatus = 'En Route';
        nextLat = respLat + (victimLat - respLat) * 0.22;
        nextLon = respLon + (victimLon - respLon) * 0.22;
      }

      // Update in db
      const updates = {
        responderLatitude: nextLat,
        responderLongitude: nextLon,
        status: nextStatus
      };

      if (isFirebaseEnabled && db) {
        await updateDoc(doc(db, 'emergencies', emergencyId), updates);
      } else {
        const local = JSON.parse(localStorage.getItem('sos_emergencies') || '[]');
        const updated = local.map((e: any) => 
          e.id === emergencyId ? { ...e, ...updates } : e
        );
        localStorage.setItem('sos_emergencies', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }

      // Auto mock message from responder on arrival
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

  // Clear tracking simulations on unmount
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
