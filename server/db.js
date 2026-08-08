import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const isTest = process.env.NODE_ENV === 'test';

let supabase = null;
if (!isTest) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// In-Memory Database Simulator for testing mode
const store = {
  users: [],
  contacts: [],
  emergencies: [],
  chats: []
};

// Database interfaces
export const db = isTest ? {
  users: {
    find: async (query) => {
      return store.users.find(item => {
        return Object.entries(query).every(([key, val]) => item[key] === val);
      }) || null;
    },
    filter: async (query) => {
      return store.users.filter(item => {
        return Object.entries(query).every(([key, val]) => item[key] === val);
      });
    },
    save: async (user) => {
      store.users.push(user);
      return user;
    },
    update: async (uid, updates) => {
      const idx = store.users.findIndex(u => u.uid === uid);
      if (idx !== -1) {
        store.users[idx] = { ...store.users[idx], ...updates };
        return store.users[idx];
      }
      return null;
    },
    delete: async (uid) => {
      store.users = store.users.filter(u => u.uid !== uid);
    }
  },
  contacts: {
    getByUserId: async (userId) => {
      return store.contacts.filter(c => c.userId === userId);
    },
    add: async (contact) => {
      store.contacts.push(contact);
      return contact;
    },
    update: async (id, updates) => {
      const idx = store.contacts.findIndex(c => c.id === id);
      if (idx !== -1) {
        store.contacts[idx] = { ...store.contacts[idx], ...updates };
        return store.contacts[idx];
      }
      return null;
    },
    delete: async (id) => {
      store.contacts = store.contacts.filter(c => c.id !== id);
    },
    setPrimary: async (userId, primaryId) => {
      store.contacts = store.contacts.map(c => {
        if (c.userId === userId) {
          return { ...c, isPrimary: c.id === primaryId };
        }
        return c;
      });
      return store.contacts.find(c => c.id === primaryId) || null;
    }
  },
  emergencies: {
    getAll: async () => {
      return [...store.emergencies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    add: async (emergency) => {
      store.emergencies.push(emergency);
      return emergency;
    },
    update: async (id, updates) => {
      const idx = store.emergencies.findIndex(e => e.id === id);
      if (idx !== -1) {
        store.emergencies[idx] = { ...store.emergencies[idx], ...updates };
        return store.emergencies[idx];
      }
      return null;
    }
  },
  chats: {
    getByEmergencyId: async (emergencyId) => {
      return store.chats
        .filter(m => m.emergencyId === emergencyId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    add: async (message) => {
      store.chats.push(message);
      return message;
    }
  }
} : {
  users: {
    find: async (query) => {
      const { data, error } = await supabase.from('users').select('*').match(query).maybeSingle();
      if (error) throw error;
      return data;
    },
    filter: async (query) => {
      const { data, error } = await supabase.from('users').select('*').match(query);
      if (error) throw error;
      return data;
    },
    save: async (user) => {
      const { data, error } = await supabase.from('users').insert(user).select().single();
      if (error) throw error;
      return data;
    },
    update: async (uid, updates) => {
      const { data, error } = await supabase.from('users').update(updates).eq('uid', uid).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (uid) => {
      const { error } = await supabase.from('users').delete().eq('uid', uid);
      if (error) throw error;
    }
  },
  contacts: {
    getByUserId: async (userId) => {
      const { data, error } = await supabase.from('contacts').select('*').eq('userId', userId);
      if (error) throw error;
      return data;
    },
    add: async (contact) => {
      const { data, error } = await supabase.from('contacts').insert(contact).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    setPrimary: async (userId, primaryId) => {
      const { error: resetError } = await supabase.from('contacts').update({ isPrimary: false }).eq('userId', userId);
      if (resetError) throw resetError;
      const { data, error } = await supabase.from('contacts').update({ isPrimary: true }).eq('id', primaryId).select().single();
      if (error) throw error;
      return data;
    }
  },
  emergencies: {
    getAll: async () => {
      const { data, error } = await supabase.from('emergencies').select('*').order('createdAt', { ascending: false });
      if (error) throw error;
      return data;
    },
    add: async (emergency) => {
      const { data, error } = await supabase.from('emergencies').insert(emergency).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const { data, error } = await supabase.from('emergencies').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },
  chats: {
    getByEmergencyId: async (emergencyId) => {
      const { data, error } = await supabase.from('chats').select('*').eq('emergencyId', emergencyId).order('createdAt', { ascending: true });
      if (error) throw error;
      return data;
    },
    add: async (message) => {
      const { data, error } = await supabase.from('chats').insert(message).select().single();
      if (error) throw error;
      return data;
    }
  }
};

export async function seedMockUsers() {
  const defaultMockUsers = [
    { email: 'mock_citizen@sos.com', fullName: 'Jane Doe (Citizen)', phoneNumber: '555-0199', role: 'citizen', uid: 'mock_citizen_uid' },
    { email: 'mock_volunteer@sos.com', fullName: 'Officer John (Volunteer)', phoneNumber: '555-9111', role: 'volunteer', uid: 'mock_volunteer_uid' },
    { email: 'mock_admin@sos.com', fullName: 'Super Admin', phoneNumber: '555-0000', role: 'admin', uid: 'mock_admin_uid' }
  ];

  for (const du of defaultMockUsers) {
    const existing = await db.users.find({ email: du.email.toLowerCase() });
    if (!existing) {
      const passwordHash = bcrypt.hashSync('password123', 10);
      await db.users.save({
        uid: du.uid,
        email: du.email,
        fullName: du.fullName,
        phoneNumber: du.phoneNumber,
        role: du.role,
        profilePhoto: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(du.fullName)}`,
        passwordHash,
        isEmailVerified: true,
        gender: '',
        dob: '',
        bloodGroup: '',
        allergies: '',
        medicalConditions: '',
        medications: '',
        emergencyNotes: '',
        homeAddress: '',
        currentCity: 'New York City',
        latitude: du.role === 'volunteer' ? 40.7128 + (Math.random() - 0.5) * 0.05 : 40.7128,
        longitude: du.role === 'volunteer' ? -74.0060 + (Math.random() - 0.5) * 0.05 : -74.0060,
        rangeRadius: 3,
        isAvailable: true,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
      console.log(`[Database] Seeded mock user: ${du.email}`);
    }
  }
}

export async function connectDB() {
  if (isTest) {
    await seedMockUsers();
    return;
  }

  try {
    const { error } = await supabase.from('users').select('uid').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
    console.log('[Supabase] Connection verified successfully');
    await seedMockUsers();
  } catch (error) {
    console.warn('[Supabase] Warning: Database connection failed (run SQL schemas in Supabase console):', error.message);
  }
}

connectDB();
