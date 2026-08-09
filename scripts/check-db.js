import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing database credentials in .env file!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  console.log('Testing emergency insert with createdAt...');
  const testId = 'test_' + Date.now();
  const testSOS = {
    id: testId,
    userId: 'mock_citizen_uid',
    userName: 'Test Citizen',
    type: 'Other',
    description: 'Test Description',
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'Test Address',
    createdAt: new Date().toISOString(), // Using createdAt instead of timestamp!
    status: 'Pending',
    responderId: null,
    responderName: null,
    responderLatitude: null,
    responderLongitude: null,
    resolvedAt: null
  };

  try {
    const { data, error } = await supabase.from('emergencies').insert(testSOS).select();
    if (error) {
      console.error('Insert with createdAt failed:', error.message);
    } else {
      console.log('Insert with createdAt SUCCEEDED! Result:', data);
      
      // Clean up the test row
      console.log('Cleaning up test row...');
      const { error: delErr } = await supabase.from('emergencies').delete().eq('id', testId);
      if (delErr) console.error('Cleanup failed:', delErr.message);
      else console.log('Cleanup successful.');
    }
  } catch (err) {
    console.error('Insert query caught error:', err);
  }
}

async function testInsertWithTimestamp() {
  console.log('\nTesting emergency insert with timestamp...');
  const testId = 'test_' + Date.now();
  const testSOS = {
    id: testId,
    userId: 'mock_citizen_uid',
    userName: 'Test Citizen',
    type: 'Other',
    description: 'Test Description',
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'Test Address',
    timestamp: new Date().toISOString(), // Using timestamp instead of createdAt!
    status: 'Pending',
    responderId: null,
    responderName: null,
    responderLatitude: null,
    responderLongitude: null,
    resolvedAt: null
  };

  try {
    const { data, error } = await supabase.from('emergencies').insert(testSOS).select();
    if (error) {
      console.error('Insert with timestamp failed:', error.message);
    } else {
      console.log('Insert with timestamp SUCCEEDED! Result:', data);
      
      // Clean up the test row
      const { error: delErr } = await supabase.from('emergencies').delete().eq('id', testId);
      if (delErr) console.error('Cleanup failed:', delErr.message);
    }
  } catch (err) {
    console.error('Insert query caught error:', err);
  }
}

async function run() {
  await testInsert();
  await testInsertWithTimestamp();
}

run();
