import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const uid = '14cd5d02-f535-49fe-8743-73b4fbd6b005';
  
  console.log(`Executing: select * from users where uid = '${uid}'`);
  const { data: userByMatch, error: matchError } = await supabase
    .from('users')
    .select('*')
    .match({ uid })
    .maybeSingle();

  console.log('Result of match:', userByMatch);
  if (matchError) console.error('Match error:', matchError);

  console.log(`\nExecuting: select * from users where email = 'rakina175@gmail.com'`);
  const { data: userByEmail, error: emailError } = await supabase
    .from('users')
    .select('*')
    .match({ email: 'rakina175@gmail.com' })
    .maybeSingle();

  console.log('Result of email match:', userByEmail);
  if (emailError) console.error('Email match error:', emailError);
}
run();
