import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Searching for users matching rahina175@gmail.com...');
  const { data: users, error: userError } = await supabase.from('users').select('*').ilike('email', 'rahina175@gmail.com');
  console.log('Users found in db:', users);
  if (userError) console.error('Query error:', userError);
  
  console.log('\nSearching for auth users matching rahina175@gmail.com...');
  const { data: authList, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Failed to list auth users:', authError);
  } else {
    const matched = authList.users.filter(u => u.email.toLowerCase().includes('rahina175'));
    console.log('Auth users found:', matched.map(u => ({ id: u.id, email: u.email })));
  }
}
run();
